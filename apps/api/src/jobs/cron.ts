// ── apps/api/src/jobs/cron.ts ──
// Scheduled CRON jobs for AI features

import cron from 'node-cron'
import { db } from '../db.js'
import { redis } from '../lib/redis.js'
import { generateDailyInsight, predictWorkload } from '../services/ai.service.js'
import { sendEmail, generateEmailHTML } from '../services/notification.service.js'

/**
 * Daily insight generation job
 * Runs at 06:00 WIB (23:00 UTC previous day)
 */
export function scheduleDailyInsightJob() {
  // 06:00 WIB = 23:00 UTC (previous day)
  cron.schedule('0 23 * * *', async () => {
    const startTime = Date.now()
    console.log('[CRON] Starting daily insight generation...')

    try {
      // Get all active agencies
      const agencies = await db.agency.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      })

      for (const agency of agencies) {
        try {
          // Get data for insight generation
          const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          const last60Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

          // Get current period category counts
          const currentCategoryCounts = await db.report.groupBy({
            by: ['categoryId'],
            where: {
              agencyId: agency.id,
              createdAt: { gte: last30Days },
            },
            _count: true,
            orderBy: { _count: { categoryId: 'desc' } },
            take: 1,
          })

          // Get previous period category counts
          const previousCategoryCounts = await db.report.groupBy({
            by: ['categoryId'],
            where: {
              agencyId: agency.id,
              createdAt: { gte: last60Days, lt: last30Days },
            },
            _count: true,
          })

          // Calculate rise percentage
          let topRisingCategory = 'Jalan Rusak'
          let risePercent = 0

          if (currentCategoryCounts.length > 0) {
            const topCategoryId = currentCategoryCounts[0].categoryId
            const currentCount = currentCategoryCounts[0]._count
            const previousCount =
              previousCategoryCounts.find((c) => c.categoryId === topCategoryId)?._count || 0

            if (previousCount > 0) {
              risePercent = Math.round(((currentCount - previousCount) / previousCount) * 100)
            }

            const category = await db.category.findUnique({
              where: { id: topCategoryId },
              select: { name: true },
            })
            topRisingCategory = category?.name || 'Unknown'
          }

          // Get open reports and SLA breached
          const totalOpen = await db.report.count({
            where: {
              agencyId: agency.id,
              status: { in: ['new', 'verified', 'in_progress'] },
            },
          })

          const now = new Date()
          const slaBreached = await db.report.count({
            where: {
              agencyId: agency.id,
              status: { in: ['new', 'verified', 'in_progress'] },
              estimatedEnd: { lt: now },
            },
          })

          // Determine season context (simple month-based)
          const month = new Date().getMonth()
          const seasonContext =
            month >= 10 || month <= 3 ? 'musim hujan' : 'musim kemarau'

          // Generate insight
          const insight = await generateDailyInsight({
            agencyName: agency.name,
            topRisingCategory,
            risePercent,
            totalOpen,
            slaBreached,
            seasonContext,
          })

          // Cache for 25 hours
          const cacheKey = `laporin:insights:gov:${agency.id}`
          await redis.setex(cacheKey, 25 * 60 * 60, insight)

          console.log(`✓ Generated insight for ${agency.name}`)
        } catch (error) {
          console.error(`✗ Failed to generate insight for ${agency.name}:`, error)
        }
      }

      const duration = Date.now() - startTime
      console.log(`[CRON] Daily insight generation completed in ${duration}ms`)
    } catch (error) {
      console.error('[CRON] Daily insight generation failed:', error)
    }
  })

  console.log('✓ Daily insight job scheduled (06:00 WIB)')
}

/**
 * Anomaly detection job
 * Runs every 30 minutes
 */
export function scheduleAnomalyDetectionJob() {
  cron.schedule('*/30 * * * *', async () => {
    const startTime = Date.now()
    console.log('[CRON] Starting anomaly detection...')

    try {
      // Get all active agencies
      const agencies = await db.agency.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      })

      for (const agency of agencies) {
        try {
          // Detect anomalies: report volume spike in any sub-district > 2.5 standard deviations
          const anomalies = await db.$queryRaw<
            Array<{
              region_code: string
              recent_2h: bigint
              avg_per_2h: number
              spike_ratio: number
            }>
          >`
            WITH hourly_rates AS (
              SELECT
                region_code,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '2 hours') AS recent_2h,
                AVG(COUNT(*)) OVER (
                  PARTITION BY region_code
                  ORDER BY DATE_TRUNC('hour', created_at)
                  ROWS BETWEEN 720 PRECEDING AND 1 PRECEDING
                ) AS avg_per_2h
              FROM reports
              WHERE agency_id = ${agency.id}::uuid
                AND created_at > NOW() - INTERVAL '30 days'
              GROUP BY region_code, DATE_TRUNC('hour', created_at)
            )
            SELECT region_code, recent_2h, avg_per_2h,
                   (recent_2h / NULLIF(avg_per_2h, 0)) AS spike_ratio
            FROM hourly_rates
            WHERE recent_2h > (avg_per_2h * 2.5)
              AND recent_2h > 3
            ORDER BY spike_ratio DESC
            LIMIT 5
          `

          if (anomalies.length > 0) {
            // Format anomalies for caching
            const formattedAnomalies = anomalies.map((anomaly) => ({
              regionCode: anomaly.region_code,
              recent2h: Number(anomaly.recent_2h),
              avgPer2h: Math.round(anomaly.avg_per_2h * 10) / 10,
              spikeRatio: Math.round(anomaly.spike_ratio * 10) / 10,
              detectedAt: new Date().toISOString(),
            }))

            // Cache for 30 minutes
            const cacheKey = `laporin:anomalies:gov:${agency.id}`
            await redis.setex(cacheKey, 30 * 60, JSON.stringify(formattedAnomalies))

            console.log(`✓ Detected ${anomalies.length} anomalies for ${agency.name}`)

            // Send in-app notification to admin users for high-severity anomalies
            const adminUsers = await db.user.findMany({
              where: {
                agencyId: agency.id,
                role: { in: ['admin', 'super_admin'] },
                isActive: true,
              },
              select: { id: true },
            })

            for (const admin of adminUsers) {
              try {
                await db.notification.create({
                  data: {
                    userId: admin.id,
                    channel: 'push',
                    status: 'sent',
                    title: `⚠️ Lonjakan Laporan Terdeteksi`,
                    body: `Terdeteksi ${anomalies.length} wilayah dengan lonjakan laporan tidak biasa. Periksa dashboard untuk detail.`,
                    sentAt: new Date(),
                  },
                })
              } catch (notifErr) {
                console.error(`Failed to notify admin ${admin.id}:`, notifErr)
              }
            }
          } else {
            // Clear cache if no anomalies
            const cacheKey = `laporin:anomalies:gov:${agency.id}`
            await redis.del(cacheKey)
          }
        } catch (error) {
          console.error(`✗ Failed to detect anomalies for ${agency.name}:`, error)
        }
      }

      const duration = Date.now() - startTime
      console.log(`[CRON] Anomaly detection completed in ${duration}ms`)
    } catch (error) {
      console.error('[CRON] Anomaly detection failed:', error)
    }
  })

  console.log('✓ Anomaly detection job scheduled (every 30 minutes)')
}

/**
 * Workload prediction job
 * Runs daily at 23:00 WIB (16:00 UTC)
 */
export function scheduleWorkloadPredictionJob() {
  // 23:00 WIB = 16:00 UTC
  cron.schedule('0 16 * * *', async () => {
    const startTime = Date.now()
    console.log('[CRON] Starting workload prediction...')

    try {
      // Get all active agencies
      const agencies = await db.agency.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      })

      for (const agency of agencies) {
        try {
          // Predict workload for next week
          const prediction = await predictWorkload(agency.id)

          // Cache for 23 hours
          const cacheKey = `laporin:forecast:gov:${agency.id}`
          await redis.setex(cacheKey, 23 * 60 * 60, JSON.stringify(prediction))

          console.log(
            `✓ Predicted ${prediction.predictedWeeklyTotal} reports for ${agency.name}`
          )
        } catch (error) {
          console.error(`✗ Failed to predict workload for ${agency.name}:`, error)
        }
      }

      const duration = Date.now() - startTime
      console.log(`[CRON] Workload prediction completed in ${duration}ms`)
    } catch (error) {
      console.error('[CRON] Workload prediction failed:', error)
    }
  })

  console.log('✓ Workload prediction job scheduled (23:00 WIB)')
}

/**
 * Weekly report generation job
 * Runs every Monday at 07:00 WIB (00:00 UTC)
 */
export function scheduleWeeklyReportJob() {
  // Monday 07:00 WIB = Monday 00:00 UTC
  cron.schedule('0 0 * * 1', async () => {
    const startTime = Date.now()
    console.log('[CRON] Starting weekly report generation...')

    try {
      // Get all active agencies
      const agencies = await db.agency.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      })

      for (const agency of agencies) {
        try {
          // Get last 7 days data
          const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

          // Calculate avgResolutionDays from raw SQL
          const avgResult = await db.$queryRaw<Array<{ avg_days: number }>>`
            SELECT COALESCE(
              AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400),
              0
            )::float as avg_days
            FROM reports
            WHERE agency_id = ${agency.id}::uuid
              AND created_at >= ${last7Days}
              AND status IN ('completed', 'verified_complete', 'closed')
              AND completed_at IS NOT NULL
          `

          const weeklyStats = {
            totalReports: await db.report.count({
              where: {
                agencyId: agency.id,
                createdAt: { gte: last7Days },
              },
            }),
            completed: await db.report.count({
              where: {
                agencyId: agency.id,
                createdAt: { gte: last7Days },
                status: { in: ['completed', 'verified_complete', 'closed'] },
              },
            }),
            avgResolutionDays: Math.round((avgResult[0]?.avg_days || 0) * 10) / 10,
            topCategories: await db.report.groupBy({
              by: ['categoryId'],
              where: {
                agencyId: agency.id,
                createdAt: { gte: last7Days },
              },
              _count: true,
              orderBy: { _count: { categoryId: 'desc' } },
              take: 5,
            }),
          }

          // Get category names for the email
          const categoryIds = weeklyStats.topCategories.map((c) => c.categoryId)
          const categories = await db.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, emoji: true },
          })

          const topCatList = weeklyStats.topCategories
            .map((c) => {
              const cat = categories.find((cat) => cat.id === c.categoryId)
              return `${cat?.emoji || '📍'} ${cat?.name || 'Unknown'}: ${c._count} laporan`
            })
            .join('<br/>')

          // Send email to all admin users in this agency
          const adminUsers = await db.user.findMany({
            where: {
              agencyId: agency.id,
              role: { in: ['admin', 'super_admin'] },
              isActive: true,
            },
            select: { email: true, name: true },
          })

          const resolutionRate = weeklyStats.totalReports > 0
            ? Math.round((weeklyStats.completed / weeklyStats.totalReports) * 100)
            : 0

          const emailContent = `
            <p>Berikut ringkasan laporan minggu ini untuk <strong>${agency.name}</strong>:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">Total Laporan</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;text-align:right;">${weeklyStats.totalReports}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">Selesai</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;text-align:right;">${weeklyStats.completed}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">Tingkat Penyelesaian</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;text-align:right;">${resolutionRate}%</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">Rata-rata Waktu</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;text-align:right;">${weeklyStats.avgResolutionDays} hari</td></tr>
            </table>
            <p><strong>Kategori Teratas:</strong></p>
            <p>${topCatList || 'Tidak ada data'}</p>
          `

          for (const admin of adminUsers) {
            try {
              await sendEmail(
                admin.email,
                `📊 Laporan Mingguan - ${agency.name}`,
                generateEmailHTML(
                  `📊 Laporan Mingguan - ${agency.name}`,
                  emailContent,
                  'Buka Dashboard',
                  'https://laporin.site/gov'
                )
              )
            } catch (emailErr) {
              console.error(`Failed to send weekly report to ${admin.email}:`, emailErr)
            }
          }

          console.log(`✓ Generated weekly report for ${agency.name}:`, weeklyStats)
        } catch (error) {
          console.error(`✗ Failed to generate weekly report for ${agency.name}:`, error)
        }
      }

      const duration = Date.now() - startTime
      console.log(`[CRON] Weekly report generation completed in ${duration}ms`)
    } catch (error) {
      console.error('[CRON] Weekly report generation failed:', error)
    }
  })

  console.log('✓ Weekly report job scheduled (Monday 07:00 WIB)')
}

/**
 * Start all CRON jobs
 */
export function startAllCronJobs() {
  console.log('Starting all CRON jobs...')
  scheduleDailyInsightJob()
  scheduleAnomalyDetectionJob()
  scheduleWorkloadPredictionJob()
  scheduleWeeklyReportJob()
  console.log('✓ All CRON jobs started')
}
