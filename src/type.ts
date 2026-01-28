export interface RegisterNewUserRequest {
  fullName: string;
  phone: string;
  email: string;
  counterId: number;
  device: string;
  serviceType: number;
  playerId?: number;
  passportNumber?: string;
  playerName?: string;
}

export interface RegisterMemberRequest {
  memberId: string;
  counterId: number;
}

export interface TicketResponse {
  ticketId: number;
  patronId: number;
  counterId: number;
  ticketNumber: number;
  ticketDate: string;
  status: string;
  qrCodeUrl: string;
  message: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface TicketStatusResponse {
  ticketNumber: number;
  peopleAhead: number;
  serviceName: string;
  issueTime: string;
  issueDate: string;
  showImportant?: boolean;
}

export interface ChangeQueueStatusRequest {
  ticketId: number;
  status: number;
  action: number;
}

export interface ChangeQueueStatusResponse {
  ticketId: number;
  ticketNumber: number;
  fullName: string;
  phone: string;
  email: string;
  status: number;
  statusName: string;
  playerId: number;
  passportNumber: string;
  ticketDate: string;
  type: string;
  isChangeSuccess: boolean;
  counterId: number;
  counterName: string;
  timestamp: string;
  message: string;
}

export interface GetQueueStatusRequest {
  status: number;
  take: number;
  skip?: number;
  page?: number;
  pageSize?: number;
}

export interface GetQueueStatusResponse {
  data: GetQueueStatusData[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface GetQueueStatusData {
  ticketId: number;
  ticketNumber: number;
  fullName: string;
  phone: string;
  email: string;
  status: number;
  statusName: string;
  playerId: number;
  passportNumber: string;
  counterName: string;
  ticketDate: string;
  type: string;
}

export interface PriorityPickUpTicketResponse {
  ticketId: number;
  ticketNumber: number;
  fullName: string;
  phone: string;
  email: string;
  status: number;
  statusName: string;
  playerId: number;
  passportNumber: string;
  counterName: string;
  ticketDate: string;
  type: string;
  isChangeSuccess: boolean;
}

export interface RetrievePickUpTicketResponse {
  ticketId: number;
  ticketNumber: number;
  fullName: string;
  phone: string;
  email: string;
  status: number;
  statusName: string;
  playerId: number;
  passportNumber: string;
  counterName: string;
  ticketDate: string;
  type: string;
  isChangeSuccess: boolean;
}

export interface GetMembershipRequest {
  playerId: number;
  passportNumber: string
}

export interface GetMembershipResponse {
  playerId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  passportNumber: string;
}

export type LoginRequest = {
  userName: string;
  password: string;
}

export type LoginResponse = {
  userName: string;
  token: string;
  refreshToken: string;
  role: string;
  employeeId: number;
  employeeCode: string;
  tokenExpiration: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface DashboardResponse {
  totalCustomers: number;
  totalServices: number;
  totalCounters: number;
  customersServedToday: number;
  customersWaiting: number;
  customersInService: number;
  customersStored: number;
  averageWaitingMinutes: number;
  waitingExceeds: number;
  averageServingMinutes: number;
  servingExceeds: number;
  averageWaitingTime: string;
  averageServingTime: string;
}

export interface CounterDashboardResponse {
  Id: number;
  counterName: string;
  description: string;
  hostName: string;
  status: boolean;
  statusName: string;
  averageServingMinutes: number;
  averageServingTime: string;
}

export interface IssuedProcessedByHourResponse {
  date: Date;
  startHour: number;
  endHour: number;
  rows: IssuedProcessedByHourRowResponse[];
  overall: IssuedProcessedByHourRowResponse;
}

export interface IssuedProcessedByHourRowResponse {
  timeOfDay: string;
  customerArrived: number;
  customerServed: number;
  counterActive: number;
  averageWaitingMinutes: number;
  avgWaitingTime: string;
}

export interface ServiceTypePerformanceResponse {
  StartDateLocal: Date;
  EndDateLocal: Date;
  TimezoneOffsetMinutes: number;
  TargetWaitingMinutes: number;
  rows: ServiceTypePerformanceRowResponse[];
  overall: ServiceTypePerformanceRowResponse;
}


export interface ServiceTypePerformanceRowResponse {
  serviceName: string;
  totalTicketServed: number;
  targetWaitingMinutes: number;
  withinTarget: number;
  withinTargetPercent: number;
  exceedTarget: number;
  exceedTargetPercent: number;
  averageWaitingMinutes: number;
  avgWaitingTime: string;
}

export interface CountersReportResponse {
  id: number;
  counterName: string;
  description: string;
  hostName: string;
  status: boolean;
  statusName: string;
  createdAt: string;
  createdBy: string;
  averageServingMinutes: number;
  averageServingTime: string;
}

export interface ChangeStatusCounterResponse {
  isChangeSuccess: boolean;
}

export interface ArchiveTicketRequest {
  TicketDates: string[];
  Remarks: string;
}

export interface ArchiveTicketResponse {
  isArchiveSuccess: boolean;
  totalTicketsArchived: number;
}

export interface QueueTicketCanBeArchivedResponse {
  date: string;
  totalCustomers: number;
  totalServices: number;
  totalCounters: number;
  customersServed: number;
  customersWaiting: number;
  customersInService: number;
  customersStored: number;
}

export interface TicketsInProcessResponse {
  ticketsInProcessTotal: number;
  isMissingTicket: boolean;
  data: TicketsInProcessData[];
}

export interface TicketsInProcessData {
  ticketId: number;
  ticketNumber: number;
  fullName: string;
  phone: string;
  email: string;
  status: number;
  statusName: string;
  playerId: number;
  passportNumber: string;
  counterName: string;
  ticketDate: string;
  type: string;
}

export interface ChangeHostNameCounterRequest {
  counterId: number;
  hostName: string;
}

export interface ChangeHostNameCounterResponse {
  isChangeSuccess: boolean;
  counterId: number;
  hostName: string;
}

export interface EmployeePerformanceRequest {
  StartDate: string;
  EndDate: string;
  EmployeeId?: number;
  EmployeeCode?: string;
  PeriodType: number;
}


export interface EmployeePerformanceResponse {
  startDate: string;
  endDate: string;
  periodType: number;
  rows: EmployeePerformanceRowResponse[];
  overall: EmployeePerformanceRowResponse;
}

export interface EmployeePerformanceRowResponse {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  department: string;
  totalTicketsServed: number;
  newMembershipCount: number;
  existingMembershipCount: number;
  newMembershipAvgWaitingMinutes: number;
  newMembershipAvgServingMinutes: number;
  existingMembershipAvgWaitingMinutes: number;
  existingMembershipAvgServingMinutes: number;
  averageWaitingMinutes: number;
  averageWaitingTime: string;
  averageServingMinutes: number;
  averageServingTime: string;
  totalWorkingHours: number;
  ticketsPerHour: number;
}

export interface CurrentCounterResponse {
  id: number;
  name: string;
  description: string;
  hostName: string;
  status: boolean;
  statusName: string;
}

export interface SettingsResponse {
  id: number;
  key: string;
  value: string;
  description: string;
  category: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  isActive: boolean;
}

export interface CreateSettingsRequest {
  key: string;
  value: string;
  description: string;
  category: string;
  dataType: string;
}

export interface SettingsInfoResponse {
  cacheExpirationMinutes: number;
  categories: CategoriesofSettingsResponse[],
  dataType: []
}

export interface CategoriesofSettingsResponse {
  name: string;
  description: string;
  appliesImmediately: boolean;
}

export interface DataTypesofSettingsResponse {

}

export interface ClearCacheSettingResponse {
  message: string;
  key: string;
}

export interface UpdateSettingsRequest {
  key: string;
  value: string;
}

export interface UpdateSettingsResponse {
  key: string;
  value: string;
  requiresRestart: boolean;
  warning: string;
  appliedAt: string;
}

export interface ManageDeviceResponse {
  patronDevices: DeviceInfo[];
  staffDevices: DeviceInfo[];
  totalPatronDevices: number;
  totalStaffDevices: number;
}

export interface DeviceInfo {
  id: number;
  deviceName: string;
  deviceType: string; // "Staff" or "Patron"
  macAddress: string;
  ipAddress: string;
  isOnline: boolean;
  isActive: boolean;
  connectionId: string;
  staffUserName: string;
  lastHeartbeat: string;
  createdAt: string;
  updatedAt: string;
  status: boolean;
  lastActiveAt: string;
}

export interface ToggleDeviceRequest {
  deviceId: number;
  deviceType: string; // "Staff" or "Patron"
  isActive: boolean;
}

export interface DeleteDeviceRequest {
  deviceId: number;
  deviceType: string; // "Staff" or "Patron"
}

export interface ChangeHostnameRequest {
  deviceId: number;
  deviceType: string; // "Staff" or "Patron"
  newHostname: string;
}

export interface CustomerConfirmationRequest {
  playerId: number;
}

export interface CustomerConfirmationResponse {
  documentPath?: string;
  documentType: string;
  confirmationDate?: string;
  registrationType?: number;
  htrFormPath?: string;
  notificationPath?: string;
  htrMembershipTCPath?: string;
  isVietnamese?: boolean;
  fullName?: string;
  identificationNumber?: string;
}