const crypto = require('crypto');

class SecurityPolicies {
    static NONCE_LENGTH = 32;

    static CSP_DIRECTIVES = {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline'",
        'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'img-src': "'self' data: https:",
        'font-src': "'self' https://fonts.gstatic.com",
        'object-src': "'none'",
        'base-uri': "'self'",
        'form-action': "'self'",
        'frame-ancestors': "'none'",
        'connect-src': "'self'",
        'media-src': "'self'",
        'worker-src': "'self'",
        'manifest-src': "'self'"
    };

    static SECURITY_HEADERS = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };

    constructor() {
        this.nonce = '';
        this.contentSecurityPolicy = '';
    }

    generateNonce() {
        this.nonce = crypto.randomBytes(SecurityPolicies.NONCE_LENGTH).toString('hex');
        return this.nonce;
    }

    buildCSP() {
        const directives = {...SecurityPolicies.CSP_DIRECTIVES};

        directives['script-src'] += ` 'nonce-${this.nonce}'`;
        directives['style-src'] += ` 'nonce-${this.nonce}'`;

        this.contentSecurityPolicy = Object.entries(directives)
            .map(([directive, value]) => `${directive} ${value}`)
            .join('; ') + '; block-all-mixed-content; upgrade-insecure-requests;';

        return this.contentSecurityPolicy;
    }

    applySecurityPolicy(window) {
        // Apply to Electron window
        window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    ...SecurityPolicies.SECURITY_HEADERS,
                    'Content-Security-Policy': [this.contentSecurityPolicy]
                }
            });
        });
    }

    static initSecurity(window) {
        const securityPolicies = new SecurityPolicies();
        securityPolicies.generateNonce();
        securityPolicies.buildCSP();
        securityPolicies.applySecurityPolicy(window);
        return securityPolicies;
    }
}

module.exports = SecurityPolicies;
