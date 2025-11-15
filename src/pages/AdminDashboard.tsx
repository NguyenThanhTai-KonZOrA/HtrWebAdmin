// src/pages/AdminDashboard.tsx
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    IconButton,
    Skeleton,
    Alert,
    Pagination,
    Badge,
    FormControl,
    Select,
    MenuItem,
    InputLabel
} from "@mui/material";
import {
    People as PeopleIcon,
    AccessTime as AccessTimeIcon,
    TrendingUp as TrendingUpIcon,
    Star as StarIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import { queueAdminService } from "../services/queueService";
import type { DashboardResponse, CounterDashboardResponse } from "../type";
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";

export default function AdminDashboard() {
    useSetPageTitle(PAGE_TITLES.DASHBOARD);
    const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
    const [counterOperators, setCounterOperators] = useState<CounterDashboardResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(3);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Auto refresh data every 5 minutes
    useEffect(() => {
        loadDashboardData();
        const refreshTimer = setInterval(() => {
            loadDashboardData();
        }, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(refreshTimer);
    }, []);

    // Reset to first page when data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [counterOperators.length]);

    const loadDashboardData = async () => {
        try {
            if (!dashboardData) setLoading(true); // Only show loading on first load
            setError(null);

            // Load both dashboard summary and counter operators
            const [dashboardResult, counterResult] = await Promise.all([
                queueAdminService.getSummary(),
                queueAdminService.getcountersSummary()
            ]);

            setDashboardData(dashboardResult);
            setCounterOperators(counterResult);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Pagination calculations
    const totalPages = Math.ceil(counterOperators.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = counterOperators.slice(startIndex, endIndex);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    const handleItemsPerPageChange = (event: any) => {
        setItemsPerPage(event.target.value);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const StatCard = ({ title, value, subtitle, icon, color = "primary", loading = false }: {
        title: string;
        value: string | number;
        subtitle?: string;
        icon: React.ReactNode;
        color?: "primary" | "secondary" | "success" | "warning" | "error";
        loading?: boolean;
    }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: `${color}.lighter`,
                        color: `${color}.main`,
                        mr: 2
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {title}
                    </Typography>
                </Box>
                {loading ? (
                    <Skeleton variant="text" width="60%" height={48} />
                ) : (
                    <Typography variant="h4" component="div" fontWeight={700} color={`${color}.main`}>
                        {value}
                    </Typography>
                )}
                {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );

    return (
        <AdminLayout>
            <Box>
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    boxShadow: 1
                }}>
                    {/* <Box>
                        <Typography variant="h5" fontWeight={600}>
                            Branch
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Johor Bahru Service Centre 1
                        </Typography>
                    </Box> */}
                    <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="h5" fontWeight={600}>
                            Today
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            {formatTime(currentTime)}
                        </Typography>
                    </Box>
                    <IconButton onClick={loadDashboardData} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Box>

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} action={
                        <IconButton size="small" onClick={loadDashboardData}>
                            <RefreshIcon />
                        </IconButton>
                    }>
                        {error}
                    </Alert>
                )}

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Average waiting time"
                            value={dashboardData?.averageWaitingTime || "00:12:34"}
                            icon={<AccessTimeIcon />}
                            color="primary"
                            loading={loading}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Exceeds waiting time"
                            value={dashboardData?.waitingExceeds || "0"}
                            subtitle="Tickets"
                            icon={<TrendingUpIcon />}
                            color="warning"
                            loading={loading}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Average Serving time"
                            value={dashboardData?.averageServingTime || "00:00:26"}
                            icon={<AccessTimeIcon />}
                            color="success"
                            loading={loading}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Exceeds Serving time"
                            value={dashboardData?.servingExceeds || "0"}
                            subtitle="Tickets"
                            icon={<TrendingUpIcon />}
                            color="error"
                            loading={loading}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    {/* Queue Performance Chart */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                                    Queue Performance
                                </Typography>

                                {/* Custom Bar Chart */}
                                <Box sx={{ height: 300, position: 'relative' }}>
                                    {loading ? (
                                        <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-around', height: '100%', px: 2 }}>
                                            {[1, 2, 3, 4, 5, 6].map((index) => (
                                                <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, mx: 1 }}>
                                                    <Skeleton variant="rectangular" width="100%" height={Math.random() * 200 + 50} sx={{ mb: 1, borderRadius: 1 }} />
                                                    <Skeleton variant="text" width="80px" />
                                                    <Skeleton variant="text" width="60px" />
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (() => {
                                        // Calculate max value for consistent chart scaling
                                        const maxValue = Math.max(
                                            dashboardData?.totalCustomers || 0,
                                            dashboardData?.customersWaiting || 0,
                                            dashboardData?.customersStored || 0,
                                            dashboardData?.customersInService || 0,
                                            dashboardData?.customersServedToday || 0,
                                            dashboardData?.servingExceeds || 0,
                                            1 // minimum value to prevent division by zero
                                        );

                                        // Helper function to calculate bar height
                                        const getBarHeight = (value: number) => {
                                            if (maxValue === 0) return 30;
                                            return Math.max((value / maxValue) * 200, 30); // minimum 30px height
                                        };

                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-around', height: '100%', px: 2 }}>
                                                {/* Total Customers */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, mx: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: '80%',
                                                            height: `${getBarHeight(dashboardData?.totalCustomers || 0)}px`,
                                                            bgcolor: '#546e7a',
                                                            borderRadius: 1,
                                                            mb: 1,
                                                            display: 'flex',
                                                            alignItems: 'end',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            minHeight: '30px'
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                            {dashboardData?.totalCustomers || 0}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Total
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Customers
                                                    </Typography>
                                                </Box>

                                                {/* Customers Waiting */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, mx: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: '80%',
                                                            height: `${getBarHeight(dashboardData?.customersWaiting || 0)}px`,
                                                            bgcolor: '#0091ea',
                                                            borderRadius: 1,
                                                            mb: 1,
                                                            display: 'flex',
                                                            alignItems: 'end',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            minHeight: '30px'
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                            {dashboardData?.customersWaiting || 0}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Waiting
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Customers
                                                    </Typography>
                                                </Box>

                                                {/* Customers Stored */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, mx: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: '80%',
                                                            height: `${getBarHeight(dashboardData?.customersStored || 0)}px`,
                                                            bgcolor: '#ffab91',
                                                            borderRadius: 1,
                                                            mb: 1,
                                                            display: 'flex',
                                                            alignItems: 'end',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            minHeight: '30px'
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                            {dashboardData?.customersStored || 0}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Stored
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Customers
                                                    </Typography>
                                                </Box>

                                                {/* Customers In Service */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, mx: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: '80%',
                                                            height: `${getBarHeight(dashboardData?.customersInService || 0)}px`,
                                                            bgcolor: 'warning.main',
                                                            borderRadius: 1,
                                                            mb: 1,
                                                            display: 'flex',
                                                            alignItems: 'end',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            minHeight: '30px'
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                            {dashboardData?.customersInService || 0}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        In Service
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Customers
                                                    </Typography>
                                                </Box>

                                                {/* Customers Served Today */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, mx: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: '80%',
                                                            height: `${getBarHeight(dashboardData?.customersServedToday || 0)}px`,
                                                            bgcolor: 'success.main',
                                                            borderRadius: 1,
                                                            mb: 1,
                                                            display: 'flex',
                                                            alignItems: 'end',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            minHeight: '30px'
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                            {dashboardData?.customersServedToday || 0}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Served
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Today
                                                    </Typography>
                                                </Box>

                                                {/* Customers Exceeds Serving */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, mx: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: '80%',
                                                            height: `${getBarHeight(dashboardData?.servingExceeds || 0)}px`,
                                                            bgcolor: '#dd2c00',
                                                            borderRadius: 1,
                                                            mb: 1,
                                                            display: 'flex',
                                                            alignItems: 'end',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            minHeight: '30px'
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                            {dashboardData?.servingExceeds || 0}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Exceeds Serving
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                        Today
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })()}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Counter Statistics */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <Card>
                                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                        <PeopleIcon sx={{ fontSize: 40, color: '#0091ea', mb: 1 }} />
                                        {loading ? (
                                            <Skeleton variant="text" width="60%" height={48} sx={{ mx: 'auto' }} />
                                        ) : (
                                            <Typography variant="h4" fontWeight={700} color="#0091ea">
                                                {dashboardData?.customersWaiting || 0}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" color="text.secondary">
                                            Customer<br />Waiting
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={6}>
                                <Card>
                                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                        <PeopleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                        {loading ? (
                                            <Skeleton variant="text" width="60%" height={48} sx={{ mx: 'auto' }} />
                                        ) : (
                                            <Typography variant="h4" fontWeight={700} color="success.main">
                                                {dashboardData?.customersServedToday || 0}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" color="text.secondary">
                                            Customer<br />Served
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={6}>
                                <Card>
                                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                        <PersonIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                        {loading ? (
                                            <Skeleton variant="text" width="60%" height={48} sx={{ mx: 'auto' }} />
                                        ) : (
                                            <Typography variant="h4" fontWeight={700}>
                                                {dashboardData?.totalCounters || 2}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" color="text.secondary">
                                            Counter<br />Operator
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={6}>
                                <Card>
                                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                        <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                                        <Typography variant="h4" fontWeight={700}>
                                            0 / 5
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Customer<br />Rating
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Counter Operator Table */}
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Counter operator
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total counter operator: {counterOperators.length}
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel id="items-per-page-label">Items per page</InputLabel>
                                    <Select
                                        labelId="items-per-page-label"
                                        value={itemsPerPage}
                                        label="Items per page"
                                        onChange={handleItemsPerPageChange}
                                    >
                                        <MenuItem value={3}>3</MenuItem>
                                        <MenuItem value={5}>5</MenuItem>
                                        <MenuItem value={10}>10</MenuItem>
                                        <MenuItem value={20}>20</MenuItem>
                                        <MenuItem value={50}>50</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Counter Name</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Host Name</TableCell>
                                        <TableCell>Average Serving Time</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        // Loading skeleton rows
                                        Array.from({ length: itemsPerPage }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Skeleton width="80px" /></TableCell>
                                                <TableCell><Skeleton width="120px" /></TableCell>
                                                <TableCell><Skeleton width="100px" /></TableCell>
                                                <TableCell><Skeleton width="100px" /></TableCell>
                                                <TableCell><Skeleton width="80px" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : currentPageData.length > 0 ? (
                                        currentPageData.map((operator, index) => (
                                            <TableRow key={operator.Id || index}>
                                                <TableCell>{operator.counterName}</TableCell>
                                                <TableCell>{operator.description}</TableCell>
                                                <TableCell>{operator.hostName}</TableCell>
                                                <TableCell>{operator.averageServingTime}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        badgeContent={operator.statusName}
                                                        color={operator.status === true ? "success" : "error"}
                                                        sx={{
                                                            '& .MuiBadge-badge': {
                                                                fontSize: '0.75rem',
                                                                minWidth: '20px',
                                                                height: '20px',
                                                                paddingLeft: '6px',
                                                            }
                                                        }}
                                                    >
                                                        <Box sx={{ width: 8 }} />
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>
                                                <Typography color="text.secondary">
                                                    No counter operators found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination */}
                        {counterOperators.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Showing {counterOperators.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, counterOperators.length)} of {counterOperators.length} items
                                </Typography>
                                {counterOperators.length > itemsPerPage && (
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
        </AdminLayout>
    );
}
