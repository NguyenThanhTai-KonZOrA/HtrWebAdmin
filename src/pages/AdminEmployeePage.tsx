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
    Chip,
    IconButton,
    Tooltip,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Divider,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    AssignmentInd as AssignIcon,
    Visibility as ViewIcon,
    Close as CloseIcon,
    Save as SaveIcon,
} from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";
import AdminLayout from "../components/layout/AdminLayout";
import { employeeRoleService, roleService } from "../services/rolePermissionService";
import type { EmployeeResponse, EmployeeWithRoles, RoleResponse, AssignRoleRequest } from "../rolePermissionType";
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";

export default function AdminEmployeePage() {
    useSetPageTitle(PAGE_TITLES.EMPLOYEES);
    const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search and pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

    // Assign Role Dialog states
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignDialogLoading, setAssignDialogLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

    // View Detail Dialog states
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailDialogLoading, setDetailDialogLoading] = useState(false);
    const [employeeDetails, setEmployeeDetails] = useState<EmployeeWithRoles | null>(null);

    const showSnackbar = (message: string, severity: "success" | "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const loadEmployees = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await employeeRoleService.getAllEmployees();
            setEmployees(data);
        } catch (error: any) {
            console.error("Error loading employees:", error);
            let errorMessage = "Failed to load employees data";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            const data = await roleService.getAllRoles();
            setRoles(data.filter(r => r.isActive)); // Only show active roles
        } catch (error: any) {
            console.error("Error loading roles:", error);
            showSnackbar("Failed to load roles", "error");
        }
    };

    // Handle Assign Role Dialog
    const handleOpenAssignDialog = async (employee: EmployeeResponse) => {
        setSelectedEmployee(employee);
        setAssignDialogOpen(true);

        // Load roles if not already loaded
        if (roles.length === 0) {
            await loadRoles();
        }

        // Load current roles for this employee
        try {
            setAssignDialogLoading(true);
            const employeeData = await employeeRoleService.getEmployeeWithRoles(employee.id);
            const currentRoleIds = employeeData.roles?.map(r => r.id) || [];
            setSelectedRoleIds(currentRoleIds);
        } catch (error: any) {
            console.error("Error loading employee roles:", error);
            showSnackbar("Failed to load current roles", "error");
            setSelectedRoleIds([]);
        } finally {
            setAssignDialogLoading(false);
        }
    };

    const handleCloseAssignDialog = () => {
        setAssignDialogOpen(false);
        setSelectedEmployee(null);
        setSelectedRoleIds([]);
    };

    const handleRoleToggle = (roleId: number) => {
        setSelectedRoleIds(prev => {
            const isSelected = prev.includes(roleId);
            return isSelected
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId];
        });
    };

    const handleAssignRoles = async () => {
        if (!selectedEmployee) return;

        try {
            setAssignDialogLoading(true);

            const request: AssignRoleRequest = {
                employeeId: selectedEmployee.id,
                roleIds: selectedRoleIds,
            };

            const result = await employeeRoleService.assignRolesToEmployee(request);

            if (result) {
                showSnackbar(`Roles assigned to ${selectedEmployee.fullName} successfully!`, "success");
                handleCloseAssignDialog();
            } else {
                showSnackbar("Failed to assign roles", "error");
            }
        } catch (error: any) {
            console.error("Error assigning roles:", error);
            let errorMessage = "Error assigning roles";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
        } finally {
            setAssignDialogLoading(false);
        }
    };

    // Handle View Detail Dialog
    const handleOpenDetailDialog = async (employee: EmployeeResponse) => {
        setSelectedEmployee(employee);
        setDetailDialogOpen(true);

        try {
            setDetailDialogLoading(true);
            const data = await employeeRoleService.getEmployeeWithRoles(employee.id);
            setEmployeeDetails(data);
        } catch (error: any) {
            console.error("Error loading employee details:", error);
            let errorMessage = "Failed to load employee details";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
            setEmployeeDetails(null);
        } finally {
            setDetailDialogLoading(false);
        }
    };

    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedEmployee(null);
        setEmployeeDetails(null);
    };

    // Auto load data on component mount
    useEffect(() => {
        loadEmployees();
    }, []);

    // Search logic
    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return employees;

        return employees.filter(emp =>
            emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [employees, searchTerm]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredEmployees.slice(startIndex, endIndex);

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

    // Group permissions by category for display
    const groupedPermissions = useMemo(() => {
        if (!employeeDetails?.permissions) return {};

        const grouped: Record<string, string[]> = {};
        employeeDetails.permissions.forEach(permission => {
            // Assuming permission format is like "Category.Action"
            const parts = permission.split('.');
            const category = parts.length > 1 ? parts[0] : 'Other';

            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(permission);
        });
        return grouped;
    }, [employeeDetails]);

    return (
        <AdminLayout> {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="body1" color="text.secondary">
                    Manage employees, assign roles, and view employee permissions
                </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
                <Card>
                    <CardContent>
                        {/* Search and Actions */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Grid container spacing={3} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Search employees..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            InputProps={{
                                                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                            }}
                                            placeholder="Name, Code, Email, Department, Position..."
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
                                            onClick={loadEmployees}
                                            disabled={loading}
                                        >
                                            Refresh
                                        </Button>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                            Total: {filteredEmployees.length} employees
                                            {searchTerm && ` (filtered from ${employees.length})`}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                                            <Chip
                                                label={`Active: ${employees.filter(e => e.isActive).length}`}
                                                color="success"
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={`Inactive: ${employees.filter(e => !e.isActive).length}`}
                                                color="error"
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {loading && <LinearProgress sx={{ mb: 2 }} />}

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} action={
                                <IconButton size="small" onClick={loadEmployees}>
                                    <RefreshIcon />
                                </IconButton>
                            }>
                                {error}
                            </Alert>
                        )}

                        {/* Employees Table */}
                        <Card>
                            <CardContent sx={{ p: 0 }}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                <TableCell sx={{
                                                    fontWeight: 600,
                                                    textAlign: 'center',
                                                    position: 'sticky',
                                                    left: 0,
                                                    backgroundColor: 'background.paper',
                                                    zIndex: 3,
                                                    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
                                                    borderRight: '1px solid #e0e0e0'
                                                }}>
                                                    Actions
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 80 }} align="center">
                                                    ID
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 80 }} align="center">
                                                    Code
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 200 }}>
                                                    Full Name
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 200 }}>
                                                    Email
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 150 }}>
                                                    Department
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 150 }}>
                                                    Position
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                                    Status
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading ? (
                                                // Loading skeleton rows
                                                Array.from({ length: itemsPerPage }).map((_, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell align="center"><Skeleton width="150px" /></TableCell>
                                                        <TableCell><Skeleton width="40px" /></TableCell>
                                                        <TableCell><Skeleton width="80px" /></TableCell>
                                                        <TableCell><Skeleton width="150px" /></TableCell>
                                                        <TableCell><Skeleton width="180px" /></TableCell>
                                                        <TableCell><Skeleton width="120px" /></TableCell>
                                                        <TableCell><Skeleton width="120px" /></TableCell>
                                                        <TableCell align="center"><Skeleton width="80px" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : currentPageData.length > 0 ? (
                                                currentPageData.map((employee) => (
                                                    <TableRow
                                                        key={employee.id}
                                                        sx={{
                                                            '&:nth-of-type(even)': { bgcolor: '#f8f9fa' },
                                                            '&:hover': { bgcolor: '#e3f2fd' }
                                                        }}
                                                    >
                                                        <TableCell sx={{
                                                            fontWeight: 600,
                                                            textAlign: 'center',
                                                            position: 'sticky',
                                                            left: 0,
                                                            backgroundColor: 'background.paper',
                                                            zIndex: 3,
                                                            boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
                                                            borderRight: '1px solid #e0e0e0'
                                                        }}>
                                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                                <Tooltip title="Assign Roles">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => handleOpenAssignDialog(employee)}
                                                                    >
                                                                        <AssignIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="View Details">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="info"
                                                                        onClick={() => handleOpenDetailDialog(employee)}
                                                                    >
                                                                        <ViewIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }} align="center">
                                                            {employee.id}
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: '1px solid #e0e0e0' }} align="center">
                                                            <Chip
                                                                label={employee.employeeCode}
                                                                size="small"
                                                                variant="outlined"
                                                                color="primary"
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }}>
                                                            {employee.fullName}
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                            {employee.email || '-'}
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                            {employee.department || '-'}
                                                        </TableCell>
                                                        <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                            {employee.position || '-'}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                            <Chip
                                                                label={employee.isActive ? "Active" : "Inactive"}
                                                                color={employee.isActive ? "success" : "error"}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                                        <Typography color="text.secondary">
                                                            {searchTerm ? `No employees found matching "${searchTerm}"` : "No employees available"}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Pagination */}
                                {filteredEmployees.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 2, gap: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Showing {filteredEmployees.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} items
                                        </Typography>
                                        {filteredEmployees.length > itemsPerPage && (
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
                    </CardContent>
                </Card>
            </Box>

            {/* Assign Roles Dialog */}
            <Dialog
                open={assignDialogOpen}
                onClose={handleCloseAssignDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            Assign Roles to {selectedEmployee?.fullName}
                        </Typography>
                        <IconButton onClick={handleCloseAssignDialog} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        {assignDialogLoading ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Skeleton height={50} />
                                <Skeleton height={50} />
                                <Skeleton height={50} />
                            </Box>
                        ) : roles.length > 0 ? (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Select roles to assign to this employee. The employee will inherit all permissions from the selected roles.
                                </Typography>
                                <FormGroup>
                                    <Grid container spacing={1}>
                                        {roles.map((role) => (
                                            <Grid size={{ xs: 12, sm: 6 }} key={role.id}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={selectedRoleIds.includes(role.id)}
                                                            onChange={() => handleRoleToggle(role.id)}
                                                            disabled={assignDialogLoading}
                                                        />
                                                    }
                                                    label={
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {role.roleName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {role.description}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </FormGroup>
                                <Box sx={{ mt: 2 }}>
                                    <Chip
                                        label={`${selectedRoleIds.length} role(s) selected`}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            </>
                        ) : (
                            <Alert severity="info">No roles available. Please create roles first.</Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseAssignDialog}
                        disabled={assignDialogLoading}
                        sx={{ border: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssignRoles}
                        variant="contained"
                        disabled={assignDialogLoading || roles.length === 0}
                        startIcon={<SaveIcon />}
                    >
                        {assignDialogLoading ? "Assigning..." : "Assign Roles"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={handleCloseDetailDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            Employee Details
                        </Typography>
                        <IconButton onClick={handleCloseDetailDialog} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {detailDialogLoading ? (
                        <Box sx={{ mt: 2 }}>
                            <Skeleton height={100} />
                            <Skeleton height={200} sx={{ mt: 2 }} />
                            <Skeleton height={200} sx={{ mt: 2 }} />
                        </Box>
                    ) : employeeDetails ? (
                        <Box sx={{ mt: 2 }}>
                            {/* Employee Information */}
                            <Card variant="outlined" sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mb: 2 }}>
                                        Employee Information
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">Employee Code</Typography>
                                            <Typography variant="body1" fontWeight={500}>{employeeDetails.employeeCode}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">Full Name</Typography>
                                            <Typography variant="body1" fontWeight={500}>{employeeDetails.fullName}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">Email</Typography>
                                            <Typography variant="body1">{employeeDetails.email || '-'}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">Department</Typography>
                                            <Typography variant="body1">{employeeDetails.department || '-'}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">Position</Typography>
                                            <Typography variant="body1">{employeeDetails.position || '-'}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Assigned Roles */}
                            <Card variant="outlined" sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mb: 2 }}>
                                        Assigned Roles ({employeeDetails.roles?.length || 0})
                                    </Typography>
                                    {employeeDetails.roles && employeeDetails.roles.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {employeeDetails.roles.map((role) => (
                                                <Chip
                                                    key={role.id}
                                                    label={role.roleName}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No roles assigned to this employee
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Permissions */}
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mb: 2 }}>
                                        Permissions ({employeeDetails.permissions?.length || 0})
                                    </Typography>
                                    {employeeDetails.permissions && employeeDetails.permissions.length > 0 ? (
                                        <Box>
                                            {Object.entries(groupedPermissions).map(([category, perms]) => (
                                                <Box key={category} sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" fontWeight={500} color="secondary" sx={{ mb: 1 }}>
                                                        {category}
                                                    </Typography>
                                                    <List dense sx={{ pl: 2 }}>
                                                        {perms.map((permission, index) => (
                                                            <ListItem key={index} sx={{ py: 0.5 }}>
                                                                <ListItemText
                                                                    primary={
                                                                        <Chip
                                                                            label={permission}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            color="secondary"
                                                                        />
                                                                    }
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                    {Object.keys(groupedPermissions).indexOf(category) < Object.keys(groupedPermissions).length - 1 && (
                                                        <Divider sx={{ mt: 1 }} />
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No permissions assigned to this employee
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    ) : (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            Failed to load employee details
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetailDialog} variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

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
}
