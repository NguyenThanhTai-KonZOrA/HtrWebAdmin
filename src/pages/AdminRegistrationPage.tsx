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
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar,
    Divider,
    IconButton,
    Tooltip,
    Stack
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    CloudDownload as DownloadIcon
} from '@mui/icons-material';
import {
    patronService,
    countryService,
    staffDeviceService,
    incomeDocumentService,
    renderDocumentService
} from '../services/registrationService';
import type {
    PatronResponse,
    CountryResponse,
    CurrentStaffDeviceResponse,
    PatronImagesResponse,
    CheckValidIncomeRequest,
    FileDataRequest
} from '../registrationType';
import MainLayout from '../layout/MainLayout';
import AdminLayout from '../layout/AdminLayout';
import { useSetPageTitle } from '../hooks/useSetPageTitle';
import { PAGE_TITLES } from '../constants/pageTitles';


interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

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

const AdminRegistrationPage: React.FC = () => {
    useSetPageTitle(PAGE_TITLES.REGISTRATION);
    // States
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [newRegistrations, setNewRegistrations] = useState<PatronResponse[]>([]);
    const [memberships, setMemberships] = useState<PatronResponse[]>([]);
    const [countries, setCountries] = useState<CountryResponse[]>([]);
    const [staffDevice, setStaffDevice] = useState<CurrentStaffDeviceResponse | null>(null);

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

    // Income document states
    const [incomeDocument, setIncomeDocument] = useState('');
    const [expireDate, setExpireDate] = useState('');
    const [approvingIncome, setApprovingIncome] = useState(false);

    // Error and success states
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [
                staffDeviceData,
                countriesData,
                newRegData,
                membershipData
            ] = await Promise.all([
                staffDeviceService.getCurrentStaffDevice(),
                countryService.getCountries(),
                patronService.getAllPatrons(false), // New registrations
                patronService.getAllPatrons(true)   // Memberships
            ]);

            setStaffDevice(staffDeviceData);
            setCountries(countriesData);
            setNewRegistrations(newRegData);
            setMemberships(membershipData);
        } catch (err) {
            setError('Failed to load data. Please try again.');
            console.error('Error loading initial data:', err);
        } finally {
            setLoading(false);
        }
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
            setLoading(true);

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

            // Reset income document fields
            setIncomeDocument('');
            setExpireDate(getTomorrowDate());
        } catch (err) {
            setError('Failed to load patron details.');
            console.error('Error loading patron details:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle patron update
    const handleUpdatePatron = async () => {
        if (!editedPatron) return;

        try {
            setLoading(true);
            await patronService.updatePatron(editedPatron);
            setSuccess('Patron updated successfully!');
            setDialogOpen(false);

            // Refresh data
            await loadInitialData();
        } catch (err) {
            setError('Failed to update patron.');
            console.error('Error updating patron:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle income document approval
    const handleApproveIncome = async () => {
        if (!selectedPatron || !incomeDocument || !expireDate) return;

        try {
            setApprovingIncome(true);

            const request: CheckValidIncomeRequest = {
                PatronId: selectedPatron.pid,
                IncomeDocument: incomeDocument,
                ExpireDate: expireDate,
                Files: selectedPatron.incomeFiles || []
            };

            await incomeDocumentService.approveValidIncomeDocument(request);
            setSuccess('Income document approved successfully!');
            setDialogOpen(false);

            // Refresh data
            await loadInitialData();
        } catch (err) {
            setError('Failed to approve income document.');
            console.error('Error approving income document:', err);
        } finally {
            setApprovingIncome(false);
        }
    };

    // Handle file download
    const handleDownloadFile = async (batchId: string, saveAs: string) => {
        try {
            const file = await renderDocumentService.renderDocumentFile(batchId, saveAs);
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = saveAs;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download file.');
            console.error('Error downloading file:', err);
        }
    };

    // Validation for required fields
    const isFormValid = () => {
        if (!editedPatron) return false;
        return !!(
            editedPatron.firstName &&
            editedPatron.lastName &&
            editedPatron.mobilePhone &&
            editedPatron.identificationNumber &&
            editedPatron.country
        );
    };

    const isIncomeFormValid = () => {
        return !!(incomeDocument && expireDate && new Date(expireDate) > new Date());
    };

    // Render table
    const renderTable = (data: PatronResponse[]) => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>PID</TableCell>
                        <TableCell>Full Name</TableCell>
                        <TableCell>Mobile Phone</TableCell>
                        <TableCell>Country</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created Time</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((patron) => (
                        <TableRow key={patron.pid}>
                            <TableCell>{patron.pid}</TableCell>
                            <TableCell>{`${patron.firstName} ${patron.lastName}`}</TableCell>
                            <TableCell>{patron.mobilePhone}</TableCell>
                            <TableCell>{patron.country}</TableCell>
                            <TableCell>
                                <Chip
                                    label={patron.isHaveMembership ? 'Member' : 'New'}
                                    color={patron.isHaveMembership ? 'success' : 'warning'}
                                />
                            </TableCell>
                            <TableCell>{formatDate(patron.createdTime)}</TableCell>
                            <TableCell>
                                <Tooltip title={patron.isHaveMembership ? 'View Details' : 'Edit Details'}>
                                    <IconButton
                                        onClick={() => handlePatronAction(patron)}
                                        color="primary"
                                    >
                                        {patron.isHaveMembership ? <VisibilityIcon /> : <EditIcon />}
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (loading && !dialogOpen) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                {/* Staff Device Info */}
                {/* {staffDevice && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Current Staff Device
                        </Typography>
                        <Typography>
                            Device ID: {staffDevice.staffDeviceId} |
                            Location: {staffDevice.location} |
                            Host: {staffDevice.hostName}
                        </Typography>
                    </CardContent>
                </Card>
            )} */}

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                        <Tab label={`New Registration (${filteredNewRegistrations.length})`} />
                        <Tab label={`Membership (${filteredMemberships.length})`} />
                    </Tabs>
                </Box>

                {/* New Registration Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Search New Registrations"
                            variant="outlined"
                            value={newRegSearch}
                            onChange={(e) => setNewRegSearch(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                    </Box>

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
                </TabPanel>

                {/* Membership Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Search Memberships"
                            variant="outlined"
                            value={membershipSearch}
                            onChange={(e) => setMembershipSearch(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                    </Box>

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
                </TabPanel>

                {/* Patron Detail Dialog */}
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">
                                {selectedPatron?.isHaveMembership ? 'View Patron Details' : 'Edit Patron Details'}
                            </Typography>
                            <IconButton onClick={() => setDialogOpen(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>

                    <DialogContent dividers>
                        {selectedPatron && editedPatron && (
                            <Stack spacing={3}>
                                {/* Basic Information */}
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Basic Information
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Stack direction="row" spacing={2}>
                                            <TextField
                                                label="First Name *"
                                                value={editedPatron.firstName}
                                                onChange={(e) => setEditedPatron({ ...editedPatron, firstName: e.target.value })}
                                                disabled={!isEditing}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Last Name *"
                                                value={editedPatron.lastName}
                                                onChange={(e) => setEditedPatron({ ...editedPatron, lastName: e.target.value })}
                                                disabled={!isEditing}
                                                fullWidth
                                            />
                                        </Stack>

                                        <Stack direction="row" spacing={2}>
                                            <TextField
                                                label="Mobile Phone *"
                                                value={editedPatron.mobilePhone}
                                                onChange={(e) => setEditedPatron({ ...editedPatron, mobilePhone: e.target.value })}
                                                disabled={!isEditing}
                                                fullWidth
                                            />
                                            <FormControl fullWidth disabled={!isEditing}>
                                                <InputLabel>Country *</InputLabel>
                                                <Select
                                                    value={editedPatron.country}
                                                    onChange={(e) => setEditedPatron({ ...editedPatron, country: e.target.value })}
                                                >
                                                    {countries.map((country) => (
                                                        <MenuItem key={country.CountryID} value={country.CountryDescription}>
                                                            {country.CountryDescription}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Stack>

                                        <Stack direction="row" spacing={2}>
                                            <TextField
                                                label="Job Title"
                                                value={editedPatron.jobTitle}
                                                onChange={(e) => setEditedPatron({ ...editedPatron, jobTitle: e.target.value })}
                                                disabled={!isEditing}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Position"
                                                value={editedPatron.position}
                                                onChange={(e) => setEditedPatron({ ...editedPatron, position: e.target.value })}
                                                disabled={!isEditing}
                                                fullWidth
                                            />
                                        </Stack>

                                        <TextField
                                            label="Address"
                                            value={editedPatron.address}
                                            onChange={(e) => setEditedPatron({ ...editedPatron, address: e.target.value })}
                                            disabled={!isEditing}
                                            fullWidth
                                            multiline
                                            rows={2}
                                        />
                                    </Stack>
                                </Box>

                                {/* Identification Information */}
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Identification Information
                                    </Typography>
                                    <Stack direction="row" spacing={2}>
                                        <TextField
                                            label="Identification Number *"
                                            value={editedPatron.identificationNumber}
                                            onChange={(e) => setEditedPatron({ ...editedPatron, identificationNumber: e.target.value })}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Identification Country"
                                            value={editedPatron.identificationCountry}
                                            onChange={(e) => setEditedPatron({ ...editedPatron, identificationCountry: e.target.value })}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="body2" sx={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }} gutterBottom>
                                        Please review and be careful with the patron information before Enroll Player!
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="center" gap={2}>
                                    {isEditing && (
                                        <Button
                                            variant="contained"
                                            onClick={handleUpdatePatron}
                                            disabled={!isFormValid() || loading}
                                            startIcon={<SaveIcon />}
                                        >
                                            Update Patron
                                        </Button>
                                    )}
                                </Box>

                                {/* Images */}
                                {patronImages && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            Images
                                        </Typography>
                                        <Stack direction="row" spacing={3} justifyContent="center">
                                            <Box textAlign="center">
                                                <Typography variant="subtitle2">Front Image</Typography>
                                                <Avatar
                                                    src={patronImages.FrontImage}
                                                    sx={{ width: 120, height: 120, mx: 'auto', mt: 1 }}
                                                    variant="rounded"
                                                />
                                            </Box>
                                            <Box textAlign="center">
                                                <Typography variant="subtitle2">Back Image</Typography>
                                                <Avatar
                                                    src={patronImages.BackImage}
                                                    sx={{ width: 120, height: 120, mx: 'auto', mt: 1 }}
                                                    variant="rounded"
                                                />
                                            </Box>
                                            <Box textAlign="center">
                                                <Typography variant="subtitle2">Selfie Image</Typography>
                                                <Avatar
                                                    src={patronImages.SelfieImage}
                                                    sx={{ width: 120, height: 120, mx: 'auto', mt: 1 }}
                                                    variant="rounded"
                                                />
                                            </Box>
                                        </Stack>
                                    </Box>
                                )}

                                {/* Income Files */}
                                {selectedPatron.incomeFiles && selectedPatron.incomeFiles.length > 0 && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            Income Files
                                        </Typography>
                                        <Stack spacing={1}>
                                            {selectedPatron.incomeFiles.map((file, index) => (
                                                <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
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

                                {/* Income Document Approval Section */}
                                {!selectedPatron.isHaveMembership && (
                                    <Box>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            Income Document Approval
                                        </Typography>

                                        <Stack spacing={2}>
                                            <TextField
                                                label="Income Document"
                                                value={incomeDocument}
                                                onChange={(e) => setIncomeDocument(e.target.value)}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Expire Date"
                                                type="date"
                                                value={expireDate}
                                                onChange={(e) => setExpireDate(e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ min: getTomorrowDate() }}
                                                fullWidth
                                            />
                                        </Stack>
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </DialogContent>

                    <DialogActions>
                        {/* {isEditing && (
                            <Button
                                variant="contained"
                                onClick={handleUpdatePatron}
                                disabled={!isFormValid() || loading}
                                startIcon={<SaveIcon />}
                            >
                                Update Patron
                            </Button>
                        )} */}

                        {/* {!selectedPatron?.isHaveMembership && (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleApproveIncome}
                                disabled={!isIncomeFormValid() || approvingIncome}
                                startIcon={approvingIncome ? <CircularProgress size={16} /> : undefined}
                            >
                                Approve Income
                            </Button>
                        )} */}

                        <Button onClick={() => setDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    );
};

export default AdminRegistrationPage;