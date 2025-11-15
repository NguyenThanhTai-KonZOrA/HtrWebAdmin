import { useAutoLogout } from './useAutoLogout';
import { useVersionCheck } from './useVersionCheck';

/**
 * Hook main check auto logout và version checking
 * Both functionalities combined:
 * 1. Auto logout after 5 minutes of inactivity
 * 2. Force logout when new deployment is detected
 */
export const useSessionManager = () => {
  // Auto logout functionality
  const autoLogout = useAutoLogout();
  
  // Version checking
  const versionCheck = useVersionCheck();

  return {
    // Auto logout methods
    resetTimer: autoLogout.resetTimer,
    getLastActivity: autoLogout.getLastActivity,
    getRemainingTime: autoLogout.getRemainingTime,
    
    // Version check methods
    checkVersion: versionCheck.checkVersion,
    getCurrentVersion: versionCheck.getCurrentVersion
  };
};
