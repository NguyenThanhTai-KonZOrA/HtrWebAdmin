# 🔐 Backend Requirements - Token Validation System

## ❌ Vấn đề hiện tại

**Frontend vẫn thao tác được sau khi restart Backend server**

### Nguyên nhân:
Backend hiện tại **chỉ validate JWT signature và expiration**, nhưng **KHÔNG track token state** sau khi restart. Điều này có nghĩa là:

1. ✅ JWT signature valid → Accept
2. ✅ JWT chưa expire → Accept
3. ❌ **KHÔNG kiểm tra** token có được issue trước khi server restart hay không

→ **Token cũ vẫn hoạt động** vì về mặt kỹ thuật nó vẫn valid!

---

## ✅ Giải pháp Backend cần implement

Backend cần implement **Token Versioning** hoặc **Token Blacklisting** để reject tokens cũ.

### Option 1: Token Versioning (Recommended) ⭐

#### 1.1. Thêm Server Start Time vào JWT Claims

**File**: `JwtService.cs` hoặc nơi generate token

```csharp
public class JwtService
{
    // Store server start time as static (persists across requests)
    private static readonly string ServerStartTime = DateTime.UtcNow.ToString("o");
    
    public string GenerateToken(string username, string role)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()),
            
            // 👇 ADD THIS: Server instance identifier
            new Claim("server_start", ServerStartTime),
            
            // Or use a version number that increments on deploy
            // new Claim("token_version", "1.0.0")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

#### 1.2. Validate Server Start Time trong Middleware

**File**: `JwtAuthenticationMiddleware.cs` hoặc `Program.cs`

```csharp
public class JwtAuthenticationMiddleware
{
    private static readonly string CurrentServerStartTime = DateTime.UtcNow.ToString("o");
    
    public async Task InvokeAsync(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();

        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                
                // 👇 CHECK SERVER START TIME
                var tokenServerStart = jwtToken.Claims
                    .FirstOrDefault(c => c.Type == "server_start")?.Value;

                if (tokenServerStart != CurrentServerStartTime)
                {
                    Console.WriteLine($"❌ Token rejected: Issued before server restart");
                    Console.WriteLine($"   Token server_start: {tokenServerStart}");
                    Console.WriteLine($"   Current server_start: {CurrentServerStartTime}");
                    
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        success = false,
                        message = "Token is no longer valid. Please login again."
                    });
                    return;
                }
                
                // Continue with normal JWT validation
                // ...
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token validation error: {ex.Message}");
                context.Response.StatusCode = 401;
                return;
            }
        }

        await _next(context);
    }
}
```

#### 1.3. Kích hoạt Middleware

**File**: `Program.cs`

```csharp
var app = builder.Build();

// Add JWT authentication middleware
app.UseMiddleware<JwtAuthenticationMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
```

---

### Option 2: Redis Token Blacklist (Advanced)

Nếu Backend đang dùng Redis, có thể implement token blacklist:

```csharp
public class TokenBlacklistService
{
    private readonly IConnectionMultiplexer _redis;
    
    // On server restart, blacklist all old tokens
    public async Task InvalidateAllTokensBeforeRestart()
    {
        var db = _redis.GetDatabase();
        var serverRestartKey = "server_restart_time";
        
        await db.StringSetAsync(
            serverRestartKey, 
            DateTime.UtcNow.ToString("o"),
            TimeSpan.FromHours(24) // Keep for 24 hours
        );
    }
    
    // Check if token was issued before last restart
    public async Task<bool> IsTokenValid(JwtSecurityToken token)
    {
        var db = _redis.GetDatabase();
        var lastRestartTime = await db.StringGetAsync("server_restart_time");
        
        if (lastRestartTime.HasValue)
        {
            var restartTime = DateTime.Parse(lastRestartTime);
            var tokenIssuedAt = token.ValidFrom;
            
            if (tokenIssuedAt < restartTime)
            {
                Console.WriteLine("❌ Token issued before server restart, rejecting...");
                return false;
            }
        }
        
        return true;
    }
}
```

---

### Option 3: Database Token Store (Most Secure)

Store active tokens in database:

```csharp
// Table: ActiveTokens
public class ActiveToken
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string TokenJti { get; set; } // JWT ID
    public DateTime IssuedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
}

public class TokenService
{
    // On login, store token
    public async Task<string> GenerateAndStoreToken(string username, string role)
    {
        var jti = Guid.NewGuid().ToString();
        var token = GenerateToken(username, role, jti);
        
        // Save to database
        await _dbContext.ActiveTokens.AddAsync(new ActiveToken
        {
            Username = username,
            TokenJti = jti,
            IssuedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            IsRevoked = false
        });
        
        await _dbContext.SaveChangesAsync();
        return token;
    }
    
    // On server restart, revoke all tokens
    public async Task RevokeAllTokens()
    {
        await _dbContext.Database.ExecuteSqlRawAsync(
            "UPDATE ActiveTokens SET IsRevoked = 1 WHERE IsRevoked = 0"
        );
    }
    
    // Validate token exists and not revoked
    public async Task<bool> ValidateToken(string jti)
    {
        var token = await _dbContext.ActiveTokens
            .FirstOrDefaultAsync(t => t.TokenJti == jti && !t.IsRevoked);
            
        return token != null && token.ExpiresAt > DateTime.UtcNow;
    }
}
```

---

## 📋 Implementation Checklist

### Minimal Implementation (Option 1 - Recommended):

- [ ] **Step 1**: Add `server_start` claim khi generate JWT
  ```csharp
  new Claim("server_start", ServerStartTime)
  ```

- [ ] **Step 2**: Store server start time as static variable
  ```csharp
  private static readonly string ServerStartTime = DateTime.UtcNow.ToString("o");
  ```

- [ ] **Step 3**: Validate `server_start` claim trong JWT middleware
  ```csharp
  if (tokenServerStart != CurrentServerStartTime) 
      → Return 401
  ```

- [ ] **Step 4**: Test bằng cách:
  1. Login → Get token
  2. Restart backend
  3. Call API với token cũ → Should get 401
  4. Frontend sẽ auto logout

---

## 🧪 Testing

### Test Case 1: Normal Login
```bash
# Step 1: Login
POST /api/auth/login
Body: { "username": "admin", "password": "xxx" }
Response: { "token": "eyJhbGc..." }

# Step 2: Call API
GET /api/RegistrationAdmin/patron/all
Header: Authorization: Bearer eyJhbGc...
Response: 200 OK ✅
```

### Test Case 2: After Server Restart
```bash
# Step 1: Login
POST /api/auth/login
Response: { "token": "OLD_TOKEN" }

# Step 2: Restart Backend Server
# server_start time changed!

# Step 3: Call API with old token
GET /api/RegistrationAdmin/patron/all
Header: Authorization: Bearer OLD_TOKEN
Response: 401 Unauthorized ✅
Body: { "success": false, "message": "Token is no longer valid" }

# Step 4: Frontend auto logout
Frontend detects 401 → Calls logout() → Redirect to /login
```

### Test Case 3: Token Expiration (Normal)
```bash
# Step 1: Login with token expires in 1 hour
# Step 2: Wait 1 hour
# Step 3: Call API
Response: 401 Unauthorized ✅
Reason: Token expired (normal JWT expiration)
```

---

## 🔍 Debugging Backend

### Add Logging để debug:

```csharp
public class JwtAuthenticationMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        Console.WriteLine("=== JWT Validation Debug ===");
        
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();

        if (!string.IsNullOrEmpty(token))
        {
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            var tokenServerStart = jwtToken.Claims
                .FirstOrDefault(c => c.Type == "server_start")?.Value;
            var tokenIat = jwtToken.Claims
                .FirstOrDefault(c => c.Type == "iat")?.Value;
            var tokenExp = jwtToken.Claims
                .FirstOrDefault(c => c.Type == "exp")?.Value;
            
            Console.WriteLine($"Token server_start: {tokenServerStart}");
            Console.WriteLine($"Current server_start: {CurrentServerStartTime}");
            Console.WriteLine($"Token issued at: {tokenIat}");
            Console.WriteLine($"Token expires at: {tokenExp}");
            Console.WriteLine($"Match: {tokenServerStart == CurrentServerStartTime}");
            
            if (tokenServerStart != CurrentServerStartTime)
            {
                Console.WriteLine("❌ REJECTING TOKEN: Server was restarted");
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    message = "Your session is no longer valid. Please login again."
                });
                return;
            }
        }
        
        await _next(context);
    }
}
```

---

## 📊 So sánh các Options

| Feature | Option 1: Server Start Time | Option 2: Redis | Option 3: Database |
|---------|---------------------------|-----------------|-------------------|
| **Complexity** | ⭐ Low | ⭐⭐ Medium | ⭐⭐⭐ High |
| **Performance** | ⚡ Excellent | ⚡⚡ Good | ⚡ Fair (DB query) |
| **Scalability** | ❌ Single server only | ✅ Multi-server | ✅ Multi-server |
| **Token Revoke** | ❌ All at once | ✅ Individual | ✅ Individual |
| **Deployment** | ✅ No infrastructure | ⚠️ Needs Redis | ⚠️ Needs DB |
| **Recommended** | ✅ Simple apps | ✅ Medium apps | ✅ Enterprise |

---

## 💡 Recommended Solution

**Cho ứng dụng hiện tại**: Dùng **Option 1 (Server Start Time)** vì:

✅ Đơn giản, dễ implement (5-10 phút)  
✅ Không cần infrastructure thêm  
✅ Hiệu năng cao (không có DB/Redis query)  
✅ Đủ để solve vấn đề "token cũ vẫn hoạt động"  

**Flow hoạt động:**
```
1. Server Start → ServerStartTime = "2025-12-04T10:00:00Z"
2. User Login → Token claims: { server_start: "2025-12-04T10:00:00Z" }
3. Server Restart → ServerStartTime = "2025-12-04T11:00:00Z"
4. API Call with old token → server_start mismatch → 401
5. Frontend detects 401 → Auto logout → Redirect login
```

---

## 🚀 Quick Start (Option 1)

### 1. Sửa file generate token:

```csharp
// Add static field
private static readonly string ServerStartTime = 
    DateTime.UtcNow.ToString("o");

// Add claim when generating token
new Claim("server_start", ServerStartTime)
```

### 2. Sửa file JWT validation middleware:

```csharp
// Check server_start claim
var tokenServerStart = jwtToken.Claims
    .FirstOrDefault(c => c.Type == "server_start")?.Value;

if (tokenServerStart != ServerStartTime)
{
    context.Response.StatusCode = 401;
    return;
}
```

### 3. Test:
```bash
# Login → Restart server → Call API → Should get 401
```

**Estimated time**: 10-15 phút  
**Files to modify**: 2 files (JwtService.cs, Middleware)  
**Risk**: Low (just adding validation)

---

## ✅ Kết quả mong đợi

Sau khi implement:

1. ✅ Token cũ → **401 Unauthorized**
2. ✅ Frontend auto logout
3. ✅ User phải login lại
4. ✅ Token mới → Hoạt động bình thường
5. ✅ Không ảnh hưởng đến users đang active (before restart)

---

**Tóm tắt**: Backend cần **validate server_start claim** trong JWT để reject tokens issued trước khi server restart.
