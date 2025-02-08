const path = require('path');
const fs = require('fs');

class AppConfig {
    static APP_NAME = 'WebStack-Deployer-for-Docker';

    constructor() {
        this.userDataPath = this._initializeUserDataPath();
        this._createRequiredDirectories();
    }

    _initializeUserDataPath() {
        switch (process.platform) {
            case 'win32':
                return path.join(process.env.APPDATA, AppConfig.APP_NAME);
            case 'darwin':
                return path.join(process.env.HOME, 'Library', 'Application Support', AppConfig.APP_NAME);
            case 'linux':
                return path.join(process.env.HOME, '.config', AppConfig.APP_NAME);
            default:
                return path.join(process.env.HOME, '.' + AppConfig.APP_NAME);
        }
    }

    _createRequiredDirectories() {
        const dirs = [
            this.userDataPath,
            path.join(this.userDataPath, 'structure'),
            path.join(this.userDataPath, 'script'),
            path.join(this.userDataPath, 'config'),
            path.join(this.userDataPath, 'backup'),
            path.join(this.userDataPath, 'updates'),
            path.join(this.userDataPath, 'logs')
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    getUserDataPath() {
        return this.userDataPath;
    }
}

module.exports = AppConfig;
