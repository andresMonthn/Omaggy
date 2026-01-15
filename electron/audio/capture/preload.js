const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('micAPI', {
    /** @param {() => void} callback */
    onStart: (callback) => ipcRenderer.on('mic:start', callback),
    /** @param {() => void} callback */
    onStop: (callback) => ipcRenderer.on('mic:stop', callback),
    /** @param {ArrayBuffer} chunk */
    sendChunk: (chunk) => ipcRenderer.send('mic:chunk', chunk),
    /** @param {string} error */
    sendError: (error) => ipcRenderer.send('mic:error', error)
})
