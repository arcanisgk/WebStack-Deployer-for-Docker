const path = require('path');
const { spawn } = require('child_process');
const { app } = require('electron');

class BackendController {
    constructor() {
        this.goBackend = null;
        this.fetchModule = null;
    }


    /**
     * Initialize the fetch module
     */
    async initializeFetch() {
        this.fetchModule = await import('node-fetch');
    }

    async startGoBackend() {

        const isWindows = process.platform === 'win32';
        const projectRoot = path.join(__dirname, '..', '..', '..');
        const goExecutable = isWindows ? 'cli\\main.exe' : './cli/main';
        const execPath = path.join(projectRoot, goExecutable);

        const options = {
            cwd: path.join(projectRoot, 'cli'),
            stdio: 'pipe',
            windowsHide: false,
            env: {
                ...process.env,
                ELEVATED: 'true'
            }
        };


        try {
            this.goBackend = spawn(execPath, [], options);
            this._setupEventListeners();
            await this._waitForServerStart();
            await this._testServerConnection();
        } catch (error) {
            console.error('Error starting Go backend:', error);
            throw error;
        }
    }

    _setupEventListeners() {
        this.goBackend.stdout.on('data', (data) => {
            console.log('Go backend output:', data.toString().trim());
        });

        this.goBackend.stderr.on('data', (data) => {
            console.error('Go backend error:', data.toString().trim());
        });

        this.goBackend.on('error', (err) => {
            console.error('Failed to start Go backend:', err);
        });

        this.goBackend.on('exit', (code) => {
            console.log(`Go backend exited with code ${code}`);
            if (code !== 0) {
                app.quit();
            }
        });
    }

    async _waitForServerStart() {
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async _testServerConnection() {
        const maxRetries = 3;
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const fetch = this.fetchModule.default;
                const response = await fetch('http://localhost:8080/');
                const data = await response.json();
                console.log('Go backend server response:', data);
                return;
            } catch (error) {
                retries++;
                if (retries === maxRetries) {
                    throw new Error('Failed to connect to Go backend after multiple attempts');
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async executeCommand(cmd) {

        try {
            const fetch = this.fetchModule.default;
            const response = await fetch('http://localhost:8080/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command: cmd }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error executing command:', error);
            throw error;
        }
    }

    shutdown() {
        if (this.goBackend) {
            this.goBackend.kill('SIGTERM');
            this.goBackend = null;
        }
    }
}

module.exports = BackendController;
