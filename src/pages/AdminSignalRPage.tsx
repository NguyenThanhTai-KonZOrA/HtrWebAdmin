import React from 'react';
import AdminLayout from '../layout/AdminLayout';
import SignalRStatus from '../components/SignalRStatus';

const AdminSignalRPage: React.FC = () => {
    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">SignalR Connection Monitor</h1>
                    <p className="text-gray-600">Monitor and troubleshoot SignalR real-time connections</p>
                </div>

                <div className="space-y-6">
                    {/* Connection Status */}
                    <SignalRStatus showDetailed={true} />

                    {/* Troubleshooting Guide */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-blue-900 mb-4">Troubleshooting Guide</h2>
                        
                        <div className="space-y-4 text-sm">
                            <div>
                                <h3 className="font-medium text-blue-800">1. Common Issues on Production Servers:</h3>
                                <ul className="list-disc list-inside text-blue-700 mt-1 space-y-1">
                                    <li>WebSocket connections blocked by proxy/load balancer</li>
                                    <li>Sticky sessions not enabled for multiple servers</li>
                                    <li>CORS issues with SignalR negotiate endpoint</li>
                                    <li>Authentication token not being sent properly</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-medium text-blue-800">2. Debug Steps:</h3>
                                <ol className="list-decimal list-inside text-blue-700 mt-1 space-y-1">
                                    <li>Click "Run Diagnostics" to test different connection methods</li>
                                    <li>Open browser console and run <code className="bg-blue-100 px-1 rounded">signalRDebug.quickTest()</code></li>
                                    <li>Check Network tab in DevTools for failed requests</li>
                                    <li>Verify server SignalR hub is properly configured and running</li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="font-medium text-blue-800">3. Production Server Requirements:</h3>
                                <ul className="list-disc list-inside text-blue-700 mt-1 space-y-1">
                                    <li>Enable WebSocket support on IIS/Nginx</li>
                                    <li>Configure sticky sessions if using multiple servers</li>
                                    <li>Allow SignalR negotiate and connect endpoints</li>
                                    <li>Ensure proper CORS configuration</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Manual Testing */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Testing</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-medium text-gray-800 mb-2">Console Commands:</h3>
                                <div className="space-y-2 text-sm">
                                    <code className="block bg-gray-100 p-2 rounded">signalRDebug.isConnected()</code>
                                    <code className="block bg-gray-100 p-2 rounded">signalRDebug.testUrls()</code>
                                    <code className="block bg-gray-100 p-2 rounded">signalRDebug.tryTransports()</code>
                                    <code className="block bg-gray-100 p-2 rounded">signalRDebug.quickTest()</code>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-medium text-gray-800 mb-2">Test Events:</h3>
                                <div className="space-y-2 text-sm">
                                    <code className="block bg-gray-100 p-2 rounded">signalRDebug.testEvent()</code>
                                    <code className="block bg-gray-100 p-2 rounded">signalRDebug.listen()</code>
                                    <code className="block bg-gray-100 p-2 rounded">signalRDebug.joinGroups()</code>
                                    <code className="block bg-gray-100 p-2 rounded">signalRDebug.help()</code>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Environment Info */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-yellow-900 mb-4">Environment Information</h2>
                        
                        <div className="text-sm space-y-2">
                            <div>
                                <span className="font-medium text-yellow-800">API Base URL:</span>
                                <span className="ml-2 text-yellow-700">{(window as any)._env_?.API_BASE || 'Not configured'}</span>
                            </div>
                            <div>
                                <span className="font-medium text-yellow-800">SignalR Hub URL:</span>
                                <span className="ml-2 text-yellow-700">{(window as any)._env_?.API_BASE}/hubs/queueCounter</span>
                            </div>
                            <div>
                                <span className="font-medium text-yellow-800">Environment:</span>
                                <span className="ml-2 text-yellow-700">{import.meta.env.MODE}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSignalRPage;
