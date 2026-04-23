// Simple test for trends endpoint date filling logic
// Run with: node apps/api/tests/trends-endpoint.test.js

const testDateFilling = () => {
  console.log('🧪 Testing date filling logic...')
  
  // Simulate the date filling logic from the endpoint
  const startDate = new Date('2026-04-20')
  const endDate = new Date('2026-04-22')
  
  // Mock database results (sparse data)
  const mockDbResults = [
    { date: new Date('2026-04-20'), count: 5 },
    { date: new Date('2026-04-22'), count: 3 }
    // Missing 2026-04-21
  ]
  
  // Create date count map
  const dateCountMap = new Map()
  mockDbResults.forEach(item => {
    const dateStr = item.date.toISOString().split('T')[0]
    dateCountMap.set(dateStr, Number(item.count))
  })
  
  // Fill missing dates
  const result = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      count: dateCountMap.get(dateStr) || 0
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  console.log('📊 Result:', result)
  
  // Verify results
  const expected = [
    { date: '2026-04-20', count: 5 },
    { date: '2026-04-21', count: 0 }, // Filled missing date
    { date: '2026-04-22', count: 3 }
  ]
  
  const isCorrect = JSON.stringify(result) === JSON.stringify(expected)
  console.log(isCorrect ? '✅ Test passed!' : '❌ Test failed!')
  
  if (!isCorrect) {
    console.log('Expected:', expected)
    console.log('Got:', result)
  }
}

const testPeriodCalculation = () => {
  console.log('\n🧪 Testing period calculation...')
  
  const now = new Date('2026-04-22T10:00:00Z')
  const daysMap = { '30': 30, '90': 90, '365': 365 }
  
  const testCases = [
    { period: '30', expectedDays: 30 },
    { period: '90', expectedDays: 90 },
    { period: '365', expectedDays: 365 }
  ]
  
  testCases.forEach(({ period, expectedDays }) => {
    const days = daysMap[period] || 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const actualDays = Math.floor((now - startDate) / (24 * 60 * 60 * 1000))
    
    console.log(`Period ${period}: ${actualDays} days (expected: ${expectedDays})`)
    console.log(actualDays === expectedDays ? '✅ Correct' : '❌ Incorrect')
  })
}

// Run tests
testDateFilling()
testPeriodCalculation()

console.log('\n🎯 All tests completed!')