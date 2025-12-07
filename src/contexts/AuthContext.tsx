import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/registrationService";
import { authManager } from "../utils/authManager";

interface AuthContextType {
  user: string | null;
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (user: string, token: string, refreshToken: string, tokenExpiration: string) => void;
  logout: () => void;
  validateAndRefreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper function to clear session without API call (for internal use)
  const clearSession = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    authManager.clearTokens();
  };

  // Set up authManager logout callback
  useEffect(() => {
    authManager.setOnLogout(() => {
      // Clear state and redirect to login
      clearSession();
      window.location.href = '/login';
    });
  }, []);

  // Get token from localStorage when app load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      const savedRole = localStorage.getItem("userRole");

      if (savedToken && savedUser && savedRole) {
        // Check if token is expired (client-side check)
        const isExpired = authService.isTokenExpired(savedToken);

        if (isExpired) {
          console.log('🔒 Token is expired (client-side check), clearing...');
          clearSession();
          setIsLoading(false);
          return;
        }

        // Validate token with server
        console.log('🔍 Validating token with server...');
        const isValid = await authService.validateToken();

        if (isValid) {
          console.log('✅ Token is valid, restoring session...');
          setToken(savedToken);
          setUser(savedUser);
          setRole(savedRole);
          // Start auto-refresh if we have tokens in storage
          if (authManager.isAuthenticated()) {
            authManager.startAutoRefresh();
          }
        } else {
          console.log('❌ Token is invalid, clearing session...');
          clearSession();
        }
      }

      // Set loading to false after checking
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Validate token and refresh if needed
  const validateAndRefreshToken = async (): Promise<boolean> => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      return false;
    }

    // Check client-side expiration first
    if (authService.isTokenExpired(currentToken)) {
      console.log('🔒 Token expired, logging out...');
      clearSession();
      return false;
    }

    // Validate with server
    const isValid = await authService.validateToken();

    if (!isValid) {
      console.log('❌ Token invalid, logging out...');
      clearSession();
      return false;
    }

    return true;
  };

  // 👇 Global logout detection
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // when token is removed from another tab
      if (e.key === 'token' && e.newValue === null) {
        console.log('🚪 Token removed from another tab, clearing local state...');
        setUser(null);
        setToken(null);
        setRole(null);
      }

      // when logout event is received from another tab
      if (e.key === 'logout-event') {
        console.log('🚪 Logout event received from another tab');
        setUser(null);
        setToken(null);
        setRole(null);
        // Clean up the event (no need to remove here, it will auto-expire)
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (user: string, token: string, refreshToken: string, tokenExpiration: string) => {
    setUser(user);
    setToken(token);
    const payload = parseJwt(token);
    const role = payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    setRole(role);  // This was missing!
    localStorage.setItem("token", token);
    localStorage.setItem("user", user);
    localStorage.setItem("userRole", role);

    // Save tokens using authManager (this will also start auto-refresh)
    authManager.saveTokens(token, refreshToken, tokenExpiration);
  };

  const logout = async () => {
    // Use authManager to handle logout (will revoke token and clear everything)
    await authManager.logout();

    // Clear local state
    clearSession();

    // Trigger global logout event for other tabs
    localStorage.setItem('logout-event', Date.now().toString());
  };

  function parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, role, isLoading, login, logout, validateAndRefreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
