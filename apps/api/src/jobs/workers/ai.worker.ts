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
  estimateBudget,
  generateImpactSummary,
  verifyBeforeAfterPhoto,
} from '../../services/ai.service.js'
import { calculatePriorityScore } from '../../lib/priorityScore.js'

/**
 * Safe AI call wrapper for graceful degradation
 */
async function safeAiCall<T>(
  fn: () => Promise<T>,
  fallback: T,
  label: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(`[AI:${label}] Failed:`, error)
    return fallback
  }
}

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
    let dangerLevel = report.dangerLevel || 3 // Default to medium (3)
    let dangerReasoning = ''
    let summary = ''
    let isHoax = false
    let hoaxConfidence = 0
    let hoaxReason = ''
    let isDuplicate = false
    let similarReportId: string | undefined
    let embedding: number[] = []
    let budgetEstimate: { minIdr: number; maxIdr: number; basis: string } | null = null
    let impactSummary: string | null = null

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
    summary = await safeAiCall(
      () => summarizeReport(report.description),
      report.description.substring(0, 150),
      'summarize'
    )
    console.log(`✓ Summary generated: ${summary.substring(0, 50)}...`)

    // Step 3: Predict danger level
    const dangerResult = await safeAiCall(
      () => predictDangerLevel(report.title, report.description, categoryId),
      { dangerLevel: 'medium', reasoning: 'Analisis tidak tersedia' },
      'predictDanger'
    )
    // Map string danger level to number (1-5)
    const dangerLevelMap: Record<string, number> = {
      low: 2,
      medium: 3,
      high: 4,
      critical: 5,
    }
    dangerLevel = dangerLevelMap[dangerResult.dangerLevel] || 3
    dangerReasoning = dangerResult.reasoning
    console.log(`✓ Danger level: ${dangerLevel}`)

    // Step 4: Detect hoax
    const hoaxResult = await safeAiCall(
      () => detectHoax(report.title, report.description, report.locationAddress),
      { isHoax: false, confidence: 0, reason: 'Analisis tidak tersedia' },
      'detectHoax'
    )
    isHoax = hoaxResult.isHoax
    hoaxConfidence = hoaxResult.confidence
    hoaxReason = hoaxResult.reason
    console.log(`✓ Hoax detection: ${isHoax ? 'HOAX' : 'VALID'} (${hoaxConfidence}%)`)

    // Step 5: Generate embedding for duplicate detection
    try {
      const embeddingText = `${report.title} ${report.description} ${report.locationAddress}`
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

    // Step 7: Estimate budget
    budgetEstimate = await safeAiCall(
      () =>
        estimateBudget({
          categoryId,
          description: report.description,
          locationAddress: report.locationAddress,
          dangerLevel: dangerResult.dangerLevel,
        }),
      null,
      'estimateBudget'
    )
    if (budgetEstimate) {
      console.log(
        `✓ Budget estimate: Rp ${budgetEstimate.minIdr} - Rp ${budgetEstimate.maxIdr}`
      )
    }

    // Step 8: Generate impact summary
    impactSummary = await safeAiCall(
      () =>
        generateImpactSummary({
          title: report.title,
          description: report.description,
          upvoteCount: report.upvoteCount,
          categoryName: report.category.name,
        }),
      null,
      'generateImpact'
    )
    if (impactSummary) {
      console.log(`✓ Impact summary: ${impactSummary.substring(0, 50)}...`)
    }

    // Step 9: Calculate priority score
    let priorityScore = 50
    try {
      const ageHours = (Date.now() - report.createdAt.getTime()) / (1000 * 60 * 60)
      const slaBreached = report.estimatedEnd ? report.estimatedEnd < new Date() : false

      priorityScore = calculatePriorityScore({
        dangerLevel,
        upvoteCount: report.upvoteCount,
        categoryId: report.categoryId,
        ageHours,
        slaBreached,
      })
      console.log(`✓ Priority score: ${priorityScore}`)
    } catch (error) {
      console.error('Priority score calculation error:', error)
    }

    // Step 10: Save AI analysis to cache
    await db.aiAnalysisCache.create({
      data: {
        reportId,
        dangerLevel,
        isHoax,
        hoaxConfidence,
        isDuplicate,
        duplicateOfId: similarReportId,
        budgetEstimate: budgetEstimate ? budgetEstimate.minIdr : null,
        impactSummary,
        priorityScore,
      },
    })

    // Step 11: Update report with AI results
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
        budgetEstimate,
        impactSummary,
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
