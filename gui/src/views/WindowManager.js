const { BrowserWindow, Menu } = require('electron');
const path = require('path');

class WindowManager {
    constructor() {
        this.mainWindow = null;
    }

    createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        this._setupMenu();
        this._loadContent();
        this._setupStatusBar();
        this._setupWindowEvents();
    }

    _setupMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    { role: 'quit' }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    _loadContent() {
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

    _setupStatusBar() {

        /*
        this.mainWindow.webContents.on('did-finish-load', () => {
            this._injectStatusBarStyles();
            this._injectStatusBarHTML();
        });
        */
    }

    _injectStatusBarStyles() {
        const css = `
            .status-bar {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 25px;
                background-color: #e8e8e8;
                border-top: 1px solid #c1c1c1;
                display: flex;
                align-items: center;
                padding: 0 10px;
                font-family: system-ui;
                -webkit-app-region: no-drag;
                z-index: 1000;
            }
            .status-bar-item {
                margin-right: 15px;
                cursor: pointer;
                color: #2c2c2c;
                display: flex;
                align-items: center;
            }
            .status-bar-item:hover {
                background-color: #d0d0d0;
                border-radius: 3px;
                padding: 2px 4px;
            }
        `;
        this.mainWindow.webContents.insertCSS(css).then(r => console.log('CSS injected:', r));
    }

    _injectStatusBarHTML() {
        const js = `
            const statusBar = document.createElement('div');
            statusBar.className = 'status-bar';
            
            const folderIcon = document.createElement('div');
            folderIcon.className = 'status-bar-item';
            folderIcon.innerHTML = '📁';
            folderIcon.onclick = () => {
                window.electron.openUserDataPath();
            };
            
            statusBar.appendChild(folderIcon);
            document.body.appendChild(statusBar);
        `;
        this.mainWindow.webContents.executeJavaScript(js).then(r => console.log('JS injected:', r));
    }

    _setupWindowEvents() {
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    getMainWindow() {
        return this.mainWindow;
    }
}

module.exports = WindowManager;
