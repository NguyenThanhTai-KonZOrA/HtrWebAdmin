import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Stack,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Snackbar,
    Alert,
    TablePagination,
    Badge,
    Autocomplete,
    Chip,
    Divider,
} from "@mui/material";
import { useState, useEffect } from "react";
import AdminLayout from '../layout/AdminLayout';
import { queueAdminService, membershipService, queueService, QUEUE_ACTIONS, counterService } from '../services/queueService';
import { signalRService } from '../services/signalRService';
import type { ChangeQueueStatusResponse, GetQueueStatusData, RegisterNewUserRequest, TicketsInProcessResponse, TicketResponse, CurrentCounterResponse } from '../type';
import { useSetPageTitle } from "../hooks/useSetPageTitle";
import { PAGE_TITLES } from "../constants/pageTitles";

export default function AdminCallPage() {
    const [waitingList, setWaitingList] = useState<GetQueueStatusData[]>([]);
    const [storeList, setStoreList] = useState<GetQueueStatusData[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<GetQueueStatusData | null>(null);

    useSetPageTitle(PAGE_TITLES.ADMIN_CALL);
    // New state for picked up ticket
    const [activeTicket, setActiveTicket] = useState<GetQueueStatusData | null>(null);
    const [retrieveTicket, setRetrieveTicket] = useState({
        ticketNumber: "",
        ticketId: "",
        name: "",
        statusName: ""
    });
    const [priorityTicketNumber, setPriorityTicketNumber] = useState("");
    const [selectedService, setSelectedService] = useState<number | "">("");

    // Pagination state for Waiting List
    const [waitingPage, setWaitingPage] = useState(1);
    const [waitingRowsPerPage, setWaitingRowsPerPage] = useState(10);
    const [totalWaitingRecords, setTotalWaitingRecords] = useState(0);

    // Pagination state for Stored List
    const [storedPage, setStoredPage] = useState(1);
    const [storedRowsPerPage, setStoredRowsPerPage] = useState(10);
    const [totalStoredRecords, setTotalStoredRecords] = useState(0);

    const [validationErrors, setValidationErrors] = useState({
        phone: "",
        email: ""
    });
    // Validation functions
    const validatePhone = (phone: string): string => {
        if (!phone.trim()) return "";

        // Remove all non-digit characters for validation
        const cleanPhone = phone.replace(/\D/g, '');

        // Vietnam phone number patterns:
        // Mobile: 03x, 05x, 07x, 08x, 09x (10 digits total)
        // International format: +84 followed by 9 digits
        const vnMobileRegex = /^(03|05|07|08|09)\d{8}$/;
        const vnIntlRegex = /^(\+84|84)(3|5|7|8|9)\d{8}$/;

        if (cleanPhone.length < 10) {
            return "Mobile number is invalid";
        }

        if (!vnMobileRegex.test(cleanPhone) && !vnIntlRegex.test(phone.replace(/\s/g, ''))) {
            return "Invalid Vietnamese mobile number format";
        }

        return "";
    };

    const validateEmail = (email: string): string => {
        if (!email.trim()) return "";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return "Invalid email format";
        }

        return "";
    };

    // Form states for Issue Queue Ticket
    const [formData, setFormData] = useState({
        // Membership fields
        fullName: "",
        mobile: "",
        email: "",
        others: "",
        // Buy Levy Ticket fields
        playerId: "",
        name: "",
        passport: "",
        playerName: ""
    });

    const [loading, setLoading] = useState(false);
    const [waitingLoading, setWaitingLoading] = useState(false);
    const [storedLoading, setStoredLoading] = useState(false);
    const [reloadCount, setReloadCount] = useState(0);
    const [inProcessData, setInProcessData] = useState<TicketsInProcessResponse | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
    const [isSignalRConnected, setIsSignalRConnected] = useState(false);
    const [isPollingEnabled, setIsPollingEnabled] = useState(false);
    const [pollingInterval, setPollingInterval] = useState(30); // seconds
    const [lastSignalREventTime, setLastSignalREventTime] = useState<number>(Date.now());
    const [lastDataUpdateTime, setLastDataUpdateTime] = useState<string>(new Date().toLocaleTimeString());
    const [currentCounter, setCurrentCounter] = useState<CurrentCounterResponse | null>(null);

    // Load waiting list when its pagination changes
    useEffect(() => {
        loadWaitingList();
    }, [waitingPage, waitingRowsPerPage]);

    // Load stored list when its pagination changes
    useEffect(() => {
        loadStoredList();
    }, [storedPage, storedRowsPerPage]);

    // Check tickets in process on component mount
    useEffect(() => {
        checkTicketsInProcess();
        loadCurrentCounter(); // Load current counter info
    }, []); // Only run once on mount

    // SignalR connection and event handling
    useEffect(() => {
        const startSignalRConnection = async () => {
            try {
                await signalRService.startConnection();

                // Setup event listener for queue status changes
                const handleQueueStatusChanged = (data: ChangeQueueStatusResponse) => {
                    // Update last event time to indicate SignalR is working
                    setLastSignalREventTime(Date.now());

                    // If polling was enabled due to lack of SignalR events, disable it
                    if (isPollingEnabled) {
                        setIsPollingEnabled(false);
                    }

                    // Show notification
                    showSnackbar(`Ticket ${data.ticketNumber} status changed to ${data.statusName}`, "success");

                    // Add a small delay to ensure server has processed the change
                    setTimeout(() => {
                        loadTickets();
                        checkTicketsInProcess();
                    }, 500);
                };

                // Register the event listener
                signalRService.onQueueStatusChanged(handleQueueStatusChanged);

                // Setup event listener for new ticket registrations
                const handleRegistrationChanged = (data: TicketResponse) => {
                    // Update last event time to indicate SignalR is working
                    setLastSignalREventTime(Date.now());

                    // If polling was enabled due to lack of SignalR events, disable it
                    if (isPollingEnabled) {
                        setIsPollingEnabled(false);
                    }

                    // Show notification
                    showSnackbar(`New ticket ${data.ticketNumber} registered for ${data.fullName}`, "success");

                    // Add a small delay to ensure server has processed the change
                    setTimeout(() => {
                        loadTickets();
                        checkTicketsInProcess();
                    }, 500);
                };

                // Register the registration event listener
                signalRService.onRegistrationChanged(handleRegistrationChanged);

                // Add debug listener for all events
                signalRService.listenToAllEvents();

                // Try to join common groups
                await signalRService.joinCommonGroups();

                // Expose debug commands to console
                signalRService.exposeToConsole();

                setIsSignalRConnected(true);
                showSnackbar("Real-time updates connected", "success");
            } catch (error) {
                console.error('Failed to start SignalR connection:', error);
                setIsSignalRConnected(false);
                showSnackbar("Failed to connect to real-time updates", "error");
            }
        };

        startSignalRConnection();

        // Check connection status periodically
        const checkConnectionInterval = setInterval(() => {
            const connected = signalRService.isConnected();
            if (connected !== isSignalRConnected) {
                setIsSignalRConnected(connected);
            }
        }, 5000); // Check every 5 seconds

        // Cleanup function
        return () => {
            clearInterval(checkConnectionInterval);
            signalRService.offQueueStatusChanged();
            signalRService.offRegistrationChanged();
            setIsSignalRConnected(false);
        };
    }, []); // Only run once on mount

    // Auto-refresh polling as backup when SignalR events don't work
    useEffect(() => {
        let pollingTimer: ReturnType<typeof setInterval> | null = null;

        if (isPollingEnabled && pollingInterval > 0) {
            pollingTimer = setInterval(() => {
                loadTickets();
                checkTicketsInProcess();
            }, pollingInterval * 1000);
        }

        return () => {
            if (pollingTimer) {
                clearInterval(pollingTimer);
            }
        };
    }, [isPollingEnabled, pollingInterval]); // Re-run when polling settings change

    // Auto-enable polling if no SignalR events received for a while
    useEffect(() => {
        const checkSignalRActivity = setInterval(() => {
            const timeSinceLastEvent = Date.now() - lastSignalREventTime;
            const fiveMinutes = 5 * 60 * 1000; // 5 minutes

            if (isSignalRConnected && timeSinceLastEvent > fiveMinutes && !isPollingEnabled) {
                setIsPollingEnabled(true);
                showSnackbar("No real-time events detected, enabled auto-refresh as backup", "error");
            }
        }, 60000); // Check every minute

        return () => {
            clearInterval(checkSignalRActivity);
        };
    }, [isSignalRConnected, lastSignalREventTime, isPollingEnabled]);

    const loadWaitingList = async () => {
        if (waitingLoading) {
            return; // Prevent duplicate calls
        }

        try {
            setWaitingLoading(true);

            // Calculate parameters for waiting list
            const waitingSkip = (waitingPage - 1) * waitingRowsPerPage;
            const waitingParams = {
                status: 1,
                take: waitingRowsPerPage,
                skip: waitingSkip,
                page: waitingPage,
                pageSize: waitingRowsPerPage
            };

            // Load waiting list (status = 1) with pagination
            const waitingResponse = await queueAdminService.getTicketsByStatus(waitingParams);

            // Use new paginated response structure
            const newWaitingList = waitingResponse.data || [];
            const newTotalWaitingRecords = waitingResponse.totalRecords || 0;

            setWaitingList(newWaitingList);
            setTotalWaitingRecords(newTotalWaitingRecords);
            setLastDataUpdateTime(new Date().toLocaleTimeString());

        } catch (error) {
            console.error("Error loading waiting list:", error);
            showSnackbar("Error loading waiting list", "error");
        } finally {
            setWaitingLoading(false);
        }
    };

    const loadStoredList = async () => {
        if (storedLoading) {
            return; // Prevent duplicate calls
        }

        try {
            setStoredLoading(true);

            // Calculate parameters for stored list
            const storedSkip = (storedPage - 1) * storedRowsPerPage;
            const storedParams = {
                status: 4,
                take: storedRowsPerPage,
                skip: storedSkip,
                page: storedPage,
                pageSize: storedRowsPerPage
            };

            // Load stored list (status = 4) with pagination  
            const storedResponse = await queueAdminService.getTicketsByStatus(storedParams);

            // Use new paginated response structure
            const newStoredList = storedResponse.data || [];
            const newTotalStoredRecords = storedResponse.totalRecords || 0;

            setStoreList(newStoredList);
            setTotalStoredRecords(newTotalStoredRecords);
            setLastDataUpdateTime(new Date().toLocaleTimeString());

        } catch (error) {
            console.error("Error loading stored list:", error);
            showSnackbar("Error loading stored list", "error");
        } finally {
            setStoredLoading(false);
        }
    };

    // Load current counter information
    const loadCurrentCounter = async () => {
        try {
            const response = await counterService.getCurrentCounter();
            setCurrentCounter(response);
        } catch (error) {
            console.error("Error loading current counter:", error);
            // Don't show error snackbar for this as it's not critical
        }
    };

    // Check and load tickets in process
    const checkTicketsInProcess = async () => {
        try {
            const response = await queueAdminService.getTicketsInprocess();
            setInProcessData(response);

            // Auto-set active ticket if conditions are met
            if (response.ticketsInProcessTotal > 0 && response.isMissingTicket && response.data?.length > 0) {
                const firstTicket = response.data[0];

                // Convert to GetQueueStatusData format
                const activeTicketData: GetQueueStatusData = {
                    ticketId: firstTicket.ticketId,
                    ticketNumber: firstTicket.ticketNumber,
                    fullName: firstTicket.fullName,
                    phone: firstTicket.phone,
                    email: firstTicket.email,
                    status: firstTicket.status,
                    statusName: firstTicket.statusName,
                    playerId: firstTicket.playerId,
                    passportNumber: firstTicket.passportNumber,
                    counterName: firstTicket.counterName,
                    ticketDate: firstTicket.ticketDate,
                    type: firstTicket.type
                };

                setActiveTicket(activeTicketData);
                showSnackbar(`Auto-picked up ticket ${firstTicket.ticketNumber} from in-process queue`, "success");
            }
            else {
                setActiveTicket(null);
            }

            return response;
        } catch (error) {
            showSnackbar("Error checking in-process tickets", "error");
            return null;
        }
    };

    // Combined load function for manual reload
    const loadTickets = async () => {
        setReloadCount(prev => prev + 1);

        try {
            await Promise.all([loadWaitingList(), loadStoredList()]);
        } catch (error) {
            console.error('loadTickets failed:', error);
        }
    };

    const showSnackbar = (message: string, severity: "success" | "error") => {
        // Ensure message is always a string
        const safeMessage = typeof message === 'string' ? message : String(message || 'Unknown error');
        setSnackbar({ open: true, message: safeMessage, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Reconnect SignalR manually
    const handleReconnectSignalR = async () => {
        try {
            await signalRService.stopConnection();
            await signalRService.startConnection();

            // Re-register event listener with the same handler
            const handleQueueStatusChanged = (data: ChangeQueueStatusResponse) => {
                showSnackbar(`Ticket ${data.ticketNumber} status changed to ${data.statusName}`, "success");
                setTimeout(() => {
                    loadTickets();
                    checkTicketsInProcess();
                }, 500);
            };

            signalRService.onQueueStatusChanged(handleQueueStatusChanged);
            setIsSignalRConnected(true);

            showSnackbar("Real-time connection restored", "success");
        } catch (error) {
            console.error('Manual reconnection failed:', error);
            setIsSignalRConnected(false);
            showSnackbar("Failed to reconnect real-time updates", "error");
        }
    };

    const updateTicketStatus = async (
        ticketId: number,
        newStatus: number,
        successMessage: string = '',
        action: number = 1,
        shouldReloadData: boolean = true
    ): Promise<ChangeQueueStatusResponse> => {
        try {
            setLoading(true);
            const result = await queueAdminService.updateTicketStatus({ ticketId, status: newStatus, action });
            if (result.isChangeSuccess) {
                // Only show success message if provided
                if (successMessage) {
                    showSnackbar(successMessage, "success");
                }

                // Only reload data if requested
                if (shouldReloadData) {
                    await loadTickets();
                }

                setSelectedTicket(null); // Clear selection
                // Clear activeTicket if it's being completed (status 5) or stored (status 4)
                if ((newStatus === 5 || newStatus === 4) && activeTicket?.ticketId === ticketId) {
                    setActiveTicket(null);
                }
                return result;
            } else {
                // Handle API error response (like "This counter is currently unavailable")
                const errorMessage = result.message || "Failed to update ticket status";
                showSnackbar(errorMessage, "error");
                return result;
            }
        } catch (error: any) {
            console.error("Error updating ticket status:", error);

            // Handle HTTP error responses (400, 500, etc.)
            let errorMessage = "Error updating ticket status";

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.response?.data?.data) {
                errorMessage = typeof error.response.data.data === 'string'
                    ? error.response.data.data
                    : (error.response.data.data?.message || JSON.stringify(error.response.data.data));
            } else if (error?.message) {
                errorMessage = error.message;
            }

            showSnackbar(errorMessage, "error");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handlePickUp = async () => {
        if (waitingList.length === 0) {
            showSnackbar("No tickets in waiting list", "error");
            return;
        }

        // Select the first ticket from waiting list
        const firstTicket = waitingList[0];

        try {
            // Change status to "In Progress" (status 2) and get the updated ticket info
            // Don't auto-reload data to prevent losing active ticket state
            const result = await updateTicketStatus(firstTicket.ticketId, 2, '', QUEUE_ACTIONS.PICKUP, false);

            if (result.isChangeSuccess) {
                // Use the ticket number from API response
                const updatedTicket = {
                    ...firstTicket,
                    ticketNumber: result.ticketNumber, // Load số từ API response
                    status: result.status,
                    statusName: result.statusName
                };

                setActiveTicket(updatedTicket);
                setSelectedTicket(updatedTicket);

                // Show success message with the number from API
                showSnackbar(`Ticket ${result.ticketNumber} picked up successfully`, "success");

                // Manually reload data after setting active ticket
                await loadTickets();
            }
            // Error messages are already handled in updateTicketStatus
        } catch (error) {
            // Only handle unexpected errors not caught by updateTicketStatus
            console.error("Unexpected error during pickup:", error);
        }
    };

    const handleDone = async () => {
        if (!activeTicket) {
            showSnackbar("No active ticket to complete", "error");
            return;
        }
        // Change status to "Completed" (status 5)
        const result = await updateTicketStatus(activeTicket.ticketId, 5, `Ticket ${activeTicket.ticketNumber} completed successfully`, QUEUE_ACTIONS.DONE);

        if (result.isChangeSuccess) {
            setActiveTicket(null); // Clear active ticket after completion

            // Check for more tickets in process after completing current one
            setTimeout(() => {
                checkTicketsInProcess();
            }, 500); // Small delay to allow status update to propagate
        }
        // Error messages are already handled in updateTicketStatus
    };

    const handleStore = async () => {
        if (!activeTicket) {
            showSnackbar("No active ticket to store", "error");
            return;
        }
        // Change status to "Stored" (status 4)
        const result = await updateTicketStatus(activeTicket.ticketId, 4, `Ticket ${activeTicket.ticketNumber} stored successfully`, QUEUE_ACTIONS.STORED);

        if (result.isChangeSuccess) {
            setActiveTicket(null);

            // Check for more tickets in process after storing current one
            setTimeout(() => {
                checkTicketsInProcess();
            }, 1000); // Small delay to allow status update to propagate
        }
        // Error messages are already handled in updateTicketStatus
    };

    const handleRetrieve = async () => {
        if (activeTicket) {
            showSnackbar("Please complete or store the current active ticket before retrieving another", "error");
            return;
        }

        if (!retrieveTicket.ticketId) {
            showSnackbar("Please select a ticket to retrieve", "error");
            return;
        }

        try {
            const ticketId = parseInt(retrieveTicket.ticketId);
            const result = await updateTicketStatus(ticketId, 2, '', QUEUE_ACTIONS.RETRIEVE, false);

            if (result.isChangeSuccess) {
                // Create active ticket from the retrieved ticket data
                const retrievedTicket: GetQueueStatusData = {
                    ticketId: result.ticketId,
                    ticketNumber: result.ticketNumber, // Use number from API response
                    fullName: result.fullName || retrieveTicket.name,
                    phone: result.phone || '',
                    email: result.email || '',
                    status: 2,
                    statusName: 'In Progress',
                    playerId: 0,
                    passportNumber: '',
                    counterName: '',
                    ticketDate: result.ticketDate,
                    type: ''
                };

                setActiveTicket(retrievedTicket);
                setRetrieveTicket({ ticketNumber: "", ticketId: "", name: "", statusName: "" });

                // Show success message with number from API response
                showSnackbar(`Ticket ${result.ticketNumber} retrieved successfully`, "success");

                // Manually reload data after setting active ticket
                await loadTickets();
            }
            // Error messages are already handled in updateTicketStatus
        } catch (error: any) {
            // Only handle unexpected errors not caught by updateTicketStatus
            console.error("Unexpected error retrieving ticket:", error);
        }
    };

    const handlePriorityPickUp = async () => {
        if (activeTicket) {
            showSnackbar("Please complete or store the current active ticket before retrieving another", "error");
            return;
        }

        if (!priorityTicketNumber) {
            showSnackbar("Please enter a ticket number", "error");
            return;
        }

        try {
            // Find the ticket by ticketNumber in waiting list or stored list
            const targetTicketNumber = parseInt(priorityTicketNumber);
            const ticketInWaiting = waitingList.find(ticket => ticket.ticketNumber === targetTicketNumber);
            const ticketInStored = storeList.find(ticket => ticket.ticketNumber === targetTicketNumber);

            const foundTicket = ticketInWaiting || ticketInStored;

            if (!foundTicket) {
                showSnackbar(`Ticket ${priorityTicketNumber} not found in waiting or stored lists`, "error");
                return;
            }

            const result = await updateTicketStatus(foundTicket.ticketId, 2, '', QUEUE_ACTIONS.PRIORITY, false);

            if (result.isChangeSuccess) {
                // Create active ticket from the found ticket data using API response
                const priorityTicket: GetQueueStatusData = {
                    ticketId: result.ticketId,
                    ticketNumber: result.ticketNumber, // Use number from API response
                    fullName: result.fullName || foundTicket.fullName,
                    phone: result.phone || foundTicket.phone,
                    email: result.email || foundTicket.email,
                    status: 2,
                    statusName: 'In Progress',
                    playerId: foundTicket.playerId,
                    passportNumber: foundTicket.passportNumber,
                    counterName: foundTicket.counterName,
                    ticketDate: result.ticketDate,
                    type: foundTicket.type
                };

                setActiveTicket(priorityTicket);
                setPriorityTicketNumber("");

                // Show success message with number from API response
                showSnackbar(`Priority ticket ${result.ticketNumber} picked up successfully`, "success");

                // Manually reload data after setting active ticket
                await loadTickets();
            }
            // Error messages are already handled in updateTicketStatus
        } catch (error: any) {
            // Only handle unexpected errors not caught by updateTicketStatus
            console.error("Unexpected error picking up priority ticket:", error);
        }
    };

    const handleTicketSelect = (ticket: GetQueueStatusData) => {
        setSelectedTicket(ticket);
    };

    // Separate handlers for pagination changes
    const handleWaitingPageChange = (_: any, newPage: number) => {
        const nextPage = newPage + 1;
        setWaitingPage(nextPage);
    };

    const handleWaitingRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setWaitingRowsPerPage(newRowsPerPage);
        setWaitingPage(1); // Reset to page 1
    };

    const handleStoredPageChange = (_: any, newPage: number) => {
        const nextPage = newPage + 1;
        setStoredPage(nextPage);
    };

    const handleStoredRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setStoredRowsPerPage(newRowsPerPage);
        setStoredPage(1); // Reset to page 1
    };

    // Helper function to check if required fields are filled
    const isFormValid = () => {
        if (selectedService === 0) { // Membership
            const hasRequiredFields = formData.fullName.trim() && formData.mobile.trim();
            const hasNoValidationErrors = !validationErrors.phone && !validateName(formData.fullName) && !validationErrors.email;
            return !!(hasRequiredFields && hasNoValidationErrors);
        } else if (selectedService === 1) { // Buy Levy Ticket
            return formData.playerId.trim() !== "";
        }
        return false;
    };

    const validateName = (name: string): string => {
        if (!name.trim()) return "";

        const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~0-9]/;

        if (specialCharsRegex.test(name)) {
            return "Name cannot contain special characters or numbers (!@#$%^&*()_+-=[]{}|;':\",./<>?`~0-9)";
        }

        return "";
    };

    const handleNameInput = (value: string): string => {
        return value.replace(/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~0-9]/g, '');
    };

    const handlePhoneInput = (value: string): string => {
        // Only allow digits
        return value.replace(/\D/g, '');
    };

    // Handle form field changes
    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!isFormValid()) {
            showSnackbar("Please fill in all required fields", "error");
            return;
        }

        try {
            setLoading(true);

            if (selectedService === 0) { // Membership
                const registerData: RegisterNewUserRequest = {
                    fullName: formData.fullName,
                    phone: formData.mobile,
                    email: formData.email,
                    device: "website/admin",
                    serviceType: 0,
                    counterId: 1,
                    passportNumber: formData.passport,
                    playerName: formData.playerName,
                    playerId: formData.playerId ? parseInt(formData.playerId) : undefined
                };

                const result = await queueService.registerNewUser(registerData);
                showSnackbar(`Ticket ${result.ticketNumber} created successfully`, "success");

                // Reset form
                setFormData({
                    fullName: "", mobile: "", email: "", others: "",
                    playerId: "", name: "", passport: "", playerName: ""
                });
                setValidationErrors({ phone: "", email: "" });
                setSelectedService("");
                await loadTickets();

            } else if (selectedService === 1) { // Buy Levy Ticket
                // First check membership
                const membershipData = {
                    playerId: parseInt(formData.playerId),
                    passportNumber: formData.passport,
                    playerName: formData.playerName
                };

                try {
                    const membershipResult = await membershipService.getmembership(membershipData);

                    if (membershipResult && membershipResult.playerId) {
                        // If membership found, register user
                        const registerData: RegisterNewUserRequest = {
                            fullName: membershipResult.fullName || formData.name,
                            phone: membershipResult.phoneNumber || "",
                            email: membershipResult.email || "",
                            counterId: 1,
                            device: "website/admin",
                            serviceType: 1, // Assuming 1 represents Buy Levy Ticket
                            playerId: parseInt(formData.playerId),
                            passportNumber: formData.passport,
                            playerName: formData.playerName
                        };

                        const result = await queueService.registerNewUser(registerData);
                        showSnackbar(`Ticket ${result.ticketNumber} created successfully`, "success");

                        // Reset form
                        setFormData({
                            fullName: "", mobile: "", email: "", others: "",
                            playerId: "", name: "", passport: "", playerName: ""
                        });
                        setValidationErrors({ phone: "", email: "" });
                        setSelectedService("");
                        await loadTickets();
                    }
                    else {
                        showSnackbar("Membership not found or invalid", "error");
                    }
                } catch (membershipError) {
                    showSnackbar("Membership not found or invalid", "error");
                }
            }
        } catch (error) {
            console.error("Error creating ticket:", error);
            showSnackbar("Error creating ticket", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 400 }}>
                            Last update: {lastDataUpdateTime}
                        </Typography>
                    </Typography>

                    {/* SignalR Connection Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label={isSignalRConnected ? 'Real-time connected' : 'Real-time disconnected'}
                            color={isSignalRConnected ? 'success' : 'error'}
                            variant="outlined"
                            size="small"
                        />

                        {/* Auto-refresh polling controls */}
                        {/* <Chip
                            label={isPollingEnabled ? `Auto-refresh ON (${pollingInterval}s)` : 'Auto-refresh OFF'}
                            color={isPollingEnabled ? 'info' : 'default'}
                            variant="outlined"
                            size="small"
                            onClick={() => setIsPollingEnabled(!isPollingEnabled)}
                            sx={{ cursor: 'pointer' }}
                        /> */}

                        {!isSignalRConnected && (
                            <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={handleReconnectSignalR}
                                sx={{ ml: 1 }}
                            >
                                Reconnect
                            </Button>
                        )}

                        {/* Debug buttons - remove in production */}
                        {/* isSignalRConnected && (
                            <>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => {
                                        console.log('🔍 SignalR Connection Info:', signalRService.getConnectionInfo());
                                        signalRService.testEvent();
                                    }}
                                    sx={{ ml: 1 }}
                                >
                                    Test SignalR
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    onClick={() => {
                                        console.log('🔄 Manual data reload triggered');
                                        loadTickets();
                                        checkTicketsInProcess();
                                    }}
                                    sx={{ ml: 1 }}
                                >
                                    Force Reload
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => {
                                        console.log('🏘️ Attempting to join SignalR groups...');
                                        signalRService.joinCommonGroups();
                                    }}
                                    sx={{ ml: 1 }}
                                >
                                    Join Groups
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={simulateSignalREvent}
                                    sx={{ ml: 1 }}
                                >
                                    Simulate Event
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    onClick={() => {
                                        console.log('🧪 Testing server methods...');
                                        signalRService.testServerMethods();
                                    }}
                                    sx={{ ml: 1 }}
                                >
                                    Test Server
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => {
                                        console.log('📤 Sending test message...');
                                        signalRService.sendTestMessage();
                                    }}
                                    sx={{ ml: 1 }}
                                >
                                    Send Test
                                </Button>
                            </>
                        {/* )} */}
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    {/* Left Panel */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        {/* Voice Alert */}
                        {/* <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    Receive Voice Alert for New Ticket
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Check this option to receive sound alert whenever a queue ticket is issued.
                                </Typography>
                                <Button variant="contained" color="primary">
                                    1
                                </Button>
                            </CardContent>
                        </Card> */}
                        {/* Waiting List */}
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Waiting List (Page {waitingPage}, Rows {waitingRowsPerPage})
                                        </Typography>
                                        <Badge
                                            badgeContent={totalWaitingRecords}
                                            color="primary"
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
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => loadTickets()}
                                        disabled={waitingLoading || storedLoading}
                                    >
                                        Reload
                                    </Button>
                                </Box>

                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Ticket Number</TableCell>
                                                <TableCell>Name</TableCell>
                                                <TableCell>PlayerId</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Phone</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {waitingList.map((row) => (
                                                <TableRow
                                                    key={row.ticketId}
                                                    hover
                                                    selected={selectedTicket?.ticketId === row.ticketId}
                                                    onClick={() => handleTicketSelect(row)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <TableCell>{row.ticketNumber}</TableCell>
                                                    <TableCell>{row.fullName}</TableCell>
                                                    <TableCell>{row.playerId === 0 ? '-' : row.playerId}</TableCell>
                                                    <TableCell>{row.type}</TableCell>
                                                    <TableCell>{row.phone}</TableCell>
                                                    <TableCell>{row.statusName}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Waiting List Pagination */}
                                <TablePagination
                                    component="div"
                                    count={totalWaitingRecords}
                                    page={waitingPage - 1}
                                    onPageChange={handleWaitingPageChange}
                                    rowsPerPage={waitingRowsPerPage}
                                    onRowsPerPageChange={handleWaitingRowsPerPageChange}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    showFirstButton
                                    showLastButton
                                />
                            </CardContent>
                        </Card>
                        {/* Store List */}
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Stored List (Page {storedPage}, Rows {storedRowsPerPage})
                                        </Typography>
                                        <Badge
                                            badgeContent={totalStoredRecords}
                                            color="warning"
                                            sx={{
                                                '& .MuiBadge-badge': {
                                                    fontSize: '0.75rem',
                                                    minWidth: '20px',
                                                    height: '20px'
                                                }
                                            }}
                                        >
                                            <Box sx={{ width: 8 }} />
                                        </Badge>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => loadTickets()}
                                        disabled={waitingLoading || storedLoading}
                                    >
                                        Reload
                                    </Button>
                                </Box>

                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Ticket Number</TableCell>
                                                <TableCell>Name</TableCell>
                                                <TableCell>PlayerId</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Phone</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {storeList.map((row) => (
                                                <TableRow
                                                    key={row.ticketId}
                                                    hover
                                                    selected={selectedTicket?.ticketId === row.ticketId}
                                                    onClick={() => handleTicketSelect(row)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <TableCell>{row.ticketNumber}</TableCell>
                                                    <TableCell>{row.fullName}</TableCell>
                                                    <TableCell>{row.playerId === 0 ? '-' : row.playerId}</TableCell>
                                                    <TableCell>{row.type}</TableCell>
                                                    <TableCell>{row.phone}</TableCell>
                                                    <TableCell>{row.statusName}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Stored List Pagination */}
                                <TablePagination
                                    component="div"
                                    count={totalStoredRecords}
                                    page={storedPage - 1}
                                    onPageChange={handleStoredPageChange}
                                    rowsPerPage={storedRowsPerPage}
                                    onRowsPerPageChange={handleStoredRowsPerPageChange}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    showFirstButton
                                    showLastButton
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Panel */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={2}>
                            {/* Action Buttons and Retrieve side by side */}
                            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', lg: 'row' } }}>
                                {/* Action Buttons */}
                                <Box sx={{ flex: 1 }}>
                                    <Card sx={{ height: '100%' }}>

                                        <CardContent>
                                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                                Actions
                                            </Typography>
                                            <Stack spacing={1}>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    fullWidth
                                                    onClick={handlePickUp}
                                                    disabled={loading || waitingList.length === 0 || activeTicket !== null}
                                                >
                                                    Pick Up
                                                </Button>

                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    fullWidth
                                                    onClick={handleDone}
                                                    disabled={loading || activeTicket === null}
                                                >
                                                    Done
                                                </Button>

                                                <Button
                                                    variant="contained"
                                                    color="warning"
                                                    fullWidth
                                                    onClick={handleStore}
                                                    disabled={loading || activeTicket === null}
                                                >
                                                    Stored
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                        <CardContent>


                                            {/* Show active ticket info - always visible */}
                                            <Card sx={{ mb: 2, backgroundColor: '#e3f2fd' }}>
                                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                                        Active Ticket
                                                        {inProcessData && (
                                                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 400 }}>
                                                                Processing ticket(s) not yet completed: {inProcessData.ticketsInProcessTotal} | Missing: {inProcessData.isMissingTicket ? 'Yes' : 'No'}
                                                            </Typography>
                                                        )}
                                                    </Typography>
                                                    <Typography fontSize={50} variant="body2" fontWeight={600} color="primary" align="center">
                                                        {activeTicket ? activeTicket.ticketNumber : '0'}
                                                    </Typography>
                                                    {activeTicket && (
                                                        <>
                                                            <Typography variant="body2">
                                                                Name: {activeTicket.fullName}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Phone: {activeTicket.phone}
                                                            </Typography>
                                                        </>
                                                    )}
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                       Current Counter: {currentCounter ? currentCounter.id : 'N/A'}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </CardContent>
                                    </Card>
                                </Box>

                                {/* Retrieve Dropdown */}
                                <Box sx={{ flex: 1 }}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                                                Retrieve Stored Ticket
                                            </Typography>

                                            {/* <FormControl fullWidth sx={{ mb: 2 }}>
                                                <InputLabel id="retrieve-label">Select Ticket</InputLabel>
                                                <Select
                                                    labelId="retrieve-label"
                                                    label="Select Ticket"
                                                    value={retrieveTicketId}
                                                    onChange={(e) => setRetrieveTicketId(e.target.value)}
                                                >
                                                    {storeList.map((option) => (
                                                        <MenuItem key={option.ticketId} value={option.ticketId.toString()}>
                                                            {option.ticketNumber} - {option.fullName} - {option.statusName}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl> */}

                                            <Autocomplete
                                                disablePortal
                                                id="retrieve-label"
                                                value={retrieveTicket.ticketId ? { label: `${retrieveTicket.ticketNumber} - ${retrieveTicket.name} - ${retrieveTicket.statusName}`, value: retrieveTicket.ticketId } : null}
                                                options={storeList.map((option) => ({ label: `${option.ticketNumber} - ${option.fullName} - ${option.statusName}`, value: option.ticketId.toString() }))}
                                                fullWidth sx={{ mb: 2 }}
                                                onChange={(_event, newValue) => setRetrieveTicket({
                                                    ...retrieveTicket, ticketId: newValue?.value || '',
                                                    ticketNumber: newValue ? newValue.label.split(' - ')[0] : '',
                                                    name: newValue ? newValue.label.split(' - ')[1] : '',
                                                    statusName: newValue ? newValue.label.split(' - ')[2] : ''
                                                })}
                                                renderInput={(params) => <TextField {...params}
                                                    label="Select Ticket" />}
                                                getOptionLabel={(option) => option.label} // Specifies how to display the option's label
                                                isOptionEqualToValue={(option, value) => option.value === value.value} // Determines if two options are equal
                                            />

                                            <Button
                                                variant="contained"
                                                fullWidth
                                                onClick={handleRetrieve}
                                                disabled={loading || !retrieveTicket.ticketId}
                                            >
                                                Retrieve
                                            </Button>
                                        </CardContent>
                                        <CardContent>
                                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                                                Insert Ticket for Priority Pick Up
                                            </Typography>

                                            <FormControl fullWidth sx={{ mb: 2 }}>
                                                <TextField
                                                    label="Ticket Number"
                                                    fullWidth
                                                    value={priorityTicketNumber}
                                                    onChange={(e) => setPriorityTicketNumber(e.target.value)}
                                                    type="number"
                                                />
                                            </FormControl>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                onClick={handlePriorityPickUp}
                                                disabled={loading || !priorityTicketNumber}
                                            >
                                                Priority Pick Up
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Box>
                            </Box>

                            {/* Issue Queue Ticket */}
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                        Issue Queue Ticket
                                    </Typography>

                                    <Stack spacing={2}>
                                        <FormControl fullWidth>
                                            <InputLabel id="service-label">Service Type</InputLabel>
                                            <Select
                                                labelId="service-label"
                                                label="Service Type"
                                                value={selectedService}
                                                onChange={(e) => setSelectedService(e.target.value as number)}
                                            >
                                                <MenuItem value={0}>New Membership</MenuItem>
                                                <MenuItem value={1}>Existing Membership</MenuItem>
                                            </Select>
                                        </FormControl>

                                        {/* Membership Layout */}
                                        {selectedService === 0 && (
                                            <>
                                                <TextField
                                                    label="Name"
                                                    fullWidth
                                                    required
                                                    value={formData.fullName}
                                                    error={!!validateName(formData.fullName)}
                                                    helperText={validateName(formData.fullName)}
                                                    onChange={e => {
                                                        const value = handleNameInput(e.target.value);
                                                        handleFormChange('fullName', value);
                                                    }}
                                                />
                                                <TextField
                                                    label="Mobile Number"
                                                    fullWidth
                                                    required
                                                    value={formData.mobile}
                                                    error={!!validationErrors.phone}
                                                    helperText={validationErrors.phone}
                                                    onChange={e => {
                                                        const value = handlePhoneInput(e.target.value);
                                                        handleFormChange('mobile', value);
                                                        setValidationErrors(prev => ({
                                                            ...prev,
                                                            phone: validatePhone(value)
                                                        }));
                                                    }}
                                                />
                                                <TextField
                                                    label="Email"
                                                    fullWidth
                                                    //required
                                                    value={formData.email}
                                                    error={!!validationErrors.email}
                                                    helperText={validationErrors.email}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        handleFormChange('email', value);
                                                        setValidationErrors(prev => ({
                                                            ...prev,
                                                            email: validateEmail(value)
                                                        }));
                                                    }}
                                                />
                                            </>
                                        )}

                                        {/* Buy Levy Ticket Layout */}
                                        {selectedService === 1 && (
                                            <>
                                                <TextField
                                                    label="Player ID"
                                                    fullWidth
                                                    required
                                                    value={formData.playerId}
                                                    onChange={(e) => {
                                                        const value = handlePhoneInput(e.target.value);
                                                        handleFormChange('playerId', value);
                                                    }}
                                                />
                                                {/* <TextField
                                                    label="Name"
                                                    fullWidth
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                                /> */}
                                                <TextField
                                                    label="Player Name"
                                                    fullWidth
                                                    value={formData.playerName}
                                                    error={!!validateName(formData.playerName)}
                                                    helperText={validateName(formData.playerName)}
                                                    onChange={(e) => {
                                                        const value = handleNameInput(e.target.value);
                                                        handleFormChange('playerName', value);
                                                    }}
                                                />
                                            </>
                                        )}

                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            disabled={loading || !isFormValid()}
                                            onClick={handleSubmit}
                                        >
                                            Get a Ticket
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>
                </Grid>
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
