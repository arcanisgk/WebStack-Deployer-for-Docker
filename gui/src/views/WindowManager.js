const { BrowserWindow } = require('electron');
const path = require('node:path');
const log = require('electron-log');

class WindowManager {
    constructor() {
        this.mainWindow = null;
    }

    async createMainWindow() {
        try {
            log.info('Creating main window...');
            this.mainWindow = new BrowserWindow({
                    width: 1200,
                    height: 800,
                    frame: false,
                    icon: path.join(__dirname, '../assets/icons', process.platform === 'win32' ? 'icon.ico' : 'icon.icns'),
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true,
                        webSecurity: true,
                        preload: path.join(__dirname, '../preload.js'),
                        //sandbox: true,
                        experimentalFeatures: false
                    }
                });
            const cspDirectives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:",
                "img-src 'self' data: https:",
                "font-src 'self' data: https:",
                "connect-src 'self' http://localhost:8080 ws://localhost:3000",
                "base-uri 'self'",
                "form-action 'self'",
                "worker-src 'self' blob:",
                "media-src 'self' blob: data:",
                "object-src 'none'"
            ].join('; ');
            this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
                callback({
                    responseHeaders: {
                        ...details.responseHeaders,
                        'Content-Security-Policy': [cspDirectives]
                    }
                });
            });
            this.mainWindow.maximize();
            await this.loadContent();
            log.info('Creating main Finish...');
            return new Promise((resolve) => {
                this.mainWindow.once('ready-to-show', () => {
                    resolve(this.mainWindow);
                });

                this.mainWindow.on('closed', () => {
                    this.mainWindow = null;
                });
            });
        } catch (error) {
            log.error('Error creating main window:', error);
            throw error;
        }
    }

    async loadContent() {
        const isDev = process.env.NODE_ENV === 'development';


        if (isDev) {
            await this.mainWindow.loadURL('http://localhost:3000');
        } else {
            const htmlPath = path.join(__dirname, '../index.html');
            await this.mainWindow.loadFile(htmlPath);
        }
    }

    getMainWindow() {
        return this.mainWindow;
    }
}

module.exports = WindowManager;
