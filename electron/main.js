const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')
const audioRouter = require('./audio/router')
const whisperStt = require('./stt/whisper')

function createWindow ({ testHtml = false } = {}) {
  const useTestHtml = testHtml
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    transparent: true,
    frame: false, // Required false for real transparency. Cannot be toggled dynamically on Windows without recreating window.
    resizable: true, // Allow resizing
    hasShadow: false, // Optional: removes window shadow for cleaner transparency
    backgroundColor: '#00FFFFFF', // Transparent
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Enable content protection to hide window from screen capture/sharing
  win.setContentProtection(true)

  whisperStt.init({
    onTranscript: (text) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('stt:partial', text)
      }
    },
  })

  // Handle transparency toggle from renderer
  ipcMain.on('toggle-transparency', (event, isTransparent) => {
    if (win && !win.isDestroyed()) {
      if (isTransparent) {
        win.setAlwaysOnTop(true);
        win.setHasShadow(false);
        // En modo transparente, a veces es útil ignorar eventos de ratón en zonas transparentes
        // pero aquí mantenemos interacción.
      } else {
        win.setAlwaysOnTop(false);
        win.setHasShadow(true);
      }
      // Aseguramos que sea redimensionable en ambos estados
      win.setResizable(true);
    }
  });

  ipcMain.handle('audio:start', (_, config) => {
    audioRouter.start(config)
  })

  ipcMain.handle('audio:stop', () => {
    audioRouter.stop()
  })

  const loadURL = async () => {
    if (useTestHtml) {
      await win.loadURL('data:text/html;charset=utf-8,<html><body><h1>Omaggy STT UI Test</h1></body></html>')
      return
    }
    try {
      await win.loadURL('http://localhost:3000')
    } catch (e) {
      console.log('Waiting for localhost:3000...')
      setTimeout(loadURL, 1000)
    }
  }

  loadURL()

  return win
}

app.whenReady().then(() => {
  try {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === 'media' || permission === 'display-capture' || permission === 'fullscreen') {
        callback(true)
        return
      }
      callback(false)
    })
  } catch {}

  const isAudioTest = process.env.OMAGGY_AUDIO_TEST === '1'
  const isSttUiTest = process.env.OMAGGY_STT_UI_TEST === '1'

  const win = createWindow({ testHtml: isSttUiTest })

  if (isAudioTest) {
    win.webContents.once('did-finish-load', () => {
      win.webContents
        .executeJavaScript('typeof window.audio')
        .then((type) => {
          // eslint-disable-next-line no-console
          console.log('[AudioTest] window.audio type:', type)
          if (type === 'object') {
            app.exit(0)
          } else {
            app.exit(2)
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[AudioTest] error:', err && err.message ? err.message : String(err))
          app.exit(1)
        })
    })
  }

  if (isSttUiTest) {
    win.webContents.once('did-finish-load', () => {
      win.webContents
        .executeJavaScript(`
          new Promise((resolve) => {
            if (!window.audio || typeof window.audio.onTranscript !== 'function') {
              resolve({ status: 'NO_AUDIO' });
              return;
            }
            window.__sttUiTestValue = null;
            window.audio.onTranscript((t) => {
              window.__sttUiTestValue = t;
            });
            resolve({ status: 'READY' });
          });
        `)
        .then((res) => {
          if (!res || res.status !== 'READY') {
            console.error('[SttUiTest] audio bridge not ready')
            app.exit(2)
            return
          }
          win.webContents.send('stt:partial', 'PRUEBA_STT_UI')
          setTimeout(() => {
            win.webContents
              .executeJavaScript('window.__sttUiTestValue || ""')
              .then((val) => {
                console.log('[SttUiTest] value:', val)
                if (val === 'PRUEBA_STT_UI') {
                  app.exit(0)
                } else {
                  app.exit(3)
                }
              })
              .catch((err) => {
                console.error(
                  '[SttUiTest] error:',
                  err && err.message ? err.message : String(err),
                )
                app.exit(4)
              })
          }, 300)
        })
        .catch((err) => {
          console.error(
            '[SttUiTest] error:',
            err && err.message ? err.message : String(err),
          )
          app.exit(5)
        })
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.on('mic:error', (_event, err) => {
  const win = BrowserWindow.getAllWindows()[0]
  if (win && !win.isDestroyed()) {
    win.webContents.send('stt:error', typeof err === 'string' ? err : String(err))
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
