const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        const validChannels = [
            'window-control',
            'open-settings',
            'open-help',
            'open-about',
            'maintenance'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    executeCommand: async (cmd) => {
        return await ipcRenderer.invoke('execute-command', cmd);
    },
    openUserDataPath: () => {
        ipcRenderer.send('open-user-data-path');
    }
});
