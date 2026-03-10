/**
 * Timeout and interval constants for the application
 * All values in milliseconds
 */

// Authentication & Session Management
export const AUTH_TIMEOUTS = {
    // Token validation check interval - every 10 minutes
    TOKEN_VALIDATION_INTERVAL: 10 * 60 * 1000,

    // Auto logout after 30 minutes of inactivity
    IDLE_TIMEOUT: 30 * 60 * 1000,

    // Refresh token before expiry - 5 minutes buffer
    REFRESH_BEFORE_EXPIRY: 5 * 60 * 1000,

    // Token expiration buffer for client-side check - 30 seconds
    TOKEN_EXPIRY_BUFFER: 30,

    // Session expired notification delay before redirect - 5 seconds
    SESSION_EXPIRED_REDIRECT_DELAY: 5000,
} as const;

// UI/UX Timeouts
export const UI_TIMEOUTS = {
    // Debounce delay for search inputs and similar - 300ms
    SEARCH_DEBOUNCE: 300,

    // Snackbar auto-hide duration - 6 seconds
    SNACKBAR_DURATION: 6000,

    // Tooltip delay
    TOOLTIP_DELAY: 500,
} as const;

// Network & API
export const NETWORK_TIMEOUTS = {
    // Default API request timeout - 30 seconds
    DEFAULT_REQUEST_TIMEOUT: 30000,

    // File upload timeout - 2 minutes
    FILE_UPLOAD_TIMEOUT: 120000,
} as const;