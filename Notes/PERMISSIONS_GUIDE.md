# Hệ thống Phân Quyền (Role-Based Access Control)

## Tổng quan

Hệ thống phân quyền được thiết kế để quản lý quyền truy cập của người dùng dựa trên vai trò (role) và quyền hạn (permissions) một cách linh hoạt và có thể mở rộng.

## Cấu trúc

### 1. Roles (Vai trò)
Hiện tại có 2 roles:
- **Admin**: Toàn quyền truy cập
- **User**: Quyền hạn giới hạn

### 2. Permissions (Quyền hạn)
Các quyền được định nghĩa chi tiết cho từng chức năng:
- `VIEW_ADMIN_REGISTRATION`: Xem trang đăng ký admin
- `VIEW_DEVICE_MAPPING`: Xem trang cấu hình thiết bị
- `EDIT_DEVICE_MAPPING`: Chỉnh sửa cấu hình thiết bị

## Cách sử dụng

### 1. Bảo vệ Route (Page-level)

Sử dụng `RoleBasedRoute` để bảo vệ toàn bộ trang:

```tsx
import RoleBasedRoute from './components/RoleBasedRoute';
import { Permission } from './constants/roles';

// Trong App.tsx hoặc Router
<Route path="/device-mapping" element={
  <ProtectedRoute>
    <RoleBasedRoute 
      requiredPermission={Permission.VIEW_DEVICE_MAPPING}
      fallbackPath="/admin-registration"
      showAccessDenied={true}
    >
      <DeviceMappingPage />
    </RoleBasedRoute>
  </ProtectedRoute>
} />
```

**Props của RoleBasedRoute:**
- `requiredPermission`: Permission đơn lẻ cần có
- `requiredPermissions`: Mảng nhiều permissions
- `requireAll`: true = cần tất cả permissions, false = chỉ cần 1 (default: false)
- `fallbackPath`: Đường dẫn redirect khi không có quyền (default: '/admin-registration')
- `showAccessDenied`: Hiển thị trang "Access Denied" thay vì redirect (default: true)

### 2. Bảo vệ UI Elements (Component-level)

Sử dụng `PermissionGuard` để ẩn/hiện các phần tử UI:

```tsx
import PermissionGuard from './components/PermissionGuard';
import { Permission } from './constants/roles';

// Ẩn button nếu không có quyền
<PermissionGuard requiredPermission={Permission.EDIT_DEVICE_MAPPING}>
  <Button onClick={handleEdit}>Edit Device</Button>
</PermissionGuard>

// Hiển thị UI thay thế khi không có quyền
<PermissionGuard 
  requiredPermission={Permission.VIEW_REPORTS}
  fallback={<Typography>Liên hệ admin để được cấp quyền</Typography>}
>
  <ReportsView />
</PermissionGuard>

// Yêu cầu nhiều permissions
<PermissionGuard 
  requiredPermissions={[Permission.VIEW_DEVICE_MAPPING, Permission.EDIT_DEVICE_MAPPING]}
  requireAll={true}
>
  <AdvancedEditPanel />
</PermissionGuard>
```

### 3. Check Permissions trong Code

Sử dụng hook `usePermission`:

```tsx
import { usePermission } from '../hooks/usePermission';
import { Permission } from '../constants/roles';

function MyComponent() {
  const { can, canAny, canAll, isAdmin } = usePermission();

  // Check permission đơn lẻ
  if (can(Permission.EDIT_DEVICE_MAPPING)) {
    // Cho phép edit
  }

  // Check admin
  if (isAdmin()) {
    // Logic cho admin
  }

  // Check nhiều permissions (OR logic)
  if (canAny([Permission.VIEW_REPORTS, Permission.VIEW_ADMIN_REGISTRATION])) {
    // Có ít nhất 1 permission
  }

  // Check nhiều permissions (AND logic)
  if (canAll([Permission.VIEW_DEVICE_MAPPING, Permission.EDIT_DEVICE_MAPPING])) {
    // Có tất cả permissions
  }

  return <div>...</div>;
}
```

## Mở rộng hệ thống

### 1. Thêm Role mới

Trong `src/constants/roles.ts`:

```typescript
export const UserRole = {
  ADMIN: 'Admin',
  USER: 'User',
  MANAGER: 'Manager',  // ← Thêm role mới
  VIEWER: 'Viewer',    // ← Thêm role mới
} as const;
```

### 2. Thêm Permission mới

Trong `src/constants/roles.ts`:

```typescript
export const Permission = {
  // ... existing permissions
  
  // Report permissions
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // User management permissions
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Settings permissions
  VIEW_SETTINGS: 'view_settings',
  EDIT_SETTINGS: 'edit_settings',
} as const;
```

### 3. Cập nhật ROLE_PERMISSIONS mapping

Trong `src/constants/roles.ts`:

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin có TẤT CẢ permissions
    Permission.VIEW_ADMIN_REGISTRATION,
    Permission.VIEW_DEVICE_MAPPING,
    Permission.EDIT_DEVICE_MAPPING,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
  ],
  
  [UserRole.MANAGER]: [
    // Manager có quyền xem và một số quyền edit
    Permission.VIEW_ADMIN_REGISTRATION,
    Permission.VIEW_DEVICE_MAPPING,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_USERS,
    Permission.VIEW_SETTINGS,
  ],
  
  [UserRole.USER]: [
    // User chỉ có quyền xem cơ bản
    Permission.VIEW_ADMIN_REGISTRATION,
    Permission.VIEW_REPORTS,
  ],
  
  [UserRole.VIEWER]: [
    // Viewer chỉ có quyền xem
    Permission.VIEW_ADMIN_REGISTRATION,
  ],
};
```

## Ví dụ thực tế

### Ví dụ 1: Trang Settings chỉ admin mới vào được

```tsx
// App.tsx
<Route path="/settings" element={
  <ProtectedRoute>
    <RoleBasedRoute 
      requiredPermission={Permission.VIEW_SETTINGS}
      showAccessDenied={true}
    >
      <SettingsPage />
    </RoleBasedRoute>
  </ProtectedRoute>
} />
```

### Ví dụ 2: Button Edit chỉ hiện cho user có quyền

```tsx
// SettingsPage.tsx
<PermissionGuard requiredPermission={Permission.EDIT_SETTINGS}>
  <Button onClick={handleSave}>Save Settings</Button>
</PermissionGuard>
```

### Ví dụ 3: Menu item hiển thị theo permission

```tsx
// Navigation.tsx
import PermissionGuard from '../components/PermissionGuard';
import { Permission } from '../constants/roles';

<List>
  {/* Tất cả user đều thấy */}
  <ListItem button>
    <ListItemText primary="Dashboard" />
  </ListItem>

  {/* Chỉ user có permission mới thấy */}
  <PermissionGuard requiredPermission={Permission.VIEW_DEVICE_MAPPING}>
    <ListItem button>
      <ListItemText primary="Device Mapping" />
    </ListItem>
  </PermissionGuard>

  <PermissionGuard requiredPermission={Permission.VIEW_REPORTS}>
    <ListItem button>
      <ListItemText primary="Reports" />
    </ListItem>
  </PermissionGuard>

  {/* Chỉ admin thấy */}
  <PermissionGuard requiredPermission={Permission.MANAGE_USERS}>
    <ListItem button>
      <ListItemText primary="User Management" />
    </ListItem>
  </PermissionGuard>
</List>
```

### Ví dụ 4: Conditional logic trong component

```tsx
function DeviceMappingPage() {
  const { can, isAdmin } = usePermission();
  const [devices, setDevices] = useState([]);

  const handleEdit = (device) => {
    if (!can(Permission.EDIT_DEVICE_MAPPING)) {
      alert('You do not have permission to edit');
      return;
    }
    // Proceed with edit
  };

  const handleDelete = (device) => {
    if (!isAdmin()) {
      alert('Only admin can delete');
      return;
    }
    // Proceed with delete
  };

  return (
    <div>
      {devices.map(device => (
        <div key={device.id}>
          <span>{device.name}</span>
          
          <PermissionGuard requiredPermission={Permission.EDIT_DEVICE_MAPPING}>
            <Button onClick={() => handleEdit(device)}>Edit</Button>
          </PermissionGuard>
          
          <PermissionGuard requiredPermission={Permission.EDIT_DEVICE_MAPPING}>
            <Button onClick={() => handleDelete(device)}>Delete</Button>
          </PermissionGuard>
        </div>
      ))}
    </div>
  );
}
```

## Best Practices

### 1. Nguyên tắc thiết kế permissions
- **Granular permissions**: Tạo permissions chi tiết cho từng action (view, create, edit, delete)
- **Feature-based**: Nhóm permissions theo tính năng (Reports, Users, Settings, etc.)
- **Least privilege**: Chỉ cấp quyền tối thiểu cần thiết

### 2. Khi nào dùng RoleBasedRoute vs PermissionGuard?
- **RoleBasedRoute**: Bảo vệ toàn bộ trang/route, chặn người dùng không có quyền
- **PermissionGuard**: Ẩn/hiện UI elements trong trang, UX tốt hơn

### 3. Khi nào dùng usePermission hook?
- Khi cần logic phức tạp dựa trên permissions
- Khi cần check permissions trong handlers/functions
- Khi cần combine nhiều điều kiện permissions

### 4. Security considerations
- **Frontend check chỉ là UX**: Luôn validate permissions ở backend
- **Token validation**: Backend phải verify JWT token và permissions
- **API authorization**: Mỗi API endpoint phải check permissions

## Migration và Backward Compatibility

Nếu có code cũ đang dùng cách check role trực tiếp:

```tsx
// ❌ Cách cũ (không nên dùng)
const { role } = useAuth();
if (role === 'Admin') {
  // show admin features
}

// ✅ Cách mới (nên dùng)
const { isAdmin, can } = usePermission();
if (isAdmin()) {
  // show admin features
}
// hoặc
if (can(Permission.ADMIN_FEATURE)) {
  // show admin features
}
```

## Troubleshooting

### Vấn đề: User được redirect về login khi paste URL
**Nguyên nhân**: Token không được lưu hoặc đã hết hạn

**Giải pháp**: Check AuthContext và localStorage

### Vấn đề: User không thấy trang Access Denied
**Nguyên nhân**: `showAccessDenied={false}` hoặc đang dùng redirect

**Giải pháp**: Set `showAccessDenied={true}` trong RoleBasedRoute

### Vấn đề: Permission không được cập nhật sau khi login
**Nguyên nhân**: Role không được extract đúng từ JWT token

**Giải pháp**: Check `parseJwt` function trong AuthContext

## Changelog

### Version 1.0.0 (Current)
- Initial implementation
- Support Admin và User roles
- Basic permissions cho Admin Registration và Device Mapping
- RoleBasedRoute component
- PermissionGuard component
- usePermission hook
