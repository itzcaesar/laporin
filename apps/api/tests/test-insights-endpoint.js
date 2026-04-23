/**
 * Test script for Analytics Insights Endpoint
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * This script tests the GET /gov/analytics/insights endpoint
 * 
 * Usage:
 *   node apps/api/tests/test-insights-endpoint.js
 */

const BASE_URL = 'http://localhost:4000/api/v1'

// Test credentials - update these with valid test users
const TEST_USERS = {
  officer: {
    email: 'officer@test.com',
    password: 'password123',
    role: 'officer'
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  },
  superAdmin: {
    email: 'superadmin@test.com',
    password: 'password123',
    role: 'super_admin'
  }
}

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  const data = await response.json()
  if (!data.success) {
    throw new Error(`Login failed: ${data.error?.message}`)
  }
  
  return data.data.accessToken
}

async function testInsightsEndpoint(token, testName) {
  console.log(`\n🧪 Testing: ${testName}`)
  
  try {
    const response = await fetch(`${BASE_URL}/gov/analytics/insights`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    console.log(`   Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
    
    // Validate response structure
    if (data.success) {
      if (!data.data) {
        console.log('   ❌ FAIL: Missing data field')
        return false
      }
      
      if (!Array.isArray(data.data.insights)) {
        console.log('   ❌ FAIL: insights should be an array')
        return false
      }
      
      if (data.data.generatedAt !== null && typeof data.data.generatedAt !== 'string') {
        console.log('   ❌ FAIL: generatedAt should be string or null')
        return false
      }
      
      console.log('   ✅ PASS: Response structure is correct')
      return true
    } else {
      console.log('   ⚠️  Request failed (expected for some tests)')
      return false
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    return false
  }
}

async function testWithoutAuth() {
  console.log(`\n🧪 Testing: Insights without authentication`)
  
  try {
    const response = await fetch(`${BASE_URL}/gov/analytics/insights`)
    const data = await response.json()
    
    console.log(`   Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
    
    if (response.status === 401 && !data.success) {
      console.log('   ✅ PASS: Correctly rejected unauthorized request')
      return true
    } else {
      console.log('   ❌ FAIL: Should return 401 for unauthorized request')
      return false
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting Analytics Insights Endpoint Tests')
  console.log('=' .repeat(60))
  
  const results = []
  
  // Test 1: Without authentication
  results.push(await testWithoutAuth())
  
  // Test 2: As officer
  try {
    console.log('\n📝 Logging in as officer...')
    const officerToken = await login(TEST_USERS.officer.email, TEST_USERS.officer.password)
    results.push(await testInsightsEndpoint(officerToken, 'Insights as Officer'))
  } catch (error) {
    console.log(`   ⚠️  Skipping officer test: ${error.message}`)
  }
  
  // Test 3: As admin
  try {
    console.log('\n📝 Logging in as admin...')
    const adminToken = await login(TEST_USERS.admin.email, TEST_USERS.admin.password)
    results.push(await testInsightsEndpoint(adminToken, 'Insights as Admin'))
  } catch (error) {
    console.log(`   ⚠️  Skipping admin test: ${error.message}`)
  }
  
  // Test 4: As super admin
  try {
    console.log('\n📝 Logging in as super admin...')
    const superAdminToken = await login(TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password)
    results.push(await testInsightsEndpoint(superAdminToken, 'Insights as Super Admin'))
  } catch (error) {
    console.log(`   ⚠️  Skipping super admin test: ${error.message}`)
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('=' .repeat(60))
  const passed = results.filter(r => r === true).length
  const total = results.length
  console.log(`   Passed: ${passed}/${total}`)
  console.log(`   Failed: ${total - passed}/${total}`)
  
  if (passed === total) {
    console.log('\n✅ All tests passed!')
  } else {
    console.log('\n⚠️  Some tests failed or were skipped')
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
