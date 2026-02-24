import React, { useState } from 'react';
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
    Chip,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    Description as DocumentIcon,
    Article as ArticleIcon,
    Notifications as NotificationIcon,
    Visibility as VisibilityIcon,
    Close as CloseIcon,
    CloudDownload as DownloadIcon
} from '@mui/icons-material';
import AdminLayout from '../components/layout/AdminLayout';
import { useSetPageTitle } from '../hooks/useSetPageTitle';
import { renderDocumentService } from '../services/registrationService';
import type { CustomerConfirmationRequest, CustomerConfirmationResponse } from '../type';
import { DocumentTypes } from '../type';
import { FormatUtcTime } from '../utils/formatUtcTime';

const AdminCustomerConfirmationPage: React.FC = () => {
    useSetPageTitle('Customer Verification Documents');

    const API_BASE = (window as any)._env_?.API_BASE;
    const ONLINE_API_BASE = (window as any)._env_?.ONLINE_API_BASE;

    // States
    const [playerId, setPlayerId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [documentData, setDocumentData] = useState<CustomerConfirmationResponse | null>(null);

    // Upload dialog states
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedDocumentType, setSelectedDocumentType] = useState<number | ''>('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');

    // Preview Dialog States
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');

    // Handle search
    const handleSearch = async () => {
        if (!playerId.trim()) {
            setError('Please enter a Player ID');
            return;
        }

        const playerIdNum = parseInt(playerId);
        if (isNaN(playerIdNum) || playerIdNum <= 0) {
            setError('Please enter a valid Player ID');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setDocumentData(null);

            const request: CustomerConfirmationRequest = {
                playerId: playerIdNum
            };

            const response = await renderDocumentService.getDocumentByPlayerId(request);
            setDocumentData(response);

            if (!response.documentPath && !response.htrFormPath && !response.filePDPNotificationPath) {
                setError('No documents found for this Player ID');
            }
        } catch (err: any) {
            console.error('Error fetching document:', err);
            setError(err.response?.data?.message || 'Failed to fetch document. Please try again.');
            setDocumentData(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle preview document
    const handlePreview = (url: string, title: string, isReSigned: boolean) => {
        if (!url) {
            setError('Document URL is not available');
            return;
        }
        let finalUrl = isReSigned ? ONLINE_API_BASE : API_BASE;
        if (title === 'HTR Form') {
            finalUrl = API_BASE;
        }

        setPreviewUrl(`${finalUrl}${url}`);
        setPreviewTitle(title);
        setPreviewDialogOpen(true);
    };

    // Handle close preview
    const handleClosePreview = () => {
        setPreviewDialogOpen(false);
        setPreviewUrl('');
        setPreviewTitle('');
    };

    // Handle download document
    const handleDownload = (url: string, filename: string, isReSigned: boolean) => {
        if (!url) {
            setError('Document URL is not available');
            return;
        }
        let finalUrl = isReSigned ? ONLINE_API_BASE : API_BASE;
        if (filename === 'htr-form.html') {
            finalUrl = API_BASE;
        }
        try {
            const link = document.createElement('a');
            link.href = url.startsWith('http') ? url : `${finalUrl}${url}`;
            link.setAttribute('download', filename);
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error downloading document:', err);
            setError('Failed to download document');
        }
    };

    // Handle download document
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
        } catch (err) {
            console.error('Error downloading document:', err);
            setError('Failed to download document');
        }
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

    // Handle Enter key press
    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    const documentTypeOptions = [
        { value: DocumentTypes.HTRForm, label: 'HTR Form' },
        { value: DocumentTypes.PDPNotification, label: 'PDP Notification' },
        { value: DocumentTypes.HTPConfirmation, label: 'HTP Confirmation' },
        { value: DocumentTypes.HTRMembershipTerms, label: 'HTR Membership Terms' }
    ];

    const handleOpenUploadDialog = () => {
        setUploadDialogOpen(true);
        setUploadError('');
        setUploadProgress(0);
    };

    const handleCloseUploadDialog = () => {
        if (uploading) return;
        setUploadDialogOpen(false);
        setSelectedFiles([]);
        setSelectedDocumentType('');
        setUploadError('');
        setUploadProgress(0);
    };

    const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        setSelectedFiles(files);
        setUploadError('');
    };

    const handleUploadFiles = async () => {
        if (!playerId.trim()) {
            setUploadError('Player ID is required. Please search first.');
            return;
        }

        const playerIdNum = parseInt(playerId);
        if (isNaN(playerIdNum) || playerIdNum <= 0) {
            setUploadError('Player ID is invalid. Please search again.');
            return;
        }

        if (!selectedFiles.length) {
            setUploadError('Please select at least one file.');
            return;
        }

        if (selectedDocumentType === '') {
            setUploadError('Please select a document type.');
            return;
        }

        try {
            setUploading(true);
            setUploadError('');
            setUploadProgress(0);

            for (let index = 0; index < selectedFiles.length; index += 1) {
                const file = selectedFiles[index];
                const formData = new FormData();
                formData.append('PlayerId', playerIdNum.toString());
                formData.append('ManualDocumentFile', file);
                formData.append('DocumentType', selectedDocumentType.toString());

                await renderDocumentService.uploadManualDocument(formData);
                const progress = Math.round(((index + 1) / selectedFiles.length) * 100);
                setUploadProgress(progress);
            }

            handleCloseUploadDialog();
            await handleSearch();
        } catch (err: any) {
            console.error('Upload failed:', err);
            setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                    Search and preview customer verification documents by Player ID
                </Typography>

                {/* Search Section */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            Search Documents
                        </Typography>
                        <Box display="flex" gap={2} alignItems="flex-start">
                            <TextField
                                label="Player ID"
                                type="number"
                                value={playerId}
                                onChange={(e) => {
                                    setPlayerId(e.target.value);
                                    setError('');
                                }}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter Player ID"
                                size="medium"
                                fullWidth
                                sx={{ maxWidth: 400 }}
                                error={!!error && !documentData}
                                disabled={loading}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearch();
                                    }
                                }}
                            />
                            <Button
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                                onClick={handleSearch}
                                disabled={loading || !playerId.trim()}
                                sx={{ height: '56px', minWidth: '120px' }}
                            >
                                Search
                            </Button>
                        </Box>
                        {error && !documentData && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Document Information */}
                {documentData && (
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{ color: 'primary.main' }}>
                                    Document Information
                                </Typography>
                                {documentData.isSynchronized && (
                                    <Button
                                        variant="contained"
                                        onClick={handleOpenUploadDialog}
                                    >
                                        Upload Manual Document
                                    </Button>
                                )}
                            </Box>

                            <Stack spacing={3}>
                                {/* Customer Information */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Customer Information
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={3} sx={{ mt: 1 }}>
                                        <Box flex="1 1 45%">
                                            <Typography variant="caption" color="text.secondary">
                                                Full Name
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {documentData.fullName || '-'}
                                            </Typography>
                                        </Box>
                                        <Box flex="1 1 45%">
                                            <Typography variant="caption" color="text.secondary">
                                                Identification Number
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {documentData.identificationNumber || '-'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Divider />

                                {/* Document Details */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Document Details
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={3} sx={{ mt: 1 }}>
                                        <Box flex="1 1 30%">
                                            <Typography variant="caption" color="text.secondary">
                                                Document Type
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                <Chip
                                                    label={documentData.documentType || 'N/A'}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Typography>
                                        </Box>
                                        <Box flex="1 1 30%">
                                            <Typography variant="caption" color="text.secondary">
                                                Registration Type
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                <Chip
                                                    label={documentData.registrationType === 1 ? 'Online' : 'Manual'}
                                                    color={documentData.registrationType === 1 ? 'success' : 'secondary'}
                                                    size="small"
                                                />
                                            </Typography>
                                        </Box>
                                        <Box flex="1 1 30%">
                                            <Typography variant="caption" color="text.secondary">
                                                Nationality
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                <Chip
                                                    label={documentData.isVietnamese ? 'Vietnamese' : 'Foreigner'}
                                                    color={documentData.isVietnamese ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </Typography>
                                        </Box>
                                        <Box flex="1 1 45%">
                                            <Typography variant="caption" color="text.secondary">
                                                Confirmation Date
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {formatDate(documentData.confirmationDate)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Divider />

                                {/* Document Files */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                                        Available Documents
                                    </Typography>
                                    <Stack spacing={2}>
                                        {/* Main Document */}
                                        {documentData.documentPath && (
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                    },
                                                }}
                                            >
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <DocumentIcon color="primary" sx={{ fontSize: 40 }} />
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="medium">
                                                            Main Document
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Type: {getFileType(documentData.documentPath)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box display="flex" gap={1}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => handlePreview(documentData.documentPath!, 'Main Document', documentData.isReSigned)}
                                                    >
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<DownloadIcon />}
                                                        onClick={() => handleDownload(documentData.documentPath!, 'main-document.pdf', documentData.isReSigned)}
                                                    >
                                                        Download
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        )}

                                        {/* HTR Form */}
                                        {documentData.htrFormPath && (
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                    },
                                                }}
                                            >
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <ArticleIcon color="secondary" sx={{ fontSize: 40 }} />
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="medium">
                                                            HTR ACCOUNT APPLICATION FORM
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Type: {getFileType(documentData.htrFormPath)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box display="flex" gap={1}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => handlePreview(documentData.htrFormPath!, 'HTR Form', documentData.isReSigned)}
                                                    >
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<DownloadIcon />}
                                                        onClick={() => handleDownload(documentData.htrFormPath!, 'htr-form.html', documentData.isReSigned)}
                                                    >
                                                        Download
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        )}

                                        {/* Notification Document */}
                                        {documentData.filePDPNotificationPath && (
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                    },
                                                }}
                                            >

                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <NotificationIcon color="warning" sx={{ fontSize: 40 }} />
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="medium">
                                                            PDP Notification Document
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Type: {getFileType(documentData.filePDPNotificationPath)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box display="flex" gap={1}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => handlePreview(documentData.filePDPNotificationPath!, 'Notification Document', documentData.isReSigned)}
                                                    >
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<DownloadIcon />}
                                                        onClick={() => handleDownload(documentData.filePDPNotificationPath!, 'notification.pdf', documentData.isReSigned)}
                                                    >
                                                        Download
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        )}

                                        {/* T and C Document */}
                                        {documentData.htrMembershipTCPath && (
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                    },
                                                }}
                                            >

                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <NotificationIcon color="warning" sx={{ fontSize: 40 }} />
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="medium">
                                                            HTR Membership T&C
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Type: {getFileType(documentData.htrMembershipTCPath)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box display="flex" gap={1}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => handlePreview(documentData.htrMembershipTCPath!, 'HTR Membership T&C', documentData.isReSigned)}
                                                    >
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<DownloadIcon />}
                                                        onClick={() => handleDownload(documentData.htrMembershipTCPath!, 'HTRMembershipTC.pdf', documentData.isReSigned)}
                                                    >
                                                        Download
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        )}

                                        {/* HTP Document */}
                                        {documentData.fileHTPNotificationPath && (
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                    },
                                                }}
                                            >

                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <DocumentIcon color="success" sx={{ fontSize: 40 }} />
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="medium">
                                                            HTP Customer Confirmation
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Type: {getFileType(documentData.fileHTPNotificationPath)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box display="flex" gap={1}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => handlePreview(documentData.fileHTPNotificationPath!, 'HTP Customer Confirmation', documentData.isReSigned)}
                                                    >
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<DownloadIcon />}
                                                        onClick={() => handleDownload(documentData.fileHTPNotificationPath!, 'HTRMembershipTC.pdf', documentData.isReSigned)}
                                                    >
                                                        Download
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        )}

                                        {/* No Documents */}
                                        {!documentData.documentPath && !documentData.htrFormPath && !documentData.filePDPNotificationPath && (
                                            <Alert severity="info">
                                                No documents available for this Player ID
                                            </Alert>
                                        )}
                                    </Stack>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                )
                }

                {/* Upload Manual Document Dialog */}
                <Dialog
                    open={uploadDialogOpen}
                    onClose={handleCloseUploadDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Upload Manual Document</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2}>
                            <Button
                                variant="outlined"
                                component="label"
                                disabled={uploading}
                            >
                                Select Files
                                <input
                                    type="file"
                                    multiple
                                    hidden
                                    onChange={handleFileSelection}
                                />
                            </Button>

                            {selectedFiles.length > 0 && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Selected files:
                                    </Typography>
                                    <Stack spacing={0.5}>
                                        {selectedFiles.map((file, index) => (
                                            <Typography key={`${file.name}-${index}`} variant="body2">
                                                {file.name}
                                            </Typography>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            <FormControl fullWidth disabled={uploading}>
                                <InputLabel id="document-type-label">Document Type</InputLabel>
                                <Select
                                    labelId="document-type-label"
                                    label="Document Type"
                                    value={selectedDocumentType}
                                    onChange={(event) => {
                                        setSelectedDocumentType(event.target.value as number);
                                        setUploadError('');
                                    }}
                                >
                                    {documentTypeOptions.map((option) => {
                                        if (documentData?.isVietnamese) {
                                            return (
                                                <MenuItem key={option.value} value={option.value} disabled={option.value === 2}>
                                                    {option.label}
                                                </MenuItem>
                                            );
                                        } else {
                                            return (
                                                <MenuItem key={option.value} value={option.value} disabled={option.value === 3}>
                                                    {option.label}
                                                </MenuItem>
                                            );
                                        }

                                    })}
                                </Select>
                            </FormControl>

                            {uploading && (
                                <Box>
                                    <LinearProgress variant="determinate" value={uploadProgress} />
                                    <Typography variant="caption" color="text.secondary">
                                        Uploading... {uploadProgress}%
                                    </Typography>
                                </Box>
                            )}

                            {uploadError && (
                                <Alert severity="error">
                                    {uploadError}
                                </Alert>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseUploadDialog} disabled={uploading}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleUploadFiles}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </DialogActions>
                </Dialog>

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
                                    <img
                                        src={previewUrl}
                                        alt="Document"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '80vh',
                                            objectFit: 'contain'
                                        }}
                                    />
                                );
                            } else if (fileType === 'PDF') {
                                return (
                                    <iframe
                                        src={previewUrl}
                                        title="PDF Viewer"
                                        style={{
                                            width: '100%',
                                            height: '80vh',
                                            border: 'none'
                                        }}
                                    />
                                );
                            } else if (fileType === 'Word' || fileType === 'Excel') {
                                // Use Google Docs Viewer for Office files
                                // const viewerUrl = `https://docs.google.com/gview?url=${(selectedImage)}&embedded=true`;
                                // return (
                                //     <iframe
                                //         src={viewerUrl}
                                //         title="Document Viewer"
                                //         style={{
                                //             width: '100%',
                                //             height: '80vh',
                                //             border: 'none'
                                //         }}
                                //     />
                                // );
                                return (
                                    <Box textAlign="center" p={4}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            Preview not available
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            This file type is {fileType} cannot be previewed in the browser. <br />
                                            You can download the file to view it.
                                        </Typography>
                                        {/* <Button
                                            variant="contained"
                                            startIcon={<DownloadIcon />}
                                            onClick={() => {
                                                const urlParts = previewUrl.split('/');
                                                const fileName = urlParts[urlParts.length - 1];
                                                handleDownload(previewUrl, fileName);
                                            }}
                                        >
                                            Download File
                                        </Button> */}
                                    </Box>
                                );
                            } else {
                                return (
                                    <iframe
                                        src={previewUrl}
                                        title="PDF Viewer"
                                        style={{
                                            width: '100%',
                                            height: '80vh',
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
                                handleViewDownload(previewUrl, `${previewTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
                            }}
                        >
                            Download
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box >
        </AdminLayout >
    );
};

export default AdminCustomerConfirmationPage;
