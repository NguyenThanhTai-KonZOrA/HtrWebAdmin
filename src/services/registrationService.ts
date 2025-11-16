import axios from "axios";
import type { CheckValidIncomeRequest, CheckValidIncomeResponse, CountryResponse, CurrentStaffDeviceResponse, PatronImagesResponse, PatronRegisterMembershipRequest, PatronRegisterMembershipResponse, PatronResponse } from "../registrationType";

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

    getIncomeFile: async (pid: number, playerId: number): Promise<File> => {
        const response = await api.get<File>(`/api/RegistrationAdmin/income/files`, {
            params: { pid, playerId },
            responseType: 'blob'
        });
        return response.data;
    },

    deleteIncomeFile: async (batchId: string, saveAs: string): Promise<void> => {
        const response = await api.post<ApiEnvelope<void>>(`/api/RegistrationAdmin/income/delete/file`, {
            params: { batchId, saveAs }
        });
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
    }
};

export const renderDocumentService = {
    renderDocumentFile: async (pid: string, playerId: string): Promise<string> => {
        const response = await api.get<ApiEnvelope<{ html: string }>>(`/api/Documents/policy/render`, {
            params: { pid, playerId }
        });
        const result = unwrapApiEnvelope(response);
        return result.html;
    }
};