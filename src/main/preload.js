// Preload script - runs before the renderer page loads
// Creates a safe bridge between the main process (Node.js) and renderer (browser)
// Reference: https://www.electronjs.org/docs/latest/tutorial/tutorial-preload

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: function () {
    return ipcRenderer.invoke('get-config');
  },
  onToggleRecording: function (callback) {
    ipcRenderer.on('toggle-recording', callback);
  }
});
