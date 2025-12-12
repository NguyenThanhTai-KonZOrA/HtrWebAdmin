# Hệ thống Refresh Token Tự động

## Tổng quan

Đã triển khai hệ thống tự động refresh token với các tính năng:

### ✨ Tính năng chính

1. **Tự động refresh token** trước 5 phút khi hết hạn
2. **Chỉ refresh khi user còn hoạt động** - tracking user activity
3. **Dừng refresh** sau 30 phút không hoạt động
4. **Theo dõi hoạt động người dùng**: click, scroll, keyboard, touch, mouse
5. **Tự động revoke token** khi logout
6. **Global logout** - đồng bộ logout giữa các tab

## 📁 Cấu trúc File

### 1. `src/utils/authManager.ts` (MỚI)

Class singleton quản lý token và auto-refresh:

```typescript
class AuthManager {
  // Thời gian refresh token trước khi hết hạn (5 phút)
  private refreshBeforeExpiry = 5 * 60 * 1000;
  
  // Thời gian không hoạt động trước khi dừng auto-refresh (30 phút)
  private inactivityThreshold = 30 * 60 * 1000;
}
```

**Các method chính:**
- `saveTokens(accessToken, refreshToken, expiration)` - Lưu tokens và bắt đầu auto-refresh
- `refreshToken()` - Gọi API refresh token
- `startAutoRefresh()` - Bắt đầu interval check và refresh
- `stopAutoRefresh()` - Dừng auto-refresh
- `logout()` - Revoke token và clear data
- `isUserActive()` - Check user có còn hoạt động không

### 2. `src/services/authService.ts` (CẬP NHẬT)

Đã sửa API call `refreshToken`:

**Trước:**
```typescript
refreshToken: async (data: { refreshToken: RefreshTokenRequest })
```

**Sau:**
```typescript
refreshToken: async (data: RefreshTokenRequest)
```

### 3. `src/contexts/AuthContext.tsx` (CẬP NHẬT)

**Thay đổi:**

- Import `authManager`
- Thêm `clearSession()` helper function
- Update `login()` function để nhận thêm `refreshToken` và `tokenExpiration`
- Update `logout()` để gọi `authManager.logout()`
- Setup callback từ `authManager` để xử lý auto-logout

**Login function mới:**
```typescript
const login = (
  user: string, 
  token: string, 
  refreshToken: string, 
  tokenExpiration: string
) => {
  // ... set state ...
  authManager.saveTokens(token, refreshToken, tokenExpiration);
}
```

### 4. `src/components/Login.tsx` (CẬP NHẬT)

Pass thêm `refreshToken` và `tokenExpiration` khi login thành công:

```typescript
if (response && response.token && response.refreshToken && response.tokenExpiration) {
  login(
    response.userName, 
    response.token, 
    response.refreshToken, 
    response.tokenExpiration
  );
}
```

### 5. Các hooks và components khác (CẬP NHẬT)

Đã update để handle async logout:
- `src/hooks/useVersionCheck.ts` - await logout
- `src/hooks/useAutoLogout.ts` - async timeout callback
- `src/components/layout/MainNav.tsx` - async handleLogout

## 🔄 Luồng hoạt động

### Khi Login:

```
1. User login thành công
   ↓
2. Login.tsx nhận response với: token, refreshToken, tokenExpiration
   ↓
3. Gọi login(userName, token, refreshToken, tokenExpiration)
   ↓
4. AuthContext lưu vào localStorage và state
   ↓
5. authManager.saveTokens() được gọi
   ↓
6. Auto-refresh được start (check mỗi 60s)
```

### Khi Auto-refresh:

```
Mỗi 60 giây:
   ↓
1. Check tokenExpiration
   ↓
2. Nếu còn < 5 phút && user còn active
   ↓
3. Gọi API /api/auth/refresh-token
   ↓
4. Lưu token mới, refreshToken mới, expiration mới
   ↓
5. Continue auto-refresh
```

### Khi User không hoạt động:

```
User không có activity > 30 phút
   ↓
Auto-refresh vẫn chạy nhưng SKIP refresh
   ↓
Log: "⏸️ User inactive, skipping token refresh"
   ↓
Token hết hạn tự nhiên
   ↓
Khi user quay lại và gọi API → 401 → redirect login
```

### Khi Logout:

```
User click logout
   ↓
1. authManager.logout() được gọi
   ↓
2. Gọi API /api/auth/revoke-token
   ↓
3. authManager.clearTokens()
   ↓
4. Stop auto-refresh
   ↓
5. Clear localStorage và state
   ↓
6. Trigger global logout event cho tabs khác
```

## 🎯 User Activity Tracking

Các event được theo dõi:
- `mousedown` - Click chuột
- `keydown` - Nhấn phím
- `scroll` - Cuộn trang
- `touchstart` - Touch trên mobile
- `click` - Click event

Mỗi khi có event → update `lastActivity` timestamp

## ⚙️ Cấu hình

Có thể điều chỉnh trong `authManager.ts`:

```typescript
// Refresh trước bao lâu (mặc định: 5 phút)
private refreshBeforeExpiry = 5 * 60 * 1000;

// Ngưỡng không hoạt động (mặc định: 30 phút)
private inactivityThreshold = 30 * 60 * 1000;
```

## 📊 Console Logs

Để theo dõi hoạt động:

- `🔄 Refreshing access token...` - Đang refresh
- `✅ Token refreshed successfully` - Refresh thành công
- `❌ Error refreshing token` - Refresh thất bại
- `⏰ Token will expire in X seconds, refreshing...` - Sắp hết hạn
- `⏸️ User inactive, skipping token refresh` - User không active
- `✅ Auto-refresh started` - Bắt đầu auto-refresh
- `⏹️ Auto-refresh stopped` - Dừng auto-refresh
- `✅ Token revoked successfully` - Revoke thành công

## 🔒 Bảo mật

1. **Refresh token** được lưu trong localStorage
2. **Auto-revoke** khi logout để invalidate token
3. **Chỉ refresh khi user active** - tránh refresh vô thời hạn
4. **Token hết hạn** được handle cả client-side và server-side
5. **Global logout** đồng bộ giữa các tab

## 🧪 Testing

### Test auto-refresh:
1. Login vào hệ thống
2. Mở Console
3. Đợi đến khi còn < 5 phút hết hạn
4. Kiểm tra log `⏰ Token will expire in...`
5. Verify token mới được lưu

### Test inactive user:
1. Login và để yên > 30 phút
2. Kiểm tra log `⏸️ User inactive`
3. Verify không có refresh token call

### Test logout:
1. Click logout
2. Kiểm tra Network tab có call `/api/auth/revoke-token`
3. Verify localStorage đã clear
4. Verify redirect về `/login`

## 📝 Type Definitions

```typescript
// src/type.ts
export type LoginResponse = {
  userName: string;
  token: string;
  refreshToken: string;
  role: string;
  employeeId: number;
  employeeCode: string;
  tokenExpiration: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
```

## ⚠️ Lưu ý

1. Backend cần implement 2 API endpoints:
   - `POST /api/auth/refresh-token` - Nhận `{ refreshToken: string }`
   - `POST /api/auth/revoke-token` - Revoke token hiện tại

2. Response format phải match với `LoginResponse` type

3. `tokenExpiration` phải là ISO string hoặc timestamp hợp lệ

4. Nếu refresh token fail → auto logout và redirect về login

5. Auto-refresh sẽ dừng khi:
   - User logout
   - Refresh token không hợp lệ
   - Token hết hạn hoàn toàn
   - authManager.stopAutoRefresh() được gọi

## 🚀 Migration từ version cũ

Nếu đang có user đang login với token cũ (không có refreshToken):

1. User sẽ vẫn login bình thường
2. authManager sẽ không start auto-refresh (vì không có refreshToken)
3. Khi token hết hạn → redirect login
4. User login lại → nhận refreshToken mới → auto-refresh hoạt động

Không cần migration script, tự động handle gracefully!
