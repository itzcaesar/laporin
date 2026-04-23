// ── apps/api/src/routes/survey.ts ──
// Survey/satisfaction endpoints

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db.js'
import { authMiddleware, type AuthVariables } from '../middleware/auth.js'
import { ok, err } from '../lib/response.js'

const survey = new Hono<{ Variables: AuthVariables }>()

// All routes require authentication
survey.use('*', authMiddleware)

// Validation schemas
const createSurveySchema = z.object({
  reportId: z.string().uuid(),
  speedRating: z.number().int().min(1).max(5),
  qualityRating: z.number().int().min(1).max(5),
  communicationRating: z.number().int().min(1).max(5),
  overallRating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
  wouldRecommend: z.boolean(),
})

const reportIdSchema = z.object({
  reportId: z.string().uuid(),
})

/**
 * GET /survey/:reportId
 * Get survey for a specific report (if exists)
 */
survey.get('/:reportId', zValidator('param', reportIdSchema), async (c) => {
  const currentUser = c.get('user')
  const { reportId } = c.req.valid('param')

  try {
    const surveyData = await db.survey.findUnique({
      where: {
        reportId,
      },
    })

    if (!surveyData) {
      return err(c, 'SURVEY_NOT_FOUND', 'Survey belum diisi', 404)
    }

    // Check if current user is the survey owner
    if (surveyData.userId !== currentUser.sub) {
      return err(c, 'ACCESS_DENIED', 'Akses ditolak', 403)
    }

    return ok(c, {
      id: surveyData.id,
      reportId: surveyData.reportId,
      speedRating: surveyData.speedRating,
      qualityRating: surveyData.qualityRating,
      communicationRating: surveyData.communicationRating,
      overallRating: surveyData.overallRating,
      feedback: surveyData.feedback,
      wouldRecommend: surveyData.wouldRecommend,
      createdAt: surveyData.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Get survey error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat survey', 500)
  }
})

/**
 * POST /survey
 * Submit satisfaction survey for a completed report
 */
survey.post('/', zValidator('json', createSurveySchema), async (c) => {
  const currentUser = c.get('user')
  const data = c.req.valid('json')

  try {
    // Check if report exists and is completed
    const report = await db.report.findUnique({
      where: { id: data.reportId },
      select: {
        id: true,
        status: true,
        reporterId: true,
      },
    })

    if (!report) {
      return err(c, 'REPORT_NOT_FOUND', 'Laporan tidak ditemukan', 404)
    }

    // Only reporter can submit survey
    if (report.reporterId !== currentUser.sub) {
      return err(c, 'ACCESS_DENIED', 'Hanya pelapor yang dapat mengisi survey', 403)
    }

    // Report must be completed or verified_complete
    if (report.status !== 'completed' && report.status !== 'verified_complete') {
      return err(
        c,
        'REPORT_NOT_COMPLETED',
        'Survey hanya dapat diisi untuk laporan yang sudah selesai',
        400
      )
    }

    // Check if survey already exists
    const existingSurvey = await db.survey.findUnique({
      where: { reportId: data.reportId },
    })

    if (existingSurvey) {
      return err(c, 'SURVEY_EXISTS', 'Survey sudah pernah diisi', 400)
    }

    // Create survey
    const surveyData = await db.survey.create({
      data: {
        reportId: data.reportId,
        userId: currentUser.sub,
        speedRating: data.speedRating,
        qualityRating: data.qualityRating,
        communicationRating: data.communicationRating,
        overallRating: data.overallRating,
        feedback: data.feedback,
        wouldRecommend: data.wouldRecommend,
      },
    })

    // Also create satisfaction rating (for backward compatibility)
    await db.satisfactionRating.create({
      data: {
        reportId: data.reportId,
        userId: currentUser.sub,
        rating: data.overallRating,
        review: data.feedback,
      },
    })

    return ok(c, {
      id: surveyData.id,
      reportId: surveyData.reportId,
      message: 'Terima kasih atas feedback Anda!',
      createdAt: surveyData.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Create survey error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal menyimpan survey', 500)
  }
})

/**
 * GET /survey/report/:reportId/eligibility
 * Check if user is eligible to submit survey for a report
 */
survey.get('/report/:reportId/eligibility', zValidator('param', reportIdSchema), async (c) => {
  const currentUser = c.get('user')
  const { reportId } = c.req.valid('param')

  try {
    const report = await db.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        status: true,
        reporterId: true,
        completedAt: true,
      },
    })

    if (!report) {
      return err(c, 'REPORT_NOT_FOUND', 'Laporan tidak ditemukan', 404)
    }

    const isReporter = report.reporterId === currentUser.sub
    const isCompleted = report.status === 'completed' || report.status === 'verified_complete'

    // Check if survey already submitted
    const existingSurvey = await db.survey.findUnique({
      where: { reportId },
    })

    const eligible = isReporter && isCompleted && !existingSurvey

    return ok(c, {
      eligible,
      reason: !isReporter
        ? 'Hanya pelapor yang dapat mengisi survey'
        : !isCompleted
        ? 'Laporan belum selesai'
        : existingSurvey
        ? 'Survey sudah pernah diisi'
        : 'Eligible',
      report: {
        id: report.id,
        status: report.status,
        completedAt: report.completedAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error('Check survey eligibility error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memeriksa eligibilitas', 500)
  }
})

export default survey
