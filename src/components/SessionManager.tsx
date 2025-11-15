import React from 'react';
import { useSessionManager } from '../hooks/useSessionManager';
import { useAuth } from '../contexts/AuthContext';

interface SessionManagerProps {
  children: React.ReactNode;
}

/**
 * Component manage session:
 * - Auto logout after 5 minutes of inactivity
 * - Force logout when new deployment is detected
 */
export const SessionManager: React.FC<SessionManagerProps> = ({ children }) => {
  const { token } = useAuth();

  // Only run session manager when user is logged in
  useSessionManager();

  return <>{children}</>;
};
