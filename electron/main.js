const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    transparent: true,
    backgroundColor: '#00FFFFFF', // Transparent
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

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
