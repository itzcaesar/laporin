# Anomaly Detection Endpoint Implementation

## Overview

Implemented `GET /gov/analytics/anomalies` endpoint that detects unusual spikes in report volumes by comparing recent activity (last 24 hours) against a 7-day historical baseline.

## Endpoint Details

**URL:** `GET /api/v1/gov/analytics/anomalies`

**Authentication:** Required (JWT Bearer token)

**Authorization:** Requires `officer` role or higher

## Implementation Features

### 1. Time Range Comparison
- **Recent Period:** Last 24 hours
- **Baseline Period:** Previous 7 days (8 days ago to 1 day ago)
- Calculates daily average from baseline for comparison

### 2. Grouping
- Groups reports by `regionCode` and `categoryId`
- Allows detection of localized spikes in specific categories

### 3. Spike Detection Logic
- Calculates spike percentage: `((recent - baseline) / baseline) * 100`
- Flags as anomaly if spike > 150%
- Handles edge cases:
  - New spikes with no baseline (treated as 100% increase)
  - Zero baseline values

### 4. Role-Based Filtering
- **Officer:** Only sees anomalies for their assigned reports
- **Admin:** Only sees anomalies for their agency
- **Super Admin:** Sees anomalies across all agencies

### 5. Response Format
```typescript
{
  success: true,
  data: [
    {
      id: string,              // Unique identifier: "{regionCode}-{categoryId}-{timestamp}"
      regionName: string,      // Human-readable region name
      categoryName: string,    // Human-readable category name
      spikePercent: number,    // Percentage increase (rounded to 1 decimal)
      hoursAgo: number,        // Always 24 (last 24 hours)
      reportCount: number      // Number of reports in recent period
    }
  ]
}
```

### 6. Caching
- **Cache Key Pattern:** `analytics:anomalies:{agencyId}`
- **TTL:** 1 hour (3600 seconds)
- Reduces database load for frequently accessed data

### 7. Performance Optimizations
- Uses raw SQL queries for efficient aggregation
- Limits results to top 10 anomalies (sorted by spike percentage)
- Batch fetches region and category names

## Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "3201-1-1704067200000",
      "regionName": "Kota Bandung",
      "categoryName": "Jalan Rusak",
      "spikePercent": 250.5,
      "hoursAgo": 24,
      "reportCount": 15
    },
    {
      "id": "3201-5-1704067200000",
      "regionName": "Kota Bandung",
      "categoryName": "Lampu Jalan Mati",
      "spikePercent": 180.2,
      "hoursAgo": 24,
      "reportCount": 8
    }
  ]
}
```

## Testing

Use the provided test file: `apps/api/tests/test-analytics-anomalies.http`

1. Replace `YOUR_JWT_TOKEN_HERE` with a valid JWT token
2. Run the request using REST Client extension in VS Code
3. Verify the response matches the expected format

## Requirements Satisfied

- ✅ 6.1: Compare last 24 hours vs 7-day baseline
- ✅ 6.2: Flag spikes exceeding 150% of baseline
- ✅ 6.3: Group by region and category
- ✅ 6.4: Cache with 1-hour TTL
- ✅ 6.5: Apply role-based filtering

## Notes

- The endpoint returns an empty array if no anomalies are detected
- Region names are fetched from the `agencies` table
- Category names are fetched from the `categories` table
- The implementation handles cases where region or category data is missing
