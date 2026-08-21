const { ipcRenderer, contextBridge } = require('electron');

// Expose direct window controls and IPC API
window.ipcRenderer = ipcRenderer;
window.electron = { ipcRenderer };

window.CoffeeNativeBridge = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
};
