import * as React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Stack,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Assignment as AssignmentIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    Archive as ArchiveIcon,
    Assessment as AssessmentIcon,
    BarChart as BarChartIcon,
    PersonSearch as PersonSearchIcon,
    PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useSidebar } from '../../contexts/SidebarContext';

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
    //     key: 'employee-report',
    //     title: 'Employee Report',
    //     href: '/employee-report',
    //     icon: PersonSearchIcon
    // },
    // {
    //     key: 'admin-settings',
    //     title: 'System Settings',
    //     href: '/admin-settings',
    //     icon: SettingsIcon
    // },
    // {
    //     key: 'admin-ticket-archived',
    //     title: 'Ticket Archived',
    //     href: '/admin-ticket-archived',
    //     icon: ArchiveIcon
    // },
];

export function SideNav(): React.JSX.Element {
    const location = useLocation();
    const { isCollapsed } = useSidebar();

    return (
        <Box
            sx={{
                bgcolor: '#274549',
                color: 'var(--mui-palette-common-white)',
                display: { xs: 'none', lg: 'flex' },
                flexDirection: 'column',
                height: '100vh',
                left: 0,
                maxWidth: '100%',
                position: 'fixed',
                top: 0,
                width: '280px',
                zIndex: 1100,
                transform: isCollapsed ? 'translateX(-100%)' : 'translateX(0)',
                transition: 'transform 0.3s ease',
            }}
        >
            <Stack spacing={2} sx={{ p: 1 }}>
                <Box sx={{ display: 'inline-center', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ display: 'inline-center' , justifyContent: 'center', alignItems: 'center' }}>
                        <img src="/images/TheGrandHoTram.png" alt="Logo" style={{ height: 90, width: 'auto' }} />
                    </Box>
                </Box>
            </Stack>

              <Stack spacing={1} sx={{ p: 1 }}>
                <Box sx={{ display: 'inline-center', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ display: 'inline-center' , justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                        HTR Admin Portal
                    </Box>
                </Box>
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
        </Box>
    );
}
