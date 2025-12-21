export interface RoleResponse {
    id: number;
    roleName: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    permissions?: PermissionResponse[];
    permissionIds?: number[];
}

export interface PermissionResponse {
    id: number;
    permissionName: string;
    permissionCode: string;
    description: string;
    category: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRoleRequest {
    roleName: string;
    description: string;
    permissionIds: number[];
}

export interface UpdateRoleRequest {
    id: number;
    roleName?: string;
    description?: string;
    isActive?: boolean;
    permissionIds?: number[];
}

export interface CreatePermissionRequest {
    permissionName: string;
    permissionCode: string;
    description?: string;
    category?: string;
}

export interface UpdatePermissionRequest {
    id: number;
    permissionName: string;
    permissionCode?: string;
    description?: string;
    category?: string;
}

export interface EmployeeWithRoles {
    id: number;
    employeeCode: string;
    fullName: string;
    email?: string;
    department?: string;
    position?: string;
    roles?: RoleResponse[];
    permissions?: string[];
}

export interface AssignRoleRequest {
    employeeId: number;
    roleIds: number[];
}

export interface EmployeeResponse {
    id: number;
    employeeCode: string;
    fullName: string;
    email?: string;
    department?: string;
    position?: string;
    isActive: boolean;
}