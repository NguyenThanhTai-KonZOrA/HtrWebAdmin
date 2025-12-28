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
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    FormControlLabel,
    FormGroup,
} from "@mui/material";
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
} from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";
import AdminLayout from "../components/layout/AdminLayout";
import { roleService, permissionService } from "../services/rolePermissionService";
import type { RoleResponse, PermissionResponse, CreateRoleRequest, UpdateRoleRequest } from "../rolePermissionType";
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";
import { FormatUtcTime } from "../utils/formatUtcTime";

export default function AdminRolePage() {
    useSetPageTitle(PAGE_TITLES.ROLES);
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toggleLoading, setToggleLoading] = useState<number | null>(null);

    // Search and pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
    const [dialogLoading, setDialogLoading] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        roleName: "",
        description: "",
        selectedPermissions: [] as number[],
    });

    // Delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRole, setDeletingRole] = useState<RoleResponse | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const showSnackbar = (message: string, severity: "success" | "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const loadRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await roleService.getAllRoles();
            setRoles(data);
        } catch (error: any) {
            console.error("Error loading roles:", error);
            let errorMessage = "Failed to load roles data";
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

    const loadPermissions = async () => {
        try {
            const data = await permissionService.getAllPermissions();
            setPermissions(data.filter(p => p.isActive)); // Only show active permissions
        } catch (error: any) {
            console.error("Error loading permissions:", error);
            let errorMessage = "Failed to load permissions";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
        }
    };

    const handleToggleStatus = async (role: RoleResponse) => {
        try {
            setToggleLoading(role.id);
            const result = await roleService.changeStatus(role.id);

            if (result) {
                showSnackbar(`Changed status for role "${role.roleName}" successfully!`, "success");
                setRoles(prevRoles =>
                    prevRoles.map(r =>
                        r.id === role.id ? { ...r, isActive: !r.isActive } : r
                    )
                );
            } else {
                setError("Failed to change role status");
            }
        } catch (error: any) {
            console.error("Error updating role status:", error);
            let errorMessage = "Error updating role status";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
        } finally {
            setToggleLoading(null);
        }
    };

    const handleOpenCreateDialog = () => {
        setDialogMode("create");
        setEditingRole(null);
        setFormData({
            roleName: "",
            description: "",
            selectedPermissions: [],
        });
        setDialogOpen(true);
        loadPermissions();
    };

    const handleOpenEditDialog = async (role: RoleResponse) => {
        setDialogMode("edit");
        setEditingRole(role);

        try {
            // Fetch full role details with permissions
            const roleDetails = await roleService.getRoleById(role.id);

            // Load permissions first
            await loadPermissions();

            // Extract permission IDs from the role details
            let permissionIds: number[] = [];
            if (roleDetails.permissionIds) {
                // If API returns permissionIds directly
                permissionIds = roleDetails.permissionIds;
            } else if (roleDetails.permissions) {
                // If API returns full permission objects
                permissionIds = roleDetails.permissions.map(p => p.id);
            }

            setFormData({
                roleName: roleDetails.roleName,
                description: roleDetails.description,
                selectedPermissions: permissionIds,
            });
            setDialogOpen(true);
        } catch (error: any) {
            console.error("Error loading role details:", error);
            showSnackbar("Failed to load role details", "error");
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingRole(null);
        setFormData({
            roleName: "",
            description: "",
            selectedPermissions: [],
        });
    };

    const handleFormChange = (field: string, value: string | number[]) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePermissionToggle = (permissionId: number) => {
        setFormData(prev => {
            const isSelected = prev.selectedPermissions.includes(permissionId);
            return {
                ...prev,
                selectedPermissions: isSelected
                    ? prev.selectedPermissions.filter(id => id !== permissionId)
                    : [...prev.selectedPermissions, permissionId]
            };
        });
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.roleName.trim()) {
            showSnackbar("Role name is required", "error");
            return;
        }

        if (!formData.description.trim()) {
            showSnackbar("Role description is required", "error");
            return;
        }

        try {
            setDialogLoading(true);

            if (dialogMode === "create") {
                const request: CreateRoleRequest = {
                    roleName: formData.roleName.trim(),
                    description: formData.description.trim(),
                    permissionIds: formData.selectedPermissions,
                };
                const result = await roleService.createRole(request);
                setRoles(prev => [...prev, result]);
                showSnackbar(`Role "${result.roleName}" created successfully!`, "success");
            } else {
                if (!editingRole) return;

                const request: UpdateRoleRequest = {
                    id: editingRole.id,
                    roleName: formData.roleName.trim(),
                    description: formData.description.trim(),
                    isActive: editingRole.isActive,
                    permissionIds: formData.selectedPermissions,
                };
                const result = await roleService.updateRole(editingRole.id, request);
                setRoles(prev =>
                    prev.map(r => r.id === result.id ? result : r)
                );
                showSnackbar(`Role "${result.roleName}" updated successfully!`, "success");
            }

            handleCloseDialog();
        } catch (error: any) {
            console.error("Error submitting role:", error);
            let errorMessage = dialogMode === "create"
                ? "Error creating role"
                : "Error updating role";

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
        } finally {
            setDialogLoading(false);
        }
    };

    const handleOpenDeleteDialog = (role: RoleResponse) => {
        setDeletingRole(role);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setDeletingRole(null);
    };

    const handleDelete = async () => {
        if (!deletingRole) return;

        try {
            setDeleteLoading(true);
            await roleService.deleteRole(deletingRole.id);
            setRoles(prev => prev.filter(r => r.id !== deletingRole.id));
            showSnackbar(`Role "${deletingRole.roleName}" deleted successfully!`, "success");
            handleCloseDeleteDialog();
        } catch (error: any) {
            console.error("Error deleting role:", error);
            let errorMessage = "Error deleting role";

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            showSnackbar(errorMessage, "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Auto load data on component mount
    useEffect(() => {
        loadRoles();
    }, []);

    // Search and pagination logic
    const filteredRoles = useMemo(() => {
        if (!searchTerm) return roles;

        return roles.filter(r =>
            r.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [roles, searchTerm]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredRoles.slice(startIndex, endIndex);

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

    // Group permissions by category
    const groupedPermissions = useMemo(() => {
        const grouped: Record<string, PermissionResponse[]> = {};
        permissions.forEach(permission => {
            const category = permission.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(permission);
        });
        return grouped;
    }, [permissions]);

    return (
        <AdminLayout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                        Manage roles, create new roles, update information, and control status
                    </Typography>
                </Box>

                {/* Search and Actions */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={3} alignItems="center">
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Search roles..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                    }}
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
                                    onClick={loadRoles}
                                    disabled={loading}
                                >
                                    Refresh
                                </Button>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    fullWidth
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenCreateDialog}
                                >
                                    Create New
                                </Button>
                            </Grid>

                            <Grid size={{ xs: 12, md: 3 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                    Total: {filteredRoles.length} roles
                                    {searchTerm && ` (filtered from ${roles.length})`}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                                    <Chip
                                        label={`Active: ${roles.filter(r => r.isActive).length}`}
                                        color="success"
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`Inactive: ${roles.filter(r => !r.isActive).length}`}
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
                        <IconButton size="small" onClick={loadRoles}>
                            <RefreshIcon />
                        </IconButton>
                    }>
                        {error}
                    </Alert>
                )}

                {/* Roles Table */}
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
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 180 }}>
                                            Role Name
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 250 }}>
                                            Description
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 80 }} align="center">
                                            Permissions
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                            Status
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 180 }}>
                                            Created At
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 180 }}>
                                            Updated At
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        // Loading skeleton rows
                                        Array.from({ length: itemsPerPage }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell align="center"><Skeleton width="120px" /></TableCell>
                                                <TableCell><Skeleton width="40px" /></TableCell>
                                                <TableCell><Skeleton width="150px" /></TableCell>
                                                <TableCell><Skeleton width="200px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="80px" /></TableCell>
                                                <TableCell><Skeleton width="150px" /></TableCell>
                                                <TableCell><Skeleton width="150px" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : currentPageData.length > 0 ? (
                                        currentPageData.map((role) => (
                                            <TableRow
                                                key={role.id}
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
                                                        <Tooltip title="Edit role">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleOpenEditDialog(role)}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete role">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleOpenDeleteDialog(role)}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }} align="center">
                                                    {role.id}
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }}>
                                                    {role.roleName}
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {role.description}
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }} align="center">
                                                    {role.permissions && role.permissions.length > 0 ? (
                                                        // Count only of permissions
                                                        <Chip
                                                            label={role.permissions.length}
                                                            color="default"
                                                            size="small"
                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                        />
                                                    ) : (
                                                        <Typography color="text.secondary">No permissions assigned</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Tooltip title={`${role.isActive ? 'Deactivate' : 'Activate'} role`}>
                                                        <span>
                                                            <Switch
                                                                checked={role.isActive}
                                                                onChange={() => handleToggleStatus(role)}
                                                                disabled={toggleLoading === role.id}
                                                                color="success"
                                                                size="small"
                                                            />
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {FormatUtcTime.formatDateTime(role.createdAt)}
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {FormatUtcTime.formatDateTime(role.updatedAt)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography color="text.secondary">
                                                    {searchTerm ? `No roles found matching "${searchTerm}"` : "No roles available"}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination */}
                        {filteredRoles.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 2, gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Showing {filteredRoles.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredRoles.length)} of {filteredRoles.length} items
                                </Typography>
                                {filteredRoles.length > itemsPerPage && (
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

            {/* Create/Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {dialogMode === "create" ? "Create New Role" : "Edit Role"}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Role Name"
                            fullWidth
                            required
                            value={formData.roleName}
                            onChange={(e) => handleFormChange("roleName", e.target.value)}
                            disabled={dialogLoading}
                            autoFocus
                        />
                        <TextField
                            label="Description"
                            required
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleFormChange("description", e.target.value)}
                            disabled={dialogLoading}
                        />

                        {/* Permissions Section */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                Permissions
                            </Typography>
                            {Object.keys(groupedPermissions).length > 0 ? (
                                Object.entries(groupedPermissions).map(([category, perms]) => (
                                    <Box key={category} sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={500} color="primary" sx={{ mb: 1 }}>
                                            {category}
                                        </Typography>
                                        <FormGroup>
                                            <Grid container spacing={1}>
                                                {perms.map((permission) => (
                                                    <Grid size={{ xs: 12, sm: 6 }} key={permission.id}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={formData.selectedPermissions.includes(permission.id)}
                                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                                    disabled={dialogLoading}
                                                                />
                                                            }
                                                            label={
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {permission.permissionName}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {permission.permissionCode}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </FormGroup>
                                    </Box>
                                ))
                            ) : (
                                <Typography color="text.secondary">No permissions available</Typography>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseDialog}
                        disabled={dialogLoading}
                        sx={{ border: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={dialogLoading}
                        startIcon={<SaveIcon />}
                    >
                        {dialogLoading ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the role <strong>"{deletingRole?.roleName}"</strong>?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone. All users assigned to this role will lose their permissions.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseDeleteDialog}
                        sx={{ border: 1 }}
                        disabled={deleteLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        disabled={deleteLoading}
                        startIcon={<DeleteIcon />}
                    >
                        {deleteLoading ? "Deleting..." : "Delete"}
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
