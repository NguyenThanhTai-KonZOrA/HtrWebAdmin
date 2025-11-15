// src/pages/AdminIssuedProcessedByHourPage.tsx
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
    Snackbar
} from "@mui/material";
import {
    Search as SearchIcon,
    Download as DownloadIcon,
    CalendarToday as CalendarIcon
} from "@mui/icons-material";
import { useState, useEffect } from "react";

import AdminLayout from "../layout/AdminLayout";
import { adminReportService } from "../services/queueService";
import type { IssuedProcessedByHourResponse, IssuedProcessedByHourRowResponse } from "../type";
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";

export default function AdminIssuedProcessedByHourPage() {
    useSetPageTitle(PAGE_TITLES.ISSUED_PROCESSED_BY_HOUR);
    const [data, setData] = useState<IssuedProcessedByHourResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
    const showSnackbar = (message: string, severity: "success" | "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };
    // Filter states
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [startHour, setStartHour] = useState<number>(8);
    const [endHour, setEndHour] = useState<number>(21);

    // Helper function to format date for input
    const formatDateForInput = (date: Date): string => {
        // Format date in local timezone to avoid timezone shift
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper function to parse date from input
    const parseDateFromInput = (dateStr: string): Date => {
        // Parse date in local timezone to avoid timezone shift
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
    };

    // Generate hour options (0-23)
    const hourOptions = Array.from({ length: 24 }, (_, i) => i);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Format date in local timezone to avoid timezone shift
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`; // Format: YYYY-MM-DD in local timezone
            
            const result = await adminReportService.getIssuedProcessedByHour(dateStr, startHour, endHour);
            setData(result);
        } catch (error) {
            console.error("Error loading issued processed by hour data:", error);
            setError("Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadData();
    };

    const handleExportExcel = async () => {
        try {
            setExporting(true);
            setError(null);
            
            // Format date in local timezone to avoid timezone shift
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`; // Format: YYYY-MM-DD in local timezone
            
            await adminReportService.getIssuedProcessedByHourExcel(dateStr, startHour, endHour);
            showSnackbar("Excel file exported successfully", "success");
        } catch (error) {
            console.error("Error exporting Excel data:", error);
            setError("Failed to export Excel file");
        } finally {
            setExporting(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatHour = (hour: number) => {
        return hour.toString().padStart(2, '0') + ':00';
    };

    // Auto load data on component mount
    useEffect(() => {
        loadData();
    }, []);

    return (
        <AdminLayout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        View customer traffic and processing statistics by hour
                    </Typography>
                </Box>

                {/* Filters */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={3} alignItems="center">
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Select Date"
                                    type="date"
                                    value={formatDateForInput(selectedDate)}
                                    onChange={(e) => setSelectedDate(parseDateFromInput(e.target.value))}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Start Hour</InputLabel>
                                    <Select
                                        value={startHour}
                                        label="Start Hour"
                                        onChange={(e) => setStartHour(e.target.value as number)}
                                    >
                                        {hourOptions.map((hour) => (
                                            <MenuItem key={hour} value={hour}>
                                                {formatHour(hour)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>End Hour</InputLabel>
                                    <Select
                                        value={endHour}
                                        label="End Hour"
                                        onChange={(e) => setEndHour(e.target.value as number)}
                                    >
                                        {hourOptions.map((hour) => (
                                            <MenuItem key={hour} value={hour}>
                                                {formatHour(hour)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<SearchIcon />}
                                    onClick={handleSearch}
                                    disabled={loading}
                                >
                                    Search
                                </Button>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<DownloadIcon />}
                                    onClick={handleExportExcel}
                                    disabled={!data || loading || exporting}
                                >
                                    {exporting ? "Exporting..." : "Export Excel"}
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Report Title */}
                {data && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                            Issued Processed By Hour (Walk-in {formatDate(selectedDate)} - {formatDate(selectedDate)})
                        </Typography>
                    </Box>
                )}

                {/* Data Table */}
                <Card>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0' }}>
                                            Time of Day
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0' }}>
                                            Customer<br />Arrived
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0' }}>
                                            Customer<br />Served
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0' }}>
                                            Counter<br />Active
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                                            Avg Waiting<br />Time
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        // Loading skeleton
                                        Array.from({ length: 10 }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="60px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="40px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="40px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="40px" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Skeleton width="80px" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : data?.rows ? (
                                        <>
                                            {/* Data rows */}
                                            {data.rows.map((row, index) => (
                                                <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.25' } }}>
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }}>
                                                        {row.timeOfDay}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.customerArrived}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.customerServed}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.counterActive}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {row.avgWaitingTime}
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {/* Overall row */}
                                            {data.overall && (
                                                <TableRow sx={{ bgcolor: 'primary.lighter', fontWeight: 600 }}>
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>
                                                        Overall
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>
                                                        {data.overall.customerArrived}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>
                                                        {data.overall.customerServed}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>
                                                        {data.overall.counterActive}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                                                        {data.overall.avgWaitingTime}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography color="text.secondary">
                                                    No data available for the selected criteria
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
