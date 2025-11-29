import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7, SettingsBrightness } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggleButton: React.FC = () => {
  const { mode, appliedTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    if (mode === 'system') {
      return <SettingsBrightness />;
    }
    return appliedTheme === 'light' ? <Brightness4 /> : <Brightness7 />;
  };

  const getTooltip = () => {
    if (mode === 'system') {
      return `System theme (currently ${appliedTheme}) - Click to switch`;
    }
    return `Switch to ${appliedTheme === 'light' ? 'dark' : 'light'} mode`;
  };

  return (
    <Tooltip title={getTooltip()}>
      <IconButton 
        onClick={toggleTheme} 
        color="inherit"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
};