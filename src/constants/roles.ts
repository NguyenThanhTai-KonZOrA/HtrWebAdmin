export const UserRole = {
    ADMIN: 'admin',
    USER: 'user',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// System permissions definition
export const Permission = {
    // Admin Registration permissions
    VIEW_ADMIN_REGISTRATION: 'view_admin_registration',

    // Device Mapping permissions
    VIEW_DEVICE_MAPPING: 'view_device_mapping',
    EDIT_DEVICE_MAPPING: 'edit_device_mapping',

    // Future permissions can be added here
    // VIEW_REPORTS: 'view_reports',
    // MANAGE_USERS: 'manage_users',
    // etc.
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

/**
 * Role to Permissions mapping
 * Define permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.ADMIN]: [
        // Admin has all permissions
        Permission.VIEW_ADMIN_REGISTRATION,
        Permission.VIEW_DEVICE_MAPPING,
        Permission.EDIT_DEVICE_MAPPING,
        // Add all future permissions here for admin
    ],
    [UserRole.USER]: [
        Permission.VIEW_ADMIN_REGISTRATION,
        // User does not have permission for device mapping
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
