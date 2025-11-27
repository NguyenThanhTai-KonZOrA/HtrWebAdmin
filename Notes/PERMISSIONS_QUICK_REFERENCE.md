# 🚀 Quick Reference - Hệ Thống Phân Quyền

## 📋 Cheat Sheet

### 1️⃣ Bảo vệ Route (Page)
```tsx
import RoleBasedRoute from './components/RoleBasedRoute';
import { Permission } from './constants/roles';

<Route path="/device-mapping" element={
  <ProtectedRoute>
    <RoleBasedRoute requiredPermission={Permission.VIEW_DEVICE_MAPPING}>
      <DeviceMappingPage />
    </RoleBasedRoute>
  </ProtectedRoute>
} />
```

### 2️⃣ Ẩn/Hiện UI Element
```tsx
import PermissionGuard from './components/PermissionGuard';
import { Permission } from './constants/roles';

<PermissionGuard requiredPermission={Permission.EDIT_DEVICE_MAPPING}>
  <Button>Edit</Button>
</PermissionGuard>
```

### 3️⃣ Check Permission trong Code
```tsx
import { usePermission } from './hooks/usePermission';
import { Permission } from './constants/roles';

function MyComponent() {
  const { can, isAdmin } = usePermission();

  if (can(Permission.EDIT_DEVICE_MAPPING)) {
    // User có quyền edit
  }

  if (isAdmin()) {
    // User là admin
  }
}
```

### 4️⃣ Thêm Menu Item với Permission
```tsx
// SideNav.tsx
const navItems = [
  {
    key: 'my-page',
    title: 'My Page',
    href: '/my-page',
    icon: MyIcon,
    requiredPermission: Permission.VIEW_MY_PAGE, // ← Thêm dòng này
  },
];
```

## 🎯 Current Roles & Permissions

### Roles
- `UserRole.ADMIN` - Admin (full access)
- `UserRole.USER` - Normal user (limited access)

### Permissions
- `Permission.VIEW_ADMIN_REGISTRATION` - Xem trang registration (Admin + User)
- `Permission.VIEW_DEVICE_MAPPING` - Xem trang device mapping (chỉ Admin)
- `Permission.EDIT_DEVICE_MAPPING` - Sửa device mapping (chỉ Admin)

## ➕ Mở Rộng

### Thêm Permission Mới
```typescript
// src/constants/roles.ts
export const Permission = {
  // Existing...
  VIEW_REPORTS: 'view_reports',      // ← Thêm permission mới
  MANAGE_USERS: 'manage_users',      // ← Thêm permission mới
} as const;
```

### Thêm Role Mới
```typescript
// src/constants/roles.ts
export const UserRole = {
  ADMIN: 'Admin',
  USER: 'User',
  MANAGER: 'Manager',    // ← Thêm role mới
} as const;
```

### Gán Permission cho Role
```typescript
// src/constants/roles.ts
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // All permissions
    Permission.VIEW_ADMIN_REGISTRATION,
    Permission.VIEW_DEVICE_MAPPING,
    Permission.EDIT_DEVICE_MAPPING,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_USERS,
  ],
  [UserRole.MANAGER]: [
    // Some permissions
    Permission.VIEW_ADMIN_REGISTRATION,
    Permission.VIEW_REPORTS,
  ],
  [UserRole.USER]: [
    // Limited permissions
    Permission.VIEW_ADMIN_REGISTRATION,
  ],
};
```

## 🔍 usePermission Hook Methods

| Method | Description | Example |
|--------|-------------|---------|
| `can(permission)` | Check 1 permission | `can(Permission.EDIT)` |
| `canAny([...])` | Check any (OR) | `canAny([Permission.A, Permission.B])` |
| `canAll([...])` | Check all (AND) | `canAll([Permission.A, Permission.B])` |
| `isAdmin()` | Check if admin | `isAdmin()` |
| `hasRole(role)` | Check specific role | `hasRole(UserRole.MANAGER)` |

## 📁 Files Location

```
src/
├── constants/
│   └── roles.ts                    ← Định nghĩa roles & permissions
├── hooks/
│   └── usePermission.ts            ← Hook check permissions
├── components/
│   ├── RoleBasedRoute.tsx          ← Bảo vệ routes
│   ├── PermissionGuard.tsx         ← Ẩn/hiện UI elements
│   └── layout/
│       └── SideNav.tsx             ← Navigation với permissions
└── App.tsx                         ← Routes configuration
```

## ⚡ Common Patterns

### Pattern 1: Admin-only Page
```tsx
<Route path="/admin-panel" element={
  <ProtectedRoute>
    <RoleBasedRoute requiredPermission={Permission.ADMIN_ACCESS}>
      <AdminPanel />
    </RoleBasedRoute>
  </ProtectedRoute>
} />
```

### Pattern 2: Conditional Button
```tsx
<PermissionGuard requiredPermission={Permission.DELETE}>
  <Button color="error" onClick={handleDelete}>Delete</Button>
</PermissionGuard>
```

### Pattern 3: Multiple Permissions (OR)
```tsx
<RoleBasedRoute 
  requiredPermissions={[Permission.EDIT, Permission.ADMIN]}
  requireAll={false}  // OR logic
>
  <EditPage />
</RoleBasedRoute>
```

### Pattern 4: Multiple Permissions (AND)
```tsx
<RoleBasedRoute 
  requiredPermissions={[Permission.VIEW, Permission.EDIT]}
  requireAll={true}  // AND logic
>
  <AdvancedEditPage />
</RoleBasedRoute>
```

## 🔐 Security Notes

- ✅ Frontend checks chỉ là UX
- ✅ Backend PHẢI validate mọi API call
- ✅ JWT token phải có role claim
- ✅ Never trust frontend permissions alone

## 📚 Full Documentation

Xem `PERMISSIONS_GUIDE.md` để biết chi tiết đầy đủ.
