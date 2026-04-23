#!/usr/bin/env node
// ── apps/api/tests/test-analytics-edge-cases.js ──
// Test edge cases and error scenarios for analytics endpoints

const API_BASE = process.env.API_URL || 'http://localhost:4000/api/v1'

const TEST_CREDENTIALS = {
  email: 'admin@laporin.com',
  password: 'password123'
}

let authToken = null

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✓' : '✗'
  const color = status === 'PASS' ? 'green' : 'red'
  log(`${icon} ${name}`, color)
  if (details) {
    console.log(`  ${details}`)
  }
}

async function login() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_CREDENTIALS)
  })
  const data = await response.json()
  authToken = data.data.accessToken
}

async function testEdgeCases() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bold')
  log('║         ANALYTICS EDGE CASES & ERROR SCENARIOS             ║', 'bold')
  log('╚════════════════════════════════════════════════════════════╝', 'bold')

  await login()

  // Test 1: Invalid period values
  log('\n📋 Testing Invalid Period Values', 'cyan')
  
  const invalidPeriods = ['7', '60', '180', 'abc', '-30', '0', '999']
  for (const period of invalidPeriods) {
    try {
      const response = await fetch(`${API_BASE}/gov/analytics/overview?period=${period}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      
      if (response.status === 400) {
        logTest(`Invalid period "${period}" rejected`, 'PASS', 'Returns 400 Bad Request')
      } else {
        logTest(`Invalid period "${period}" rejected`, 'FAIL', `Expected 400, got ${response.status}`)
      }
    } catch (error) {
      logTest(`Invalid period "${period}" test`, 'FAIL', error.message)
    }
  }

  // Test 2: Missing required parameters
  log('\n📋 Testing Missing Parameters', 'cyan')
  
  try {
    const response = await fetch(`${API_BASE}/gov/analytics/overview`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const data = await response.json()
    
    if (response.ok && data.success) {
      logTest('Missing period uses default', 'PASS', 'Defaults to 30 days')
    } else {
      logTest('Missing period uses default', 'FAIL', 'Should use default value')
    }
  } catch (error) {
    logTest('Missing period test', 'FAIL', error.message)
  }

  // Test 3: Empty data scenarios
  log('\n📋 Testing Empty Data Handling', 'cyan')
  
  // Test with officer who has no assigned reports
  try {
    const officerLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'budi.santoso@bandung.go.id',
        password: 'password123'
      })
    })
    const officerData = await officerLogin.json()
    const officerToken = officerData.data.accessToken

    const response = await fetch(`${API_BASE}/gov/analytics/overview?period=30`, {
      headers: { 'Authorization': `Bearer ${officerToken}` }
    })
    const data = await response.json()
    
    if (response.ok && data.success) {
      logTest('Empty data returns valid response', 'PASS', `Total reports: ${data.data.totalReports}`)
    } else {
      logTest('Empty data returns valid response', 'FAIL', 'Should return valid response with zeros')
    }
  } catch (error) {
    logTest('Empty data test', 'FAIL', error.message)
  }

  // Test 4: Concurrent requests (race conditions)
  log('\n📋 Testing Concurrent Requests', 'cyan')
  
  try {
    const promises = Array(10).fill(null).map(() => 
      fetch(`${API_BASE}/gov/analytics/overview?period=30`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
    )
    
    const responses = await Promise.all(promises)
    const allSuccessful = responses.every(r => r.ok)
    
    if (allSuccessful) {
      logTest('Concurrent requests handled', 'PASS', '10 simultaneous requests succeeded')
    } else {
      logTest('Concurrent requests handled', 'FAIL', 'Some requests failed')
    }
  } catch (error) {
    logTest('Concurrent requests test', 'FAIL', error.message)
  }

  // Test 5: Large period (365 days)
  log('\n📋 Testing Large Time Periods', 'cyan')
  
  try {
    const start = Date.now()
    const response = await fetch(`${API_BASE}/gov/analytics/trends?period=365`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const duration = Date.now() - start
    const data = await response.json()
    
    if (response.ok && data.success) {
      const dataPoints = data.data.length
      logTest('365-day period handled', 'PASS', `${dataPoints} data points in ${duration}ms`)
      
      if (duration < 1000) {
        logTest('Performance acceptable', 'PASS', `Response time: ${duration}ms`)
      } else {
        logTest('Performance acceptable', 'FAIL', `Too slow: ${duration}ms`)
      }
    } else {
      logTest('365-day period handled', 'FAIL', 'Request failed')
    }
  } catch (error) {
    logTest('Large period test', 'FAIL', error.message)
  }

  // Test 6: Special characters in query params
  log('\n📋 Testing Special Characters', 'cyan')
  
  const specialChars = ['<script>', 'DROP TABLE', '../../../etc/passwd', '%00', '\\x00']
  for (const char of specialChars) {
    try {
      const response = await fetch(`${API_BASE}/gov/analytics/overview?period=${encodeURIComponent(char)}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      
      if (response.status === 400) {
        logTest(`Special char "${char}" rejected`, 'PASS', 'Returns 400 Bad Request')
      } else {
        logTest(`Special char "${char}" rejected`, 'FAIL', `Expected 400, got ${response.status}`)
      }
    } catch (error) {
      logTest(`Special char "${char}" test`, 'FAIL', error.message)
    }
  }

  // Test 7: Response format consistency
  log('\n📋 Testing Response Format Consistency', 'cyan')
  
  const endpoints = [
    '/gov/analytics/overview?period=30',
    '/gov/analytics/trends?period=30',
    '/gov/analytics/categories?period=30',
    '/gov/analytics/sla?period=30',
    '/gov/analytics/satisfaction?period=30',
    '/gov/analytics/anomalies',
    '/gov/analytics/category-trends?period=30',
    '/gov/analytics/officer-performance?period=30',
    '/gov/analytics/insights'
  ]
  
  let allConsistent = true
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      
      if (!data.hasOwnProperty('success') || !data.hasOwnProperty('data')) {
        allConsistent = false
        logTest(`${endpoint} format`, 'FAIL', 'Missing success or data field')
      }
    } catch (error) {
      allConsistent = false
      logTest(`${endpoint} format`, 'FAIL', error.message)
    }
  }
  
  if (allConsistent) {
    logTest('All endpoints use consistent format', 'PASS', 'success and data fields present')
  }

  // Test 8: Null/undefined handling
  log('\n📋 Testing Null/Undefined Handling', 'cyan')
  
  try {
    const response = await fetch(`${API_BASE}/gov/analytics/satisfaction?period=30`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const data = await response.json()
    
    if (response.ok && data.success) {
      const hasNullHandling = data.data.averageRating === null || typeof data.data.averageRating === 'number'
      if (hasNullHandling) {
        logTest('Null values handled correctly', 'PASS', `averageRating: ${data.data.averageRating}`)
      } else {
        logTest('Null values handled correctly', 'FAIL', 'averageRating should be null or number')
      }
    }
  } catch (error) {
    logTest('Null handling test', 'FAIL', error.message)
  }

  // Test 9: Decimal precision
  log('\n📋 Testing Decimal Precision', 'cyan')
  
  try {
    const response = await fetch(`${API_BASE}/gov/analytics/overview?period=30`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const data = await response.json()
    
    if (response.ok && data.success) {
      const avgDays = data.data.avgResolutionDays
      const slaPercent = data.data.slaCompliancePercent
      
      const avgDecimals = avgDays.toString().split('.')[1]?.length || 0
      const slaDecimals = slaPercent.toString().split('.')[1]?.length || 0
      
      if (avgDecimals <= 1 && slaDecimals <= 1) {
        logTest('Decimal precision correct', 'PASS', 'Values rounded to 1 decimal place')
      } else {
        logTest('Decimal precision correct', 'FAIL', `Too many decimals: avg=${avgDecimals}, sla=${slaDecimals}`)
      }
    }
  } catch (error) {
    logTest('Decimal precision test', 'FAIL', error.message)
  }

  log('\n✅ Edge case testing completed', 'green')
}

testEdgeCases().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
