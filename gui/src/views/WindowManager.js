const { BrowserWindow } = require('electron');
const path = require('node:path');
const SecurityPolicies = require('../security/SecurityPolicies');

class WindowManager {
    constructor() {
        this.mainWindow = null;
    }

    createMainWindow() {
        return new Promise((resolve) => {
            this.mainWindow = new BrowserWindow({
                width: 1200,
                height: 800,
                frame: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    enableRemoteModule: false,
                    webSecurity: true,
                    preload: path.join(__dirname, '../preload.js'),
                }
            });

            // Initialize security policies
            this.securityPolicies = SecurityPolicies.initSecurity(this.mainWindow);

            this.mainWindow.maximize();

            this.loadContent();

            this.mainWindow.once('ready-to-show', () => {
                resolve(this.getMainWindow());
            });

            this.mainWindow.on('closed', () => {
                this.mainWindow = null;
            });

        });

    }

    loadContent() {
        const isDev = process.env.NODE_ENV === 'development';

        if (isDev) {
            this.mainWindow.loadURL('http://localhost:3000')
                .then(() => this.mainWindow.webContents.openDevTools())
                .catch(err => console.error('Failed to load dev server:', err));
        } else {
            this.mainWindow.loadFile(path.join(__dirname, '../index.html'))
                .catch(err => console.error('Failed to load index.html:', err));
        }
    }

    getMainWindow() {
        return this.mainWindow;
    }
}

module.exports = WindowManager;
