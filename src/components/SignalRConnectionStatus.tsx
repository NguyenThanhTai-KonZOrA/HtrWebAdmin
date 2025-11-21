import React, { useState, useEffect } from 'react';
import { signalRService } from '../services/signalRService';

interface ConnectionStatusProps {
    className?: string;
    showDetails?: boolean;
}

export const SignalRConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
    className = '', 
    showDetails = false 
}) => {
    const [status, setStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
    const [connectionInfo, setConnectionInfo] = useState<any>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    useEffect(() => {
        // Check connection status every second
        const interval = setInterval(() => {
            const info = signalRService.getConnectionInfo();
            setConnectionInfo(info);
            setLastUpdate(new Date());

            if (info.isConnected && info.isInStaffGroup) {
                setStatus('connected');
            } else if (info.isConnected && !info.isInStaffGroup) {
                setStatus('reconnecting'); // Connected but not in group
            } else {
                setStatus('disconnected');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case 'connected':
                return 'bg-green-500';
            case 'reconnecting':
                return 'bg-yellow-500 animate-pulse';
            case 'disconnected':
                return 'bg-red-500 animate-pulse';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'connected':
                return '🟢 Connected';
            case 'reconnecting':
                return '🟡 Reconnecting...';
            case 'disconnected':
                return '🔴 Disconnected';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'connected':
                return '✅';
            case 'reconnecting':
                return '⚠️';
            case 'disconnected':
                return '❌';
        }
    };

    return (
        <div className={`signalr-connection-status ${className}`}>
            {/* Compact Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                <span className="text-sm font-medium">
                    {getStatusText()}
                </span>
                
                {showDetails && connectionInfo && (
                    <button
                        onClick={() => {
                            console.log('📊 SignalR Connection Info:', connectionInfo);
                            alert(`Connection Details:\n${JSON.stringify(connectionInfo, null, 2)}`);
                        }}
                        className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        title="Show connection details"
                    >
                        ℹ️
                    </button>
                )}
            </div>

            {/* Detailed Status Panel (if showDetails is true) */}
            {showDetails && connectionInfo && (
                <div className="mt-2 p-3 text-xs bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                            <span className="font-semibold">{getStatusIcon()} {status.toUpperCase()}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Connection ID:</span>
                            <span className="font-mono text-xs">
                                {connectionInfo.connectionId ? connectionInfo.connectionId.substring(0, 8) + '...' : 'N/A'}
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Device ID:</span>
                            <span className="font-semibold">{connectionInfo.staffDeviceId || 'Not Set'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Device Name:</span>
                            <span className="font-semibold">{connectionInfo.staffDeviceName || 'Not Set'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">In Staff Group:</span>
                            <span className="font-semibold">
                                {connectionInfo.isInStaffGroup ? '✅ Yes' : '❌ No'}
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Event Listeners:</span>
                            <span className="font-semibold">{connectionInfo.eventListenersCount || 0}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                            <span className="text-gray-500">{lastUpdate.toLocaleTimeString()}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={async () => {
                                console.log('🔄 Manual reconnection triggered');
                                await signalRService.stopConnection();
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                await signalRService.startConnection(
                                    connectionInfo.staffDeviceId,
                                    connectionInfo.staffDeviceName
                                );
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                        >
                            🔄 Reconnect
                        </button>
                        
                        <button
                            onClick={() => {
                                signalRService.verifyAndReregisterListeners();
                                alert('✅ Event listeners verified and re-registered');
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded"
                        >
                            🔍 Verify Listeners
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignalRConnectionStatus;
