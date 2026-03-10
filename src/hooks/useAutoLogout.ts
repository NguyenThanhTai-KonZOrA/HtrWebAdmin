import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AUTH_TIMEOUTS } from '../constants/timeouts';
import { logInfo } from '../utils/errorHandler';
import { authManager } from '../utils/authManager';

/**
 * Hook auto logout user after a period of inactivity
 * Uses authManager's centralized activity tracking to avoid duplicate event listeners
 */
export const useAutoLogout = () => {
  const { logout, token } = useAuth();
  const timeoutRef = useRef<number | null>(null);

  // Use ref to store logout function to avoid dependency issues
  const logoutRef = useRef(logout);

  // Update logout ref when it changes
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // Check for inactivity periodically
  const checkInactivity = useCallback(() => {
    if (!token) return;

    const lastActivity = authManager.getLastActivity();
    const inactiveTime = Date.now() - lastActivity;

    if (inactiveTime >= AUTH_TIMEOUTS.IDLE_TIMEOUT) {
      logInfo('Auto Logout', 'Logging out due to inactivity (30 minutes)');
      logoutRef.current();
    }
  }, [token]);

  // Set up periodic inactivity check
  useEffect(() => {
    // If no token, no need to track
    if (!token) {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Check inactivity every minute
    timeoutRef.current = window.setInterval(checkInactivity, 60000);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [checkInactivity, token]);

  return {
    getLastActivity: () => authManager.getLastActivity(),
    getRemainingTime: () => {
      if (!token) return 0;
      const elapsed = Date.now() - authManager.getLastActivity();
      return Math.max(0, AUTH_TIMEOUTS.IDLE_TIMEOUT - elapsed);
    }
  };
};
