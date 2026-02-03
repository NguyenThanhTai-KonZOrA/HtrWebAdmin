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
    Alert
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Close as CloseIcon,
    Visibility as VisibilityIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    FilterList as FilterListIcon,
    Search as SearchIcon,
    CleaningServices as IconReset
} from '@mui/icons-material';
import AdminLayout from '../components/layout/AdminLayout';
import { useSetPageTitle } from '../hooks/useSetPageTitle';
import { PAGE_TITLES } from '../constants/pageTitles';
import { auditLogService } from '../services/registrationService';
import type { AuditLogResponse, AuditLogPaginationRequest } from '../registrationType';
import { FormatUtcTime } from '../utils/formatUtcTime';


// Entity Types
const ENTITY_TYPES = [
    'All',
    'Patron',
    'Employee',
    'Mapping',
    'Authentication',
    'IncomeFile',
    'Signature',
    'Identification',
    'CustomerConfirmation'
];

// Actions
const ACTIONS = [
    'All',
    'UpdatePatron',
    'SyncImages',    
    'DeletePatron',
    'RegisterMembership',
    'RequestSignature',
    'SignDocument',
    'ReSignDocument',
    'CreateMapping',
    'UpdateMapping',
    'DeleteMapping',
    'UpdateSettings',
    'Login',
    'RevokeToken',
    'UploadFile',
    'DeleteFile',
    'GetDocumentByPlayerId',
    'ExportRegistrationReport',
    'GenerateDocuments'
];

const AdminAuditLogsPage: React.FC = () => {
    useSetPageTitle(PAGE_TITLES.AUDIT_LOGS || 'Audit Logs');

    // States
    const [loading, setLoading] = useState(true);
    const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Filter states
    const [entityType, setEntityType] = useState<string>('All');
    const [action, setAction] = useState<string>('All');
    const [userName, setUserName] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>(() => {
        // Set to 1 day ago in local time
        const date = new Date();
        date.setDate(date.getDate() - 1);
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
    const [isSuccess, setIsSuccess] = useState<string>('All');

    // Detail dialog states
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Load audit logs
    const loadAuditLogs = async () => {
        try {
            setLoading(true);

            const request: AuditLogPaginationRequest = {
                Page: page + 1, // Server expects 1-based index
                PageSize: rowsPerPage,
                EntityType: entityType !== 'All' ? entityType : undefined,
                Action: action !== 'All' ? action : undefined,
                UserName: userName.trim() || undefined,
                FromDate: fromDate || undefined,
                ToDate: toDate || undefined,
                IsSuccess: isSuccess === 'All' ? undefined : isSuccess === 'Success'
            };

            const response = await auditLogService.getAuditLogsFilterOptions(request);
            setAuditLogs(response.logs);
            setTotalRecords(response.totalRecords);
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load logs on mount and when filters change
    useEffect(() => {
        loadAuditLogs();
    }, [page, rowsPerPage]);

    // Handle search button click
    const handleSearch = () => {
        setPage(0); // Reset to first page
        loadAuditLogs();
    };

    // Handle row double click
    const handleRowDoubleClick = async (log: AuditLogResponse) => {
        try {
            setLoadingDetail(true);
            setDetailDialogOpen(true);

            // Fetch detailed log information
            const detailLog = await auditLogService.getAuditLogById(log.id);
            setSelectedLog(detailLog);
        } catch (error) {
            console.error('Error loading log detail:', error);
            setSelectedLog(log); // Fallback to list data
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
        setEntityType('All');
        setAction('All');
        setUserName('');
        setFromDate('');
        setToDate('');
        setIsSuccess('All');
        setPage(0);
    };

    // Format date
    const formatDate = (dateString: string): string => {
        try {
            return new Date(dateString).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Get status chip
    const getStatusChip = (isSuccess: boolean) => {
        return isSuccess ? (
            <Chip
                icon={<CheckCircleIcon />}
                label="Success"
                color="success"
                size="small"
            />
        ) : (
            <Chip
                icon={<ErrorIcon />}
                label="Failed"
                color="error"
                size="small"
            />
        );
    };

    // Get HTTP method color
    const getHttpMethodColor = (method: string): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
        switch (method?.toUpperCase()) {
            case 'GET':
                return 'info';
            case 'POST':
                return 'success';
            case 'PUT':
            case 'PATCH':
                return 'warning';
            case 'DELETE':
                return 'error';
            default:
                return 'primary';
        }
    };

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                <Card>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            {/* <Typography variant="h5" fontWeight="bold">
                                Audit Logs ({totalRecords})
                            </Typography> */}
                            {/* <Stack direction="row" spacing={1}>
                                <Tooltip title="Refresh">
                                    <IconButton
                                        onClick={loadAuditLogs}
                                        disabled={loading}
                                        color="primary"
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                            </Stack> */}
                        </Box>

                        {/* Filters Section */}
                        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'background.default' }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                                    <FilterListIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">Filters</Typography>
                                </Box>

                                <Box display="flex" flexWrap="wrap" gap={2}>

                                    {/* From Date */}
                                    <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
                                        <TextField
                                            label="From Date"
                                            type="datetime-local"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            size="small"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{
                                                max: FormatUtcTime.getTodayStringWithTime() // Prevent selecting future dates
                                            }}
                                            onFocus={(e) => {
                                                const input = e.target as HTMLInputElement;
                                                if (input.showPicker) {
                                                    input.showPicker();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSearch();
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* To Date */}
                                    <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
                                        <TextField
                                            label="To Date"
                                            type="datetime-local"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            size="small"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{
                                                max: FormatUtcTime.getTodayStringWithTime(),// Prevent selecting future dates
                                                min: toDate
                                            }}
                                            onFocus={(e) => {
                                                const input = e.target as HTMLInputElement;
                                                if (input.showPicker) {
                                                    input.showPicker();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSearch();
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Status */}
                                    <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                value={isSuccess}
                                                onChange={(e) => setIsSuccess(e.target.value)}
                                                label="Status"
                                            >
                                                <MenuItem value="All">All</MenuItem>
                                                <MenuItem value="Success">Success</MenuItem>
                                                <MenuItem value="Failed">Failed</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>



                                    {/* Entity Type */}
                                    <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Entity Type</InputLabel>
                                            <Select
                                                value={entityType}
                                                onChange={(e) => setEntityType(e.target.value)}
                                                label="Entity Type"
                                            >
                                                {ENTITY_TYPES.map((type) => (
                                                    <MenuItem key={type} value={type}>
                                                        {type}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* Action */}
                                    <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Action</InputLabel>
                                            <Select
                                                value={action}
                                                onChange={(e) => setAction(e.target.value)}
                                                label="Action"
                                            >
                                                {ACTIONS.map((act) => (
                                                    <MenuItem key={act} value={act}>
                                                        {act}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {/* User Name */}
                                    <Box >
                                        <TextField
                                            label="User Name"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            size="small"
                                            fullWidth
                                            placeholder="Search by username..."
                                        />
                                    </Box>

                                    {/* Action Buttons */}
                                    <Box sx={{ minWidth: 200, flex: '1 1 200px', display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleSearch}
                                            disabled={loading}
                                            size="medium"
                                            startIcon={<SearchIcon />}
                                        >
                                            Search
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            onClick={loadAuditLogs}
                                            size="medium"
                                            startIcon={<RefreshIcon />}
                                        >
                                            Refresh
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            onClick={handleResetFilters}
                                            size="medium"
                                            startIcon={<IconReset />}
                                        >
                                            Clear
                                        </Button>

                                        <Typography variant="body2" fontWeight="bold" sx={{ marginLeft: 'auto' }}>
                                            Audit Logs ({totalRecords})
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Table Section */}
                        <Box position="relative">
                            {/* Loading overlay */}
                            {loading && (
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    bottom={0}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    bgcolor="rgba(255, 255, 255, 0.7)"
                                    zIndex={10}
                                    sx={{ backdropFilter: 'blur(2px)' }}
                                >
                                    <CircularProgress size={40} />
                                </Box>
                            )}

                            {/* Table */}
                            <TableContainer component={Paper} sx={{ maxHeight: 600, opacity: loading ? 0.5 : 1 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', minWidth: 120 }}>User</TableCell>
                                            <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', minWidth: 150 }}>Action</TableCell>
                                            <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', minWidth: 100 }} align='center'>Entity Type</TableCell>
                                            <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', minWidth: 100 }} align='center'>Method</TableCell>
                                            <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', minWidth: 200 }}>Request Path</TableCell>
                                            <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', minWidth: 100 }} align='center'>Status</TableCell>
                                            {/* <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>IP Address</TableCell> */}
                                            <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', minWidth: 150 }}>Created At</TableCell>
                                            <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', minWidth: 60 }} align='center'>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {auditLogs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                                    <Typography color="text.secondary">
                                                        {loading ? 'Loading...' : 'No audit logs found'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            auditLogs.map((log) => (
                                                <TableRow
                                                    key={log.id}
                                                    hover
                                                    onDoubleClick={() => handleRowDoubleClick(log)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            backgroundColor: 'action.hover'
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 400 }}>{log.userName || '-'}</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 400 }}>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {log.action || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 400 }} align='center'>
                                                        <Chip
                                                            label={log.entityType || '-'}
                                                            size="small"
                                                            color="default"
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 400 }} align='center'>
                                                        <Chip
                                                            label={log.httpMethod}
                                                            size="small"
                                                            color={getHttpMethodColor(log.httpMethod)}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 400 }}>
                                                        <Typography variant="body2" noWrap title={log.requestPath}>
                                                            {log.requestPath}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 400 }} align='center'>{getStatusChip(log.isSuccess)}</TableCell>
                                                    {/* <TableCell>{log.ipAddress || '-'}</TableCell> */}
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 400 }}>
                                                        <Typography variant="body2">
                                                            {FormatUtcTime.formatDateTime(log.createdAt)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 400 }} align='center'>
                                                        <Tooltip title="View Details">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRowDoubleClick(log);
                                                                }}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            <TablePagination
                                component="div"
                                count={totalRecords}
                                page={page}
                                onPageChange={handlePageChange}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleRowsPerPageChange}
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                labelRowsPerPage="Rows per page:"
                            />
                        </Box>
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
                            <Typography variant="h6">Audit Log Details</Typography>
                            <IconButton onClick={handleCloseDetail}>
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
                            <Stack spacing={2}>
                                {/* Basic Information */}
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                            Basic Information
                                        </Typography>
                                        <Box display="flex" flexWrap="wrap" gap={2}>
                                            <Box flex="1 1 45%">
                                                <Typography variant="body2" color="text.secondary">ID</Typography>
                                                <Typography variant="body1">{selectedLog.id}</Typography>
                                            </Box>
                                            <Box flex="1 1 45%">
                                                <Typography variant="body2" color="text.secondary">User Name</Typography>
                                                <Typography variant="body1">{selectedLog.userName || '-'}</Typography>
                                            </Box>
                                            <Box flex="1 1 45%">
                                                <Typography variant="body2" color="text.secondary">Action</Typography>
                                                <Typography variant="body1" fontWeight="medium">{selectedLog.action}</Typography>
                                            </Box>
                                            <Box flex="1 1 45%">
                                                <Typography variant="body2" color="text.secondary">Entity Type</Typography>
                                                <Chip label={selectedLog.entityType} size="small" />
                                            </Box>
                                            <Box flex="1 1 45%">
                                                <Typography variant="body2" color="text.secondary">Entity ID</Typography>
                                                <Typography variant="body1">{selectedLog.entityId || '-'}</Typography>
                                            </Box>
                                            <Box flex="1 1 45%">
                                                <Typography variant="body2" color="text.secondary">Status</Typography>
                                                {getStatusChip(selectedLog.isSuccess)}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>

                                {/* Request Information */}
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                            Request Information
                                        </Typography>
                                        <Box display="flex" flexWrap="wrap" gap={2}>
                                            <Box flex="1 1 45%">
                                                <Typography variant="body2" color="text.secondary">HTTP Method</Typography>
                                                <Chip
                                                    label={selectedLog.httpMethod}
                                                    size="small"
                                                    color={getHttpMethodColor(selectedLog.httpMethod)}
                                                />
                                            </Box>
                                            <Box flex="1 1 45%">
                                                <Typography variant="body2" color="text.secondary">Status Code</Typography>
                                                <Typography variant="body1">{selectedLog.statusCode}</Typography>
                                            </Box>
                                            <Box flex="1 1 100%">
                                                <Typography variant="body2" color="text.secondary">Request Path</Typography>
                                                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                                    {selectedLog.requestPath}
                                                </Typography>
                                            </Box>
                                            <Box flex="1 1 45%">
                                                <Typography variant="body2" color="text.secondary">IP Address</Typography>
                                                <Typography variant="body1">{selectedLog.ipAddress}</Typography>
                                            </Box>
                                            <Box flex="1 1 45%">
                                                <Typography variant="body2" color="text.secondary">Created At</Typography>
                                                <Typography variant="body1">{FormatUtcTime.formatDateTime(selectedLog.createdAt)}</Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>

                                {/* User Agent */}
                                {selectedLog.userAgent && (
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                                User Agent
                                            </Typography>
                                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                                {selectedLog.userAgent}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Error Message */}
                                {selectedLog.errorMessage && (
                                    <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="error">
                                                Error Message
                                            </Typography>
                                            <Alert severity="error">
                                                {selectedLog.errorMessage}
                                            </Alert>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Details */}
                                {selectedLog.details && (
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                                Details
                                            </Typography>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    bgcolor: 'grey.100',
                                                    borderRadius: 1,
                                                    maxHeight: 300,
                                                    overflow: 'auto'
                                                }}
                                            >
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {selectedLog.details}
                                                </pre>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                )}
                            </Stack>
                        ) : (
                            <Typography>No data available</Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDetail} variant="outlined">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    );
};

export default AdminAuditLogsPage;
