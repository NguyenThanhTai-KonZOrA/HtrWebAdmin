import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Alert } from '@mui/material';
import CacheBuster from '../utils/cacheBuster';

interface CacheManagerProps {
    showButton?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

const CacheManager: React.FC<CacheManagerProps> = ({
    showButton = true,
    isOpen = false,
    onClose
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
    const [isClearing, setIsClearing] = useState(false);
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);

    // Update dialog state when prop changes
    useEffect(() => {
        setIsDialogOpen(isOpen);
    }, [isOpen]);

    useEffect(() => {
        // Check for updates on component mount
        if (CacheBuster.shouldClearCache()) {
            setShowUpdateNotification(true);
        }
    }, []);

    const handleClearCache = async () => {
        setIsClearing(true);
        try {
            await CacheBuster.clearAllCaches();
            setIsDialogOpen(false);
            onClose?.(); // Call parent onClose if provided
            // Force reload after clearing cache
            setTimeout(() => {
                CacheBuster.forceReload();
            }, 1000);
        } catch (error) {
            console.error('Failed to clear cache:', error);
        } finally {
            setIsClearing(false);
        }
    };

    const handleUpdateNow = async () => {
        setShowUpdateNotification(false);
        await handleClearCache();
    };

    const handleDismissUpdate = () => {
        setShowUpdateNotification(false);
        // Update cache version to prevent showing again
        localStorage.setItem('app_cache_version', CacheBuster.getCurrentVersion());
    };

    return (
        <>
            {/* Update Notification */}
            {showUpdateNotification && (
                <Alert
                    severity="info"
                    sx={{
                        position: 'fixed',
                        top: 20,
                        right: 20,
                        zIndex: 9999,
                        minWidth: 300
                    }}
                    action={
                        <Box>
                            <Button color="inherit" size="small" onClick={handleUpdateNow}>
                                Update Now
                            </Button>
                            <Button color="inherit" size="small" onClick={handleDismissUpdate}>
                                Later
                            </Button>
                        </Box>
                    }
                >
                    A new version is available! Update to get the latest features.
                </Alert>
            )}

            {/* Clear Cache Button */}
            {showButton && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setIsDialogOpen(true)}
                    sx={{ ml: 1 }}
                >
                    Clear Cache
                </Button>
            )}

            {/* Clear Cache Dialog */}
            <Dialog open={isDialogOpen} onClose={() => {
                setIsDialogOpen(false);
                onClose?.();
            }}>
                <DialogTitle>Clear Application Cache</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        This will clear all cached data and reload the application.
                        You may need to log in again.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Current version: {CacheBuster.getCurrentVersion()}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        sx={{ border: 1 }}
                        onClick={() => {
                            setIsDialogOpen(false);
                            onClose?.();
                        }}>Cancel</Button>
                    <Button
                        onClick={handleClearCache}
                        variant="contained"
                        disabled={isClearing}
                    >
                        {isClearing ? 'Clearing...' : 'Clear Cache'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CacheManager;
