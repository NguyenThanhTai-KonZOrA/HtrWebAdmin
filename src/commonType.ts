import type { Permission } from "./constants/roles";

export interface NavItem {
    key: string;
    title: string;
    href: string;
    icon: React.ElementType;
    requiredPermission?: Permission;
}

export type ApiEnvelope<T> = {
    status: number;
    data: T;
    success: boolean;
};

// Job Title options
export const JOB_TITLE_OPTIONS = [
    { value: 'Employed', label: 'Employed' },
    { value: 'Self-employed', label: 'Self-employed' },
    { value: 'Unemployed', label: 'Unemployed' },
    { value: 'Other', label: 'Other (Please specify your occupation)' }
];

// Position options
export const POSITION_OPTIONS = [
    { value: 'Owner / Executive Director', label: 'Owner / Executive Director' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Staff / Employee', label: 'Staff / Employee' },
    { value: 'Professional', label: 'Professional (e.g., lawyer, doctor, engineer)' },
    { value: 'Other', label: 'Other (please specify)' }
];

// ID Type options
export const ID_TYPE_OPTIONS = [
    { value: 1, label: 'ID Card' },
    { value: 0, label: 'Passport' }
];

// Gender options
export const GENDER_OPTIONS = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
];
