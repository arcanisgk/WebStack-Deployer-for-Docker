document.addEventListener('DOMContentLoaded', () => {
    // Window control buttons
    const windowControls = {
        minimize: document.getElementById('minimizeBtn'),
        maximize: document.getElementById('maximizeBtn'),
        close: document.getElementById('closeBtn')
    };

    // Top control buttons
    const topControls = {
        settings: document.getElementById('settingsBtn'),
        help: document.getElementById('helpBtn'),
        about: document.getElementById('aboutBtn')
    };

    // Maintenance dropdown
    const maintenanceBtn = document.getElementById('maintenanceBtn');
    const dropdownContent = document.querySelector('.dropdown-content');
    let isDropdownOpen = false;

    // Toggle dropdown on click
    maintenanceBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        isDropdownOpen = !isDropdownOpen;
        dropdownContent.classList.toggle('show', isDropdownOpen);
    });

    // Toggle dropdown on touch
    maintenanceBtn.addEventListener('touchstart', (event) => {
        event.preventDefault();
        event.stopPropagation();
        isDropdownOpen = !isDropdownOpen;
        dropdownContent.classList.toggle('show', isDropdownOpen);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!maintenanceBtn.contains(event.target) && isDropdownOpen) {
            dropdownContent.classList.remove('show');
            isDropdownOpen = false;
        }
    });

    // Maintenance options
    const maintenanceOptions = {
        checkUpdates: document.getElementById('option1'),
        backupSettings: document.getElementById('option2'),
        clearCache: document.getElementById('option3'),
        resetPreferences: document.getElementById('option4'),
        exit: document.getElementById('option5')
    };

    // Window controls event listeners
    Object.entries(windowControls).forEach(([action, element]) => {
        element.addEventListener('click', () => {
            window.electronAPI.send('window-control', action);
        });
    });

    // Top controls event listeners
    Object.entries(topControls).forEach(([action, element]) => {
        element.addEventListener('click', () => {
            window.electronAPI.send(`open-${action}`);
        });
    });

    // Maintenance options event listeners
    const maintenanceActions = {
        checkUpdates: 'check-updates',
        backupSettings: 'backup-settings',
        clearCache: 'clear-cache',
        resetPreferences: 'reset-preferences',
        exit: 'exit'
    };

    Object.entries(maintenanceOptions).forEach(([action, element]) => {
        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            window.electronAPI.send('maintenance', maintenanceActions[action]);
            dropdownContent.classList.remove('show');
            isDropdownOpen = false;
        });
    });
});