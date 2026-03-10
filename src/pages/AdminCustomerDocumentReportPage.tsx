import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Stack,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Collapse,
    Pagination,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Chip,
    Divider,
    InputAdornment
} from '@mui/material';
import {
    Search as SearchIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Description as DocumentIcon,
    Visibility as VisibilityIcon,
    Close as CloseIcon,
    CloudDownload as DownloadIcon,
    Folder as FolderIcon,
    InsertDriveFile as FileIcon
} from '@mui/icons-material';
import AdminLayout from '../components/layout/AdminLayout';
import { useSetPageTitle } from '../hooks/useSetPageTitle';
import { renderDocumentService } from '../services/registrationService';
import type { DocumentsPagingRequest, DocumentsPagingResponse, PatronDocumentGroup, DocumentResponse } from '../registrationType';
import { FormatUtcTime } from '../utils/formatUtcTime';
import { PAGE_TITLES } from '../constants/pageTitles';
import { extractErrorMessage, logError } from '../utils/errorHandler';
import { useSnackbar } from '../contexts/SnackbarContext';

const AdminCustomerDocumentReportPage: React.FC = () => {
    useSetPageTitle(PAGE_TITLES.CUSTOMER_SIGNED_DOCUMENTS || 'Customer Signed Documents');

    const { showSnackbar } = useSnackbar();
    const API_BASE = (window as any)._env_?.API_BASE;
    const ONLINE_API_BASE = (window as any)._env_?.ONLINE_API_BASE;

    // States
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [data, setData] = useState<DocumentsPagingResponse | null>(null);

    // Pagination states
    const [page, setPage] = useState<number>(1);
    const [pageSize] = useState<number>(10);

    // Expanded rows state
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Preview Dialog States
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');

    // Load data
    const loadData = async (currentPage: number, search: string) => {
        try {
            setLoading(true);
            setError('');

            const skip = (currentPage - 1) * pageSize;
            const request: DocumentsPagingRequest = {
                Page: currentPage,
                PageSize: pageSize,
                Skip: skip,
                Take: pageSize,
                SearchTerm: search.trim() || undefined
            };

            const response = await renderDocumentService.getSignedDocumentPaginate(request);
            setData(response);

            if (response.totalRecords === 0) {
                setError('No documents found');
            }
        } catch (err: unknown) {
            const errorMessage = extractErrorMessage(err, "Failed to fetch documents. Please try again.");
            logError('AdminCustomerDocumentReportPage.loadData', err);
            showSnackbar(errorMessage, "error");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadData(page, searchTerm);
    }, []);

    // Handle search
    const handleSearch = () => {
        setPage(1); // Reset to first page
        setExpandedRows(new Set()); // Collapse all rows
        loadData(1, searchTerm);
    };

    // Handle page change
    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        setExpandedRows(new Set()); // Collapse all rows when changing page
        loadData(value, searchTerm);
    };

    // Handle row expand/collapse
    const handleRowExpand = (pid: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(pid)) {
            newExpanded.delete(pid);
        } else {
            newExpanded.add(pid);
        }
        setExpandedRows(newExpanded);
    };

    // Handle preview
    const handlePreview = (document: DocumentResponse) => {
        let finnalUrl = API_BASE;
        if (document.isOnline) {
            finnalUrl = ONLINE_API_BASE;
        }
        const url = document.fileUrl.startsWith('http')
            ? document.fileUrl
            : `${finnalUrl}${document.fileUrl}`;
        setPreviewUrl(url);
        setPreviewTitle(document.fileName);
        setPreviewDialogOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewDialogOpen(false);
        setPreviewUrl('');
        setPreviewTitle('');
    };

    // Handle download
    const handleViewDownload = (url: string, filename: string) => {
        if (!url) {
            setError('Document URL is not available');
            return;
        }
        try {
            const link = document.createElement('a');
            link.href = url.startsWith('http') ? url : `${API_BASE}${url}`;
            link.setAttribute('download', filename);
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: unknown) {
            const errorMessage = extractErrorMessage(err, "Failed to download document. Please try again.");
            logError('AdminCustomerDocumentReportPage.handleViewDownload', err);
            showSnackbar(errorMessage, "error");
        }
    };

    // Get file type from URL
    const getFileType = (url?: string): string => {
        if (!url) return 'unknown';
        const extension = url.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') return 'PDF';
        if (['xls', 'xlsx'].includes(extension || '')) return 'Excel';
        if (['html', 'htm'].includes(extension || '')) return 'HTML';
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return 'Image';
        if (['doc', 'docx'].includes(extension || '')) return 'Word';
        return 'Document';
    };

    // Format date
    const formatDate = (dateString?: string): string => {
        if (!dateString) return '-';
        try {
            return FormatUtcTime.formatDateDDMMMYYYY(dateString);
        } catch {
            return dateString;
        }
    };

    // Calculate total pages
    const totalPages = data ? Math.ceil(data.totalRecords / pageSize) : 0;

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                {/* <Typography variant="h5" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
                    Customer Document Report
                </Typography> */}
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                    Search and view customer signed documents with detailed information
                </Typography>

                {/* Search Section */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            Search Documents
                        </Typography>
                        <Box display="flex" gap={2} alignItems="flex-start">
                            <TextField
                                label="Search"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearch();
                                    }
                                }}
                                placeholder="Enter name, player ID, or other information..."
                                size="small"
                                fullWidth
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                                onClick={handleSearch}
                                disabled={loading}
                                sx={{ height: '40px', minWidth: '120px' }}
                                size='small'
                            >
                                Search
                            </Button>
                        </Box>
                        {error && !data && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Results Section */}
                {data && data.data.length > 0 && (
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ color: 'primary.main' }}>
                                    Document Records
                                </Typography>
                                <Chip
                                    label={`Total: ${data.totalRecords} record${data.totalRecords > 1 ? 's' : ''}`}
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>

                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                            <TableCell width="50px" />
                                            <TableCell sx={{ minWidth: 150 }}><strong>Registration Type</strong></TableCell>
                                            <TableCell><strong>Player ID</strong></TableCell>
                                            <TableCell><strong>Full Name</strong></TableCell>
                                            <TableCell><strong>ID Number</strong></TableCell>
                                            <TableCell><strong>Gender</strong></TableCell>
                                            <TableCell><strong>Birthday</strong></TableCell>
                                            <TableCell><strong>Occupation</strong></TableCell>
                                            <TableCell><strong>Position</strong></TableCell>
                                            <TableCell><strong>Signed Date</strong></TableCell>
                                            <TableCell align="center"><strong>Documents</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.data.map((patron) => (
                                            <React.Fragment key={patron.pid}>
                                                <TableRow
                                                    hover
                                                    sx={{
                                                        '& > *': { borderBottom: 'unset' },
                                                        cursor: patron.documentCount > 0 ? 'pointer' : 'default',
                                                        backgroundColor: expandedRows.has(patron.pid) ? 'action.hover' : 'inherit'
                                                    }}
                                                    onClick={() => patron.documentCount > 0 && handleRowExpand(patron.pid)}
                                                >
                                                    <TableCell>
                                                        {patron.documentCount > 0 && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRowExpand(patron.pid);
                                                                }}
                                                            >
                                                                {expandedRows.has(patron.pid) ? (
                                                                    <KeyboardArrowUpIcon />
                                                                ) : (
                                                                    <KeyboardArrowDownIcon />
                                                                )}
                                                            </IconButton>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip label={patron.registrationType == 1 ? 'Online' : 'Manual'}
                                                            color={patron.registrationType == 1 ? 'success' : 'secondary'}
                                                            size='small' />
                                                    </TableCell>
                                                    <TableCell>{patron.playerId}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {patron.fullName}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{patron.idNumber || '-'}</TableCell>
                                                    <TableCell>{patron.gender || '-'}</TableCell>
                                                    <TableCell>{FormatUtcTime.formatDateWithoutTime(patron.birthday)}</TableCell>
                                                    <TableCell>{patron.jobTitle === 'Unemployed' ? 'Business Man / Business Woman' : patron.jobTitle}</TableCell>
                                                    <TableCell>{patron.position || '-'}</TableCell>
                                                    <TableCell>{FormatUtcTime.formatDateTime(patron.signedDate)}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={patron.documentCount}
                                                            color={patron.documentCount > 0 ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                {patron.documentCount > 0 && (
                                                    <TableRow>
                                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                                                            <Collapse in={expandedRows.has(patron.pid)} timeout="auto" unmountOnExit>
                                                                <Box sx={{ margin: 2 }}>
                                                                    <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2 }}>
                                                                        <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                                        Documents ({patron.documentCount})
                                                                    </Typography>
                                                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                                                        <List>
                                                                            {patron.documents.map((document, index) => (
                                                                                <React.Fragment key={document.id}>
                                                                                    <ListItem
                                                                                        disablePadding
                                                                                        secondaryAction={
                                                                                            <Button
                                                                                                variant="outlined"
                                                                                                size="small"
                                                                                                startIcon={<VisibilityIcon />}
                                                                                                onClick={() => handlePreview(document)}
                                                                                            >
                                                                                                Review
                                                                                            </Button>
                                                                                        }
                                                                                    >
                                                                                        <ListItemButton
                                                                                            onClick={() => handlePreview(document)}
                                                                                            sx={{ pr: 12 }}
                                                                                        >
                                                                                            <ListItemIcon>
                                                                                                <FileIcon color="primary" />
                                                                                            </ListItemIcon>
                                                                                            <ListItemText
                                                                                                primary={
                                                                                                    <Typography variant="body1" fontWeight={500}>
                                                                                                        {document.fileName}
                                                                                                    </Typography>
                                                                                                }
                                                                                                secondary={
                                                                                                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                                                                                        <Chip
                                                                                                            label={document.documentType || 'Document'}
                                                                                                            size="small"
                                                                                                            variant="outlined"
                                                                                                        />
                                                                                                        <Typography variant="caption" color="text.secondary">
                                                                                                            Uploaded: {formatDate(document.uploadedDate)}
                                                                                                        </Typography>
                                                                                                    </Stack>
                                                                                                }
                                                                                            />
                                                                                        </ListItemButton>
                                                                                    </ListItem>
                                                                                    {index < patron.documents.length - 1 && <Divider />}
                                                                                </React.Fragment>
                                                                            ))}
                                                                        </List>
                                                                    </Paper>
                                                                </Box>
                                                            </Collapse>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Pagination
                                        count={totalPages}
                                        page={page}
                                        onChange={handlePageChange}
                                        color="primary"
                                        showFirstButton
                                        showLastButton
                                        disabled={loading}
                                    />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* No Results */}
                {data && data.data.length === 0 && !loading && (
                    <Card>
                        <CardContent>
                            <Box textAlign="center" py={4}>
                                <DocumentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No documents found
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Try adjusting your search criteria
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Preview Dialog */}
                <Dialog
                    open={previewDialogOpen}
                    onClose={handleClosePreview}
                    maxWidth="lg"
                    fullWidth
                    PaperProps={{
                        sx: { height: '90vh' }
                    }}
                >
                    <DialogTitle>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">{previewTitle}</Typography>
                            <IconButton onClick={handleClosePreview} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 0, height: '100%' }}>
                        {(() => {
                            const fileType = getFileType(previewUrl);
                            if (fileType === 'Image') {
                                return (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '100%',
                                            bgcolor: 'grey.100'
                                        }}
                                    >
                                        <img
                                            src={previewUrl}
                                            alt="Document"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain'
                                            }}
                                        />
                                    </Box>
                                );
                            } else if (fileType === 'PDF') {
                                return (
                                    <iframe
                                        src={previewUrl}
                                        title="PDF Viewer"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none'
                                        }}
                                    />
                                );
                            } else if (fileType === 'Word' || fileType === 'Excel') {
                                return (
                                    <Box textAlign="center" p={4}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            Preview not available
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            This file type ({fileType}) cannot be previewed in the browser. <br />
                                            You can download the file to view it.
                                        </Typography>
                                    </Box>
                                );
                            } else {
                                return (
                                    <iframe
                                        src={previewUrl}
                                        title="Document Viewer"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none'
                                        }}
                                    />
                                );
                            }
                        })()}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClosePreview} variant="outlined">
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => {
                                handleViewDownload(previewUrl, previewTitle);
                            }}
                        >
                            Download
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    );
};

export default AdminCustomerDocumentReportPage;
