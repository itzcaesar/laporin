// Test script for category trends endpoint
// Run with: node apps/api/tests/test-category-trends.js

const API_URL = 'http://localhost:4000/api/v1'

// Test credentials (using test admin user)
const TEST_USER = {
  email: 'admin@laporin.com',
  password: 'password123'
}

async function login() {
  console.log('🔐 Logging in...')
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  })
  
  const data = await response.json()
  if (!data.success) {
    throw new Error(`Login failed: ${data.error?.message}`)
  }
  
  console.log('✅ Login successful')
  return data.data.accessToken
}

async function testCategoryTrends(token, period) {
  console.log(`\n📊 Testing category trends (period: ${period})...`)
  
  const response = await fetch(`${API_URL}/gov/analytics/category-trends?period=${period}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  const data = await response.json()
  
  if (!data.success) {
    console.error('❌ Request failed:', data.error)
    return
  }
  
  console.log('✅ Request successful')
  console.log(`📈 Found ${data.data.length} categories with trends`)
  
  // Display top 5 trends
  console.log('\nTop 5 Category Trends:')
  data.data.slice(0, 5).forEach((trend, index) => {
    const arrow = trend.changePercent > 0 ? '📈' : trend.changePercent < 0 ? '📉' : '➡️'
    console.log(`${index + 1}. ${trend.emoji} ${trend.categoryName}`)
    console.log(`   Current: ${trend.currentCount} reports`)
    console.log(`   Change: ${arrow} ${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}%`)
  })
  
  // Test edge cases
  const newCategories = data.data.filter(t => t.changePercent === 100)
  if (newCategories.length > 0) {
    console.log(`\n🆕 Found ${newCategories.length} new categories (100% increase)`)
  }
  
  const zeroCategories = data.data.filter(t => t.currentCount === 0)
  if (zeroCategories.length > 0) {
    console.log(`\n⚠️ Found ${zeroCategories.length} categories with zero current reports`)
  }
}

async function main() {
  try {
    const token = await login()
    
    // Test all period options
    await testCategoryTrends(token, '30')
    await testCategoryTrends(token, '90')
    await testCategoryTrends(token, '365')
    
    console.log('\n✅ All tests completed successfully!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

main()
