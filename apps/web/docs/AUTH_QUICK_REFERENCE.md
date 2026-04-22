# Authentication Quick Reference

## For Developers

### Making Authenticated API Requests

```typescript
import { api } from "@/lib/api-client";

// GET request
const reports = await api.get<{ data: Report[] }>("/reports");

// POST request
const newReport = await api.post<{ data: Report }>("/reports", {
  title: "Broken road",
  description: "...",
});

// PATCH request
const updated = await api.patch<{ data: Report }>("/reports/123", {
  status: "completed",
});

// DELETE request
await api.delete("/reports/123");
```

**Note:** Token refresh is automatic. You don't need to handle 401 errors manually.

### Using Auth Context

```typescript
import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```typescript
// In your page component
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;

  return <div>Protected content</div>;
}
```

### Role-Based Access

```typescript
import { useAuth } from "@/hooks/useAuth";

function AdminPanel() {
  const { user } = useAuth();

  if (user?.role !== "admin" && user?.role !== "super_admin") {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

### Error Handling

```typescript
import { api } from "@/lib/api-client";

async function createReport(data: ReportData) {
  try {
    const result = await api.post("/reports", data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unknown error" };
  }
}
```

### Wrapping Components with Error Boundary

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Token Expiry Times

| Token Type | Lifetime | Storage | Purpose |
|------------|----------|---------|---------|
| Access Token | 15 minutes | Cookie | API authentication |
| Refresh Token | 7 days | Cookie | Get new access tokens |
| Role Cookie | 7 days | Cookie | UI role-based rendering |

## Common Scenarios

### Scenario 1: User stays logged in for a week
- Access token refreshed automatically every 13 minutes
- Refresh token valid for 7 days
- User doesn't need to re-login

### Scenario 2: User closes browser and returns
- Cookies persist (not session cookies)
- User still logged in if within 7 days
- Access token refreshed on first API request

### Scenario 3: User inactive for 7+ days
- Refresh token expires
- Next API request triggers refresh attempt
- Refresh fails, user redirected to login

### Scenario 4: User logs out
- Refresh token revoked on server
- All cookies cleared
- User redirected to login page

### Scenario 5: Password changed
- All refresh tokens revoked
- User must re-login on all devices

## Debugging

### Check Tokens in Browser

```javascript
// In browser console
document.cookie.split('; ').forEach(c => console.log(c));

// Should see:
// laporin_token=eyJhbGc...
// laporin_refresh=eyJhbGc...
// laporin_role=citizen
```

### Check Token Expiry

```javascript
// Decode JWT (access token)
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('laporin_token='))
  ?.split('=')[1];

if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

### Monitor Refresh Requests

```javascript
// In browser console, watch for refresh requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/auth/refresh')) {
    console.log('🔄 Token refresh triggered');
  }
  return originalFetch.apply(this, args);
};
```

## API Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/auth/register` | POST | Create account | No |
| `/auth/login` | POST | Login | No |
| `/auth/refresh` | POST | Refresh token | No (needs refresh token) |
| `/auth/logout` | POST | Logout | No (needs refresh token) |
| `/auth/me` | GET | Get current user | Yes |
| `/auth/password/change` | PATCH | Change password | Yes |

## Environment Variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000

# Backend (.env)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
```

## Troubleshooting

### Problem: "Session expired" error immediately after login

**Solution:** Check that tokens are being stored correctly
```javascript
// After login, check cookies
console.log(document.cookie);
// Should include laporin_token and laporin_refresh
```

### Problem: User logged out after 15 minutes

**Solution:** Verify proactive refresh is working
```javascript
// Check if refresh timer is running
// Should see refresh request every 13 minutes in Network tab
```

### Problem: "Invalid refresh token" error

**Possible causes:**
1. Refresh token expired (7+ days)
2. Refresh token revoked (logout, password change)
3. Token not found in database

**Solution:** User needs to login again

### Problem: Multiple refresh requests

**Solution:** Check that `refreshPromise` is preventing concurrent refreshes
```typescript
// In api-client.ts, verify this pattern:
if (refreshPromise) {
  return refreshPromise; // Reuse existing promise
}
```

## Best Practices

1. **Always use `api` client** - Don't use `fetch` directly for authenticated requests
2. **Don't store tokens in localStorage** - Use cookies for better security
3. **Handle errors gracefully** - Use try/catch and show user-friendly messages
4. **Use ErrorBoundary** - Wrap components to catch unexpected errors
5. **Check user role** - Verify permissions before showing sensitive UI
6. **Test token expiry** - Manually test by waiting 15+ minutes
7. **Monitor refresh logs** - Check server logs for refresh token issues

## Quick Commands

```bash
# Check TypeScript errors
cd apps/web && npm run type-check

# Run development server
cd apps/web && npm run dev

# Check API logs
cd apps/api && npm run dev

# Test authentication endpoints
cd apps/api && npm run test:auth
```

## Resources

- Full documentation: `apps/web/docs/AUTH_FLOW.md`
- Test scenarios: `apps/web/lib/__tests__/auth-flow.test.ts`
- API implementation: `apps/api/src/routes/auth.ts`
- JWT utilities: `apps/api/src/lib/jwt.ts`
