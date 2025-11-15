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
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress,
    Alert,
    Skeleton,
    Snackbar,
    Tooltip,
    Grid,
    Stack
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    ClearAll as ClearAllIcon
} from "@mui/icons-material";
import { useState, useEffect } from "react";

import AdminLayout from "../layout/AdminLayout";
import { settingsService } from "../services/queueService";
import type { 
    SettingsResponse, 
    CreateSettingsRequest, 
    UpdateSettingsRequest,
    SettingsInfoResponse,
    CategoriesofSettingsResponse
} from "../type";
import { PAGE_TITLES } from "../constants/pageTitles";
import { useSetPageTitle } from "../hooks/useSetPageTitle";

interface SettingsFormData {
    key: string;
    value: string;
    description: string;
    category: string;
    dataType: string;
}

const DATA_TYPES = [
    { value: "string", label: "String" },
    { value: "int", label: "Integer" },
    { value: "bool", label: "Boolean" },
    { value: "decimal", label: "Decimal" },
    { value: "json", label: "JSON" }
];

export default function AdminSettingsPage() {
    useSetPageTitle(PAGE_TITLES.SYSTEM_SETTINGS);
    // States
    const [settings, setSettings] = useState<SettingsResponse[]>([]);
    const [settingsInfo, setSettingsInfo] = useState<SettingsInfoResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [selectedSetting, setSelectedSetting] = useState<SettingsResponse | null>(null);
    const [formData, setFormData] = useState<SettingsFormData>({
        key: '',
        value: '',
        description: '',
        category: '',
        dataType: 'string'
    });
    const [formLoading, setFormLoading] = useState(false);
    
    // Snackbar states
    const [snackbar, setSnackbar] = useState({ 
        open: false, 
        message: "", 
        severity: "success" as "success" | "error" | "warning" | "info"
    });

    const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Load initial data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [settingsData, infoData] = await Promise.all([
                settingsService.getAllSettings(),
                settingsService.getSettingsInfor()
            ]);
            
            setSettings(settingsData);
            setSettingsInfo(infoData);
        } catch (error) {
            console.error("Error loading settings data:", error);
            setError("Failed to load settings data");
        } finally {
            setLoading(false);
        }
    };

    // Handle Create New Setting
    const handleCreateClick = () => {
        setDialogMode('create');
        setSelectedSetting(null);
        setFormData({
            key: '',
            value: '',
            description: '',
            category: '',
            dataType: 'string'
        });
        setDialogOpen(true);
    };

    // Handle Update Setting
    const handleUpdateClick = async (setting: SettingsResponse) => {
        try {
            setFormLoading(true);
            const detailData = await settingsService.getSettingDetail(setting.key);
            
            setDialogMode('edit');
            setSelectedSetting(setting);
            setFormData({
                key: detailData.key,
                value: detailData.value,
                description: detailData.description,
                category: detailData.category,
                dataType: 'string' // Default since API doesn't return dataType
            });
            setDialogOpen(true);
        } catch (error) {
            console.error("Error loading setting detail:", error);
            showSnackbar("Failed to load setting details", "error");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle Clear Cache
    const handleClearCache = async (key: string) => {
        try {
            const result = await settingsService.clearCacheSetting(key);
            showSnackbar(`Cache cleared: ${result.message}`, "success");
        } catch (error) {
            console.error("Error clearing cache:", error);
            showSnackbar("Failed to clear cache", "error");
        }
    };

    // Handle Form Submit
    const handleFormSubmit = async () => {
        try {
            setFormLoading(true);
            
            if (dialogMode === 'create') {
                const createData: CreateSettingsRequest = {
                    key: formData.key,
                    value: formData.value,
                    description: formData.description,
                    category: formData.category,
                    dataType: formData.dataType
                };
                
                await settingsService.createSettings(createData);
                showSnackbar("Setting created successfully", "success");
            } else {
                const updateData: UpdateSettingsRequest = {
                    key: formData.key,
                    value: formData.value
                };
                
                const result = await settingsService.updateSetting(selectedSetting!.key, updateData);
                
                if (result.requiresRestart) {
                    showSnackbar(`Setting updated. ${result.warning || 'Restart may be required.'}`, "warning");
                } else {
                    showSnackbar("Setting updated successfully", "success");
                }
            }
            
            setDialogOpen(false);
            loadData(); // Reload data
        } catch (error) {
            console.error("Error saving setting:", error);
            showSnackbar(`Failed to ${dialogMode === 'create' ? 'create' : 'update'} setting`, "error");
        } finally {
            setFormLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'System': 'primary',
            'UI': 'secondary',
            'Integration': 'info',
            'Performance': 'warning',
            'Security': 'error',
            'Business': 'success'
        };
        return colors[category] || 'default';
    };

    return (
        <AdminLayout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                        Manage application configuration settings
                    </Typography>
                </Box>

                {/* Info Cards */}
                {settingsInfo && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Cache Expiration
                                    </Typography>
                                    <Typography variant="h5">
                                        {settingsInfo.cacheExpirationMinutes} min
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Total Settings
                                    </Typography>
                                    <Typography variant="h5">
                                        {settings.length}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Categories
                                    </Typography>
                                    <Typography variant="h5">
                                        {settingsInfo.categories?.length || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateClick}
                        disabled={loading}
                    >
                        Create New Setting
                    </Button>
                    
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadData}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Box>

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Settings Table */}
                <Card>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
                                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Skeleton width="120px" /></TableCell>
                                                <TableCell><Skeleton width="100px" /></TableCell>
                                                <TableCell><Skeleton width="200px" /></TableCell>
                                                <TableCell><Skeleton width="80px" /></TableCell>
                                                <TableCell><Skeleton width="60px" /></TableCell>
                                                <TableCell><Skeleton width="100px" /></TableCell>
                                                <TableCell><Skeleton width="120px" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : settings.length > 0 ? (
                                        settings.map((setting) => (
                                            <TableRow 
                                                key={setting.id}
                                                sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.25' } }}
                                            >
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                                    {setting.key}
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {setting.value}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {setting.description}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={setting.category} 
                                                        size="small"
                                                        color={getCategoryColor(setting.category) as any}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={setting.isActive ? "Active" : "Inactive"} 
                                                        size="small"
                                                        color={setting.isActive ? "success" : "default"}
                                                        variant="filled"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(setting.updatedAt)}
                                                    </Typography>
                                                    <br />
                                                    <Typography variant="caption" color="text.secondary">
                                                        by {setting.updatedBy}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <Tooltip title="Update Setting">
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleUpdateClick(setting)}
                                                                disabled={formLoading}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={`Clear Cache: AppSetting_${setting.key}`}>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleClearCache(setting.key)}
                                                                color="warning"
                                                            >
                                                                <ClearAllIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography color="text.secondary">
                                                    No settings found
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

            {/* Create/Update Dialog */}
            <Dialog 
                open={dialogOpen} 
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SettingsIcon />
                        {dialogMode === 'create' ? 'Create New Setting' : 'Update Setting'}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Key"
                            value={formData.key}
                            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                            disabled={dialogMode === 'edit' || formLoading}
                            required
                            fullWidth
                        />
                        
                        <TextField
                            label="Value"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            disabled={formLoading}
                            required
                            fullWidth
                            multiline
                            rows={3}
                        />
                        
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            disabled={dialogMode === 'edit' || formLoading}
                            fullWidth
                            multiline
                            rows={2}
                        />
                        
                        <FormControl fullWidth disabled={dialogMode === 'edit' || formLoading}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={formData.category}
                                label="Category"
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {settingsInfo?.categories?.map((cat) => (
                                    <MenuItem key={cat.name} value={cat.name}>
                                        {cat.name} - {cat.description}
                                    </MenuItem>
                                )) || []}
                            </Select>
                        </FormControl>

                        {dialogMode === 'create' && (
                            <FormControl fullWidth disabled={formLoading}>
                                <InputLabel>Data Type</InputLabel>
                                <Select
                                    value={formData.dataType}
                                    label="Data Type"
                                    onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                                >
                                    {DATA_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} disabled={formLoading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleFormSubmit} 
                        variant="contained" 
                        disabled={formLoading || !formData.key || !formData.value}
                    >
                        {formLoading ? 'Saving...' : (dialogMode === 'create' ? 'Create' : 'Update')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
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