const { contextBridge, ipcRenderer } = require('electron');

const validChannels = new Set([
    'window-control',
    'open-settings',
    'open-help',
    'open-about',
    'maintenance',
    'execute-command',
    'open-user-data-path',
    'refresh-security-nonce'
]);

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        if (validChannels.has(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    executeCommand: async (cmd) => {
        if (typeof cmd === 'string') {
            return await ipcRenderer.invoke('execute-command', cmd);
        }
        throw new Error('Invalid command format');
    },
    openUserDataPath: () => {
        ipcRenderer.send('open-user-data-path');
    }
});
