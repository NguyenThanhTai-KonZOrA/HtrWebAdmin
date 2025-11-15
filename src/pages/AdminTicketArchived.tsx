// src/pages/AdminTicketArchived.tsx
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
    LinearProgress,
    Alert,
    Skeleton,
    Checkbox,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar
} from "@mui/material";
import {
    Archive as ArchiveIcon,
    Refresh as RefreshIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    CheckBox as CheckBoxIcon,
    IndeterminateCheckBox as IndeterminateCheckBoxIcon
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import { ticketArchivedService } from "../services/queueService";
import type { QueueTicketCanBeArchivedResponse, ArchiveTicketRequest } from "../type";

export default function AdminTicketArchivedPage() {
    const [tickets, setTickets] = useState<QueueTicketCanBeArchivedResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [archiving, setArchiving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

    // Archive dialog states
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [remarksError, setRemarksError] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
    const showSnackbar = (message: string, severity: "success" | "error") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };
    const loadTickets = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ticketArchivedService.getArchivedTickets();
            setTickets(data);
        } catch (error) {
            console.error("Error loading tickets:", error);
            setError("Failed to load tickets data");
        } finally {
            setLoading(false);
        }
    };

    // Auto load data on component mount
    useEffect(() => {
        loadTickets();
    }, []);

    // Handle select all checkbox
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const allDates = tickets.map(ticket => ticket.date);
            setSelectedTickets(allDates);
        } else {
            setSelectedTickets([]);
        }
    };

    // Handle individual checkbox
    const handleSelectTicket = (date: string) => {
        setSelectedTickets(prev => {
            if (prev.includes(date)) {
                return prev.filter(d => d !== date);
            } else {
                return [...prev, date];
            }
        });
    };

    // Check if all tickets are selected
    const isAllSelected = tickets.length > 0 && selectedTickets.length === tickets.length;
    const isIndeterminate = selectedTickets.length > 0 && selectedTickets.length < tickets.length;

    // Handle archive button click
    const handleArchiveClick = () => {
        if (selectedTickets.length === 0) {
            setError("Please select at least one ticket to archive");
            return;
        }
        setArchiveDialogOpen(true);
        setRemarks("");
        setRemarksError("");
    };

    // Handle archive confirmation
    const handleArchiveConfirm = async () => {
        if (!remarks.trim()) {
            setRemarksError("Remarks is required");
            return;
        }

        try {
            setArchiving(true);
            setRemarksError("");

            const archiveRequest: ArchiveTicketRequest = {
                TicketDates: selectedTickets,
                Remarks: remarks.trim()
            };

            var response = await ticketArchivedService.archiveTicket(archiveRequest);

            if (response.isArchiveSuccess) {
                // Remove archived tickets from the list
                setTickets(prev => prev.filter(ticket => !selectedTickets.includes(ticket.date)));
                setSelectedTickets([]);
                setArchiveDialogOpen(false);
                setRemarks("");
                showSnackbar(`${response.totalTicketsArchived} Ticket(s) archived successfully`, "success");
                // Show success message
                setError(null);
            }
        } catch (error) {
            console.error("Error archiving tickets:", error);
            setError("Failed to archive tickets");
        } finally {
            setArchiving(false);
        }
    };

    // Handle close dialog
    const handleCloseDialog = () => {
        if (!archiving) {
            setArchiveDialogOpen(false);
            setRemarks("");
            setRemarksError("");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusColor = (waiting: number, inService: number) => {
        const total = waiting + inService;
        if (total <= 10) return "success";
        if (total <= 50) return "warning";
        return "error";
    };

    const getStatusText = (waiting: number, inService: number) => {
        const total = waiting + inService;
        if (total <= 10) return "Ready to Archive";
        if (total <= 50) return "Low Activity";
        return "High Activity";
    };

    return (
        <AdminLayout>
            <Box>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
                        Ticket Archive Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage and archive old tickets to optimize system performance
                    </Typography>

                </Box>

                {/* Action Bar */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<ArchiveIcon />}
                                    onClick={handleArchiveClick}
                                    disabled={selectedTickets.length === 0 || loading}
                                >
                                    Archive Selected ({selectedTickets.length})
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={loadTickets}
                                    disabled={loading}
                                >
                                    Refresh
                                </Button>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                                Total: {tickets.length} tickets available for archiving
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} action={
                        <IconButton size="small" onClick={loadTickets}>
                            <RefreshIcon />
                        </IconButton>
                    }>
                        {error}
                    </Alert>
                )}

                {/* Tickets Table */}
                <Card>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ width: 50 }}>
                                            <Checkbox
                                                checked={isAllSelected}
                                                indeterminate={isIndeterminate}
                                                onChange={handleSelectAll}
                                                disabled={loading || tickets.length === 0}
                                                icon={<CheckBoxOutlineBlankIcon />}
                                                checkedIcon={<CheckBoxIcon />}
                                                indeterminateIcon={<IndeterminateCheckBoxIcon />}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 120 }}>
                                            Date
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                            Total<br />Customers
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                            Total<br />Services
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                            Total<br />Counters
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                            Customers<br />Served
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                            Customers<br />Waiting
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                            Customers<br />In Service
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, borderRight: '1px solid #e0e0e0', minWidth: 100 }}>
                                            Customers<br />Stored
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, minWidth: 120 }}>
                                            Status
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        // Loading skeleton rows
                                        Array.from({ length: 5 }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Skeleton variant="rectangular" width={24} height={24} /></TableCell>
                                                <TableCell><Skeleton width="100px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="60px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="60px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="60px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="60px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="60px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="60px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="60px" /></TableCell>
                                                <TableCell align="center"><Skeleton width="100px" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : tickets.length > 0 ? (
                                        tickets.map((ticket) => (
                                            <TableRow
                                                key={ticket.date}
                                                sx={{
                                                    '&:nth-of-type(even)': { bgcolor: '#f8f9fa' },
                                                    '&:hover': { bgcolor: '#e3f2fd' },
                                                    bgcolor: selectedTickets.includes(ticket.date) ? '#e3f2fd' : undefined
                                                }}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedTickets.includes(ticket.date)}
                                                        onChange={() => handleSelectTicket(ticket.date)}
                                                        icon={<CheckBoxOutlineBlankIcon />}
                                                        checkedIcon={<CheckBoxIcon />}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0', fontWeight: 500 }}>
                                                    {formatDate(ticket.date)}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {ticket.totalCustomers}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {ticket.totalServices}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {ticket.totalCounters}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {ticket.customersServed}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {ticket.customersWaiting}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {ticket.customersInService}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {ticket.customersStored}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={getStatusText(ticket.customersWaiting, ticket.customersInService)}
                                                        color={getStatusColor(ticket.customersWaiting, ticket.customersInService)}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography color="text.secondary">
                                                    No tickets available for archiving
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                    <Typography variant="body2" align="center" color="error">
                        Important *: Only tickets with no active customers and last date can be archived.
                        <Typography variant="body2" align="center" color="error">
                            All tickets selected will be permanently removed from the active system.
                        </Typography>
                        <Typography variant="body2" align="center" color="error">
                            Please ensure that all conditions are met before archiving.
                        </Typography>
                    </Typography>
                </Card>

                {/* Archive Confirmation Dialog */}
                <Dialog
                    open={archiveDialogOpen}
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        Archive Tickets Confirmation
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            You are about to archive <strong>{selectedTickets.length}</strong> ticket(s) for the following dates:
                        </Typography>
                        <Box sx={{ mb: 3, maxHeight: 150, overflow: 'auto', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                            {selectedTickets.map(date => (
                                <Typography key={date} variant="body2" sx={{ py: 0.5 }}>
                                    • {formatDate(date)}
                                </Typography>
                            ))}
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Remarks *"
                            value={remarks}
                            onChange={(e) => {
                                setRemarks(e.target.value);
                                if (remarksError) setRemarksError("");
                            }}
                            error={!!remarksError}
                            helperText={remarksError || "Please provide a reason for archiving these tickets"}
                            disabled={archiving}
                            placeholder="Enter remarks for archiving these tickets..."
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleCloseDialog}
                            disabled={archiving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleArchiveConfirm}
                            variant="contained"
                            color="primary"
                            disabled={archiving || !remarks.trim()}
                            startIcon={archiving ? undefined : <ArchiveIcon />}
                        >
                            {archiving ? "Archiving..." : "Archive Tickets"}
                        </Button>
                    </DialogActions>
                </Dialog>
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
