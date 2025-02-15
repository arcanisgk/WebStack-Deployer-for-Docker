const {app} = require('electron');
const path = require("node:path");
const AppConfig = require('./models/AppConfig');
const BackendController = require('./controllers/BackendController');
const WindowManager = require('./views/WindowManager');
const IpcController = require('./controllers/IpcController');
const ApplicationSetup = require('./core/ApplicationSetup');
const DevToolsManager = require('./core/DevToolsManager');
const AppLifecycle = require('./core/AppLifecycle');
const AdminPrivilegesManager = require('./core/AdminPrivilegesManager');


class Application {
    constructor() {
        this.appConfig = new AppConfig();
        this.backendController = new BackendController();
        this.windowManager = null;
        this.mainWindow = null;
        this.ipcController = null;
    }

    async initialize() {
        await AdminPrivilegesManager.ensureAdminPrivileges();

        ApplicationSetup.configureCommandLineFlags();
        app.setPath('userData', this.appConfig.getUserDataPath());

        app.name = 'WebStack-Deployer-for-Docker';
        app.setAppUserModelId('com.webstack.deployer');

        if (process.platform === 'win32') {
            app.setUserTasks([{
                program: process.execPath,
                arguments: '',
                iconPath: path.join(__dirname, 'assets/icons/icon.ico'),
                iconIndex: 0,
                title: 'WebStack Deployer for Docker',
                description: 'Launch WebStack Deployer for Docker'
            }]);
            app.setAsDefaultProtocolClient('webstack-deployer');
        }


        // Enable sandbox for all renderers
        //app.enableSandbox();

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
            //if (this.mainWindow) {
                this.ipcController = new IpcController(
                    this.windowManager,
                    this.backendController,
                    this.appConfig
                );
            //}
            this.mainWindow = await this.windowManager.createMainWindow();
            DevToolsManager.setupDevToolsHandlers(this.mainWindow);

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