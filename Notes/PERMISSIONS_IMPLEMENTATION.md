# Hệ Thống Phân Quyền - Implementation Summary

## ✅ Đã hoàn thành

Hệ thống phân quyền Role-Based Access Control (RBAC) đã được implement với các tính năng sau:

### 1. Core Components

#### 📁 `src/constants/roles.ts`
- Định nghĩa **UserRole**: Admin, User
- Định nghĩa **Permission**: VIEW_ADMIN_REGISTRATION, VIEW_DEVICE_MAPPING, EDIT_DEVICE_MAPPING
- **ROLE_PERMISSIONS mapping**: Map roles với permissions
- Utility functions: `getPermissionsForRole`, `hasPermission`, `hasAnyPermission`, `hasAllPermissions`

#### 📁 `src/hooks/usePermission.ts`
Hook để check permissions trong components:
- `can(permission)` - Check single permission
- `canAny(permissions[])` - Check any of permissions (OR logic)
- `canAll(permissions[])` - Check all permissions (AND logic)
- `isAdmin()` - Check if user is admin
- `hasRole(role)` - Check specific role

#### 📁 `src/components/RoleBasedRoute.tsx`
Component bảo vệ routes dựa trên permissions:
- Redirect về login nếu chưa authenticate
- Check permissions trước khi render route
- Hiển thị trang "Access Denied" nếu không có quyền
- Chặn cả khi paste URL trực tiếp vào browser

Props:
```tsx
<RoleBasedRoute
  requiredPermission={Permission.VIEW_DEVICE_MAPPING}  // Single permission
  requiredPermissions={[...]}  // Multiple permissions
  requireAll={true}  // Require all or any
  fallbackPath="/admin-registration"  // Redirect path
  showAccessDenied={true}  // Show access denied page
>
  <YourPage />
</RoleBasedRoute>
```

#### 📁 `src/components/PermissionGuard.tsx`
Component ẩn/hiện UI elements dựa trên permissions:
- Ẩn buttons, menu items, sections mà user không có quyền
- Support fallback UI khi không có quyền

Props:
```tsx
<PermissionGuard
  requiredPermission={Permission.EDIT_DEVICE_MAPPING}
  fallback={<div>Contact admin for access</div>}
>
  <EditButton />
</PermissionGuard>
```

### 2. Integration với Existing Code

#### ✅ `src/App.tsx`
- Import `RoleBasedRoute` và `Permission`
- Bảo vệ route `/admin-device-mapping` chỉ cho Admin
- User role sẽ bị chặn và thấy trang "Access Denied"

```tsx
<Route path="/admin-device-mapping" element={
  <ProtectedRoute>
    <RoleBasedRoute 
      requiredPermission={Permission.VIEW_DEVICE_MAPPING}
      fallbackPath="/admin-registration"
      showAccessDenied={true}
    >
      <DeviceMappingSettingsPage />
    </RoleBasedRoute>
  </ProtectedRoute>
} />
```

#### ✅ `src/components/layout/SideNav.tsx`
- Tích hợp `usePermission` hook
- Filter menu items dựa trên permissions
- User role chỉ thấy "Registration Management"
- Admin thấy tất cả menu items

### 3. Documentation

#### 📁 `PERMISSIONS_GUIDE.md`
Hướng dẫn đầy đủ và chi tiết:
- Cách sử dụng từng component
- Ví dụ thực tế
- Best practices
- Cách mở rộng thêm roles và permissions
- Troubleshooting

## 🎯 Tính năng chính

### ✅ Chặn User không cho vào DeviceMappingSettingsPage
- User không thấy menu item "Device Mapping Settings" trong sidebar
- Nếu paste URL `/admin-device-mapping` vào browser → Hiển thị trang "Access Denied"
- Admin có full access

### ✅ Dễ dàng mở rộng
Để thêm role mới hoặc permission mới:

1. **Thêm Permission mới** trong `src/constants/roles.ts`:
```typescript
export const Permission = {
  // Existing
  VIEW_ADMIN_REGISTRATION: 'view_admin_registration',
  VIEW_DEVICE_MAPPING: 'view_device_mapping',
  EDIT_DEVICE_MAPPING: 'edit_device_mapping',
  
  // New permissions
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  MANAGE_USERS: 'manage_users',
} as const;
```

2. **Thêm Role mới** trong `src/constants/roles.ts`:
```typescript
export const UserRole = {
  ADMIN: 'Admin',
  USER: 'User',
  MANAGER: 'Manager',  // New role
  VIEWER: 'Viewer',    // New role
} as const;
```

3. **Update ROLE_PERMISSIONS mapping**:
```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // All permissions
  ],
  [UserRole.MANAGER]: [
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    // ...
  ],
  [UserRole.USER]: [
    Permission.VIEW_ADMIN_REGISTRATION,
  ],
  [UserRole.VIEWER]: [
    // Read-only permissions
  ],
};
```

4. **Áp dụng vào routes và components** như đã làm với DeviceMapping

## 🔒 Security Flow

```
User Login
    ↓
Backend returns JWT token with role claim
    ↓
Frontend extracts role from token
    ↓
AuthContext stores user, token, role
    ↓
usePermission hook checks permissions based on role
    ↓
RoleBasedRoute/PermissionGuard grants/denies access
```

**⚠️ Lưu ý quan trọng:**
- Frontend permissions chỉ là UX layer
- Backend PHẢI validate permissions cho mọi API call
- JWT token phải được verify ở backend

## 📊 Current Permissions Matrix

| Role  | View Admin Registration | View Device Mapping | Edit Device Mapping |
|-------|------------------------|---------------------|---------------------|
| Admin | ✅ Yes                  | ✅ Yes               | ✅ Yes               |
| User  | ✅ Yes                  | ❌ No                | ❌ No                |

## 🚀 Testing Scenarios

### Test Case 1: Admin User
1. Login với role "Admin"
2. Thấy cả 2 menu items trong sidebar
3. Click vào "Device Mapping Settings" → Navigate thành công
4. Paste `/admin-device-mapping` vào URL → Access granted

### Test Case 2: Normal User
1. Login với role "User"  
2. Chỉ thấy "Registration Management" trong sidebar
3. KHÔNG thấy "Device Mapping Settings"
4. Paste `/admin-device-mapping` vào URL → Hiển thị "Access Denied" page với options:
   - "Go to Home" button → Navigate về /admin-registration
   - "Go Back" button → Quay lại trang trước

### Test Case 3: Unauthenticated User
1. Chưa login
2. Paste `/admin-device-mapping` vào URL → Redirect về /login

## 🔄 Extensibility Examples

### Example 1: Thêm trang Reports chỉ Manager và Admin thấy

```typescript
// 1. Add permission
export const Permission = {
  // ...
  VIEW_REPORTS: 'view_reports',
} as const;

// 2. Update ROLE_PERMISSIONS
[UserRole.MANAGER]: [
  Permission.VIEW_ADMIN_REGISTRATION,
  Permission.VIEW_REPORTS,
],

// 3. Add route
<Route path="/reports" element={
  <ProtectedRoute>
    <RoleBasedRoute requiredPermission={Permission.VIEW_REPORTS}>
      <ReportsPage />
    </RoleBasedRoute>
  </ProtectedRoute>
} />

// 4. Add to SideNav
{
  key: 'reports',
  title: 'Reports',
  href: '/reports',
  icon: AssessmentIcon,
  requiredPermission: Permission.VIEW_REPORTS,
}
```

### Example 2: Button Edit chỉ Admin thấy

```tsx
import PermissionGuard from '../components/PermissionGuard';
import { Permission } from '../constants/roles';

function MyPage() {
  return (
    <div>
      <h1>Device List</h1>
      
      {/* View button - all users see */}
      <Button>View</Button>
      
      {/* Edit button - only users with permission see */}
      <PermissionGuard requiredPermission={Permission.EDIT_DEVICE_MAPPING}>
        <Button>Edit</Button>
      </PermissionGuard>
    </div>
  );
}
```

### Example 3: Conditional logic

```tsx
function DevicePage() {
  const { can, isAdmin } = usePermission();

  const handleDelete = () => {
    if (!isAdmin()) {
      alert('Only admin can delete');
      return;
    }
    // Proceed with delete
  };

  return (
    <div>
      {can(Permission.EDIT_DEVICE_MAPPING) && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
    </div>
  );
}
```

## 📝 Next Steps (Optional Enhancements)

Các tính năng có thể thêm trong tương lai:

1. **Dynamic Permissions từ Backend**
   - Fetch permissions từ API thay vì hardcode
   - Cache permissions trong localStorage

2. **Permission Hierarchy**
   - Parent-child permissions
   - Inherited permissions

3. **UI Feedback**
   - Tooltip khi hover vào disabled buttons
   - Toast message khi access denied

4. **Audit Log**
   - Log mọi permission check
   - Track unauthorized access attempts

5. **Role Management UI**
   - Admin page để manage roles và permissions
   - Assign permissions to users

## 📚 Files Created/Modified

### Created:
- ✅ `src/constants/roles.ts`
- ✅ `src/hooks/usePermission.ts`
- ✅ `src/components/RoleBasedRoute.tsx`
- ✅ `src/components/PermissionGuard.tsx`
- ✅ `PERMISSIONS_GUIDE.md`
- ✅ `PERMISSIONS_IMPLEMENTATION.md` (this file)

### Modified:
- ✅ `src/App.tsx`
- ✅ `src/components/layout/SideNav.tsx`

### No changes needed:
- ✅ `src/contexts/AuthContext.tsx` (already has role support)
- ✅ `src/components/ProtectedRoute.tsx` (works as-is)

## ✨ Summary

Hệ thống phân quyền đã được implement với:
- ✅ 2 roles: Admin, User
- ✅ 3 permissions: VIEW_ADMIN_REGISTRATION, VIEW_DEVICE_MAPPING, EDIT_DEVICE_MAPPING
- ✅ User bị chặn khỏi DeviceMappingSettingsPage (cả menu và URL paste)
- ✅ Dễ dàng mở rộng thêm roles và permissions
- ✅ Documentation đầy đủ
- ✅ Type-safe với TypeScript
- ✅ Reusable components và hooks

Hệ thống sẵn sàng để production và dễ dàng scale khi cần thêm roles/permissions mới! 🎉
