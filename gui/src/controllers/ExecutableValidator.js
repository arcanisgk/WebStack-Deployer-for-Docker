const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const { app } = require('electron');

class ExecutableValidator {
    static async validateGoExecutable() {
        const isWindows = process.platform === 'win32';

        // Get the correct base path
        const basePath = app.isPackaged
            ? path.dirname(app.getPath('exe'))
            : path.join(__dirname, '..', '..'); // Points to /gui directory

        // Define CLI path relative to gui directory
        const cliPath = path.join(basePath, '..', 'cli');
        const executableName = isWindows ? 'main.exe' : 'main';
        const executablePath = path.join(cliPath, executableName);

        log.info('Checking executable at:', executablePath);

        try {
            if (!fs.existsSync(executablePath)) {
                const error = `Go backend executable not found at: ${executablePath}`;
                log.error(error);
                throw new Error(error);
            }

            const stats = fs.statSync(executablePath);

            if (!isWindows) {
                const isExecutable = (stats.mode & fs.constants.S_IXUSR) !== 0;
                if (!isExecutable) {
                    await fs.promises.chmod(executablePath, '755');
                    log.info('Applied executable permissions to Go backend');
                }
            }

            log.info('Go backend executable validated successfully');
            return executablePath;

        } catch (error) {
            log.error('Executable validation failed:', error);
            throw error;
        }
    }
}

module.exports = ExecutableValidator;
