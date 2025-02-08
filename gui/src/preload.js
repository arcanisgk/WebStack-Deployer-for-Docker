const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    executeCommand: async (cmd) => {
        return await ipcRenderer.invoke('execute-command', cmd);
    },
    openUserDataPath: () => {
        ipcRenderer.send('open-user-data-path');
    }
});