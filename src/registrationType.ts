export interface CheckValidIncomeRequest {
    PatronId: number;
    IncomeDocument: string;
    ExpireDate: string;
    Files: FileDataRequest[];
}

export interface CheckValidIncomeResponse {
    isValid: boolean;
}

export interface FileDataRequest {
    batchId: string;
    id: string;
    originalName: string;
    url: string;
    size: number;
    savedAs: string;
}

export interface PatronPagingRequest {
    IsMembership: boolean;
    Page: number;
    PageSize: number;
    Take?: number;
    Skip?: number;
    SearchTerm?: string;
}

export interface PatronPagingResponse {
    totalRecords: number;
    data: PatronResponse[];
}

export interface PatronResponse {
    pid: number;
    playerId: number;
    isValidIncomeDocument: boolean;
    incomeDocument: string;
    incomeExpiryDate: string;
    isHaveMembership: boolean;
    firstName: string;
    lastName: string;
    jobTitle: string;
    position: string;
    gender: string;
    birthday: string;
    address: string;
    addressInVietNam: string;
    country: string;
    createdTime: string;
    mobilePhone: string;
    identificationTypeId: number;
    identificationNumber: string;
    identificationDate: string;
    identificationCountry: string;
    identificationExpiration: string;
    incomeFiles: FileDataRequest[];
    submitType: number;
    isSigned: boolean;
    isUpdated: boolean;
}

export interface PatronImagesResponse {
    patronId: number;
    frontImage: string;
    backImage: string;
    selfieImage: string;
}

export interface UpdatePatronRequest {
    PID: number;
    PlayerId: number;
    IsValidIncomeDocument: boolean;
    IncomeDocument: string;
    IncomeExpiryDate: string;
    IsHaveMembership: boolean;
    FirstName: string;
    LastName: string;
    JobTitle: string;
    Position: string;
    Gender: string;
    Birthday: string;
    Address: string;
    AddressInVietNam: string;
    Country: string;
    CreatedTime: string;
    MobilePhone: string;
    IdentificationTypeId: number;
    IdentificationNumber: string;
    IdentificationDate: string;
    IdentificationCountry: string;
    IdentificationExpiration: string;
    IncomeFiles: FileDataRequest[];
}

export interface PatronRegisterMembershipRequest {
    PatronId: number;
}

export interface PatronRegisterMembershipResponse {
    membershipNumber: string;
    phoneNumber: string;
}

export interface CountryResponse {
    countryID: number;
    countryDescription: string;
    abrv2: string;
    abrv3: string;
}

export interface CurrentStaffDeviceResponse {
    id: number;
    staffDeviceId: number;
    deviceName: string;
    hostName: string;
    location: string;
    assignedStaffId: string;
    connectionId: string;
}

export interface CheckPatronIdentificationRequest {
    IdType?: number;
    PassportNumber?: string;
}

export interface StaffSignatureRequest {
    PatronId: number;
}

export interface IncomeFileResponse {
    totalBatches: number;
    batches: BatchesDataResponse[];
    totalFiles: number;
}

export interface BatchesDataResponse {
    id: number;
    batchId: string;
    originalName: string;
    savedAs: string;
    url: string;
    size: number;
    contentType: string;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
    expireAt: string;
}

export interface RenderDocumentResponse {
    htmlContent: string;
}

export interface CreateMappingRequest {
    StaffDeviceName: string;
    PatronDeviceName: string;
    Location: string;
}

export interface CreateMappingResponse {
    id: number;
    staffDeviceId: number;
    staffDeviceName: string;
    patronDeviceId: number;
    patronDeviceName: string;
    location: string;
    isActive: boolean;
    lastVerified: string;
}

export interface GetAllMappingsResponse {
    count: number;
    data: MappingDataResponse[];
}

export interface MappingDataResponse {
    id: number;
    staffDeviceId: number;
    staffDeviceName: string;
    staffIp: string;
    staffDeviceIsOnline: boolean;
    patronDeviceId: number;
    patronDeviceName: string;
    patronIp: string;
    patronIsOnline: boolean;
    location: string;
    notes: string;
    isActive: boolean;
    lastVerified: string;
    createdAt: string;
}

export interface GetMappingByStaffDeviceResponse {
    id: number;
    staffDeviceId: number;
    staffDeviceName: string;
    patronDeviceId: number;
    patronDeviceName: string;
    location: string;
    isActive: boolean;
    lastVerified: string;
}

export interface UpdateMappingRequest {
    Id: number;
    NewStaffDeviceName: string;
    NewPatronDeviceName: string;
    Location: string;
    Notes: string;
}

export interface UpdateMappingResponse {
    id: number;
    staffDeviceId: number;
    staffDeviceName: string;
    patronDeviceId: number;
    patronDeviceName: string;
    location: string;
    notes: string;
    isActive: boolean;
    lastVerified: string;
    updatedAt: string;
}

export interface StaffAndPatronDevicesResponse {
    staffDevices: StaffDeviceResponse[];
    patronDevices: PatronDeviceResponse[];
}

export interface StaffDeviceResponse {
    staffDeviceId: number;
    staffDeviceName: string;
}

export interface PatronDeviceResponse {
    patronDeviceId: number;
    patronDeviceName: string;
}

export interface OnlineStaffDevicesResponse {
    id: number;
    deviceName: string;
    connectionId: string;
    isOnline: boolean;
    ipAddress: string;
    staffUserName: string;
    lastHeartbeat: string;
}

export interface CurrentHostNameResponse {
    computerName: string;
    ip: string;
}

export interface SyncPatronImagesRequest {
    PatronId: number;
    PlayerId: number;
    Reason: string;
}

export interface AuditLogPaginationRequest {
    Page: number;
    PageSize: number;
    Take?: number;
    Skip?: number;
    FromDate?: string;
    ToDate?: string;
    Action?: string;
    UserName?: string;
    IsSuccess?: boolean;
    EntityType?: string;
}

export interface AuditLogPaginationResponse {
    page: number;
    pageSize: number;
    totalRecords: number;
    logs: AuditLogResponse[];
}

export interface AuditLogResponse {
    id: number;
    userName: string;
    action: string;
    entityType: string;
    httpMethod: string;
    requestPath: string;
    ipAddress: string;
    userAgent: string;
    isSuccess: boolean;
    statusCode: number;
    errorMessage: string;
    details: string;
    createdAt: string;
    entityId: string;
    timestamp: string;
}

export interface AuditLogsRegisterMembershipRequest {
    PlayerId: number;
    ActionType: string;
    MembershipStatus: string;
    FromDate: string;
    ToDate: string;
    UserName?: string;
    Page: number;
    PageSize: number;
    Take?: number;
    Skip?: number;
}

export interface AuditLogsRegisterMembershipPaginationResponse {
    totalRecords: number;
    page: number;
    pageSize: number;
    logs: AuditLogsRegisterMembershipResponse[];
}

export interface AuditLogsRegisterMembershipResponse {
    id: number;
    actionType: string;
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    actionDate: string;
    playerId: number;
    membershipStatus: string;
    isSuccess: boolean;
    errorMessage: string;
    details: string;
}