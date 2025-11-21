import * as signalR from '@microsoft/signalr';
import type { ChangeQueueStatusResponse, TicketResponse } from '../type';
import type { PatronResponse } from '../registrationType';

// Message types for SignalR events
export interface SignatureCompletedMessage {
    patronId: number;
    sessionId: string;
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
    private isInStaffGroup = false;
    private eventListeners: Map<string, ((...args: any[]) => any)[]> = new Map();

    private heartbeatInterval: number | null = null;
    private connectionHealthCheckInterval: number | null = null;

    // Set URL SignalR Hub for patron signature
    private hubUrl = (window as any)._env_?.API_BASE + '/patronSignatureHub';

    // Initialize connection
    public async startConnection(staffDeviceId?: number): Promise<void> {
        console.log('🚀 Starting SignalR connection with staffDeviceId:', staffDeviceId);
        
        // Store staffDeviceId for later use, even if undefined
        this.staffDeviceId = staffDeviceId || null;
        
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            console.log('⚠️ SignalR already connected');
            
            // If we have a new staffDeviceId and it's different, update it
            if (staffDeviceId && staffDeviceId !== this.staffDeviceId) {
                console.log('🔄 Updating existing connection staffDeviceId from', this.staffDeviceId, 'to', staffDeviceId);
                this.staffDeviceId = staffDeviceId;
                await this.joinStaffGroup();
            } else {
                console.log('✅ Already connected with staffDeviceId:', this.staffDeviceId);
            }
            return;
        }

        try {
            // Create connection
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(this.hubUrl, {
                    skipNegotiation: false,
                    transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
                    timeout: 30000,
                    accessTokenFactory: () => {
                        const token = localStorage.getItem('token');
                        return token || '';
                    }
                })
                .withAutomaticReconnect([0, 2000, 10000, 30000]) // More aggressive reconnect
                .configureLogging(signalR.LogLevel.Warning)
                .build();

            // Setup event handlers
            this.setupEventHandlers();

            // Start connection
            await this.connection.start();
            console.log('✅ SignalR connection established');
            console.log('🔌 Connection ID:', this.connection.connectionId);
            console.log('📱 Current staffDeviceId:', this.staffDeviceId);

            // Join staff group if staffDeviceId is available
            if (this.staffDeviceId) {
                console.log('🏘️ Joining staff group with ID:', this.staffDeviceId);
                await this.joinStaffGroup();
            } else {
                console.log('🤔 No staffDeviceId available, skipping staff group join');
            }

            // Start connection health monitoring
            this.startConnectionHealthCheck();
            this.startHeartbeat();

        } catch (error) {
            console.warn('⚠️ SignalR connection failed, continuing without it:', error);
            // Don't throw error - let app continue without SignalR
            this.connection = null;
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
            
            // Rejoin the staff group if available
            if (this.staffDeviceId) {
                this.ensureStaffGroupMembership();
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
                await this.startConnection(this.staffDeviceId || undefined);
            } catch (error) {
                console.warn('⚠️ Reconnect attempt failed:', error);
            }
        }, delay);
    }

    // Join staff group to receive notifications
    public async joinStaffGroup(): Promise<void> {
        console.log('🔍 joinStaffGroup called');
        console.log('🔗 Connection:', this.connection ? 'Available' : 'NULL');
        console.log('🆔 StaffDeviceId:', this.staffDeviceId);
        
        if (!this.connection || !this.staffDeviceId) {
            console.log('ℹ️ Cannot join staff group - connection or staffDeviceId not available');
            return;
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            console.log('ℹ️ Cannot join staff group - not connected. Current state:', this.connection.state);
            return;
        }

        try {
            console.log(`🎯 Calling server method 'JoinStaffGroup' with ID: ${this.staffDeviceId}`);
            await this.connection.invoke('JoinStaffGroup', this.staffDeviceId);
            this.isInStaffGroup = true;
            console.log(`✅ Joined staff group: Staff_${this.staffDeviceId}`);
        } catch (error) {
            this.isInStaffGroup = false;
            console.error('❌ Error joining staff group:', error);
            console.error('   Error details:', {
                name: (error as any)?.name,
                message: (error as any)?.message,
                stack: (error as any)?.stack
            });
        }
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
            if (this.isConnected()) {
                // Send ping to server to keep connection alive
                this.connection?.invoke('Ping').catch(error => {
                    console.warn('⚠️ Heartbeat ping failed:', error);
                });
            }
        }, 30000); // Send ping every 30 seconds

        console.log('💓 Heartbeat started (30s interval)');
    }

    // Start connection health check
    private startConnectionHealthCheck(): void {
        if (this.connectionHealthCheckInterval) {
            clearInterval(this.connectionHealthCheckInterval);
        }

        this.connectionHealthCheckInterval = setInterval(async () => {
            if (!this.isConnected()) {
                console.warn('⚠️ Connection health check: Not connected');
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
                this.attemptReconnect();
            }
        }, 60000); // Check every 60 seconds

        console.log('🏥 Connection health check started (60s interval)');
    }

    // Re-register all event listeners after reconnection
    private reregisterEventListeners(): void {
        console.log('🔄 Re-registering event listeners after reconnect');
        
        for (const [eventName, callbacks] of this.eventListeners.entries()) {
            if (this.connection) {
                // Remove existing listeners
                this.connection.off(eventName);
                
                // Re-register listeners
                for (const callback of callbacks) {
                    this.connection.on(eventName, callback);
                }
                
                console.log(`✅ Re-registered ${callbacks.length} listeners for ${eventName}`);
            }
        }
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
    }

    // Listen to signature completed event
    public onSignatureCompleted(callback: (message: SignatureCompletedMessage) => void): void {
        const eventName = 'SignatureCompleted';
        
        // Store callback for re-registration after reconnect
        this.storeEventListener(eventName, callback);

        if (!this.connection) {
            console.warn('⚠️ SignalR connection not initialized - event listener stored and will be registered when connected');
            return;
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('⚠️ SignalR not connected - event listener stored and will be registered when connected');
            return;
        }

        // Unregister existing listener
        this.connection.off(eventName);

        // Register new listener
        this.connection.on(eventName, (message: SignatureCompletedMessage) => {
            console.log('✅ Received SignatureCompleted message:', message);
            this.playNotificationSound(); // Auto play sound
            callback(message);
        });

        console.log('📝 Registered SignatureCompleted event listener');
    }

    // Listen to new registration event
    public onNewRegistration(callback: (message: NewRegistrationMessage) => void): void {
        const eventName = 'NewRegistration';
        
        // Store callback for re-registration after reconnect
        this.storeEventListener(eventName, callback);

        if (!this.connection) {
            console.warn('⚠️ SignalR connection not initialized - event listener stored and will be registered when connected');
            return;
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('⚠️ SignalR not connected - event listener stored and will be registered when connected');
            return;
        }

        // Unregister existing listener
        this.connection.off(eventName);

        // Register new listener
        this.connection.on(eventName, (message: NewRegistrationMessage) => {
            console.log('🆕 Received NewRegistration message:', message);
            this.playNotificationSound(); // Auto play sound
            callback(message);
        });

        console.log('📝 Registered NewRegistration event listener');
    }

    // Unregister signature completed event
    public offSignatureCompleted(): void {
        if (this.connection) {
            this.connection.off('SignatureCompleted');
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

        if (this.connection) {
            await this.connection.stop();
            console.log('🛑 SignalR Disconnected');
            this.connection = null;
            this.staffDeviceId = null;
            this.isInStaffGroup = false;
            this.eventListeners.clear();
        }
    }

    // Check connection status
    public isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    // Update staffDeviceId and join group
    public async updateStaffDeviceId(staffDeviceId: number): Promise<void> {
        console.log('🔄 Updating staffDeviceId from', this.staffDeviceId, 'to', staffDeviceId);
        this.staffDeviceId = staffDeviceId;
        this.isInStaffGroup = false; // Reset group status
        
        if (this.isConnected()) {
            console.log('🏘️ Connection active, ensuring staff group membership...');
            await this.ensureStaffGroupMembership();
        } else {
            console.log('⚠️ No active connection, will join when connected');
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
                isConnected: false
            };
        }

        return {
            state: this.connection.state,
            connectionId: this.connection.connectionId || null,
            baseUrl: this.hubUrl,
            staffDeviceId: this.staffDeviceId,
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