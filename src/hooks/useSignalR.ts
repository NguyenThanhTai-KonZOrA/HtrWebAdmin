// src/hooks/useSignalR.ts
import { useEffect, useCallback } from 'react';
import { signalRService } from '../services/signalRService';
import type { ChangeQueueStatusResponse, TicketResponse } from '../type';

export const useSignalR = () => {
    // Initialize SignalR connection
    useEffect(() => {
        const initializeSignalR = async () => {
            try {
                await signalRService.startConnection();
                // Expose debug commands in development
                if (import.meta.env.DEV) {
                    signalRService.exposeToConsole();
                    signalRService.listenToAllEvents();
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
    }, []);

    // Hook for queue status changes
    const useQueueStatusChanged = useCallback((callback: (data: ChangeQueueStatusResponse) => void) => {
        useEffect(() => {
            signalRService.onQueueStatusChanged(callback);
            
            return () => {
                signalRService.offQueueStatusChanged();
            };
        }, [callback]);
    }, []);

    // Hook for registration changes (new tickets)
    const useRegistrationChanged = useCallback((callback: (data: TicketResponse) => void) => {
        useEffect(() => {
            signalRService.onRegistrationChanged(callback);
            
            return () => {
                signalRService.offRegistrationChanged();
            };
        }, [callback]);
    }, []);

    return {
        useQueueStatusChanged,
        useRegistrationChanged,
        isConnected: () => signalRService.isConnected(),
        getConnectionInfo: () => signalRService.getConnectionInfo()
    };
};