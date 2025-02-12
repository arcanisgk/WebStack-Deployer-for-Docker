const { ipcMain } = require('electron');
const { shell } = require('electron');

class IpcController {
    constructor(windowManager, backendController, appConfig) {
        this.mainWindow = windowManager.getMainWindow();
        this.backendController = backendController;
        this.appConfig = appConfig;
        this.setupHandlers();
    }

    setupHandlers() {

        ipcMain.on('window-control', (event, command) => {
            if (!this.mainWindow) {
                console.error('[IPC] No main window reference');
                return;
            }

            switch (command) {
                case 'minimize':
                    this.mainWindow.minimize();
                    break;
                case 'maximize':
                    if (this.mainWindow.isMaximized()) {
                        this.mainWindow.unmaximize();
                    } else {
                        this.mainWindow.maximize();
                    }
                    break;
                case 'close':
                    this.mainWindow.close();
                    break;
                default:
                    console.error(`[IPC] Unknown window command: ${command}`);
            }
        });

        ipcMain.on('open-settings', () => {
            // Implement settings window logic
            console.log('Settings requested');
        });

        ipcMain.on('open-help', () => {
            // Implement help window logic
            console.log('Help requested');
        });

        ipcMain.on('open-about', () => {
            // Implement about window logic
            console.log('About requested');
        });

        // Maintenance handlers
        ipcMain.on('maintenance', (event, action) => {
            switch(action) {
                case 'check-updates':
                    console.log('Checking for updates...');
                    break;
                case 'backup-settings':
                    console.log('Backing up settings...');
                    break;
                case 'clear-cache':
                    console.log('Clearing cache...');
                    break;
                case 'reset-preferences':
                    console.log('Resetting preferences...');
                    break;
                case 'exit':
                    this.mainWindow.close();
                    break;
                default:
                    console.error(`Unknown maintenance action: ${action}`);
            }
        });

        ipcMain.handle('open-user-data-path', () => {
            shell.openPath(this.appConfig.getUserDataPath())
                .then(result => console.log('Opened user data path:', result))
                .catch(err => console.error('Error opening user data path:', err));
        });

        // Command execution handler
        ipcMain.handle('execute-command', async (event, cmd) => {
            return await this.backendController.executeCommand(cmd);
        });
    }
}

module.exports = IpcController;


