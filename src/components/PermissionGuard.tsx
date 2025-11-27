import React from 'react';
import { Permission } from '../constants/roles';
import { usePermission } from '../hooks/usePermission';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // true = cần tất cả permissions, false = chỉ cần 1 trong số đó
  fallback?: React.ReactNode; // Component hiển thị khi không có quyền
}

/**
 * Component để ẩn/hiện UI elements dựa trên permissions
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

  // Nếu có quyền, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Nếu không có quyền, render fallback hoặc null
  return <>{fallback}</>;
};

export default PermissionGuard;
