const { ipcMain } = require('electron');
const { shell } = require('electron');
const AdminPrivilegesManager = require('../core/AdminPrivilegesManager');

class IpcController {
    constructor(windowManager, backendController, appConfig) {
        this.windowManager  = windowManager;
        this.backendController = backendController;
        this.appConfig = appConfig;
        this.setupHandlers();
    }

    setMainWindow(window) {
        this.windowManager.mainWindow = window;
    }

    setupHandlers() {

        this._setupWindowControls();
        this._setupApplicationHandlers();
        this._setupMaintenanceHandlers();
        this._setupAdminHandlers();

    }

    /**
     * Sets up window control handlers
     * @private
     */
    _setupWindowControls() {
        ipcMain.on('window-control', (event, command) => {
            const mainWindow = this.windowManager.getMainWindow();
            if (!mainWindow) {
                console.error('[IPC] No main window reference');
                return;
            }

            switch (command) {
                case 'minimize':
                    mainWindow.minimize();
                    break;
                case 'maximize':
                    if (mainWindow.isMaximized()) {
                        mainWindow.unmaximize();
                    } else {
                        mainWindow.maximize();
                    }
                    break;
                case 'close':
                    mainWindow.close();
                    break;
                default:
                    console.error(`[IPC] Unknown window command: ${command}`);
            }
        });
    }

    /**
     * Sets up application-specific handlers
     * @private
     */
    _setupApplicationHandlers() {
        ipcMain.on('open-settings', () => {
            console.log('Settings requested');
        });

        ipcMain.on('open-help', () => {
            console.log('Help requested');
        });

        ipcMain.on('open-about', () => {
            console.log('About requested');
        });

        ipcMain.handle('open-user-data-path', () => {
            return shell.openPath(this.appConfig.getUserDataPath());
        });

        ipcMain.handle('execute-command', async (event, cmd) => {
            return await this.backendController.executeCommand(cmd);
        });
    }

    /**
     * Sets up maintenance-related handlers
     * @private
     */
    _setupMaintenanceHandlers() {
        ipcMain.on('maintenance', (event, action) => {
            const mainWindow = this.windowManager.getMainWindow();
            if (!mainWindow) {
                console.error('[IPC] No main window reference');
                return;
            }

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
                    mainWindow.close();
                    break;
                default:
                    console.error(`Unknown maintenance action: ${action}`);
            }
        });
    }

    /**
     * Sets up admin privilege handlers
     * @private
     */
    _setupAdminHandlers() {
        ipcMain.handle('check-admin-rights', async () => {
            try {
                return await AdminPrivilegesManager.isRunningAsAdmin();
            } catch (error) {
                console.error('Error checking admin rights:', error);
                return false;
            }
        });
    }
}

module.exports = IpcController;


