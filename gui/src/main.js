const {app} = require('electron');
const path = require("node:path");
const log = require('electron-log');
const AppConfig = require('./models/AppConfig');
const WindowManager = require('./views/WindowManager');
const IpcController = require('./controllers/IpcController');
const ApplicationSetup = require('./core/ApplicationSetup');
const DevToolsManager = require('./core/DevToolsManager');
const AppLifecycle = require('./core/AppLifecycle');
const AdminPrivilegesManager = require('./core/AdminPrivilegesManager');
const {validateGoExecutable} = require("./controllers/ExecutableValidator");

log.transports.file.level = 'debug';
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/main.log');

class Application {
    constructor() {
        this.setupLogging();
        this.appConfig = new AppConfig();
        this.windowManager = new WindowManager();
        this.mainWindow = null;
        this.ipcController = null;
    }

    setupLogging() {
        log.info('Application starting...', {
            version: app.getVersion(),
            platform: process.platform,
            arch: process.arch,
            electron: process.versions.electron,
            chrome: process.versions.chrome,
            node: process.versions.node
        });

        process.on('uncaughtException', (error) => {
            log.error('Uncaught Exception:', error);
        });

        process.on('unhandledRejection', (reason) => {
            log.error('Unhandled Rejection:', reason);
        });
    }

    async initialize() {
        try {
            log.info('Initializing application...');
            await AdminPrivilegesManager.ensureAdminPrivileges();
            log.info('Admin privileges checked');
            ApplicationSetup.configureCommandLineFlags();
            app.setPath('userData', this.appConfig.getUserDataPath());
            app.name = 'WebStack-Deployer-for-Docker';
            app.setAppUserModelId('com.webstack.deployer');

            if (process.platform === 'win32') {
                this._setupWindowsPlatformSpecifics();
            }

            await this.setupAppEvents();
            log.info('Command line flags configured');
            return this.ipcController;
        } catch (error) {
            log.error('Initialization error:', error);
            throw error;
        }
    }

    _setupWindowsPlatformSpecifics() {
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

    async setupAppEvents() {
        await app.whenReady();

        try {
            await validateGoExecutable();

            this.ipcController = new IpcController(
                this.windowManager,
                this.appConfig
            );

            this.mainWindow = await this.windowManager.createMainWindow();

            this.ipcController.setMainWindow(this.mainWindow);

            DevToolsManager.setupDevToolsHandlers(this.mainWindow);

            AppLifecycle.setupAppEventHandlers(this.windowManager);

            ApplicationSetup.setupProcessEventHandlers();

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