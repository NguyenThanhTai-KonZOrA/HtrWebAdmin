import axios from "axios";
import { showSessionExpiredNotification } from '../utils/sessionExpiredNotification';
import type {
  LoginResponse,
  LoginRequest,
  RefreshTokenRequest
} from "../type";


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

        // Show user-friendly message
        showSessionExpiredNotification();

        // Delay redirect to show notification
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
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
}

export const authAdminService = {

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const res = await api.post("/api/auth/login", data);
      return unwrapApiEnvelope(res);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.response?.data, 'Login failed. Please try again.');
      throw new Error(errorMessage);
    }
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<LoginResponse> => {
    const res = await api.post("/api/auth/refresh-token", data);
    return unwrapApiEnvelope(res);
  },

  revokeToken: async (): Promise<void> => {
    const res = await api.post("/api/auth/revoke-token");
    return unwrapApiEnvelope(res);
  }
};


function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string" && data.length <= 200) {
    return data || fallback;
  } else if (data && typeof data === "object") {
    try {
      return JSON.stringify(data) || fallback;
    } catch {
      return fallback;
    }
  } else {
    return fallback;
  }
}