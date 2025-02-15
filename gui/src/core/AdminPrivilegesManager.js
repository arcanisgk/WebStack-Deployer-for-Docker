const { exec, spawn } = require('child_process');
const os = require('os');

/**
 * Manages administrative privileges for the application across different operating systems.
 * Handles privilege elevation for both Windows (Administrator) and Unix-based (root) systems.
 */
class AdminPrivilegesManager {
    /**
     * Ensures the application is running with administrative privileges.
     * Attempts to elevate privileges if necessary.
     * @throws {Error} If privilege elevation fails
     * @returns {Promise<void>}
     */
    static async ensureAdminPrivileges() {
        try {
            const isAdmin = await this.checkPrivilegesAndRelaunch();
            console.log('Administrative privileges status:', isAdmin);
        } catch (error) {
            console.error('Error verifying/obtaining administrative privileges:', error);
            process.exit(1);
        }
    }

    /**
     * Checks current privileges and initiates elevation if needed.
     * @returns {Promise<boolean>} True if already running with admin privileges
     * @private
     */
    static async checkPrivilegesAndRelaunch() {
        if (os.platform() === 'win32') {
            return new Promise((resolve) => {
                // Check if process is running with elevated privileges using PowerShell
                const checkCommand = 'powershell.exe -NoProfile -Command "&{try{$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent());$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)} catch{$false}}"';

                exec(checkCommand, async (err, stdout) => {
                    const isElevated = stdout.trim().toLowerCase() === 'true';

                    if (!isElevated) {
                        console.log("Process not elevated - elevating to Administrator");
                        await AdminPrivilegesManager.relaunchAsAdmin();
                        resolve(false);
                    } else {
                        console.log("Process is running with Administrator privileges");
                        resolve(true);
                    }
                });
            });
        } else {
            // For Unix-based systems (Linux/macOS)
            const isRoot = process.getuid && process.getuid() === 0;
            if (!isRoot) {
                console.log("Process not elevated - elevating to root");
                await AdminPrivilegesManager.relaunchAsAdmin();
                return false;
            }
            console.log("Process is running with root privileges");
            return true;
        }
    }

    /**
     * Relaunches the application with elevated privileges.
     * Handles both Windows (RunAs) and Unix-based (sudo) systems.
     * @throws {Error} If elevation fails
     * @private
     */
    static async relaunchAsAdmin() {
        if (process.env.RELAUNCHED) {
            console.error("Elevation attempt failed, terminating execution.");
            process.exit(1);
        }

        process.env.RELAUNCHED = 'true';
        const platform = os.platform();
        const appPath = process.argv[0];
        const scriptPath = process.argv[1];
        const args = process.argv.slice(2);

        try {
            if (platform === 'win32') {
                // Use PowerShell Start-Process to ensure proper elevation
                const psArgs = [
                    '-NoProfile',
                    '-Command',
                    `Start-Process '${appPath}' -ArgumentList '${scriptPath}','${args.join("','")}' -WorkingDirectory '${process.cwd()}' -Verb RunAs -Wait -PassThru | ForEach-Object { $_.StartInfo.EnvironmentVariables["RELAUNCHED"] = "true" }`
                ];


                await new Promise((resolve, reject) => {
                    const elevateProcess = spawn('powershell.exe', psArgs, {
                        stdio: 'inherit',
                        windowsHide: true
                    });

                    elevateProcess.on('exit', (code) => {
                        if (code === 0) {
                            console.log("Successfully relaunched with Administrator privileges");
                        } else {
                            reject(new Error(`Elevation failed with code: ${code}`));
                        }
                        process.exit(code);
                    });
                });
            } else {
                // For Unix-based systems
                const sudoArgs = ['--askpass', appPath, scriptPath, ...args];

                const elevatedProcess = spawn('sudo', sudoArgs, {
                    stdio: 'inherit',
                    env: { ...process.env, SUDO_ASKPASS: '/usr/lib/ssh/ssh-askpass' }
                });

                elevatedProcess.on('exit', (code) => {
                    console.log(`Elevated process finished with code: ${code}`);
                    process.exit(code);
                });
            }
        } catch (error) {
            console.error('Privilege elevation failed:', error);
            process.exit(1);
        }
    }

    /**
     * Checks if the application is currently running with administrative privileges.
     * @returns {Promise<boolean>} True if running with admin privileges
     */
    static async isRunningAsAdmin() {
        try {
            if (os.platform() === 'win32') {
                return new Promise((resolve) => {

                    const checkCommand = 'powershell.exe -NoProfile -Command "&{try{$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent());$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)} catch{$false}}"';

                    exec(checkCommand, (err, stdout) => {
                        resolve(stdout.trim().toLowerCase() === 'true');
                    });
                });
            }
            return process.getuid ? process.getuid() === 0 : false;
        } catch (error) {
            console.error('Error checking administrative privileges:', error);
            return false;
        }
    }
}

module.exports = AdminPrivilegesManager;