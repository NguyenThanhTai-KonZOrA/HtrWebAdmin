# 🧪 Test Scenarios - Hệ Thống Phân Quyền

## 📋 Test Plan Overview

Các test scenarios để verify hệ thống phân quyền hoạt động đúng.

---

## Test Case 1: Admin User Access

### Prerequisites
- Login với user có role = "Admin"
- Token JWT chứa claim role = "Admin"

### Test Steps

#### 1.1 Sidebar Navigation
**Expected:**
- ✅ Thấy menu item "Registration Management"
- ✅ Thấy menu item "Device Mapping Settings"

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 1.2 Direct Access via URL
**Steps:**
1. Paste `/admin-registration` vào browser URL
2. Paste `/admin-device-mapping` vào browser URL

**Expected:**
- ✅ Truy cập thành công `/admin-registration`
- ✅ Truy cập thành công `/admin-device-mapping`
- ✅ Không bị redirect
- ✅ Không thấy "Access Denied" page

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 1.3 Navigation Flow
**Steps:**
1. Click vào "Registration Management"
2. Click vào "Device Mapping Settings"

**Expected:**
- ✅ Navigate thành công giữa các trang
- ✅ Không có error trong console

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 2: Normal User Access

### Prerequisites
- Login với user có role = "User"
- Token JWT chứa claim role = "User"

### Test Steps

#### 2.1 Sidebar Navigation
**Expected:**
- ✅ Thấy menu item "Registration Management"
- ❌ KHÔNG thấy menu item "Device Mapping Settings"

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 2.2 Allowed Page Access
**Steps:**
1. Paste `/admin-registration` vào browser URL

**Expected:**
- ✅ Truy cập thành công
- ✅ Thấy trang Registration Management

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 2.3 Restricted Page Access - URL Paste
**Steps:**
1. Paste `/admin-device-mapping` vào browser URL

**Expected:**
- ❌ KHÔNG được phép truy cập
- ✅ Thấy "Access Denied" page với:
  - Lock icon (🔒)
  - Heading "Access Denied"
  - Message "You don't have permission to access this page"
  - Button "Go to Home"
  - Button "Go Back"

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 2.4 Access Denied Page - "Go to Home" Button
**Steps:**
1. Paste `/admin-device-mapping` vào URL
2. Click button "Go to Home"

**Expected:**
- ✅ Redirect về `/admin-registration`
- ✅ Thấy trang Registration Management

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 2.5 Access Denied Page - "Go Back" Button
**Steps:**
1. Đang ở `/admin-registration`
2. Paste `/admin-device-mapping` vào URL
3. Click button "Go Back"

**Expected:**
- ✅ Quay lại trang `/admin-registration`

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 3: Unauthenticated User

### Prerequisites
- Chưa login / Đã logout
- Không có token trong localStorage

### Test Steps

#### 3.1 Access Protected Routes
**Steps:**
1. Paste `/admin-registration` vào URL (chưa login)
2. Paste `/admin-device-mapping` vào URL (chưa login)

**Expected:**
- ✅ Redirect về `/login` cho cả 2 URLs
- ✅ Không thấy nội dung của protected pages

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 3.2 Login Flow
**Steps:**
1. Vào `/login`
2. Login với credentials hợp lệ
3. Check redirect

**Expected:**
- ✅ Sau khi login thành công, redirect về trang được request trước đó
- ✅ Hoặc redirect về default page nếu không có return URL

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 4: Permission Changes (Session)

### Prerequisites
- Đã login với role "User"

### Test Steps

#### 4.1 Token Expiry / Role Change
**Steps:**
1. Login với role "User"
2. Backend thay đổi role thành "Admin" (hoặc token hết hạn)
3. Logout và login lại

**Expected:**
- ✅ Sau khi login lại với role "Admin", thấy thêm menu items mới
- ✅ Có thể truy cập `/admin-device-mapping`

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 5: UI Components with Permissions

### Prerequisites
- Có trang demo với PermissionGuard examples

### Test Steps

#### 5.1 PermissionGuard - Hide Buttons
**Steps:**
1. Login với role "User"
2. Vào trang có buttons được bảo vệ bởi PermissionGuard

**Expected:**
- ✅ Buttons yêu cầu EDIT_DEVICE_MAPPING permission bị ẩn
- ✅ Buttons không yêu cầu permission vẫn hiển thị

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 5.2 PermissionGuard with Fallback
**Steps:**
1. Login với role "User"
2. Vào section có fallback message

**Expected:**
- ✅ Thấy fallback message thay vì protected content
- ✅ Fallback message rõ ràng và hữu ích

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 6: Edge Cases

#### 6.1 Invalid Role in Token
**Steps:**
1. Token có role = "InvalidRole" (không tồn tại trong system)

**Expected:**
- ✅ User không có permissions nào
- ✅ Bị chặn khỏi mọi protected routes
- ✅ Không crash application

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 6.2 Missing Role in Token
**Steps:**
1. Token không chứa role claim

**Expected:**
- ✅ Xử lý gracefully (không crash)
- ✅ Coi như user không có permissions
- ✅ Bị chặn khỏi protected routes

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 6.3 Browser Back/Forward with Restricted Pages
**Steps:**
1. Login với Admin, vào `/admin-device-mapping`
2. Logout
3. Login với User
4. Click browser Back button

**Expected:**
- ✅ Không cache trang admin trước đó
- ✅ Hiển thị "Access Denied" hoặc redirect về login

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 7: Multiple Tabs Behavior

#### 7.1 Logout in One Tab
**Steps:**
1. Mở 2 tabs cùng login với Admin
2. Logout ở tab 1
3. Check tab 2

**Expected:**
- ✅ Tab 2 tự động detect logout (via storage event)
- ✅ Tab 2 redirect về login hoặc update UI

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 8: Performance

#### 8.1 Permission Check Performance
**Steps:**
1. Render page có nhiều PermissionGuard components
2. Check render time

**Expected:**
- ✅ Không có lag đáng kể
- ✅ usePermission hook không gây re-render không cần thiết

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 9: Developer Experience

#### 9.1 TypeScript IntelliSense
**Steps:**
1. Type `Permission.` trong VSCode
2. Check autocomplete

**Expected:**
- ✅ Thấy suggestions cho tất cả available permissions
- ✅ TypeScript không có errors

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

#### 9.2 Error Messages
**Steps:**
1. Sử dụng permission không tồn tại
2. Check console errors

**Expected:**
- ✅ TypeScript compile error nếu permission không tồn tại
- ✅ Clear error messages

**Actual:** _________________

**Status:** ⬜ Pass / ⬜ Fail

---

## Summary Report Template

### Test Execution Date: _______________
### Tester: _______________
### Environment: ⬜ Dev / ⬜ Staging / ⬜ Production

### Results Summary

| Test Case | Total | Passed | Failed | Blocked |
|-----------|-------|--------|--------|---------|
| TC1: Admin Access | 3 | ___ | ___ | ___ |
| TC2: User Access | 5 | ___ | ___ | ___ |
| TC3: Unauthenticated | 2 | ___ | ___ | ___ |
| TC4: Permission Changes | 1 | ___ | ___ | ___ |
| TC5: UI Components | 2 | ___ | ___ | ___ |
| TC6: Edge Cases | 3 | ___ | ___ | ___ |
| TC7: Multiple Tabs | 1 | ___ | ___ | ___ |
| TC8: Performance | 1 | ___ | ___ | ___ |
| TC9: Developer Experience | 2 | ___ | ___ | ___ |
| **TOTAL** | **20** | ___ | ___ | ___ |

### Pass Rate: ____%

### Issues Found
1. _____________________________________
2. _____________________________________
3. _____________________________________

### Notes
_____________________________________________
_____________________________________________
_____________________________________________

---

## Quick Test Checklist ✅

### Admin User Quick Test
- [ ] Thấy 2 menu items
- [ ] Vào được cả 2 pages
- [ ] Không có "Access Denied"

### Normal User Quick Test
- [ ] Chỉ thấy 1 menu item
- [ ] Vào được Registration page
- [ ] Bị chặn khỏi Device Mapping page
- [ ] Thấy "Access Denied" khi paste URL

### Unauthenticated Quick Test
- [ ] Redirect về login khi access protected routes

---

## Automated Test Ideas (Future)

```typescript
// Example Jest test
describe('RoleBasedRoute', () => {
  it('should allow admin to access device mapping', () => {
    // Mock user with admin role
    // Render RoleBasedRoute with Permission.VIEW_DEVICE_MAPPING
    // Expect children to be rendered
  });

  it('should block user from accessing device mapping', () => {
    // Mock user with user role
    // Render RoleBasedRoute with Permission.VIEW_DEVICE_MAPPING
    // Expect AccessDeniedPage to be rendered
  });
});
```

Xem thêm tại: https://testing-library.com/docs/react-testing-library/intro/
