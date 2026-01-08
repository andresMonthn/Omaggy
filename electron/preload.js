const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  /**
   * @param {boolean} enabled
   */
  toggleTransparency: (enabled) => ipcRenderer.send('toggle-transparency', enabled)
})
