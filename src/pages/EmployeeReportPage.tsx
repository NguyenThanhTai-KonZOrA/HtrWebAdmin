// src/pages/EmployeeReportPage.tsx
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
import { employeeService } from "../services/queueService";
import type { EmployeePerformanceResponse, EmployeePerformanceRequest } from "../type";
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";

export default function EmployeeReportPage() {
    useSetPageTitle(PAGE_TITLES.EMPLOYEE_PERFORMANCE);
    const [data, setData] = useState<EmployeePerformanceResponse | null>(null);
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
    const [employeeCode, setEmployeeCode] = useState<string>(""); // "" for all employees
    const [periodType, setPeriodType] = useState<number>(1); // 1 for daily, 2 for weekly, 3 for monthly

    // Helper functions for date formatting
    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDateFromInput = (dateStr: string): Date => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getPeriodTypeName = (type: number) => {
        switch (type) {
            case 1: return "Daily";
            case 2: return "Weekly";
            case 3: return "Monthly";
            default: return "Daily";
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            const requestData: EmployeePerformanceRequest = {
                StartDate: startDateStr,
                EndDate: endDateStr,
                EmployeeCode: employeeCode || undefined,
                PeriodType: periodType
            };

            const result = await employeeService.getEmployeePerformance(requestData);
            setData(result);
        } catch (error) {
            console.error("Error loading employee performance data:", error);
            setError("Failed to load employee performance data");
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

            const requestData: EmployeePerformanceRequest = {
                StartDate: startDateStr,
                EndDate: endDateStr,
                EmployeeCode: employeeCode || undefined,
                PeriodType: periodType
            };

            await employeeService.exportEmployeePerformanceExcel(requestData);
            showSnackbar("Excel file exported successfully", "success");
        } catch (error) {
            console.error("Error exporting Excel data:", error);
            setError("Failed to export Excel file");
            showSnackbar("Failed to export Excel file", "error");
        } finally {
            setExporting(false);
        }
    };

    // Auto load data on component mount
    useEffect(() => {
        loadData();
    }, []);

    // Period type options
    const periodOptions = [
        { value: 1, label: "Daily" },
        { value: 2, label: "Weekly" },
        { value: 3, label: "Monthly" }
    ];

    return (
        <AdminLayout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        View employee performance metrics and statistics
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
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Employee Code"
                                    value={employeeCode}
                                    onChange={(e) => setEmployeeCode(e.target.value)}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Period Type</InputLabel>
                                    <Select
                                        value={periodType}
                                        label="Period Type"
                                        onChange={(e) => setPeriodType(e.target.value as number)}
                                    >
                                        {periodOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
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

                            <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<DownloadIcon />}
                                    onClick={handleExportExcel}
                                    disabled={!data || loading || exporting}
                                >
                                    {exporting ? "Exporting..." : "Export"}
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
                            Employee Performance Report ({getPeriodTypeName(periodType)} - {formatDate(startDate)} to {formatDate(endDate)})
                        </Typography>
                    </Box>
                )}

                {/* Data Table */}
                <Card>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 80
                                            }}
                                        >
                                            Employee<br />Code
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 150
                                            }}
                                        >
                                            Employee<br />Name
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 100
                                            }}
                                        >
                                            Department
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 80
                                            }}
                                        >
                                            Total<br />Tickets<br />Served
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 80
                                            }}
                                        >
                                            New<br />Membership<br />Count
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 80
                                            }}
                                        >
                                            Existing<br />Membership<br />Count
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 100
                                            }}
                                        >
                                            Avg Waiting<br />Time (min)
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 100
                                            }}
                                        >
                                            Avg Serving<br />Time (min)
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                borderRight: '1px solid #e0e0e0',
                                                minWidth: 80
                                            }}
                                        >
                                            Total Working<br />Hours
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                minWidth: 80
                                            }}
                                        >
                                            Tickets<br />Per Hour
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        // Loading skeleton
                                        Array.from({ length: 8 }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="60px" />
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="120px" />
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="80px" />
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
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="60px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="60px" />
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Skeleton width="50px" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Skeleton width="50px" />
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
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }}>
                                                        {row.employeeCode}
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500, pl: 2 }}>
                                                        {row.employeeName}
                                                    </TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid #e0e0e0', pl: 2 }}>
                                                        {row.department}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.totalTicketsServed}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.newMembershipCount}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.existingMembershipCount}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.averageWaitingTime || `${row.averageWaitingMinutes.toFixed(1)} min`}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.averageServingTime || `${row.averageServingMinutes.toFixed(1)} min`}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                        {row.totalWorkingHours.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {row.ticketsPerHour.toFixed(1)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {/* Overall row */}
                                            {data.overall && (
                                                <TableRow sx={{ bgcolor: 'primary.lighter', fontWeight: 600 }}>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        Overall
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600,
                                                        pl: 2
                                                    }}>
                                                        All Employees
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600,
                                                        pl: 2
                                                    }}>
                                                        -
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.totalTicketsServed}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.newMembershipCount}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.existingMembershipCount}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.averageWaitingTime || `${data.overall.averageWaitingMinutes.toFixed(1)} min`}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.averageServingTime || `${data.overall.averageServingMinutes.toFixed(1)} min`}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        borderRight: '1px solid #e0e0e0',
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.totalWorkingHours.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        fontWeight: 600
                                                    }}>
                                                        {data.overall.ticketsPerHour.toFixed(1)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
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
