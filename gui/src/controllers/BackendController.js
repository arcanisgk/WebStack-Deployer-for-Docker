const path = require('path');
const { spawn } = require('child_process');
const { app } = require('electron');
const log = require('electron-log');
const fs = require('fs');

class BackendController {

    constructor() {

        this.goBackend = null;
        this.fetchModule = null;
        this.serverPort = 8080;
        this.isServerStarting = false;
        this.maxStartupTime = 60000; // 60 seconds maximum startup time
        this.serverStarted = false;
        this.isShuttingDown = false;

    }

    async initializeFetch() {
        try {
            this.fetchModule = await import('node-fetch');
            log.info('Fetch module initialized successfully');
        } catch (error) {
            log.error('Failed to initialize fetch module:', error);
            throw error;
        }
    }

    async startGoBackend() {
        if (this.isServerStarting) {
            log.warn('Backend startup already in progress');
            return;
        }

        this.isServerStarting = true;
        const isWindows = process.platform === 'win32';
        const projectRoot = path.join(__dirname, '..', '..', '..');
        const goExecutable = isWindows ? 'cli\\main.exe' : './cli/main';
        const execPath = path.join(projectRoot, goExecutable);

        // Verify executable exists
        if (!fs.existsSync(execPath)) {
            log.error(`Backend executable not found at: ${execPath}`);
            throw new Error('Backend executable not found');
        }

        log.info('Starting Go backend from:', execPath);

        const options = {
            cwd: path.join(projectRoot, 'cli'),
            stdio: 'pipe',
            windowsHide: false,
            env: {
                ...process.env,
                ELEVATED: 'true',
                PORT: this.serverPort.toString()
            }
        };

        log.info('Starting Go backend with options:', options);

        try {

            this.goBackend = spawn(execPath, [], options);

            log.info('Go backend started successfully',this.goBackend);

            // Set up event listeners before waiting for startup
            this._setupEventListeners();

            // Wait for startup with timeout
            const startupSuccess = await Promise.race([
                this._waitForServerStart(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Backend startup timeout')), this.maxStartupTime)
                )
            ]);

            if (!startupSuccess) {
                log.error('Backend startup failed - server did not start properly',startupSuccess);
                throw new Error('Backend startup failed - server did not start properly');
            }

            // Test connection after successful startup
            await this._testServerConnection();

            this.isServerStarting = false;
            log.info('Go backend started and verified successfully');

        } catch (error) {
            this.isServerStarting = false;
            log.error('Error during backend startup:', error);
            this.shutdown();
            throw error;
        }
    }

    _setupEventListeners() {
        if (!this.goBackend) {
            return;
        }

        this.goBackend.stdout.on('data', (data) => {
            const output = data.toString().trim();
            log.info('Go backend output:', output);

            if (output.includes('Server started') ||
                output.includes('Listening on') ||
                output.includes(`port ${this.serverPort}`)) {
                this.serverStarted = true;
                log.info('Server startup message detected');
            }
        });

        this.goBackend.stderr.on('data', (data) => {
            const error = data.toString().trim();
            log.error('Go backend error:', error);
            if (error.includes('address already in use')) {
                this.serverStarted = false;
                log.error('Port already in use');
            }
        });

        this.goBackend.on('error', (err) => {
            log.error('Backend process error:', err);
            this.isServerStarting = false;
            this.serverStarted = false;
        });

        this.goBackend.on('exit', (code, signal) => {
            log.info(`Backend process exited - Code: ${code}, Signal: ${signal}`);
            this.isServerStarting = false;
            this.serverStarted = false;

            if (code !== 0 && !this.isShuttingDown) {
                log.error('Abnormal backend termination - initiating application shutdown');
                app.quit();
            }
        });
    }

    async _waitForServerStart() {
        return new Promise((resolve) => {
            const checkInterval = 100; // Check every 100ms
            const maxChecks = 50; // 5 seconds total
            let checks = 0;

            const intervalId = setInterval(() => {
                checks++;

                if (this.serverStarted) {
                    clearInterval(intervalId);
                    resolve(true);
                }

                if (checks >= maxChecks) {
                    clearInterval(intervalId);
                    resolve(false);
                }
            }, checkInterval);
        });
    }

    async _testServerConnection() {
        const maxRetries = 10;
        const retryDelay = 1000;
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const fetch = this.fetchModule.default;
                const response = await fetch(`http://localhost:${this.serverPort}/`, {
                    timeout: 5000
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                log.info('Backend connection test successful:', data);
                return true;

            } catch (error) {
                retries++;
                log.warn(`Connection attempt ${retries}/${maxRetries} failed:`, error.message);

                if (retries === maxRetries) {
                    log.error('Failed to connect to backend after maximum retries');
                    throw new Error('Failed to connect to backend after maximum retries');
                }

                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    async executeCommand(cmd) {
        if (!this.goBackend || !this.fetchModule) {
            throw new Error('Backend not initialized');
        }

        try {
            const fetch = this.fetchModule.default;
            const response = await fetch(`http://localhost:${this.serverPort}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command: cmd }),
                timeout: 30000
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            log.error('Command execution error:', error);
            throw error;
        }
    }

    shutdown() {
        this.isShuttingDown = true;
        if (this.goBackend) {
            log.info('Initiating backend shutdown');
            this.goBackend.kill('SIGTERM');
            this.goBackend = null;
        }
        this.isServerStarting = false;
        this.serverStarted = false;
        this.isShuttingDown = false;
    }
}

module.exports = BackendController;
