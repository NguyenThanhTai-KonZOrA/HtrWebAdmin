import React, { useState, useEffect } from 'react';
import { Alert, Box, Typography, Slide, IconButton } from '@mui/material';
import { WifiOff, Close } from '@mui/icons-material';

interface NetworkAlertProps {
  isOnline: boolean;
  isConnected: boolean;
  connectionType?: string;
}

const NetworkAlert: React.FC<NetworkAlertProps> = ({ 
  isOnline, 
  isConnected, 
  connectionType 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  // Tự động hiện lại khi network status thay đổi
  useEffect(() => {
    if (!isOnline || !isConnected) {
      setIsVisible(true);
      setHasBeenDismissed(false);
    } else {
      // Tự động ẩn khi kết nối lại
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isConnected]);

  const handleClose = () => {
    setIsVisible(false);
    setHasBeenDismissed(true);
  };

  // Không hiển thị nếu mạng OK hoặc user đã tắt
  if ((isOnline && isConnected) || !isVisible || hasBeenDismissed) {
    return null;
  }

  const getAlertInfo = () => {
    if (!isOnline) {
      return {
        severity: 'error' as const,
        icon: <WifiOff />,
        title: 'Can not connect to the internet',
        message: 'Please check your internet connection and try again.'
      };
    }

    // if (!isConnected) {
    //   return {
    //     severity: 'warning' as const,
    //     icon: <WifiOff />,
    //     title: 'Kết nối mạng không ổn định',
    //     message: 'Kết nối đến server có vấn đề. Một số tính năng có thể không hoạt động.'
    //   };
    // }

    return null;
  };

  const alertInfo = getAlertInfo();

  if (!alertInfo) return null;

  return (
    <Slide direction="down" in={isVisible} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          p: 1,
        }}
      >
        <Alert
          severity={alertInfo.severity}
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: alertInfo.severity === 'error' ? '1px solid #f44336' : '1px solid #ff9800',
          }}
          icon={alertInfo.icon}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
        >
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
              {alertInfo.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {alertInfo.message}
            </Typography>
            {connectionType && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                Connection Type : Internal Network
              </Typography>
            )}
          </Box>
        </Alert>
      </Box>
    </Slide>
  );
};

export default NetworkAlert;