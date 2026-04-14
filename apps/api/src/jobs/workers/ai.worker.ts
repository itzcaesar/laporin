// ── apps/api/src/jobs/workers/ai.worker.ts ──
// Background worker for AI analysis jobs

import { Worker, Job } from 'bullmq'
import { db } from '../../db.js'
import { queueConfig, type AIAnalysisJob } from '../queue.js'
import {
  classifyReportPhoto,
  predictDangerLevel,
  summarizeReport,
  detectHoax,
  generateEmbedding,
  detectDuplicate,
} from '../../services/ai.service.js'
import { calculatePriorityScore } from '../../lib/priorityScore.js'

/**
 * Process AI analysis for a report
 */
async function processAIAnalysis(job: Job<AIAnalysisJob>) {
  const { reportId, hasPhoto, photoUrl } = job.data

  console.log(`Processing AI analysis for report: ${reportId}`)

  try {
    // Get report details
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        category: true,
        media: {
          where: { mediaType: 'photo' },
          take: 1,
        },
      },
    })

    if (!report) {
      throw new Error(`Report not found: ${reportId}`)
    }

    // Initialize results
    let categoryId = report.categoryId
    let classificationReasoning = ''
    let dangerLevel = report.dangerLevel || 'medium'
    let dangerReasoning = ''
    let summary = ''
    let isHoax = false
    let hoaxConfidence = 0
    let hoaxReason = ''
    let isDuplicate = false
    let similarReportId: string | undefined
    let embedding: number[] = []

    // Step 1: Classify photo if available
    if (hasPhoto && photoUrl) {
      try {
        // For now, skip actual photo classification as it requires base64 conversion
        // In production, fetch the image and convert to base64
        console.log('Photo classification skipped (requires base64 conversion)')
      } catch (error) {
        console.error('Photo classification error:', error)
      }
    }

    // Step 2: Summarize report
    try {
      summary = await summarizeReport(report.description)
      console.log(`✓ Summary generated: ${summary.substring(0, 50)}...`)
    } catch (error) {
      console.error('Summarize error:', error)
      summary = report.description.substring(0, 150)
    }

    // Step 3: Predict danger level
    try {
      const dangerResult = await predictDangerLevel(
        report.title,
        report.description,
        categoryId
      )
      dangerLevel = dangerResult.dangerLevel
      dangerReasoning = dangerResult.reasoning
      console.log(`✓ Danger level: ${dangerLevel}`)
    } catch (error) {
      console.error('Danger prediction error:', error)
    }

    // Step 4: Detect hoax
    try {
      const hoaxResult = await detectHoax(
        report.title,
        report.description,
        report.address
      )
      isHoax = hoaxResult.isHoax
      hoaxConfidence = hoaxResult.confidence
      hoaxReason = hoaxResult.reason
      console.log(`✓ Hoax detection: ${isHoax ? 'HOAX' : 'VALID'} (${hoaxConfidence}%)`)
    } catch (error) {
      console.error('Hoax detection error:', error)
    }

    // Step 5: Generate embedding for duplicate detection
    try {
      const embeddingText = `${report.title} ${report.description} ${report.address}`
      embedding = await generateEmbedding(embeddingText)
      console.log(`✓ Embedding generated (${embedding.length} dimensions)`)
    } catch (error) {
      console.error('Embedding generation error:', error)
    }

    // Step 6: Detect duplicates
    if (embedding.length > 0) {
      try {
        const duplicateResult = await detectDuplicate(reportId, embedding)
        isDuplicate = duplicateResult.isDuplicate
        similarReportId = duplicateResult.similarReportId
        console.log(`✓ Duplicate detection: ${isDuplicate ? 'DUPLICATE' : 'UNIQUE'}`)
      } catch (error) {
        console.error('Duplicate detection error:', error)
      }
    }

    // Step 7: Calculate priority score
    let priorityScore = 50
    try {
      priorityScore = calculatePriorityScore({
        dangerLevel,
        upvoteCount: report.upvoteCount,
        categoryWeight: report.category.weight,
        createdAt: report.createdAt,
      })
      console.log(`✓ Priority score: ${priorityScore}`)
    } catch (error) {
      console.error('Priority score calculation error:', error)
    }

    // Step 8: Save AI analysis to cache
    await db.aiAnalysisCache.create({
      data: {
        reportId,
        summary,
        dangerLevel,
        dangerReasoning,
        isHoax,
        hoaxConfidence,
        hoaxReason,
        isDuplicate,
        similarReportId,
        embedding: embedding.length > 0 ? JSON.stringify(embedding) : null,
        classificationResult: classificationReasoning
          ? JSON.stringify({ categoryId, reasoning: classificationReasoning })
          : null,
        processedAt: new Date(),
      },
    })

    // Step 9: Update report with AI results
    await db.report.update({
      where: { id: reportId },
      data: {
        dangerLevel,
        priorityScore,
        ...(isDuplicate && similarReportId && { isDuplicateOf: similarReportId }),
      },
    })

    console.log(`✓ AI analysis completed for report: ${reportId}`)

    return {
      success: true,
      reportId,
      results: {
        summary,
        dangerLevel,
        isHoax,
        isDuplicate,
        priorityScore,
      },
    }
  } catch (error) {
    console.error(`AI analysis failed for report ${reportId}:`, error)
    throw error
  }
}

/**
 * Create and start AI worker
 */
export function createAIWorker() {
  const worker = new Worker('ai-analysis', processAIAnalysis, {
    connection: queueConfig.connection,
    concurrency: 2, // Process 2 jobs concurrently
  })

  worker.on('completed', (job) => {
    console.log(`✓ AI job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`✗ AI job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('AI worker error:', err)
  })

  console.log('✓ AI worker started')

  return worker
}

// Auto-start worker if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAIWorker()
}
