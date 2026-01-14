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
    Settings as SettingsIcon,
    PersonAdd as PersonAddIcon,
    ManageHistory as ManageHistoryIcon,
    AssignmentInd as RoleManagementIcon,
    VerifiedUser as PermissionManagementIcon,
    People as PeopleIcon,
    CloudSync as CloudSyncIcon,
    Devices as DevicesIcon,
    AssessmentTwoTone as AssessmentIcon
} from '@mui/icons-material';
import { useSidebar } from '../../contexts/SidebarContext';
import { usePermission } from '../../hooks/usePermission';
import { Permission } from '../../constants/roles';
import type { NavItem } from '../../commonType';

const navItems: NavItem[] = [
    {
        key: 'admin-registration',
        title: 'Registration Management',
        href: '/admin-registration',
        icon: PersonAddIcon,
        requiredPermission: Permission.VIEW_ADMIN_REGISTRATION,
    },
    {
        key: 'admin-registration-report',
        title: 'Registration Report',
        href: '/admin-registration-report',
        icon: AssessmentIcon,
        requiredPermission: Permission.VIEW_REPORTS,
    },
    {
        key: 'admin-migration-income-documents',
        title: 'Income Documents Migration',
        href: '/admin-migration-income-documents',
        icon: CloudSyncIcon,
        requiredPermission: Permission.VIEW_MIGRATION_INCOME,
    },
    {
        key: 'admin-device-mapping',
        title: 'Device Mapping Settings',
        href: '/admin-device-mapping',
        icon: SettingsIcon,
        requiredPermission: Permission.VIEW_DEVICE_MAPPING,
    },
    {
        key: 'admin-devices',
        title: 'Device Management',
        href: '/admin-devices',
        icon: DevicesIcon,
        requiredPermission: Permission.VIEW_ROLE_MANAGEMENT,
    },
    {
        key: 'admin-audit-logs',
        title: 'Audit Logs',
        href: '/admin-audit-logs',
        icon: ManageHistoryIcon,
        requiredPermission: Permission.VIEW_AUDIT_LOGS,
    },
    {
        key: 'admin-member-audit-logs',
        title: 'Enrollment Player Logs',
        href: '/admin-member-audit-logs',
        icon: ManageHistoryIcon,
        requiredPermission: Permission.VIEW_REPORTS,
    },
    {
        key: 'admin-employees',
        title: 'Employee Management',
        href: '/admin-employees',
        icon: PeopleIcon,
        requiredPermission: Permission.VIEW_ROLE_MANAGEMENT
    },
    {
        key: 'admin-roles',
        title: 'Role Management',
        href: '/admin-roles',
        icon: RoleManagementIcon,
        requiredPermission: Permission.VIEW_ROLE_MANAGEMENT
    },
    {
        key: 'admin-permissions',
        title: 'Permission Management',
        href: '/admin-permissions',
        icon: PermissionManagementIcon,
        requiredPermission: Permission.VIEW_ROLE_MANAGEMENT
    },
];

export function SideNav(): React.JSX.Element {
    const location = useLocation();
    const { isCollapsed } = useSidebar();
    const { can } = usePermission();

    // Filter nav items base on permissions
    const filteredNavItems = navItems.filter((item) => {
        // If item does not require permission, always show
        if (!item.requiredPermission) {
            return true;
        }
        // Only show if user has permission
        return can(item.requiredPermission);
    });

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
                    <Box sx={{ display: 'inline-center', justifyContent: 'center', alignItems: 'center' }}>
                        <img src="/images/TheGrandHoTram.png" alt="Logo" style={{ height: 90, width: 'auto' }} />
                    </Box>
                </Box>
            </Stack>

            <Stack spacing={1} sx={{ p: 1 }}>
                <Box sx={{ display: 'inline-center', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ display: 'inline-center', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: 20, fontWeight: 'bold' }}>
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
                    {filteredNavItems.map((item) => {
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
