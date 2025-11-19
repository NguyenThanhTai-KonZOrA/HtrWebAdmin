import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar,
    IconButton,
    Tooltip,
    Stack,
    FormHelperText,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormLabel,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    CloudDownload as DownloadIcon,
    CheckCircle as CheckCircleIcon,
    Refresh as RefreshIcon,
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Send as SendIcon
} from '@mui/icons-material';
import {
    patronService,
    incomeDocumentService,
    renderDocumentService,
    checkInformationService,
    signatureService
} from '../services/registrationService';
import type {
    PatronResponse,
    CountryResponse,
    PatronImagesResponse,
    CheckValidIncomeRequest,
    FileDataRequest,
    PatronRegisterMembershipRequest,
    StaffSignatureRequest,
    IncomeFileResponse,
    BatchesDataResponse
} from '../registrationType';
import AdminLayout from '../layout/AdminLayout';
import { useSetPageTitle } from '../hooks/useSetPageTitle';
import { PAGE_TITLES } from '../constants/pageTitles';
import { useAppData } from '../contexts/AppDataContext';
import { useSignalR } from '../hooks/useSignalR';
import Swal from 'sweetalert2';
import { FormatUtcTime } from '../utils/formatUtcTime';


function formatDate(dateString: string): string {
    dateString = FormatUtcTime.formatDateTime(dateString);
    try {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}

function getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

// Job Title options
const JOB_TITLE_OPTIONS = [
    { value: 'Employed', label: 'Employed' },
    { value: 'Self-employed', label: 'Self-employed' },
    { value: 'Unemployed', label: 'Unemployed' },
    { value: 'Other', label: 'Other' }
];

// Position options
const POSITION_OPTIONS = [
    { value: 'Owner / Executive Director', label: 'Owner / Executive Director' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Staff', label: 'Staff' },
    { value: 'Professional', label: 'Professional' },
    { value: 'Other', label: 'Other' }
];

// ID Type options
const ID_TYPE_OPTIONS = [
    { value: 1, label: 'ID Card' },
    { value: 0, label: 'Passport' }
];

// Gender options
const GENDER_OPTIONS = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
];
const Api_URL = (window as any)._env_?.API_BASE || '';
const VIETNAM_COUNTRY_ID = 704;

const AdminRegistrationPage: React.FC = () => {
    useSetPageTitle(PAGE_TITLES.REGISTRATION);

    // Get global data from context
    const { countries, staffDevice, loading: contextLoading } = useAppData();

    // Only initialize SignalR after context has loaded and we have staffDeviceId
    // This prevents the "staffDeviceId is null" issue
    const signalR = useSignalR(contextLoading ? undefined : staffDevice?.staffDeviceId);

    // States
    const [loadingNewReg, setLoadingNewReg] = useState(true);
    const [loadingMembership, setLoadingMembership] = useState(true);
    const [newRegistrations, setNewRegistrations] = useState<PatronResponse[]>([]);
    const [memberships, setMemberships] = useState<PatronResponse[]>([]);

    // Search and pagination states
    const [newRegSearch, setNewRegSearch] = useState('');
    const [membershipSearch, setMembershipSearch] = useState('');
    const [newRegPage, setNewRegPage] = useState(0);
    const [membershipPage, setMembershipPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPatron, setSelectedPatron] = useState<PatronResponse | null>(null);
    const [patronImages, setPatronImages] = useState<PatronImagesResponse | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedPatron, setEditedPatron] = useState<PatronResponse | null>(null);

    // Specify fields for "Other" selections
    const [specifyJobTitle, setSpecifyJobTitle] = useState('');
    const [specifyPosition, setSpecifyPosition] = useState('');

    // Income document states
    const [incomeDocument, setIncomeDocument] = useState('');
    const [expireDate, setExpireDate] = useState('');
    const [approvingIncome, setApprovingIncome] = useState(false);
    const [incomeApproved, setIncomeApproved] = useState(false);

    // Enroll player states
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [enrolling, setEnrolling] = useState(false);

    // Document HTML states
    const [documentHtml, setDocumentHtml] = useState<string>('');
    const [loadingDocument, setLoadingDocument] = useState(false);

    // Validation errors
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Validation warnings for duplicate check
    const [phoneNumberWarning, setPhoneNumberWarning] = useState<string>('');
    const [idNumberWarning, setIdNumberWarning] = useState<string>('');
    const [checkingPhone, setCheckingPhone] = useState(false);
    const [checkingId, setCheckingId] = useState(false);

    // Error and success states (for page level - using Snackbar)
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'info'
    });

    // Error and success states (for dialog level)
    const [dialogError, setDialogError] = useState<string | null>(null);
    const [dialogSuccess, setDialogSuccess] = useState<string | null>(null);

    // Track if patron has been updated
    const [patronUpdated, setPatronUpdated] = useState(false);

    // Track if there are unsaved changes
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Image viewer state
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>('');

    // Highlighted patron state (for SignalR signature completed)
    const [highlightedPatronId, setHighlightedPatronId] = useState<number | null>(null);

    // File upload states
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [existingFiles, setExistingFiles] = useState<IncomeFileResponse | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Signature request states
    const [requestingSignature, setRequestingSignature] = useState(false);

    // Debounce timer refs
    const phoneCheckTimerRef = React.useRef<number | null>(null);
    const idCheckTimerRef = React.useRef<number | null>(null);

    // Load initial data
    useEffect(() => {
        loadNewRegistrations();
        loadMemberships();

        // Cleanup timers on unmount
        return () => {
            if (phoneCheckTimerRef.current) {
                clearTimeout(phoneCheckTimerRef.current);
            }
            if (idCheckTimerRef.current) {
                clearTimeout(idCheckTimerRef.current);
            }
        };
    }, []);

    // Setup SignalR event listeners
    useEffect(() => {
        // Add a small delay to ensure connection is established
        const timer = setTimeout(() => {
            // Listen for new registration
            signalR.onNewRegistration((message) => {
                console.log('🆕 New registration received:', message);

                // Show toast notification
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 6000,
                    timerProgressBar: true,
                    didOpen: (toast: HTMLElement) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer);
                        toast.addEventListener('mouseleave', Swal.resumeTimer);
                    }
                });

                Toast.fire({
                    icon: 'info',
                    title: 'New Registration',
                    html: `
                        <strong>New Registration!</strong><br/>
                        <strong>Patron ID:</strong> ${message.patronId}<br/>
                        <strong>Name:</strong> ${message.fullName}<br/>
                        <strong>Registration Type:</strong> ${message.submitType === 1 ? 'Online' : 'Manual'}
                    `
                });

                // Play notification sound
                signalR.playNotificationSound();

                // Reload new registrations table
                loadNewRegistrations();
            });

            // Listen for signature completed
            signalR.onSignatureCompleted((message) => {
                console.log('✅ Signature completed:', message);

                // Show success notification
                Swal.fire({
                    icon: 'success',
                    title: 'Signature Completed!',
                    html: `
                        <p><strong>Patron ID:</strong> ${message.patronId}</p>
                        <p><strong>Session ID:</strong> ${message.sessionId}</p>
                        <p>The customer has successfully completed the signature.</p>
                    `,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#28a745',
                    timer: 8000,
                    timerProgressBar: true,
                    customClass: {
                        container: 'swal-high-zindex'
                    }
                });

                // Play notification sound
                signalR.playNotificationSound();

                // Highlight the patron row
                setHighlightedPatronId(message.patronId);

                // Update isSigned status if this is the current patron in dialog
                if (selectedPatron && selectedPatron.pid === message.patronId) {
                    const updatedPatron = {
                        ...selectedPatron,
                        isSigned: true
                    };
                    setSelectedPatron(updatedPatron);
                    if (editedPatron && editedPatron.pid === message.patronId) {
                        setEditedPatron({
                            ...editedPatron,
                            isSigned: true
                        });
                    }
                }

                // Reload data
                loadNewRegistrations();
                loadMemberships();
            });
        }, 1500); // Wait 1.5s for connection to be ready

        // Cleanup
        return () => {
            clearTimeout(timer);
            signalR.offNewRegistration();
            signalR.offSignatureCompleted();
        };
    }, [signalR]);

    // Track changes in editedPatron to detect unsaved changes
    useEffect(() => {
        if (!selectedPatron || !editedPatron) {
            setHasUnsavedChanges(false);
            return;
        }

        // Compare original patron with edited version to detect changes
        const hasChanges = (
            selectedPatron.firstName !== editedPatron.firstName ||
            selectedPatron.lastName !== editedPatron.lastName ||
            selectedPatron.mobilePhone !== editedPatron.mobilePhone ||
            selectedPatron.jobTitle !== (editedPatron.jobTitle === 'Other' ? specifyJobTitle : editedPatron.jobTitle) ||
            selectedPatron.position !== (editedPatron.position === 'Other' ? specifyPosition : editedPatron.position) ||
            selectedPatron.identificationTypeId !== editedPatron.identificationTypeId ||
            selectedPatron.identificationNumber !== editedPatron.identificationNumber ||
            selectedPatron.identificationCountry !== editedPatron.identificationCountry ||
            selectedPatron.identificationExpiration !== editedPatron.identificationExpiration ||
            selectedPatron.gender !== editedPatron.gender ||
            selectedPatron.birthday !== editedPatron.birthday ||
            selectedPatron.address !== editedPatron.address ||
            selectedPatron.addressInVietNam !== editedPatron.addressInVietNam ||
            selectedPatron.country !== editedPatron.country
        );

        setHasUnsavedChanges(hasChanges);
    }, [selectedPatron, editedPatron, specifyJobTitle, specifyPosition]);

    const loadNewRegistrations = async () => {
        try {
            setLoadingNewReg(true);
            const data = await patronService.getAllPatrons(false);
            setNewRegistrations(data);
        } catch (err) {
            console.error('Error loading new registrations:', err);
            showSnackbar('Failed to load new registrations', 'error');
        } finally {
            setLoadingNewReg(false);
        }
    };

    const loadMemberships = async () => {
        try {
            setLoadingMembership(true);
            const data = await patronService.getAllPatrons(true);
            setMemberships(data);
        } catch (err) {
            console.error('Error loading memberships:', err);
            showSnackbar('Failed to load memberships', 'error');
        } finally {
            setLoadingMembership(false);
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Handle image click to open viewer
    const handleImageClick = (imageSrc: string) => {
        setSelectedImage(imageSrc);
        setImageViewerOpen(true);
    };

    // Validate Vietnamese phone number format
    const validateVietnamesePhoneNumber = (phoneNumber: string): boolean => {
        if (!phoneNumber) return false;

        // Remove all spaces and special characters
        const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');

        // Vietnamese phone number patterns
        const vnPhonePatterns = [
            /^(\+84|84|0)(3[2-9]|5[6-9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/,  // Mobile numbers
            /^(\+84|84|0)(2[0-9])[0-9]{8}$/  // Landline numbers
        ];

        return vnPhonePatterns.some(pattern => pattern.test(cleanPhone));
    };

    // Check phone number exists with debounce
    const checkPhoneNumber = async (phoneNumber: string) => {
        // Clear previous timer
        if (phoneCheckTimerRef.current) {
            clearTimeout(phoneCheckTimerRef.current);
        }

        // Reset warning
        setPhoneNumberWarning('');

        // Skip if empty or same as original
        if (!phoneNumber || phoneNumber === selectedPatron?.mobilePhone) {
            return;
        }

        // Validate Vietnamese phone number format first
        if (!validateVietnamesePhoneNumber(phoneNumber)) {
            setPhoneNumberWarning('⚠️ Please enter a valid Vietnamese phone number!');
            return;
        }

        // Debounce 800ms
        phoneCheckTimerRef.current = setTimeout(async () => {
            try {
                setCheckingPhone(true);
                const exists = await checkInformationService.checkPhoneNumberExists(phoneNumber);
                if (exists) {
                    setPhoneNumberWarning('⚠️ This phone number already exists in the system!');
                }
            } catch (error) {
                console.error('Error checking phone number:', error);
            } finally {
                setCheckingPhone(false);
            }
        }, 800);
    };

    // Check ID number exists with debounce
    const checkIdNumber = async (idType: number, idNumber: string) => {
        // Clear previous timer
        if (idCheckTimerRef.current) {
            clearTimeout(idCheckTimerRef.current);
        }

        // Reset warning
        setIdNumberWarning('');

        // Skip if empty or same as original
        if (!idNumber || (idType === selectedPatron?.identificationTypeId && idNumber === selectedPatron?.identificationNumber)) {
            return;
        }

        // Debounce 800ms
        idCheckTimerRef.current = setTimeout(async () => {
            try {
                setCheckingId(true);
                const request = {
                    IdType: idType,
                    PassportNumber: idNumber
                };
                const exists = await checkInformationService.checkPatronIdentification(request);
                if (exists) {
                    setIdNumberWarning('⚠️ This ID number already exists in the system!');
                }
            } catch (error) {
                console.error('Error checking ID number:', error);
            } finally {
                setCheckingId(false);
            }
        }, 800);
    };

    // Filter and paginate data
    const filteredNewRegistrations = useMemo(() => {
        return newRegistrations.filter(patron =>
            patron.firstName?.toLowerCase().includes(newRegSearch.toLowerCase()) ||
            patron.lastName?.toLowerCase().includes(newRegSearch.toLowerCase()) ||
            patron.mobilePhone?.includes(newRegSearch) ||
            patron.identificationNumber?.includes(newRegSearch)
        );
    }, [newRegistrations, newRegSearch]);

    const filteredMemberships = useMemo(() => {
        return memberships.filter(patron =>
            patron.firstName?.toLowerCase().includes(membershipSearch.toLowerCase()) ||
            patron.lastName?.toLowerCase().includes(membershipSearch.toLowerCase()) ||
            patron.mobilePhone?.includes(membershipSearch) ||
            patron.identificationNumber?.includes(membershipSearch)
        );
    }, [memberships, membershipSearch]);

    const paginatedNewRegistrations = useMemo(() => {
        const startIndex = newRegPage * rowsPerPage;
        return filteredNewRegistrations.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredNewRegistrations, newRegPage, rowsPerPage]);

    const paginatedMemberships = useMemo(() => {
        const startIndex = membershipPage * rowsPerPage;
        return filteredMemberships.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredMemberships, membershipPage, rowsPerPage]);

    // Handle patron detail view/edit
    const handlePatronAction = async (patron: PatronResponse) => {
        try {
            setDialogError(null);
            setDialogSuccess(null);

            // Reset validation warnings
            setPhoneNumberWarning('');
            setIdNumberWarning('');
            setCheckingPhone(false);
            setCheckingId(false);

            // Reset unsaved changes flag
            setHasUnsavedChanges(false);

            // Clear any pending timers
            if (phoneCheckTimerRef.current) {
                clearTimeout(phoneCheckTimerRef.current);
            }
            if (idCheckTimerRef.current) {
                clearTimeout(idCheckTimerRef.current);
            }

            // Get patron detail and images
            const [patronDetail, patronImagesData] = await Promise.all([
                patronService.getPatronDetail(patron.pid),
                patronService.getPatronImages(patron.pid)
            ]);

            setSelectedPatron(patronDetail);
            setPatronImages(patronImagesData);
            setEditedPatron({ ...patronDetail });
            setIsEditing(!patron.isHaveMembership); // Only allow editing for non-members
            setDialogOpen(true);
            setValidationErrors({});

            // Reset income document fields
            setIncomeDocument(patronDetail.incomeDocument || '');
            setExpireDate(patronDetail.incomeExpiryDate || getTomorrowDate());
            setIncomeApproved(patronDetail.isValidIncomeDocument);

            // Set specify fields if job title or position is not in the predefined options
            const jobTitleExists = JOB_TITLE_OPTIONS.some(opt => opt.value === patronDetail.jobTitle);
            const positionExists = POSITION_OPTIONS.some(opt => opt.value === patronDetail.position);

            if (!jobTitleExists && patronDetail.jobTitle) {
                setSpecifyJobTitle(patronDetail.jobTitle);
                setEditedPatron(prev => prev ? { ...prev, jobTitle: 'Other' } : null);
            } else {
                setSpecifyJobTitle('');
            }

            if (!positionExists && patronDetail.position) {
                setSpecifyPosition(patronDetail.position);
                setEditedPatron(prev => prev ? { ...prev, position: 'Other' } : null);
            } else {
                setSpecifyPosition('');
            }

            // Reset document HTML
            setDocumentHtml('');

            // Reset file upload states
            setUploadedFiles([]);
            setExistingFiles(null);

            // Load existing income files if needed
            if (patronDetail.submitType === 1 || patronDetail.submitType === 2) {
                if (patronDetail.identificationCountry === String(VIETNAM_COUNTRY_ID)) {
                    // Load existing income files for Vietnamese patrons
                    try {
                        setLoadingFiles(true);
                        const files = await incomeDocumentService.getIncomeFile(
                            patronDetail.pid,
                            patronDetail.playerId
                        );
                        setExistingFiles(files);
                    } catch (err) {
                        console.error('Error loading income files:', err);
                        setExistingFiles(null);
                    } finally {
                        setLoadingFiles(false);
                    }
                }
            }

            // Set patronUpdated based on patron's isUpdated status
            setPatronUpdated(patronDetail.isUpdated);
        } catch (err) {
            setDialogError('Failed to load patron details.');
            console.error('Error loading patron details:', err);
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!editedPatron) return false;

        // Personal Information validation
        if (!editedPatron.lastName?.trim()) {
            errors.lastName = 'Middle & Last Name is required';
        }
        if (!editedPatron.firstName?.trim()) {
            errors.firstName = 'First Name is required';
        }
        if (!editedPatron.mobilePhone?.trim()) {
            errors.mobilePhone = 'Mobile Phone is required';
        } else if (!validateVietnamesePhoneNumber(editedPatron.mobilePhone)) {
            errors.mobilePhone = 'Please enter a valid Vietnamese phone number';
        }
        if (!editedPatron.jobTitle?.trim()) {
            errors.jobTitle = 'Occupation is required';
        }
        if (editedPatron.jobTitle === 'Other' && !specifyJobTitle.trim()) {
            errors.specifyJobTitle = 'Specify Occupation is required';
        }
        if (!editedPatron.position?.trim()) {
            errors.position = 'Position is required';
        }
        if (editedPatron.position === 'Other' && !specifyPosition.trim()) {
            errors.specifyPosition = 'Specify Position is required';
        }

        // Identification Information validation
        if (editedPatron.identificationTypeId === undefined || editedPatron.identificationTypeId === null) {
            errors.identificationTypeId = 'ID Type is required';
        }
        if (!editedPatron.identificationNumber?.trim()) {
            errors.identificationNumber = 'ID Number is required';
        }
        if (!editedPatron.identificationCountry?.trim()) {
            errors.identificationCountry = 'Nationality is required';
        }
        if (!editedPatron.identificationExpiration) {
            errors.identificationExpiration = 'Expiration Date is required';
        }
        if (!editedPatron.gender?.trim()) {
            errors.gender = 'Gender is required';
        }
        if (!editedPatron.birthday) {
            errors.birthday = 'Birthday is required';
        }

        // Address validation
        if (!editedPatron.address?.trim()) {
            errors.address = 'Main Address is required';
        }

        if (editedPatron.identificationCountry !== String(VIETNAM_COUNTRY_ID)) {
            if (!editedPatron.addressInVietNam?.trim()) {
                errors.addressInVietNam = 'Address in Vietnam is required for Vietnamese nationals';
            }
        }

        if (!editedPatron.country?.trim()) {
            errors.country = 'Country is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle patron update
    const handleUpdatePatron = async () => {
        if (!editedPatron) return;

        // Validate Vietnamese phone number format first
        if (editedPatron.mobilePhone && !validateVietnamesePhoneNumber(editedPatron.mobilePhone)) {
            setDialogError('Please enter a valid Vietnamese phone number.');
            return;
        }

        // Check for warnings from duplicate checks
        if (phoneNumberWarning) {
            setDialogError('Cannot update: Phone number issue detected.');
            return;
        }

        if (idNumberWarning) {
            setDialogError('Cannot update: ID number already exists in the system.');
            return;
        }

        // Check if still checking
        if (checkingPhone || checkingId) {
            setDialogError('Please wait for validation to complete.');
            return;
        }

        if (!validateForm()) {
            setDialogError('Please fill in all required fields.');
            return;
        }

        try {
            setDialogError(null);

            // Update job title and position with specify values if "Other" is selected
            const updatedPatron = { ...editedPatron };
            if (updatedPatron.jobTitle === 'Other') {
                updatedPatron.jobTitle = specifyJobTitle;
            }
            if (updatedPatron.position === 'Other') {
                updatedPatron.position = specifyPosition;
            }

            await patronService.updatePatron(updatedPatron);
            setDialogSuccess('Patron updated successfully!');
            setPatronUpdated(true);

            // Reset unsaved changes flag
            setHasUnsavedChanges(false);

            // Update the edited patron with the new values and mark as updated
            const finalPatron = {
                ...updatedPatron,
                isUpdated: true
            };
            setEditedPatron(finalPatron);
            setSelectedPatron(finalPatron);

            // Refresh data
            await loadNewRegistrations();
            await loadMemberships();
        } catch (err) {
            setDialogError('Failed to update patron.');
            console.error('Error updating patron:', err);
        }
    };

    // Handle income document approval
    const handleApproveIncome = async () => {
        if (!selectedPatron || !incomeDocument || !expireDate) return;

        try {
            setApprovingIncome(true);
            setDialogError(null);

            const request: CheckValidIncomeRequest = {
                PatronId: selectedPatron.pid,
                IncomeDocument: incomeDocument,
                ExpireDate: expireDate,
                Files: selectedPatron.incomeFiles || []
            };

            await incomeDocumentService.approveValidIncomeDocument(request);
            setDialogSuccess('Income document approved successfully!');
            setIncomeApproved(true);

            // Update the patron's income info
            if (editedPatron) {
                setEditedPatron({
                    ...editedPatron,
                    isValidIncomeDocument: true,
                    incomeDocument: incomeDocument,
                    incomeExpiryDate: expireDate
                });
            }
            if (selectedPatron) {
                setSelectedPatron({
                    ...selectedPatron,
                    isValidIncomeDocument: true,
                    incomeDocument: incomeDocument,
                    incomeExpiryDate: expireDate
                });
            }
        } catch (err) {
            setDialogError('Failed to approve income document.');
            console.error('Error approving income document:', err);
        } finally {
            setApprovingIncome(false);
        }
    };

    // Handle enroll player
    const handleEnrollPlayer = async () => {
        if (!selectedPatron) return;

        try {
            setEnrolling(true);
            setDialogError(null);

            const request: PatronRegisterMembershipRequest = {
                PatronId: selectedPatron.pid
            };

            const response = await patronService.registerMembership(request);
            showSnackbar(`Player enrolled successfully! Membership Number: ${response.membershipNumber}`, 'success');
            setEnrollDialogOpen(false);
            setDialogOpen(false);

            // Refresh data
            await loadNewRegistrations();
            await loadMemberships();
        } catch (err) {
            setDialogError('Failed to enroll player.');
            console.error('Error enrolling player:', err);
        } finally {
            setEnrolling(false);
        }
    };

    // Load customer information confirmation form
    const handleLoadDocument = async () => {
        if (!selectedPatron) return;

        if (!selectedPatron.isSigned) {
            setDialogError('Cannot load document: Patron has not signed.');
            return;
        }
        try {
            setLoadingDocument(true);
            setDialogError(null);
            // Call API with patron ID and playerId
            const response = await renderDocumentService.renderDocumentFile(
                String(selectedPatron.pid),
                String(selectedPatron.playerId)
            );
            setDocumentHtml(response.htmlContent);
            setDialogSuccess('Document loaded successfully!');
        } catch (err: any) {
            setDialogError(err?.message || 'Failed to load document.');
            console.error('Error loading document:', err);
        } finally {
            setLoadingDocument(false);
        }
    };

    // Handle file download - This function seems to be for income files, not document rendering
    const handleDownloadFile = async (batchId: string, saveAs: string) => {
        try {
            // Note: renderDocumentService returns HTML string, not a file
            // This function might need a different service for downloading files
            setDialogError('File download not implemented yet.');
            console.log('Download file:', batchId, saveAs);
        } catch (err) {
            setDialogError('Failed to download file.');
            console.error('Error downloading file:', err);
        }
    };

    // Handle file upload for income documents
    const handleFileUpload = async (files: File[]) => {
        if (!selectedPatron || files.length === 0) return;

        try {
            setUploading(true);
            setDialogError(null);

            const success = await incomeDocumentService.uploadIncomeFile(
                selectedPatron.pid,
                selectedPatron.playerId,
                files
            );

            if (success) {
                setDialogSuccess('Files uploaded successfully!');
                setUploadedFiles([]);

                // Reload existing files
                await loadExistingFiles();
            } else {
                setDialogError('Failed to upload files.');
            }
        } catch (err) {
            setDialogError('Failed to upload files.');
            console.error('Error uploading files:', err);
        } finally {
            setUploading(false);
        }
    };

    // Load existing income files
    const loadExistingFiles = async () => {
        if (!selectedPatron) return;

        try {
            setLoadingFiles(true);
            const files = await incomeDocumentService.getIncomeFile(
                selectedPatron.pid,
                selectedPatron.playerId
            );
            setExistingFiles(files);
        } catch (err) {
            console.error('Error loading income files:', err);
            // Don't show error for this as it might be normal to have no files
            setExistingFiles(null);
        } finally {
            setLoadingFiles(false);
        }
    };

    // Handle delete income file
    const handleDeleteFile = async (batchId: string, saveAs: string) => {
        try {
            setDialogError(null);

            await incomeDocumentService.deleteIncomeFile(batchId, saveAs);
            setDialogSuccess('File deleted successfully!');

            // Reload files after deletion
            await loadExistingFiles();
        } catch (err) {
            setDialogError('Failed to delete file.');
            console.error('Error deleting file:', err);
        }
    };

    // Handle request signature
    const handleRequestSignature = async () => {
        if (!selectedPatron) return;

        try {
            setRequestingSignature(true);
            setDialogError(null);

            const request: StaffSignatureRequest = {
                PatronId: selectedPatron.pid
            };

            const success = await signatureService.staffRequestSignature(request);

            if (success) {
                setDialogSuccess('Signature request sent successfully! Customer will receive notification to sign.');
                //showSnackbar('Signature request sent to customer', 'info');
            } else {
                setDialogError('Failed to send signature request.');
            }
        } catch (err) {
            setDialogError('Failed to send signature request.');
            console.error('Error requesting signature:', err);
        } finally {
            setRequestingSignature(false);
        }
    };

    // Check if all required fields are filled
    const areRequiredFieldsFilled = (): boolean => {
        if (!editedPatron) return false;

        const isBasicInfoValid = !!(
            editedPatron.lastName?.trim() &&
            editedPatron.firstName?.trim() &&
            editedPatron.mobilePhone?.trim() &&
            editedPatron.jobTitle?.trim() &&
            editedPatron.position?.trim()
        );

        const isJobTitleValid = editedPatron.jobTitle !== 'Other' || !!specifyJobTitle.trim();
        const isPositionValid = editedPatron.position !== 'Other' || !!specifyPosition.trim();

        const isIdentificationValid = !!(
            (editedPatron.identificationTypeId === 0 || editedPatron.identificationTypeId === 1) &&
            editedPatron.identificationNumber?.trim() &&
            editedPatron.identificationCountry?.trim() &&
            editedPatron.identificationExpiration &&
            editedPatron.gender?.trim() &&
            editedPatron.birthday
        );

        const isAddressValid = !!(
            editedPatron.address?.trim() &&
            editedPatron.country?.trim()
        );

        return isBasicInfoValid && isJobTitleValid && isPositionValid && isIdentificationValid && isAddressValid;
    };

    // Check if patron is Vietnamese
    const isVietnamese = (): boolean => {
        if (!editedPatron) return false;
        return editedPatron.identificationCountry === String(VIETNAM_COUNTRY_ID);
    };

    // Check submit type logic for income requirement
    const needsIncomeDocument = (): boolean => {
        if (!selectedPatron) return false;

        // Both submitType 1 and 2 need income document if Vietnamese
        return isVietnamese() && (selectedPatron.submitType === 1 || selectedPatron.submitType === 2);
    };

    // Check if signature request should be shown
    const canShowSignatureRequest = (): boolean => {
        if (!selectedPatron) return false;
        //if (!editedPatron) return false;
        //if (!selectedPatron.isValidIncomeDocument) return false;

        // Only submitType 2 shows signature request for both Vietnamese and foreigners
        return selectedPatron.submitType === 2;
    };

    // Check if Request Signature button should be enabled
    const canRequestSignature = (): boolean => {
        if (!selectedPatron) return false;

        // Phải update patron trước (isUpdated === true)
        const isPatronUpdated = selectedPatron.isUpdated || patronUpdated;
        if (!isPatronUpdated) {
            return false;
        }

        // Nếu là người Việt Nam, phải approve income trước
        if (isVietnamese()) {
            if (!incomeApproved && !selectedPatron.isValidIncomeDocument) {
                return false;
            }
        }

        // Đã ký rồi thì không cần request nữa
        // if (selectedPatron.isSigned || editedPatron?.isSigned) {
        //     return false;
        // }

        return true;
    };

    // Check if income upload section should be shown
    const shouldShowIncomeUpload = (): boolean => {
        return needsIncomeDocument();
    };

    // Check if income document is valid
    const isIncomeFormValid = (): boolean => {
        return !!(incomeDocument?.trim() && expireDate && new Date(expireDate) > new Date());
    };

    // Determine if Approve Income button should be enabled
    const canApproveIncome = (): boolean => {
        if (!selectedPatron) return false;

        // Bước 1: Phải update patron trước (isUpdated === true)
        if (!selectedPatron.isUpdated && !patronUpdated) {
            return false;
        }

        // Bước 2: Phải là người Việt Nam
        if (!isVietnamese()) {
            return false;
        }

        // Kiểm tra form hợp lệ và chưa approve
        return areRequiredFieldsFilled() && isIncomeFormValid() && !incomeApproved && !selectedPatron.isValidIncomeDocument;
    };

    // Determine if Enroll Player button should be enabled
    const canEnrollPlayer = (): boolean => {
        if (!selectedPatron || !editedPatron) return false;

        // Phải điền đầy đủ thông tin
        if (!areRequiredFieldsFilled()) return false;

        // Kiểm tra isUpdated và isSigned
        const isPatronUpdated = selectedPatron.isUpdated || patronUpdated;
        const isPatronSigned = selectedPatron.isSigned || editedPatron.isSigned;

        // Nếu chưa update -> không hiện
        if (!isPatronUpdated) {
            return false;
        }

        // CRITICAL: If there are unsaved changes after signature, must update first
        if (isPatronSigned && hasUnsavedChanges) {
            return false;
        }

        // Nếu là người Việt Nam
        if (isVietnamese()) {
            // Phải approve income và đã ký
            return (incomeApproved || selectedPatron.isValidIncomeDocument) && isPatronSigned;
        }

        // Nếu không phải người Việt Nam: chỉ cần isUpdated = true và isSigned = true
        return isPatronSigned;
    };

    // Get warning message for Enroll Player section
    const getEnrollPlayerWarning = (): string => {
        if (!selectedPatron || !editedPatron) return '';

        const isPatronUpdated = selectedPatron.isUpdated || patronUpdated;
        const isPatronSigned = selectedPatron.isSigned || editedPatron.isSigned;

        if (!isPatronUpdated) {
            return '⏳ Complete all previous steps';
        }

        if (isPatronSigned && hasUnsavedChanges) {
            return '⚠️ Customer has signed but you have unsaved changes. Please update patron information first before enrolling.';
        }

        if (isVietnamese()) {
            if (!(incomeApproved || selectedPatron.isValidIncomeDocument)) {
                return '⏳ Please approve income document first';
            }
            if (!isPatronSigned) {
                return '⏳ Waiting for customer signature';
            }
        } else {
            if (!isPatronSigned) {
                return '⏳ Waiting for customer signature';
            }
        }

        if (selectedPatron.isHaveMembership) {
            return '✓ Player has been enrolled';
        }

        return '✅ Ready to enroll player!';
    };

    // Get country name by ID
    const getCountryName = (countryId: string): string => {
        const country = countries.find(c => String(c.countryID) === countryId);
        return country?.countryDescription || countryId;
    };

    // Render table
    const renderTable = (data: PatronResponse[]) => (
        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader sx={{ minWidth: 1200 }}>
                <TableHead>
                    <TableRow>
                        <TableCell
                            sx={{
                                position: 'sticky',
                                left: 0,
                                backgroundColor: 'background.paper',
                                zIndex: 3,
                                boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
                            }}
                        >
                            Actions
                        </TableCell>
                        <TableCell sx={{ minWidth: 150 }}>Registration Type</TableCell>
                        <TableCell sx={{ minWidth: 100 }}>Player ID</TableCell>
                        <TableCell sx={{ minWidth: 200 }}>Full Name</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Mobile Phone</TableCell>
                        <TableCell sx={{ minWidth: 130 }}>Occupation</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>Position</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>ID Number</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Nationality</TableCell>
                        <TableCell sx={{ minWidth: 250 }}>Address</TableCell>
                        <TableCell sx={{ minWidth: 200 }}>Address in Vietnam</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Country</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell sx={{ minWidth: 160 }}>Submit Date</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((patron) => {
                        const isHighlighted = highlightedPatronId === patron.pid;
                        return (
                            <TableRow
                                key={patron.pid}
                                hover
                                onClick={() => {
                                    if (isHighlighted) {
                                        setHighlightedPatronId(null);
                                    }
                                }}
                                className={isHighlighted ? 'highlighted-row' : ''}
                                sx={{
                                    cursor: isHighlighted ? 'pointer' : 'default',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        left: 0,
                                        backgroundColor: isHighlighted ? 'rgba(226, 132, 221, 0.15)' : 'background.paper',
                                        zIndex: 1,
                                        boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <Tooltip title={patron.isHaveMembership ? 'View Details' : 'Edit Details'}>
                                        <IconButton
                                            onClick={() => handlePatronAction(patron)}
                                            color="primary"
                                            size="small"
                                        >
                                            {patron.isHaveMembership ? <VisibilityIcon /> : <EditIcon />}
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Chip label={patron.submitType == 1 ? 'Online' : 'Manual'}
                                        color={patron.submitType == 1 ? 'success' : 'secondary'}
                                        size='small' />
                                </TableCell>
                                <TableCell>{patron.playerId === 0 ? '-' : patron.playerId}</TableCell>
                                <TableCell>{`${patron.firstName} ${patron.lastName}`}</TableCell>
                                <TableCell>{patron.gender || '-'}</TableCell>
                                <TableCell>{patron.mobilePhone}</TableCell>
                                <TableCell>{patron.jobTitle || '-'}</TableCell>
                                <TableCell>{patron.position || '-'}</TableCell>
                                <TableCell>{patron.identificationNumber || '-'}</TableCell>
                                <TableCell>{getCountryName(patron.identificationCountry)}</TableCell>
                                <TableCell>{patron.address || '-'}</TableCell>
                                <TableCell>{patron.addressInVietNam || '-'}</TableCell>
                                <TableCell>{getCountryName(patron.country)}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={patron.isHaveMembership ? 'Membership' : 'New'}
                                        color={patron.isHaveMembership ? 'success' : 'info'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{FormatUtcTime.formatDateTime(patron.createdTime)}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={5000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                {/* New Registrations Table */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6">
                                New Registration ({filteredNewRegistrations.length})
                            </Typography>
                            <Box display="flex" gap={1} alignItems="center">
                                <TextField
                                    placeholder="Search..."
                                    variant="outlined"
                                    value={newRegSearch}
                                    onChange={(e) => setNewRegSearch(e.target.value)}
                                    size="small"
                                    sx={{ width: 250 }}
                                />
                                <IconButton
                                    onClick={loadNewRegistrations}
                                    disabled={loadingNewReg}
                                    color="primary"
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Box>
                        </Box>

                        {loadingNewReg ? (
                            <Box display="flex" justifyContent="center" py={4}>
                                <CircularProgress size={40} />
                            </Box>
                        ) : (
                            <>
                                {renderTable(paginatedNewRegistrations)}
                                <TablePagination
                                    component="div"
                                    count={filteredNewRegistrations.length}
                                    page={newRegPage}
                                    onPageChange={(_, newPage) => setNewRegPage(newPage)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setNewRegPage(0);
                                    }}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Memberships Table */}
                <Card>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6">
                                Membership ({filteredMemberships.length})
                            </Typography>
                            <Box display="flex" gap={1} alignItems="center">
                                <TextField
                                    placeholder="Search..."
                                    variant="outlined"
                                    value={membershipSearch}
                                    onChange={(e) => setMembershipSearch(e.target.value)}
                                    size="small"
                                    sx={{ width: 250 }}
                                />
                                <IconButton
                                    onClick={loadMemberships}
                                    disabled={loadingMembership}
                                    color="primary"
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Box>
                        </Box>

                        {loadingMembership ? (
                            <Box display="flex" justifyContent="center" py={4}>
                                <CircularProgress size={40} />
                            </Box>
                        ) : (
                            <>
                                {renderTable(paginatedMemberships)}
                                <TablePagination
                                    component="div"
                                    count={filteredMemberships.length}
                                    page={membershipPage}
                                    onPageChange={(_, newPage) => setMembershipPage(newPage)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setMembershipPage(0);
                                    }}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Patron Detail Dialog */}
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">
                                Edit & Update Information {isVietnamese() ? '(Vietnamese)' : '(Foreigner)'}
                            </Typography>
                            <IconButton onClick={() => setDialogOpen(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>

                    <DialogContent dividers>
                        {/* Alerts inside dialog */}
                        <Snackbar
                            open={!!dialogError}
                            autoHideDuration={5000}
                            onClose={() => setDialogError(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                            <Alert onClose={() => setDialogError(null)} severity="error" sx={{ width: '100%' }}>
                                {dialogError}
                            </Alert>
                        </Snackbar>

                        <Snackbar
                            open={!!dialogSuccess}
                            autoHideDuration={5000}
                            onClose={() => setDialogSuccess(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                            <Alert onClose={() => setDialogSuccess(null)} severity="success" sx={{ width: '100%' }}>
                                {dialogSuccess}
                            </Alert>
                        </Snackbar>

                        {selectedPatron && editedPatron && (
                            <Stack spacing={3}>
                                {/* Patron Images Section */}
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                                            Personal Identification Images
                                        </Typography>
                                        {patronImages ? (
                                            <Stack direction="row" spacing={3} justifyContent="center">
                                                <Box textAlign="center">
                                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                        Front Image
                                                    </Typography>
                                                    {patronImages.frontImage ? (
                                                        <Avatar
                                                            src={patronImages.frontImage.startsWith('data:') ? patronImages.frontImage : `data:image/jpeg;base64,${patronImages.frontImage}`}
                                                            sx={{
                                                                width: 300,
                                                                height: 250,
                                                                mx: 'auto',
                                                                border: '2px solid #ddd',
                                                                cursor: 'pointer',
                                                                '&:hover': { opacity: 0.8 }
                                                            }}
                                                            variant="rounded"
                                                            onClick={() => handleImageClick(patronImages.frontImage.startsWith('data:') ? patronImages.frontImage : `data:image/jpeg;base64,${patronImages.frontImage}`)}
                                                        />
                                                    ) : (
                                                        <Box sx={{ width: 300, height: 250, mx: 'auto', border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                                                            <Typography variant="body2" color="text.secondary">No Image</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Box textAlign="center">
                                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                        Back Image
                                                    </Typography>
                                                    {patronImages.backImage ? (
                                                        <Avatar
                                                            src={patronImages.backImage.startsWith('data:') ? patronImages.backImage : `data:image/jpeg;base64,${patronImages.backImage}`}
                                                            sx={{
                                                                width: 300,
                                                                height: 250,
                                                                mx: 'auto',
                                                                border: '2px solid #ddd',
                                                                cursor: 'pointer',
                                                                '&:hover': { opacity: 0.8 }
                                                            }}
                                                            variant="rounded"
                                                            onClick={() => handleImageClick(patronImages.backImage.startsWith('data:') ? patronImages.backImage : `data:image/jpeg;base64,${patronImages.backImage}`)}
                                                        />
                                                    ) : (
                                                        <Box sx={{ width: 300, height: 250, mx: 'auto', border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                                                            <Typography variant="body2" color="text.secondary">No Image</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Box textAlign="center">
                                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                        Selfie
                                                    </Typography>
                                                    {patronImages.selfieImage ? (
                                                        <Avatar
                                                            src={patronImages.selfieImage.startsWith('data:') ? patronImages.selfieImage : `data:image/jpeg;base64,${patronImages.selfieImage}`}
                                                            sx={{
                                                                width: 300,
                                                                height: 250,
                                                                mx: 'auto',
                                                                border: '2px solid #ddd',
                                                                cursor: 'pointer',
                                                                '&:hover': { opacity: 0.8 }
                                                            }}
                                                            variant="rounded"
                                                            onClick={() => handleImageClick(patronImages.selfieImage.startsWith('data:') ? patronImages.selfieImage : `data:image/jpeg;base64,${patronImages.selfieImage}`)}
                                                        />
                                                    ) : (
                                                        <Box sx={{ width: 300, height: 250, mx: 'auto', border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                                                            <Typography variant="body2" color="text.secondary">No Image</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Stack>
                                        ) : (
                                            <Box display="flex" justifyContent="center" py={2}>
                                                <CircularProgress size={30} />
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Personal Information Section */}
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                                            Personal Information
                                        </Typography>
                                        <Stack spacing={2}>
                                            <Stack direction="row" spacing={2}>
                                                <TextField
                                                    label="Middle & Last Name *"
                                                    value={editedPatron.lastName || ''}
                                                    onChange={(e) => setEditedPatron({ ...editedPatron, lastName: e.target.value })}
                                                    disabled={!isEditing}
                                                    fullWidth
                                                    size="small"
                                                    error={!!validationErrors.lastName}
                                                    helperText={validationErrors.lastName}
                                                />
                                                <TextField
                                                    label="First Name *"
                                                    value={editedPatron.firstName || ''}
                                                    onChange={(e) => setEditedPatron({ ...editedPatron, firstName: e.target.value })}
                                                    disabled={!isEditing}
                                                    fullWidth
                                                    size="small"
                                                    error={!!validationErrors.firstName}
                                                    helperText={validationErrors.firstName}
                                                />
                                            </Stack>

                                            <TextField
                                                type='number'
                                                label="Mobile Phone *"
                                                value={editedPatron.mobilePhone || ''}
                                                onChange={(e) => {
                                                    const newPhone = e.target.value;
                                                    setEditedPatron({ ...editedPatron, mobilePhone: newPhone });
                                                    // Clear previous warning
                                                    setPhoneNumberWarning('');
                                                    // Check phone number
                                                    if (isEditing) {
                                                        checkPhoneNumber(newPhone);
                                                    }
                                                }}
                                                disabled={!isEditing}
                                                fullWidth
                                                size="small"
                                                error={!!validationErrors.mobilePhone || !!phoneNumberWarning}
                                                helperText={
                                                    validationErrors.mobilePhone ||
                                                    phoneNumberWarning ||
                                                    (checkingPhone ? 'Checking...' : '')
                                                }
                                                InputProps={{
                                                    endAdornment: checkingPhone ? (
                                                        <CircularProgress size={20} />
                                                    ) : phoneNumberWarning ? (
                                                        <span style={{ color: '#ff9800' }}>⚠️</span>
                                                    ) : null
                                                }}
                                            />

                                            <Stack direction="row" spacing={2}>
                                                <FormControl fullWidth disabled={!isEditing} error={!!validationErrors.jobTitle} size="small" required>
                                                    <InputLabel>Occupation</InputLabel>
                                                    <Select
                                                        value={editedPatron.jobTitle || ''}
                                                        onChange={(e) => setEditedPatron({ ...editedPatron, jobTitle: e.target.value })}
                                                        label="Occupation *"
                                                        required
                                                    >
                                                        {JOB_TITLE_OPTIONS.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {validationErrors.jobTitle && <FormHelperText>{validationErrors.jobTitle}</FormHelperText>}
                                                </FormControl>

                                                <FormControl fullWidth disabled={!isEditing} error={!!validationErrors.position} size="small" required>
                                                    <InputLabel>Position</InputLabel>
                                                    <Select
                                                        value={editedPatron.position || ''}
                                                        onChange={(e) => setEditedPatron({ ...editedPatron, position: e.target.value })}
                                                        label="Position *"
                                                        required
                                                    >
                                                        {POSITION_OPTIONS.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {validationErrors.position && <FormHelperText>{validationErrors.position}</FormHelperText>}
                                                </FormControl>
                                            </Stack>

                                            {(editedPatron.jobTitle === 'Other' || editedPatron.position === 'Other') && (
                                                <Stack direction="row" spacing={2}>
                                                    {editedPatron.jobTitle === 'Other' && (
                                                        <TextField
                                                            label="Specify Occupation *"
                                                            value={specifyJobTitle}
                                                            onChange={(e) => setSpecifyJobTitle(e.target.value)}
                                                            disabled={!isEditing}
                                                            fullWidth
                                                            size="small"
                                                            error={!!validationErrors.specifyJobTitle}
                                                            helperText={validationErrors.specifyJobTitle}
                                                        />
                                                    )}
                                                    {editedPatron.position === 'Other' && (
                                                        <TextField
                                                            label="Specify Position *"
                                                            value={specifyPosition}
                                                            onChange={(e) => setSpecifyPosition(e.target.value)}
                                                            disabled={!isEditing}
                                                            fullWidth
                                                            size="small"
                                                            error={!!validationErrors.specifyPosition}
                                                            helperText={validationErrors.specifyPosition}
                                                        />
                                                    )}
                                                </Stack>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>

                                {/* Two Column Layout for Identification and Address */}
                                <Stack direction="row" spacing={2}>
                                    {/* Identification Information Section */}
                                    <Card variant="outlined" sx={{ flex: 1 }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                                                Identification Information
                                            </Typography>
                                            <Stack spacing={2}>
                                                <FormControl fullWidth disabled={!isEditing} error={!!validationErrors.identificationTypeId} size="small">
                                                    <InputLabel>ID Type *</InputLabel>
                                                    <Select
                                                        value={
                                                            editedPatron.identificationTypeId !== undefined &&
                                                                ID_TYPE_OPTIONS.some(opt => opt.value === editedPatron.identificationTypeId)
                                                                ? editedPatron.identificationTypeId
                                                                : ''
                                                        }
                                                        onChange={(e) => {
                                                            const newIdType = Number(e.target.value);
                                                            setEditedPatron({ ...editedPatron, identificationTypeId: newIdType });
                                                            // Clear previous warning
                                                            setIdNumberWarning('');
                                                            // Re-check ID with new type
                                                            if (isEditing && editedPatron.identificationNumber) {
                                                                checkIdNumber(newIdType, editedPatron.identificationNumber);
                                                            }
                                                        }}
                                                        label="ID Type *"
                                                    >
                                                        {ID_TYPE_OPTIONS.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {validationErrors.identificationTypeId && <FormHelperText>{validationErrors.identificationTypeId}</FormHelperText>}
                                                </FormControl>

                                                <TextField
                                                    label="ID Number *"
                                                    value={editedPatron.identificationNumber || ''}
                                                    onChange={(e) => {
                                                        const newIdNumber = e.target.value;
                                                        setEditedPatron({ ...editedPatron, identificationNumber: newIdNumber });
                                                        // Clear previous warning
                                                        setIdNumberWarning('');
                                                        // Check ID number
                                                        if (isEditing && editedPatron.identificationTypeId !== undefined) {
                                                            checkIdNumber(editedPatron.identificationTypeId, newIdNumber);
                                                        }
                                                    }}
                                                    disabled={!isEditing}
                                                    fullWidth
                                                    size="small"
                                                    error={!!validationErrors.identificationNumber || !!idNumberWarning}
                                                    helperText={
                                                        validationErrors.identificationNumber ||
                                                        idNumberWarning ||
                                                        (checkingId ? 'Checking...' : '')
                                                    }
                                                    InputProps={{
                                                        endAdornment: checkingId ? (
                                                            <CircularProgress size={20} />
                                                        ) : idNumberWarning ? (
                                                            <span style={{ color: '#ff9800' }}>⚠️</span>
                                                        ) : null
                                                    }}
                                                />

                                                <FormControl fullWidth disabled={!isEditing} error={!!validationErrors.identificationCountry} size="small">
                                                    <InputLabel>Nationality *</InputLabel>
                                                    <Select
                                                        value={
                                                            editedPatron.identificationCountry &&
                                                                countries.some(c => String(c.countryID) === editedPatron.identificationCountry)
                                                                ? editedPatron.identificationCountry
                                                                : ''
                                                        }
                                                        onChange={(e) => setEditedPatron({ ...editedPatron, identificationCountry: String(e.target.value) })}
                                                        label="Nationality *"
                                                    >
                                                        {countries.map((country) => (
                                                            <MenuItem key={country.countryID} value={String(country.countryID)}>
                                                                {country.countryDescription}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {validationErrors.identificationCountry && <FormHelperText>{validationErrors.identificationCountry}</FormHelperText>}
                                                </FormControl>

                                                <TextField
                                                    label="Expiration Date *"
                                                    type="date"
                                                    value={editedPatron.identificationExpiration?.split('T')[0] || ''}
                                                    onChange={(e) => setEditedPatron({ ...editedPatron, identificationExpiration: e.target.value })}
                                                    disabled={!isEditing}
                                                    InputLabelProps={{ shrink: true }}
                                                    fullWidth
                                                    size="small"
                                                    error={!!validationErrors.identificationExpiration}
                                                    helperText={validationErrors.identificationExpiration}
                                                />

                                                <FormControl component="fieldset" error={!!validationErrors.gender} fullWidth>
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <FormLabel component="legend" sx={{ minWidth: 80 }}>Gender *</FormLabel>
                                                        <RadioGroup
                                                            row
                                                            value={editedPatron.gender || ''}
                                                            onChange={(e) => setEditedPatron({ ...editedPatron, gender: e.target.value })}
                                                        >
                                                            <FormControlLabel value="Male" control={<Radio />} label="Male" disabled={!isEditing} />
                                                            <FormControlLabel value="Female" control={<Radio />} label="Female" disabled={!isEditing} />
                                                        </RadioGroup>
                                                    </Box>
                                                    {validationErrors.gender && <FormHelperText>{validationErrors.gender}</FormHelperText>}
                                                </FormControl>

                                                <TextField
                                                    label="Birthday *"
                                                    type="date"
                                                    value={editedPatron.birthday?.split('T')[0] || ''}
                                                    onChange={(e) => setEditedPatron({ ...editedPatron, birthday: e.target.value })}
                                                    disabled={!isEditing}
                                                    InputLabelProps={{ shrink: true }}
                                                    fullWidth
                                                    size="small"
                                                    error={!!validationErrors.birthday}
                                                    helperText={validationErrors.birthday}
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>

                                    {/* Address Section */}
                                    <Card variant="outlined" sx={{ flex: 1 }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                                                Address
                                            </Typography>
                                            <Stack spacing={2}>
                                                <TextField
                                                    label="Main Address *"
                                                    value={editedPatron.address || ''}
                                                    onChange={(e) => setEditedPatron({ ...editedPatron, address: e.target.value })}
                                                    disabled={!isEditing}
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    size="small"
                                                    error={!!validationErrors.address}
                                                    helperText={validationErrors.address}
                                                />

                                                <TextField
                                                    label="Address in Viet Nam"
                                                    value={editedPatron.addressInVietNam || ''}
                                                    onChange={(e) => setEditedPatron({ ...editedPatron, addressInVietNam: e.target.value })}
                                                    disabled={!isEditing}
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    size="small"
                                                    error={!!validationErrors.addressInVietNam}
                                                    helperText={validationErrors.addressInVietNam}
                                                />

                                                <FormControl fullWidth disabled={!isEditing} error={!!validationErrors.country} size="small">
                                                    <InputLabel>Country</InputLabel>
                                                    <Select
                                                        value={
                                                            editedPatron.country &&
                                                                countries.some(c => String(c.countryID) === editedPatron.country)
                                                                ? editedPatron.country
                                                                : ''
                                                        }
                                                        onChange={(e) => setEditedPatron({ ...editedPatron, country: String(e.target.value) })}
                                                        label="Country"
                                                    >
                                                        {countries.map((country) => (
                                                            <MenuItem key={country.countryID} value={String(country.countryID)}>
                                                                {country.countryDescription}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {validationErrors.country && <FormHelperText>{validationErrors.country}</FormHelperText>}
                                                </FormControl>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Stack>


                                {/* Workflow Status - Show progress */}
                                <Card variant="outlined" sx={{ backgroundColor: '#f5f5f5' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                                            Registration Workflow Status
                                        </Typography>
                                        <Stack spacing={2}>
                                            {/* Step 1: Update Patron */}
                                            <Box display="flex" alignItems="center" gap={2}>
                                                {(selectedPatron.isUpdated || patronUpdated) ? (
                                                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />
                                                ) : (
                                                    <Box sx={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Typography variant="body2" color="text.secondary">1</Typography>
                                                    </Box>
                                                )}
                                                <Box flex={1}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        Step 1: Update Patron Information
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {(selectedPatron.isUpdated || patronUpdated)
                                                            ? '✓ Patron information has been updated'
                                                            : '⚠️ Please update patron information first'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Step 2: Approve Income (only for Vietnamese) */}
                                            {isVietnamese() && (
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    {(selectedPatron.isValidIncomeDocument || incomeApproved) ? (
                                                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />
                                                    ) : (
                                                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: !(selectedPatron.isUpdated || patronUpdated) ? '#f0f0f0' : 'white' }}>
                                                            <Typography variant="body2" color={!(selectedPatron.isUpdated || patronUpdated) ? 'text.disabled' : 'text.secondary'}>2</Typography>
                                                        </Box>
                                                    )}
                                                    <Box flex={1}>
                                                        <Typography variant="subtitle1" fontWeight="bold" color={!(selectedPatron.isUpdated || patronUpdated) ? 'text.disabled' : 'inherit'}>
                                                            Step 2: Approve Income Document
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {(selectedPatron.isValidIncomeDocument || incomeApproved)
                                                                ? '✓ Income document has been approved'
                                                                : !(selectedPatron.isUpdated || patronUpdated)
                                                                    ? '⏳ Complete Step 1 first'
                                                                    : '⚠️ Please approve income document'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Step 3: Signature Completed */}
                                            <Box display="flex" alignItems="center" gap={2}>
                                                {(selectedPatron.isSigned || editedPatron.isSigned) ? (
                                                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />
                                                ) : (
                                                    <Box sx={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '50%',
                                                        border: '2px solid #ccc',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: !(selectedPatron.isUpdated || patronUpdated) ? '#f0f0f0' : 'white'
                                                    }}>
                                                        <Typography variant="body2" color={!(selectedPatron.isUpdated || patronUpdated) ? 'text.disabled' : 'text.secondary'}>
                                                            {isVietnamese() ? '3' : '2'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                <Box flex={1}>
                                                    <Typography variant="subtitle1" fontWeight="bold" color={!(selectedPatron.isUpdated || patronUpdated) ? 'text.disabled' : 'inherit'}>
                                                        Step {isVietnamese() ? '3' : '2'}: Customer Signature
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {(selectedPatron.isSigned || editedPatron.isSigned)
                                                            ? '✓ Customer has signed the document'
                                                            : !(selectedPatron.isUpdated || patronUpdated)
                                                                ? `⏳ Complete previous steps first`
                                                                : '⏳ Waiting for customer to sign...'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Step 4: Enroll Player */}
                                            <Box display="flex" alignItems="center" gap={2}>
                                                {selectedPatron.isHaveMembership ? (
                                                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />
                                                ) : (
                                                    <Box sx={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '50%',
                                                        border: '2px solid #ccc',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: !canEnrollPlayer() ? '#f0f0f0' : 'white'
                                                    }}>
                                                        <Typography variant="body2" color={!canEnrollPlayer() ? 'text.disabled' : 'text.secondary'}>
                                                            {isVietnamese() ? '4' : '3'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                <Box flex={1}>
                                                    <Typography variant="subtitle1" fontWeight="bold" color={!canEnrollPlayer() ? 'text.disabled' : 'inherit'}>
                                                        Step {isVietnamese() ? '4' : '3'}: Enroll Player
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {getEnrollPlayerWarning()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>

                                {/* Warning for unsaved changes after signature */}
                                {hasUnsavedChanges && (selectedPatron.isSigned || editedPatron.isSigned) && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Critical Warning: Unsaved Changes After Signature
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            The customer has already completed their signature, but you have made changes to their information that have not been saved.
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>You must update the patron information before proceeding with enrollment</strong> to ensure data consistency.
                                        </Typography>
                                        <Typography variant="body2" color="error">
                                            The "Enroll Player" button has been disabled until you save these changes.
                                        </Typography>
                                    </Alert>
                                )}

                                <Box display="flex" justifyContent="center" mt={2} mb={1}>
                                    {isEditing && !(selectedPatron.isUpdated || patronUpdated) && (
                                        <Typography variant="body1" color="error" sx={{ mr: 2, alignSelf: 'center' }}>
                                            <Alert severity="warning" sx={{ mb: 2 }}>
                                                Please update patron information to proceed with the workflow.
                                            </Alert>
                                        </Typography>
                                    )}
                                    {isEditing && (selectedPatron.isUpdated || patronUpdated) && (
                                        <Typography variant="body1" color="success.main" sx={{ mr: 2, alignSelf: 'center' }}>
                                            ✓ Patron information updated. You can now proceed to the next steps.
                                        </Typography>
                                    )}
                                </Box>

                                <Box display="flex" justifyContent="center" mb={2}>
                                    {isEditing && (
                                        <Button
                                            variant="contained"
                                            color={hasUnsavedChanges && (selectedPatron.isSigned || editedPatron.isSigned) ? 'error' : 'primary'}
                                            onClick={handleUpdatePatron}
                                            startIcon={<SaveIcon />}
                                            disabled={selectedPatron.isUpdated && !patronUpdated && !hasUnsavedChanges}
                                            sx={{
                                                ...(hasUnsavedChanges && (selectedPatron.isSigned || editedPatron.isSigned) && {
                                                    animation: 'pulse 1.5s ease-in-out infinite',
                                                    '@keyframes pulse': {
                                                        '0%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)' },
                                                        '70%': { boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' },
                                                        '100%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' },
                                                    },
                                                })
                                            }}
                                        >
                                            {hasUnsavedChanges && (selectedPatron.isSigned || editedPatron.isSigned)
                                                ? '⚠️ URGENT: Update Required'
                                                : selectedPatron.isUpdated ? 'Update Again' : 'Update Patron'}
                                        </Button>
                                    )}
                                </Box>
                                {/* Income Section - for Vietnamese with submitType 1 or 2 */}
                                {shouldShowIncomeUpload() && (
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                                <Typography variant="h6" sx={{ color: 'primary.main' }}>
                                                    Income Document Approval
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    onClick={handleApproveIncome}
                                                    disabled={!canApproveIncome() || approvingIncome}
                                                    startIcon={approvingIncome ? <CircularProgress size={16} /> : (incomeApproved || selectedPatron.isValidIncomeDocument) ? <CheckCircleIcon /> : undefined}
                                                    size="small"
                                                >
                                                    {(incomeApproved || selectedPatron.isValidIncomeDocument) ? 'Approved' : 'Approve Income'}
                                                </Button>
                                            </Box>

                                            {/* Warning if not updated yet */}
                                            {!(selectedPatron.isUpdated || patronUpdated) && (
                                                <Alert severity="warning" sx={{ mb: 2 }}>
                                                    Please update patron information first before approving income document.
                                                </Alert>
                                            )}

                                            {/* Success message if approved */}
                                            {(incomeApproved || selectedPatron.isValidIncomeDocument) && (
                                                <Alert severity="success" sx={{ mb: 2 }}>
                                                    ✓ Income document has been approved. Waiting for customer signature...
                                                </Alert>
                                            )}

                                            <Stack spacing={2}>
                                                {/* File Upload Section */}
                                                <Box>
                                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                        Upload Income Files
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                                                        <Button
                                                            variant="outlined"
                                                            component="label"
                                                            startIcon={<UploadIcon />}
                                                            disabled={uploading}
                                                        >
                                                            Choose Files
                                                            <input
                                                                type="file"
                                                                hidden
                                                                multiple
                                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                onChange={(e) => {
                                                                    const files = Array.from(e.target.files || []);
                                                                    setUploadedFiles(files);
                                                                }}
                                                            />
                                                        </Button>
                                                        {uploadedFiles.length > 0 && (
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => handleFileUpload(uploadedFiles)}
                                                                disabled={uploading}
                                                                startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
                                                            >
                                                                Upload {uploadedFiles.length} file(s)
                                                            </Button>
                                                        )}
                                                    </Box>

                                                    {/* Show selected files */}
                                                    {uploadedFiles.length > 0 && (
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                                Selected files:
                                                            </Typography>
                                                            <Stack spacing={1}>
                                                                {uploadedFiles.map((file, index) => (
                                                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Typography variant="body2">{file.name}</Typography>
                                                                        <Chip size="small" label={`${(file.size / 1024).toFixed(1)} KB`} />
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </Box>
                                                    )}
                                                </Box>

                                                {/* Existing Files Section */}
                                                {loadingFiles ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                                        <CircularProgress size={24} />
                                                    </Box>
                                                ) : existingFiles && existingFiles.batches && existingFiles.batches.length > 0 ? (
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                            Uploaded Income Files ({existingFiles.totalFiles})
                                                        </Typography>
                                                        <Stack spacing={1}>
                                                            {existingFiles.batches.map((file) => (
                                                                <Box
                                                                    key={file.id}
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        p: 1,
                                                                        bgcolor: 'grey.100',
                                                                        borderRadius: 1
                                                                    }}
                                                                >
                                                                    <Typography sx={{ flexGrow: 1 }}>{file.originalName}</Typography>
                                                                    <Chip size="small" label={`${(file.size / 1024).toFixed(1)} KB`} sx={{ mr: 1 }} />
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleImageClick(Api_URL + file.url)}
                                                                        sx={{ mr: 1 }}
                                                                    >
                                                                        <VisibilityIcon />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDeleteFile(file.batchId, file.savedAs)}
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                </Box>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                ) : (
                                                    <Alert severity="info">
                                                        No income files uploaded yet. Please upload income documents.
                                                    </Alert>
                                                )}
                                                <Stack spacing={2}>
                                                    <Stack direction="row" spacing={2}>
                                                        <TextField
                                                            label="Document Reference No"
                                                            value={incomeDocument}
                                                            onChange={(e) => setIncomeDocument(e.target.value)}
                                                            disabled={incomeApproved}
                                                            fullWidth
                                                            size="small"
                                                        />

                                                        <TextField
                                                            label="Expire Date"
                                                            type="date"
                                                            value={expireDate?.split('T')[0] || ''}
                                                            onChange={(e) => setExpireDate(e.target.value)}
                                                            InputLabelProps={{ shrink: true }}
                                                            inputProps={{ min: getTomorrowDate() }}
                                                            disabled={incomeApproved}
                                                            fullWidth
                                                            size="small"
                                                        />
                                                    </Stack>
                                                </Stack>


                                                {/* Legacy Income Files (from patron data) */}
                                                {/* {selectedPatron.incomeFiles && selectedPatron.incomeFiles.length > 0 && (
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                            Legacy Income Files
                                                        </Typography>
                                                        <Stack spacing={1}>
                                                            {selectedPatron.incomeFiles.map((file, index) => (
                                                                <Box
                                                                    key={index}
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        p: 1,
                                                                        bgcolor: 'grey.100',
                                                                        borderRadius: 1
                                                                    }}
                                                                >
                                                                    <Typography sx={{ flexGrow: 1 }}>{file.originalName}</Typography>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleDownloadFile(file.batchId, file.savedAs)}
                                                                    >
                                                                        <DownloadIcon />
                                                                    </IconButton>
                                                                </Box>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                )} */}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Customer Information Confirmation Form Section */}
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                                            Customer Information Confirmation Form *
                                        </Typography>
                                        <Stack spacing={2}>
                                            {/* Alert for unsigned submitType 2 patrons */}
                                            {selectedPatron.submitType === 2 && !selectedPatron.isSigned && (
                                                <Alert severity="warning" sx={{ display: 'flex', justifyContent: 'center' }}>
                                                    Patron need to confirm and sign signature before enroll player
                                                </Alert>
                                            )}

                                            <Box display="flex" justifyContent="center" gap={2}>
                                                <Button
                                                    variant="outlined"
                                                    onClick={handleLoadDocument}
                                                    disabled={loadingDocument}
                                                    startIcon={loadingDocument ? <CircularProgress size={16} /> : <VisibilityIcon />}
                                                >
                                                    Review document
                                                </Button>

                                                {/* Request Signature button - only for submitType 2 */}
                                                {canShowSignatureRequest() && (
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={handleRequestSignature}
                                                        disabled={!canRequestSignature() || requestingSignature}
                                                        startIcon={requestingSignature ? <CircularProgress size={16} /> : <SendIcon />}
                                                    >
                                                        Request Signature
                                                    </Button>
                                                )}
                                            </Box>

                                            {documentHtml && (
                                                <Box
                                                    sx={{
                                                        mt: 2,
                                                        p: 2,
                                                        border: '1px solid #ddd',
                                                        borderRadius: 1,
                                                        maxHeight: '400px',
                                                        overflow: 'auto',
                                                        bgcolor: 'background.paper'
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: documentHtml }}
                                                />
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>


                            </Stack>
                        )}
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)} sx={{ border: '1px solid #ccc' }}>
                            Close
                        </Button>

                        {/* {isEditing && (
                            <Button
                                variant="contained"
                                onClick={handleUpdatePatron}
                                startIcon={<SaveIcon />}
                            >
                                Update Patron
                            </Button>
                        )} */}

                        {!selectedPatron?.isHaveMembership && canEnrollPlayer() && (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setEnrollDialogOpen(true)}
                                startIcon={<CheckCircleIcon />}
                            >
                                Enroll Player
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>

                {/* Enroll Player Confirmation Dialog */}
                <Dialog
                    open={enrollDialogOpen}
                    onClose={() => setEnrollDialogOpen(false)}
                >
                    <DialogTitle>Confirm Enrollment</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to enroll this player as a member?
                        </Typography>
                        {selectedPatron && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    <strong>Name:</strong> {selectedPatron.firstName} {selectedPatron.lastName}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Phone:</strong> {selectedPatron.mobilePhone}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>ID Number:</strong> {selectedPatron.identificationNumber}
                                </Typography>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button sx={{ border: '1px solid #ccc' }} onClick={() => setEnrollDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleEnrollPlayer}
                            disabled={enrolling}
                            startIcon={enrolling ? <CircularProgress size={16} /> : undefined}
                        >
                            Confirm Enroll
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Image Viewer Dialog */}
                <Dialog
                    open={imageViewerOpen}
                    onClose={() => setImageViewerOpen(false)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Image Viewer</Typography>
                            <IconButton onClick={() => setImageViewerOpen(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 400 }}>
                            <img
                                src={selectedImage}
                                alt="Patron"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '80vh',
                                    objectFit: 'contain'
                                }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setImageViewerOpen(false)} sx={{ border: '1px solid #ccc' }}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    );
};

export default AdminRegistrationPage;