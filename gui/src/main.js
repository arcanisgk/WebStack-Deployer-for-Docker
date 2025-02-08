const { app,BrowserWindow  } = require('electron');
const { shell } = require('electron');
const AppConfig = require('./models/AppConfig');
const BackendController = require('./controllers/BackendController');
const WindowManager = require('./views/WindowManager');
const { ipcMain } = require('electron');

class Application {
    constructor() {
        this.appConfig = new AppConfig();
        this.backendController = new BackendController();
        this.windowManager = new WindowManager();
    }

    async initialize() {
        app.setPath('userData', this.appConfig.getUserDataPath());
        await this.backendController.initializeFetch();
        this._setupIpcHandlers();
        this._setupAppEvents();
    }

    _setupIpcHandlers() {
        ipcMain.handle('execute-command', async (event, cmd) => {
            return await this.backendController.executeCommand(cmd);
        });

        ipcMain.on('open-user-data-path', () => {
            shell.openPath(this.appConfig.getUserDataPath())
                .then(() => console.log("open path via shell!!!"));
        });
    }

    _setupAppEvents() {
        app.whenReady().then(async () => {
            await this.backendController.startGoBackend();
            this.windowManager.createMainWindow();

            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.windowManager.createMainWindow();
                }
            });
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
            this.backendController.shutdown();
        });

        process.on('exit', () => {
            this.backendController.shutdown();
        });
    }
}

const application = new Application();
application.initialize().then(() => console.log("Application initialized"));