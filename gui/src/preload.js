const { contextBridge, ipcRenderer } = require('electron');

const validChannels = new Set([
    'window-control',
    'open-settings',
    'open-help',
    'open-about',
    'maintenance',
    'execute-command',
    'open-user-data-path',
    'refresh-security-nonce',
    'check-admin-rights'
]);


contextBridge.exposeInMainWorld('electronAPI', {
    invoke: async (channel, data) => {
        if (validChannels.has(channel)) {
            return await ipcRenderer.invoke(channel, data);
        }
        throw new Error(`Invalid channel: ${channel}`);
    },
    send: (channel, data) => {
        if (validChannels.has(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        if (validChannels.has(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});