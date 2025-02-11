class DevToolsManager {
    static setupDevToolsHandlers(mainWindow) {
        if (process.env.NODE_ENV !== 'production') {
            DevToolsManager._setupBeforeSendHeaders(mainWindow);
            DevToolsManager._setupHeadersReceived(mainWindow);
            mainWindow.webContents.openDevTools();
        }
    }

    static _setupBeforeSendHeaders(mainWindow) {
        mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
            {urls: ['devtools://*/*']},
            (details, callback) => {
                const headers = {
                    ...details.requestHeaders,
                    'Accept': '*/*'
                };

                if (details.url.endsWith('.js')) {
                    headers['Content-Type'] = 'application/javascript';
                } else if (details.url.endsWith('.css')) {
                    headers['Content-Type'] = 'text/css';
                }

                callback({ requestHeaders: headers });
            }
        );
    }

    static _setupHeadersReceived(mainWindow) {
        mainWindow.webContents.session.webRequest.onHeadersReceived(
            {urls: ['devtools://*/*']},
            (details, callback) => {
                const headers = {
                    ...details.responseHeaders,
                    'Access-Control-Allow-Origin': ['*']
                };

                if (details.url.endsWith('.js')) {
                    headers['Content-Type'] = ['application/javascript'];
                } else if (details.url.endsWith('.css')) {
                    headers['Content-Type'] = ['text/css'];
                }

                callback({ responseHeaders: headers });
            }
        );
    }
}

module.exports = DevToolsManager;