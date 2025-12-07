import { authAdminService } from "../services/authService";

interface TokenData {
    accessToken: string;
    refreshToken: string;
    tokenExpiration: string;
}

class AuthManager {
    private tokenKey = 'token';
    private refreshTokenKey = 'refresh_token';
    private tokenExpirationKey = 'token_expiration';
    private refreshInterval: number | null = null;
    private lastActivity: number = Date.now();

    // Time refresh token before expiry (5 minutes)
    private refreshBeforeExpiry = 5 * 60 * 1000;

    // Time of inactivity before stopping auto-refresh (30 minutes)
    private inactivityThreshold = 30 * 60 * 1000;

    private onLogoutCallback: (() => void) | null = null;

    constructor() {
        this.init();
    }

    private init() {
        // Listen to user activity events to track last activity time
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, () => this.updateActivity(), true);
        });

        // Start auto-refresh if already logged in
        if (this.isAuthenticated()) {
            this.startAutoRefresh();
        }
    }

    private updateActivity() {
        this.lastActivity = Date.now();
    }

    private isUserActive(): boolean {
        return (Date.now() - this.lastActivity) < this.inactivityThreshold;
    }

    saveTokens(accessToken: string, refreshToken: string, expiration: string) {
        localStorage.setItem(this.tokenKey, accessToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
        localStorage.setItem(this.tokenExpirationKey, expiration);

        // Start auto-refresh when saving token
        this.startAutoRefresh();
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshTokenKey);
    }

    getTokenExpiration(): Date | null {
        const expiration = localStorage.getItem(this.tokenExpirationKey);
        return expiration ? new Date(expiration) : null;
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }

    clearTokens() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.tokenExpirationKey);
        this.stopAutoRefresh();
    }

    async refreshToken(): Promise<boolean> {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                console.warn('⚠️ No refresh token available');
                return false;
            }

            console.log('🔄 Refreshing access token...');

            const result = await authAdminService.refreshToken({ refreshToken });

            if (result && result.token && result.refreshToken && result.tokenExpiration) {
                this.saveTokens(
                    result.token,
                    result.refreshToken,
                    result.tokenExpiration
                );
                console.log('✅ Token refreshed successfully');
                return true;
            } else {
                console.error('❌ Invalid refresh token response');
                this.handleRefreshFailure();
                return false;
            }
        } catch (error) {
            console.error('❌ Error refreshing token:', error);
            this.handleRefreshFailure();
            return false;
        }
    }

    private handleRefreshFailure() {
        this.clearTokens();
        // Trigger logout callback if any
        if (this.onLogoutCallback) {
            this.onLogoutCallback();
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();

        this.refreshInterval = setInterval(() => {
            const expiration = this.getTokenExpiration();
            if (!expiration) {
                this.stopAutoRefresh();
                return;
            }

            const now = Date.now();
            const timeUntilExpiry = expiration.getTime() - now;

            // Only refresh if user is active
            if (this.isUserActive()) {
                // Refresh token before expiry (5 minutes)
                if (timeUntilExpiry < this.refreshBeforeExpiry && timeUntilExpiry > 0) {
                    const secondsUntilExpiry = Math.floor(timeUntilExpiry / 1000);
                    console.log(`⏰ Token will expire in ${secondsUntilExpiry} seconds, refreshing...`);
                    this.refreshToken();
                } else if (timeUntilExpiry <= 0) {
                    console.log('⏰ Token has expired');
                    this.handleRefreshFailure();
                }
            } else {
                console.log('⏸️ User inactive, skipping token refresh');
            }
        }, 60000); // Check every minute

        console.log('✅ Auto-refresh started');
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('⏹️ Auto-refresh stopped');
        }
    }

    async logout(): Promise<void> {
        try {
            const token = this.getAccessToken();
            if (token) {
                await authAdminService.revokeToken();
                console.log('✅ Token revoked successfully');
            }
        } catch (error) {
            console.error('❌ Error revoking token:', error);
        } finally {
            this.clearTokens();
            // Trigger logout callback
            if (this.onLogoutCallback) {
                this.onLogoutCallback();
            }
        }
    }

    // Set callback when logout is needed (token expired or refresh fail)
    setOnLogout(callback: () => void) {
        this.onLogoutCallback = callback;
    }

    // Helper method to add Authorization header
    getAuthHeaders(): HeadersInit {
        const token = this.getAccessToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Export singleton instance
export const authManager = new AuthManager();
