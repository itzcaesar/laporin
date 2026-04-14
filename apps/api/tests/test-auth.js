// ── Test script for auth endpoints ──
// Run with: node apps/api/test-auth.js

const BASE_URL = 'http://localhost:4000/api/v1'

async function testAuth() {
  console.log('🧪 Testing Laporin Auth Endpoints\n')

  try {
    // 1. Register a new user
    console.log('1️⃣  Testing POST /auth/register')
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'Test1234',
        name: 'Test User',
      }),
    })
    const registerData = await registerRes.json()
    console.log('   Status:', registerRes.status)
    console.log('   Response:', JSON.stringify(registerData, null, 2))

    if (!registerData.data) {
      console.log('❌ Registration failed\n')
      return
    }

    const { accessToken, refreshToken } = registerData.data
    const userEmail = registerData.data.user.email
    console.log('✅ Registration successful\n')

    // 2. Get user profile
    console.log('2️⃣  Testing GET /auth/me')
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const meData = await meRes.json()
    console.log('   Status:', meRes.status)
    console.log('   Response:', JSON.stringify(meData, null, 2))
    console.log('✅ Get profile successful\n')

    // 3. Refresh token
    console.log('3️⃣  Testing POST /auth/refresh')
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const refreshData = await refreshRes.json()
    console.log('   Status:', refreshRes.status)
    console.log('   Response:', JSON.stringify(refreshData, null, 2))
    console.log('✅ Token refresh successful\n')

    // 4. Send OTP
    console.log('4️⃣  Testing POST /auth/otp/send')
    const otpSendRes = await fetch(`${BASE_URL}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    })
    const otpSendData = await otpSendRes.json()
    console.log('   Status:', otpSendRes.status)
    console.log('   Response:', JSON.stringify(otpSendData, null, 2))

    if (otpSendData.data?.otp) {
      console.log('✅ OTP sent successfully\n')

      // 5. Verify OTP
      console.log('5️⃣  Testing POST /auth/otp/verify')
      const otpVerifyRes = await fetch(`${BASE_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          otp: otpSendData.data.otp,
        }),
      })
      const otpVerifyData = await otpVerifyRes.json()
      console.log('   Status:', otpVerifyRes.status)
      console.log('   Response:', JSON.stringify(otpVerifyData, null, 2))
      console.log('✅ OTP verification successful\n')
    }

    // 6. Login with the registered user
    console.log('6️⃣  Testing POST /auth/login')
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: 'Test1234',
      }),
    })
    const loginData = await loginRes.json()
    console.log('   Status:', loginRes.status)
    console.log('   Response:', JSON.stringify(loginData, null, 2))
    console.log('✅ Login successful\n')

    // 7. Logout
    console.log('7️⃣  Testing POST /auth/logout')
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const logoutData = await logoutRes.json()
    console.log('   Status:', logoutRes.status)
    console.log('   Response:', JSON.stringify(logoutData, null, 2))
    console.log('✅ Logout successful\n')

    console.log('🎉 All auth tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAuth()
