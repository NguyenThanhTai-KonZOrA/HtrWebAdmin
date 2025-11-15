import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress,
    Alert,
    Skeleton,
    Pagination,
    Switch,
    Chip,
    IconButton,
    Tooltip,
    Snackbar
} from "@mui/material";
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    ToggleOn as ToggleOnIcon,
    ToggleOff as ToggleOffIcon
} from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";
import AdminLayout from "../layout/AdminLayout";
import { counterService } from "../services/queueService";
import type { CountersReportResponse } from "../type";
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";

export default function AdminCounterPage() {
    useSetPageTitle(PAGE_TITLES.COUNTERS);
    const [counters, setCounters] = useState<CountersReportResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toggleLoading, setToggleLoading] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
    const [saving, setSaving] = useState(false);
    // Search and pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
    const showSnackbar = (message: string, severity: "success" | "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleDoubleClick = (counter: any) => {
        setEditingId(counter.id);
        setEditingValue(counter.hostName);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditingValue(e.target.value);
    };

    const handleSave = async (counter: any) => {
        try {

            var checkedHostName = await counterService.checkedHostName({ hostName: editingValue });
            if (checkedHostName && editingValue !== counter.hostName) {
                showSnackbar('Host name already exists. Please choose a different one.', "error");
                return;
            }

            if (checkedHostName === false && editingValue.trim() === "") {
                showSnackbar('Host name is required. Please enter a host name.', "error");
                return;
            }

            setSaving(checkedHostName);
            const result = await counterService.changeHostNameCounter({
                counterId: counter.id,
                hostName: editingValue
            });

            if (result.isChangeSuccess) {
                showSnackbar(`Change Host name for Counter ${counter.id} Success!`, "success");
                counter.hostName = editingValue;
                setEditingId(null);
            }
        } catch (error: any) {
            console.error("Error updating counter host name:", error);

            // Handle HTTP error responses (400, 500, etc.)
            let errorMessage = "Error updating counter host name";

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.response?.data?.data) {
                errorMessage = typeof error.response.data.data === 'string'
                    ? error.response.data.data
                    : (error.response.data.data?.message || JSON.stringify(error.response.data.data));
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
            throw error;
        } finally {
            setSaving(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const loadCounters = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await counterService.getCountersReport();
            setCounters(data);
        } catch (error) {
            console.error("Error loading counters:", error);
            setError("Failed to load counters data");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (counterId: number) => {
        try {
            setToggleLoading(counterId);
            const result = await counterService.changeStatusCounter(counterId);

            if (result.isChangeSuccess) {
                showSnackbar(`Change Status for Counter ${counterId} Success!`, "success");
                setCounters(prevCounters =>
                    prevCounters.map(counter =>
                        counter.id === counterId
                            ? {
                                ...counter,
                                status: !counter.status,
                                statusName: !counter.status ? "Active" : "Inactive"
                            }
                            : counter
                    )
                );
            } else {
                setError("Failed to change counter status");
            }
        } catch (error: any) {
            console.error("Error updating counter status:", error);

            // Handle HTTP error responses (400, 500, etc.)
            let errorMessage = "Error updating counter status";

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.response?.data?.data) {
                errorMessage = typeof error.response.data.data === 'string'
                    ? error.response.data.data
                    : (error.response.data.data?.message || JSON.stringify(error.response.data.data));
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
            throw error;
        } finally {
            setToggleLoading(null);
        }
    };

    // Auto load data on component mount
    useEffect(() => {
        loadCounters();
    }, []);

    // Search and pagination logic
    const filteredCounters = useMemo(() => {
        if (!searchTerm) return counters;

        return counters.filter(counter =>
            counter.counterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            counter.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            counter.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            counter.statusName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [counters, searchTerm]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredCounters.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredCounters.slice(startIndex, endIndex);

    // Reset to first page when search term or items per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    const handleItemsPerPageChange = (event: any) => {
        setItemsPerPage(event.target.value);
        setCurrentPage(1);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminLayout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage counter status and view performance statistics
                    </Typography>
                </Box>

                {/* Search and Actions */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={3} alignItems="center">
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Search counters..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Items per page</InputLabel>
                                    <Select
                                        value={itemsPerPage}
                                        label="Items per page"
                                        onChange={handleItemsPerPageChange}
                                    >
                                        <MenuItem value={5}>5</MenuItem>
                                        <MenuItem value={10}>10</MenuItem>
                                        <MenuItem value={20}>20</MenuItem>
                                        <MenuItem value={50}>50</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<RefreshIcon />}
                                    onClick={loadCounters}
                                    disabled={loading}
                                >
                                    Refresh
                                </Button>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                                    Total: {filteredCounters.length} counters
                                    {searchTerm && ` (filtered from ${counters.length})`}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} action={
                        <IconButton size="small" onClick={loadCounters}>
                            <RefreshIcon />
                        </IconButton>
                    }>
                        {error}
                    </Alert>
                )}

                {/* Counters Table */}
                <Card>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 20 }}>
                                            No.
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 120 }}>
                                            Counter Name
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 180 }}>
                                            Description
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 120 }}>
                                            Host Name
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 120 }}>
                                            Avg Serving Time
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                            Status
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 140 }}>
                                            Created At
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>
                                            Created By
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, minWidth: 100 }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        // Loading skeleton rows
                                        Array.from({ length: itemsPerPage }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Skeleton width="100px" /></TableCell>
                                                <TableCell><Skeleton width="150px" /></TableCell>
                                                <TableCell><Skeleton width="100px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="80px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="60px" /></TableCell>
                                                <TableCell><Skeleton width="120px" /></TableCell>
                                                <TableCell><Skeleton width="80px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="60px" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : currentPageData.length > 0 ? (
                                        currentPageData.map((counter) => (
                                            <TableRow
                                                key={counter.id}
                                                sx={{
                                                    '&:nth-of-type(even)': { bgcolor: '#f8f9fa' },
                                                    '&:hover': { bgcolor: '#e3f2fd' }
                                                }}
                                            >
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }}>
                                                    {counter.id}
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }}>
                                                    {counter.counterName}
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {counter.description}
                                                </TableCell>
                                                <TableCell
                                                    sx={{ borderRight: '1px solid #e0e0e0', cursor: 'pointer' }}
                                                    onDoubleClick={() => handleDoubleClick(counter)}
                                                >
                                                    {editingId === counter.id ? (
                                                        <TextField
                                                            value={editingValue}
                                                            onChange={handleChange}
                                                            size="small"
                                                            variant="outlined"
                                                            autoFocus
                                                            onBlur={() => handleSave(counter)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSave(counter);
                                                                if (e.key === 'Escape') setEditingId(null);
                                                            }}
                                                            disabled={saving}
                                                            sx={{ width: '100%' }}
                                                        />
                                                    ) : (
                                                        <Typography>{counter.hostName}</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {counter.averageServingTime}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Chip
                                                        label={counter.statusName}
                                                        color={counter.status ? "success" : "error"}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {formatDate(counter.createdAt)}
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {counter.createdBy}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title={`${counter.status ? 'Deactivate' : 'Activate'} counter`}>
                                                        <span>
                                                            <Switch
                                                                checked={counter.status}
                                                                onChange={() => handleToggleStatus(counter.id)}
                                                                disabled={toggleLoading === counter.id}
                                                                color="success"
                                                                size="small"
                                                            />
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography color="text.secondary">
                                                    {searchTerm ? `No counters found matching "${searchTerm}"` : "No counters available"}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination */}
                        {filteredCounters.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 2, gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Showing {filteredCounters.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredCounters.length)} of {filteredCounters.length} items
                                </Typography>
                                {filteredCounters.length > itemsPerPage && (
                                    <Pagination
                                        count={totalPages}
                                        page={currentPage}
                                        onChange={handlePageChange}
                                        color="primary"
                                        size="small"
                                    />
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
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
}
