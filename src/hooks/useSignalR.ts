// src/hooks/useSignalR.ts
import { useEffect, useCallback, useRef } from 'react';
import { signalRService } from '../services/signalRService';
import type { SignatureCompletedMessage, NewRegistrationMessage } from '../services/signalRService';

export const useSignalR = (staffDeviceId?: number) => {
    const isInitializedRef = useRef(false);
    const lastStaffDeviceIdRef = useRef<number | undefined>(undefined);

    // Initialize SignalR connection when staffDeviceId becomes available
    useEffect(() => {
        console.log('📱 useSignalR effect - staffDeviceId:', staffDeviceId, 'initialized:', isInitializedRef.current);

        // Don't initialize if staffDeviceId is still undefined/null
        if (!staffDeviceId) {
            console.log('⏳ Waiting for staffDeviceId to be available...');
            return;
        }

        // If already initialized with the same staffDeviceId, skip
        if (isInitializedRef.current && lastStaffDeviceIdRef.current === staffDeviceId) {
            console.log('✅ SignalR already initialized with same staffDeviceId');
            return;
        }

        // If staffDeviceId changed, update the connection
        if (isInitializedRef.current && lastStaffDeviceIdRef.current !== staffDeviceId) {
            console.log('🔄 StaffDeviceId changed from', lastStaffDeviceIdRef.current, 'to', staffDeviceId);
            lastStaffDeviceIdRef.current = staffDeviceId;
            if (signalRService.isConnected()) {
                signalRService.updateStaffDeviceId(staffDeviceId);
            }
            return;
        }
        
        console.log('🎯 Initializing SignalR with staffDeviceId:', staffDeviceId);
        isInitializedRef.current = true;
        lastStaffDeviceIdRef.current = staffDeviceId;
        
        const initializeSignalR = async () => {
            try {
                await signalRService.startConnection(staffDeviceId);
                // Expose debug commands in development
                if (import.meta.env.DEV) {
                    signalRService.exposeToConsole();
                }
            } catch (error) {
                console.error('❌ Failed to initialize SignalR:', error);
                // Reset flag to allow retry
                isInitializedRef.current = false;
                lastStaffDeviceIdRef.current = undefined;
            }
        };

        initializeSignalR();

        // Cleanup on unmount
        return () => {
            console.log('🧹 useSignalR cleanup');
            signalRService.stopConnection();
            isInitializedRef.current = false;
            lastStaffDeviceIdRef.current = undefined;
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