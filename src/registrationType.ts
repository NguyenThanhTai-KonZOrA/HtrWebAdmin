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
    hostName: string;
    location: string;
    assignedStaffId: string;
}

export interface CheckPatronIdentificationRequest {
    IdType?: number;
    PassportNumber?: string;
}