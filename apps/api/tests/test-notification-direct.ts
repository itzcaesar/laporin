// ── apps/api/tests/test-notification-direct.ts ──
// Direct test of notification functions (no database required)

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '../.env') })

import * as nodemailer from 'nodemailer'
import { env } from '../src/env.js'

/**
 * Test email sending directly
 */
async function testEmail() {
  console.log('📧 Testing email notification...\n')

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })

    const testEmail = 'elsherlus@gmail.com'
    const trackingCode = `LP-2026-TEST-${Date.now().toString().slice(-5)}`

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    h1 {
      color: #1f2937;
      font-size: 20px;
      margin-bottom: 16px;
    }
    .content {
      color: #4b5563;
      margin-bottom: 24px;
    }
    .cta {
      text-align: center;
      margin: 32px 0;
    }
    .cta a {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📢 Laporin</div>
    </div>
    <h1>✅ Test Notification - Laporan Berhasil Diterima</h1>
    <div class="content">
      <p>Halo,</p>
      <p>Ini adalah <strong>test notification</strong> dari sistem Laporin.</p>
      <p><strong>Kode Pelacakan:</strong> ${trackingCode}</p>
      <p><strong>Judul:</strong> Test Laporan - Jalan Rusak</p>
      <p><strong>Kategori:</strong> 🛣️ Jalan Rusak</p>
      <p>Jika Anda menerima email ini, berarti sistem notifikasi email berfungsi dengan baik! ✅</p>
    </div>
    <div class="cta">
      <a href="https://laporin.site">Kunjungi Laporin</a>
    </div>
    <div class="footer">
      <p>Email ini dikirim secara otomatis oleh sistem Laporin.</p>
      <p>Ini adalah test notification - tidak perlu ditindaklanjuti.</p>
    </div>
  </div>
</body>
</html>
    `.trim()

    console.log(`Sending to: ${testEmail}`)
    console.log(`From: ${env.SMTP_FROM}`)
    console.log(`SMTP: ${env.SMTP_HOST}:${env.SMTP_PORT}\n`)

    const result = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: testEmail,
      subject: '✅ Test Notification - Laporin',
      html: htmlContent,
    })

    console.log('✅ Email sent successfully!')
    console.log(`   Message ID: ${result.messageId}`)
    console.log(`   Response: ${result.response}`)
    console.log(`\n📬 Check your inbox: ${testEmail}`)

    return true
  } catch (error) {
    console.error('❌ Email test failed:', error)
    return false
  }
}

/**
 * Test WhatsApp sending directly
 */
async function testWhatsApp() {
  console.log('\n📱 Testing WhatsApp notification...\n')

  try {
    if (!env.FONNTE_TOKEN) {
      console.warn('⚠️  FONNTE_TOKEN not configured, skipping WhatsApp test')
      return false
    }

    const testPhone = '081219713472'
    const trackingCode = `LP-2026-TEST-${Date.now().toString().slice(-5)}`

    const message = `✅ *Test Notification - Laporin*

Halo! Ini adalah test notification dari sistem Laporin.

Kode: ${trackingCode}
Judul: Test Laporan - Jalan Rusak
Kategori: 🛣️ Jalan Rusak

Jika Anda menerima pesan ini, berarti sistem notifikasi WhatsApp berfungsi dengan baik! ✅

Kunjungi: https://laporin.site`

    console.log(`Sending to: ${testPhone}`)
    console.log(`Token: ${env.FONNTE_TOKEN.substring(0, 10)}...\n`)

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: env.FONNTE_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: testPhone,
        message,
        countryCode: '62',
      }),
    })

    const result = await response.json()

    if (!response.ok || result.status === false) {
      throw new Error(result.reason || 'Fonnte API error')
    }

    console.log('✅ WhatsApp sent successfully!')
    console.log(`   Response:`, result)
    console.log(`\n📱 Check your WhatsApp: ${testPhone}`)

    return true
  } catch (error) {
    console.error('❌ WhatsApp test failed:', error)
    return false
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Laporin Notification Service Test\n')
  console.log('=' .repeat(50))
  console.log('\n')

  const emailSuccess = await testEmail()
  const whatsappSuccess = await testWhatsApp()

  console.log('\n')
  console.log('=' .repeat(50))
  console.log('\n📊 Test Results:\n')
  console.log(`   Email:    ${emailSuccess ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`   WhatsApp: ${whatsappSuccess ? '✅ PASSED' : '❌ FAILED'}`)
  console.log('\n')

  if (emailSuccess || whatsappSuccess) {
    console.log('✅ At least one notification channel is working!')
  } else {
    console.log('❌ All notification channels failed')
  }

  process.exit(emailSuccess || whatsappSuccess ? 0 : 1)
}

// Run tests
runTests()
