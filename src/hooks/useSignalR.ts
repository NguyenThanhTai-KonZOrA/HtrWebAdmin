// src/hooks/useSignalR.ts
import { useEffect, useCallback } from 'react';
import { signalRService } from '../services/signalRService';
import type { SignatureCompletedMessage, NewRegistrationMessage } from '../services/signalRService';

export const useSignalR = (staffDeviceId?: number) => {
    // Initialize SignalR connection
    useEffect(() => {
        const initializeSignalR = async () => {
            try {
                await signalRService.startConnection(staffDeviceId);
                // Expose debug commands in development
                if (import.meta.env.DEV) {
                    signalRService.exposeToConsole();
                }
            } catch (error) {
                console.error('Failed to initialize SignalR:', error);
            }
        };

        initializeSignalR();

        // Cleanup on unmount
        return () => {
            signalRService.stopConnection();
        };
    }, [staffDeviceId]);

    // Hook for signature completed event
    const onSignatureCompleted = useCallback((callback: (message: SignatureCompletedMessage) => void) => {
        signalRService.onSignatureCompleted(callback);
    }, []);

    // Hook for new registration event
    const onNewRegistration = useCallback((callback: (message: NewRegistrationMessage) => void) => {
        signalRService.onNewRegistration(callback);
    }, []);

    // Unregister events
    const offSignatureCompleted = useCallback(() => {
        signalRService.offSignatureCompleted();
    }, []);

    const offNewRegistration = useCallback(() => {
        signalRService.offNewRegistration();
    }, []);

    return {
        onSignatureCompleted,
        onNewRegistration,
        offSignatureCompleted,
        offNewRegistration,
        isConnected: () => signalRService.isConnected(),
        getConnectionInfo: () => signalRService.getConnectionInfo(),
        playNotificationSound: () => signalRService.playNotificationSound()
    };
};