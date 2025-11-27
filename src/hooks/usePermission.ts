import { useAuth } from '../contexts/AuthContext';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions, UserRole } from '../constants/roles';

/**
 * Hook check permissions of the current user
 */
export const usePermission = () => {
  const { role } = useAuth();

  /**
   * Check if user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    return hasPermission(role, permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = (permissions: Permission[]): boolean => {
    return hasAnyPermission(role, permissions);
  };

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = (permissions: Permission[]): boolean => {
    return hasAllPermissions(role, permissions);
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return role === UserRole.ADMIN;
  };

  /**
   * Check if user is a specific role
   */
  const hasRole = (requiredRole: UserRole): boolean => {
    return role === requiredRole;
  };

  return {
    can,
    canAny,
    canAll,
    isAdmin,
    hasRole,
    role,
  };
};
