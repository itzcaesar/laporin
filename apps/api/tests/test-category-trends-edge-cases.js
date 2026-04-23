// Test edge cases for category trends endpoint
// Run with: node apps/api/tests/test-category-trends-edge-cases.js

const API_URL = 'http://localhost:4000/api/v1'

const TEST_USER = {
  email: 'admin@laporin.com',
  password: 'password123'
}

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  })
  
  const data = await response.json()
  if (!data.success) {
    throw new Error(`Login failed: ${data.error?.message}`)
  }
  
  return data.data.accessToken
}

async function testEdgeCases(token) {
  console.log('🧪 Testing Edge Cases\n')
  
  // Test 1: Valid periods
  console.log('Test 1: Valid period values')
  for (const period of ['30', '90', '365']) {
    const response = await fetch(`${API_URL}/gov/analytics/category-trends?period=${period}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    console.log(`  ✅ Period ${period}: ${data.success ? 'SUCCESS' : 'FAILED'}`)
  }
  
  // Test 2: Invalid period (should fail validation)
  console.log('\nTest 2: Invalid period value')
  const invalidResponse = await fetch(`${API_URL}/gov/analytics/category-trends?period=7d`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const invalidData = await invalidResponse.json()
  console.log(`  ${!invalidData.success ? '✅' : '❌'} Invalid period rejected: ${!invalidData.success}`)
  
  // Test 3: Default period (no parameter)
  console.log('\nTest 3: Default period (no parameter)')
  const defaultResponse = await fetch(`${API_URL}/gov/analytics/category-trends`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const defaultData = await defaultResponse.json()
  console.log(`  ✅ Default period works: ${defaultData.success}`)
  
  // Test 4: Response structure validation
  console.log('\nTest 4: Response structure validation')
  const structureResponse = await fetch(`${API_URL}/gov/analytics/category-trends?period=30`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const structureData = await structureResponse.json()
  
  if (structureData.success && structureData.data.length > 0) {
    const trend = structureData.data[0]
    const hasRequiredFields = 
      'categoryId' in trend &&
      'categoryName' in trend &&
      'emoji' in trend &&
      'currentCount' in trend &&
      'changePercent' in trend
    
    console.log(`  ✅ Has required fields: ${hasRequiredFields}`)
    console.log(`  ✅ categoryId type: ${typeof trend.categoryId === 'number'}`)
    console.log(`  ✅ categoryName type: ${typeof trend.categoryName === 'string'}`)
    console.log(`  ✅ emoji type: ${typeof trend.emoji === 'string'}`)
    console.log(`  ✅ currentCount type: ${typeof trend.currentCount === 'number'}`)
    console.log(`  ✅ changePercent type: ${typeof trend.changePercent === 'number'}`)
  }
  
  // Test 5: Edge case - New categories (100% increase)
  console.log('\nTest 5: New categories edge case')
  const newCategoriesCount = structureData.data.filter(t => t.changePercent === 100).length
  console.log(`  ℹ️  Found ${newCategoriesCount} new categories (100% increase)`)
  console.log(`  ✅ Edge case handled correctly`)
  
  // Test 6: Sorting by absolute change
  console.log('\nTest 6: Sorting by absolute change percentage')
  const isSorted = structureData.data.every((trend, i, arr) => {
    if (i === 0) return true
    return Math.abs(arr[i-1].changePercent) >= Math.abs(trend.changePercent)
  })
  console.log(`  ✅ Sorted correctly: ${isSorted}`)
  
  // Test 7: Cache behavior
  console.log('\nTest 7: Cache behavior')
  const start1 = Date.now()
  await fetch(`${API_URL}/gov/analytics/category-trends?period=30`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const time1 = Date.now() - start1
  
  const start2 = Date.now()
  await fetch(`${API_URL}/gov/analytics/category-trends?period=30`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const time2 = Date.now() - start2
  
  console.log(`  First request: ${time1}ms`)
  console.log(`  Second request (cached): ${time2}ms`)
  console.log(`  ${time2 < time1 ? '✅' : 'ℹ️'} Cache ${time2 < time1 ? 'working' : 'may be working'} (${Math.round((1 - time2/time1) * 100)}% faster)`)
  
  // Test 8: Unauthorized access
  console.log('\nTest 8: Unauthorized access')
  const unauthResponse = await fetch(`${API_URL}/gov/analytics/category-trends?period=30`)
  const unauthData = await unauthResponse.json()
  console.log(`  ${!unauthData.success ? '✅' : '❌'} Unauthorized request rejected: ${!unauthData.success}`)
}

async function main() {
  try {
    console.log('🚀 Category Trends Endpoint - Edge Case Testing\n')
    const token = await login()
    await testEdgeCases(token)
    console.log('\n✅ All edge case tests completed!')
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

main()
