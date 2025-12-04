import axios from "axios";
import { showSessionExpiredNotification } from '../utils/sessionExpiredNotification';
import type {
  ChangeQueueStatusResponse, RegisterMemberRequest,
  RegisterNewUserRequest, TicketResponse, TicketStatusResponse,
  ChangeQueueStatusRequest, GetQueueStatusRequest, GetQueueStatusResponse, GetQueueStatusData,
  GetMembershipRequest,
  GetMembershipResponse,
  LoginResponse,
  LoginRequest,
  RetrievePickUpTicketResponse,
  DashboardResponse,
  CounterDashboardResponse,
  IssuedProcessedByHourResponse,
  ServiceTypePerformanceResponse,
  CountersReportResponse,
  ChangeStatusCounterResponse,
  QueueTicketCanBeArchivedResponse,
  ArchiveTicketRequest,
  ArchiveTicketResponse,
  TicketsInProcessResponse,
  ChangeHostNameCounterRequest,
  ChangeHostNameCounterResponse,
  EmployeePerformanceResponse,
  EmployeePerformanceRequest,
  CurrentCounterResponse,
  SettingsResponse,
  CreateSettingsRequest,
  SettingsInfoResponse,
  ClearCacheSettingResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse
} from "../type";

// Action constants for updateTicketStatus
export const QUEUE_ACTIONS = {
  PICKUP: 1,
  RETRIEVE: 2,
  PRIORITY: 3,
  DONE: 4,
  STORED: 5
} as const;

// Status constants (adjust based on your system)
export const QUEUE_STATUS = {
  Waiting: 1,
  Processing: 2,
  Called: 3,
  Stored: 4,
  Completed: 5,
  //NoShow: 6
} as const;

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

export const adminReportService = {
  getIssuedProcessedByHour: async (date: string, startHour: number, endHour: number): Promise<IssuedProcessedByHourResponse> => {
    const res = await api.get(`/api/Reports/issued-processed-by-hour?date=${date}&startHour=${startHour}&endHour=${endHour}`);
    return unwrapApiEnvelope(res);
  },

  getIssuedProcessedByHourExcel: async (date: string, startHour: number, endHour: number): Promise<void> => {
    try {
      const response = await api.get(`/api/Reports/export-issued-processed-by-hour?date=${date}&startHour=${startHour}&endHour=${endHour}`, {
        responseType: 'blob'
      });
      const blob = response.data;
      const cd = response.headers['content-disposition'] || '';
      const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd);
      const serverFileName = match ? decodeURIComponent(match[1].replace(/"/g, "")) : `IssuedProcessedByHour_${date}_${startHour}h-${endHour}h.xlsx`;

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
  },

  getGetServiceTypePerformanceExcel: async (startDate: string, endDate: string, timezoneOffsetMinutes: number, targetWaitingMinutes: number): Promise<void> => {
    try {
      const response = await api.get(`/api/Reports/export-service-performance?startDate=${startDate}&endDate=${endDate}&timezoneOffsetMinutes=${timezoneOffsetMinutes}&targetWaitingMinutes=${targetWaitingMinutes}`, {
        responseType: 'blob'
      });
      const blob = response.data;
      const cd = response.headers['content-disposition'] || '';
      const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd);
      const serverFileName = match ? decodeURIComponent(match[1].replace(/"/g, "")) : `ServicePerformanceReport_${startDate}_to_${endDate}_target${targetWaitingMinutes}min.xlsx`;

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
  },

  getServicesReport: async (startDate: string, endDate: string, timezoneOffsetMinutes: number, targetWaitingMinutes: number): Promise<ServiceTypePerformanceResponse> => {
    const res = await api.get(`/api/Reports/service-performance-by-type?startDate=${startDate}&endDate=${endDate}&timezoneOffsetMinutes=${timezoneOffsetMinutes}&targetWaitingMinutes=${targetWaitingMinutes}`);
    return unwrapApiEnvelope(res);
  }
}

export const ticketArchivedService = {
  getArchivedTickets: async (): Promise<QueueTicketCanBeArchivedResponse[]> => {
    const res = await api.get("/api/TicketArchive/list-archived-tickets");
    return unwrapApiEnvelope(res) as any;
  },

  archiveTicket: async (data: ArchiveTicketRequest): Promise<ArchiveTicketResponse> => {
    const res = await api.post(`/api/TicketArchive/archive-ticket`, data);
    return unwrapApiEnvelope(res);
  }
}

export const counterService = {
  getCountersReport: async (): Promise<CountersReportResponse[]> => {
    const res = await api.get("/api/counter/counters-report");
    return unwrapApiEnvelope(res);
  },

  changeStatusCounter: async (counterId: number): Promise<ChangeStatusCounterResponse> => {
    const res = await api.post(`/api/counter/change-status/${counterId}`);
    return unwrapApiEnvelope(res);
  },

  changeHostNameCounter: async (data: ChangeHostNameCounterRequest): Promise<ChangeHostNameCounterResponse> => {
    const res = await api.post(`/api/counter/change-hostname`, data);
    return unwrapApiEnvelope(res);
  },

  checkedHostName: async (data: { hostName: string }): Promise<boolean> => {
    const res = await api.get(`/api/counter/checked-hostname?hostName=${encodeURIComponent(data.hostName)}`);
    return unwrapApiEnvelope(res);
  },

  getCurrentCounter: async (): Promise<CurrentCounterResponse> => {
    const res = await api.get(`/api/counter/current`);
    return unwrapApiEnvelope(res);
  }
};

export const queueAdminService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post("/api/auth/login", data);
    return unwrapApiEnvelope(res);
  },
  getSummary: async (): Promise<DashboardResponse> => {
    const res = await api.get("/api/Dashboard/summary");
    return unwrapApiEnvelope(res);
  },
  getcountersSummary: async (): Promise<CounterDashboardResponse[]> => {
    const res = await api.get("/api/Dashboard/counters-summary");
    return unwrapApiEnvelope(res);
  },
  getTicketsByStatus: async (data: GetQueueStatusRequest): Promise<GetQueueStatusResponse> => {
    const res = await api.post("/api/QueueAdmin/list-queue", data);
    const result = unwrapApiEnvelope(res) as any;

    // If the API returns an object with pagination info
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return {
        data: result.data || result.list || [],
        totalRecords: result.totalRecords || result.total || 0,
        page: result.page || 1,
        pageSize: result.pageSize || data.take || 10,
        totalPages: result.totalPages || Math.ceil((result.totalRecords || result.total || 0) / (data.take || 10)),
        hasPrevious: result.hasPrevious || false,
        hasNext: result.hasNext || false
      } as GetQueueStatusResponse;
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
      hasNext: false
    } as GetQueueStatusResponse;
  },
  updateTicketStatus: async (data: ChangeQueueStatusRequest): Promise<ChangeQueueStatusResponse> => {
    const res = await api.post("/api/QueueAdmin/change-status", data);
    return unwrapApiEnvelope(res);
  },
  pickupPriorityTicket: async (data: { ticketId: number }): Promise<TicketResponse | null> => {
    // Use updateTicketStatus with PRIORITY action
    const updateRequest: ChangeQueueStatusRequest = {
      ticketId: data.ticketId,
      status: QUEUE_STATUS.Processing,
      action: QUEUE_ACTIONS.PRIORITY
    };

    const result = await queueAdminService.updateTicketStatus(updateRequest);

    // Convert ChangeQueueStatusResponse to TicketResponse format
    if (result.isChangeSuccess) {
      return {
        ticketId: result.ticketId,
        patronId: result.playerId,
        counterId: result.counterId,
        ticketNumber: result.ticketNumber,
        ticketDate: result.ticketDate,
        status: result.statusName,
        qrCodeUrl: "", // Not available in response
        message: "Priority pickup successful",
        fullName: result.fullName,
        phone: result.phone,
        email: result.email
      } as TicketResponse;
    }

    return null;
  },
  pickupRetrieveTicket: async (data: { ticketId: number }): Promise<RetrievePickUpTicketResponse | null> => {
    // Use updateTicketStatus with RETRIEVE action
    const updateRequest: ChangeQueueStatusRequest = {
      ticketId: data.ticketId,
      status: QUEUE_STATUS.Processing,
      action: QUEUE_ACTIONS.RETRIEVE
    };

    const result = await queueAdminService.updateTicketStatus(updateRequest);

    // Convert ChangeQueueStatusResponse to RetrievePickUpTicketResponse format
    if (result.isChangeSuccess) {
      return {
        ticketId: result.ticketId,
        ticketNumber: result.ticketNumber,
        fullName: result.fullName,
        phone: result.phone,
        email: result.email,
        status: result.status,
        statusName: result.statusName,
        playerId: result.playerId,
        passportNumber: result.passportNumber,
        counterName: result.counterName,
        ticketDate: result.ticketDate,
        type: result.type,
        isChangeSuccess: result.isChangeSuccess
      } as RetrievePickUpTicketResponse;
    }

    return null;
  },

  getTicketsInprocess: async (): Promise<TicketsInProcessResponse> => {
    const res = await api.get(`/api/QueueAdmin/tickets-inprocess`);
    const result = unwrapApiEnvelope(res) as any;
    return result || [];
  },

  // Helper functions for specific actions
  pickupTicket: async (ticketId: number, status: number = QUEUE_STATUS.Processing): Promise<ChangeQueueStatusResponse> => {
    const data: ChangeQueueStatusRequest = {
      ticketId,
      status,
      action: QUEUE_ACTIONS.PICKUP
    };
    return await queueAdminService.updateTicketStatus(data);
  },

  retrieveTicket: async (ticketId: number, status: number = QUEUE_STATUS.Processing): Promise<ChangeQueueStatusResponse> => {
    const data: ChangeQueueStatusRequest = {
      ticketId,
      status,
      action: QUEUE_ACTIONS.RETRIEVE
    };
    return await queueAdminService.updateTicketStatus(data);
  },

  priorityTicket: async (ticketId: number, status: number = QUEUE_STATUS.Processing): Promise<ChangeQueueStatusResponse> => {
    const data: ChangeQueueStatusRequest = {
      ticketId,
      status,
      action: QUEUE_ACTIONS.PRIORITY
    };
    return await queueAdminService.updateTicketStatus(data);
  },

  // General function for any action
  changeTicketStatus: async (ticketId: number, status: number, action: number): Promise<ChangeQueueStatusResponse> => {
    const data: ChangeQueueStatusRequest = {
      ticketId,
      status,
      action
    };
    return await queueAdminService.updateTicketStatus(data);
  }
};

export const membershipService = {
  getmembership: async (data: GetMembershipRequest): Promise<GetMembershipResponse> => {
    const res = await api.post("/api/membership/get-membership", data);
    return unwrapApiEnvelope(res);
  }
}

export const queueService = {
  registerNewUser: async (data: RegisterNewUserRequest): Promise<TicketResponse> => {
    const res = await api.post("/api/queue/register", data);
    return unwrapApiEnvelope(res);
  },
  registerByMember: async (data: RegisterMemberRequest): Promise<TicketResponse> => {
    const res = await api.post("/api/queue/register-member", data);
    return unwrapApiEnvelope(res);
  },
  getTicketStatus: async (ticketId: number): Promise<TicketStatusResponse> => {
    const res = await api.get(`/api/queue/ticket/${ticketId}`);
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
      const serverFileName = match ? decodeURIComponent(match[1].replace(/"/g, "")) : `EmployeePerformance_${getPeriodTypeName(data.PeriodType)}.xlsx`;

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

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string") return data || fallback;
  try {
    return JSON.stringify(data) || fallback;
  } catch {
    return fallback;
  }
}

const getPeriodTypeName = (type: number) => {
  switch (type) {
    case 1: return "Daily";
    case 2: return "Weekly";
    case 3: return "Monthly";
    default: return "Daily";
  }
};
