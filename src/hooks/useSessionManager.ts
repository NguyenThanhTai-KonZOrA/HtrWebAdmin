import { useAutoLogout } from './useAutoLogout';
import { useVersionCheck } from './useVersionCheck';

/**
 * Hook main check auto logout và version checking
 * Both functionalities combined:
 * 1. Auto logout after 30 minutes of inactivity
 * 2. Force logout when new deployment is detected
 */
export const useSessionManager = () => {
  // Auto logout functionality (activity tracking is now handled by authManager)
  const autoLogout = useAutoLogout();

  // Version checking
  const versionCheck = useVersionCheck();

  return {
    // Auto logout methods
    getLastActivity: autoLogout.getLastActivity,
    getRemainingTime: autoLogout.getRemainingTime,

    // Version check methods
    checkVersion: versionCheck.checkVersion,
    getCurrentVersion: versionCheck.getCurrentVersion
  };
};
