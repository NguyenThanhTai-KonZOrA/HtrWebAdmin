// src/pages/AdminServiceReport.tsx
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
    Assessment as AssessmentIcon
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import { adminReportService } from "../services/queueService";
import type { ServiceTypePerformanceResponse, ServiceTypePerformanceRowResponse } from "../type";
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";

export default function AdminServiceReport() {
    useSetPageTitle(PAGE_TITLES.SERVICE_PERFORMANCE);
    const [data, setData] = useState<ServiceTypePerformanceResponse | null>(null);
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
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [targetWaitingMinutes, setTargetWaitingMinutes] = useState<number>(10);

    // Helper functions for date formatting
    const formatDateForInput = (date: Date): string => {
        // Format date in local timezone to avoid timezone shift
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDateFromInput = (dateStr: string): Date => {
        // Parse date in local timezone to avoid timezone shift
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTimezoneOffsetMinutes = () => {
        return new Date().getTimezoneOffset();
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            const timezoneOffset = getTimezoneOffsetMinutes();

            const result = await adminReportService.getServicesReport(
                startDateStr,
                endDateStr,
                0,
                targetWaitingMinutes
            );
            setData(result);
        } catch (error) {
            console.error("Error loading services report data:", error);
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

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            const timezoneOffset = getTimezoneOffsetMinutes();
            await adminReportService.getGetServiceTypePerformanceExcel(
                startDateStr,
                endDateStr,
                0,
                targetWaitingMinutes
            );
            showSnackbar("Excel file exported successfully", "success");
        } catch (error) {
            console.error("Error exporting Excel data:", error);
            setError("Failed to export Excel file");
        } finally {
            setExporting(false);
        }
    };

    // Auto load data on component mount
    useEffect(() => {
        loadData();
    }, []);

    // Target waiting time options
    const targetOptions = [5, 10, 15, 20, 30, 45, 60];

    return (
        <AdminLayout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        View average time performance by service summary
                    </Typography>
                </Box>

                {/* Filters */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={3} alignItems="center">
                            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Start Date"
                                    type="date"
                                    value={formatDateForInput(startDate)}
                                    onChange={(e) => setStartDate(parseDateFromInput(e.target.value))}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="End Date"
                                    type="date"
                                    value={formatDateForInput(endDate)}
                                    onChange={(e) => setEndDate(parseDateFromInput(e.target.value))}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Target Waiting Time (minutes)</InputLabel>
                                    <Select
                                        value={targetWaitingMinutes}
                                        label="Target Waiting Time (minutes)"
                                        onChange={(e) => setTargetWaitingMinutes(e.target.value as number)}
                                    >
                                        {targetOptions.map((minutes) => (
                                            <MenuItem key={minutes} value={minutes}>
                                                ≤ {minutes} min
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
                            Processed Average Time Performance by Service Summary (Walk-in {formatDate(startDate)} - {formatDate(endDate)})
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
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 180
                                            }}
                                        >
                                            Service Name
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 80
                                            }}
                                        >
                                            Total<br />Ticket<br />Served
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 100
                                            }}
                                        >
                                            Target<br />Waiting<br />Time<br />(minutes)
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 100
                                            }}
                                        >
                                            Within<br />Target<br />Waiting<br />Time
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 100
                                            }}
                                        >
                                            % Within<br />Target<br />Waiting<br />Time
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 100
                                            }}
                                        >
                                            Exceed<br />Target<br />Waiting
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 100
                                            }}
                                        >
                                            % Exceed<br />Target<br />Waiting
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                minWidth: 100
                                            }}
                                        >
                                            Avg<br />Waiting<br />Time
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        // Loading skeleton
                                        Array.from({ length: 8 }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="150px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="40px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="60px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="40px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="60px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="40px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="60px" />
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
                                                <TableRow
                                                    key={index}
                                                    sx={{
                                                        '&:nth-of-type(even)': { bgcolor: '#f8f9fa' },
                                                        '&:hover': { bgcolor: '#e3f2fd' }
                                                    }}
                                                >
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500, pl: 2 }}>
                                                        {row.serviceName}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.totalTicketServed}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        ≤ {row.targetWaitingMinutes}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.withinTarget}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {(row.withinTargetPercent || 0).toFixed(0)}%
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.exceedTarget}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {(row.exceedTargetPercent || 0).toFixed(0)}%
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {row.avgWaitingTime}
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {/* Overall row */}
                                            {data.overall && (
                                                <TableRow sx={{ bgcolor: 'primary.lighter', fontWeight: 600 }}>
                                                    <TableCell sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600,
                                                        pl: 2
                                                    }}>
                                                        Overall
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.totalTicketServed}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.targetWaitingMinutes || "N/A"}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.withinTarget}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {(data.overall.withinTargetPercent || 0).toFixed(0)}%
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.exceedTarget}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {(data.overall.exceedTargetPercent || 0).toFixed(0)}%
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.avgWaitingTime}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
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
