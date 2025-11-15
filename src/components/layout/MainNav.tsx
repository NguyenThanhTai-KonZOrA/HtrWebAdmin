import * as React from 'react';
import { useState } from 'react';
import {
    IconButton,
    Stack,
    Avatar,
    Tooltip,
    Typography,
    AppBar,
    Toolbar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    Menu as MenuIcon,
    MenuOpen as MenuOpenIcon,
    Logout as LogoutIcon,
    ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { MobileNav } from './MobileNav';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePageTitle } from "../../contexts/PageTitleContext";
import { useSidebar } from "../../contexts/SidebarContext";
import CacheManager from '../CacheManager';

export function MainNav(): React.JSX.Element {
    const [openNav, setOpenNav] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showCacheManager, setShowCacheManager] = useState<boolean>(false);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { title } = usePageTitle();
    const { isCollapsed, toggleSidebar } = useSidebar();

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        console.log('🚪 Triggering global logout...');
        logout();
        navigate("/login");
    };

    const handleClearCache = () => {
        setShowCacheManager(true);
        handleClose();
    };

    return (
        <>
            <AppBar
                position="sticky"
                sx={{
                    backgroundColor: '#fafafa',
                    borderBottom: '1px solid var(--mui-palette-divider)',
                    boxShadow: 'none',
                    color: 'var(--mui-palette-text-primary)',
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: '64px',
                        px: 2,
                    }}
                >
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%'
                        }}
                    >
                        <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                            {/* Toggle Sidebar Button for Desktop */}
                            <Tooltip title={isCollapsed ? "Show Sidebar" : "Hide Sidebar"}>
                                <IconButton
                                    onClick={toggleSidebar}
                                    sx={{ 
                                        display: { xs: 'none', lg: 'inline-flex' },
                                        color: 'inherit',
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                                        }
                                    }}
                                >
                                    {isCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
                                </IconButton>
                            </Tooltip>
                            
                            {/* Mobile Menu Button */}
                            <IconButton
                                onClick={() => setOpenNav(true)}
                                sx={{ display: { lg: 'none' }, color: 'inherit' }}
                            >
                                <MenuIcon />
                            </IconButton>
                            
                            <Typography
                                variant="h5"
                                sx={{
                                    flexGrow: 1,
                                    textAlign: 'center',
                                    color: '#274549',
                                    fontWeight: 700,
                                    fontSize: '1.5rem'
                                }}
                            >
                                {title}
                            </Typography>
                        </Stack>

                        <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                            <Tooltip title="Profile & Settings">
                                <Avatar
                                    onClick={handleClick}
                                    sx={{
                                        cursor: 'pointer',
                                        width: 40,
                                        height: 40,
                                        bgcolor: '#274549'
                                    }}
                                >
                                    Hi!
                                </Avatar>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                sx={{
                    mt: 1,
                    '& .MuiPaper-root': {
                        borderRadius: 2,
                        minWidth: 200,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    },
                }}
            >
                <MenuItem onClick={handleClearCache}>
                    <ListItemIcon>
                        <ClearAllIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Clear Cache</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Sign out</ListItemText>
                </MenuItem>
            </Menu>
            <MobileNav
                onClose={() => setOpenNav(false)}
                open={openNav}
            />

            <CacheManager
                showButton={false}
                isOpen={showCacheManager}
                onClose={() => setShowCacheManager(false)}
            />
        </>
    );
}