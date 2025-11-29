import React from 'react';
import {
  ListItemIcon,
  ListItemText,
  MenuItem,
  Box,
  Typography,
  alpha,
} from '@mui/material';
import {
  Brightness7 as LightIcon,
  Brightness4 as DarkIcon,
  SettingsBrightness as SystemIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  label: string;
  icon: React.ReactNode;
  description: string;
  previewColors: {
    bg: string;
    text: string;
  };
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    icon: <LightIcon />,
    description: 'Bright and clean interface',
    previewColors: {
      bg: '#ffffff',
      text: '#274549',
    },
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: <DarkIcon />,
    description: 'Easy on the eyes',
    previewColors: {
      bg: '#1e293b',
      text: '#f1f5f9',
    },
  },
  {
    value: 'system',
    label: 'System',
    icon: <SystemIcon />,
    description: 'Match your device settings',
    previewColors: {
      bg: 'linear-gradient(135deg, #ffffff 50%, #1e293b 50%)',
      text: '#274549',
    },
  },
];

interface ThemeSelectorProps {
  onClose?: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose }) => {
  const { mode, setThemeMode } = useTheme();

  const handleThemeChange = (newMode: 'light' | 'dark' | 'system') => {
    setThemeMode(newMode);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
          Theme Appearance
        </Typography>
      </Box>
      {themeOptions.map((option) => {
        const isSelected = mode === option.value;
        return (
          <MenuItem
            key={option.value}
            onClick={() => handleThemeChange(option.value)}
            sx={{
              py: 1.5,
              px: 2,
              gap: 2,
              borderLeft: isSelected ? 3 : 0,
              borderColor: 'primary.main',
              bgcolor: isSelected ? alpha('#274549', 0.08) : 'transparent',
              '&:hover': {
                bgcolor: isSelected
                  ? alpha('#274549', 0.12)
                  : alpha('#274549', 0.04),
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {/* Preview Color Box */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                background: option.previewColors.bg,
                border: '2px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                '&::before': option.value === 'system' ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: option.previewColors.bg,
                } : {},
              }}
            >
              <Box
                sx={{
                  color: option.previewColors.text,
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  fontSize: '1.2rem',
                }}
              >
                {option.icon}
              </Box>
            </Box>

            {/* Text Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={isSelected ? 600 : 500}
                sx={{ mb: 0.25 }}
              >
                {option.label}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  fontSize: '0.75rem',
                }}
              >
                {option.description}
              </Typography>
            </Box>

            {/* Check Icon */}
            {isSelected && (
              <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main' }}>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
          </MenuItem>
        );
      })}
    </>
  );
};
