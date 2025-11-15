import {
    Box,
    Typography,
    Paper,
    Divider,
    Button,
    IconButton,
    CircularProgress,
    Select,
    MenuItem,
} from "@mui/material";
import { ArrowBack, Groups, Notifications, AccessTime, Refresh } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { TicketStatusResponse } from "../type.ts";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { queueService } from "../services/queueService";
import { useTranslation } from "react-i18next";
export default function TicketStatusPage() {
    const navigate = useNavigate();
    const { ticketId } = useParams<{ ticketId: string }>();
    const [ticketData, setTicketData] = useState<TicketStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { i18n } = useTranslation();
    const currentLang = i18n.language;
    const handleChangeLang = (event: any) => {
        const lang = event.target.value;
        i18n.changeLanguage(lang);
        localStorage.setItem("lang", lang);
    };
    const fetchTicketData = async (isRefresh = false) => {
        if (!ticketId) return;

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const data = await queueService.getTicketStatus(parseInt(ticketId));
            setTicketData(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching ticket data:', error);
            setError('Could not load ticket information');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    function formatDateTime(dateStr?: string) {
        if (!dateStr) return "";
        if (dateStr === "0001-01-01T00:00:00") return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    useEffect(() => {
        fetchTicketData();
    }, [ticketId]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchTicketData(true);
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [ticketId]);

    if (loading) {
        return (
            <Box
                minHeight="100vh"
                bgcolor="#f8f8f8"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
            >
                <Typography>Loading ticket information...</Typography>
            </Box>
        );
    }

    if (error || !ticketData) {
        return (
            <Box
                minHeight="100vh"
                bgcolor="#f8f8f8"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                p={2}
            >
                <Typography color="error" mb={2}>
                    {error || 'Ticket not found'}
                </Typography>
                <Button
                    onClick={() => navigate('/')}
                    variant="contained"
                    sx={{
                        bgcolor: "#274549",
                        "&:hover": { bgcolor: "#1b3335" }
                    }}
                >
                    Back to Home
                </Button>
            </Box>
        );
    }

    const { ticketNumber, peopleAhead, serviceName, issueTime, showImportant = true } = ticketData;
    return (
        <Box
            minHeight="100vh"
            bgcolor="#f8f8f8"
            display="flex"
            flexDirection="column"
            width="100vw"
            overflow="hidden"
        >
            {/* Header */}
            <Box
                bgcolor="#274549"
                color="#fff"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                px={2}
                py={1.5}
                minHeight={60}
            >
                {/* Back Button */}
                <IconButton
                    onClick={() => navigate('/')}
                    sx={{ color: '#fff' }}
                >
                    <ArrowBack />
                </IconButton>

                {/* Logo */}
                <img src="/images/TheGrandHoTram.png" alt="Logo" style={{ height: 60 }} />
                <Box position="absolute"
                    right={16}
                    display="flex"
                    alignItems="center"
                    gap={1}>
                    <Select
                        value={currentLang}
                        onChange={handleChangeLang}
                        variant="outlined"
                        size="small"
                        sx={{
                            bgcolor: "#fff",
                            color: "#274549",
                            fontWeight: 600,
                            width: 80,
                            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                        }}
                    >
                        <MenuItem value="vi">
                            <Box display="flex" alignItems="center" gap={1}>
                                <img src="../vn.png" width={18} height={14} alt="VN" />
                                <Typography>VI</Typography>
                            </Box>
                        </MenuItem>
                        <MenuItem value="en">
                            <Box display="flex" alignItems="center" gap={1}>
                                <img src="../us.png" width={18} height={14} alt="EN" />
                                <Typography>EN</Typography>
                            </Box>
                        </MenuItem>
                    </Select>
                </Box>

                {/* Refresh Button */}
                <IconButton
                    onClick={() => fetchTicketData(true)}
                    disabled={refreshing}
                    sx={{ color: '#fff' }}
                    hidden={true}
                >
                    {refreshing ? (
                        <CircularProgress size={24} sx={{ color: '#fff' }} />
                    ) : (
                        <Refresh />
                    )}
                </IconButton>
            </Box>

            {/* Content - Full width and height */}
            <Box
                flex={1}
                display="flex"
                flexDirection="column"
                p={2}
                overflow="auto"
                width="100%"
            >
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="flex-start"
                    width="100%"
                    maxWidth={400}
                    mx="auto"
                    py={2}
                >
                    {/* Ticket Number */}
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            maxWidth: 320,
                            mx: "auto",
                            mt: 4,
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={500} textAlign="center">
                            {i18n.t("YourTicketNumber")}
                        </Typography>
                        <Typography
                            variant="h3"
                            fontWeight={700}
                            color="#274549"
                            mt={1}
                            mb={1}
                            textAlign="center"
                        >
                            {ticketNumber.toString().padStart(3, "0")}
                        </Typography>
                    </Paper>

                    <Typography
                        variant="body2"
                        mt={2}
                        mb={1}
                        color="text.secondary"
                        fontWeight={500}
                    >
                        {i18n.t("KeepPageOpen")}
                    </Typography>

                    {!lastUpdated && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            mb={3}
                            display="block"
                        >
                            {/* {i18n.t("LastUpdated")}  {lastUpdated.toLocaleTimeString()} */}
                        </Typography>
                    )}

                    {/* Important Section */}
                    {!showImportant && (
                        <Paper
                            sx={{
                                bgcolor: "#fdecea",
                                color: "#b71c1c",
                                p: 2,
                                maxWidth: 350,
                                mx: "auto",
                                mb: 4,
                                textAlign: "left",
                                borderRadius: 2,
                            }}
                        >
                            <Typography fontWeight={700} mb={0.5}>
                                {i18n.t("IMPORTANT")}:
                            </Typography>
                            <Typography variant="body2" mb={1.5}>
                                {i18n.t("CompleteMembership")}
                            </Typography>
                            <Button
                                variant="text"
                                color="primary"
                                sx={{ fontWeight: 600, textTransform: "none", pl: 0 }}
                            >
                                {i18n.t("RegisterHere")}
                            </Button>
                        </Paper>
                    )}

                    {/* Info Section */}
                    <Paper
                        elevation={5}
                        square
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            maxWidth: 350,
                            mx: "auto",
                            textAlign: "left",
                            bgcolor: "#fff"
                        }}
                    >
                        {/* Number of people ahead */}
                        <Box display="flex" alignItems="center" mb={2}>
                            <Groups sx={{ color: "#274549", mr: 1 }} />
                            <Typography fontWeight={500}>{i18n.t("NumberOfPeopleAhead")}</Typography>
                            <Box flexGrow={1} />
                            <Typography
                                color={peopleAhead === 0 ? "success.main" : "error"}
                                fontWeight={600}
                                fontSize={peopleAhead === 0 ? 18 : 16}
                            >
                                {peopleAhead === 0 ? "🎉 Your turn!" : peopleAhead}
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        {/* Service */}
                        <Box mb={2}>
                            <Box display="flex" alignItems="center" mb={1}>
                                <Notifications sx={{ color: "#274549", mr: 1 }} />
                                <Typography fontWeight={500}>{i18n.t("Service")}</Typography>
                            </Box>
                            <Typography
                                variant="body2"
                                color="text.primary"
                                fontWeight={600}
                                pl={4}
                            >
                                {serviceName}
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        {/* Time issued */}
                        <Box>
                            <Box display="flex" alignItems="center" mb={1}>
                                <AccessTime sx={{ color: "#274549", mr: 1 }} />
                                <Typography fontWeight={500}>{i18n.t("TimeofTicket")}</Typography>
                            </Box>
                            <Typography fontWeight={700} pl={4}>
                                {formatDateTime(issueTime)}
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}
