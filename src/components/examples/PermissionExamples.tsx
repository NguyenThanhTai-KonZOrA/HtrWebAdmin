// src/components/examples/PermissionExamples.tsx
/**
 * ⚠️ FILE NÀY CHỈ LÀ VÍ DỤ - KHÔNG SỬ DỤNG TRONG PRODUCTION
 * 
 * File này chứa các ví dụ về cách sử dụng hệ thống phân quyền.
 * Bạn có thể tham khảo và copy code từ đây vào components thực tế.
 */

import React from 'react';
import { Box, Button, Typography, Paper, Stack, Divider } from '@mui/material';
import { usePermission } from '../../hooks/usePermission';
import { Permission } from '../../constants/roles';
import PermissionGuard from '../PermissionGuard';

/**
 * Example 1: Hiển thị thông tin role và permissions của user hiện tại
 */
export function UserPermissionsInfo() {
  const { role, can, isAdmin } = usePermission();

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Current User Info
      </Typography>
      
      <Stack spacing={1}>
        <Typography>
          <strong>Role:</strong> {role || 'No role'}
        </Typography>
        
        <Typography>
          <strong>Is Admin:</strong> {isAdmin() ? '✅ Yes' : '❌ No'}
        </Typography>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="subtitle2">Permissions:</Typography>
        
        <Typography>
          View Admin Registration: {can(Permission.VIEW_ADMIN_REGISTRATION) ? '✅' : '❌'}
        </Typography>
        
        <Typography>
          View Device Mapping: {can(Permission.VIEW_DEVICE_MAPPING) ? '✅' : '❌'}
        </Typography>
        
        <Typography>
          Edit Device Mapping: {can(Permission.VIEW_ADMIN_REGISTRATION) ? '✅' : '❌'}
        </Typography>
      </Stack>
    </Paper>
  );
}

/**
 * Example 2: Buttons với permission guards
 */
export function ButtonsWithPermissions() {
  const handleView = () => alert('View action');
  const handleEdit = () => alert('Edit action');
  const handleDelete = () => alert('Delete action');

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Buttons with Permissions
      </Typography>
      
      <Stack direction="row" spacing={2}>
        {/* Button này LUÔN hiển thị - không cần permission */}
        <Button variant="outlined" onClick={handleView}>
          View (No Permission Required)
        </Button>
        
        {/* Button này CHỈ hiển thị nếu có permission EDIT_DEVICE_MAPPING */}
        <PermissionGuard requiredPermission={Permission.VIEW_ADMIN_REGISTRATION}>
          <Button variant="contained" onClick={handleEdit}>
            Edit (Admin Only)
          </Button>
        </PermissionGuard>
        
        {/* Button này CHỈ hiển thị nếu có permission EDIT_DEVICE_MAPPING */}
        <PermissionGuard requiredPermission={Permission.VIEW_ADMIN_REGISTRATION}>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete (Admin Only)
          </Button>
        </PermissionGuard>
      </Stack>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        💡 User role sẽ chỉ thấy button "View". Admin sẽ thấy cả 3 buttons.
      </Typography>
    </Paper>
  );
}

/**
 * Example 3: Section với fallback message
 */
export function SectionWithFallback() {
  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Section with Fallback
      </Typography>
      
      <PermissionGuard
        requiredPermission={Permission.VIEW_DEVICE_MAPPING}
        fallback={
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: 'error.light', 
              borderRadius: 1,
              textAlign: 'center'
            }}
          >
            <Typography color="error.dark">
              🔒 You don't have permission to view this section.
              <br />
              Please contact administrator for access.
            </Typography>
          </Box>
        }
      >
        <Box sx={{ p: 3, bgcolor: 'success.light', borderRadius: 1 }}>
          <Typography color="success.dark">
            ✅ Advanced Settings Section (Admin Only)
            <br />
            This section is only visible to users with VIEW_DEVICE_MAPPING permission.
          </Typography>
        </Box>
      </PermissionGuard>
    </Paper>
  );
}

/**
 * Example 4: Conditional rendering với usePermission hook
 */
export function ConditionalContent() {
  const { can, isAdmin } = usePermission();

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Conditional Content
      </Typography>
      
      <Stack spacing={2}>
        {/* Content luôn hiển thị */}
        <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography>
            📄 Basic Content - Visible to all users
          </Typography>
        </Box>
        
        {/* Content chỉ hiển thị nếu có permission */}
        {can(Permission.VIEW_DEVICE_MAPPING) && (
          <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography>
              🔧 Device Configuration - Visible to users with VIEW_DEVICE_MAPPING
            </Typography>
          </Box>
        )}
        
        {/* Content chỉ hiển thị cho Admin */}
        {isAdmin() && (
          <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography>
              👑 Admin-only Content - Visible only to administrators
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * Example 5: Function với permission check
 */
export function ActionsWithPermissionCheck() {
  const { can, isAdmin } = usePermission();

  const handleEditDevice = () => {
    // Check permission trước khi thực hiện action
    if (!can(Permission.VIEW_AUDIT_LOGS)) {
      alert('❌ You do not have permission to edit devices');
      return;
    }
    
    // Proceed with action
    alert('✅ Editing device...');
  };

  const handleDeleteAll = () => {
    // Check admin trước khi thực hiện action nguy hiểm
    if (!isAdmin()) {
      alert('❌ Only administrators can delete all devices');
      return;
    }
    
    // Proceed with action
    alert('✅ Deleting all devices...');
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Actions with Permission Check
      </Typography>
      
      <Stack direction="row" spacing={2}>
        <Button 
          variant="outlined" 
          onClick={handleEditDevice}
        >
          Edit Device (Check Inside)
        </Button>
        
        <Button 
          variant="outlined" 
          color="error"
          onClick={handleDeleteAll}
        >
          Delete All (Check Inside)
        </Button>
      </Stack>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        💡 Các button này LUÔN hiển thị nhưng sẽ check permission trong handler.
        <br />
        User role sẽ thấy alert message khi click.
      </Typography>
    </Paper>
  );
}

/**
 * Main component tổng hợp tất cả examples
 */
export function PermissionExamplesPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Permission System Examples
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Các ví dụ dưới đây minh họa cách sử dụng hệ thống phân quyền.
        Login với role khác nhau để thấy sự khác biệt.
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      <UserPermissionsInfo />
      <ButtonsWithPermissions />
      <SectionWithFallback />
      <ConditionalContent />
      <ActionsWithPermissionCheck />
      
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          📚 Code Examples
        </Typography>
        
        <Typography variant="body2" paragraph>
          Xem source code của file này để biết cách implement:
          <br />
          <code>src/components/examples/PermissionExamples.tsx</code>
        </Typography>
        
        <Typography variant="body2">
          Xem full documentation tại:
          <br />
          <code>PERMISSIONS_GUIDE.md</code>
        </Typography>
      </Paper>
    </Box>
  );
}

export default PermissionExamplesPage;
