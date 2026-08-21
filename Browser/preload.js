const { ipcRenderer } = require('electron');

// Expose direct window controls and IPC API
window.ipcRenderer = ipcRenderer;
window.electron = { ipcRenderer };

window.CoffeeNativeBridge = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
};

window.CoffeeApp = {
  minimizeWindow: () => {
    try {
      ipcRenderer.send('window-minimize');
    } catch(e) {}
  },
  maximizeWindow: () => {
    try {
      ipcRenderer.send('window-maximize');
    } catch(e) {}
  },
  closeWindow: () => {
    try {
      ipcRenderer.send('window-close');
    } catch(e) {
      window.close();
    }
  }
};
