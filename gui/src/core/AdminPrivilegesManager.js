const { exec, execSync, spawn } = require('child_process');
const os = require('os');

/**
 * Manages application elevation and admin privileges across different platforms
 */
class AdminPrivilegesManager {
    /**
     * Checks and ensures the application runs with admin privileges
     * @returns {Promise<void>}
     */
    static async ensureAdminPrivileges() {
        const isAdmin =  await this.checkPrivilegesAndRelaunch();
        console.log('isAdmin', isAdmin);
    }

    static async checkPrivilegesAndRelaunch() {
        if (os.platform() === 'win32') {
            await exec('net session', async (err) => {
                if (err) {
                    console.log("Not running as Administrator. Relaunching...");
                    await this.relaunchAsAdmin();
                } else {
                    console.log("Running as Administrator.");
                }
            });
        } else {
            if (process.getuid && process.getuid() !== 0) {
                console.log("Not running as root. Relaunching...");
                await this.relaunchAsAdmin();
            } else {
                console.log("Running as root.");
            }
        }
        return true;
    }

    static async relaunchAsAdmin() {
        const platform = os.platform();
        const appPath = process.argv[0]; // Path to Electron executable
        const scriptPath = process.argv[1]; // Path to main.js (or entry point)
        const workingDir = process.cwd(); // Ensure correct working directory
        const args = process.argv.slice(2).join(' '); // Preserve additional arguments

        if (platform === 'win32') {
            const command = `powershell -Command "Start-Process '${appPath}' -ArgumentList '${scriptPath} ${args}' -WorkingDirectory '${workingDir}' -Verb RunAs"`;
            await exec(command, (err) => {
                if (err) {
                    console.error("Failed to elevate to administrator:", err);
                } else {
                    console.log("Restarting with administrator privileges...");
                    process.exit(0);
                }
            });
        } else {
            const elevatedProcess = spawn('sudo', [appPath, scriptPath, ...process.argv.slice(2)], {
                stdio: 'inherit',
                detached: true,
                cwd: workingDir, // Set correct working directory
            });

            elevatedProcess.on('error', (err) => {
                console.error("Failed to elevate to root:", err);
            });

            elevatedProcess.on('spawn', () => {
                console.log("Restarting with root privileges...");
                process.exit(0);
            });
        }
    }

    static async isRunningAsAdmin() {
        if (os.platform() === 'win32') {
            exec('net session', (err) => {
                if (err) {
                    console.log("Not running as Administrator. Relaunching...");
                    return false;
                }
            });
        } else {
            if (process.getuid && process.getuid() !== 0) {
                console.log("Not running as root. Relaunching...");
                return false;
            }
        }
        return true;
    }
}

module.exports = AdminPrivilegesManager;
