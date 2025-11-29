import React from 'react';
import { Permission } from '../constants/roles';
import { usePermission } from '../hooks/usePermission';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // true = Need all permissions, false = only need 1 of them
  fallback?: React.ReactNode; // Component to show when no permission
}

/**
 * Component to hide/show UI elements based on permissions
 * 
 * Usage examples:
 * 
 * 1. Hide button if no permission:
 *    <PermissionGuard requiredPermission={Permission.EDIT_DEVICE_MAPPING}>
 *      <Button>Edit Device</Button>
 *    </PermissionGuard>
 * 
 * 2. Show alternative UI when no permission:
 *    <PermissionGuard 
 *      requiredPermission={Permission.VIEW_REPORTS}
 *      fallback={<Typography>Contact admin for access</Typography>}
 *    >
 *      <ReportsView />
 *    </PermissionGuard>
 * 
 * 3. Require multiple permissions:
 *    <PermissionGuard 
 *      requiredPermissions={[Permission.VIEW_DEVICE_MAPPING, Permission.EDIT_DEVICE_MAPPING]}
 *      requireAll={true}
 *    >
 *      <EditButton />
 *    </PermissionGuard>
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback = null,
}) => {
  const { can, canAny, canAll } = usePermission();

  // Check permissions
  let hasAccess = true;

  if (requiredPermission) {
    hasAccess = can(requiredPermission);
  } else if (requiredPermissions && requiredPermissions.length > 0) {
    hasAccess = requireAll
      ? canAll(requiredPermissions)
      : canAny(requiredPermissions);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGuard;
