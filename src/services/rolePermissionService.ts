import axios from "axios";
import type { AssignRoleRequest, CreatePermissionRequest, CreateRoleRequest, EmployeeResponse, EmployeeWithRoles, PermissionResponse, RoleResponse, UpdatePermissionRequest, UpdateRoleRequest } from "../rolePermissionType";
import { showSessionExpiredNotification } from "../utils/sessionExpiredNotification";
import type { ApiEnvelope } from "../commonType";

const API_BASE = (window as any)._env_?.API_BASE;
const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" }
});

// Add token to requests automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 responses - redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only redirect if this is not a login request or token validation
            const isLoginRequest = error.config?.url?.includes('/api/auth/login');
            const isTokenValidation = error.config?.headers?.['X-Token-Validation'] === 'true';

            if (!isLoginRequest && !isTokenValidation) {
                console.log('🔒 Received 401 Unauthorized - Token is invalid or expired');

                // Clear all auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userRoles');

                // Trigger logout event for other tabs
                localStorage.setItem('logout-event', Date.now().toString());

                // Show user-friendly message
                showSessionExpiredNotification();
                console.log('🚪 Redirecting to login page...');

                // Redirect to login
                // Delay redirect to show notification
                setTimeout(() => {
                    window.location.href = '/login';
                }, 5000);
            }
        }

        // Check if it's a network error
        if (!error.response && error.code === 'ERR_NETWORK') {
            console.error('Network error detected:', error.message);
            // Dispatch event to update network status
            window.dispatchEvent(new CustomEvent('network-error', { detail: error }));
        }

        return Promise.reject(error);
    }
);

function unwrapApiEnvelope<T>(response: { data: ApiEnvelope<T> }): T {
    if (!response.data.success) {
        throw new Error("API call failed");
    }
    return response.data.data;
}

export const roleService = {
    getAllRoles: async (): Promise<RoleResponse[]> => {
        const response = await api.get('/api/role/all');
        return unwrapApiEnvelope(response);
    },

    getRoleById: async (id: number): Promise<RoleResponse> => {
        const response = await api.get(`/api/role/${id}`);
        return unwrapApiEnvelope(response);
    },

    createRole: async (roleData: CreateRoleRequest): Promise<RoleResponse> => {
        const response = await api.post('/api/role/create', roleData);
        return unwrapApiEnvelope(response);
    },

    updateRole: async (id: number, roleData: UpdateRoleRequest): Promise<RoleResponse> => {
        const response = await api.post(`/api/role/update/${id}`, roleData);
        return unwrapApiEnvelope(response);
    },

    deleteRole: async (id: number): Promise<void> => {
        await api.post(`/api/role/delete/${id}`);
    },

    changeStatus: async (id: number): Promise<RoleResponse> => {
        const response = await api.post(`/api/role/change-status/${id}`);
        return unwrapApiEnvelope(response);
    }
};

export const permissionService = {
    getAllPermissions: async (): Promise<PermissionResponse[]> => {
        const response = await api.get(`api/Permission/all`);
        return unwrapApiEnvelope(response);
    },

    getPermissionsByCategory: async (): Promise<Record<string, PermissionResponse[]>> => {
        const response = await api.get(`api/Permission/by-category`);
        return unwrapApiEnvelope(response);
    },

    getPermissionById: async (id: number): Promise<PermissionResponse> => {
        const response = await api.get(`api/Permission/${id}`);
        return unwrapApiEnvelope(response);
    },

    createPermission: async (data: CreatePermissionRequest): Promise<PermissionResponse> => {
        const response = await api.post(`api/Permission/create`, data);
        return unwrapApiEnvelope(response);
    },

    updatePermission: async (id: number, data: UpdatePermissionRequest): Promise<PermissionResponse> => {
        const response = await api.post(`api/Permission/update/${id}`, data);
        return unwrapApiEnvelope(response);
    },

    deletePermission: async (id: number): Promise<boolean> => {
        const response = await api.post(`api/Permission/delete/${id}`);
        return unwrapApiEnvelope(response);
    },

    togglePermissionStatus: async (id: number): Promise<boolean> => {
        const response = await api.post(`api/Permission/change-status/${id}`);
        return unwrapApiEnvelope(response);
    }
};

export const employeeRoleService = {
    getEmployeeWithRoles: async (employeeId: number): Promise<EmployeeWithRoles> => {
        const response = await api.get(`/api/EmployeeRole/roles/${employeeId}`);
        return unwrapApiEnvelope(response);
    },

    assignRolesToEmployee: async (data: AssignRoleRequest): Promise<boolean> => {
        const response = await api.post(`/api/EmployeeRole/assign-roles`, data);
        return unwrapApiEnvelope(response);
    },

    getEmployeePermissions: async (employeeId: number): Promise<string[]> => {
        const response = await api.get(`/api/EmployeeRole/permissions/${employeeId}`);
        return unwrapApiEnvelope(response);
    },

    getAllEmployees: async (): Promise<EmployeeResponse[]> => {
        const response = await api.get(`/api/EmployeeRole/list`);
        return unwrapApiEnvelope(response);
    },
};