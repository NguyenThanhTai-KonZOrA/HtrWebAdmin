# 🔐 Token Validation & Auto-Logout System

## Vấn đề gặp phải

### Mô tả:
Sau khi deploy lại backend, frontend vẫn thao tác được với **token cũ/invalid**. Backend đã restart nhưng frontend không biết và tiếp tục sử dụng token không hợp lệ.

### Nguyên nhân:
1. **Không có token validation** khi app khởi động
2. **Không có periodic check** để phát hiện token bị invalid
3. **401 handling chưa đầy đủ** - chỉ xử lý khi có API call
4. User có thể làm việc offline với token đã expired

### Rủi ro:
- ❌ Session inconsistency
- ❌ Data không được sync
- ❌ Security issues
- ❌ Poor user experience

## Giải pháp Implementation

### 1. Token Validation Service

**File**: `src/services/registrationService.ts`

```typescript
export const authService = {
    // Validate token with server
    validateToken: async (): Promise<boolean> => {
        try {
            await api.get('/api/RegistrationAdmin/patron/all', {
                params: { isMembership: false },
                headers: {
                    'X-Token-Validation': 'true' // Prevent auto-redirect
                }
            });
            return true;
        } catch (error: any) {
            if (error.response?.status === 401) {
                return false; // Token invalid
            }
            return true; // Other errors, assume token still valid
        }
    },

    // Check token expiration (client-side)
    isTokenExpired: (token: string | null): boolean => {
        if (!token) return true;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp;
            const now = Math.floor(Date.now() / 1000);
            
            // Check with 30 second buffer
            return exp < (now + 30);
        } catch {
            return true;
        }
    }
}
```

### 2. Enhanced AuthContext

**File**: `src/contexts/AuthContext.tsx`

**Features:**
- ✅ Token validation on app initialization
- ✅ Client-side expiration check
- ✅ Server-side token validation
- ✅ Auto-logout on invalid token
- ✅ `validateAndRefreshToken()` method

```typescript
// On app load
useEffect(() => {
    const initAuth = async () => {
        const savedToken = localStorage.getItem("token");
        
        if (savedToken) {
            // 1. Check client-side expiration
            if (authService.isTokenExpired(savedToken)) {
                logout();
                return;
            }

            // 2. Validate with server
            const isValid = await authService.validateToken();
            
            if (isValid) {
                // Restore session
                setToken(savedToken);
                setUser(savedUser);
                setRole(savedRole);
            } else {
                // Clear invalid session
                logout();
            }
        }
        
        setIsLoading(false);
    };

    initAuth();
}, []);

// Validate and refresh token method
const validateAndRefreshToken = async (): Promise<boolean> => {
    const currentToken = localStorage.getItem("token");
    
    if (!currentToken) return false;

    // Check client-side first (fast)
    if (authService.isTokenExpired(currentToken)) {
        logout();
        return false;
    }

    // Validate with server
    const isValid = await authService.validateToken();
    
    if (!isValid) {
        logout();
        return false;
    }

    return true;
};
```

### 3. Periodic Token Validator Hook

**File**: `src/hooks/useTokenValidator.ts`

```typescript
export const useTokenValidator = () => {
    const { token, validateAndRefreshToken } = useAuth();

    useEffect(() => {
        if (!token) return;

        // Validate immediately on mount
        validateAndRefreshToken();

        // Then validate every 5 minutes
        const interval = setInterval(async () => {
            console.log('🔍 Periodic token validation...');
            await validateAndRefreshToken();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [token, validateAndRefreshToken]);
};
```

### 4. Improved Response Interceptor

**File**: `src/services/registrationService.ts`

```typescript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isLoginRequest = error.config?.url?.includes('/api/auth/login');
            const isTokenValidation = error.config?.headers?.['X-Token-Validation'] === 'true';

            if (!isLoginRequest && !isTokenValidation) {
                console.log('🔒 401 Unauthorized - Token invalid');
                
                // Clear auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userRole');
                
                // Trigger logout event for other tabs
                localStorage.setItem('logout-event', Date.now().toString());
                
                // Redirect to login
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);
```

### 5. Integration in App

**File**: `src/App.tsx`

```typescript
function AppContent() {
    const networkStatus = useNetworkStatus();
    
    // Validate token periodically
    useTokenValidator();

    return (
        <>
            <NetworkAlert {...networkStatus} />
            <Routes>
                {/* ... routes */}
            </Routes>
        </>
    );
}
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    App Initialization                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Check localStorage for token                             │
└─────────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
           ✅ Token Found        ❌ No Token
                │                     │
                ▼                     ▼
┌────────────────────────┐    ┌──────────────┐
│ 2. Check Expiration    │    │ Show Login   │
│    (Client-side)       │    └──────────────┘
└────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
    ✅ Valid       ❌ Expired
        │               │
        ▼               ▼
┌────────────────┐  ┌─────────┐
│ 3. Validate    │  │ Logout  │
│    with Server │  └─────────┘
└────────────────┘
        │
    ┌───┴───┐
    │       │
 ✅ Valid ❌ Invalid
    │       │
    ▼       ▼
┌────────┐ ┌─────────┐
│ Restore│ │ Logout  │
│Session │ └─────────┘
└────────┘
    │
    ▼
┌────────────────────────────────────────┐
│  4. Start Periodic Validation          │
│     (Every 5 minutes)                   │
└────────────────────────────────────────┘
```

## Validation Scenarios

### Scenario 1: Backend Restart (Main Issue)
```
1. User đang login với token valid
2. Backend restart → token store bị clear
3. Frontend periodic check (5 minutes)
   → validateToken() call API
   → Receive 401
   → Auto logout
4. ✅ User phải login lại
```

### Scenario 2: Token Expired
```
1. Token có exp claim
2. Client-side check: isTokenExpired()
   → Token expired
3. ✅ Auto logout ngay lập tức
4. No API call needed
```

### Scenario 3: Network Issue
```
1. Periodic validation call API
2. Network error (not 401)
3. ✅ Assume token still valid
4. Continue working
5. Next API call will handle auth properly
```

### Scenario 4: Fresh Login
```
1. User login successfully
2. Token saved to localStorage
3. App initialization
   → Client-side check: ✅ Valid
   → Server validation: ✅ Valid
4. ✅ Start periodic checks
```

## Features

### ✅ Multi-layer Validation
1. **Client-side check** (fast, no API call)
2. **Server-side check** (authoritative)
3. **Periodic validation** (catch backend changes)
4. **API interceptor** (catch 401 during normal operations)

### ✅ Smart Error Handling
- **401**: Token invalid → Logout
- **Network error**: Assume valid → Continue
- **Server error (500)**: Assume valid → Continue

### ✅ Cross-tab Sync
- Logout event broadcast via localStorage
- All tabs logout simultaneously

### ✅ Performance Optimized
- Client-side check first (no network)
- Server validation only when needed
- 5-minute interval (not too frequent)

### ✅ User Experience
- Immediate feedback on invalid token
- No hanging requests
- Clear console logs for debugging

## Configuration

### Token Validation Interval
```typescript
// In useTokenValidator.ts
const VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Can be configured based on requirements:
// - 1 minute: 1 * 60 * 1000
// - 10 minutes: 10 * 60 * 1000
// - 30 minutes: 30 * 60 * 1000
```

### Expiration Buffer
```typescript
// In authService.isTokenExpired()
const BUFFER_SECONDS = 30; // 30 seconds before actual expiration

// Prevents edge cases where token expires mid-request
```

## Testing Scenarios

### ✅ Test 1: Backend Restart
```
1. Login to app
2. Restart backend server
3. Wait 5 minutes (or trigger manual validation)
4. Expected: Auto logout, redirect to login
```

### ✅ Test 2: Expired Token
```
1. Login with token that will expire soon
2. Wait for expiration
3. Expected: Immediate logout on next validation
```

### ✅ Test 3: Invalid Token
```
1. Login normally
2. Manually corrupt token in localStorage
3. Refresh page or wait for validation
4. Expected: Logout on app init or periodic check
```

### ✅ Test 4: Network Offline
```
1. Login normally
2. Go offline (disable network)
3. Wait for validation interval
4. Expected: No logout, continue working offline
```

### ✅ Test 5: Multiple Tabs
```
1. Open app in 2 tabs
2. Logout from tab 1
3. Expected: Tab 2 also logs out automatically
```

## Console Logs

### Successful Flow
```
🔍 Validating token with server...
✅ Token is valid, restoring session...
🔐 Starting periodic token validation...
🔍 Periodic token validation check...
```

### Invalid Token Flow
```
🔍 Validating token with server...
🔒 Token validation failed: 401 Unauthorized
❌ Token is invalid, clearing session...
🚪 Redirecting to login page...
```

### Expired Token Flow
```
🔒 Token is expired (client-side check), clearing...
🧹 Clearing token validation interval
```

## Security Benefits

1. **Immediate detection** of backend changes
2. **Prevents stale sessions** after deployment
3. **Multi-tab consistency** via localStorage events
4. **Client + Server validation** for defense in depth
5. **Graceful error handling** prevents confusion

## Performance Impact

- **Client-side check**: < 1ms (no network)
- **Server validation**: 1 API call every 5 minutes
- **Memory**: Minimal (1 interval timer)
- **Network**: ~12 validation calls per hour

## Browser Compatibility

- ✅ All modern browsers
- ✅ localStorage support required
- ✅ Promise/async-await support
- ✅ No polyfills needed

## Future Enhancements (Optional)

1. **Token refresh mechanism** - Auto-renew tokens
2. **Configurable intervals** - Different intervals per environment
3. **Offline mode** - Better handling of network issues
4. **Session timeout warning** - Warn user before expiration
5. **Activity-based validation** - Validate after user interaction

---

**Issue**: Token cũ vẫn hoạt động sau backend restart  
**Fix**: Multi-layer token validation system  
**Impact**: Better security, improved UX, session consistency  
**Status**: ✅ Implemented and Ready for Testing
