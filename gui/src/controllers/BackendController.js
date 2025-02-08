const path = require('path');
const { spawn } = require('child_process');

class BackendController {
    constructor() {
        this.goBackend = null;
        this.fetchModule = null;
    }

    async initializeFetch() {
        this.fetchModule = await import('node-fetch');
    }

    async startGoBackend() {
        const isWindows = process.platform === 'win32';
        const projectRoot = path.join(__dirname, '..', '..', '..');
        const goExecutable = isWindows ? 'cli\\main.exe' : './cli/main';
        const execPath = path.join(projectRoot, goExecutable);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.goBackend = spawn(execPath, [], {
                cwd: path.join(projectRoot, 'cli'),
                stdio: 'pipe'
            });

            this._setupEventListeners();
            await this._waitForServerStart();
            await this._testServerConnection();
        } catch (error) {
            console.error('Error starting Go backend:', error);
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
    }

    async _waitForServerStart() {
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async _testServerConnection() {
        try {
            const fetch = this.fetchModule.default;
            const response = await fetch('http://localhost:8080/');
            const data = await response.json();
            console.log('Go backend server response:', data);
        } catch (error) {
            console.error('Failed to connect to Go backend:', error);
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
            return { error: error.message };
        }
    }

    shutdown() {
        if (this.goBackend) {
            this.goBackend.kill();
        }
    }
}

module.exports = BackendController;
