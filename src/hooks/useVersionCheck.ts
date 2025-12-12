import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook check version application to force logout when there is a new deployment
 * Check version.json every 30 seconds
 */
export const useVersionCheck = () => {
  const { logout, token } = useAuth();
  const currentVersionRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Get current version from version.json
  const getCurrentVersion = async (): Promise<string | null> => {
    try {
      const response = await fetch('/version.json?' + Date.now()); // Cache busting
      if (!response.ok) throw new Error('Failed to fetch version');
      const data = await response.json();
      return data.version || null;
    } catch (error) {
      console.error('Error fetching version:', error);
      return null;
    }
  };

  // Check for new version and logout if changed
  const checkVersion = async () => {
    // Only check when user is logged in
    if (!token) return;

    const newVersion = await getCurrentVersion();
    if (!newVersion) return;

    // first time setup
    if (currentVersionRef.current === null) {
      currentVersionRef.current = newVersion;
      // Save version to localStorage to persist across sessions
      localStorage.setItem('app-version', newVersion);
      console.log('📦 App version initialized:', newVersion);
      return;
    }

    // Check for version change
    if (newVersion !== currentVersionRef.current) {
      console.log('🚀 New version detected:', newVersion, 'Current:', currentVersionRef.current);
      console.log('🚪 Forcing logout due to new deployment...');

      // Clear version to force check again
      localStorage.removeItem('app-version');

      await logout();
      logout();
    }
  };

  // Initialize version checking
  useEffect(() => {
    // If no token, no need to check
    if (!token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Get saved version from localStorage
    const savedVersion = localStorage.getItem('app-version');
    if (savedVersion) {
      currentVersionRef.current = savedVersion;
    }

    // Check for new version immediately
    checkVersion();

    // Set interval to check for new version every 5 minutes
    intervalRef.current = window.setInterval(checkVersion, 3000000); // 300000 ms = 5 minutes

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token]);

  // Cleanup when component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    checkVersion,
    getCurrentVersion: () => currentVersionRef.current
  };
};
