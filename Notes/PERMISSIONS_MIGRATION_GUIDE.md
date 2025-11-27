# 🔄 Migration Guide - Cập nhật Code Cũ sang Hệ Thống Phân Quyền Mới

## 📋 Tổng quan

Guide này hướng dẫn cách migrate code hiện tại sang hệ thống phân quyền mới.

---

## ⚠️ Breaking Changes

### None!
Hệ thống phân quyền mới **KHÔNG** break code hiện có. Nó thêm layer mới mà không ảnh hưởng đến code cũ.

**Existing code vẫn hoạt động bình thường.**

---

## 🔄 Optional Improvements

Các pattern dưới đây là **recommended** nhưng không bắt buộc.

### Pattern 1: Direct Role Check → usePermission Hook

#### ❌ Old Way (still works, but not recommended)
```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { role } = useAuth();
  
  if (role === 'Admin') {
    // Show admin features
  }
}
```

#### ✅ New Way (recommended)
```tsx
import { usePermission } from '../hooks/usePermission';

function MyComponent() {
  const { isAdmin } = usePermission();
  
  if (isAdmin()) {
    // Show admin features
  }
}
```

**Why better?**
- More semantic
- Easier to test
- Centralized logic
- Future-proof

---

### Pattern 2: Manual Route Protection → RoleBasedRoute

#### ❌ Old Way (works, but verbose)
```tsx
function MyPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (role !== 'Admin') {
      navigate('/');
    }
  }, [role, navigate]);
  
  return <div>Admin Page</div>;
}
```

#### ✅ New Way (cleaner)
```tsx
// In App.tsx
<Route path="/admin-page" element={
  <ProtectedRoute>
    <RoleBasedRoute requiredPermission={Permission.ADMIN_ACCESS}>
      <MyPage />
    </RoleBasedRoute>
  </ProtectedRoute>
} />

// MyPage.tsx
function MyPage() {
  // No need for manual checks
  return <div>Admin Page</div>;
}
```

**Why better?**
- Declarative approach
- Consistent UX (Access Denied page)
- Less boilerplate
- Centralized protection

---

### Pattern 3: Conditional Rendering → PermissionGuard

#### ❌ Old Way (works, but scattered logic)
```tsx
function MyComponent() {
  const { role } = useAuth();
  
  return (
    <div>
      <Button>View</Button>
      
      {role === 'Admin' && (
        <Button>Edit</Button>
      )}
      
      {role === 'Admin' && (
        <Button>Delete</Button>
      )}
    </div>
  );
}
```

#### ✅ New Way (cleaner)
```tsx
import PermissionGuard from '../components/PermissionGuard';
import { Permission } from '../constants/roles';

function MyComponent() {
  return (
    <div>
      <Button>View</Button>
      
      <PermissionGuard requiredPermission={Permission.EDIT}>
        <Button>Edit</Button>
      </PermissionGuard>
      
      <PermissionGuard requiredPermission={Permission.DELETE}>
        <Button>Delete</Button>
      </PermissionGuard>
    </div>
  );
}
```

**Why better?**
- More readable
- Reusable permissions
- Easy to change permission requirements
- Self-documenting code

---

## 📝 Step-by-Step Migration

### Step 1: Identify Code to Migrate
Look for patterns like:
```tsx
// Pattern A: Direct role checks
if (role === 'Admin')
if (role === 'User')

// Pattern B: Manual redirects based on role
navigate('/') if role !== 'Admin'

// Pattern C: Conditional rendering based on role
{role === 'Admin' && <Component />}
```

### Step 2: Choose Migration Strategy

#### Option A: Gradual Migration (Recommended)
- Migrate page by page
- Start with new features
- Update old features when touching them
- No rush, no breaking changes

#### Option B: Big Bang Migration
- Migrate all at once
- More consistent
- Higher risk
- Need thorough testing

### Step 3: Update Imports
```tsx
// Add these imports
import { usePermission } from '../hooks/usePermission';
import { Permission, UserRole } from '../constants/roles';
import PermissionGuard from '../components/PermissionGuard';
```

### Step 4: Replace Patterns

#### For role checks:
```tsx
// Before
const { role } = useAuth();
if (role === 'Admin') { /* ... */ }

// After
const { isAdmin } = usePermission();
if (isAdmin()) { /* ... */ }
```

#### For permission checks:
```tsx
// Before
const { role } = useAuth();
if (role === 'Admin' || role === 'Manager') { /* ... */ }

// After
const { can } = usePermission();
if (can(Permission.VIEW_REPORTS)) { /* ... */ }
```

### Step 5: Test Thoroughly
- Test with different roles
- Check all routes
- Verify UI elements show/hide correctly
- Check Access Denied pages

---

## 🎯 Migration Examples

### Example 1: Admin-only Page

#### Before Migration
```tsx
// pages/AdminSettingsPage.tsx
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function AdminSettingsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (role !== 'Admin') {
      alert('Access denied');
      navigate('/');
    }
  }, [role, navigate]);
  
  return (
    <div>
      <h1>Admin Settings</h1>
      {/* ... */}
    </div>
  );
}
```

#### After Migration
```tsx
// App.tsx
import { Permission } from './constants/roles';
import RoleBasedRoute from './components/RoleBasedRoute';

<Route path="/admin-settings" element={
  <ProtectedRoute>
    <RoleBasedRoute requiredPermission={Permission.ADMIN_SETTINGS}>
      <AdminSettingsPage />
    </RoleBasedRoute>
  </ProtectedRoute>
} />

// pages/AdminSettingsPage.tsx (simplified!)
function AdminSettingsPage() {
  // No need for manual checks anymore!
  return (
    <div>
      <h1>Admin Settings</h1>
      {/* ... */}
    </div>
  );
}

// constants/roles.ts (add permission)
export const Permission = {
  // ... existing
  ADMIN_SETTINGS: 'admin_settings',
} as const;

// ROLE_PERMISSIONS mapping (update)
[UserRole.ADMIN]: [
  // ... existing
  Permission.ADMIN_SETTINGS,
],
```

**Result:**
- ✅ Less code in component
- ✅ Consistent UX with Access Denied page
- ✅ Easier to test
- ✅ Permission is reusable

---

### Example 2: Conditional Buttons

#### Before Migration
```tsx
function DeviceListPage() {
  const { role } = useAuth();
  const [devices, setDevices] = useState([]);
  
  const handleDelete = (id) => {
    if (role !== 'Admin') {
      alert('Only admin can delete');
      return;
    }
    // Delete logic
  };
  
  return (
    <div>
      {devices.map(device => (
        <div key={device.id}>
          <span>{device.name}</span>
          
          <Button onClick={() => handleView(device.id)}>View</Button>
          
          {role === 'Admin' && (
            <Button onClick={() => handleEdit(device.id)}>Edit</Button>
          )}
          
          {role === 'Admin' && (
            <Button onClick={() => handleDelete(device.id)}>Delete</Button>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### After Migration
```tsx
import PermissionGuard from '../components/PermissionGuard';
import { Permission } from '../constants/roles';
import { usePermission } from '../hooks/usePermission';

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const { can } = usePermission();
  
  const handleDelete = (id) => {
    // Double-check permission
    if (!can(Permission.DELETE_DEVICE)) {
      alert('Only admin can delete');
      return;
    }
    // Delete logic
  };
  
  return (
    <div>
      {devices.map(device => (
        <div key={device.id}>
          <span>{device.name}</span>
          
          {/* Always visible */}
          <Button onClick={() => handleView(device.id)}>View</Button>
          
          {/* Permission-based visibility */}
          <PermissionGuard requiredPermission={Permission.EDIT_DEVICE}>
            <Button onClick={() => handleEdit(device.id)}>Edit</Button>
          </PermissionGuard>
          
          <PermissionGuard requiredPermission={Permission.DELETE_DEVICE}>
            <Button onClick={() => handleDelete(device.id)}>Delete</Button>
          </PermissionGuard>
        </div>
      ))}
    </div>
  );
}
```

**Result:**
- ✅ More semantic code
- ✅ Reusable permissions
- ✅ Easy to extend (add Manager role later)
- ✅ Self-documenting

---

### Example 3: Navigation Menu

#### Before Migration
```tsx
// components/Sidebar.tsx
function Sidebar() {
  const { role } = useAuth();
  
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      
      {(role === 'Admin' || role === 'Manager') && (
        <Link to="/reports">Reports</Link>
      )}
      
      {role === 'Admin' && (
        <Link to="/settings">Settings</Link>
      )}
    </nav>
  );
}
```

#### After Migration
```tsx
// components/Sidebar.tsx
import PermissionGuard from './PermissionGuard';
import { Permission } from '../constants/roles';

function Sidebar() {
  return (
    <nav>
      {/* Always visible */}
      <Link to="/dashboard">Dashboard</Link>
      
      {/* Permission-based visibility */}
      <PermissionGuard requiredPermission={Permission.VIEW_REPORTS}>
        <Link to="/reports">Reports</Link>
      </PermissionGuard>
      
      <PermissionGuard requiredPermission={Permission.VIEW_SETTINGS}>
        <Link to="/settings">Settings</Link>
      </PermissionGuard>
    </nav>
  );
}
```

**Result:**
- ✅ Cleaner code
- ✅ Permission-based instead of role-based
- ✅ Easy to add new roles (just update ROLE_PERMISSIONS)
- ✅ More flexible

---

## 🧪 Testing After Migration

### Checklist

#### For each migrated page:
- [ ] Test with Admin role → Should work
- [ ] Test with User role → Should show Access Denied (if restricted)
- [ ] Test unauthenticated → Should redirect to login
- [ ] Test URL paste → Should block if no permission

#### For each migrated component:
- [ ] Test buttons visibility with different roles
- [ ] Test action handlers with permission checks
- [ ] Verify no console errors

#### Overall:
- [ ] No breaking changes in existing functionality
- [ ] All tests pass
- [ ] Code coverage maintained or improved

---

## 📚 Reference: Old vs New Patterns

### Permission Checks

| Old Pattern | New Pattern | Notes |
|-------------|-------------|-------|
| `role === 'Admin'` | `isAdmin()` | More semantic |
| `role === 'Admin' \|\| role === 'Manager'` | `can(Permission.VIEW)` | Permission-based |
| `role !== 'User'` | `can(Permission.EDIT)` | Positive logic |

### Route Protection

| Old Pattern | New Pattern | Notes |
|-------------|-------------|-------|
| Manual redirect in useEffect | `<RoleBasedRoute>` | Declarative |
| alert('Access denied') | Access Denied page | Better UX |

### UI Elements

| Old Pattern | New Pattern | Notes |
|-------------|-------------|-------|
| `{role === 'Admin' && <Button />}` | `<PermissionGuard><Button /></PermissionGuard>` | Reusable |

---

## ⚡ Quick Win: Start Here

### Highest Impact, Lowest Effort

1. **New Features** → Use new system from day 1
2. **Pages being refactored** → Migrate during refactor
3. **Bug fixes** → Migrate if touching related code
4. **Admin-only pages** → Quick wins with RoleBasedRoute

### Avoid

- Don't migrate everything at once
- Don't break working code
- Don't migrate without testing
- Don't change role checks in critical paths without thorough testing

---

## 🎯 Success Criteria

Migration is successful when:

- ✅ No breaking changes
- ✅ All tests pass
- ✅ Code is more maintainable
- ✅ Permissions are consistent
- ✅ Easy to add new roles/permissions
- ✅ Better UX (Access Denied pages)
- ✅ Less boilerplate code

---

## 💡 Pro Tips

### Tip 1: Create Permissions Based on Features
```tsx
// Good
Permission.EDIT_DEVICE
Permission.DELETE_DEVICE
Permission.VIEW_REPORTS

// Bad (too coupled to roles)
Permission.ADMIN_ONLY
Permission.USER_ONLY
```

### Tip 2: Use Positive Logic
```tsx
// Good
if (can(Permission.EDIT)) { /* allow */ }

// Bad (negative logic harder to read)
if (!canNot(Permission.EDIT)) { /* allow */ }
```

### Tip 3: One Permission per Action
```tsx
// Good
Permission.VIEW_DEVICE
Permission.EDIT_DEVICE
Permission.DELETE_DEVICE

// Bad (too granular)
Permission.VIEW_DEVICE_NAME
Permission.VIEW_DEVICE_ID
```

### Tip 4: Document Permissions
```tsx
export const Permission = {
  // Device Management
  VIEW_DEVICE: 'view_device',      // Can view device list
  EDIT_DEVICE: 'edit_device',      // Can modify device settings
  DELETE_DEVICE: 'delete_device',  // Can remove devices
  
  // Reports
  VIEW_REPORTS: 'view_reports',    // Can access reports
} as const;
```

---

## 🔧 Troubleshooting Migration Issues

### Issue: "Permission not working"
**Solution:**
1. Check permission spelling
2. Verify ROLE_PERMISSIONS mapping
3. Ensure role is correctly stored in AuthContext

### Issue: "Access Denied page not showing"
**Solution:**
1. Set `showAccessDenied={true}` in RoleBasedRoute
2. Verify RoleBasedRoute is inside ProtectedRoute

### Issue: "Menu items not filtering"
**Solution:**
1. Check usePermission hook usage in navigation
2. Verify requiredPermission is set on nav items
3. Test with different roles

---

## 📖 Further Reading

- [PERMISSIONS_GUIDE.md](./PERMISSIONS_GUIDE.md) - Full documentation
- [PERMISSIONS_QUICK_REFERENCE.md](./PERMISSIONS_QUICK_REFERENCE.md) - Cheat sheet
- [PERMISSIONS_ARCHITECTURE.md](./PERMISSIONS_ARCHITECTURE.md) - Visual diagrams

---

**Migration không cần vội, làm từng bước một! 🚀**
