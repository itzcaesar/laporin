import { Hono } from 'hono'
import { db } from '../../db.js'
import { authMiddleware, type AuthVariables } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'
import { paginated, err } from '../../lib/response.js'
import { buildMeta } from '../../lib/pagination.js'

const govSurveys = new Hono<{ Variables: AuthVariables }>()

// All routes require officer/admin role
govSurveys.use('*', authMiddleware, requireRole('officer'))

/**
 * GET /gov/surveys
 * Get paginated list of surveys
 */
govSurveys.get('/', async (c) => {
  const user = c.get('user')
  const { page = '1', limit = '20' } = c.req.query()
  
  try {
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    // Base where clause
    const where: any = {}

    // Role-based filtering via report assignment
    if (user.role === 'officer') {
      where.report = { assignedOfficerId: user.sub }
    } else if (user.role === 'admin' && user.agencyId) {
      where.report = { agencyId: user.agencyId }
    }

    const [total, items] = await Promise.all([
      db.survey.count({ where }),
      db.survey.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          report: {
            select: { trackingCode: true }
          }
        }
      })
    ])

    const data = items.map((survey) => ({
      id: survey.id,
      reportId: survey.reportId,
      reportTrackingCode: survey.report?.trackingCode,
      ratings: {
        speed: survey.speedRating,
        quality: survey.qualityRating,
        communication: survey.communicationRating,
        satisfaction: survey.overallRating,
      },
      comment: survey.feedback,
      submittedAt: survey.createdAt.toISOString()
    }))

    return paginated(c, data, buildMeta(total, { page: pageNum, limit: limitNum }))
  } catch (error) {
    console.error('List surveys error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal mengambil data survei', 500)
  }
})

export default govSurveys
