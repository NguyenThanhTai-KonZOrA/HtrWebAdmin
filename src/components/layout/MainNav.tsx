import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    IconButton,
    Stack,
    Avatar,
    Tooltip,
    Typography,
    AppBar,
    Toolbar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Box,
} from '@mui/material';
import {
    Menu as MenuIcon,
    MenuOpen as MenuOpenIcon,
    Logout as LogoutIcon,
    ClearAll as ClearAllIcon,
    Wifi as WifiIcon,
    WifiOff as WifiOffIcon,
    Refresh as RefreshIcon,
    HourglassEmpty as LoadingIcon,
} from '@mui/icons-material';
import { MobileNav } from './MobileNav';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePageTitle } from "../../contexts/PageTitleContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { useAppData } from "../../contexts/AppDataContext";
import { signalRService } from "../../services/signalRService";
import CacheManager from '../CacheManager';

export function MainNav(): React.JSX.Element {
    const [openNav, setOpenNav] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showCacheManager, setShowCacheManager] = useState<boolean>(false);
    const [signalRConnected, setSignalRConnected] = useState<boolean | null>(null); // null = checking
    const [showRetryDialog, setShowRetryDialog] = useState<boolean>(false);
    const [retrying, setRetrying] = useState<boolean>(false);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { title } = usePageTitle();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { staffDevice } = useAppData();

    // Monitor SignalR connection status
    useEffect(() => {
        let checkCount = 0;
        const maxChecks = 10;
        let rapidCheckInterval: number | null = null;
        let slowMonitoringInterval: number | null = null;

        const checkConnectionStatus = () => {
            const connectionInfo = signalRService.getConnectionInfo();
            const isConnected = signalRService.isConnected();

            console.log(`🔍 MainNav checking SignalR status (attempt ${checkCount + 1}/${maxChecks}):`, {
                isConnected,
                connectionState: connectionInfo.state,
                connectionId: connectionInfo.connectionId,
                staffDeviceId: connectionInfo.staffDeviceId,
                baseUrl: connectionInfo.baseUrl
            });

            checkCount++;

            // If connected, update status and stop rapid checking
            if (isConnected) {
                console.log('✅ SignalR connected! Stopping rapid checks and switching to slow monitoring');
                setSignalRConnected(true);

                // Clear rapid checking
                if (rapidCheckInterval) {
                    clearInterval(rapidCheckInterval);
                    rapidCheckInterval = null;
                }

                // Start slow monitoring (every 30 seconds)
                if (!slowMonitoringInterval) {
                    slowMonitoringInterval = setInterval(() => {
                        const currentlyConnected = signalRService.isConnected();
                        if (!currentlyConnected && signalRConnected === true) {
                            console.log('⚠️ SignalR connection lost! Updating status');
                            setSignalRConnected(false);
                        }
                    }, 30000);
                    console.log('🐌 Started slow monitoring (30s intervals)');
                }

                return true; // Signal to stop initial rapid checking
            }

            // If we've checked many times and still not connected
            if (checkCount >= maxChecks) {
                // Check if we have staffDevice but SignalR was never initialized
                if (staffDevice?.staffDeviceId &&
                    connectionInfo.staffDeviceId === null &&
                    connectionInfo.state === 'Disconnected' &&
                    connectionInfo.connectionId === null) {
                    console.log('🔧 SignalR was never initialized despite having staffDevice, trying to init...');

                    // Try to initialize SignalR with staffDevice
                    signalRService.startConnection(staffDevice.staffDeviceId)
                        .then(() => {
                            console.log('✅ Late SignalR initialization successful');
                            setTimeout(() => {
                                const connected = signalRService.isConnected();
                                setSignalRConnected(connected);
                                if (connected && rapidCheckInterval) {
                                    clearInterval(rapidCheckInterval);
                                    rapidCheckInterval = null;
                                    console.log('🛑 Stopped rapid checks after late initialization');
                                }
                            }, 2000);
                        })
                        .catch(error => {
                            console.error('❌ Late SignalR initialization failed:', error);
                            setSignalRConnected(false);
                            if (rapidCheckInterval) {
                                clearInterval(rapidCheckInterval);
                                rapidCheckInterval = null;
                            }
                        });

                    return false; // Continue checking
                } else {
                    console.log('❌ SignalR failed to connect after multiple attempts - stopping rapid checks');
                    setSignalRConnected(false);
                    if (rapidCheckInterval) {
                        clearInterval(rapidCheckInterval);
                        rapidCheckInterval = null;
                    }
                    return true; // Stop checking
                }
            }

            // If SignalR service has been initialized (has connection object) but not connected
            if (connectionInfo.state !== 'Disconnected' || connectionInfo.connectionId !== null) {
                console.log('⏳ SignalR is initializing...');
                return false;
            }

            // Still waiting for initialization
            console.log('⌛ Waiting for SignalR initialization...');
            return false;
        };

        // Initial rapid checks every 3 seconds
        rapidCheckInterval = setInterval(() => {
            const shouldStop = checkConnectionStatus();
            if (shouldStop && rapidCheckInterval) {
                clearInterval(rapidCheckInterval);
                rapidCheckInterval = null;
                console.log('🛑 Stopped rapid SignalR checking');
            }
        }, 3000);

        // First immediate check after 5 seconds
        const initialTimer = setTimeout(() => {
            const shouldStop = checkConnectionStatus();
            if (shouldStop && rapidCheckInterval) {
                clearInterval(rapidCheckInterval);
                rapidCheckInterval = null;
                console.log('🛑 Stopped rapid SignalR checking (initial check)');
            }
        }, 5000);

        return () => {
            console.log('🧹 Cleaning up MainNav SignalR monitoring');
            clearTimeout(initialTimer);
            if (rapidCheckInterval) {
                clearInterval(rapidCheckInterval);
            }
            if (slowMonitoringInterval) {
                clearInterval(slowMonitoringInterval);
            }
        };
    }, [staffDevice?.staffDeviceId, signalRConnected]);

    // Watch for staffDevice changes (force initialize SignalR if needed)
    useEffect(() => {
        // Only run if we have staffDevice but SignalR status is still unknown/checking
        if (staffDevice?.staffDeviceId && signalRConnected === null) {
            console.log('🎯 StaffDevice loaded, checking if SignalR needs initialization...');

            const forceInitializeSignalR = async () => {
                try {
                    const connectionInfo = signalRService.getConnectionInfo();

                    // If SignalR is not initialized at all, force initialize it
                    if (connectionInfo.state === 'Disconnected' &&
                        connectionInfo.connectionId === null &&
                        connectionInfo.staffDeviceId === null) {

                        console.log('🚀 Force initializing SignalR with staffDeviceId:', staffDevice.staffDeviceId);
                        await signalRService.startConnection(staffDevice.staffDeviceId);

                        // Check status after initialization (only once)
                        setTimeout(() => {
                            const newConnectionInfo = signalRService.getConnectionInfo();
                            const isConnected = signalRService.isConnected();

                            console.log('✅ Force initialization result:', {
                                isConnected,
                                connectionState: newConnectionInfo.state,
                                connectionId: newConnectionInfo.connectionId,
                                staffDeviceId: newConnectionInfo.staffDeviceId
                            });

                            setSignalRConnected(isConnected);
                        }, 3000);

                    } else {
                        // SignalR is already initialized, just check status once
                        console.log('🔄 SignalR already initialized, checking status once...');
                        const isConnected = signalRService.isConnected();
                        setSignalRConnected(isConnected);
                    }

                } catch (error) {
                    console.error('❌ Force SignalR initialization failed:', error);
                    setSignalRConnected(false);
                }
            };

            // Only run once when staffDevice becomes available
            forceInitializeSignalR();
        }
    }, [staffDevice?.staffDeviceId]); // Removed signalRConnected dependency to prevent re-runs

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        console.log('🚪 Triggering global logout...');
        logout();
        navigate("/login");
    };

    const handleClearCache = () => {
        setShowCacheManager(true);
        handleClose();
    };

    const handleSignalRClick = () => {
        if (signalRConnected === false) {
            setShowRetryDialog(true);
        }
    };

    const handleRetryConnection = async () => {
        setRetrying(true);
        try {
            // Get staffDeviceId from context first, then fallback to localStorage
            const staffDeviceId = staffDevice?.staffDeviceId ||
                parseInt(localStorage.getItem('staffDeviceId') || '0') ||
                undefined;

            console.log('🔄 Retrying SignalR connection with staffDeviceId:', staffDeviceId);

            // Stop current connection if any
            await signalRService.stopConnection();

            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Restart connection
            await signalRService.startConnection(staffDeviceId);

            // Force check status after a short delay
            setTimeout(() => {
                const isConnected = signalRService.isConnected();
                setSignalRConnected(isConnected);
                console.log('✅ SignalR connection retry result:', isConnected ? 'Connected' : 'Failed');
            }, 2000);

            console.log('✅ SignalR connection retry completed');
            setShowRetryDialog(false);
        } catch (error) {
            console.error('❌ SignalR connection retry failed:', error);
        } finally {
            setRetrying(false);
        }
    };

    const handleRefreshPage = () => {
        window.location.reload();
    };

    return (
        <>
            <AppBar
                position="sticky"
                sx={{
                    backgroundColor: '#fafafa',
                    borderBottom: '1px solid var(--mui-palette-divider)',
                    boxShadow: 'none',
                    color: 'var(--mui-palette-text-primary)',
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: '64px',
                        px: 2,
                    }}
                >
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%'
                        }}
                    >
                        <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                            {/* Toggle Sidebar Button for Desktop */}
                            <Tooltip title={isCollapsed ? "Show Sidebar" : "Hide Sidebar"}>
                                <IconButton
                                    onClick={toggleSidebar}
                                    sx={{
                                        display: { xs: 'none', lg: 'inline-flex' },
                                        color: 'inherit',
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                                        }
                                    }}
                                >
                                    {isCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
                                </IconButton>
                            </Tooltip>

                            {/* Mobile Menu Button */}
                            <IconButton
                                onClick={() => setOpenNav(true)}
                                sx={{ display: { lg: 'none' }, color: 'inherit' }}
                            >
                                <MenuIcon />
                            </IconButton>

                            <Typography
                                variant="h5"
                                sx={{
                                    flexGrow: 1,
                                    textAlign: 'center',
                                    color: '#274549',
                                    fontWeight: 700,
                                    fontSize: '1.5rem'
                                }}
                            >
                                {title}
                            </Typography>
                        </Stack>

                        <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                            {/* SignalR Status Chip */}
                            <Tooltip
                                title={
                                    signalRConnected === null
                                        ? "Checking SignalR connection..."
                                        : signalRConnected
                                            ? "SignalR Connected - Real-time notifications active"
                                            : "SignalR Disconnected - Click to retry connection"
                                }
                            >
                                <Chip
                                    icon={
                                        signalRConnected === null
                                            ? <LoadingIcon />
                                            : signalRConnected
                                                ? <WifiIcon />
                                                : <WifiOffIcon />
                                    }
                                    label={
                                        signalRConnected === null
                                            ? "Checking..."
                                            : signalRConnected
                                                ? "Real-time connected"
                                                : "SignalR is Offline"
                                    }
                                    onClick={handleSignalRClick}
                                    size="small"
                                    sx={{
                                        cursor: signalRConnected === false ? 'pointer' : 'default',
                                        bgcolor: signalRConnected === null
                                            ? '#fff3e0'
                                            : signalRConnected
                                                ? '#e8f5e8'
                                                : '#ffebee',
                                        color: signalRConnected === null
                                            ? '#f57c00'
                                            : signalRConnected
                                                ? '#2e7d32'
                                                : '#d32f2f',
                                        border: `1px solid ${signalRConnected === null
                                            ? '#ff9800'
                                            : signalRConnected
                                                ? '#4caf50'
                                                : '#f44336'
                                            }`,
                                        '& .MuiChip-icon': {
                                            color: signalRConnected === null
                                                ? '#f57c00'
                                                : signalRConnected
                                                    ? '#2e7d32'
                                                    : '#d32f2f',
                                        },
                                        '&:hover': {
                                            bgcolor: signalRConnected === null
                                                ? '#fff3e0'
                                                : signalRConnected
                                                    ? '#e8f5e8'
                                                    : '#ffcdd2',
                                        },
                                        animation: signalRConnected === null
                                            ? 'checking 1.5s infinite'
                                            : signalRConnected
                                                ? 'none'
                                                : 'pulse 2s infinite',
                                        '@keyframes pulse': {
                                            '0%': { opacity: 1 },
                                            '50%': { opacity: 0.6 },
                                            '100%': { opacity: 1 },
                                        },
                                        '@keyframes checking': {
                                            '0%': { transform: 'rotate(0deg)' },
                                            '100%': { transform: 'rotate(360deg)' },
                                        },
                                    }}
                                />
                            </Tooltip>

                            <Tooltip title="Profile & Settings">
                                <Avatar
                                    onClick={handleClick}
                                    sx={{
                                        cursor: 'pointer',
                                        width: 40,
                                        height: 40,
                                        bgcolor: '#274549'
                                    }}
                                >
                                    Hi!
                                </Avatar>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                sx={{
                    mt: 1,
                    '& .MuiPaper-root': {
                        borderRadius: 2,
                        minWidth: 200,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    },
                }}
            >
                <MenuItem onClick={handleClearCache}>
                    <ListItemIcon>
                        <ClearAllIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Clear Cache</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Sign out</ListItemText>
                </MenuItem>
            </Menu>
            <MobileNav
                onClose={() => setOpenNav(false)}
                open={openNav}
            />

            <CacheManager
                showButton={false}
                isOpen={showCacheManager}
                onClose={() => setShowCacheManager(false)}
            />

            {/* SignalR Retry Dialog */}
            <Dialog
                open={showRetryDialog}
                onClose={() => setShowRetryDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <WifiOffIcon color="error" />
                        SignalR Connection Issue
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" paragraph>
                        The real-time notification connection has been lost. This means you may not receive
                        live updates for patron registrations and signatures.
                    </Typography>

                    <Typography variant="body2" color="text.secondary" paragraph>
                        Debug Information:
                    </Typography>

                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                        <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                            {JSON.stringify(signalRService.getConnectionInfo(), null, 2)}
                        </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                        You can try to reconnect or refresh the page to restore the connection.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        onClick={() => setShowRetryDialog(false)}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRefreshPage}
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                    >
                        Refresh Page
                    </Button>
                    <Button
                        onClick={handleRetryConnection}
                        variant="contained"
                        disabled={retrying}
                        startIcon={retrying ? <CircularProgress size={16} /> : <WifiIcon />}
                    >
                        {retrying ? 'Reconnecting...' : 'Retry Connection'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}