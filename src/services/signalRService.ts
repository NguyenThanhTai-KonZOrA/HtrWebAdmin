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
    private staffDeviceId: number | null = null;
    private staffDeviceName: string | null = null;
    private isInStaffGroup = false;
    private eventListeners: Map<string, ((...args: any[]) => any)[]> = new Map();
    private registerDeviceRetryCount = 0; // Track registration retry attempts

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

            // Create connection with automatic reconnect built-in
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
                // ✅ SDK handles reconnection automatically - no need for manual retry!
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: (retryContext) => {
                        // Exponential backoff: 0s, 2s, 5s, 10s, 30s, then keep 30s
                        const delays = [0, 2000, 5000, 10000, 30000];
                        const delay = delays[Math.min(retryContext.previousRetryCount, delays.length - 1)];
                        console.log(`🔄 Auto-reconnect attempt ${retryContext.previousRetryCount + 1} in ${delay}ms...`);
                        return delay;
                    }
                })
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // Setup event handlers
            this.setupEventHandlers();

            // Start connection
            await this.connection.start();
            console.log('✅ SignalR connection established');
            console.log('🔌 Connection ID:', this.connection.connectionId);
            console.log('📱 Current staffDeviceId:', this.staffDeviceId);
            console.log('💻 Current staffDeviceName:', this.staffDeviceName);

            // ✅ STEP 1: Register all stored event listeners FIRST (before device registration)
            // This ensures listeners are ready even if device registration is delayed
            console.log('🔧 Registering stored event listeners BEFORE device registration...');
            this.registerStoredEventListeners();

            // ✅ STEP 2: Register staff device if staffDeviceId is available
            if (this.staffDeviceId && this.staffDeviceName) {
                console.log('📝 Registering staff device with ID:', this.staffDeviceId, 'Name:', this.staffDeviceName);
                await this.registerStaffDevice();
                
                // ✅ STEP 3: After successful registration, re-register listeners to ensure they're active
                console.log('🔄 Re-registering listeners after device registration...');
                this.registerStoredEventListeners();
            } else {
                console.log('🤔 No staffDeviceId or deviceName available, skipping device registration');
            }

            // Start connection health monitoring
            this.startConnectionHealthCheck();
            this.startHeartbeat();
            this.startOnlineDevicesCheck();
            this.startListenerVerification(); // Start periodic listener verification

        } catch (error) {
            console.warn('⚠️ SignalR initial connection failed:', error);
            console.log('ℹ️  SDK will automatically attempt to reconnect...');
            // SDK's withAutomaticReconnect will handle retry - no need for manual retry!
        }
    }

    // Setup event handlers for the connection
    private setupEventHandlers(): void {
        if (!this.connection) return;

        // ✅ Listen for StaffDeviceRegistered confirmation from backend
        this.connection.on('StaffDeviceRegistered', (response: any) => {
            console.log('📨 Received StaffDeviceRegistered:', response);
            
            if (response.success) {
                this.isInStaffGroup = true;
                console.log(`✅ Backend confirmed registration: ${response.message}`);
                console.log(`👥 In group: Staff_${response.staffDeviceId}`);
            } else {
                this.isInStaffGroup = false;
                console.error(`❌ Backend registration failed: ${response.message}`);
                
                // Retry registration after 5 seconds
                setTimeout(() => {
                    console.log('🔄 Retrying registration due to backend failure...');
                    this.registerStaffDevice();
                }, 5000);
            }
        });

        // ✅ Listen for HeartbeatAck from backend
        this.connection.on('HeartbeatAck', (timestamp: string) => {
            console.log('💚 Heartbeat acknowledged by server at:', timestamp);
        });

        // Handle reconnecting event (triggered by SDK automatic reconnect)
        this.connection.onreconnecting((error) => {
            console.warn('⚠️ SignalR reconnecting (handled by SDK)...', error);
            this.isInStaffGroup = false; // Reset group status during reconnection
        });

        // Handle successful reconnection (triggered by SDK automatic reconnect)
        this.connection.onreconnected(async (connectionId) => {
            console.log('✅ SignalR reconnected successfully:', connectionId);
            this.isInStaffGroup = false; // Reset group status
            
            // ✅ STEP 1: Re-register event listeners FIRST
            console.log('🔧 Re-registering event listeners after reconnection...');
            this.reregisterEventListeners();
            
            // ✅ STEP 2: Backend auto re-joins group in OnConnectedAsync, but we still call register for consistency
            if (this.staffDeviceId && this.staffDeviceName) {
                console.log('🔄 Re-registering staff device after reconnection');
                await this.registerStaffDevice();
                
                // ✅ STEP 3: Re-register listeners again after device registration
                console.log('🔄 Re-registering listeners after device registration...');
                this.reregisterEventListeners();
            }
        });

        // Handle connection close - SDK will auto-retry, we just log it
        this.connection.onclose((error) => {
            console.error('❌ SignalR connection closed:', error);
            console.log('ℹ️  SDK will automatically attempt to reconnect...');
            this.isInStaffGroup = false; // Reset group status
            
            // Notify UI about connection loss if callback is set
            if (this.onConnectionLostCallback) {
                this.onConnectionLostCallback();
            }
        });
    }

    // Register staff device on the server with aggressive retry
    public async registerStaffDevice(): Promise<void> {
        console.log('📝 registerStaffDevice called');
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

        const maxRetries = 5;
        let retryDelay = 1000; // Start with 1 second

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🎯 Calling server method 'RegisterStaffDevice' (attempt ${attempt}/${maxRetries}) with Name: ${this.staffDeviceName}, ID: ${this.staffDeviceId}`);
                
                // ✅ Call backend: RegisterStaffDevice(deviceName, staffDeviceId)
                await this.connection.invoke('RegisterStaffDevice', this.staffDeviceName, this.staffDeviceId);
                
                // ✅ Success - backend will send StaffDeviceRegistered confirmation
                this.isInStaffGroup = true;
                this.registerDeviceRetryCount = 0; // Reset retry counter on success
                console.log(`✅ Staff Device Registered Successfully: ${this.staffDeviceName} (ID: ${this.staffDeviceId})`);
                console.log(`👥 Joined group: Staff_${this.staffDeviceId}`);
                return; // Success - exit
                
            } catch (error) {
                this.isInStaffGroup = false;
                this.registerDeviceRetryCount++;
                
                console.error(`❌ Error registering staff device (attempt ${attempt}/${maxRetries}):`, error);
                console.error('   Error details:', {
                    name: (error as any)?.name,
                    message: (error as any)?.message,
                    stack: (error as any)?.stack
                });

                if (attempt < maxRetries) {
                    console.log(`⏳ Retrying in ${retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    retryDelay *= 2; // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                } else {
                    console.error(`❌ Failed to register staff device after ${maxRetries} attempts`);
                    console.log('ℹ️  Health check (30s) will retry automatically if still not in group');
                    // Health check will handle retry - no need for additional scheduled retry
                }
            }
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
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds before retry
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

        this.heartbeatInterval = setInterval(async () => {
            if (this.isConnected() && this.staffDeviceId) {
                try {
                    // ✅ Send heartbeat to backend: SendHeartbeat(deviceType, deviceId)
                    await this.connection?.invoke('SendHeartbeat', 'staff', this.staffDeviceId.toString());
                    console.log('💓 Heartbeat sent successfully');
                } catch (error) {
                    console.warn('⚠️ Heartbeat failed:', error);
                    // Check if device still registered
                    if (!this.isInStaffGroup) {
                        console.warn('⚠️ Not in group - attempting re-registration');
                        await this.registerStaffDevice();
                    }
                    // Trigger UI callback for automatic retry when heartbeat fails
                    this.triggerConnectionLost();
                }
            } else if (!this.isConnected()) {
                console.warn('⚠️ Heartbeat: Connection lost');
                // Trigger UI callback for automatic retry when connection lost
                this.triggerConnectionLost();
            }
        }, 40000); // Send heartbeat every 40 seconds

        console.log('💓 Heartbeat started (40s interval with SendHeartbeat)');
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
                
                //console.log('📱 Online staff devices:', onlineDevices.length);
                
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

        // Then check every 40 seconds
        this.onlineDevicesCheckInterval = setInterval(() => {
            checkOnlineDevices();
        }, 40000); // Check every 40 seconds

        console.log('📱 Online devices check started (40s interval)');
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

            // CRITICAL: Always verify and re-register if not in group
            if (this.staffDeviceId && this.staffDeviceName && !this.isInStaffGroup) {
                console.warn('⚠️ Connection health check: Not in staff group, RE-REGISTERING NOW...');
                await this.registerStaffDevice(); // Direct call with retry mechanism
            }

            // Test connection with a ping
            try {
                await this.connection?.invoke('Ping');
                console.log('💚 Connection health check: OK (isInStaffGroup:', this.isInStaffGroup, ')');
                
                // Additional verification: If we think we're in the group, but haven't received any messages in a while,
                // consider re-registering as a safety measure
                if (this.isInStaffGroup && this.registerDeviceRetryCount > 0) {
                    console.log('🔄 Proactive re-registration due to previous failures');
                    await this.registerStaffDevice();
                }
            } catch (error) {
                console.error('❤️ Connection health check: Ping failed');
                this.isInStaffGroup = false;
                
                // Just log - SDK will handle reconnection automatically
                console.log('ℹ️  Connection appears to be down - SDK will auto-reconnect');
                
                // Trigger UI callback to update status
                this.triggerConnectionLost();
            }
        }, 30000); // Check every 30 seconds (increased frequency)

        console.log('🏥 Connection health check started (30s interval with aggressive re-registration)');
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
            console.log('ℹ️ No stored event listeners to register yet - will register when callbacks are added');
            return;
        }

        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📝 Registering ${this.eventListeners.size} stored event listener(s)...`);
        console.log(`📡 Expected group: Staff_${this.staffDeviceId}`);
        console.log(`🔌 Connection ID: ${this.connection.connectionId}`);
        
        for (const [eventName, callbacks] of this.eventListeners.entries()) {
            try {
                // Remove existing listeners first to avoid duplicates
                this.connection.off(eventName);
                
                // Register all callbacks for this event
                for (const callback of callbacks) {
                    this.connection.on(eventName, callback);
                }
                
                console.log(`✅ Registered ${callbacks.length} listener(s) for "${eventName}"`);
            } catch (error) {
                console.error(`❌ Error registering listener "${eventName}":`, error);
            }
        }
        
        // Log final state
        console.log(`📊 Total active event listeners: ${this.eventListeners.size}`);
        console.log(`💡 Ready to receive messages from group: Staff_${this.staffDeviceId}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
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
        // ✅ Backend sends "SignatureCompleted" (PascalCase) via Group(Staff_{staffDeviceId})
        const eventName = 'SignatureCompleted';
        
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 onSignatureCompleted called - storing callback');
        console.log('   Connection state:', this.connection?.state || 'No connection');
        console.log('   StaffDeviceId:', this.staffDeviceId || 'Not set');
        console.log('   IsInStaffGroup:', this.isInStaffGroup);
        
        // ALWAYS store callback first for re-registration after reconnect
        this.storeEventListener(eventName, callback);

        // Only register immediately if connection is ready
        if (!this.connection) {
            console.warn('⚠️ SignalR connection not initialized yet');
            console.warn('   → Listener STORED and will auto-register when connection established');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
            return;
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('⚠️ SignalR not connected yet (state:', this.connection.state, ')');
            console.warn('   → Listener STORED and will auto-register when connected');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
            return;
        }

        // Connection is ready - register now
        console.log('✅ SignalR IS CONNECTED - registering listener immediately');
        console.log('   Expected group: Staff_' + this.staffDeviceId);
        console.log('   Connection ID:', this.connection.connectionId);
        
        // Unregister existing listener first to avoid duplicates
        this.connection.off(eventName);

        // Register listener for SignatureCompleted
        this.connection.on(eventName, (message: any) => {
            console.log('');
            console.log('🎉🎉🎉 ============================================');
            console.log(`✅ RECEIVED ${eventName} MESSAGE FROM BACKEND!`);
            console.log('🎉🎉🎉 ============================================');
            console.log('Message payload:', message);
            console.log('Details:');
            console.log(`   SessionId: ${message.sessionId}`);
            console.log(`   PatronId: ${message.patronId}`);
            console.log(`   Success: ${message.success}`);
            console.log(`   FullName: ${message.fullName}`);
            console.log(`   MobilePhone: ${message.mobilePhone}`);
            console.log(`   CompletedAt: ${message.completedAt}`);
            console.log('============================================');
            console.log('');
            
            // Transform backend response to frontend interface if needed
            const transformedMessage: SignatureCompletedMessage = {
                patronId: message.patronId,
                sessionId: message.sessionId.toString(),
                fullName: message.fullName,
                mobilePhone: message.mobilePhone
            };
            
            console.log('🔄 Transformed message:', transformedMessage);
            console.log('🔊 Playing notification sound...');
            this.playNotificationSound(); // Auto play sound
            
            console.log('📞 Calling user callback...');
            try {
                callback(transformedMessage);
                console.log('✅ User callback executed successfully');
            } catch (error) {
                console.error('❌ Error in user callback:', error);
            }
        });

        console.log(`✅ Registered ${eventName} event listener successfully`);
        console.log(`📡 NOW listening for messages from group: Staff_${this.staffDeviceId}`);
        console.log(`💡 Test: signalRDebug.testMessage()`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
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
            this.connection.off('SignatureCompleted');
            this.eventListeners.delete('SignatureCompleted');
            console.log('🔇 Unregistered SignatureCompleted event listener');
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
                isConnected: false,
                isInStaffGroup: false,
                eventListenersCount: this.eventListeners.size,
                expectedGroup: this.staffDeviceId ? `Staff_${this.staffDeviceId}` : null
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
            eventListenersCount: this.eventListeners.size,
            expectedGroup: this.staffDeviceId ? `Staff_${this.staffDeviceId}` : null,
            registeredListeners: Array.from(this.eventListeners.keys())
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
                const info = this.getConnectionInfo();
                console.log('📊 Group Status:', {
                    staffDeviceId: this.staffDeviceId,
                    isInStaffGroup: this.isInStaffGroup,
                    isConnected: this.isConnected(),
                    expectedGroup: info.expectedGroup,
                    eventListenersCount: this.eventListeners.size,
                    registeredListeners: Array.from(this.eventListeners.keys())
                });
            },
            testMessage: async (staffDeviceId?: number) => {
                const targetId = staffDeviceId || this.staffDeviceId;
                if (!targetId) {
                    console.error('❌ No staffDeviceId set!');
                    return;
                }
                console.log(`🧪 Testing by sending message to Staff_${targetId}...`);
                console.log('   Make sure backend has TestSendSignatureCompleted method!');
                try {
                    await this.connection?.invoke('TestSendSignatureCompleted', targetId);
                    console.log('✅ Test message sent - check if you received it above');
                } catch (error) {
                    console.error('❌ Failed to send test message:', error);
                    console.log('   Backend may not have TestSendSignatureCompleted method');
                }
            },
            playSound: () => this.playNotificationSound(),
            help: () => {
                console.log(`
🔧 SignalR Debug Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Status & Info:
  • signalRDebug.isConnected()        - Check connection status
  • signalRDebug.getInfo()              - Get detailed connection info
  • signalRDebug.checkGroupStatus()     - Check group membership status
  
🔄 Connection Management:
  • signalRDebug.reconnect()            - Force reconnection
  • signalRDebug.joinGroup()            - Join staff group
  • signalRDebug.updateStaffId(5)       - Update staff device ID
  • signalRDebug.forceSetStaffId(5)     - Force set staff ID
  
🧪 Testing & Debugging:
  • signalRDebug.testMessage()          - Send test SignatureCompleted
  • signalRDebug.testMessage(5)         - Send to specific device ID
  • signalRDebug.playSound()            - Test notification sound
  
🔍 Advanced:
  • signalRDebug.service.verifyAndReregisterListeners()
  • signalRDebug.ensureGroupMembership()
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Quick Debug:
   1. Run: signalRDebug.getInfo()
   2. Check: isInStaffGroup must be true
   3. Run: signalRDebug.testMessage()
   4. Should see: "🎉 RECEIVED SignatureCompleted MESSAGE"
                `);
            }
        };
        console.log('🔧 SignalR Debug: Type "signalRDebug.help()" for commands');
    }
}

export const signalRService = new SignalRService();