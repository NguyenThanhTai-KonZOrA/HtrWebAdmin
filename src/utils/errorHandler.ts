import axios, { AxiosError } from 'axios';

/**
 * Type guard to check if error is an AxiosError
 */
export function isAxiosError(error: unknown): error is AxiosError {
    return axios.isAxiosError(error);
}

/**
 * Type guard to check if error is a standard Error
 */
export function isError(error: unknown): error is Error {
    return error instanceof Error;
}

/**
 * Extract error message from API response
 * Handles various error response formats from the backend
 */
export const extractErrorMessage = (error: unknown, defaultMessage: string = "An error occurred"): string => {
    // Handle Axios errors
    if (isAxiosError(error)) {
        const data = error.response?.data;

        if (data && typeof data === 'object') {
            if ('message' in data && typeof data.message === 'string') {
                return data.message;
            }
            if ('data' in data) {
                if (typeof data.data === 'string') {
                    return data.data;
                }
                if (data.data && typeof data.data === 'object' && 'message' in data.data) {
                    return String(data.data.message);
                }
            }
        }

        if (error.response?.statusText) {
            return `${error.response.status}: ${error.response.statusText}`;
        }

        return error.message || defaultMessage;
    }

    // Handle standard errors
    if (isError(error)) {
        return error.message || defaultMessage;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error || defaultMessage;
    }

    return defaultMessage;
};

/**
 * Handle API error and return formatted error message
 */
export const handleApiError = (error: unknown, context: string = "operation"): string => {
    logError(context, error);
    return extractErrorMessage(error, `Error during ${context}`);
};

/**
 * Log error to console in development mode only
 */
export function logError(context: string, error: unknown): void {
    if (import.meta.env.DEV) {
        console.error(`[${context}] Error:`, error);
    }
}

/**
 * Log info to console in development mode only
 */
export function logInfo(context: string, message: string, data?: unknown): void {
    if (import.meta.env.DEV) {
        if (data !== undefined) {
            console.log(`[${context}] ${message}`, data);
        } else {
            console.log(`[${context}] ${message}`);
        }
    }
}

/**
 * Log warning to console in development mode only
 */
export function logWarning(context: string, message: string, data?: unknown): void {
    if (import.meta.env.DEV) {
        if (data !== undefined) {
            console.warn(`[${context}] ${message}`, data);
        } else {
            console.warn(`[${context}] ${message}`);
        }
    }
}
