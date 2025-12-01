import axios from "axios";
import type { CheckPatronIdentificationRequest, CheckValidIncomeRequest, CheckValidIncomeResponse, CountryResponse, CreateMappingRequest, CreateMappingResponse, CurrentHostNameResponse, CurrentStaffDeviceResponse, GetAllMappingsResponse, GetMappingByStaffDeviceResponse, IncomeFileResponse, MappingDataResponse, OnlineStaffDevicesResponse, PatronImagesResponse, PatronRegisterMembershipRequest, PatronRegisterMembershipResponse, PatronResponse, RenderDocumentResponse, StaffAndPatronDevicesResponse, StaffSignatureRequest, UpdateMappingRequest, UpdateMappingResponse } from "../registrationType";

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
            // Only redirect if this is not a login request
            const isLoginRequest = error.config?.url?.includes('/api/auth/login');

            if (!isLoginRequest) {
                // Clear token and redirect to login for authenticated requests
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userRole');
                window.location.href = '/login';
            }
        }
        // Check if it's a network error
        if (!error.response && error.code === 'ERR_NETWORK') {
            console.error('Network error detected:', error.message);
            // Có thể dispatch event để update network status
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