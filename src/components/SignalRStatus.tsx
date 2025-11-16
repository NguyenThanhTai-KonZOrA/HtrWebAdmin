// import React, { useState, useEffect } from 'react';
// import { signalRService } from '../services/signalRService';

// interface SignalRStatusProps {
//     showDetailed?: boolean;
// }

// export const SignalRStatus: React.FC<SignalRStatusProps> = ({ showDetailed = false }) => {
//     const [isConnected, setIsConnected] = useState(false);
//     const [connectionInfo, setConnectionInfo] = useState<any>(null);
//     const [lastError, setLastError] = useState<string>('');

//     useEffect(() => {
//         const checkConnection = () => {
//             const connected = signalRService.isConnected();
//             const info = signalRService.getConnectionInfo();
            
//             setIsConnected(connected);
//             setConnectionInfo(info);
//         };

//         // Check initially
//         checkConnection();

//         // Check every 5 seconds
//         const interval = setInterval(checkConnection, 5000);

//         return () => clearInterval(interval);
//     }, []);

//     const handleReconnect = async () => {
//         try {
//             setLastError('');
//             await signalRService.startConnection();
//         } catch (error) {
//             setLastError(error instanceof Error ? error.message : 'Unknown error');
//         }
//     };

//     const handleRunDiagnostics = async () => {
//         try {
//             setLastError('');
//             console.log('🧪 Running SignalR diagnostics...');
            
//             // Test different URLs first
//             await signalRService.testDifferentUrls();
            
//             // Then try different transports
//             await signalRService.tryDifferentTransports();
            
//             console.log('✅ Diagnostics complete - check console for details');
//         } catch (error) {
//             const errorMsg = error instanceof Error ? error.message : 'Diagnostics failed';
//             setLastError(errorMsg);
//             console.error('❌ Diagnostics failed:', error);
//         }
//     };

//     if (!showDetailed) {
//         return (
//             <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${
//                 isConnected 
//                     ? 'bg-green-100 text-green-800' 
//                     : 'bg-red-100 text-red-800'
//             }`}>
//                 <div className={`w-2 h-2 rounded-full mr-2 ${
//                     isConnected ? 'bg-green-500' : 'bg-red-500'
//                 }`} />
//                 SignalR {isConnected ? 'Connected' : 'Disconnected'}
//             </div>
//         );
//     }

//     return (
//         <div className="bg-white border rounded-lg p-4 shadow-sm">
//             <div className="flex items-center justify-between mb-3">
//                 <h3 className="text-lg font-semibold">SignalR Connection Status</h3>
//                 <div className={`inline-flex items-center px-3 py-1 rounded ${
//                     isConnected 
//                         ? 'bg-green-100 text-green-800' 
//                         : 'bg-red-100 text-red-800'
//                 }`}>
//                     <div className={`w-2 h-2 rounded-full mr-2 ${
//                         isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
//                     }`} />
//                     {isConnected ? 'Connected' : 'Disconnected'}
//                 </div>
//             </div>

//             {connectionInfo && (
//                 <div className="space-y-2 text-sm">
//                     <div className="grid grid-cols-2 gap-4">
//                         <div>
//                             <span className="font-medium">Connection ID:</span>
//                             <p className="text-gray-600 break-all">{connectionInfo.connectionId || 'N/A'}</p>
//                         </div>
//                         <div>
//                             <span className="font-medium">State:</span>
//                             <p className="text-gray-600">{connectionInfo.state || 'Unknown'}</p>
//                         </div>
//                     </div>
//                     <div>
//                         <span className="font-medium">Hub URL:</span>
//                         <p className="text-gray-600 break-all">{connectionInfo.baseUrl}</p>
//                     </div>
//                 </div>
//             )}

//             {lastError && (
//                 <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
//                     <p className="text-red-800 text-sm">{lastError}</p>
//                 </div>
//             )}

//             <div className="mt-4 flex space-x-2">
//                 <button
//                     onClick={handleReconnect}
//                     disabled={isConnected}
//                     className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
//                 >
//                     Reconnect
//                 </button>
//                 <button
//                     onClick={handleRunDiagnostics}
//                     className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
//                 >
//                     Run Diagnostics
//                 </button>
//                 <button
//                     onClick={() => {
//                         if ((window as any).signalRDebug) {
//                             (window as any).signalRDebug.help();
//                         } else {
//                             console.log('SignalR debug not available. Make sure the app is in development mode.');
//                         }
//                     }}
//                     className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
//                 >
//                     Debug Help
//                 </button>
//             </div>

//             <div className="mt-3 text-xs text-gray-500">
//                 💡 Tip: Open browser console and type <code className="bg-gray-100 px-1 rounded">signalRDebug.help()</code> for more debugging options
//             </div>
//         </div>
//     );
// };

// export default SignalRStatus;
