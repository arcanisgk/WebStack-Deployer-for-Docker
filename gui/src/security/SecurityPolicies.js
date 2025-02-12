const crypto = require('crypto');

class SecurityPolicies {
    static NONCE_LENGTH = 32;

    static CSP_DIRECTIVES = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        'img-src': ["'self'", "data:", "https:", "blob:"],
        'font-src': ["'self'", "data:","https://fonts.gstatic.com"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'connect-src': ["'self'","ws:", "wss:"],
        'media-src': ["'self'", "blob:"],
        'worker-src': ["'self'", "blob:"],
        'manifest-src': ["'self'"]
    };

    constructor() {
        this.nonce = this.generateNonce();
        this.contentSecurityPolicy = this.buildCSP();
    }

    generateNonce() {
        return crypto.randomBytes(SecurityPolicies.NONCE_LENGTH).toString('hex');
    }

    buildCSP() {
        const directives = {...SecurityPolicies.CSP_DIRECTIVES};

        directives['script-src'] = [
            ...directives['script-src'],
            `'unsafe-inline'`,
            `'nonce-${this.nonce}'`
        ];

        directives['style-src'] = [
            ...directives['style-src'],
            `'unsafe-inline'`,
            `'nonce-${this.nonce}'`
        ];

        return Object.entries(directives)
            .map(([key, values]) => `${key} ${values.join(' ')}`)
            .join('; ');
    }

    applySecurityPolicy(window) {

        window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [this.contentSecurityPolicy],
                    'X-Content-Type-Options': ['nosniff'],
                    'X-Frame-Options': ['DENY'],
                    'X-XSS-Protection': ['1; mode=block'],
                    'Referrer-Policy': ['strict-origin-when-cross-origin'],
                    'Permissions-Policy': ['camera=(), microphone=(), geolocation=()']
                }
            });
        });

        // Disable navigation
        /*
        window.webContents.on('will-navigate', (event, url) => {
            const parsedUrl = new URL(url);
            if (parsedUrl.origin !== 'file://') {
                event.preventDefault();
            }
        });
        */


        // Block new window creation
        window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

        // Disable all permission requests
        window.webContents.session.setPermissionRequestHandler((_, __, callback) => {
            callback(false);
        });

        // Disable remote content
        window.webContents.session.setPreloads([]);
    }

    static initSecurity(window) {
        const securityPolicies = new SecurityPolicies();
        securityPolicies.applySecurityPolicy(window);
        return securityPolicies;
    }

    getNonce() {
        return this.nonce;
    }

    getCSP() {
        return this.contentSecurityPolicy;
    }
}

module.exports = SecurityPolicies;
