import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook is detect logout from another tab and redirect to login page
 * Use localStorage events to sync between tabs
 */
export const useGlobalLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Function check storage changes
    const handleStorageChange = (e: StorageEvent) => {
      // when token is removed from another tab
      if (e.key === 'token' && e.newValue === null) {
        console.log('🚪 Detected logout from another tab, redirecting to login...');
        navigate('/login');
      }

      // or if a custom logout event is received
      if (e.key === 'logout-event') {
        console.log('🚪 Received logout event from another tab');
        localStorage.removeItem('logout-event'); // Clean up
        navigate('/login');
      }
    };

    // listen for storage events (only trigger when change from another tab)
    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  // Function to trigger logout for all tabs
  const triggerGlobalLogout = () => {
    // Remove tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Trigger event for other tabs
    localStorage.setItem('logout-event', Date.now().toString());
    
    // Navigate current tab
    navigate('/login');
  };

  return { triggerGlobalLogout };
};
