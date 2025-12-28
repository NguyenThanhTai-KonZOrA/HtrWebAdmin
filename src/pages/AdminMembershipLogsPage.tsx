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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    IconButton,
    Chip,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Close as CloseIcon,
    Visibility as VisibilityIcon,
    FilterList as FilterListIcon,
    Search as SearchIcon,
    CleaningServices as ClearIcon,
    CloudDownload as ImportExportIcon
} from '@mui/icons-material';
import AdminLayout from '../components/layout/AdminLayout';
import { useSetPageTitle } from '../hooks/useSetPageTitle';
import { PAGE_TITLES } from '../constants/pageTitles';
import { auditLogService } from '../services/registrationService';
import type { AuditLogsRegisterMembershipResponse, AuditLogsRegisterMembershipRequest, AuditLogResponse } from '../registrationType';
import { FormatUtcTime } from '../utils/formatUtcTime';

// Action Types
const ACTION_TYPES = [
    'All',
    'RegisterMembership',
    'UpdateMembership',
    'ApproveMembership',
    'RejectMembership',
    'CancelMembership'
];

// Membership Status
const MEMBERSHIP_STATUS = [
    'All',
    'Pending',
    'Approved',
    'Rejected',
    'Active',
    'Inactive',
    'Cancelled'
];

const AdminMembershipLogsPage: React.FC = () => {
    useSetPageTitle(PAGE_TITLES.ENROLL_MEMBERSHIP_LOGS);

    // States
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLogsRegisterMembershipResponse[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Filter states
    const [playerId, setPlayerId] = useState<string>('');
    const [actionType, setActionType] = useState<string>('All');
    const [membershipStatus, setMembershipStatus] = useState<string>('All');
    const [userName, setUserName] = useState<string>('');
    // - 1 day 
    const [fromDate, setFromDate] = useState<string>(new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)); // Default to 1 day ago
    const [toDate, setToDate] = useState<string>(new Date().toISOString().slice(0, 16)); // Default to current date

    // Detail dialog states
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    //  Show snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
    const showSnackbar = (message: string, severity: "success" | "error") => {
        setSnackbar({ open: true, message, severity });
    };
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Load membership logs
    const loadMembershipLogs = async () => {
        try {
            setLoading(true);

            const request: AuditLogsRegisterMembershipRequest = {
                PlayerId: playerId ? parseInt(playerId) : 0,
                ActionType: actionType !== 'All' ? actionType : '',
                MembershipStatus: membershipStatus !== 'All' ? membershipStatus : '',
                FromDate: fromDate || '',
                ToDate: toDate || '',
                UserName: userName.trim() || undefined,
                Page: page + 1, // Server expects 1-based index
                PageSize: rowsPerPage
            };

            const response = await auditLogService.getRegisteredLogs(request);
            setLogs(response?.logs || []);
            setTotalRecords(response?.totalRecords || 0);
        } catch (error) {
            console.error('Error loading membership logs:', error);
            setLogs([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    };

    // Load logs on mount and when pagination changes
    useEffect(() => {
        loadMembershipLogs();
    }, [page, rowsPerPage]);

    // Handle search button click
    const handleSearch = () => {
        setPage(0); // Reset to first page
        loadMembershipLogs();
    };

    // Handle row double click
    const handleRowDoubleClick = async (log: AuditLogsRegisterMembershipResponse) => {
        try {
            setLoadingDetail(true);
            setDetailDialogOpen(true);

            // Fetch detailed log information
            const detailLog = await auditLogService.getAuditLogById(log.id);
            setSelectedLog(detailLog);
        } catch (error) {
            console.error('Error loading log detail:', error);
            setSelectedLog(null); // Fallback to list data
        } finally {
            setLoadingDetail(false);
        }
    };

    // Handle close detail dialog
    const handleCloseDetail = () => {
        setDetailDialogOpen(false);
        setSelectedLog(null);
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
        setPlayerId('');
        setActionType('All');
        setMembershipStatus('All');
        setUserName('');
        // - 1 day
        setFromDate(new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
        setToDate(new Date().toISOString().slice(0, 16));
        setPage(0);
    };

    // Format date
    const formatDate = (dateString: string): string => {
        try {
            return FormatUtcTime.formatDateTime(dateString);
        } catch {
            return dateString;
        }
    };

    const handleExportExcel = async () => {
        try {
            setLoading(true);
            // Build request with current filters
            const request: AuditLogsRegisterMembershipRequest = {
                PlayerId: playerId ? parseInt(playerId) : 0,
                ActionType: actionType !== 'All' ? actionType : '',
                MembershipStatus: membershipStatus !== 'All' ? membershipStatus : '',
                FromDate: fromDate || '',
                ToDate: toDate || '',
                UserName: userName.trim() || undefined,
                Page: 1, // Export all pages
                PageSize: 999999 // Large number to get all records
            };
            // Call API to get Excel file
            const response = await auditLogService.exportEnrolledEmployees(request);
            showSnackbar('Excel file exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting enrolled employees:', error);
            showSnackbar('Failed to export Excel file. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };


    // Get action chip color
    const getActionColor = (action: string): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
        const lowerAction = action?.toLowerCase() || '';
        if (lowerAction.includes('register') || lowerAction.includes('create')) return 'primary';
        if (lowerAction.includes('approve')) return 'success';
        if (lowerAction.includes('reject') || lowerAction.includes('cancel')) return 'error';
        if (lowerAction.includes('update')) return 'warning';
        return 'default';
    };

    // Get status chip color
    const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
        const lowerStatus = status?.toLowerCase() || '';
        if (lowerStatus === 'active' || lowerStatus === 'approved') return 'success';
        if (lowerStatus === 'pending') return 'warning';
        if (lowerStatus === 'rejected' || lowerStatus === 'cancelled' || lowerStatus === 'inactive') return 'error';
        return 'default';
    };

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    {/* <Typography variant="h4" component="h1">
                        Membership Logs
                    </Typography> */}

                </Box>
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
                                    <Box sx={{ minWidth: 100, flex: '1 1 100px' }}>
                                        <TextField
                                            fullWidth
                                            label="Player ID"
                                            type="number"
                                            value={playerId}
                                            onChange={(e) => setPlayerId(e.target.value)}
                                            placeholder="Enter Player ID"
                                            size="small"
                                        />
                                    </Box>

                                    {/* <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Action Type</InputLabel>
                                    <Select
                                        value={actionType}
                                        label="Action Type"
                                        onChange={(e) => setActionType(e.target.value)}
                                    >
                                        {ACTION_TYPES.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box> */}

                                    {/* <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Membership Status</InputLabel>
                                    <Select
                                        value={membershipStatus}
                                        label="Membership Status"
                                        onChange={(e) => setMembershipStatus(e.target.value)}
                                    >
                                        {MEMBERSHIP_STATUS.map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box> */}

                                    <Box sx={{ minWidth: 100, flex: '1 1 100px' }}>
                                        <TextField
                                            fullWidth
                                            label="User Name"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="Enter User Name"
                                            size="small"
                                        />
                                    </Box>

                                    <Box sx={{ minWidth: 100, flex: '1 1 100px' }}>
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

                                    <Box sx={{ minWidth: 100, flex: '1 1 100px' }}>
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

                                    <Box >
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={<SearchIcon />}
                                            onClick={handleSearch}
                                            sx={{ height: '40px' }}
                                        >
                                            Search
                                        </Button>
                                    </Box>

                                    <Box >
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
                                            onClick={loadMembershipLogs}
                                            disabled={loading}
                                            sx={{ height: '40px' }}
                                        >
                                            Refresh
                                        </Button>
                                    </Box>

                                    <Box>
                                        <Button
                                            variant="outlined"
                                            startIcon={<ImportExportIcon />}
                                            onClick={handleExportExcel}
                                            disabled={loading}
                                            sx={{ height: '40px' }}
                                        >
                                            Export Excel
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Logs Table */}
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                    <Typography variant="h6">
                                        Enrollment Logs ({totalRecords} records)
                                    </Typography>
                                </Box>

                                {loading ? (
                                    <Box display="flex" justifyContent="center" py={4}>
                                        <CircularProgress />
                                    </Box>
                                ) : (logs?.length ?? 0) === 0 ? (
                                    <Alert severity="info">No Enrollment logs found</Alert>
                                ) : (
                                    <>
                                        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                            <Table stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell align="center"
                                                            sx={{
                                                                position: 'sticky',
                                                                left: 0,
                                                                backgroundColor: 'background.paper',
                                                                zIndex: 3,
                                                                boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
                                                            }}>
                                                            Details
                                                        </TableCell>
                                                        {/* <TableCell>ID</TableCell> */}
                                                        {/* <TableCell>Action Type</TableCell> */}
                                                        <TableCell>Employee Code</TableCell>
                                                        <TableCell>Employee Name</TableCell>
                                                        <TableCell>Player ID</TableCell>
                                                        {/* <TableCell>Player Name</TableCell> */}
                                                        <TableCell>Status</TableCell>
                                                        <TableCell sx={{ minWidth: 150 }}>Enrollment Date</TableCell>
                                                        {/* <TableCell sx={{ minWidth: 200 }}>Details</TableCell> */}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {logs?.map((log) => (
                                                        <TableRow
                                                            key={log.id}
                                                            hover
                                                            sx={{ cursor: 'pointer' }}
                                                            onDoubleClick={() => handleRowDoubleClick(log)}
                                                        >
                                                            <TableCell
                                                                align="center"
                                                                sx={{
                                                                    position: 'sticky',
                                                                    left: 0,
                                                                    backgroundColor: 'background.paper',
                                                                    zIndex: 1,
                                                                    boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
                                                                }}>
                                                                <Tooltip title="View Details">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => handleRowDoubleClick(log)}
                                                                    >
                                                                        <VisibilityIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                            {/* <TableCell>{log.id}</TableCell> */}
                                                            {/* <TableCell>
                                                        <Chip
                                                            label={log.actionType}
                                                            color={getActionColor(log.actionType)}
                                                            size="small"
                                                        />
                                                    </TableCell> */}
                                                            <TableCell>{log.employeeCode || '-'}</TableCell>
                                                            <TableCell>{log.employeeName || '-'}</TableCell>
                                                            <TableCell>{log.playerId || '-'}</TableCell>
                                                            {/* <TableCell>{log.playerName || '-'}</TableCell> */}
                                                            <TableCell>
                                                                {log.isSuccess !== undefined ? (
                                                                    <Chip
                                                                        label={log.isSuccess ? 'Success' : 'Failed'}
                                                                        color={log.isSuccess ? 'success' : 'error'}
                                                                        size="small"
                                                                    />
                                                                ) : '-'}
                                                            </TableCell>
                                                            <TableCell>{formatDate(log.actionDate)}</TableCell>
                                                            {/* <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                maxWidth: 200,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {log.details || '-'}
                                                        </Typography>
                                                    </TableCell> */}
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



                {/* Detail Dialog */}
                <Dialog
                    open={detailDialogOpen}
                    onClose={handleCloseDetail}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Log Details</Typography>
                            <IconButton onClick={handleCloseDetail} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent dividers>
                        {loadingDetail ? (
                            <Box display="flex" justifyContent="center" py={4}>
                                <CircularProgress />
                            </Box>
                        ) : selectedLog ? (
                            <Stack spacing={3}>
                                {/* Row 1: Log ID - Action Type */}
                                <Box display="flex" gap={3}>
                                    <Box flex={1}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Log ID
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {selectedLog.id}
                                        </Typography>
                                    </Box>
                                    <Box flex={1}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Action Type
                                        </Typography>
                                        <Chip
                                            label={selectedLog.action}
                                            color={getActionColor(selectedLog.action)}
                                            size="small"
                                        />
                                    </Box>
                                </Box>

                                {/* Row 2: User Name - Entity Type */}
                                <Box display="flex" gap={3}>
                                    <Box flex={1}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            User Name
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {selectedLog.userName || '-'}
                                        </Typography>
                                    </Box>
                                    <Box flex={1}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Entity Type
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {selectedLog.entityType || '-'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Row 3: Player ID - Status */}
                                <Box display="flex" gap={3}>
                                    <Box flex={1}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Player ID
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {selectedLog.entityId || '-'}
                                        </Typography>
                                    </Box>
                                    <Box flex={1}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Status
                                        </Typography>
                                        {selectedLog.isSuccess !== undefined ? (
                                            <Chip
                                                label={selectedLog.isSuccess ? 'Success' : 'Failed'}
                                                color={selectedLog.isSuccess ? 'success' : 'error'}
                                                size="small"
                                            />
                                        ) : (
                                            <Typography variant="body1">-</Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* Enrollment Date - Full Width */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Enrollment Date
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {selectedLog.createdAt ? formatDate(selectedLog.createdAt) : '-'}
                                    </Typography>
                                </Box>

                                {/* Details - Full Width */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Details
                                    </Typography>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            mt: 1,
                                            backgroundColor: 'background.default',
                                            maxHeight: 300,
                                            overflow: 'auto'
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            component="pre"
                                            sx={{
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                fontFamily: 'monospace'
                                            }}
                                        >
                                            {selectedLog.details || 'No details available'}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Stack>
                        ) : (
                            <Alert severity="info">No log data available</Alert>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDetail} variant="contained">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AdminLayout>
    );
};

export default AdminMembershipLogsPage;
