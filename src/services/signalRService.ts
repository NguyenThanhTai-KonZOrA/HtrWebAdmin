import * as signalR from '@microsoft/signalr';
import type { ChangeQueueStatusResponse, TicketResponse } from '../type';
import type { PatronResponse } from '../registrationType';

// Message types for SignalR events
export interface SignatureCompletedMessage {
    patronId: number;
    sessionId: string;
    fullName: string;
    mobilePhone?: string;
}

export interface NewRegistrationMessage {
    patronId: number;
    fullName: string;
    submitType: number;
}

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private staffDeviceId: number | null = null;
    private staffDeviceName: string | null = null;
    private isInStaffGroup = false;
    private eventListeners: Map<string, ((...args: any[]) => any)[]> = new Map();

    private heartbeatInterval: number | null = null;
    private connectionHealthCheckInterval: number | null = null;
    private onlineDevicesCheckInterval: number | null = null;
    private verificationInterval: number | null = null; // Periodic verification interval
    
    // Callback for when connection fails and needs retry from UI
    private onConnectionLostCallback: (() => void) | null = null;

    // Set URL SignalR Hub for patron signature
    private hubUrl = (window as any)._env_?.API_BASE + '/patronSignatureHub';

    // Initialize connection
    public async startConnection(staffDeviceId?: number, staffDeviceName?: string): Promise<void> {
        console.log('🚀 Starting SignalR connection with staffDeviceId:', staffDeviceId, 'deviceName:', staffDeviceName);
        
        // Store staffDeviceId and deviceName for later use
        this.staffDeviceId = staffDeviceId || null;
        this.staffDeviceName = staffDeviceName || null;
        
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            console.log('⚠️ SignalR already connected');
            
            // If we have a new staffDeviceId and it's different, update it
            if (staffDeviceId && staffDeviceId !== this.staffDeviceId) {
                console.log('🔄 Updating existing connection staffDeviceId from', this.staffDeviceId, 'to', staffDeviceId);
                this.staffDeviceId = staffDeviceId;
                this.staffDeviceName = staffDeviceName || null;
                await this.registerStaffDevice();
            } else {
                console.log('✅ Already connected with staffDeviceId:', this.staffDeviceId);
            }
            return;
        }

        try {
            // Build connection URL with query params for device type and name
            const deviceNameParam = staffDeviceName ? `&deviceName=${encodeURIComponent(staffDeviceName)}` : '';
            const connectionUrl = `${this.hubUrl}?deviceType=staff${deviceNameParam}`;
            
            console.log('🔗 Connecting to:', connectionUrl);

            // Create connection
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(connectionUrl, {
                    skipNegotiation: false,
                    transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
                    timeout: 30000,
                    accessTokenFactory: () => {
                        const token = localStorage.getItem('token');
                        return token || '';
                    }
                })
                .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry with backoff (same as JS code)
                .configureLogging(signalR.LogLevel.Information) // Information level for better debugging
                .build();

            // Setup event handlers
            this.setupEventHandlers();

            // Start connection
            await this.connection.start();
            console.log('✅ SignalR connection established');
            console.log('🔌 Connection ID:', this.connection.connectionId);
            console.log('📱 Current staffDeviceId:', this.staffDeviceId);
            console.log('💻 Current staffDeviceName:', this.staffDeviceName);

            // Register staff device if staffDeviceId is available
            if (this.staffDeviceId && this.staffDeviceName) {
                console.log('📝 Registering staff device with ID:', this.staffDeviceId, 'Name:', this.staffDeviceName);
                await this.registerStaffDevice();
            } else {
                console.log('🤔 No staffDeviceId or deviceName available, skipping device registration');
            }

            // Start connection health monitoring
            this.startConnectionHealthCheck();
            this.startHeartbeat();
            this.startOnlineDevicesCheck();
            this.startListenerVerification(); // Start periodic listener verification

            // ✅ CRITICAL: Register all stored event listeners after connection is established
            this.registerStoredEventListeners();

        } catch (error) {
            console.warn('⚠️ SignalR connection failed, continuing without it:', error);
            // Don't throw error - let app continue without SignalR
            this.connection = null;
            
            // Retry after 5 seconds (same as JS code)
            setTimeout(() => {
                console.log('🔄 Retrying SignalR connection after 5 seconds...');
                this.startConnection(this.staffDeviceId || undefined, this.staffDeviceName || undefined);
            }, 5000);
        }
    }

    // Setup event handlers for the connection
    private setupEventHandlers(): void {
        if (!this.connection) return;

        // Handle reconnect
        this.connection.onreconnecting((error) => {
            console.warn('⚠️ SignalR reconnecting...', error);
        });

        this.connection.onreconnected((connectionId) => {
            console.log('✅ SignalR reconnected:', connectionId);
            this.reconnectAttempts = 0;
            this.isInStaffGroup = false; // Reset group status
            
            // Re-register the staff device if available
            if (this.staffDeviceId && this.staffDeviceName) {
                console.log('🔄 Re-registering staff device after reconnection');
                this.registerStaffDevice();
            }

            // Re-register all event listeners
            this.reregisterEventListeners();
        });

        this.connection.onclose((error) => {
            console.error('❌ SignalR connection closed:', error);
            this.attemptReconnect();
        });
    }

    // Auto reconnect
    private async attemptReconnect(): Promise<void> {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('⚠️ Max SignalR reconnect attempts reached, giving up');
            this.connection = null;
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        console.log(`🔄 Reconnecting SignalR in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(async () => {
            try {
                await this.startConnection(this.staffDeviceId || undefined, this.staffDeviceName || undefined);
            } catch (error) {
                console.warn('⚠️ Reconnect attempt failed:', error);
            }
        }, delay);
    }

    // Register staff device on the server
    public async registerStaffDevice(): Promise<void> {
        console.log('� registerStaffDevice called');
        console.log('🔗 Connection:', this.connection ? 'Available' : 'NULL');
        console.log('🆔 StaffDeviceId:', this.staffDeviceId);
        console.log('💻 StaffDeviceName:', this.staffDeviceName);
        
        if (!this.connection || !this.staffDeviceId || !this.staffDeviceName) {
            console.log('ℹ️ Cannot register staff device - connection, staffDeviceId or deviceName not available');
            return;
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            console.log('ℹ️ Cannot register staff device - not connected. Current state:', this.connection.state);
            return;
        }

        try {
            console.log(`🎯 Calling server method 'RegisterStaffDevice' with Name: ${this.staffDeviceName}, ID: ${this.staffDeviceId}`);
            await this.connection.invoke('RegisterStaffDevice', this.staffDeviceName, this.staffDeviceId);
            this.isInStaffGroup = true;
            console.log(`✅ Staff Device Registered: ${this.staffDeviceName} (ID: ${this.staffDeviceId})`);
        } catch (error) {
            this.isInStaffGroup = false;
            console.error('❌ Error registering staff device:', error);
            console.error('   Error details:', {
                name: (error as any)?.name,
                message: (error as any)?.message,
                stack: (error as any)?.stack
            });
        }
    }

    // Legacy method for backward compatibility - calls registerStaffDevice
    public async joinStaffGroup(): Promise<void> {
        console.log('🔄 joinStaffGroup called (legacy) - forwarding to registerStaffDevice');
        await this.registerStaffDevice();
    }

    // Ensure staff group membership with retry mechanism
    private async ensureStaffGroupMembership(): Promise<void> {
        if (!this.staffDeviceId || !this.isConnected()) {
            return;
        }

        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries && !this.isInStaffGroup) {
            try {
                console.log(`🔄 Ensuring staff group membership (attempt ${retryCount + 1}/${maxRetries})`);
                await this.joinStaffGroup();
                
                if (this.isInStaffGroup) {
                    console.log('✅ Staff group membership confirmed');
                    break;
                }
            } catch (error) {
                console.warn(`⚠️ Failed to join staff group (attempt ${retryCount + 1}):`, error);
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            }
        }

        if (!this.isInStaffGroup) {
            console.error('❌ Failed to join staff group after all retries');
        }
    }

    // Start heartbeat to keep connection alive
    private startHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected() && this.staffDeviceId) {
                // Send heartbeat to server with staff device info
                this.connection?.invoke('SendHeartbeat', 'staff', this.staffDeviceId.toString())
                    .catch(error => {
                        console.warn('⚠️ Heartbeat failed:', error);
                        // Trigger UI callback for automatic retry when heartbeat fails
                        this.triggerConnectionLost();
                    });
            } else if (!this.isConnected()) {
                console.warn('⚠️ Heartbeat: Connection lost');
                // Trigger UI callback for automatic retry when connection lost
                this.triggerConnectionLost();
            }
        }, 30000); // Send heartbeat every 30 seconds (same as JS code)

        console.log('💓 Heartbeat started (30s interval with SendHeartbeat)');
    }

    // Start checking online staff devices
    private startOnlineDevicesCheck(): void {
        if (this.onlineDevicesCheckInterval) {
            clearInterval(this.onlineDevicesCheckInterval);
        }

        // Import the service dynamically to avoid circular dependency
        const checkOnlineDevices = async () => {
            try {
                // Dynamic import to get the API service
                const { staffDeviceService } = await import('./registrationService');
                const onlineDevices = await staffDeviceService.getOnlineStaffDevices();
                
                console.log('📱 Online staff devices:', onlineDevices.length);
                
                // Check if current device is in the online list
                if (this.staffDeviceId) {
                    const isOnline = onlineDevices.some(device => device.id === this.staffDeviceId);
                    if (!isOnline) {
                        console.warn('⚠️ Current device not in online list - may need to re-register');
                        // Try to re-register if we're connected
                        if (this.isConnected() && this.staffDeviceName) {
                            await this.registerStaffDevice();
                        }
                    } else {
                        console.log('✅ Current device is online and active');
                    }
                }
            } catch (error) {
                console.warn('⚠️ Failed to check online devices:', error);
            }
        };

        // Check immediately on start
        checkOnlineDevices();

        // Then check every 30 seconds
        this.onlineDevicesCheckInterval = setInterval(() => {
            checkOnlineDevices();
        }, 30000); // Check every 30 seconds

        console.log('📱 Online devices check started (30s interval)');
    }

    // Start periodic listener verification
    private startListenerVerification(): void {
        if (this.verificationInterval) {
            clearInterval(this.verificationInterval);
        }

        // Verify listeners every 60 seconds to ensure they're still registered
        this.verificationInterval = setInterval(() => {
            console.log('🔍 Periodic listener verification check...');
            this.verifyAndReregisterListeners();
        }, 60000); // Check every 60 seconds

        console.log('✅ Started periodic listener verification (every 60s)');
    }

    // Start connection health check
    private startConnectionHealthCheck(): void {
        if (this.connectionHealthCheckInterval) {
            clearInterval(this.connectionHealthCheckInterval);
        }

        this.connectionHealthCheckInterval = setInterval(async () => {
            if (!this.isConnected()) {
                console.warn('⚠️ Connection health check: Not connected');
                
                // Trigger UI callback for automatic retry
                this.triggerConnectionLost();
                return;
            }

            // Check if we're still in the staff group
            if (this.staffDeviceId && !this.isInStaffGroup) {
                console.warn('⚠️ Connection health check: Not in staff group, rejoining...');
                await this.ensureStaffGroupMembership();
            }

            // Test connection with a ping
            try {
                await this.connection?.invoke('Ping');
                console.log('💚 Connection health check: OK');
            } catch (error) {
                console.error('❤️ Connection health check: Failed, attempting reconnect');
                this.isInStaffGroup = false;
                
                // Trigger UI callback for automatic retry when health check fails
                this.triggerConnectionLost();
                this.attemptReconnect();
            }
        }, 60000); // Check every 60 seconds

        console.log('🏥 Connection health check started (60s interval)');
    }

    // Re-register all event listeners after reconnection
    private reregisterEventListeners(): void {
        console.log('🔄 Re-registering event listeners after reconnect');
        this.registerStoredEventListeners();
    }

    // Register all stored event listeners (called after initial connection and reconnection)
    private registerStoredEventListeners(): void {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('⚠️ Cannot register stored event listeners - not connected');
            return;
        }

        if (this.eventListeners.size === 0) {
            console.log('ℹ️ No stored event listeners to register');
            return;
        }

        console.log(`📝 Registering ${this.eventListeners.size} stored event listener(s)...`);
        
        for (const [eventName, callbacks] of this.eventListeners.entries()) {
            // Handle special cases for SignatureCompleted with multiple case variations
            if (eventName === 'SignatureCompleted') {
                const eventNames = ['SignatureCompleted', 'signaturecompleted', 'signatureCompleted'];
                
                // Remove all variations first
                eventNames.forEach(name => {
                    try {
                        this.connection!.off(name);
                    } catch (error) {
                        console.warn(`⚠️ Error removing listener ${name}:`, error);
                    }
                });
                
                // Register for all variations
                let registeredCount = 0;
                eventNames.forEach(name => {
                    for (const callback of callbacks) {
                        try {
                            this.connection!.on(name, callback);
                            registeredCount++;
                        } catch (error) {
                            console.error(`❌ Error registering listener ${name}:`, error);
                        }
                    }
                });
                
                console.log(`✅ Registered ${registeredCount} listener(s) for SignatureCompleted (all case variations: ${eventNames.join(', ')})`);
                
                // Verify registration
                setTimeout(() => {
                    console.log(`🔍 Verifying SignatureCompleted listeners are active...`);
                }, 1000);
            } else {
                // Regular event registration
                try {
                    this.connection.off(eventName);
                    for (const callback of callbacks) {
                        this.connection.on(eventName, callback);
                    }
                    console.log(`✅ Registered ${callbacks.length} listener(s) for ${eventName}`);
                } catch (error) {
                    console.error(`❌ Error registering listener ${eventName}:`, error);
                }
            }
        }
        
        // Log final state
        console.log(`📊 Total active event listeners: ${this.eventListeners.size}`);
    }

    // Store event listener for re-registration
    private storeEventListener(eventName: string, callback: (...args: any[]) => any): void {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        
        const listeners = this.eventListeners.get(eventName)!;
        // Remove existing callback if it exists
        const existingIndex = listeners.indexOf(callback);
        if (existingIndex !== -1) {
            listeners.splice(existingIndex, 1);
        }
        // Add new callback
        listeners.push(callback);
        
        console.log(`💾 Stored callback for ${eventName} (total: ${listeners.length})`);
    }

    // Verify event listeners are registered and re-register if needed
    public verifyAndReregisterListeners(): void {
        if (!this.isConnected()) {
            console.warn('⚠️ Cannot verify listeners - not connected');
            return;
        }

        console.log('🔍 Verifying event listeners...');
        
        if (this.eventListeners.size === 0) {
            console.warn('⚠️ No event listeners stored! This might be a problem.');
            return;
        }

        // Force re-register all listeners
        this.registerStoredEventListeners();
        
        console.log('✅ Event listeners verified and re-registered');
    }

    // Register callback for when connection is lost and needs UI retry
    public onConnectionLost(callback: () => void): void {
        this.onConnectionLostCallback = callback;
        console.log('📞 Connection lost callback registered');
    }

    // Remove connection lost callback
    public offConnectionLost(): void {
        this.onConnectionLostCallback = null;
        console.log('📞 Connection lost callback removed');
    }

    // Trigger connection lost callback
    private triggerConnectionLost(): void {
        if (this.onConnectionLostCallback) {
            console.log('📞 Triggering connection lost callback to UI');
            try {
                this.onConnectionLostCallback();
            } catch (error) {
                console.error('❌ Error in connection lost callback:', error);
            }
        }
    }

    // Listen to signature completed event
    public onSignatureCompleted(callback: (message: SignatureCompletedMessage) => void): void {
        const eventNames = ['SignatureCompleted', 'signaturecompleted', 'signatureCompleted']; // Multiple case variations
        
        console.log('📝 onSignatureCompleted called - storing callback');
        
        // ALWAYS store callback first for re-registration after reconnect
        this.storeEventListener('SignatureCompleted', callback);

        // Only register immediately if connection is ready
        if (!this.connection) {
            console.warn('⚠️ SignalR connection not initialized - event listener STORED and will be registered when connected');
            return;
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('⚠️ SignalR not connected yet - event listener STORED and will be registered when connected');
            return;
        }

        // Connection is ready - register now
        console.log('✅ SignalR connected - registering event listener immediately');
        
        // Unregister all possible event name variations first
        eventNames.forEach(eventName => {
            this.connection!.off(eventName);
        });

        // Register listener for all possible event name variations
        eventNames.forEach(eventName => {
            this.connection!.on(eventName, (message: SignatureCompletedMessage) => {
                console.log(`✅ Received ${eventName} message:`, message);
                this.playNotificationSound(); // Auto play sound
                callback(message);
            });
        });

        console.log(`✅ Registered SignatureCompleted event listeners for all case variations: ${eventNames.join(', ')}`);
    }

    // Listen to new registration event
    public onNewRegistration(callback: (message: NewRegistrationMessage) => void): void {
        const eventName = 'NewRegistration';
        
        console.log('📝 onNewRegistration called - storing callback');
        
        // ALWAYS store callback first for re-registration after reconnect
        this.storeEventListener(eventName, callback);

        // Only register immediately if connection is ready
        if (!this.connection) {
            console.warn('⚠️ SignalR connection not initialized - event listener STORED and will be registered when connected');
            return;
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('⚠️ SignalR not connected yet - event listener STORED and will be registered when connected');
            return;
        }

        // Connection is ready - register now
        console.log('✅ SignalR connected - registering event listener immediately');
        
        // Unregister existing listener first
        this.connection.off(eventName);

        // Register new listener
        this.connection.on(eventName, (message: NewRegistrationMessage) => {
            console.log('🆕 Received NewRegistration message:', message);
            this.playNotificationSound(); // Auto play sound
            callback(message);
        });

        console.log(`✅ Registered ${eventName} event listener`);
    }

    // Unregister signature completed event
    public offSignatureCompleted(): void {
        if (this.connection) {
            const eventNames = ['SignatureCompleted', 'signaturecompleted', 'signatureCompleted'];
            eventNames.forEach(eventName => {
                this.connection!.off(eventName);
            });
            console.log('🔇 Unregistered SignatureCompleted event listeners (all case variations)');
        }
    }

    // Unregister new registration event
    public offNewRegistration(): void {
        if (this.connection) {
            this.connection.off('NewRegistration');
            console.log('🔇 Unregistered NewRegistration event listener');
        }
    }

    // Stop connection
    public async stopConnection(): Promise<void> {
        // Clear intervals
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        if (this.connectionHealthCheckInterval) {
            clearInterval(this.connectionHealthCheckInterval);
            this.connectionHealthCheckInterval = null;
        }

        if (this.onlineDevicesCheckInterval) {
            clearInterval(this.onlineDevicesCheckInterval);
            this.onlineDevicesCheckInterval = null;
        }

        if (this.verificationInterval) {
            clearInterval(this.verificationInterval);
            this.verificationInterval = null;
        }

        if (this.connection) {
            await this.connection.stop();
            console.log('🛑 SignalR Disconnected');
            this.connection = null;
            this.staffDeviceId = null;
            this.staffDeviceName = null;
            this.isInStaffGroup = false;
            this.eventListeners.clear();
        }
    }

    // Check connection status
    public isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    // Update staffDeviceId and device name, then register
    public async updateStaffDeviceId(staffDeviceId: number, staffDeviceName?: string): Promise<void> {
        console.log('🔄 Updating staffDeviceId from', this.staffDeviceId, 'to', staffDeviceId);
        if (staffDeviceName) {
            console.log('🔄 Updating staffDeviceName from', this.staffDeviceName, 'to', staffDeviceName);
        }
        
        this.staffDeviceId = staffDeviceId;
        if (staffDeviceName) {
            this.staffDeviceName = staffDeviceName;
        }
        this.isInStaffGroup = false; // Reset group status
        
        if (this.isConnected()) {
            console.log('🔗 Connection active, registering staff device...');
            await this.registerStaffDevice();
        } else {
            console.log('⚠️ No active connection, will register when connected');
        }
    }

    // Get connection info
    public getConnectionInfo(): any {
        if (!this.connection) {
            return {
                state: 'Disconnected',
                connectionId: null,
                baseUrl: this.hubUrl,
                staffDeviceId: this.staffDeviceId,
                staffDeviceName: this.staffDeviceName,
                isConnected: false
            };
        }

        return {
            state: this.connection.state,
            connectionId: this.connection.connectionId || null,
            baseUrl: this.hubUrl,
            staffDeviceId: this.staffDeviceId,
            staffDeviceName: this.staffDeviceName,
            isConnected: this.isConnected(),
            isInStaffGroup: this.isInStaffGroup,
            eventListenersCount: this.eventListeners.size
        };
    }

    // Play notification sound
    public playNotificationSound(): void {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(err => console.log('⚠️ Could not play notification sound:', err));
        } catch (error) {
            // Ignore sound errors
        }
    }

    // Expose service to global window for console debugging
    public exposeToConsole(): void {
        (window as any).signalRDebug = {
            service: this,
            connection: this.connection,
            isConnected: () => this.isConnected(),
            getInfo: () => this.getConnectionInfo(),
            reconnect: () => this.startConnection(),
            joinGroup: () => this.joinStaffGroup(),
            updateStaffId: (id: number) => this.updateStaffDeviceId(id),
            forceSetStaffId: (id: number) => {
                console.log('🔧 Force setting staffDeviceId to:', id);
                this.staffDeviceId = id;
                this.isInStaffGroup = false;
                if (this.isConnected()) {
                    this.ensureStaffGroupMembership();
                }
            },
            ensureGroupMembership: () => this.ensureStaffGroupMembership(),
            checkGroupStatus: () => {
                console.log('📊 Group Status:', {
                    staffDeviceId: this.staffDeviceId,
                    isInStaffGroup: this.isInStaffGroup,
                    isConnected: this.isConnected()
                });
            },
            playSound: () => this.playNotificationSound(),
            help: () => {
                console.log(`
🔧 SignalR Debug Commands:
- signalRDebug.isConnected() - Check connection status
- signalRDebug.getInfo() - Get detailed connection info
- signalRDebug.reconnect() - Force reconnection
- signalRDebug.joinGroup() - Join staff group
- signalRDebug.updateStaffId(5) - Update staff device ID and join group
- signalRDebug.forceSetStaffId(5) - Force set staff ID without validation
- signalRDebug.ensureGroupMembership() - Ensure group membership with retry
- signalRDebug.checkGroupStatus() - Check current group status
- signalRDebug.playSound() - Test notification sound
                `);
            }
        };
        console.log('🔧 SignalR Debug: Type "signalRDebug.help()" for commands');
    }
}

export const signalRService = new SignalRService();