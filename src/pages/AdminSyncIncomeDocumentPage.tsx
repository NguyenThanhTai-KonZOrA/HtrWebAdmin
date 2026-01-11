import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    Button,
    Alert,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Link,
    List,
    ListItem,
    ListItemText,
    Divider,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    CloudUpload as UploadIcon,
    Download as DownloadIcon,
    Sync as SyncIcon,
    Close as CloseIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Visibility as ViewIcon,
} from "@mui/icons-material";
import { useState } from "react";
import AdminLayout from "../components/layout/AdminLayout";
import { syncService } from "../services/registrationService";
import type { SyncIncomeDocumentRequest, SyncIncomeDocumentResponse } from "../registrationType";
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";
import * as XLSX from 'xlsx';

interface ExcelRow {
    OldPlayerId: number | null;
    NewPlayerId: number | null;
    rowNumber: number;
    error?: string;
}

interface ValidationResult {
    isValid: boolean;
    rows: ExcelRow[];
    errors: string[];
}

export default function AdminSyncIncomeDocumentPage() {
    useSetPageTitle("Income Documents Migration");

    // Single Player Sync States
    const [oldPlayerId, setOldPlayerId] = useState("");
    const [newPlayerId, setNewPlayerId] = useState("");
    const [singleSyncLoading, setSingleSyncLoading] = useState(false);

    // Excel Upload States
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [excelSyncLoading, setExcelSyncLoading] = useState(false);
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);

    // Result States
    const [syncResult, setSyncResult] = useState<SyncIncomeDocumentResponse | null>(null);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Single Player Sync Handler
    const handleSinglePlayerSync = async () => {
        try {
            setSingleSyncLoading(true);
            setError(null);
            debugger
            const request: SyncIncomeDocumentRequest = {
                OldPlayerId: parseInt(oldPlayerId),
                NewPlayerId: parseInt(newPlayerId),
            };

            const result = await syncService.syncSinglePlayerIncomeDocument(request);

            setSyncResult(result);
            setShowResultDialog(true);

            // Clear inputs on success
            setOldPlayerId("");
            setNewPlayerId("");
        } catch (err: any) {
            console.error("Error syncing single player:", err);
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to sync income documents";
            setError(errorMessage);
        } finally {
            setSingleSyncLoading(false);
        }
    };

    // Excel File Upload Handler
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setExcelFile(file);
        setValidationResult(null);
        setError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null });

            // Start reading from row 2 (index 1), row 1 is header
            const dataRows = jsonData.slice(1) as any[][];
            const rows: ExcelRow[] = [];
            const errors: string[] = [];

            dataRows.forEach((row, index) => {
                const rowNumber = index + 2; // Excel row number (starting from A2)
                const oldId = row[0];
                const newId = row[1];

                // Skip completely empty rows
                if (oldId === null && newId === null && row.length === 0) {
                    return;
                }

                let rowError = "";
                let oldPlayerIdValue: number | null = null;
                let newPlayerIdValue: number | null = null;

                // Validate OldPlayerId
                if (oldId === null || oldId === undefined || oldId === "") {
                    rowError = "Missing OldPlayerId";
                } else {
                    const oldIdNum = typeof oldId === 'number' ? oldId : parseInt(String(oldId));
                    if (isNaN(oldIdNum) || oldIdNum <= 0) {
                        rowError = "Invalid OldPlayerId";
                    } else {
                        oldPlayerIdValue = oldIdNum;
                    }
                }

                // Validate NewPlayerId
                if (newId === null || newId === undefined || newId === "") {
                    rowError = rowError ? `${rowError}, Missing NewPlayerId` : "Missing NewPlayerId";
                } else {
                    const newIdNum = typeof newId === 'number' ? newId : parseInt(String(newId));
                    if (isNaN(newIdNum) || newIdNum <= 0) {
                        rowError = rowError ? `${rowError}, Invalid NewPlayerId` : "Invalid NewPlayerId";
                    } else {
                        newPlayerIdValue = newIdNum;
                    }
                }

                if (rowError) {
                    errors.push(`Row ${rowNumber}: ${rowError}`);
                }

                rows.push({
                    OldPlayerId: oldPlayerIdValue,
                    NewPlayerId: newPlayerIdValue,
                    rowNumber,
                    error: rowError || undefined,
                });
            });

            const isValid = errors.length === 0 && rows.length > 0;

            if (rows.length === 0) {
                errors.push("No data rows found in Excel file");
            }

            setValidationResult({
                isValid,
                rows,
                errors,
            });

            // Show preview dialog
            setShowPreviewDialog(true);
        } catch (err: any) {
            console.error("Error reading Excel file:", err);
            setError("Failed to read Excel file. Please ensure it's a valid .xlsx file.");
        }
    };

    // Excel Sync Handler
    const handleExcelSync = async () => {
        if (!excelFile) return;

        try {
            setExcelSyncLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('excelFile', excelFile);

            const result = await syncService.syncIncomeDocumentsByExcel(formData);

            setSyncResult(result);
            setShowResultDialog(true);
            setShowPreviewDialog(false);

            // Clear file input
            setExcelFile(null);
            setValidationResult(null);

            // Reset file input element
            const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err: any) {
            console.error("Error syncing via Excel:", err);
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to sync income documents via Excel";
            setError(errorMessage);
        } finally {
            setExcelSyncLoading(false);
        }
    };

    // Download Template Handler
    const handleDownloadTemplate = () => {
        const link = document.createElement('a');
        link.href = '/templates/TemplateSyncIncomeDocument.xlsx';
        link.download = 'TemplateSyncIncomeDocument.xlsx';
        link.click();
    };

    // Check if single sync button should be enabled
    const isSingleSyncEnabled = oldPlayerId.trim() !== "" &&
        newPlayerId.trim() !== "" &&
        !isNaN(parseInt(oldPlayerId)) &&
        !isNaN(parseInt(newPlayerId)) &&
        parseInt(oldPlayerId) > 0 &&
        parseInt(newPlayerId) > 0;

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                {/* <Typography variant="h4" gutterBottom>
                    Sync Income Documents
                </Typography> */}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Single Player Sync Section */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Sync Single Player
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <TextField
                                    fullWidth
                                    label="Old Player ID"
                                    type="number"
                                    value={oldPlayerId}
                                    onChange={(e) => setOldPlayerId(e.target.value)}
                                    sx={{ mb: 2 }}
                                    disabled={singleSyncLoading}
                                    inputProps={{ min: 1 }}
                                />

                                <TextField
                                    fullWidth
                                    label="New Player ID"
                                    type="number"
                                    value={newPlayerId}
                                    onChange={(e) => setNewPlayerId(e.target.value)}
                                    sx={{ mb: 2 }}
                                    disabled={singleSyncLoading}
                                    inputProps={{ min: 1 }}
                                />

                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    startIcon={<SyncIcon />}
                                    onClick={handleSinglePlayerSync}
                                    disabled={!isSingleSyncEnabled || singleSyncLoading}
                                >
                                    {singleSyncLoading ? "Syncing..." : "Sync Single Player"}
                                </Button>

                                {singleSyncLoading && <LinearProgress sx={{ mt: 2 }} />}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Excel Upload Section */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Sync via Excel File
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDownloadTemplate}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                >
                                    Download Template
                                </Button>

                                <input
                                    accept=".xlsx,.xls"
                                    style={{ display: 'none' }}
                                    id="excel-file-input"
                                    type="file"
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="excel-file-input">
                                    <Button
                                        variant="contained"
                                        component="span"
                                        fullWidth
                                        startIcon={<UploadIcon />}
                                    >
                                        Upload Excel File
                                    </Button>
                                </label>

                                {excelFile && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        File: {excelFile.name}
                                    </Alert>
                                )}

                                {validationResult && !validationResult.isValid && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        Validation failed. Please fix errors and upload again.
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Preview Dialog */}
                <Dialog
                    open={showPreviewDialog}
                    onClose={() => setShowPreviewDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">
                                {validationResult?.isValid ? "Confirm Sync" : "Validation Errors"}
                            </Typography>
                            <IconButton onClick={() => setShowPreviewDialog(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent dividers>
                        {validationResult?.isValid ? (
                            <>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    All rows validated successfully! Ready to sync {validationResult.rows.length} records.
                                </Alert>
                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Row</TableCell>
                                                <TableCell>Old Player ID</TableCell>
                                                <TableCell>New Player ID</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {validationResult.rows.map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{row.rowNumber}</TableCell>
                                                    <TableCell>{row.OldPlayerId}</TableCell>
                                                    <TableCell>{row.NewPlayerId}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        ) : (
                            <>
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    Found {validationResult?.errors.length || 0} error(s). Please fix and re-upload.
                                </Alert>
                                <List>
                                    {validationResult?.errors.map((error, index) => (
                                        <ListItem key={index}>
                                            <ErrorIcon color="error" sx={{ mr: 1 }} />
                                            <ListItemText primary={error} />
                                        </ListItem>
                                    ))}
                                </List>

                                <Divider sx={{ my: 2 }} />

                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Row</TableCell>
                                                <TableCell>Old Player ID</TableCell>
                                                <TableCell>New Player ID</TableCell>
                                                <TableCell>Error</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {validationResult?.rows.map((row, index) => (
                                                <TableRow
                                                    key={index}
                                                    sx={{
                                                        backgroundColor: row.error ? '#ffebee' : 'inherit'
                                                    }}
                                                >
                                                    <TableCell>{row.rowNumber}</TableCell>
                                                    <TableCell>{row.OldPlayerId ?? '-'}</TableCell>
                                                    <TableCell>{row.NewPlayerId ?? '-'}</TableCell>
                                                    <TableCell>
                                                        {row.error && (
                                                            <Chip
                                                                label={row.error}
                                                                color="error"
                                                                size="small"
                                                            />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowPreviewDialog(false)}>
                            Close
                        </Button>
                        {validationResult?.isValid && (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleExcelSync}
                                disabled={excelSyncLoading}
                                startIcon={<SyncIcon />}
                            >
                                {excelSyncLoading ? "Syncing..." : "Confirm Sync"}
                            </Button>
                        )}
                    </DialogActions>
                    {excelSyncLoading && <LinearProgress />}
                </Dialog>

                {/* Result Dialog */}
                <Dialog
                    open={showResultDialog}
                    onClose={() => setShowResultDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Sync Results</Typography>
                            <IconButton onClick={() => setShowResultDialog(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent dividers>
                        {syncResult && (
                            <>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={{ xs: 6 }}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography color="text.secondary" gutterBottom>
                                                    Mapped Batches
                                                </Typography>
                                                <Typography variant="h4">
                                                    {syncResult.mappedBatches}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography color="text.secondary" gutterBottom>
                                                    Mapped Files
                                                </Typography>
                                                <Typography variant="h4">
                                                    {syncResult.mappedFiles}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>

                                {syncResult.errors && syncResult.errors.length > 0 && (
                                    <>
                                        <Typography variant="h6" gutterBottom color="error">
                                            Errors:
                                        </Typography>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            <List dense>
                                                {syncResult.errors.map((error, index) => (
                                                    <ListItem key={index}>
                                                        <ListItemText primary={error} />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Alert>
                                    </>
                                )}

                                {syncResult.newFilesUrl && syncResult.newFilesUrl.length > 0 && (
                                    <>
                                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                            New Files ({syncResult.newFilesUrl.length}):
                                        </Typography>
                                        <List>
                                            {syncResult.newFilesUrl.map((url, index) => (
                                                <ListItem key={index}>
                                                    <SuccessIcon color="success" sx={{ mr: 1 }} />
                                                    <ListItemText
                                                        primary={
                                                            <Link
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    textDecoration: 'none'
                                                                }}
                                                            >
                                                                <ViewIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                                                                {url}
                                                            </Link>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </>
                                )}

                                {(!syncResult.newFilesUrl || syncResult.newFilesUrl.length === 0) &&
                                    (!syncResult.errors || syncResult.errors.length === 0) && (
                                        <Alert severity="info">
                                            Sync completed but no new files were generated.
                                        </Alert>
                                    )}
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowResultDialog(false)} variant="contained">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    );
}
