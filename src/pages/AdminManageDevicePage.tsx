import {
    Box,
    Card,
    CardContent,
    Typography,
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
    Pagination,
    Chip,
    IconButton,
    Tooltip,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Switch,
    Stack,
    InputAdornment,
} from "@mui/material";
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    CheckCircle as OnlineIcon,
    Cancel as OfflineIcon,
} from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";
import AdminLayout from "../components/layout/AdminLayout";
import { manageDeviceService } from "../services/registrationService";
import type { ManageDeviceResponse, DeviceInfo, ToggleDeviceRequest, DeleteDeviceRequest, ChangeHostnameRequest } from "../type";
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";

export default function AdminManageDevicePage() {
    useSetPageTitle(PAGE_TITLES.MANAGE_DEVICES || "Manage Devices");

    const [devices, setDevices] = useState<DeviceInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search and pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteDialogLoading, setDeleteDialogLoading] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);

    // Change Hostname Dialog states
    const [hostnameDialogOpen, setHostnameDialogOpen] = useState(false);
    const [hostnameDialogLoading, setHostnameDialogLoading] = useState(false);
    const [newHostname, setNewHostname] = useState("");

    const showSnackbar = (message: string, severity: "success" | "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const loadDevices = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await manageDeviceService.getAllDevices();
            // Combine both patron and staff devices into one array
            const allDevices = [...data.patronDevices, ...data.staffDevices];
            setDevices(allDevices);
        } catch (error: any) {
            console.error("Error loading devices:", error);
            let errorMessage = "Failed to load devices data";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            setError(errorMessage);
            showSnackbar(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDevices();
    }, []);

    // Filter and paginate devices
    const filteredDevices = useMemo(() => {
        return devices.filter((device) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                device.deviceName.toLowerCase().includes(searchLower) ||
                device.deviceType.toLowerCase().includes(searchLower) ||
                device.ipAddress.toLowerCase().includes(searchLower) ||
                device.macAddress.toLowerCase().includes(searchLower) ||
                device.staffUserName?.toLowerCase().includes(searchLower)
            );
        });
    }, [devices, searchTerm]);

    const paginatedDevices = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredDevices.slice(startIndex, endIndex);
    }, [filteredDevices, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);

    // Handle page change
    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    // Handle items per page change
    const handleItemsPerPageChange = (event: any) => {
        setItemsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1); // Reset to first page
    };

    // Handle search
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    // Handle toggle device status
    const handleToggleStatus = async (device: DeviceInfo) => {
        try {
            const request: ToggleDeviceRequest = {
                deviceId: device.id,
                deviceType: device.deviceType,
                isActive: !device.isActive,
            };

            await manageDeviceService.changeStatusDevice(request);
            showSnackbar(
                `Device "${device.deviceName}" has been ${!device.isActive ? "activated" : "deactivated"}`,
                "success"
            );
            await loadDevices();
        } catch (error: any) {
            console.error("Error toggling device status:", error);
            let errorMessage = "Failed to change device status";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
        }
    };

    // Handle delete device
    const handleOpenDeleteDialog = (device: DeviceInfo) => {
        setSelectedDevice(device);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedDevice(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedDevice) return;

        try {
            setDeleteDialogLoading(true);
            const request: DeleteDeviceRequest = {
                deviceId: selectedDevice.id,
                deviceType: selectedDevice.deviceType,
            };

            await manageDeviceService.deleteDevice(request);
            showSnackbar(`Device "${selectedDevice.deviceName}" has been deleted successfully`, "success");
            handleCloseDeleteDialog();
            await loadDevices();
        } catch (error: any) {
            console.error("Error deleting device:", error);
            let errorMessage = "Failed to delete device";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
        } finally {
            setDeleteDialogLoading(false);
        }
    };

    // Handle change hostname
    const handleOpenHostnameDialog = (device: DeviceInfo) => {
        setSelectedDevice(device);
        setNewHostname(device.deviceName);
        setHostnameDialogOpen(true);
    };

    const handleCloseHostnameDialog = () => {
        setHostnameDialogOpen(false);
        setSelectedDevice(null);
        setNewHostname("");
    };

    const handleConfirmChangeHostname = async () => {
        if (!selectedDevice || !newHostname.trim()) return;

        try {
            setHostnameDialogLoading(true);
            const request: ChangeHostnameRequest = {
                deviceId: selectedDevice.id,
                deviceType: selectedDevice.deviceType,
                newHostname: newHostname.trim(),
            };

            await manageDeviceService.changeHostname(request);
            showSnackbar(`Hostname changed to "${newHostname.trim()}" successfully`, "success");
            handleCloseHostnameDialog();
            await loadDevices();
        } catch (error: any) {
            console.error("Error changing hostname:", error);
            let errorMessage = "Failed to change hostname";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
        } finally {
            setHostnameDialogLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleString("vi-VN");
        } catch {
            return dateString;
        }
    };

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                <Card>
                    <CardContent>
                        {/* <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                            Device Management
                        </Typography> */}

                        {/* Search and Filters */}
                        <Box sx={{ mb: 3 }}>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Search"
                                    size="small"
                                    placeholder="Search by device name, type, IP, MAC, or username..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={loadDevices}
                                    disabled={loading}
                                    sx={{ minWidth: 120 }}
                                >
                                    Refresh
                                </Button>
                            </Stack>

                            {/* Summary Stats */}
                            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                <Chip
                                    label={`Total: ${filteredDevices.length}`}
                                    color="primary"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Online: ${filteredDevices.filter((d) => d.isOnline).length}`}
                                    color="success"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Active: ${filteredDevices.filter((d) => d.isActive).length}`}
                                    color="info"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Staff: ${filteredDevices.filter((d) => d.deviceType === "Staff").length}`}
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Patron: ${filteredDevices.filter((d) => d.deviceType === "Patron").length}`}
                                    variant="outlined"
                                />
                            </Box>
                        </Box>

                        {/* Loading and Error States */}
                        {/* {loading && <LinearProgress sx={{ mb: 2 }} />} */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Devices Table */}
                        {!loading && devices.length === 0 ? (
                            <Alert severity="info">No devices found</Alert>
                        ) : (
                            <>
                                <TableContainer component={Paper} sx={{ mb: 2 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Device Name</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>IP Address</TableCell>
                                                <TableCell>MAC Address</TableCell>
                                                <TableCell>Staff Username</TableCell>
                                                <TableCell>Online</TableCell>
                                                <TableCell>Last Heartbeat</TableCell>
                                                <TableCell>Status</TableCell>
                                                {/* <TableCell align="center">Actions</TableCell> */}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedDevices.map((device) => (
                                                <TableRow key={device.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {device.deviceName}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={device.deviceType}
                                                            size="small"
                                                            color={device.deviceType === "Staff" ? "primary" : "secondary"}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontFamily="monospace">
                                                            {device.ipAddress || "N/A"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontFamily="monospace">
                                                            {device.macAddress || "N/A"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{device.staffUserName || "N/A"}</TableCell>
                                                    <TableCell>
                                                        {device.isOnline ? (
                                                            <Chip
                                                                icon={<OnlineIcon />}
                                                                label="Online"
                                                                size="small"
                                                                color="success"
                                                            />
                                                        ) : (
                                                            <Chip
                                                                icon={<OfflineIcon />}
                                                                label="Offline"
                                                                size="small"
                                                                color="default"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDate(device.lastHeartbeat)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title={device.isActive ? "Click to deactivate" : "Click to activate"}>
                                                            <Switch
                                                                checked={device.isActive}
                                                                onChange={() => handleToggleStatus(device)}
                                                                color="success"
                                                            />
                                                        </Tooltip>
                                                    </TableCell>
                                                    {/* <TableCell align="center">
                                                        <Stack direction="row" spacing={1} justifyContent="center">
                                                            <Tooltip title="Change Hostname">
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => handleOpenHostnameDialog(device)}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete Device">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleOpenDeleteDialog(device)}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </TableCell> */}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Pagination */}
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
                                    <FormControl size="small">
                                        <InputLabel>Items per page</InputLabel>
                                        <Select
                                            value={itemsPerPage}
                                            label="Items per page"
                                            onChange={handleItemsPerPageChange}
                                        >
                                            <MenuItem value={5}>5</MenuItem>
                                            <MenuItem value={10}>10</MenuItem>
                                            <MenuItem value={25}>25</MenuItem>
                                            <MenuItem value={50}>50</MenuItem>
                                            <MenuItem value={100}>100</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Typography variant="body2" color="text.secondary">
                                        Showing {paginatedDevices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
                                        {Math.min(currentPage * itemsPerPage, filteredDevices.length)} of{" "}
                                        {filteredDevices.length} devices
                                    </Typography>

                                    <Pagination
                                        count={totalPages}
                                        page={currentPage}
                                        onChange={handlePageChange}
                                        color="primary"
                                        showFirstButton
                                        showLastButton
                                    />
                                </Box>
                            </>
                        )}
                    </CardContent>
                </Card>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete device <strong>"{selectedDevice?.deviceName}"</strong>?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} disabled={deleteDialogLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={deleteDialogLoading}
                    >
                        {deleteDialogLoading ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Hostname Dialog */}
            <Dialog open={hostnameDialogOpen} onClose={handleCloseHostnameDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Change Hostname</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Current device: <strong>{selectedDevice?.deviceName}</strong>
                    </Typography>
                    <TextField
                        fullWidth
                        label="New Hostname"
                        value={newHostname}
                        onChange={(e) => setNewHostname(e.target.value)}
                        placeholder="Enter new hostname"
                        autoFocus
                        disabled={hostnameDialogLoading}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseHostnameDialog} disabled={hostnameDialogLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmChangeHostname}
                        color="primary"
                        variant="contained"
                        disabled={hostnameDialogLoading || !newHostname.trim()}
                    >
                        {hostnameDialogLoading ? "Changing..." : "Change"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AdminLayout>
    );
}
