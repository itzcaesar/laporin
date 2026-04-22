# Authentication Flow Documentation

## Overview

The Laporin authentication system uses JWT tokens with automatic refresh capabilities to provide a seamless user experience while maintaining security.

## Token Types

### Access Token
- **Purpose**: Authenticates API requests
- **Lifetime**: 15 minutes
- **Storage**: Cookie (`laporin_token`)
- **Usage**: Sent in `Authorization: Bearer <token>` header

### Refresh Token
- **Purpose**: Obtains new access tokens without re-login
- **Lifetime**: 7 days
- **Storage**: Cookie (`laporin_refresh`)
- **Usage**: Sent to `/auth/refresh` endpoint when access token expires

## Authentication Flow

### 1. Login/Registration

```typescript
// User logs in
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}

// Tokens stored in cookies:
// - laporin_token (15 min)
// - laporin_refresh (7 days)
// - laporin_role (7 days)
```

### 2. Automatic Token Refresh (Reactive)

When an API request receives a 401 Unauthorized response:

```typescript
// 1. API request fails with 401
GET /api/v1/reports
Response: 401 Unauthorized

// 2. Client automatically calls refresh endpoint
POST /api/v1/auth/refresh
{
  "refreshToken": "eyJhbGc..."
}

// 3. New access token received
{
  "data": {
    "accessToken": "eyJhbGc..."
  }
}

// 4. Original request is retried with new token
GET /api/v1/reports
Authorization: Bearer <new_token>
Response: 200 OK
```

### 3. Proactive Token Refresh

To prevent 401 errors during active sessions, tokens are refreshed proactively:

```typescript
// Every 13 minutes (before 15-minute expiry)
setInterval(() => {
  POST /api/v1/auth/refresh
  {
    "refreshToken": "eyJhbGc..."
  }
}, 13 * 60 * 1000);
```

### 4. Logout

```typescript
// User clicks logout
POST /api/v1/auth/logout
{
  "refreshToken": "eyJhbGc..."
}

// Server marks refresh token as revoked
UPDATE refresh_tokens
SET is_revoked = true
WHERE id = <token_id>

// Client clears all cookies and redirects
document.cookie = "laporin_token=; max-age=0"
document.cookie = "laporin_refresh=; max-age=0"
window.location.href = "/login"
```

## Error Handling

### Refresh Token Expired

```typescript
// Refresh token is older than 7 days
POST /api/v1/auth/refresh
Response: 401 Unauthorized

// Client clears tokens and redirects to login
api.clearTokens();
window.location.href = "/login";
```

### Network Errors

```typescript
// Network error during refresh
try {
  await fetch('/api/v1/auth/refresh', ...);
} catch (error) {
  console.error('Token refresh failed:', error);
  // Logout user
  await logout();
}
```

### Concurrent Refresh Prevention

```typescript
// Multiple requests receive 401 simultaneously
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken() {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }
  
  // Start new refresh
  refreshPromise = doRefresh();
  const result = await refreshPromise;
  refreshPromise = null;
  return result;
}
```

## Security Features

### 1. Token Rotation
- New access token issued on every refresh
- Refresh tokens are single-use (can be enhanced)

### 2. Token Revocation
- Refresh tokens stored in database
- Can be revoked on logout or security events
- Revoked tokens cannot be used

### 3. Secure Storage
- Tokens stored in cookies with `SameSite=Strict`
- `Secure` flag in production (HTTPS only)
- Short-lived access tokens (15 minutes)

### 4. Automatic Cleanup
- Expired tokens automatically rejected
- Database cleanup job removes old tokens

## Implementation Files

### Frontend
- `apps/web/lib/api-client.ts` - API client with refresh logic
- `apps/web/hooks/useAuth.tsx` - Auth context and proactive refresh
- `apps/web/components/ErrorBoundary.tsx` - Error handling

### Backend
- `apps/api/src/routes/auth.ts` - Auth endpoints
- `apps/api/src/lib/jwt.ts` - Token signing/verification
- `apps/api/src/middleware/auth.ts` - Auth middleware

## Testing

See `apps/web/lib/__tests__/auth-flow.test.ts` for test scenarios.

### Manual Testing Checklist

1. **Login Flow**
   - [ ] Login with valid credentials
   - [ ] Tokens stored in cookies
   - [ ] Redirected to dashboard

2. **Token Refresh**
   - [ ] Wait 15 minutes, make API request
   - [ ] Token automatically refreshed
   - [ ] Request succeeds

3. **Proactive Refresh**
   - [ ] Wait 13 minutes after login
   - [ ] Token refreshed automatically
   - [ ] No 401 errors

4. **Logout**
   - [ ] Click logout
   - [ ] Tokens cleared
   - [ ] Redirected to login
   - [ ] Cannot use old refresh token

5. **Error Handling**
   - [ ] Simulate network error
   - [ ] Error boundary catches error
   - [ ] User sees friendly message

## Troubleshooting

### Issue: User logged out unexpectedly

**Possible causes:**
1. Refresh token expired (7 days)
2. Refresh token revoked (password change, logout)
3. Network error during refresh
4. Server error during refresh

**Solution:**
- Check browser console for errors
- Verify refresh token in cookies
- Check server logs for refresh endpoint errors

### Issue: Multiple refresh requests

**Possible causes:**
1. Concurrent API requests triggering multiple refreshes
2. Proactive refresh and reactive refresh overlapping

**Solution:**
- Verify `refreshPromise` is preventing concurrent refreshes
- Check timing of proactive refresh interval

### Issue: Tokens not persisting

**Possible causes:**
1. Cookies blocked by browser
2. SameSite policy issues
3. Cookie max-age too short

**Solution:**
- Check browser cookie settings
- Verify cookie attributes in DevTools
- Check for third-party cookie restrictions

## Future Enhancements

1. **Refresh Token Rotation**
   - Issue new refresh token on each refresh
   - Invalidate old refresh token

2. **Device Management**
   - Track active sessions per device
   - Allow users to revoke specific devices

3. **Suspicious Activity Detection**
   - Detect unusual login patterns
   - Require re-authentication for sensitive actions

4. **Remember Me**
   - Optional longer-lived refresh tokens (30 days)
   - Stored in localStorage for persistence

5. **Biometric Authentication**
   - WebAuthn integration
   - Passwordless login option
