// // src/components/NotificationManager.tsx
// import React, { useCallback } from 'react';
// import { Snackbar, Alert, AlertTitle } from '@mui/material';
// import { useState } from 'react';
// import { useSignalR } from '../hooks/useSignalR';
// import type { ChangeQueueStatusResponse, TicketResponse } from '../type';

// interface NotificationState {
//     open: boolean;
//     message: string;
//     severity: 'success' | 'info' | 'warning' | 'error';
//     title?: string;
// }

// export const NotificationManager: React.FC = () => {
//     const [notification, setNotification] = useState<NotificationState>({
//         open: false,
//         message: '',
//         severity: 'info'
//     });

//     const { useQueueStatusChanged, useRegistrationChanged } = useSignalR();

//     // Handle queue status changes
//     const handleQueueStatusChanged = useCallback((data: ChangeQueueStatusResponse) => {
//         setNotification({
//             open: true,
//             title: 'Queue Status Updated',
//             message: `Ticket #${data.ticketNumber} - ${data.fullName} is now ${data.statusName}`,
//             severity: 'info'
//         });
//     }, []);

//     // Handle new ticket registrations
//     const handleRegistrationChanged = useCallback((data: TicketResponse) => {
//         console.log('🔔 New ticket registration notification:', data);
        
//         setNotification({
//             open: true,
//             title: 'New Ticket Registered',
//             message: `Ticket #${data.ticketNumber} - ${data.fullName} has been registered successfully`,
//             severity: 'success'
//         });
//     }, []);

//     // Register SignalR event listeners
//     useQueueStatusChanged(handleQueueStatusChanged);
//     useRegistrationChanged(handleRegistrationChanged);

//     const handleClose = () => {
//         setNotification(prev => ({ ...prev, open: false }));
//     };

//     return (
//         <Snackbar
//             open={notification.open}
//             autoHideDuration={6000}
//             onClose={handleClose}
//             anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
//         >
//             <Alert 
//                 onClose={handleClose} 
//                 severity={notification.severity} 
//                 sx={{ width: '100%', minWidth: '300px' }}
//             >
//                 {notification.title && <AlertTitle>{notification.title}</AlertTitle>}
//                 {notification.message}
//             </Alert>
//         </Snackbar>
//     );
// };

// export default NotificationManager;