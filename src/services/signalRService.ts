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

    // Set URL SignalR Hub for patron signature
    private hubUrl = (window as any)._env_?.API_BASE + '/patronSignatureHub';

    // Initialize connection
    public async startConnection(staffDeviceId?: number): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            console.log('⚠️ SignalR already connected');
            return;
        }

        if (staffDeviceId) {
            this.staffDeviceId = staffDeviceId;
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
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // Setup event handlers
            this.setupEventHandlers();

            // Start connection
            await this.connection.start();
            console.log('✅ SignalR connection established');
            console.log('🔌 Connection ID:', this.connection.connectionId);

            // Join staff group if available
            if (this.staffDeviceId) {
                await this.joinStaffGroup();
            }

        } catch (error) {
            console.error('❌ Error initializing SignalR:', error);
            this.attemptReconnect();
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
            
            // Rejoin the staff group if available
            if (this.staffDeviceId) {
                this.joinStaffGroup();
            }
        });

        this.connection.onclose((error) => {
            console.error('❌ SignalR connection closed:', error);
            this.attemptReconnect();
        });
    }

    // Auto reconnect
    private async attemptReconnect(): Promise<void> {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        console.log(`🔄 Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.startConnection(this.staffDeviceId || undefined);
        }, delay);
    }

    // Join staff group to receive notifications
    public async joinStaffGroup(): Promise<void> {
        if (!this.connection || !this.staffDeviceId) {
            console.warn('⚠️ Cannot join staff group - connection or staffDeviceId not available');
            return;
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('⚠️ Cannot join staff group - not connected');
            return;
        }

        try {
            await this.connection.invoke('JoinStaffGroup', this.staffDeviceId);
            console.log(`✅ Joined staff group: Staff_${this.staffDeviceId}`);
        } catch (error) {
            console.error('❌ Error joining staff group:', error);
        }
    }

    // Listen to signature completed event
    public onSignatureCompleted(callback: (message: SignatureCompletedMessage) => void): void {
        if (!this.connection) {
            console.warn('⚠️ SignalR connection not initialized - event listener will be registered when connected');
            // Delay registration until connection is ready
            setTimeout(() => {
                if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
                    this.onSignatureCompleted(callback);
                }
            }, 1000);
            return;
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('⚠️ SignalR not connected - event listener will be registered when connected');
            // Delay registration until connection is ready
            setTimeout(() => {
                if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
                    this.onSignatureCompleted(callback);
                }
            }, 1000);
            return;
        }

        // Unregister existing listener
        this.connection.off('SignatureCompleted');

        // Register new listener
        this.connection.on('SignatureCompleted', (message: SignatureCompletedMessage) => {
            console.log('✅ Received SignatureCompleted message:', message);
            callback(message);
        });

        console.log('📝 Registered SignatureCompleted event listener');
    }

    // Listen to new registration event
    public onNewRegistration(callback: (message: NewRegistrationMessage) => void): void {
        if (!this.connection) {
            console.warn('⚠️ SignalR connection not initialized - event listener will be registered when connected');
            // Delay registration until connection is ready
            setTimeout(() => {
                if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
                    this.onNewRegistration(callback);
                }
            }, 1000);
            return;
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('⚠️ SignalR not connected - event listener will be registered when connected');
            // Delay registration until connection is ready
            setTimeout(() => {
                if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
                    this.onNewRegistration(callback);
                }
            }, 1000);
            return;
        }

        // Unregister existing listener
        this.connection.off('NewRegistration');

        // Register new listener
        this.connection.on('NewRegistration', (message: NewRegistrationMessage) => {
            console.log('🆕 Received NewRegistration message:', message);
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
        if (this.connection) {
            await this.connection.stop();
            console.log('🛑 SignalR Disconnected');
            this.connection = null;
            this.staffDeviceId = null;
        }
    }

    // Check connection status
    public isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
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
            isConnected: this.isConnected()
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
            playSound: () => this.playNotificationSound(),
            help: () => {
                console.log(`
🔧 SignalR Debug Commands:
- signalRDebug.isConnected() - Check connection status
- signalRDebug.getInfo() - Get connection info
- signalRDebug.reconnect() - Force reconnection
- signalRDebug.joinGroup() - Join staff group
- signalRDebug.playSound() - Test notification sound
                `);
            }
        };
        console.log('🔧 SignalR Debug: Type "signalRDebug.help()" for commands');
    }
}

export const signalRService = new SignalRService();