const { app } = require('electron');

class ApplicationSetup {
    static configureCommandLineFlags() {
        app.commandLine.appendSwitch('disable-features', 'Autofill');
        app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication');
        app.commandLine.appendSwitch('enable-features', 'NetworkService');
        app.commandLine.appendSwitch('enable-features', 'NetworkServiceInProcess');
        app.commandLine.appendSwitch('disable-autofill');
    }

    static setupProcessEventHandlers(backendController) {
        process.on('exit', () => {
            backendController.shutdown();
        });

        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            backendController.shutdown();
            app.quit();
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            backendController.shutdown();
            app.quit();
        });
    }
}

module.exports = ApplicationSetup;