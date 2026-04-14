// ── apps/api/tests/test-notification-send.ts ──
// Manual test script to send a test notification

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '../.env') })

import { db } from '../src/db.js'
import { addNotificationJob } from '../src/jobs/queue.js'
import { startNotificationWorker } from '../src/jobs/workers/notification.worker.js'

/**
 * Test notification sending
 */
async function testNotification() {
  console.log('🧪 Starting notification test...\n')

  try {
    // Start the notification worker
    console.log('Starting notification worker...')
    const worker = startNotificationWorker()

    // Create or find a test user
    console.log('\n1. Setting up test user...')
    
    let testUser = await db.user.findUnique({
      where: { email: 'elsherlus@gmail.com' },
    })

    if (!testUser) {
      console.log('Creating test user...')
      testUser = await db.user.create({
        data: {
          email: 'elsherlus@gmail.com',
          name: 'Test User',
          passwordHash: 'dummy-hash-for-testing',
          phone: '082144562841',
          role: 'citizen',
          isActive: true,
          isVerified: true,
        },
      })
      console.log(`✓ Test user created: ${testUser.id}`)
    } else {
      // Update phone if needed
      if (testUser.phone !== '082144562841') {
        testUser = await db.user.update({
          where: { id: testUser.id },
          data: { phone: '082144562841' },
        })
      }
      console.log(`✓ Test user found: ${testUser.id}`)
    }

    // Create a test report (or use existing)
    console.log('\n2. Setting up test report...')
    
    const testReport = await db.report.create({
      data: {
        trackingCode: `LP-2026-TEST-${Date.now().toString().slice(-5)}`,
        reporterId: testUser.id,
        categoryId: 1, // Assuming category 1 exists
        title: 'Test Notification - Jalan Rusak',
        description: 'Ini adalah laporan test untuk menguji sistem notifikasi.',
        locationAddress: 'Jl. Test No. 123, Bandung',
        locationLat: -6.9175,
        locationLng: 107.6191,
        regionCode: '3273',
        regionName: 'Kota Bandung',
        status: 'new',
        priority: 'medium',
        dangerLevel: 3,
        priorityScore: 50,
      },
    })
    console.log(`✓ Test report created: ${testReport.trackingCode}`)

    // Get category name
    const category = await db.category.findUnique({
      where: { id: 1 },
      select: { name: true },
    })

    // Send test notification
    console.log('\n3. Queueing notification job...')
    
    await addNotificationJob({
      type: 'report_submitted',
      recipientId: testUser.id,
      recipientType: 'citizen',
      data: {
        reportId: testReport.id,
        trackingCode: testReport.trackingCode,
        title: testReport.title,
        categoryName: category?.name || 'Jalan Rusak',
      },
    })

    console.log('✓ Notification job queued')
    console.log('\n4. Waiting for worker to process...')
    console.log('   (Check your email and WhatsApp in a few seconds)')

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 10000))

    // Check notification logs
    console.log('\n5. Checking notification logs...')
    const notifications = await db.notification.findMany({
      where: {
        userId: testUser.id,
        reportId: testReport.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`\n📊 Notification Results:`)
    console.log(`   Total attempts: ${notifications.length}`)
    
    for (const notif of notifications) {
      const icon = notif.status === 'sent' ? '✅' : '❌'
      console.log(`   ${icon} ${notif.channel}: ${notif.status}`)
      if (notif.status === 'failed') {
        console.log(`      (Check worker logs for error details)`)
      }
    }

    console.log('\n✅ Test completed!')
    console.log('\nCheck:')
    console.log(`   📧 Email: elsherlus@gmail.com`)
    console.log(`   📱 WhatsApp: 082144562841`)
    console.log(`   🔗 Report: ${testReport.trackingCode}`)

    // Cleanup
    console.log('\n6. Cleaning up...')
    await worker.close()
    await db.$disconnect()
    
    console.log('✓ Cleanup complete')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    await db.$disconnect()
    process.exit(1)
  }
}

// Run test
testNotification()
