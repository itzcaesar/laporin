#!/usr/bin/env node
// ── apps/api/tests/test-all-analytics-endpoints.js ──
// Comprehensive test for all 9 analytics endpoints

const API_BASE = process.env.API_URL || 'http://localhost:4000/api/v1'

// Test credentials - using government admin account (has access to analytics)
const TEST_CREDENTIALS = {
  email: 'admin@laporin.com',
  password: 'password123'
}

let authToken = null

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(60))
  log(title, 'bold')
  console.log('='.repeat(60))
}

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✓' : '✗'
  const color = status === 'PASS' ? 'green' : 'red'
  log(`${icon} ${name}`, color)
  if (details) {
    console.log(`  ${details}`)
  }
}

// Login to get auth token
async function login() {
  logSection('🔐 Authentication')
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CREDENTIALS)
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Login failed')
    }

    authToken = data.data.accessToken
    logTest('Login successful', 'PASS', `Token: ${authToken.substring(0, 20)}...`)
    return true
  } catch (error) {
    logTest('Login failed', 'FAIL', error.message)
    return false
  }
}

// Test helper function
async function testEndpoint(name, path, expectedFields = []) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    const data = await response.json()

    // Check response status
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`)
    }

    // Check envelope structure
    if (!data.success) {
      throw new Error('Response success field is false')
    }

    if (!data.data) {
      throw new Error('Response missing data field')
    }

    // Check expected fields
    const missingFields = []
    for (const field of expectedFields) {
      if (!(field in data.data)) {
        missingFields.push(field)
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`)
    }

    // Log success with data preview
    const dataPreview = JSON.stringify(data.data, null, 2)
      .split('\n')
      .slice(0, 10)
      .join('\n')
    
    logTest(name, 'PASS', `Data preview:\n${dataPreview}${Object.keys(data.data).length > 10 ? '\n  ...' : ''}`)
    
    return { success: true, data: data.data }
  } catch (error) {
    logTest(name, 'FAIL', error.message)
    return { success: false, error: error.message }
  }
}

// Test all analytics endpoints
async function testAllEndpoints() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    endpoints: []
  }

  const tests = [
    {
      name: '1. Analytics Overview',
      path: '/gov/analytics/overview?period=30',
      fields: ['totalReports', 'completedReports', 'avgResolutionDays', 'slaCompliancePercent', 'cachedAt']
    },
    {
      name: '2. Analytics Trends',
      path: '/gov/analytics/trends?period=30',
      fields: [] // Array of objects with date and count
    },
    {
      name: '3. Categories Distribution',
      path: '/gov/analytics/categories?period=30',
      fields: [] // Array of objects
    },
    {
      name: '4. SLA Compliance',
      path: '/gov/analytics/sla?period=30',
      fields: ['onTime', 'breached']
    },
    {
      name: '5. Satisfaction Score',
      path: '/gov/analytics/satisfaction?period=30',
      fields: ['averageRating', 'totalRatings']
    },
    {
      name: '6. Anomaly Detection',
      path: '/gov/analytics/anomalies',
      fields: [] // Array of anomalies
    },
    {
      name: '7. Category Trends',
      path: '/gov/analytics/category-trends?period=30',
      fields: [] // Array of trends
    },
    {
      name: '8. Officer Performance',
      path: '/gov/analytics/officer-performance?period=30',
      fields: [] // Array of officers
    },
    {
      name: '9. AI Insights',
      path: '/gov/analytics/insights',
      fields: ['insights', 'generatedAt']
    }
  ]

  logSection('📊 Testing All Analytics Endpoints')

  for (const test of tests) {
    results.total++
    const result = await testEndpoint(test.name, test.path, test.fields)
    
    if (result.success) {
      results.passed++
    } else {
      results.failed++
    }
    
    results.endpoints.push({
      name: test.name,
      path: test.path,
      success: result.success,
      error: result.error
    })

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

// Test with different time periods
async function testTimePeriods() {
  logSection('📅 Testing Different Time Periods')

  const periods = ['30', '90', '365']
  const results = []

  for (const period of periods) {
    log(`\nTesting period: ${period} days`, 'cyan')
    
    const result = await testEndpoint(
      `Overview - ${period} days`,
      `/gov/analytics/overview?period=${period}`,
      ['totalReports', 'completedReports']
    )
    
    results.push({ period, success: result.success })
  }

  return results
}

// Test authentication and authorization
async function testAuth() {
  logSection('🔒 Testing Authentication & Authorization')

  // Test without token
  try {
    const response = await fetch(`${API_BASE}/gov/analytics/overview?period=30`)
    const data = await response.json()

    if (response.status === 401) {
      logTest('Unauthorized access blocked', 'PASS', 'Returns 401 without token')
    } else {
      logTest('Unauthorized access blocked', 'FAIL', 'Should return 401 without token')
    }
  } catch (error) {
    logTest('Unauthorized access test', 'FAIL', error.message)
  }

  // Test with invalid token
  try {
    const response = await fetch(`${API_BASE}/gov/analytics/overview?period=30`, {
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      }
    })
    const data = await response.json()

    if (response.status === 401) {
      logTest('Invalid token rejected', 'PASS', 'Returns 401 with invalid token')
    } else {
      logTest('Invalid token rejected', 'FAIL', 'Should return 401 with invalid token')
    }
  } catch (error) {
    logTest('Invalid token test', 'FAIL', error.message)
  }
}

// Test caching behavior
async function testCaching() {
  logSection('💾 Testing Redis Caching')

  const endpoint = '/gov/analytics/overview?period=30'

  // First request (cache miss)
  const start1 = Date.now()
  const result1 = await testEndpoint('First request (cache miss)', endpoint, ['cachedAt'])
  const time1 = Date.now() - start1

  // Second request (cache hit)
  await new Promise(resolve => setTimeout(resolve, 100))
  const start2 = Date.now()
  const result2 = await testEndpoint('Second request (cache hit)', endpoint, ['cachedAt'])
  const time2 = Date.now() - start2

  if (result1.success && result2.success) {
    log(`\nCache performance:`, 'cyan')
    log(`  First request:  ${time1}ms`, 'yellow')
    log(`  Second request: ${time2}ms`, 'yellow')
    
    if (time2 < time1) {
      logTest('Cache improves performance', 'PASS', `${Math.round((1 - time2/time1) * 100)}% faster`)
    } else {
      logTest('Cache improves performance', 'FAIL', 'Second request not faster')
    }

    // Check if cachedAt timestamp is the same (indicates cache hit)
    if (result1.data.cachedAt === result2.data.cachedAt) {
      logTest('Cache returns same data', 'PASS', 'cachedAt timestamp matches')
    } else {
      logTest('Cache returns same data', 'FAIL', 'cachedAt timestamp differs')
    }
  }
}

// Test input validation
async function testValidation() {
  logSection('✅ Testing Input Validation')

  // Test invalid period
  try {
    const response = await fetch(`${API_BASE}/gov/analytics/overview?period=invalid`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    const data = await response.json()

    if (response.status === 400) {
      logTest('Invalid period rejected', 'PASS', 'Returns 400 for invalid period')
    } else {
      logTest('Invalid period rejected', 'FAIL', 'Should return 400 for invalid period')
    }
  } catch (error) {
    logTest('Invalid period test', 'FAIL', error.message)
  }

  // Test missing period (should use default)
  try {
    const response = await fetch(`${API_BASE}/gov/analytics/overview`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    const data = await response.json()

    if (response.ok && data.success) {
      logTest('Missing period uses default', 'PASS', 'Defaults to 30 days')
    } else {
      logTest('Missing period uses default', 'FAIL', 'Should use default period')
    }
  } catch (error) {
    logTest('Missing period test', 'FAIL', error.message)
  }
}

// Main test runner
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bold')
  log('║     GOVERNMENT ANALYTICS SYSTEM - ENDPOINT TEST SUITE      ║', 'bold')
  log('╚════════════════════════════════════════════════════════════╝', 'bold')
  
  log(`\nAPI Base URL: ${API_BASE}`, 'cyan')
  log(`Test User: ${TEST_CREDENTIALS.email}`, 'cyan')

  // Step 1: Login
  const loginSuccess = await login()
  if (!loginSuccess) {
    log('\n❌ Cannot proceed without authentication', 'red')
    process.exit(1)
  }

  // Step 2: Test all endpoints
  const endpointResults = await testAllEndpoints()

  // Step 3: Test time periods
  const periodResults = await testTimePeriods()

  // Step 4: Test authentication
  await testAuth()

  // Step 5: Test caching
  await testCaching()

  // Step 6: Test validation
  await testValidation()

  // Final summary
  logSection('📋 Test Summary')
  
  log(`\nEndpoint Tests:`, 'bold')
  log(`  Total:  ${endpointResults.total}`, 'cyan')
  log(`  Passed: ${endpointResults.passed}`, 'green')
  log(`  Failed: ${endpointResults.failed}`, endpointResults.failed > 0 ? 'red' : 'green')

  if (endpointResults.failed > 0) {
    log(`\nFailed Endpoints:`, 'red')
    endpointResults.endpoints
      .filter(e => !e.success)
      .forEach(e => {
        log(`  • ${e.name}`, 'red')
        log(`    ${e.error}`, 'yellow')
      })
  }

  const successRate = Math.round((endpointResults.passed / endpointResults.total) * 100)
  log(`\nSuccess Rate: ${successRate}%`, successRate === 100 ? 'green' : 'yellow')

  if (successRate === 100) {
    log('\n✅ All tests passed! Analytics system is working correctly.', 'green')
    process.exit(0)
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow')
    process.exit(1)
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
