import { PrismaClient } from '@prisma/client'
import { generateDailyInsight } from './src/services/ai.service.js'
import { redis } from './src/lib/redis.js'
import { addAIAnalysisJob } from './src/jobs/queue.js'

const db = new PrismaClient()

async function main() {
  console.log('Generating insight for ALL agencies (super admin dashboard)...')
  try {
    const totalOpen = await db.report.count({
      where: { status: { in: ['new', 'verified', 'in_progress'] } }
    })
    
    const now = new Date()
    const slaBreached = await db.report.count({
      where: {
        status: { in: ['new', 'verified', 'in_progress'] },
        estimatedEnd: { lt: now },
      }
    })

    const insight = await generateDailyInsight({
      agencyName: 'Seluruh Indonesia',
      topRisingCategory: 'Jalan Rusak',
      risePercent: 15,
      totalOpen,
      slaBreached,
      seasonContext: 'musim hujan',
    })

    const cacheKey = `laporin:insights:gov:all`
    await redis.setex(cacheKey, 25 * 60 * 60, insight)
    console.log('Successfully generated insight for ALL agencies!')
  } catch (err) {
    console.error('Error generating insight for all:', err)
  }

  console.log('Queueing AI Analysis jobs for 5 recent reports...')
  const reports = await db.report.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      media: {
        where: { mediaType: 'photo' },
        take: 1,
      }
    }
  })

  for (const report of reports) {
    // Check if it already has AI Analysis Cache
    const existing = await db.aiAnalysisCache.findUnique({
      where: { reportId: report.id }
    })
    
    if (!existing) {
      console.log(`Adding AI Analysis job for report: ${report.id} (${report.title})`)
      await addAIAnalysisJob({
        reportId: report.id,
        hasPhoto: report.media.length > 0,
        photoUrl: report.media.length > 0 ? report.media[0].fileUrl : undefined
      })
    } else {
      console.log(`Report ${report.id} already has AI Analysis Cache. Skipping.`)
    }
  }

  console.log('Done queuing jobs! Wait a few seconds for the background worker to process them.')
  process.exit(0)
}

main().catch(console.error)
