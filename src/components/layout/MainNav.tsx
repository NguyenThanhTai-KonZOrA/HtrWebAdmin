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
    Palette as PaletteIcon,
} from '@mui/icons-material';
import { MobileNav } from './MobileNav';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePageTitle } from "../../contexts/PageTitleContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { useAppData } from "../../contexts/AppDataContext";
import { signalRService } from "../../services/signalRService";
import CacheManager from '../CacheManager';
import { ThemeSelector } from '../ThemeSelector';

export function MainNav(): React.JSX.Element {
    const [openNav, setOpenNav] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showCacheManager, setShowCacheManager] = useState<boolean>(false);
    const [signalRConnected, setSignalRConnected] = useState<boolean | null>(null); // null = checking
    const [isInStaffGroup, setIsInStaffGroup] = useState<boolean | null>(null); // null = checking
    const [showRetryDialog, setShowRetryDialog] = useState<boolean>(false);
    const [showGroupRetryDialog, setShowGroupRetryDialog] = useState<boolean>(false);
    const [retrying, setRetrying] = useState<boolean>(false);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { title } = usePageTitle();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { staffDevice } = useAppData();

    // Monitor SignalR connection status
    useEffect(() => {
        console.log('🔍 Setting up SignalR status monitoring...');
        
        let statusCheckInterval: number | null = null;

        // Register callback for automatic retry when SignalR detects connection lost
        const handleSignalRConnectionLost = () => {
            console.log('📞 SignalR service detected connection lost - triggering automatic retry');
            setSignalRConnected(false);
            
            // Auto retry after a short delay to avoid spam
            setTimeout(() => {
                handleRetryConnection();
            }, 2000);
        };

        signalRService.onConnectionLost(handleSignalRConnectionLost);

        // Function to check and update SignalR connection status
        const updateConnectionStatus = () => {
            const isConnected = signalRService.isConnected();
            const connectionInfo = signalRService.getConnectionInfo();
            const inGroup = connectionInfo.isInStaffGroup;
            
            console.log('🔄 Updating SignalR status:', {
                isConnected,
                currentState: signalRConnected,
                connectionState: connectionInfo.state,
                connectionId: connectionInfo.connectionId,
                staffDeviceId: connectionInfo.staffDeviceId,
                isInStaffGroup: inGroup
            });

            // Update connection state if different
            if (isConnected !== signalRConnected) {
                console.log(`🔔 SignalR status changed: ${signalRConnected} → ${isConnected}`);
                setSignalRConnected(isConnected);
            }

            // Update group status if different
            if (inGroup !== isInStaffGroup) {
                console.log(`🔔 Staff group status changed: ${isInStaffGroup} → ${inGroup}`);
                setIsInStaffGroup(inGroup);
            }
        };

        // Initial check after a short delay
        const initialTimer = setTimeout(() => {
            updateConnectionStatus();
        }, 10000);

        // Check status every 20 seconds
        statusCheckInterval = setInterval(() => {
            updateConnectionStatus();
        }, 20000);

        return () => {
            console.log('🧹 Cleaning up MainNav SignalR monitoring');
            clearTimeout(initialTimer);
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
            }
            signalRService.offConnectionLost();
        };
    }, []); // Remove dependencies to avoid re-running

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

    const handleGroupStatusClick = () => {
        if (isInStaffGroup === false) {
            setShowGroupRetryDialog(true);
        }
    };

    const handleReregisterDevice = async () => {
        if (retrying) {
            console.log('🔄 Already retrying, skipping...');
            return;
        }

        setRetrying(true);
        try {
            console.log('🔄 Manually re-registering staff device...');
            
            // Force re-register the device
            await signalRService.registerStaffDevice();

            // Check status after a short delay
            setTimeout(() => {
                const connectionInfo = signalRService.getConnectionInfo();
                setIsInStaffGroup(connectionInfo.isInStaffGroup);
                console.log('✅ Device re-registration result - isInStaffGroup:', connectionInfo.isInStaffGroup);
            }, 2000);

            console.log('✅ Device re-registration completed');
            setShowGroupRetryDialog(false);
        } catch (error) {
            console.error('❌ Device re-registration failed:', error);
        } finally {
            setRetrying(false);
        }
    };

    const handleRetryConnection = async () => {
        if (retrying) {
            console.log('🔄 Already retrying connection, skipping...');
            return;
        }
        
        setRetrying(true);
        try {
            // Get staffDeviceId from context first, then fallback to localStorage
            const staffDeviceId = staffDevice?.staffDeviceId ||
                parseInt(localStorage.getItem('staffDeviceId') || '0') ||
                undefined;

            console.log('🔄 Retrying SignalR connection with staffDeviceId:', staffDeviceId);

            // Temporarily remove callback to prevent loop during retry
            signalRService.offConnectionLost();

            // Stop current connection if any
            await signalRService.stopConnection();

            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Restart connection with device name
            const deviceName = localStorage.getItem('staffDeviceHostName') || 
                               staffDevice?.hostName || 
                               'Unknown';
            await signalRService.startConnection(staffDeviceId, deviceName);

            // Force check status after a short delay
            setTimeout(() => {
                const isConnected = signalRService.isConnected();
                setSignalRConnected(isConnected);
                console.log('✅ SignalR connection retry result:', isConnected ? 'Connected' : 'Failed');
                
                // Re-register callback after retry
                const handleSignalRConnectionLost = () => {
                    console.log('📞 SignalR service detected connection lost - triggering automatic retry');
                    if (signalRConnected !== false) {
                        setSignalRConnected(false);
                    }
                    // Auto retry after a short delay to avoid spam
                    setTimeout(() => {
                        handleRetryConnection();
                    }, 2000);
                };
                signalRService.onConnectionLost(handleSignalRConnectionLost);
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
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
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

                        <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>
                            {/* SignalR Connection Status Chip */}
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
                                                ? "Connected"
                                                : "Offline"
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
                                            ? 'checking 1.2s ease-in-out infinite'
                                            : signalRConnected
                                                ? 'none'
                                                : 'pulse 2s infinite',
                                        '@keyframes pulse': {
                                            '0%': { opacity: 1 },
                                            '50%': { opacity: 0.6 },
                                            '100%': { opacity: 1 },
                                        },
                                        '@keyframes checking': {
                                            '0%': { transform: 'scale(1)', opacity: 1 },
                                            '50%': { transform: 'scale(0.92)', opacity: 0.7 },
                                            '100%': { transform: 'scale(1)', opacity: 1 },
                                        },
                                    }}
                                />
                            </Tooltip>

                            {/* Staff Group Registration Status Chip */}
                            <Tooltip
                                title={
                                    isInStaffGroup === null
                                        ? "Checking group registration..."
                                        : isInStaffGroup
                                            ? "Device registered in staff group - Ready to receive messages"
                                            : "Device NOT in staff group - Click to re-register"
                                }
                            >
                                <Chip
                                    icon={
                                        isInStaffGroup === null
                                            ? <LoadingIcon />
                                            : isInStaffGroup
                                                ? <WifiIcon />
                                                : <WifiOffIcon />
                                    }
                                    label={
                                        isInStaffGroup === null
                                            ? "Checking..."
                                            : isInStaffGroup
                                                ? "In Group"
                                                : "Not in Group"
                                    }
                                    onClick={handleGroupStatusClick}
                                    size="small"
                                    sx={{
                                        cursor: isInStaffGroup === false ? 'pointer' : 'default',
                                        bgcolor: isInStaffGroup === null
                                            ? '#fff3e0'
                                            : isInStaffGroup
                                                ? '#e8f5e8'
                                                : '#ffebee',
                                        color: isInStaffGroup === null
                                            ? '#f57c00'
                                            : isInStaffGroup
                                                ? '#2e7d32'
                                                : '#d32f2f',
                                        border: `1px solid ${isInStaffGroup === null
                                            ? '#ff9800'
                                            : isInStaffGroup
                                                ? '#4caf50'
                                                : '#f44336'
                                            }`,
                                        '& .MuiChip-icon': {
                                            color: isInStaffGroup === null
                                                ? '#f57c00'
                                                : isInStaffGroup
                                                    ? '#2e7d32'
                                                    : '#d32f2f',
                                        },
                                        '&:hover': {
                                            bgcolor: isInStaffGroup === null
                                                ? '#fff3e0'
                                                : isInStaffGroup
                                                    ? '#e8f5e8'
                                                    : '#ffcdd2',
                                        },
                                        animation: isInStaffGroup === null
                                            ? 'checking 1.2s ease-in-out infinite'
                                            : isInStaffGroup
                                                ? 'none'
                                                : 'pulse 2s infinite',
                                        '@keyframes pulse': {
                                            '0%': { opacity: 1 },
                                            '50%': { opacity: 0.6 },
                                            '100%': { opacity: 1 },
                                        },
                                        '@keyframes checking': {
                                            '0%': { transform: 'scale(1)', opacity: 1 },
                                            '50%': { transform: 'scale(0.92)', opacity: 0.7 },
                                            '100%': { transform: 'scale(1)', opacity: 1 },
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
                                        bgcolor: 'primary.main'
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
                        minWidth: 280,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    },
                }}
            >
                <ThemeSelector onClose={handleClose} />
                <Divider />
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

            {/* SignalR Connection Retry Dialog */}
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

            {/* Staff Group Registration Retry Dialog */}
            <Dialog
                open={showGroupRetryDialog}
                onClose={() => setShowGroupRetryDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <WifiOffIcon color="error" />
                        Device Not in Staff Group
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" paragraph>
                        Your device is not currently registered in the staff group. This means you will NOT
                        receive SignatureCompleted messages from patrons.
                    </Typography>

                    <Typography variant="body2" color="text.secondary" paragraph>
                        Current Status:
                    </Typography>

                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
                        <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                            {JSON.stringify(signalRService.getConnectionInfo(), null, 2)}
                        </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                        Click "Re-register Device" to manually register this device in the staff group again.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        onClick={() => setShowGroupRetryDialog(false)}
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
                        onClick={handleReregisterDevice}
                        variant="contained"
                        disabled={retrying}
                        startIcon={retrying ? <CircularProgress size={16} /> : <WifiIcon />}
                    >
                        {retrying ? 'Re-registering...' : 'Re-register Device'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}