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
    Refresh as RefreshIcon
} from '@mui/icons-material';
import {
    patronService,
    incomeDocumentService,
    renderDocumentService
} from '../services/registrationService';
import type {
    PatronResponse,
    CountryResponse,
    PatronImagesResponse,
    CheckValidIncomeRequest,
    FileDataRequest,
    PatronRegisterMembershipRequest
} from '../registrationType';
import AdminLayout from '../layout/AdminLayout';
import { useSetPageTitle } from '../hooks/useSetPageTitle';
import { PAGE_TITLES } from '../constants/pageTitles';
import { useAppData } from '../contexts/AppDataContext';
import { useSignalR } from '../hooks/useSignalR';
import Swal from 'sweetalert2';


function formatDate(dateString: string): string {
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

const VIETNAM_COUNTRY_ID = 704;

const AdminRegistrationPage: React.FC = () => {
    useSetPageTitle(PAGE_TITLES.REGISTRATION);

    // Get global data from context
    const { countries, staffDevice } = useAppData();

    // Initialize SignalR
    const signalR = useSignalR(staffDevice?.staffDeviceId);

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

    // Image viewer state
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>('');

    // Load initial data
    useEffect(() => {
        loadNewRegistrations();
        loadMemberships();
    }, []);

    // Setup SignalR event listeners
    useEffect(() => {
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

            // Reload data
            loadNewRegistrations();
            loadMemberships();
        });

        // Cleanup
        return () => {
            signalR.offNewRegistration();
            signalR.offSignatureCompleted();
        };
    }, [signalR]);

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
            setPatronUpdated(false);
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
        if (!editedPatron.country?.trim()) {
            errors.country = 'Country is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle patron update
    const handleUpdatePatron = async () => {
        if (!editedPatron) return;

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

            // Update the edited patron with the new values
            setEditedPatron(updatedPatron);
            setSelectedPatron(updatedPatron);

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

        try {
            setLoadingDocument(true);
            setDialogError(null);

            // Call API with patron ID and playerId
            const htmlContent = await renderDocumentService.renderDocumentFile(
                String(selectedPatron.pid),
                String(selectedPatron.playerId)
            );
            setDocumentHtml(htmlContent);
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

    // Check if income document is valid
    const isIncomeFormValid = (): boolean => {
        return !!(incomeDocument?.trim() && expireDate && new Date(expireDate) > new Date());
    };

    // Determine if Approve Income button should be enabled
    const canApproveIncome = (): boolean => {
        return areRequiredFieldsFilled() && isVietnamese() && isIncomeFormValid() && !incomeApproved;
    };

    // Determine if Enroll Player button should be enabled
    const canEnrollPlayer = (): boolean => {
        if (!areRequiredFieldsFilled()) return false;

        if (isVietnamese()) {
            return incomeApproved;
        }

        return true;
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
                        <TableCell sx={{ minWidth: 140 }}>Submit Date</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((patron) => (
                        <TableRow key={patron.pid} hover>
                            <TableCell
                                sx={{
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: 'background.paper',
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
                            <TableCell>{formatDate(patron.createdTime)}</TableCell>
                        </TableRow>
                    ))}
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
                                Edit & Update Information
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
                                                label="Mobile Phone *"
                                                value={editedPatron.mobilePhone || ''}
                                                onChange={(e) => setEditedPatron({ ...editedPatron, mobilePhone: e.target.value })}
                                                disabled={!isEditing}
                                                fullWidth
                                                size="small"
                                                error={!!validationErrors.mobilePhone}
                                                helperText={validationErrors.mobilePhone}
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
                                                        value={editedPatron.identificationTypeId ?? ''}
                                                        onChange={(e) => setEditedPatron({ ...editedPatron, identificationTypeId: Number(e.target.value) })}
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
                                                    onChange={(e) => setEditedPatron({ ...editedPatron, identificationNumber: e.target.value })}
                                                    disabled={!isEditing}
                                                    fullWidth
                                                    size="small"
                                                    error={!!validationErrors.identificationNumber}
                                                    helperText={validationErrors.identificationNumber}
                                                />

                                                <FormControl fullWidth disabled={!isEditing} error={!!validationErrors.identificationCountry} size="small">
                                                    <InputLabel>Nationality *</InputLabel>
                                                    <Select
                                                        value={editedPatron.identificationCountry || ''}
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
                                                />

                                                <FormControl fullWidth disabled={!isEditing} error={!!validationErrors.country} size="small">
                                                    <InputLabel>Country</InputLabel>
                                                    <Select
                                                        value={editedPatron.country || ''}
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

                                {/* Patron Images Section */}
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                                            Patron Images
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

                                <Box display="flex" justifyContent="center" mt={2} mb={1}>
                                    {isEditing && (
                                        <Typography variant="body1" color="error" sx={{ mr: 2, alignSelf: 'center' }}>
                                            Please review and verify the information of the patron before updating.
                                        </Typography>
                                    )}
                                </Box>

                                <Box display="flex" justifyContent="center" mb={2}>

                                    {isEditing && (
                                        <Button
                                            variant="contained"
                                            onClick={handleUpdatePatron}
                                            startIcon={<SaveIcon />}
                                        >
                                            Update Patron
                                        </Button>
                                    )}
                                </Box>


                                {/* Customer Information Confirmation Form Section */}
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                                            Customer Information Confirmation Form *
                                        </Typography>
                                        <Stack spacing={2}>
                                            {selectedPatron.submitType === 2 && !selectedPatron.isSigned ? (
                                                <Alert severity="error" sx={{ display: 'flex', justifyContent: 'center' }}>
                                                    Patron need to confirm and sign signature before enroll player
                                                </Alert>
                                            ) : (
                                                <>
                                                    <Box display="flex" justifyContent="center">
                                                        <Button
                                                            variant="outlined"
                                                            onClick={handleLoadDocument}
                                                            disabled={loadingDocument}
                                                            startIcon={loadingDocument ? <CircularProgress size={16} /> : <VisibilityIcon />}
                                                        >
                                                            Review document
                                                        </Button>
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
                                                </>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>

                                {/* Income Section (only for Vietnamese) */}
                                {isVietnamese() && (
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
                                                    startIcon={approvingIncome ? <CircularProgress size={16} /> : incomeApproved ? <CheckCircleIcon /> : undefined}
                                                    size="small"
                                                >
                                                    {incomeApproved ? 'Approved' : 'Approve Income'}
                                                </Button>
                                            </Box>

                                            <Stack spacing={2}>
                                                <TextField
                                                    label="Income Document"
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

                                                {/* Income Files */}
                                                {selectedPatron.incomeFiles && selectedPatron.incomeFiles.length > 0 && (
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                            Income Files
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
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                )}
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

                        {!selectedPatron?.isHaveMembership && patronUpdated && canEnrollPlayer() && (
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
                        <Button onClick={() => setEnrollDialogOpen(false)}>
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