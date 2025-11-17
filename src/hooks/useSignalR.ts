// src/hooks/useSignalR.ts
import { useEffect, useCallback, useRef } from 'react';
import { signalRService } from '../services/signalRService';
import type { SignatureCompletedMessage, NewRegistrationMessage } from '../services/signalRService';

export const useSignalR = (staffDeviceId?: number) => {
    const staffDeviceIdRef = useRef<number | undefined>(staffDeviceId);
    const isInitializedRef = useRef(false);

    // Update ref when staffDeviceId changes
    useEffect(() => {
        staffDeviceIdRef.current = staffDeviceId;
    }, [staffDeviceId]);

    // Initialize SignalR connection only once
    useEffect(() => {
        if (isInitializedRef.current) return;
        
        console.log('🎯 useSignalR initializing with staffDeviceId:', staffDeviceId);
        isInitializedRef.current = true;
        
        const initializeSignalR = async () => {
            try {
                console.log('🔧 Initial startConnection with staffDeviceId:', staffDeviceId);
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
            console.log('🧹 useSignalR cleanup');
            signalRService.stopConnection();
        };
    }, []); // Only run once

    // Update staffDeviceId when it changes
    useEffect(() => {
        if (!isInitializedRef.current || !staffDeviceId) return;
        
        console.log('🔄 StaffDeviceId changed to:', staffDeviceId);
        if (signalRService.isConnected()) {
            signalRService.updateStaffDeviceId(staffDeviceId);
        }
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