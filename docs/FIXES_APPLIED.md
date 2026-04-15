# Fixes Applied - April 15, 2026

## 1. ✅ Next.js Middleware Deprecation

### Issue
```
⚠ The "middleware" file convention is deprecated. 
Please use "proxy" instead.
```

### Fix Applied
- **Migrated:** `apps/web/middleware.ts` → `apps/web/proxy.ts`
- **Function renamed:** `middleware()` → `proxy()`
- **Functionality preserved:** Auth guard for `/gov/*`, `/citizen/*`, `/login`, `/register` routes
- **Compatibility:** Now compatible with Next.js 16.2.3

### Files Changed
- ✅ Created: `apps/web/proxy.ts`
- ✅ Deleted: `apps/web/middleware.ts`

---

## 2. ⚠️ Redis Eviction Policy Warning

### Issue
```
IMPORTANT! Eviction policy is volatile-lru. 
It should be "noeviction"
```

### Why This Matters
The current `volatile-lru` policy can evict keys with TTL, which is **dangerous** for:
- **BullMQ job queues** - Jobs will be lost if evicted
- **Rate limiting counters** - Rate limits will be bypassed
- **Notification queue** - Notifications will fail silently

### Fix Required (Action Needed)

#### Option 1: Via Upstash Dashboard (Recommended)
1. Go to [Upstash Console](https://console.upstash.com/)
2. Select your Redis database
3. Navigate to **Settings** → **Advanced**
4. Change **Eviction Policy** to `noeviction`
5. Click **Save**

#### Option 2: Via Redis CLI
```bash
redis-cli -u $REDIS_URL CONFIG SET maxmemory-policy noeviction
```

#### Verify Configuration
```bash
redis-cli -u $REDIS_URL CONFIG GET maxmemory-policy
```

Expected output:
```
1) "maxmemory-policy"
2) "noeviction"
```

### Documentation Created
- ✅ Created: `docs/REDIS_CONFIGURATION.md`
  - Detailed explanation of eviction policies
  - Step-by-step fix instructions
  - Memory management guidelines
  - Troubleshooting guide
  - Production checklist

---

## Summary

| Issue | Status | Action Required |
|-------|--------|-----------------|
| Next.js middleware deprecation | ✅ Fixed | None - already deployed |
| Redis eviction policy | ⚠️ Documented | **Manual configuration needed** |

## Next Steps

1. **Immediate:** Update Redis eviction policy to `noeviction` (see `docs/REDIS_CONFIGURATION.md`)
2. **Verify:** Run `redis-cli -u $REDIS_URL CONFIG GET maxmemory-policy`
3. **Monitor:** Check Redis memory usage regularly
4. **Consider:** Separate Redis instances for cache vs. queues (optional, see docs)

## Commit Details

**Commit:** `2d0c90f`  
**Message:** "fix: migrate middleware to proxy for Next.js 16 compatibility"  
**Files:**
- `apps/web/proxy.ts` (created)
- `docs/REDIS_CONFIGURATION.md` (created)
- `apps/web/middleware.ts` (deleted)

**Pushed to:** `master` branch on GitHub
