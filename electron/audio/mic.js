const { BrowserWindow, ipcMain } = require('electron')
const whisperStt = require('../stt/whisper')
const path = require('path')

/** @type {BrowserWindow | null} */
let captureWin = null
let running = false

function createCaptureWindow() {
  if (captureWin && !captureWin.isDestroyed()) return

  captureWin = new BrowserWindow({
    show: false, // Hidden window
    width: 100,
    height: 100,
    webPreferences: {
      preload: path.join(__dirname, 'capture', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false // Important to keep recording active in background
    }
  })

  captureWin.loadFile(path.join(__dirname, 'capture', 'index.html'))
  
  // Clean up on close
  captureWin.on('closed', () => {
    captureWin = null
    running = false
  })
}

// IPC Listeners (Singleton pattern for the module)
ipcMain.on('mic:chunk', (event, buffer) => {
  if (running) {
    whisperStt.send(buffer)
  }
})

ipcMain.on('mic:error', (event, err) => {
  console.error('Microphone capture error:', err)
  running = false
})

/**
 * @param {unknown} config
 */
function start(config) {
  if (!captureWin || captureWin.isDestroyed()) {
    createCaptureWindow()
  }

  if (!captureWin) return

  // Wait for window to load if needed, then start
  if (captureWin && captureWin.webContents.isLoading()) {
    captureWin.webContents.once('did-finish-load', () => {
      if (captureWin) captureWin.webContents.send('mic:start')
    })
  } else if (captureWin) {
    captureWin.webContents.send('mic:start')
  }
  
  running = true
}

function stop() {
  if (captureWin && !captureWin.isDestroyed()) {
    captureWin.webContents.send('mic:stop')
    // Optional: Close window to save resources if not needed immediately
    // captureWin.close() 
  }
  running = false
}

module.exports = {
  start,
  stop,
}
