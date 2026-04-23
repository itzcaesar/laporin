// ── apps/api/tests/cache-invalidation-test.js ──
// Manual test to verify cache invalidation on report status changes

/**
 * Test Plan:
 * 
 * 1. Create a test report
 * 2. Fetch analytics (should cache the data)
 * 3. Update report status to 'completed'
 * 4. Verify cache was invalidated by checking Redis keys
 * 5. Fetch analytics again (should fetch fresh data)
 * 
 * Expected Behavior:
 * - After status update, analytics cache keys matching pattern should be deleted
 * - Pattern: analytics:*:{agencyId}:*
 * - Anomaly cache: analytics:anomalies:{agencyId}
 */

console.log('Cache Invalidation Test Plan')
console.log('============================')
console.log('')
console.log('Endpoints that trigger cache invalidation:')
console.log('1. PATCH /gov/reports/:id/verify - When report is verified')
console.log('2. PATCH /gov/reports/:id/assign - When report is assigned')
console.log('3. PATCH /gov/reports/:id/status - When report status changes')
console.log('4. POST /reports/:id/verify-complete - When citizen verifies completion')
console.log('')
console.log('Cache patterns invalidated:')
console.log('- analytics:*:{agencyId}:*')
console.log('- analytics:anomalies:{agencyId}')
console.log('')
console.log('To test manually:')
console.log('1. Start the API server: pnpm dev')
console.log('2. Login as a government officer')
console.log('3. Update a report status via any of the above endpoints')
console.log('4. Check Redis to verify cache keys were deleted')
console.log('5. Fetch analytics to verify fresh data is returned')
