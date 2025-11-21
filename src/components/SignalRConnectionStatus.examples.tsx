import React from 'react';
import { SignalRConnectionStatus } from '../components/SignalRConnectionStatus';
import { signalRService } from '../services/signalRService';

/**
 * Example: How to use SignalRConnectionStatus component in your layouts
 */

// ============================================
// Example 1: Header with Connection Status
// ============================================
export const HeaderWithStatus = () => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md px-4 py-3">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                
                {/* Compact status indicator */}
                <SignalRConnectionStatus />
            </div>
        </header>
    );
};

// ============================================
// Example 2: Admin Settings Page with Details
// ============================================
export const AdminSettingsWithStatus = () => {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Other settings cards */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold mb-2">General Settings</h3>
                    {/* ... */}
                </div>
                
                {/* SignalR Connection Status Card */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold mb-4">SignalR Connection</h3>
                    <SignalRConnectionStatus showDetails={true} />
                </div>
            </div>
        </div>
    );
};

// ============================================
// Example 3: Floating Status Indicator
// ============================================
export const FloatingStatusIndicator = () => {
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <SignalRConnectionStatus showDetails={true} className="shadow-lg" />
        </div>
    );
};

// ============================================
// Example 4: Integration with existing layouts
// ============================================

// In your DashboardLayout.tsx or MainLayout.tsx:
/*
import { SignalRConnectionStatus } from '../components/SignalRConnectionStatus';

export const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen">
            <header className="bg-white shadow-md">
                <div className="flex items-center justify-between px-6 py-3">
                    <Logo />
                    <Navigation />
                    
                    // Add status indicator in header
                    <SignalRConnectionStatus />
                </div>
            </header>
            
            <main className="p-6">
                {children}
            </main>
            
            // Or add floating indicator
            <div className="fixed bottom-4 right-4 z-50">
                <SignalRConnectionStatus showDetails={false} />
            </div>
        </div>
    );
};
*/

// ============================================
// Example 5: Custom styled version
// ============================================
export const CustomStyledStatus = () => {
    return (
        <div className="my-custom-container">
            <SignalRConnectionStatus 
                className="border-2 border-blue-500 shadow-xl"
                showDetails={true}
            />
        </div>
    );
};

// ============================================
// Example 6: Conditional rendering based on role
// ============================================
export const ConditionalStatus = () => {
    const isAdmin = true; // Get from your auth context
    
    return (
        <div>
            {isAdmin && (
                <div className="admin-panel">
                    <h3>Admin Tools</h3>
                    <SignalRConnectionStatus showDetails={true} />
                </div>
            )}
            
            {!isAdmin && (
                <div className="user-panel">
                    {/* Simple indicator for regular users */}
                    <SignalRConnectionStatus showDetails={false} />
                </div>
            )}
        </div>
    );
};

// ============================================
// Example 7: Integration with Notification System
// ============================================
export const StatusWithNotifications = () => {
    const [showNotification, setShowNotification] = React.useState(false);
    
    React.useEffect(() => {
        // Listen for connection lost events
        const checkConnection = setInterval(() => {
            const info = signalRService.getConnectionInfo();
            if (!info.isConnected) {
                setShowNotification(true);
            } else {
                setShowNotification(false);
            }
        }, 5000);
        
        return () => clearInterval(checkConnection);
    }, []);
    
    return (
        <div>
            {showNotification && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    ⚠️ SignalR connection lost. Attempting to reconnect...
                </div>
            )}
            
            <SignalRConnectionStatus showDetails={true} />
        </div>
    );
};

// ============================================
// Recommended Placements
// ============================================
/*
1. ✅ RECOMMENDED: Header/Navbar
   - Always visible
   - Non-intrusive
   - Easy to check
   
2. ✅ RECOMMENDED: Admin Settings Page
   - Detailed view
   - Manual controls
   - For troubleshooting
   
3. ⚠️ OPTIONAL: Floating bottom-right
   - Always visible but can be intrusive
   - Use for development/staging only
   
4. ❌ NOT RECOMMENDED: Footer
   - Often out of view
   - Users won't notice issues
*/

export default {
    HeaderWithStatus,
    AdminSettingsWithStatus,
    FloatingStatusIndicator,
    CustomStyledStatus,
    ConditionalStatus,
    StatusWithNotifications
};
