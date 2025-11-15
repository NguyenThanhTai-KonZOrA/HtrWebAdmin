import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  user: string | null;
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (user: string, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Get token from localStorage when app load
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("userRole");
    
    if (savedToken) setToken(savedToken);
    if (savedUser) setUser(savedUser);
    if (savedRole) setRole(savedRole);
    
    // Set loading to false after checking localStorage
    setIsLoading(false);
  }, []);

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

  const login = (user: string, token: string) => {
    setUser(user);
    setToken(token);
    const payload = parseJwt(token);
    const role = payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    setRole(role);  // This was missing!
    localStorage.setItem("token", token);
    localStorage.setItem("user", user);
    localStorage.setItem("userRole", role);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");

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
    <AuthContext.Provider value={{ user, token, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
