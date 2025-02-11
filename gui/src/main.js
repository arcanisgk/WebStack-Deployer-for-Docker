const {app} = require('electron');
const AppConfig = require('./models/AppConfig');
const BackendController = require('./controllers/BackendController');
const WindowManager = require('./views/WindowManager');
const IpcController = require('./controllers/IpcController');
const ApplicationSetup = require('./core/ApplicationSetup');
const DevToolsManager = require('./core/DevToolsManager');
const AppLifecycle = require('./core/AppLifecycle');

class Application {
    constructor() {
        this.appConfig = new AppConfig();
        this.backendController = new BackendController();
        this.windowManager = null;
        this.mainWindow = null;
        this.ipcController = null;
    }

    async initialize() {
        ApplicationSetup.configureCommandLineFlags();
        app.setPath('userData', this.appConfig.getUserDataPath());

        try {
            await this.backendController.initializeFetch();
            await this.setupAppEvents();
            return this.ipcController;
        } catch (error) {
            console.error('Initialization error:', error);
            throw error;
        }
    }

    async setupAppEvents() {
        await app.whenReady();

        try {
            await this.backendController.startGoBackend();

            this.windowManager = new WindowManager();
            this.mainWindow = await this.windowManager.createMainWindow();

            if (this.mainWindow) {
                this.ipcController = new IpcController(
                    this.mainWindow,
                    this.backendController,
                    this.appConfig
                );

                DevToolsManager.setupDevToolsHandlers(this.mainWindow);
            }

            AppLifecycle.setupAppEventHandlers(this.windowManager, this.backendController);
            ApplicationSetup.setupProcessEventHandlers(this.backendController);

        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    }
}

const application = new Application();
application.initialize().catch(err => {
    console.error('Application initialization failed:', err);
    app.quit();
});

module.exports = application;