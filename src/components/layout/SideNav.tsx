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
    Collapse,
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
    AssessmentTwoTone as AssessmentIcon,
    DrawTwoTone as DrawIcon,
    ManageSearchTwoTone as ManageSearchIcon,
    AppRegistrationRounded as AppRegistrationRoundedIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Folder as FolderIcon,
    Description as DescriptionIcon,
    Security as SecurityIcon,
    Storage as StorageIcon,
    Email as EmailIcon,
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
        requiredPermission: Permission.VIEW_ADMIN_REGISTRATION
    },
    {
        key: 'customer-documents-management',
        title: 'Customer Documents',
        icon: PeopleIcon,
        children: [
            {
                key: 'admin-customer-confirmation',
                title: 'Verification Documents',
                href: '/admin-customer-confirmation',
                icon: DrawIcon,
                requiredPermission: Permission.VIEW_VERIFICATION_DOCUMENT,
            },
            {
                key: 'admin-signed-documents',
                title: 'Customer Signed',
                href: '/admin-signed-documents',
                icon: AppRegistrationRoundedIcon,
                requiredPermission: Permission.VIEW_SIGNED_DOCUMENT_REPORT,
            },
            {
                key: 'admin-migration-income-documents',
                title: 'Income Migration',
                href: '/admin-migration-income-documents',
                icon: CloudSyncIcon,
                requiredPermission: Permission.VIEW_MIGRATION_INCOME,
            },
        ]
    },

    {
        key: 'report',
        title: 'Report',
        icon: AssessmentIcon,
        children: [
            {
                key: 'admin-member-audit-logs',
                title: 'Enrollment Player Logs',
                href: '/admin-member-audit-logs',
                icon: ManageHistoryIcon,
                requiredPermission: Permission.VIEW_REPORTS,
            },
            {
                key: 'admin-registration-report',
                title: 'Registration Report',
                href: '/admin-registration-report',
                icon: AssessmentIcon,
                requiredPermission: Permission.VIEW_REPORTS
            },
        ]
    },
    {
        key: 'device-management',
        title: 'Device Management',
        icon: DevicesIcon,
        children: [
            {
                key: 'admin-device-mapping',
                title: 'Device Settings',
                href: '/admin-device-mapping',
                icon: SettingsIcon,
                requiredPermission: Permission.VIEW_DEVICE_MAPPING,
            },
            {
                key: 'admin-devices',
                title: 'Device Mapping Report',
                href: '/admin-devices',
                icon: DevicesIcon,
                requiredPermission: Permission.VIEW_ROLE_MANAGEMENT,
            },
        ]
    },
    {
        key: 'role-permission',
        title: 'Role & Permission',
        icon: SecurityIcon,
        children: [
            {
                key: 'admin-employees',
                title: 'Employee',
                href: '/admin-employees',
                icon: PeopleIcon,
                requiredPermission: Permission.VIEW_ROLE_MANAGEMENT
            },
            {
                key: 'admin-roles',
                title: 'Role',
                href: '/admin-roles',
                icon: RoleManagementIcon,
                requiredPermission: Permission.VIEW_ROLE_MANAGEMENT
            },
            {
                key: 'admin-permissions',
                title: 'Permission',
                href: '/admin-permissions',
                icon: PermissionManagementIcon,
                requiredPermission: Permission.VIEW_ROLE_MANAGEMENT
            },
        ]
    },
    {
        key: 'admin-audit-logs',
        title: 'Audit Logs',
        href: '/admin-audit-logs',
        icon: ManageSearchIcon,
        requiredPermission: Permission.VIEW_AUDIT_LOGS,
    },
];

export function SideNav(): React.JSX.Element {
    const location = useLocation();
    const { isCollapsed } = useSidebar();
    const { can } = usePermission();
    const activeItemRef = React.useRef<HTMLLIElement>(null);

    // Load initial state from localStorage
    const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem('sideNavOpenGroups');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const toggleGroup = (key: string) => {
        setOpenGroups(prev => {
            const newState = {
                ...prev,
                [key]: !prev[key]
            };
            // Save to localStorage
            localStorage.setItem('sideNavOpenGroups', JSON.stringify(newState));
            return newState;
        });
    };

    // Filter nav items based on permissions
    const filterNavItems = (items: NavItem[]): NavItem[] => {
        return items.filter((item) => {
            // For items with children, filter children first
            if (item.children) {
                const filteredChildren = filterNavItems(item.children);
                // Only show group if it has at least one accessible child
                return filteredChildren.length > 0;
            }

            // If item does not require permission, always show
            if (!item.requiredPermission) {
                return true;
            }

            // Only show if user has permission
            return can(item.requiredPermission);
        }).map(item => {
            // If item has children, return with filtered children
            if (item.children) {
                return {
                    ...item,
                    children: filterNavItems(item.children)
                };
            }
            return item;
        });
    };

    const filteredNavItems = filterNavItems(navItems);

    // Auto-open groups containing active item and scroll to it
    React.useEffect(() => {
        const findAndOpenActiveGroup = (items: NavItem[], parentKey?: string): string | null => {
            for (const item of items) {
                if (item.children) {
                    const foundKey = findAndOpenActiveGroup(item.children, item.key);
                    if (foundKey) {
                        return foundKey;
                    }
                } else if (item.href === location.pathname) {
                    return parentKey || null;
                }
            }
            return null;
        };

        const activeGroupKey = findAndOpenActiveGroup(filteredNavItems);
        if (activeGroupKey && !openGroups[activeGroupKey]) {
            setOpenGroups(prev => {
                const newState = { ...prev, [activeGroupKey]: true };
                localStorage.setItem('sideNavOpenGroups', JSON.stringify(newState));
                return newState;
            });
        }

        // Scroll to active item after a short delay to ensure DOM is ready
        const timer = setTimeout(() => {
            if (activeItemRef.current) {
                activeItemRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    const renderNavItem = (item: NavItem, depth: number = 0) => {
        const Icon = item.icon;

        // If item has children, render as a group
        if (item.children && item.children.length > 0) {
            const isOpen = openGroups[item.key];

            return (
                <React.Fragment key={item.key}>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            onClick={() => toggleGroup(item.key)}
                            sx={{
                                borderRadius: 2,
                                color: 'rgba(255, 255, 255, 0.85)',
                                backgroundColor: 'transparent',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                    '& .expand-icon': {
                                        opacity: 1,
                                    }
                                },
                                py: 1.2,
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
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                }}
                            />
                            <Box
                                className="expand-icon"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: isOpen ? 1 : 0.5,
                                    transition: 'opacity 0.2s ease'
                                }}
                            >
                                {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </Box>
                        </ListItemButton>
                    </ListItem>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.children.map((child) => renderNavItem(child, depth + 1))}
                        </List>
                    </Collapse>
                </React.Fragment>
            );
        }

        // Render as a single item
        const isActive = location.pathname === item.href;
        const paddingLeft = depth > 0 ? 4 + (depth * 2) : 2;

        return (
            <ListItem key={item.key} disablePadding sx={{ mb: depth > 0 ? 0.5 : 1 }} ref={isActive ? activeItemRef : null}>
                <ListItemButton
                    component={RouterLink}
                    to={item.href || '#'}
                    sx={{
                        borderRadius: 2,
                        color: isActive ? 'white' : 'rgba(255, 255, 255, 0.85)',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        backdropFilter: isActive ? 'blur(10px)' : 'none',
                        boxShadow: isActive ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: isActive
                                ? 'rgba(255, 255, 255, 0.2)'
                                : 'rgba(255, 255, 255, 0.08)',
                            transform: depth === 0 ? 'translateX(4px)' : 'none',
                        },
                        py: 1.2,
                        px: 2,
                        pl: paddingLeft,
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
                            fontSize: depth > 0 ? '0.85rem' : '0.9rem',
                            fontWeight: isActive ? 600 : 500,
                        }}
                    />
                </ListItemButton>
            </ListItem>
        );
    };

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
                    {filteredNavItems.map((item) => renderNavItem(item))}
                </List>
            </Box>
        </Box>
    );
}
