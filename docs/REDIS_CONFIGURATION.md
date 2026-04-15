# Redis Configuration Guide

## ⚠️ Critical: Eviction Policy

### Current Issue

The Redis instance is currently configured with `volatile-lru` eviction policy. This is **NOT suitable** for production use with Laporin.

**Current Policy:** `volatile-lru` (evicts keys with TTL using LRU algorithm)  
**Required Policy:** `noeviction` (returns errors when memory limit is reached)

### Why `noeviction` is Required

Laporin uses Redis for:

1. **Cache data** (map pins, statistics, heatmaps) - Can be evicted ✅
2. **BullMQ job queues** (AI analysis, notifications) - **MUST NOT be evicted** ❌
3. **Rate limiting counters** - **MUST NOT be evicted** ❌

If BullMQ job data is evicted, jobs will be lost and notifications/AI analysis will fail silently.

### How to Fix (Upstash)

#### Option 1: Via Upstash Dashboard

1. Go to [Upstash Console](https://console.upstash.com/)
2. Select your Redis database
3. Go to **Settings** → **Advanced**
4. Change **Eviction Policy** to `noeviction`
5. Click **Save**

#### Option 2: Via Redis CLI

```bash
redis-cli -u $REDIS_URL CONFIG SET maxmemory-policy noeviction
```

#### Option 3: Via Code (Temporary)

Add this to `apps/api/src/lib/redis.ts`:

```typescript
// Set eviction policy on connection
await redis.config('SET', 'maxmemory-policy', 'noeviction')
```

**Note:** This only works if your Redis user has CONFIG permissions.

### Verify Configuration

```bash
redis-cli -u $REDIS_URL CONFIG GET maxmemory-policy
```

Expected output:
```
1) "maxmemory-policy"
2) "noeviction"
```

### Alternative: Separate Redis Instances

For better isolation, consider using separate Redis instances:

1. **Cache Redis** (volatile-lru) - For map/stats caching
2. **Queue Redis** (noeviction) - For BullMQ jobs

Update `apps/api/.env`:

```env
# Cache Redis (can use volatile-lru)
REDIS_URL=redis://...

# Queue Redis (must use noeviction)
REDIS_QUEUE_URL=redis://...
```

Update `apps/api/src/jobs/queue.ts`:

```typescript
import { Redis } from 'ioredis'

const queueRedis = new Redis(process.env.REDIS_QUEUE_URL!, {
  maxRetriesPerRequest: null,
})

export const notificationQueue = new Queue('notifications', {
  connection: queueRedis,
})
```

## Memory Management

### Recommended Memory Limits

- **Development:** 256 MB (Upstash free tier)
- **Production:** 1-2 GB minimum

### Monitor Memory Usage

```bash
redis-cli -u $REDIS_URL INFO memory
```

Key metrics:
- `used_memory_human` - Current memory usage
- `maxmemory_human` - Memory limit
- `evicted_keys` - Number of evicted keys (should be 0 with noeviction)

### What Happens with `noeviction`

When memory limit is reached:
- Redis returns `OOM` (Out Of Memory) errors
- Application can handle errors gracefully
- No silent data loss
- Alerts can be triggered

This is **much better** than silently losing job queue data.

## Cache TTL Configuration

Current TTLs in the codebase:

| Cache Type | TTL | Location |
|------------|-----|----------|
| Map pins | 30s | `apps/api/src/routes/map.ts` |
| Heatmap | 5min | `apps/api/src/routes/map.ts` |
| Statistics | 5min | `apps/api/src/routes/statistics.ts` |
| Leaderboard | 10min | `apps/api/src/routes/statistics.ts` |

These can be adjusted via environment variables:

```env
CACHE_TTL_MAP=30
CACHE_TTL_HEATMAP=300
CACHE_TTL_STATS=300
```

## Troubleshooting

### Jobs Not Processing

If BullMQ jobs are stuck:

1. Check eviction policy: `CONFIG GET maxmemory-policy`
2. Check memory usage: `INFO memory`
3. Check evicted keys: `INFO stats | grep evicted`
4. Check queue keys: `KEYS bull:*`

### High Memory Usage

If Redis memory is growing:

1. Check cache key count: `DBSIZE`
2. Check TTLs: `TTL <key>`
3. Clear cache: `FLUSHDB` (development only!)
4. Increase memory limit or optimize cache TTLs

## Production Checklist

- [ ] Eviction policy set to `noeviction`
- [ ] Memory limit ≥ 1 GB
- [ ] Monitoring/alerts configured for memory usage
- [ ] Backup/persistence enabled (if using self-hosted Redis)
- [ ] Connection pooling configured
- [ ] TLS enabled for production connections

## References

- [Redis Eviction Policies](https://redis.io/docs/manual/eviction/)
- [BullMQ Redis Configuration](https://docs.bullmq.io/guide/connections)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
