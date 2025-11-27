# 📚 Hệ Thống Phân Quyền - Documentation Index

Chào mừng đến với hệ thống phân quyền Role-Based Access Control (RBAC)!

## 🗂️ Tài liệu có sẵn

### 1. 🚀 [PERMISSIONS_QUICK_REFERENCE.md](./PERMISSIONS_QUICK_REFERENCE.md)
**Bắt đầu từ đây!** Cheat sheet ngắn gọn với các code snippets thường dùng.

**Nội dung:**
- Code examples nhanh
- Current roles & permissions
- Common patterns
- Quick tips

**Dành cho:** Developers cần code nhanh

---

### 2. 📖 [PERMISSIONS_GUIDE.md](./PERMISSIONS_GUIDE.md)
**Hướng dẫn đầy đủ và chi tiết** về cách sử dụng hệ thống phân quyền.

**Nội dung:**
- Tổng quan hệ thống
- Cách sử dụng từng component
- Ví dụ thực tế
- Best practices
- Cách mở rộng hệ thống
- Troubleshooting

**Dành cho:** Developers muốn hiểu sâu về hệ thống

---

### 3. ✅ [PERMISSIONS_IMPLEMENTATION.md](./PERMISSIONS_IMPLEMENTATION.md)
**Tóm tắt implementation** - những gì đã được làm.

**Nội dung:**
- Danh sách components đã tạo
- Tính năng đã implement
- Files created/modified
- Summary của toàn bộ hệ thống

**Dành cho:** Project managers, team leads

---

### 4. 🧪 [PERMISSIONS_TEST_SCENARIOS.md](./PERMISSIONS_TEST_SCENARIOS.md)
**Test cases và scenarios** để verify hệ thống.

**Nội dung:**
- Detailed test cases
- Expected vs Actual results
- Quick test checklist
- Test report template

**Dành cho:** QA testers, developers testing

---

### 5. 💻 [src/components/examples/PermissionExamples.tsx](./src/components/examples/PermissionExamples.tsx)
**Live code examples** - component demo thực tế.

**Nội dung:**
- Working examples của mọi use case
- Có thể chạy và xem kết quả trực tiếp
- Commented code để dễ hiểu

**Dành cho:** Developers học qua ví dụ thực tế

---

## 🎯 Tôi nên đọc tài liệu nào?

### Scenario 1: "Tôi cần code nhanh!"
→ Đọc **PERMISSIONS_QUICK_REFERENCE.md**
- Copy paste code examples
- 5 phút là xong

### Scenario 2: "Tôi cần hiểu cách hoạt động"
→ Đọc **PERMISSIONS_GUIDE.md**
- Hiểu concepts
- Best practices
- 15-20 phút đọc

### Scenario 3: "Tôi cần test hệ thống"
→ Đọc **PERMISSIONS_TEST_SCENARIOS.md**
- Follow test cases
- Check off items
- 30 phút test

### Scenario 4: "Tôi muốn xem code example"
→ Mở **src/components/examples/PermissionExamples.tsx**
- Xem working code
- Run và test thử

### Scenario 5: "Tôi cần overview toàn bộ hệ thống"
→ Đọc **PERMISSIONS_IMPLEMENTATION.md**
- Xem what's done
- Files changed
- Quick summary

---

## 🏗️ Cấu trúc Code

```
src/
├── constants/
│   └── roles.ts                          ← Roles & Permissions definitions
│
├── hooks/
│   └── usePermission.ts                  ← Permission check hook
│
├── components/
│   ├── RoleBasedRoute.tsx                ← Route protection
│   ├── PermissionGuard.tsx               ← UI element protection
│   ├── ProtectedRoute.tsx                ← Auth protection (existing)
│   │
│   ├── layout/
│   │   └── SideNav.tsx                   ← Navigation with permissions
│   │
│   └── examples/
│       └── PermissionExamples.tsx        ← Demo examples
│
├── contexts/
│   └── AuthContext.tsx                   ← Auth state (has role)
│
└── App.tsx                               ← Routes configuration
```

---

## 📝 Quick Start Guide

### Bước 1: Hiểu Concepts (5 phút)
Đọc phần "Tổng quan" trong **PERMISSIONS_GUIDE.md**

### Bước 2: Copy Code (5 phút)
Lấy examples từ **PERMISSIONS_QUICK_REFERENCE.md**

### Bước 3: Test (10 phút)
Follow checklist trong **PERMISSIONS_TEST_SCENARIOS.md**

### Bước 4: Extend (khi cần)
Đọc phần "Mở rộng" trong **PERMISSIONS_GUIDE.md**

**Tổng thời gian: ~20 phút để bắt đầu productive!**

---

## 🔑 Key Concepts Recap

### Roles (Vai trò)
- **Admin**: Full access
- **User**: Limited access
- (Có thể thêm: Manager, Viewer, etc.)

### Permissions (Quyền hạn)
- **VIEW_ADMIN_REGISTRATION**: Xem trang registration
- **VIEW_DEVICE_MAPPING**: Xem trang device mapping
- **EDIT_DEVICE_MAPPING**: Sửa device mapping
- (Có thể thêm theo nhu cầu)

### Components
- **RoleBasedRoute**: Bảo vệ pages/routes
- **PermissionGuard**: Ẩn/hiện UI elements
- **usePermission**: Hook check permissions trong code

---

## 🎓 Learning Path

### Level 1: Beginner
1. Đọc PERMISSIONS_QUICK_REFERENCE.md
2. Copy-paste code examples
3. Test với user có role khác nhau

### Level 2: Intermediate
1. Đọc PERMISSIONS_GUIDE.md đầy đủ
2. Hiểu cách hoạt động của từng component
3. Implement permissions cho feature mới

### Level 3: Advanced
1. Thêm roles và permissions mới
2. Customize Access Denied page
3. Implement advanced patterns (multiple permissions, etc.)

---

## 💡 Common Questions

### Q: Làm sao check xem user có permission không?
**A:** Dùng `usePermission` hook:
```tsx
const { can } = usePermission();
if (can(Permission.EDIT_DEVICE_MAPPING)) {
  // User có quyền
}
```

### Q: Làm sao ẩn button cho user không có quyền?
**A:** Dùng `PermissionGuard`:
```tsx
<PermissionGuard requiredPermission={Permission.EDIT}>
  <Button>Edit</Button>
</PermissionGuard>
```

### Q: Làm sao bảo vệ cả page/route?
**A:** Dùng `RoleBasedRoute`:
```tsx
<Route path="/admin-page" element={
  <ProtectedRoute>
    <RoleBasedRoute requiredPermission={Permission.ADMIN_ACCESS}>
      <AdminPage />
    </RoleBasedRoute>
  </ProtectedRoute>
} />
```

### Q: Làm sao thêm permission mới?
**A:** Xem section "Mở rộng" trong PERMISSIONS_GUIDE.md

---

## 🐛 Troubleshooting

### Issue: User bị redirect về login dù đã login
**Check:**
1. Token có trong localStorage không?
2. Role có được extract đúng từ JWT không?
3. Check console có error không?

### Issue: Permission không hoạt động
**Check:**
1. Role có trong ROLE_PERMISSIONS mapping không?
2. Permission spelling có đúng không?
3. AuthContext có return role không?

### Issue: Access Denied page không hiện
**Check:**
1. `showAccessDenied={true}` có được set không?
2. RoleBasedRoute có được wrap đúng không?

**→ Xem thêm trong PERMISSIONS_GUIDE.md > Troubleshooting**

---

## 🔗 Related Resources

### External Links
- [React Router - Protected Routes](https://reactrouter.com/en/main/start/overview)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)
- [JWT Claims](https://jwt.io/introduction)

### Internal Code
- `src/contexts/AuthContext.tsx` - Authentication logic
- `src/components/ProtectedRoute.tsx` - Auth protection
- `src/services/queueService.ts` - API with token

---

## 📞 Support

### Need Help?
1. Check **PERMISSIONS_GUIDE.md** > Troubleshooting
2. Xem examples trong **PermissionExamples.tsx**
3. Test theo **PERMISSIONS_TEST_SCENARIOS.md**
4. Contact team lead nếu vẫn stuck

### Contributing
- Thêm permissions mới → Update `roles.ts`
- Thêm examples → Update `PermissionExamples.tsx`
- Fix bugs → Update relevant docs

---

## 📊 Documentation Version

**Version:** 1.0.0
**Last Updated:** 2025
**Status:** ✅ Complete & Production Ready

---

## ⭐ Quick Links

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [Quick Reference](./PERMISSIONS_QUICK_REFERENCE.md) | Cheat sheet | 5 min |
| [Full Guide](./PERMISSIONS_GUIDE.md) | Complete docs | 20 min |
| [Implementation](./PERMISSIONS_IMPLEMENTATION.md) | What's done | 10 min |
| [Test Scenarios](./PERMISSIONS_TEST_SCENARIOS.md) | Testing | 30 min |
| [Code Examples](./src/components/examples/PermissionExamples.tsx) | Live examples | Variable |

---

**Happy Coding! 🚀**

Nếu có câu hỏi hoặc cần support, đừng ngần ngại liên hệ team! 💪
