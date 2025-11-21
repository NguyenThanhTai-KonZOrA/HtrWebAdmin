import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { signalRService } from '../services/signalRService';
import { Box, CircularProgress, Typography, LinearProgress } from '@mui/material';

interface AppLoadingContextType {
    isAppReady: boolean;
    loadingStage: string;
    progress: number;
}

const AppLoadingContext = createContext<AppLoadingContextType | undefined>(undefined);

export const AppLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token, isLoading: authLoading } = useAuth();
    const [isAppReady, setIsAppReady] = useState(false);
    const [loadingStage, setLoadingStage] = useState('Initializing...');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let mounted = true;

        const initializeApp = async () => {
            if (authLoading) {
                setLoadingStage('Checking authentication...');
                setProgress(10);
                return;
            }

            if (!token) {
                // No token, app is ready (will show login)
                setIsAppReady(true);
                return;
            }

            try {
                setLoadingStage('Preparing application...');
                setProgress(30);

                // Wait a moment to allow any pending operations
                await new Promise(resolve => setTimeout(resolve, 500));

                setLoadingStage('Initializing services...');
                setProgress(50);

                // Check if we have staffDeviceId from localStorage or any other source
                let retryCount = 0;
                const maxRetries = 3;
                
                while (retryCount < maxRetries) {
                    try {
                        setLoadingStage(`Connecting to notification service... (${retryCount + 1}/${maxRetries})`);
                        setProgress(60 + (retryCount * 10));

                        // Try to get staffDeviceId from localStorage first
                        const savedStaffDeviceId = localStorage.getItem('staffDeviceId');
                        const savedDeviceName = localStorage.getItem('staffDeviceHostName') || 'Unknown';
                        
                        if (savedStaffDeviceId) {
                            await signalRService.startConnection(parseInt(savedStaffDeviceId), savedDeviceName);
                        } else {
                            // If no saved staffDeviceId, try with a default or skip SignalR for now
                            console.log('🤔 No staffDeviceId found, skipping SignalR initialization for now');
                        }
                        
                        break; // Success, exit retry loop
                    } catch (error) {
                        retryCount++;
                        console.warn(`⚠️ SignalR connection attempt ${retryCount} failed:`, error);
                        
                        if (retryCount >= maxRetries) {
                            console.log('🚫 SignalR connection failed after max retries, continuing without it');
                            // Don't throw error, just continue without SignalR
                        } else {
                            // Wait before retry
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                }

                setLoadingStage('Finalizing...');
                setProgress(90);

                // Final delay to ensure smooth transition
                await new Promise(resolve => setTimeout(resolve, 300));

                if (mounted) {
                    setProgress(100);
                    setIsAppReady(true);
                }
            } catch (error) {
                console.error('❌ App initialization failed:', error);
                // Even if initialization fails, allow app to continue
                if (mounted) {
                    setProgress(100);
                    setIsAppReady(true);
                }
            }
        };

        initializeApp();

        return () => {
            mounted = false;
        };
    }, [token, authLoading]);

    // Reset app ready state when user logs out
    useEffect(() => {
        if (!token) {
            setIsAppReady(false);
            setLoadingStage('Initializing...');
            setProgress(0);
        }
    }, [token]);

    // If user is not logged in, app is ready (will show login)
    if (!token) {
        return <>{children}</>;
    }

    // If app is not ready yet, show loading screen
    if (!isAppReady) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    inset: 0,
                    bgcolor: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                }}
            >
                <Box
                    sx={{
                        textAlign: 'center',
                        maxWidth: 400,
                        width: '90%',
                        p: 4,
                        bgcolor: 'white',
                        borderRadius: 2,
                        boxShadow: 3,
                    }}
                >
                    <CircularProgress 
                        size={60} 
                        sx={{ mb: 3, color: 'primary.main' }}
                    />
                    
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            mb: 2, 
                            color: 'primary.main',
                            fontWeight: 600 
                        }}
                    >
                        Registration Management System
                    </Typography>
                    
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            mb: 3, 
                            color: 'text.secondary' 
                        }}
                    >
                        {loadingStage}
                    </Typography>
                    
                    <LinearProgress 
                        variant="determinate" 
                        value={progress}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                            }
                        }}
                    />
                    
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            mt: 1, 
                            display: 'block',
                            color: 'text.secondary' 
                        }}
                    >
                        {Math.round(progress)}% Complete
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <AppLoadingContext.Provider value={{ isAppReady, loadingStage, progress }}>
            {children}
        </AppLoadingContext.Provider>
    );
};

export const useAppLoading = () => {
    const context = useContext(AppLoadingContext);
    if (!context) {
        throw new Error('useAppLoading must be used within an AppLoadingProvider');
    }
    return context;
};
