export const UserRole = {
    ADMIN: 'Administrator',
    USER: 'user',
    MANAGER: 'Manager',
    VIEWER: 'Viewer',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// System permissions definition
export const Permission = {
    // Admin Registration permissions
    VIEW_ADMIN_REGISTRATION: 'view_admin_registration',

    // Device Mapping permissions
    VIEW_DEVICE_MAPPING: 'view_device_mapping',
    VIEW_REPORTS: 'view_reports',
    VIEW_ROLE_MANAGEMENT: 'view_role_management',
    VIEW_AUDIT_LOGS: 'view_audit_logs',
    VIEW_EMPLOYEE_MANAGEMENT: 'view_employee_management',
    VIEW_MIGRATION_INCOME: 'view_migration_income',
    VIEW_VERIFICATION_DOCUMENT: 'view_verification_document'
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

/**
 * Role to Permissions mapping
 * Define permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.ADMIN]: [
        Permission.VIEW_ADMIN_REGISTRATION,
        Permission.VIEW_DEVICE_MAPPING,
        Permission.VIEW_REPORTS,
        Permission.VIEW_ROLE_MANAGEMENT,
        Permission.VIEW_AUDIT_LOGS,
        Permission.VIEW_EMPLOYEE_MANAGEMENT,
        Permission.VIEW_MIGRATION_INCOME,
        Permission.VIEW_VERIFICATION_DOCUMENT
    ],
    [UserRole.USER]: [
        Permission.VIEW_ADMIN_REGISTRATION,
        // User does not have permission for device mapping
    ],
    [UserRole.MANAGER]: [
        Permission.VIEW_ADMIN_REGISTRATION,
        Permission.VIEW_MIGRATION_INCOME,
        Permission.VIEW_VERIFICATION_DOCUMENT
    ],
    [UserRole.VIEWER]: [
        Permission.VIEW_ADMIN_REGISTRATION
    ],
};

/**
 * Get permissions for a specific role
 */
export const getPermissionsForRole = (role: string | null): Permission[] => {
    if (!role) return [];

    const userRole = role as UserRole;
    return ROLE_PERMISSIONS[userRole] || [];
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: string | null, permission: Permission): boolean => {
    const permissions = getPermissionsForRole(role);
    return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (role: string | null, permissions: Permission[]): boolean => {
    const userPermissions = getPermissionsForRole(role);
    return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (role: string | null, permissions: Permission[]): boolean => {
    const userPermissions = getPermissionsForRole(role);
    return permissions.every(permission => userPermissions.includes(permission));
};
