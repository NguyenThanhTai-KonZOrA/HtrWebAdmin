import axios from "axios";
import { showSessionExpiredNotification } from '../utils/sessionExpiredNotification';
import type { AuditLogPaginationRequest, AuditLogPaginationResponse, AuditLogResponse, AuditLogsRegisterMembershipPaginationResponse, AuditLogsRegisterMembershipRequest, CheckPatronIdentificationRequest, CheckValidIncomeRequest, CheckValidIncomeResponse, CityResponse, CountryResponse, CreateMappingRequest, CreateMappingResponse, CurrentHostNameResponse, CurrentStaffDeviceResponse, GetAllMappingsResponse, GetMappingByStaffDeviceResponse, IncomeFileResponse, MappingDataResponse, OnlineStaffDevicesResponse, PatronFilterRequest, PatronImagesResponse, PatronPagingRequest, PatronPagingResponse, PatronRegisterMembershipRequest, PatronRegisterMembershipResponse, PatronResponse, RenderDocumentResponse, StaffAndPatronDevicesResponse, StaffSignatureRequest, SyncIncomeDocumentRequest, SyncIncomeDocumentResponse, SyncPatronImagesRequest, UpdateMappingRequest, UpdateMappingResponse } from "../registrationType";
import type { SettingsResponse, CreateSettingsRequest, SettingsInfoResponse, ClearCacheSettingResponse, UpdateSettingsRequest, UpdateSettingsResponse, EmployeePerformanceRequest, EmployeePerformanceResponse, ManageDeviceResponse, ToggleDeviceRequest, DeleteDeviceRequest, ChangeHostnameRequest, CustomerConfirmationRequest, CustomerConfirmationResponse } from "../type";
import { FormatUtcTime } from "../utils/formatUtcTime";

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
                localStorage.removeItem('userRole');

                // Trigger logout event for other tabs
                localStorage.setItem('logout-event', Date.now().toString());

                // Show user-friendly message
                showSessionExpiredNotification();
                console.log('🚪 Redirecting to login page...');

                // Delay redirect to show notification
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
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


function getErrorMessage(data: unknown, fallback: string) {
    if (typeof data === "string") return data || fallback;
    try {
        return JSON.stringify(data) || fallback;
    } catch {
        return fallback;
    }
};

type ApiEnvelope<T> = {
    status: number;
    data: T;
    success: boolean;
};

function unwrapApiEnvelope<T>(response: { data: ApiEnvelope<T> }): T {
    if (!response.data.success) {
        throw new Error("API call failed");
    }
    return response.data.data;
};

export const patronService = {
    getAllPatrons: async (isMembership: boolean): Promise<PatronResponse[]> => {
        const response = await api.get<ApiEnvelope<PatronResponse[]>>("/api/RegistrationAdmin/patron/all", {
            params: { isMembership }
        });
        return unwrapApiEnvelope(response);
    },

    getAllPatronsWithPagination: async (request: PatronPagingRequest): Promise<PatronPagingResponse> => {
        const response = await api.post<ApiEnvelope<PatronPagingResponse>>("/api/RegistrationAdmin/patron/all/paginate", request);
        const result = unwrapApiEnvelope(response) as any;

        // If the API returns an object with pagination info
        if (result && typeof result === 'object' && !Array.isArray(result)) {
            return {
                data: result.data || result.list || [],
                totalRecords: result.totalRecords || result.total || 0,
                page: result.page || 1,
                pageSize: result.pageSize || request.Take || 10,
                totalPages: result.totalPages || Math.ceil((result.totalRecords || result.total || 0) / (request.Take || 10)),
                hasPrevious: result.hasPrevious || false,
                hasNext: result.hasNext || false,
                totalRegistrationManual: result.totalRegistrationManual || 0,
                totalRegistrationOnline: result.totalRegistrationOnline || 0,
            } as PatronPagingResponse;
        }

        // If the API returns an array directly (legacy), wrap it in pagination structure
        const dataArray = Array.isArray(result) ? result : [];
        return {
            data: dataArray,
            totalRecords: dataArray.length,
            page: 1,
            pageSize: dataArray.length,
            totalPages: 1,
            hasPrevious: false,
            hasNext: false,
            totalRegistrationManual: 0,
            totalRegistrationOnline: 0
        } as PatronPagingResponse;
    },

    getPatronDetail: async (patronId: number): Promise<PatronResponse> => {
        const response = await api.get<ApiEnvelope<PatronResponse>>(`/api/RegistrationAdmin/patron/detail/${patronId}`);
        return unwrapApiEnvelope(response);
    },

    getPatronImages: async (patronId: number): Promise<PatronImagesResponse> => {
        const response = await api.get<ApiEnvelope<PatronImagesResponse>>(`/api/RegistrationAdmin/patron/images/${patronId}`);
        return unwrapApiEnvelope(response);
    },

    updatePatron: async (request: PatronResponse): Promise<void> => {
        const response = await api.post<ApiEnvelope<void>>("/api/RegistrationAdmin/patron/update", request);
        return unwrapApiEnvelope(response);
    },

    registerMembership: async (request: PatronRegisterMembershipRequest): Promise<PatronRegisterMembershipResponse> => {
        const response = await api.post<ApiEnvelope<PatronRegisterMembershipResponse>>("/api/RegistrationAdmin/register/membership", request);
        return unwrapApiEnvelope(response);
    },

    deletePatron: async (patronId: number): Promise<void> => {
        const response = await api.post<ApiEnvelope<void>>(`/api/RegistrationAdmin/patron/delete/${patronId}`);
        return unwrapApiEnvelope(response);
    },

    syncPatronImages: async (request: SyncPatronImagesRequest): Promise<void> => {
        const response = await api.post<ApiEnvelope<void>>(`/api/RegistrationAdmin/patron/sync-images`, request);
        return unwrapApiEnvelope(response);
    },

    getAllPatronsReportPagination: async (request: PatronFilterRequest): Promise<PatronPagingResponse> => {
        const response = await api.post<ApiEnvelope<PatronPagingResponse>>("/api/RegistrationAdmin/patron/filter", request);
        const result = unwrapApiEnvelope(response) as any;

        // If the API returns an object with pagination info
        if (result && typeof result === 'object' && !Array.isArray(result)) {
            return {
                data: result.data || result.list || [],
                totalRecords: result.totalRecords || result.total || 0,
                page: result.page || 1,
                pageSize: result.pageSize || request.Take || 10,
                totalPages: result.totalPages || Math.ceil((result.totalRecords || result.total || 0) / (request.Take || 10)),
                hasPrevious: result.hasPrevious || false,
                hasNext: result.hasNext || false,
                totalRegistrationManual: result.totalRegistrationManual || 0,
                totalRegistrationOnline: result.totalRegistrationOnline || 0,
            } as PatronPagingResponse;
        }

        // If the API returns an array directly (legacy), wrap it in pagination structure
        const dataArray = Array.isArray(result) ? result : [];
        return {
            data: dataArray,
            totalRecords: dataArray.length,
            page: 1,
            pageSize: dataArray.length,
            totalPages: 1,
            hasPrevious: false,
            hasNext: false,
            totalRegistrationManual: 0,
            totalRegistrationOnline: 0
        } as PatronPagingResponse;
    },

    exportPatronFilter: async (request: PatronFilterRequest): Promise<void> => {
        try {
            const response = await api.post(`/api/RegistrationAdmin/patron/filter/export`, request, {
                responseType: 'blob'
            });
            const blob = response.data;
            const cd = response.headers['content-disposition'] || '';
            const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd);
            const serverFileName = `Registration_Report_From_${FormatUtcTime.formatDateWithoutTime(request.FromDate)}_To_${FormatUtcTime.formatDateWithoutTime(request.ToDate)}.xlsx`;

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = serverFileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            if (error.response?.data instanceof Blob) {
                // If error response is JSON wrapped in Blob
                const text = await error.response.data.text();
                try {
                    const envelope = JSON.parse(text) as ApiEnvelope<unknown>;
                    throw new Error(getErrorMessage(envelope.data, `HTTP ${error.response.status}`));
                } catch {
                    throw new Error(`HTTP ${error.response?.status || 'Unknown error'}`);
                }
            }
            throw error;
        }
    }
};

export const incomeDocumentService = {
    approveValidIncomeDocument: async (request: CheckValidIncomeRequest): Promise<CheckValidIncomeResponse> => {
        const response = await api.post<ApiEnvelope<CheckValidIncomeResponse>>("/api/RegistrationAdmin/income/approve", request);
        return unwrapApiEnvelope(response);
    },

    getIncomeFile: async (pid: number, playerId: number): Promise<IncomeFileResponse> => {
        const response = await api.get<ApiEnvelope<IncomeFileResponse>>(`/api/RegistrationAdmin/income/files`, {
            params: { pid, playerId }
        });
        return unwrapApiEnvelope(response);
    },

    uploadIncomeFile: async (patronId: number, playerId: number, files: File[]): Promise<boolean> => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('patronId', patronId.toString());
        formData.append('playerId', playerId.toString());

        const response = await api.post<ApiEnvelope<boolean>>(`/api/RegistrationAdmin/income/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return unwrapApiEnvelope(response);
    },

    deleteIncomeFile: async (batchId: string, saveAs: string): Promise<void> => {
        const response = await api.post<ApiEnvelope<void>>(`/api/RegistrationAdmin/income/delete/file?batchId=${batchId}&saveAs=${saveAs}`);
        return unwrapApiEnvelope(response);
    },
};

export const countryService = {
    getCountries: async (): Promise<CountryResponse[]> => {
        const response = await api.get<ApiEnvelope<CountryResponse[]>>("/api/Country/full");
        return unwrapApiEnvelope(response);
    }
};

export const cityService = {
    getCities: async (): Promise<CityResponse[]> => {
        const response = await api.get<ApiEnvelope<CityResponse[]>>("/api/City/all");
        return unwrapApiEnvelope(response);
    }
};

export const staffDeviceService = {
    getCurrentStaffDevice: async (): Promise<CurrentStaffDeviceResponse> => {
        const response = await api.get<ApiEnvelope<CurrentStaffDeviceResponse>>("/api/PatronDevice/current-staff-device");
        return unwrapApiEnvelope(response);
    },

    getOnlineStaffDevices: async (): Promise<OnlineStaffDevicesResponse[]> => {
        const response = await api.get<ApiEnvelope<OnlineStaffDevicesResponse[]>>("/api/PatronDevice/online-staff-devices");
        return unwrapApiEnvelope(response);
    },
    getCurrentHostName: async (): Promise<CurrentHostNameResponse> => {
        const res = await api.get(`/api/PatronDevice/client-name`);
        return unwrapApiEnvelope(res);
    }
};

export const renderDocumentService = {
    renderDocumentFile: async (pid: string, playerId: string): Promise<RenderDocumentResponse> => {
        const response = await api.get<ApiEnvelope<RenderDocumentResponse>>(`/api/Documents/policy/render`, {
            params: { pid, playerId }
        });
        return unwrapApiEnvelope(response);
    },

    getDocumentByPlayerId: async (request: CustomerConfirmationRequest): Promise<CustomerConfirmationResponse> => {
        const response = await api.post<ApiEnvelope<CustomerConfirmationResponse>>(`/api/Documents/confirmation`, request);
        return unwrapApiEnvelope(response);
    }
};

export const checkInformationService = {
    checkPatronIdentification: async (request: CheckPatronIdentificationRequest): Promise<boolean> => {
        const response = await api.post<ApiEnvelope<boolean>>("/api/RegistrationAdmin/patron/check-idcard", request);
        return unwrapApiEnvelope(response);
    },

    checkPhoneNumberExists: async (phoneNumber: string): Promise<boolean> => {
        const response = await api.get<ApiEnvelope<boolean>>("/api/RegistrationAdmin/patron/check-phone", {
            params: { phoneNumber }
        });
        return unwrapApiEnvelope(response);
    }
};

export const signatureService = {
    staffRequestSignature: async (request: StaffSignatureRequest): Promise<boolean> => {
        const response = await api.post<ApiEnvelope<boolean>>("/api/CustomerSign/request", request);
        return unwrapApiEnvelope(response);
    }
};

export const mappingDeviceService = {
    createMapping: async (request: CreateMappingRequest): Promise<CreateMappingResponse> => {
        const response = await api.post<ApiEnvelope<CreateMappingResponse>>("/api/DeviceMapping/create", request);
        return unwrapApiEnvelope(response);
    },

    getAllMappings: async (): Promise<MappingDataResponse[]> => {
        const response = await api.get<ApiEnvelope<MappingDataResponse[]>>("/api/DeviceMapping/list");
        return unwrapApiEnvelope(response);
    },

    getMappingByStaffDevice: async (staffDeviceName: string): Promise<GetMappingByStaffDeviceResponse | null> => {
        const response = await api.get<ApiEnvelope<GetMappingByStaffDeviceResponse | null>>(`/api/DeviceMapping/by-staff/${staffDeviceName}`);
        return unwrapApiEnvelope(response);
    },

    updateMapping: async (request: UpdateMappingRequest): Promise<UpdateMappingResponse> => {
        const response = await api.post<ApiEnvelope<UpdateMappingResponse>>("/api/DeviceMapping/update", request);
        return unwrapApiEnvelope(response);
    },

    getStaffAndPatronDevices: async (): Promise<StaffAndPatronDevicesResponse> => {
        const response = await api.get<ApiEnvelope<StaffAndPatronDevicesResponse>>("/api/DeviceMapping/staff-and-patron-devices");
        return unwrapApiEnvelope(response);
    },

    deleteMapping: async (mappingId: number): Promise<void> => {
        const response = await api.delete<ApiEnvelope<void>>(`/api/DeviceMapping/delete/${mappingId}`);
        return unwrapApiEnvelope(response);
    }
};

export const settingsService = {
    getAllSettings: async (): Promise<SettingsResponse[]> => {
        const res = await api.get("/api/settings/all");
        return unwrapApiEnvelope(res);
    },

    createSettings: async (data: CreateSettingsRequest): Promise<boolean> => {
        const res = await api.post("/api/settings/create", data);
        return unwrapApiEnvelope(res);
    },

    getSettingsInfor: async (): Promise<SettingsInfoResponse> => {
        const res = await api.get("/api/settings/info");
        return unwrapApiEnvelope(res);
    },

    clearCacheSetting: async (key: string): Promise<ClearCacheSettingResponse> => {
        const res = await api.post(`/api/settings/clear-cache/${key}`);
        return unwrapApiEnvelope(res);
    },

    getSettingDetail: async (key: string): Promise<SettingsResponse> => {
        const res = await api.get(`/api/settings/${key}`);
        return unwrapApiEnvelope(res);
    },

    updateSetting: async (key: string, data: UpdateSettingsRequest): Promise<UpdateSettingsResponse> => {
        const res = await api.post(`/api/settings/${key}`, data);
        return unwrapApiEnvelope(res);
    }
};

export const employeeService = {
    getEmployeePerformance: async (data: EmployeePerformanceRequest): Promise<EmployeePerformanceResponse> => {
        const res = await api.post(`/api/Employee/performance-report`, data);
        return unwrapApiEnvelope(res);
    },

    exportEmployeePerformanceExcel: async (data: EmployeePerformanceRequest): Promise<void> => {
        try {
            const response = await api.post(`/api/Employee/performance-report/excel`, data, {
                responseType: 'blob'
            });
            const blob = response.data;
            const cd = response.headers['content-disposition'] || '';
            const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd);
            const serverFileName = "employee_performance_report.xlsx";

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = serverFileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            if (error.response?.data instanceof Blob) {
                // If error response is JSON wrapped in Blob
                const text = await error.response.data.text();
                try {
                    const envelope = JSON.parse(text) as ApiEnvelope<unknown>;
                    throw new Error(getErrorMessage(envelope.data, `HTTP ${error.response.status}`));
                } catch {
                    throw new Error(`HTTP ${error.response?.status || 'Unknown error'}`);
                }
            }
            throw error;
        }
    }
};

export const auditLogService = {
    getAuditLogsFilterOptions: async (request: AuditLogPaginationRequest): Promise<AuditLogPaginationResponse> => {
        const response = await api.post<ApiEnvelope<AuditLogPaginationResponse>>("/api/AuditLog/paginate", request);
        return unwrapApiEnvelope(response);
    },

    getAuditLogById: async (auditLogId: number): Promise<AuditLogResponse> => {
        const response = await api.get<ApiEnvelope<AuditLogResponse>>(`/api/AuditLog/${auditLogId}`);
        return unwrapApiEnvelope(response);
    },

    getRegisteredLogs: async (request: AuditLogsRegisterMembershipRequest): Promise<AuditLogsRegisterMembershipPaginationResponse> => {
        const response = await api.post<ApiEnvelope<AuditLogsRegisterMembershipPaginationResponse>>("/api/AuditLog/audit-logs-membership/paginate", request);
        return unwrapApiEnvelope(response);
    },

    exportEnrolledEmployees: async (request: AuditLogsRegisterMembershipRequest): Promise<void> => {
        try {
            const response = await api.post(`/api/AuditLog/audit-logs-membership/export`, request, {
                responseType: 'blob'
            });
            const blob = response.data;
            const cd = response.headers['content-disposition'] || '';
            const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd);
            const serverFileName = "enrolled_report.xlsx";

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = serverFileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            if (error.response?.data instanceof Blob) {
                // If error response is JSON wrapped in Blob
                const text = await error.response.data.text();
                try {
                    const envelope = JSON.parse(text) as ApiEnvelope<unknown>;
                    throw new Error(getErrorMessage(envelope.data, `HTTP ${error.response.status}`));
                } catch {
                    throw new Error(`HTTP ${error.response?.status || 'Unknown error'}`);
                }
            }
            throw error;
        }
    }
};

export const manageDeviceService = {
    getAllDevices: async (): Promise<ManageDeviceResponse> => {
        const response = await api.get<ApiEnvelope<ManageDeviceResponse>>("/api/ManageDevice/all-devices");
        return unwrapApiEnvelope(response);
    },

    changeStatusDevice: async (request: ToggleDeviceRequest): Promise<boolean> => {
        const response = await api.post<ApiEnvelope<boolean>>(`/api/ManageDevice/toggle-active`, request);
        return unwrapApiEnvelope(response);
    },

    deleteDevice: async (request: DeleteDeviceRequest): Promise<boolean> => {
        const response = await api.post<ApiEnvelope<boolean>>(`/api/ManageDevice/delete`, request);
        return unwrapApiEnvelope(response);
    },

    changeHostname: async (request: ChangeHostnameRequest): Promise<boolean> => {
        const response = await api.post<ApiEnvelope<boolean>>(`/api/ManageDevice/change-hostname`, request);
        return unwrapApiEnvelope(response);
    }
};

export const syncService = {
    syncIncomeDocumentsByExcel: async (formData: FormData): Promise<SyncIncomeDocumentResponse> => {
        const response = await api.post<ApiEnvelope<SyncIncomeDocumentResponse>>("/api/SyncData/income/excel", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return unwrapApiEnvelope(response);
    },

    syncSinglePlayerIncomeDocument: async (request: SyncIncomeDocumentRequest): Promise<SyncIncomeDocumentResponse> => {
        const response = await api.post<ApiEnvelope<SyncIncomeDocumentResponse>>("/api/SyncData/income/single-player", request);
        return unwrapApiEnvelope(response);
    }
};

// Auth service for token validation
export const authService = {
    // Validate token by making a lightweight API call
    validateToken: async (): Promise<boolean> => {
        try {
            console.log('🔍 [Token Validation] Calling backend to validate token...');

            // Use a lightweight endpoint to check if token is valid
            // Add special header to prevent auto-redirect on 401
            await api.get('/api/RegistrationAdmin/ping', {
                headers: {
                    'X-Token-Validation': 'true'
                }
            });

            console.log('✅ [Token Validation] Backend accepted token - Token is VALID');
            return true;
        } catch (error: any) {
            // If 401, token is invalid
            if (error.response?.status === 401) {
                console.error('❌ [Token Validation] Backend rejected token - 401 Unauthorized');
                console.error('   → This could mean:');
                console.error('   1. Token expired');
                console.error('   2. Backend was restarted (if server_start validation enabled)');
                console.error('   3. Token signature invalid');
                console.error('   → User will be logged out');
                return false;
            }
            // For other errors (network, server error), assume token is still valid
            // to avoid unnecessary logouts
            console.warn('⚠️ [Token Validation] Check failed with non-401 error:', error.message);
            console.warn('   → Assuming token is still valid to avoid unnecessary logout');
            return true;
        }
    },

    // Check if token exists and is not expired (client-side check)
    isTokenExpired: (token: string | null): boolean => {
        if (!token) {
            console.log('🔍 [Token Expiration] No token provided');
            return true;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp;
            const iat = payload.iat;

            if (!exp) {
                console.log('⚠️ [Token Expiration] No exp claim in token');
                return false; // No expiration in token
            }

            // Check if token is expired (with 30 second buffer)
            const now = Math.floor(Date.now() / 1000);
            const expiresIn = exp - now;
            const tokenAge = now - (iat || now);

            const isExpired = exp < (now + 30);

            if (isExpired) {
                console.error('❌ [Token Expiration] Token EXPIRED');
                console.error(`   Token age: ${Math.floor(tokenAge / 60)} minutes`);
                console.error(`   Expired: ${Math.abs(expiresIn)} seconds ago`);
            } else {
                console.log(`✅ [Token Expiration] Token valid, expires in ${Math.floor(expiresIn / 60)} minutes`);
            }

            return isExpired;
        } catch (error) {
            console.error('❌ [Token Expiration] Error parsing token:', error);
            return true; // If we can't parse, assume expired
        }
    }
};