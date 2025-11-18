import * as React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Drawer,
    Stack,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Assignment as AssignmentIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    Archive as ArchiveIcon,
    Assessment as AssessmentIcon,
    BarChart as BarChartIcon,
    Close as CloseIcon,
    PersonAdd as PersonAddIcon
} from '@mui/icons-material';

const navItems = [
    // {
    //     key: 'dashboard',
    //     title: 'Dashboard',
    //     href: '/admin-dashboard',
    //     icon: DashboardIcon
    // },
    // {
    //     key: 'admin-call',
    //     title: 'Counter Terminal',
    //     href: '/admin-call',
    //     icon: AssignmentIcon
    // },
    // {
    //     key: 'admin-counter',
    //     title: 'Counter Report',
    //     href: '/admin-counter',
    //     icon: PeopleIcon
    // },
    {
        key: 'admin-registration',
        title: 'Registration Management',
        href: '/admin-registration',
        icon: PersonAddIcon
    },
    {
        key: 'admin-device-mapping',
        title: 'Device Mapping Settings',
        href: '/admin-device-mapping',
        icon: SettingsIcon
    }
    // {
    //     key: 'admin-issued-processed-by-hour',
    //     title: 'Hourly Report',
    //     href: '/admin-issued-processed-by-hour',
    //     icon: AssessmentIcon
    // },
    // {
    //     key: 'admin-service-report',
    //     title: 'Service Report',
    //     href: '/admin-service-report',
    //     icon: BarChartIcon
    // },
    // {
    //     key: 'admin-ticket-archived',
    //     title: 'Ticket Archived',
    //     href: '/admin-ticket-archived',
    //     icon: ArchiveIcon
    // },
];

interface MobileNavProps {
    onClose: () => void;
    open: boolean;
}

export function MobileNav({ onClose, open }: MobileNavProps): React.JSX.Element {
    const location = useLocation();

    return (
        <Drawer
            anchor="left"
            onClose={onClose}
            open={open}
            PaperProps={{
                sx: {
                    bgcolor: '#274549',
                    color: 'var(--mui-palette-common-white)',
                    width: '320px',
                },
            }}
            sx={{ display: { lg: 'none' } }}
        >
            <Stack spacing={2} sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{ display: 'inline-flex' }}>
                        <img src="/images/TheGrandHoTram.png" alt="Logo" style={{ height: 70, width: 'auto' }} />
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </Stack>

            <Box
                sx={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    flex: '1 1 auto',
                    overflow: 'auto'
                }}
            >
                <List sx={{ p: 1 }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;

                        return (
                            <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    component={RouterLink}
                                    to={item.href}
                                    onClick={onClose}
                                    sx={{
                                        borderRadius: 1,
                                        color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                        backgroundColor: isActive ? 'var(--mui-palette-primary-main)' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: isActive
                                                ? 'var(--mui-palette-primary-dark)'
                                                : 'rgba(255, 255, 255, 0.04)',
                                        },
                                        py: 1,
                                        px: 2,
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: 'inherit',
                                            minWidth: 40,
                                        }}
                                    >
                                        <Icon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.title}
                                        primaryTypographyProps={{
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
        </Drawer>
    );
}
