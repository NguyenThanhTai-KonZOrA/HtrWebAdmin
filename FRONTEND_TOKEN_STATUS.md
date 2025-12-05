# 🔄 Token Validation - Frontend Enhancement

## ✅ Frontend đã implement (Hiện tại):

1. **Client-side JWT expiration check** - Kiểm tra `exp` claim
2. **Server-side validation** - Call API để check token validity
3. **Periodic validation** - Mỗi 1 phút (user đã sửa từ 5 phút)
4. **401 Interceptor** - Auto logout khi receive 401
5. **Cross-tab logout sync** - Logout đồng bộ các tabs

---

## 🔧 Cải thiện thêm (Optional):

### 1. Token Issued Time (iat) Validation

Thêm check để ensure token không quá cũ:

**File**: `src/services/registrationService.ts`

```typescript
export const authService = {
    // ... existing methods ...
    
    // NEW: Check if token is too old (issued more than X hours ago)
    isTokenTooOld: (token: string | null, maxAgeHours: number = 24): boolean => {
        if (!token) return true;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const iat = payload.iat; // Issued at timestamp
            
            if (!iat) return false; // No iat claim
            
            const now = Math.floor(Date.now() / 1000);
            const ageInHours = (now - iat) / 3600;
            
            console.log(`🕐 Token age: ${ageInHours.toFixed(2)} hours`);
            
            return ageInHours > maxAgeHours;
        } catch (error) {
            console.error('Error checking token age:', error);
            return true;
        }
    },
    
    // Enhanced validation combining all checks
    comprehensiveTokenCheck: (token: string | null): {
        isValid: boolean;
        reason?: string;
    } => {
        if (!token) {
            return { isValid: false, reason: 'No token' };
        }
        
        // Check expiration
        if (authService.isTokenExpired(token)) {
            return { isValid: false, reason: 'Token expired' };
        }
        
        // Check if too old (24 hours)
        if (authService.isTokenTooOld(token, 24)) {
            return { isValid: false, reason: 'Token too old (>24h)' };
        }
        
        return { isValid: true };
    }
};
```

### 2. Token Refresh Detection

Detect backend version changes:

```typescript
// Store backend version when login
export const authService = {
    // ... existing methods ...
    
    storeBackendVersion: (version: string) => {
        localStorage.setItem('backend_version', version);
    },
    
    checkBackendVersionChanged: async (): Promise<boolean> => {
        try {
            // Call a version endpoint
            const response = await api.get('/api/version');
            const currentVersion = response.data.version;
            const storedVersion = localStorage.getItem('backend_version');
            
            if (storedVersion && storedVersion !== currentVersion) {
                console.log('🔄 Backend version changed!');
                console.log(`   Old: ${storedVersion}`);
                console.log(`   New: ${currentVersion}`);
                return true;
            }
            
            // Update stored version
            localStorage.setItem('backend_version', currentVersion);
            return false;
        } catch (error) {
            console.error('Failed to check backend version:', error);
            return false;
        }
    }
};
```

### 3. Enhanced Validation Logic

**File**: `src/contexts/AuthContext.tsx`

```typescript
const validateAndRefreshToken = async (): Promise<boolean> => {
    const currentToken = localStorage.getItem("token");
    
    if (!currentToken) {
        console.log('❌ No token found');
        return false;
    }

    // 1. Comprehensive client-side check
    const clientCheck = authService.comprehensiveTokenCheck(currentToken);
    if (!clientCheck.isValid) {
        console.log(`❌ Client-side validation failed: ${clientCheck.reason}`);
        logout();
        return false;
    }

    // 2. Check backend version (if endpoint available)
    const versionChanged = await authService.checkBackendVersionChanged();
    if (versionChanged) {
        console.log('🔄 Backend version changed, forcing re-authentication');
        logout();
        return false;
    }

    // 3. Server-side validation
    const isValid = await authService.validateToken();
    if (!isValid) {
        console.log('❌ Server-side validation failed');
        logout();
        return false;
    }

    console.log('✅ Token validation passed all checks');
    return true;
};
```

---

## 🎯 Nhưng... Backend mới là KEY!

### ⚠️ **Frontend KHÔNG THỂ tự phát hiện backend restart**

Ngay cả với tất cả các enhancements trên, **frontend không thể biết backend đã restart** nếu:

1. ✅ JWT signature vẫn valid (cùng secret key)
2. ✅ JWT chưa expired
3. ✅ Backend không có version endpoint
4. ✅ Backend không check server_start claim

→ **Backend BẮT BUỘC phải implement token versioning!**

---

## 📊 Dependency Matrix

| Check | Location | Can Detect Backend Restart? |
|-------|----------|---------------------------|
| JWT Expiration | Frontend | ❌ No (token might not expired yet) |
| JWT Signature | Frontend | ❌ No (same secret key) |
| Token Age | Frontend | ❌ No (token can be fresh but server restarted) |
| Server Validation | Frontend → Backend | ✅ **YES** (if backend checks server_start) |
| Backend Version | Frontend → Backend | ✅ YES (if backend provides version endpoint) |
| Server Start Time | **Backend Only** | ✅ **YES** (authoritative) |

---

## 🎬 Correct Flow

```
┌─────────────────────────────────────────────────────────┐
│              Frontend Validation Flow                    │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌──────┐      ┌──────────┐    ┌──────────┐
    │ IAT  │      │   EXP    │    │  Too Old │
    │Check │      │  Check   │    │  Check   │
    └──┬───┘      └────┬─────┘    └────┬─────┘
       │               │               │
       └───────────────┼───────────────┘
                       ▼
              All Checks Pass?
                       │
              ┌────────┴────────┐
              │                 │
          ❌ Failed         ✅ Passed
              │                 │
              ▼                 ▼
        ┌──────────┐    ┌──────────────┐
        │  Logout  │    │ Call Backend │
        └──────────┘    │  Validation  │
                        └──────┬───────┘
                               │
                   ┌───────────┴───────────┐
                   │                       │
               ❌ 401                  ✅ 200
                   │                       │
                   ▼                       ▼
            ┌──────────┐          ┌──────────────┐
            │  Logout  │          │ Continue App │
            └──────────┘          └──────────────┘
```

**Key Point**: Backend validation là step CUỐI và QUAN TRỌNG NHẤT!

---

## ✅ Current Frontend Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Client JWT expiration | ✅ Done | `isTokenExpired()` |
| Server validation | ✅ Done | `validateToken()` API call |
| Periodic check | ✅ Done | Every 1 minute |
| 401 Interceptor | ✅ Done | Auto logout on 401 |
| Cross-tab sync | ✅ Done | localStorage events |
| Token age check | ⚠️ Optional | Can add if needed |
| Backend version check | ⚠️ Optional | Requires BE endpoint |
| Server start check | ❌ Backend Only | **MUST BE IN BACKEND** |

---

## 🚦 Recommendation

### Frontend (Current): ✅ SUFFICIENT
- Frontend đã làm đủ tất cả những gì có thể làm
- Periodic validation (1 min) là đủ nhanh
- 401 handling works perfectly

### Backend (Critical): ❌ REQUIRED
- **MUST implement server_start claim validation**
- Đây là ONLY WAY để reject tokens sau restart
- Frontend không thể tự phát hiện được

---

## 📝 Action Items

### For Frontend (Optional Enhancements):
- [ ] Add token age check (nice to have)
- [ ] Add backend version endpoint check (if BE provides)
- [ ] Add user notification before auto-logout
- [ ] Add "Session Expired" dialog instead of silent redirect

### For Backend (CRITICAL):
- [x] Read `BACKEND_TOKEN_REQUIREMENTS.md`
- [ ] Add `server_start` claim to JWT
- [ ] Add `server_start` validation in middleware
- [ ] Test: Login → Restart → API call → Should 401
- [ ] Deploy and verify

---

## 🎯 Final Answer

**Frontend đã làm đủ!** ✅

Vấn đề **"thao tác được sau restart"** là do:
- Backend chấp nhận token cũ vì JWT signature + expiration vẫn valid
- Backend KHÔNG có cơ chế reject tokens issued trước restart

**Solution**: Backend cần implement theo `BACKEND_TOKEN_REQUIREMENTS.md`

**ETA**: 10-15 phút để implement Option 1 (Server Start Time)
