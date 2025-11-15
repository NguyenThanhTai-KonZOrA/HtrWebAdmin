import * as signalR from '@microsoft/signalr';
import type { ChangeQueueStatusResponse, TicketResponse } from '../type';

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    // Set URL SignalR Hub
    private hubUrl =  (window as any)._env_?.API_BASE + '/hubs/queueCounter';

    // Try connecting with different transport methods
    public async tryDifferentTransports(): Promise<void> {
        const transports = [
            { name: 'WebSockets + LongPolling', transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling, skipNegotiation: false },
            { name: 'LongPolling only', transport: signalR.HttpTransportType.LongPolling, skipNegotiation: false },
            { name: 'ServerSentEvents + LongPolling', transport: signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling, skipNegotiation: false },
            { name: 'WebSockets only', transport: signalR.HttpTransportType.WebSockets, skipNegotiation: true }
        ];

        for (const config of transports) {
            try {
                // Close existing connection
                if (this.connection) {
                    await this.connection.stop();
                }

                // Create new connection with this transport
                this.connection = new signalR.HubConnectionBuilder()
                    .withUrl(this.hubUrl, {
                        skipNegotiation: config.skipNegotiation,
                        transport: config.transport,
                        timeout: 30000,
                        accessTokenFactory: () => {
                            const token = localStorage.getItem('token');
                            return token || '';
                        }
                    })
                    .withAutomaticReconnect()
                    .configureLogging(signalR.LogLevel.Warning)
                    .build();

                // Try to connect
                await this.connection.start();
                
                // If successful, break the loop
                break;
                
            } catch (error) {
                console.error(`Failed with ${config.name}:`, error);
                
                // If this is the last transport, rethrow the error
                if (config === transports[transports.length - 1]) {
                    throw error;
                }
            }
        }
    }

    // Initialize connection
    public async startConnection(): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        // Try different transports if initial connection fails
        try {
            await this.tryDifferentTransports();
            
            // Setup event handlers after successful connection
            this.setupEventHandlers();
            
        } catch (error) {
            console.error('All transport methods failed:', error);
            this.attemptReconnect();
            return;
        }
    }

    // Setup event handlers for the connection
    private setupEventHandlers(): void {
        if (!this.connection) return;

        // Handle reconnect
        this.connection.onreconnecting((error) => {
            console.warn('SignalR reconnecting...', error);
        });

        this.connection.onreconnected(() => {
            this.reconnectAttempts = 0;
        });

        this.connection.onclose((error) => {
            console.error('SignalR connection closed', error);
            this.attemptReconnect();
        });
    }

    // Auto reconnect
    private async attemptReconnect(): Promise<void> {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        setTimeout(() => {
            this.startConnection();
        }, delay);
    }

    // Re-register event listener from server
    public onQueueStatusChanged(callback: (data: ChangeQueueStatusResponse) => void): void {
        if (!this.connection) {
            console.error('❌ SignalR connection not initialized');
            return;
        }

        // Unregister any existing listeners first to prevent duplicates
        this.connection.off('QueueStatusChanged');

        // Also try to listen to other possible event names that server might be using
        this.connection.off('queueStatusChanged');
        this.connection.off('QueueStatusUpdate');
        this.connection.off('QueueUpdated');

        // Register new listener with multiple possible event names
        const eventNames = ['QueueStatusChanged', 'queueStatusChanged', 'QueueStatusUpdate', 'QueueUpdated'];

        eventNames.forEach(eventName => {
            this.connection!.on(eventName, (data: ChangeQueueStatusResponse) => {
                console.log(`📡 Received ${eventName}:`, data);
                console.log('📡 Event data details:', {
                    ticketId: data.ticketId,
                    ticketNumber: data.ticketNumber,
                    status: data.status,
                    statusName: data.statusName,
                });
                callback(data);
            });
        });

        // Listen to ALL events for debugging
        this.connection.onreconnected(() => {
            // Re-register events on reconnection if needed
        });
    }

    // cancel event registration
    public offQueueStatusChanged(): void {
        if (this.connection) {
            this.connection.off('QueueStatusChanged');
        }
    }

    // Đăng ký lắng nghe event registration changed (khi có ticket mới được tạo)
    public onRegistrationChanged(callback: (data: TicketResponse) => void): void {
        if (!this.connection) {
            console.error('❌ SignalR connection not initialized');
            return;
        }

        // Unregister any existing listeners first to prevent duplicates
        this.connection.off('RegistrationChanged');
        this.connection.off('registrationChanged');
        this.connection.off('NewTicketCreated');
        this.connection.off('TicketRegistered');

        // Register new listener with multiple possible event names
        const eventNames = ['RegistrationChanged', 'registrationChanged', 'NewTicketCreated', 'TicketRegistered'];

        eventNames.forEach(eventName => {
            this.connection!.on(eventName, (data: TicketResponse) => {
                console.log(`📡 Received ${eventName}:`, data);
                console.log('📡 New ticket registration details:', {
                    ticketId: data.ticketId,
                    ticketNumber: data.ticketNumber,
                    fullName: data.fullName,
                    phone: data.phone,
                    email: data.email,
                    counterId: data.counterId,
                    status: data.status,
                    message: data.message
                });
                callback(data);
            });
        });

        console.log('📝 Registered registration event listeners:', eventNames);
    }

    // Hủy đăng ký registration event
    public offRegistrationChanged(): void {
        if (this.connection) {
            this.connection.off('RegistrationChanged');
            this.connection.off('registrationChanged');
            this.connection.off('NewTicketCreated');
            this.connection.off('TicketRegistered');
        }
    }

    // Ngắt kết nối
    public async stopConnection(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            console.log('🛑 SignalR Disconnected');
        }
    }

    // Kiểm tra trạng thái kết nối
    public isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    // Debug method to test event firing
    public testEvent(): void {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            const testData: ChangeQueueStatusResponse = {
                ticketId: 999,
                ticketNumber: 999,
                status: 2,
                statusName: "Test Event",
                counterId: 1,
                counterName: "Test Counter",
                fullName: "Test User",
                phone: "0123456789",
                email: "test@test.com",
                timestamp: new Date().toISOString(),
                playerId: 0,
                passportNumber: '',
                ticketDate: '',
                type: '',
                isChangeSuccess: false,
                message: "Test event message"
            };

            // Trigger the event manually for testing
            if (this.connection) {
                this.connection.invoke('QueueStatusChanged', testData)
                    .catch(err => console.error('Error invoking test event:', err));
            }
        } else {
            console.error('Cannot test event - SignalR not connected');
        }
    }

    // Debug method to test registration event
    public testRegistrationEvent(): void {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            console.log('🧪 Testing SignalR event - simulating RegistrationChanged');
            const testData: TicketResponse = {
                ticketId: 888,
                patronId: 123,
                counterId: 1,
                ticketNumber: 888,
                ticketDate: new Date().toISOString(),
                status: "Waiting",
                qrCodeUrl: "https://example.com/qr/888",
                message: "Test registration successful",
                fullName: "Test New User",
                phone: "0987654321",
                email: "newuser@test.com"
            };

            // Trigger the event manually for testing
            if (this.connection) {
                this.connection.invoke('RegistrationChanged', testData)
                    .catch(err => console.error('Error invoking test registration event:', err));
            }
        } else {
            console.error('❌ Cannot test event - SignalR not connected');
        }
    }

    // Get connection details for debugging
    public getConnectionInfo(): any {
        return {
            state: this.connection?.state,
            connectionId: this.connection?.connectionId,
            baseUrl: this.hubUrl,
            isConnected: this.isConnected()
        };
    }

    // Listen to ALL events for debugging purposes
    public listenToAllEvents(): void {
        if (!this.connection) {
            console.error('❌ SignalR connection not initialized');
            return;
        }

        // Add listeners for ALL possible events that might be broadcast
        const allPossibleEvents = [
            // Queue related
            'QueueStatusChanged', 'queueStatusChanged',
            // Registration related
            'RegistrationChanged', 'registrationChanged', 'NewTicketCreated', 'TicketRegistered',
            // Notification related
        ];

        console.log('👂 Setting up listeners for ALL possible events:', allPossibleEvents);

        allPossibleEvents.forEach(eventName => {
            this.connection!.on(eventName, (...args: any[]) => {
                console.log(`🎯 *** RECEIVED EVENT '${eventName}' ***`, args);
                console.log(`🎯 Event details:`, {
                    eventName,
                    argsCount: args.length,
                    args: args,
                    timestamp: new Date().toISOString()
                });
            });
        });

        // Also add a catch-all by overriding the invoke method to see outgoing messages
        if (this.connection.invoke) {
            const originalInvoke = this.connection.invoke.bind(this.connection);
            this.connection.invoke = function <T = any>(methodName: string, ...args: any[]): Promise<T> {
                console.log(`📤 SignalR OUTGOING invoke: ${methodName}`, args);
                return originalInvoke(methodName, ...args) as Promise<T>;
            };
        }

        console.log('✅ All event listeners registered');
    }

    // Join a specific group (common pattern in SignalR)
    public async joinGroup(groupName: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.error('❌ Cannot join group - SignalR not connected');
            return;
        }

        try {
            await this.connection.invoke('JoinGroup', groupName);
            console.log(`✅ Joined SignalR group: ${groupName}`);
        } catch (error) {
            console.error(`❌ Failed to join group ${groupName}:`, error);
        }
    }

    // Leave a specific group
    public async leaveGroup(groupName: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.error('❌ Cannot leave group - SignalR not connected');
            return;
        }

        try {
            await this.connection.invoke('LeaveGroup', groupName);
            console.log(`✅ Left SignalR group: ${groupName}`);
        } catch (error) {
            console.error(`❌ Failed to leave group ${groupName}:`, error);
        }
    }

    // Try to join common groups that might be used for queue updates
    public async joinCommonGroups(): Promise<void> {
        const commonGroups = ['QueueUpdates', 'AdminUpdates', 'AllClients', 'QueueStatus'];

        for (const group of commonGroups) {
            await this.joinGroup(group);
        }
    }

    // Test server methods to see what's available
    public async testServerMethods(): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.error('❌ Cannot test server methods - SignalR not connected');
            return;
        }

        const testMethods = [
            
            'UpdateQueueStatus'
        ];

        console.log('🧪 Testing server methods availability...');

        for (const method of testMethods) {
            try {
                console.log(`📤 Testing method: ${method}`);
                await this.connection.invoke(method);
                console.log(`✅ Method ${method} exists and responded`);
            } catch (error) {
                console.log(`❌ Method ${method} failed:`, error);
            }
        }
    }

    // Send a test message to trigger server response
    public async sendTestMessage(): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.error('❌ Cannot send test message - SignalR not connected');
            return;
        }

        try {
            console.log('📤 Sending test message to server...');
            await this.connection.invoke('TestConnection', {
                message: 'Test from client',
                timestamp: new Date().toISOString(),
                clientId: this.connection.connectionId
            });
            console.log('✅ Test message sent successfully');
        } catch (error) {
            console.error('❌ Failed to send test message:', error);
        }
    }

    // Test connection with different URL formats
    public async testDifferentUrls(): Promise<void> {
        const baseUrl = (window as any)._env_?.API_BASE;
        const testUrls = [
            `${baseUrl}/hubs/queueCounter`,
            `${baseUrl}/queueCounter`, 
            `${baseUrl}/signalr/hubs/queueCounter`,
            `${baseUrl}/api/hubs/queueCounter`,
            baseUrl.replace('http://', 'ws://') + '/hubs/queueCounter',
            baseUrl.replace('https://', 'wss://') + '/hubs/queueCounter'
        ];

        console.log('🧪 Testing different SignalR URL formats...');

        for (const url of testUrls) {
            console.log(`🔍 Testing URL: ${url}`);
            
            try {
                const testConnection = new signalR.HubConnectionBuilder()
                    .withUrl(url, {
                        skipNegotiation: false,
                        transport: signalR.HttpTransportType.LongPolling, // Use most compatible transport for testing
                        timeout: 10000
                    })
                    .configureLogging(signalR.LogLevel.Information)
                    .build();

                await testConnection.start();
                console.log(`✅ URL works: ${url}`);
                console.log(`   Connection ID: ${testConnection.connectionId}`);
                
                // Test if we can call server methods
                try {
                    await testConnection.invoke('TestConnection');
                    console.log(`✅ Server methods available on: ${url}`);
                } catch (methodError) {
                    console.log(`⚠️ Server methods not available: ${methodError}`);
                }
                
                await testConnection.stop();
                
                // Update the hub URL if this one works
                this.hubUrl = url;
                return;
                
            } catch (error) {
                console.log(`❌ URL failed: ${url} - ${error}`);
            }
        }
        
        console.error('❌ All URL formats failed');
    }

    // Expose service to global window for console debugging
    public exposeToConsole(): void {
        (window as any).signalRDebug = {
            service: this,
            connection: this.connection,
            isConnected: () => this.isConnected(),
            getInfo: () => this.getConnectionInfo(),
            testEvent: () => this.testEvent(),
            testRegistration: () => this.testRegistrationEvent(),
            joinGroups: () => this.joinCommonGroups(),
            testServer: () => this.testServerMethods(),
            sendTest: () => this.sendTestMessage(),
            listen: () => this.listenToAllEvents(),
            
            // New troubleshooting commands
            testUrls: () => this.testDifferentUrls(),
            tryTransports: () => this.tryDifferentTransports(),
            reconnect: () => this.startConnection(),
            
            // Quick connection test
            quickTest: async () => {
                console.log('🧪 Running quick SignalR diagnostics...');
                console.log('1. Current connection info:', this.getConnectionInfo());
                console.log('2. Testing different URLs...');
                await this.testDifferentUrls();
                console.log('3. Testing different transports...');
                await this.tryDifferentTransports();
                console.log('4. Setting up all event listeners...');
                this.listenToAllEvents();
                console.log('✅ Diagnostics complete');
            },

            // Helper commands
            help: () => {
                console.log(`
🔧 SignalR Debug Commands Available:
Basic Commands:
- signalRDebug.isConnected() - Check connection status
- signalRDebug.getInfo() - Get connection info
- signalRDebug.reconnect() - Force reconnection

Testing Commands:
- signalRDebug.testUrls() - Test different SignalR URL formats
- signalRDebug.tryTransports() - Test different transport methods
- signalRDebug.quickTest() - Run complete diagnostics

Event Commands:
- signalRDebug.testEvent() - Trigger test queue status event
- signalRDebug.testRegistration() - Trigger test registration event
- signalRDebug.listen() - Setup all event listeners

Server Commands:
- signalRDebug.joinGroups() - Join common groups
- signalRDebug.testServer() - Test server methods
- signalRDebug.sendTest() - Send test message

Direct Access:
- signalRDebug.connection - Direct access to SignalR connection
- signalRDebug.service - Direct access to service instance

Quick Start: signalRDebug.quickTest()
        `);
            }
        };

        console.log('🔧 SignalR Debug commands exposed to window.signalRDebug');
        console.log('📖 Type "signalRDebug.help()" for available commands');
        console.log('🚀 Quick start: signalRDebug.quickTest()');
    }
}

export const signalRService = new SignalRService();