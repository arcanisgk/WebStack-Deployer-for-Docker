const { app, BrowserWindow } = require('electron');

class AppLifecycle {
    static setupAppEventHandlers(windowManager, backendController) {
        app.on('activate', async () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                await windowManager.createMainWindow();
            }
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
            backendController.shutdown();
        });
    }
}

module.exports = AppLifecycle;
