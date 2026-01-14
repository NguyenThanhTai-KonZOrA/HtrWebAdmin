import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Button,
    CircularProgress,
    Chip,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    FilterList as FilterListIcon,
    Search as SearchIcon,
    CleaningServices as ClearIcon,
    CloudDownload as ExportIcon
} from '@mui/icons-material';
import AdminLayout from '../components/layout/AdminLayout';
import { useSetPageTitle } from '../hooks/useSetPageTitle';
import { PAGE_TITLES } from '../constants/pageTitles';
import { patronService } from '../services/registrationService';
import type { PatronFilterRequest, PatronResponse } from '../registrationType';
import { FormatUtcTime } from '../utils/formatUtcTime';

// Registration Types
const REGISTRATION_TYPES = [
    { value: -1, label: 'All' },
    { value: 2, label: 'Manual' },
    { value: 1, label: 'Online' }
];

// Membership Status
const MEMBERSHIP_STATUS = [
    { value: -1, label: 'All' },
    { value: 1, label: 'Membership' },
    { value: 0, label: 'New Registration' }
];

const AdminRegistrationReport: React.FC = () => {
    useSetPageTitle('Registration Report');

    // States
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [patrons, setPatrons] = useState<PatronResponse[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Filter states
    const [registrationType, setRegistrationType] = useState<number>(-1);
    const [membershipStatus, setMembershipStatus] = useState<number>(-1);
    const [fromDate, setFromDate] = useState<string>(() => {
        // Set to 7 days ago in local time
        const date = new Date();
        date.setDate(date.getDate() - 7);
        // Format to local datetime-local format (YYYY-MM-DDTHH:mm)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    });
    const [toDate, setToDate] = useState<string>(() => {
        // Set to current date/time in local time
        const date = new Date();
        // Format to local datetime-local format (YYYY-MM-DDTHH:mm)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    });
    // Snackbar
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error"
    });

    const showSnackbar = (message: string, severity: "success" | "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Load patrons
    const loadPatrons = async () => {
        try {
            setLoading(true);

            const request: PatronFilterRequest = {
                Page: page + 1, // Server expects 1-based index
                PageSize: rowsPerPage,
                FromDate: fromDate || undefined,
                ToDate: toDate || undefined,
                IsMembership: membershipStatus === -1 ? undefined : membershipStatus === 1,
                Type: registrationType === -1 ? undefined : registrationType
            };

            const response = await patronService.getAllPatronsReportPagination(request);
            setPatrons(response?.data || []);
            setTotalRecords(response?.totalRecords || 0);
        } catch (error) {
            console.error('Error loading patrons:', error);
            showSnackbar('Failed to load registration report', 'error');
            setPatrons([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    };

    // Load patrons on mount and when pagination changes
    useEffect(() => {
        loadPatrons();
    }, [page, rowsPerPage]);

    // Handle search button click
    const handleSearch = () => {
        setPage(0); // Reset to first page
        loadPatrons();
    };

    // Handle page change
    const handlePageChange = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Reset filters
    const handleResetFilters = () => {
        setRegistrationType(-1);
        setMembershipStatus(-1);
        setFromDate(new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
        setToDate(new Date().toISOString().slice(0, 16));
        setPage(0);
    };

    // Export to Excel
    const handleExportExcel = async () => {
        try {
            setExporting(true);

            const request: PatronFilterRequest = {
                Page: 1,
                PageSize: 999999, // Export all records
                FromDate: fromDate || undefined,
                ToDate: toDate || undefined,
                IsMembership: membershipStatus === -1 ? undefined : membershipStatus === 1,
                Type: registrationType === -1 ? undefined : registrationType
            };

            await patronService.exportPatronFilter(request);
            showSnackbar('Excel file exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting Excel:', error);
            showSnackbar('Failed to export Excel file', 'error');
        } finally {
            setExporting(false);
        }
    };

    // Format date
    const formatDate = (dateString: string): string => {
        try {
            return FormatUtcTime.formatDateTime(dateString);
        } catch {
            return dateString;
        }
    };

    // Get registration type chip
    const getRegistrationTypeChip = (type: number) => {
        if (type === 2) {
            return <Chip label="Manual" color="secondary" size="small" />;
        } else if (type === 1) {
            return <Chip label="Online" color="success" size="small" />;
        }
        return <Chip label="Unknown" size="small" />;
    };

    // Get membership status chip
    const getMembershipChip = (hasMembership: boolean) => {
        return hasMembership ? (
            <Chip label="Membership" color="success" size="small" />
        ) : (
            <Chip label="New" color="secondary" size="small" />
        );
    };

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                <Card>
                    <CardContent>
                        {/* Filters */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                                    <FilterListIcon sx={{ mr: 1 }} />
                                    <Typography variant="h6">Filters</Typography>
                                </Box>

                                <Box display="flex" flexWrap="wrap" gap={2}>
                                    <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Registration Type</InputLabel>
                                            <Select
                                                value={registrationType}
                                                onChange={(e) => setRegistrationType(Number(e.target.value))}
                                                label="Registration Type"
                                            >
                                                {REGISTRATION_TYPES.map((type) => (
                                                    <MenuItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Membership Status</InputLabel>
                                            <Select
                                                value={membershipStatus}
                                                onChange={(e) => setMembershipStatus(Number(e.target.value))}
                                                label="Membership Status"
                                            >
                                                {MEMBERSHIP_STATUS.map((status) => (
                                                    <MenuItem key={status.value} value={status.value}>
                                                        {status.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                                        <TextField
                                            fullWidth
                                            label="From Date"
                                            type="datetime-local"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                            size="small"
                                        />
                                    </Box>

                                    <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                                        <TextField
                                            fullWidth
                                            label="To Date"
                                            type="datetime-local"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                            size="small"
                                        />
                                    </Box>

                                    <Box>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={<SearchIcon />}
                                            onClick={handleSearch}
                                            sx={{ height: '40px' }}
                                            disabled={loading}
                                        >
                                            Search
                                        </Button>
                                    </Box>

                                    <Box>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<ClearIcon />}
                                            onClick={handleResetFilters}
                                            sx={{ height: '40px' }}
                                        >
                                            Reset
                                        </Button>
                                    </Box>

                                    <Box>
                                        <Button
                                            variant="outlined"
                                            startIcon={<RefreshIcon />}
                                            onClick={loadPatrons}
                                            disabled={loading}
                                            sx={{ height: '40px' }}
                                        >
                                            Refresh
                                        </Button>
                                    </Box>

                                    <Box>
                                        <Button
                                            variant="outlined"
                                            color="success"
                                            startIcon={exporting ? <CircularProgress size={20} /> : <ExportIcon />}
                                            onClick={handleExportExcel}
                                            disabled={loading || exporting}
                                            sx={{ height: '40px' }}
                                        >
                                            Export Excel
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Patrons Table */}
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                    <Typography variant="h6">
                                        Registration Report ({totalRecords} records)
                                    </Typography>
                                </Box>

                                {loading ? (
                                    <Box display="flex" justifyContent="center" py={4}>
                                        <CircularProgress />
                                    </Box>
                                ) : (patrons?.length ?? 0) === 0 ? (
                                    <Alert severity="info">No registration records found</Alert>
                                ) : (
                                    <>
                                        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                            <Table stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        {/* <TableCell>ID</TableCell> */}
                                                        <TableCell align='center'>Registration Type</TableCell>
                                                        <TableCell>Player ID</TableCell>
                                                        <TableCell sx={{ minWidth: 200 }}>Full Name</TableCell>
                                                        <TableCell>Mobile Phone</TableCell>
                                                        <TableCell sx={{ minWidth: 200 }}>Nationality</TableCell>
                                                        <TableCell>Membership</TableCell>
                                                        {/* <TableCell>Is Updated</TableCell>
                                                        <TableCell>Is Signed</TableCell> */}
                                                        <TableCell sx={{ minWidth: 150 }}>Submitted Date</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {patrons?.map((patron) => (
                                                        <TableRow key={patron.pid} hover>
                                                            <TableCell align='center'>
                                                                {getRegistrationTypeChip(patron.submitType)}
                                                            </TableCell>
                                                            {/* <TableCell>{patron.pid}</TableCell> */}
                                                            <TableCell>{patron.playerId || '-'}</TableCell>
                                                            <TableCell>
                                                                {patron.firstName} {patron.lastName}
                                                            </TableCell>
                                                            <TableCell>{patron.mobilePhone || '-'}</TableCell>
                                                            <TableCell>{patron.identificationCountry || '-'}</TableCell>
                                                            <TableCell>
                                                                {getMembershipChip(patron.isHaveMembership)}
                                                            </TableCell>
                                                            {/* <TableCell>
                                                                {patron.isUpdated ? (
                                                                    <Chip label="Yes" color="success" size="small" />
                                                                ) : (
                                                                    <Chip label="No" color="default" size="small" />
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {patron.isSigned ? (
                                                                    <Chip label="Yes" color="success" size="small" />
                                                                ) : (
                                                                    <Chip label="No" color="default" size="small" />
                                                                )}
                                                            </TableCell> */}
                                                            <TableCell>{formatDate(patron.createdTime)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        <TablePagination
                                            component="div"
                                            count={totalRecords}
                                            page={page}
                                            onPageChange={handlePageChange}
                                            rowsPerPage={rowsPerPage}
                                            onRowsPerPageChange={handleRowsPerPageChange}
                                            rowsPerPageOptions={[10, 25, 50, 100]}
                                        />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>

                {/* Snackbar */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </AdminLayout>
    );
};

export default AdminRegistrationReport;
