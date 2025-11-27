// src/components/RoleBasedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Lock as LockIcon, Home as HomeIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Permission } from '../constants/roles';
import { usePermission } from '../hooks/usePermission';

interface RoleBasedRouteProps {
    children: React.ReactNode;
    requiredPermission?: Permission;
    requiredPermissions?: Permission[];
    requireAll?: boolean; // true = cần tất cả permissions, false = chỉ cần 1 trong số đó
    fallbackPath?: string; // Redirect path nếu không có quyền
    showAccessDenied?: boolean; // Hiển thị trang Access Denied thay vì redirect
}

/**
 * Component bảo vệ route dựa trên permissions
 * 
 * Usage examples:
 * 
 * 1. Require single permission:
 *    <RoleBasedRoute requiredPermission={Permission.VIEW_DEVICE_MAPPING}>
 *      <DeviceMappingPage />
 *    </RoleBasedRoute>
 * 
 * 2. Require any of multiple permissions:
 *    <RoleBasedRoute requiredPermissions={[Permission.VIEW_REPORTS, Permission.VIEW_ADMIN_REGISTRATION]}>
 *      <SomePage />
 *    </RoleBasedRoute>
 * 
 * 3. Require all permissions:
 *    <RoleBasedRoute 
 *      requiredPermissions={[Permission.VIEW_DEVICE_MAPPING, Permission.EDIT_DEVICE_MAPPING]}
 *      requireAll={true}
 *    >
 *      <DeviceMappingPage />
 *    </RoleBasedRoute>
 */
const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
    children,
    requiredPermission,
    requiredPermissions,
    requireAll = false,
    fallbackPath = '/admin-registration',
    showAccessDenied = true,
}) => {
    const { token } = useAuth();
    const { can, canAny, canAll } = usePermission();
    const location = useLocation();

    // Nếu chưa login, redirect về login
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check permissions
    let hasAccess = true;

    if (requiredPermission) {
        hasAccess = can(requiredPermission);
    } else if (requiredPermissions && requiredPermissions.length > 0) {
        hasAccess = requireAll
            ? canAll(requiredPermissions)
            : canAny(requiredPermissions);
    }

    // Nếu có quyền, render children
    if (hasAccess) {
        return <>{children}</>;
    }

    // Nếu không có quyền và showAccessDenied = true, hiển thị trang Access Denied
    if (showAccessDenied) {
        return <AccessDeniedPage fallbackPath={fallbackPath} />;
    }

    // Nếu không, redirect về fallback path
    return <Navigate to={fallbackPath} replace />;
};

/**
 * Access Denied Page
 */
const AccessDeniedPage: React.FC<{ fallbackPath: string }> = ({ fallbackPath }) => {
    const navigate = (path: string) => {
        window.location.href = path;
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mb: 3,
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: 'error.light',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <LockIcon sx={{ fontSize: 48, color: 'error.dark' }} />
                        </Box>
                    </Box>

                    <Typography variant="h4" fontWeight="bold" gutterBottom color="error">
                        Access Denied
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        You don't have permission to access this page.
                        <br />
                        Please contact your administrator if you believe this is an error.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            startIcon={<HomeIcon />}
                            onClick={() => navigate(fallbackPath)}
                        >
                            Go to Home
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => window.history.back()}
                        >
                            Go Back
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default RoleBasedRoute;
