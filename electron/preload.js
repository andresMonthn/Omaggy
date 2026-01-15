const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  /**
   * @param {boolean} enabled
   */
  toggleTransparency: (enabled) => ipcRenderer.send('toggle-transparency', enabled),
})

contextBridge.exposeInMainWorld('audio', {
  /**
   * @param {{ source?: 'mic' | 'system' } | undefined} config
   */
  start: (config) => ipcRenderer.invoke('audio:start', config),
  stop: () => ipcRenderer.invoke('audio:stop'),
  /**
   * @param {(text: string) => void} cb
   * @returns {() => void}
   */
  onTranscript: (cb) => {
    /**
     * @param {import('electron').IpcRendererEvent} _event
     * @param {string} t
     */
    const handler = (_event, t) => {
      cb(t)
    }
    ipcRenderer.on('stt:partial', handler)
    return () => {
      ipcRenderer.removeListener('stt:partial', handler)
    }
  },
})
