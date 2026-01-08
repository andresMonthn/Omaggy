const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

function createWindow () {
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

  const loadURL = async () => {
    try {
      await win.loadURL('http://localhost:3000')
    } catch (e) {
      console.log('Waiting for localhost:3000...')
      setTimeout(loadURL, 1000)
    }
  }

  loadURL()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
