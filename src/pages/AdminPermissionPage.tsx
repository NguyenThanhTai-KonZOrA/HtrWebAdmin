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
import { permissionService } from "../services/rolePermissionService";
import type { PermissionResponse, CreatePermissionRequest, UpdatePermissionRequest } from "../rolePermissionType";
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";
import { FormatUtcTime } from "../utils/formatUtcTime";

export default function AdminPermissionPage() {
    useSetPageTitle(PAGE_TITLES.PERMISSIONS);
    const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toggleLoading, setToggleLoading] = useState<number | null>(null);

    // Search and pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
    const [dialogLoading, setDialogLoading] = useState(false);
    const [editingPermission, setEditingPermission] = useState<PermissionResponse | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        permissionName: "",
        permissionCode: "",
        description: "",
        category: "",
    });

    // Delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingPermission, setDeletingPermission] = useState<PermissionResponse | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const showSnackbar = (message: string, severity: "success" | "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const loadPermissions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await permissionService.getAllPermissions();
            setPermissions(data);
        } catch (error: any) {
            console.error("Error loading permissions:", error);
            let errorMessage = "Failed to load permissions data";
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

    const handleToggleStatus = async (permission: PermissionResponse) => {
        try {
            setToggleLoading(permission.id);
            const result = await permissionService.togglePermissionStatus(permission.id);

            if (result) {
                showSnackbar(`Changed status for permission "${permission.permissionName}" successfully!`, "success");
                setPermissions(prevPermissions =>
                    prevPermissions.map(p =>
                        p.id === permission.id ? { ...p, isActive: !p.isActive } : p
                    )
                );
            } else {
                setError("Failed to change permission status");
            }
        } catch (error: any) {
            console.error("Error updating permission status:", error);
            let errorMessage = "Error updating permission status";
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
        setEditingPermission(null);
        setFormData({
            permissionName: "",
            permissionCode: "",
            description: "",
            category: "",
        });
        setDialogOpen(true);
    };

    const handleOpenEditDialog = (permission: PermissionResponse) => {
        setDialogMode("edit");
        setEditingPermission(permission);
        setFormData({
            permissionName: permission.permissionName,
            permissionCode: permission.permissionCode,
            description: permission.description || "",
            category: permission.category || "",
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingPermission(null);
        setFormData({
            permissionName: "",
            permissionCode: "",
            description: "",
            category: "",
        });
    };

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.permissionName.trim()) {
            showSnackbar("Permission name is required", "error");
            return;
        }

        if (!formData.permissionCode.trim()) {
            showSnackbar("Permission code is required", "error");
            return;
        }

        try {
            setDialogLoading(true);

            if (dialogMode === "create") {
                const request: CreatePermissionRequest = {
                    permissionName: formData.permissionName.trim(),
                    permissionCode: formData.permissionCode.trim(),
                    description: formData.description.trim() || undefined,
                    category: formData.category.trim() || undefined,
                };
                const result = await permissionService.createPermission(request);
                setPermissions(prev => [...prev, result]);
                showSnackbar(`Permission "${result.permissionName}" created successfully!`, "success");
            } else {
                if (!editingPermission) return;

                const request: UpdatePermissionRequest = {
                    id: editingPermission.id,
                    permissionName: formData.permissionName.trim(),
                    permissionCode: formData.permissionCode.trim(),
                    description: formData.description.trim() || undefined,
                    category: formData.category.trim() || undefined,
                };
                const result = await permissionService.updatePermission(editingPermission.id, request);
                setPermissions(prev =>
                    prev.map(p => p.id === result.id ? result : p)
                );
                showSnackbar(`Permission "${result.permissionName}" updated successfully!`, "success");
            }

            handleCloseDialog();
        } catch (error: any) {
            console.error("Error submitting permission:", error);
            let errorMessage = dialogMode === "create"
                ? "Error creating permission"
                : "Error updating permission";

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

    const handleOpenDeleteDialog = (permission: PermissionResponse) => {
        setDeletingPermission(permission);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setDeletingPermission(null);
    };

    const handleDelete = async () => {
        if (!deletingPermission) return;

        try {
            setDeleteLoading(true);
            const result = await permissionService.deletePermission(deletingPermission.id);

            if (result) {
                setPermissions(prev => prev.filter(p => p.id !== deletingPermission.id));
                showSnackbar(`Permission "${deletingPermission.permissionName}" deleted successfully!`, "success");
                handleCloseDeleteDialog();
            }
        } catch (error: any) {
            console.error("Error deleting permission:", error);
            let errorMessage = "Error deleting permission";

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
        loadPermissions();
    }, []);

    // Get unique categories for filter
    const categories = useMemo(() => {
        const cats = new Set<string>();
        permissions.forEach(p => {
            if (p.category) {
                cats.add(p.category);
            }
        });
        return Array.from(cats).sort();
    }, [permissions]);

    // Search and filter logic
    const filteredPermissions = useMemo(() => {
        let filtered = permissions;

        // Apply category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.permissionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.permissionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        return filtered;
    }, [permissions, searchTerm, categoryFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredPermissions.slice(startIndex, endIndex);

    // Reset to first page when search term, category filter, or items per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, categoryFilter, itemsPerPage]);

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

    const handleCategoryFilterChange = (event: any) => {
        setCategoryFilter(event.target.value);
    };

    return (
        <AdminLayout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                        Manage permissions, create new permissions, update information, and control status
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
                                    label="Search permissions..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={categoryFilter}
                                        label="Category"
                                        onChange={handleCategoryFilterChange}
                                    >
                                        <MenuItem value="all">All Categories</MenuItem>
                                        {categories.map((cat) => (
                                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
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
                                    onClick={loadPermissions}
                                    disabled={loading}
                                >
                                    Refresh
                                </Button>
                            </Grid>

                            <Grid size={{ xs: 12, md: 3 }}>
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
                        </Grid>

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                    Total: {filteredPermissions.length} permissions
                                    {(searchTerm || categoryFilter !== "all") && ` (filtered from ${permissions.length})`}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                                    <Chip
                                        label={`Active: ${permissions.filter(p => p.isActive).length}`}
                                        color="success"
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`Inactive: ${permissions.filter(p => !p.isActive).length}`}
                                        color="error"
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`Categories: ${categories.length}`}
                                        color="info"
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
                        <IconButton size="small" onClick={loadPermissions}>
                            <RefreshIcon />
                        </IconButton>
                    }>
                        {error}
                    </Alert>
                )}

                {/* Permissions Table */}
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
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 200 }}>
                                            Permission Name
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 150 }} align="center">
                                            Permission Code
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 250 }}>
                                            Description
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 80 }} align="center">
                                            Category
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                            Status
                                        </TableCell>
                                        {/* <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 180 }}>
                                            Created At
                                        </TableCell> */}
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
                                                <TableCell><Skeleton width="120px" /></TableCell>
                                                <TableCell><Skeleton width="200px" /></TableCell>
                                                <TableCell><Skeleton width="100px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="80px" /></TableCell>
                                                <TableCell><Skeleton width="150px" /></TableCell>
                                                <TableCell><Skeleton width="150px" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : currentPageData.length > 0 ? (
                                        currentPageData.map((permission) => (
                                            <TableRow
                                                key={permission.id}
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
                                                        <Tooltip title="Edit permission">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleOpenEditDialog(permission)}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete permission">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleOpenDeleteDialog(permission)}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }} align="center">
                                                    {permission.id}
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }}>
                                                    {permission.permissionName}
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }} align="center">
                                                    <Chip
                                                        label={permission.permissionCode}
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {permission.description || '-'}
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }} align="center">
                                                    {permission.category ? (
                                                        <Chip
                                                            label={permission.category}
                                                            size="small"
                                                            variant="outlined"
                                                            color="secondary"
                                                        />
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    <Tooltip title={`${permission.isActive ? 'Deactivate' : 'Activate'} permission`}>
                                                        <span>
                                                            <Switch
                                                                checked={permission.isActive}
                                                                onChange={() => handleToggleStatus(permission)}
                                                                disabled={toggleLoading === permission.id}
                                                                color="success"
                                                                size="small"
                                                            />
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                                {/* <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {FormatUtcTime.formatDateTime(permission.createdAt)}
                                                </TableCell> */}
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {FormatUtcTime.formatDateTime(permission.updatedAt)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography color="text.secondary">
                                                    {searchTerm || categoryFilter !== "all"
                                                        ? "No permissions found matching your filters"
                                                        : "No permissions available"}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination */}
                        {filteredPermissions.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 2, gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Showing {filteredPermissions.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredPermissions.length)} of {filteredPermissions.length} items
                                </Typography>
                                {filteredPermissions.length > itemsPerPage && (
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
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {dialogMode === "create" ? "Create New Permission" : "Edit Permission"}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Permission Name"
                            fullWidth
                            required
                            value={formData.permissionName}
                            onChange={(e) => handleFormChange("permissionName", e.target.value)}
                            disabled={dialogLoading}
                            autoFocus
                        />
                        <TextField
                            label="Permission Code"
                            fullWidth
                            required
                            value={formData.permissionCode}
                            onChange={(e) => handleFormChange("permissionCode", e.target.value)}
                            disabled={dialogLoading}
                            helperText="Unique code identifier (e.g., USER.CREATE, ROLE.UPDATE)"
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleFormChange("description", e.target.value)}
                            disabled={dialogLoading}
                        />
                        <TextField
                            label="Category"
                            fullWidth
                            value={formData.category}
                            onChange={(e) => handleFormChange("category", e.target.value)}
                            disabled={dialogLoading}
                            helperText="Group permissions by category (e.g., User Management, System)"
                        />
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
                        Are you sure you want to delete the permission <strong>"{deletingPermission?.permissionName}"</strong>?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone. All roles with this permission will lose access to this functionality.
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
