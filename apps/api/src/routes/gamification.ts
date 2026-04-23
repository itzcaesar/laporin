// ── apps/api/src/routes/gamification.ts ──
// Gamification endpoints (levels, badges, leaderboard)

import { Hono } from 'hono'
import { db } from '../db.js'
import { authMiddleware, type AuthVariables } from '../middleware/auth.js'
import { ok, paginated, err } from '../lib/response.js'
import { getSkip, buildMeta } from '../lib/pagination.js'

const gamification = new Hono<{ Variables: AuthVariables }>()

// All routes require authentication
gamification.use('*', authMiddleware)

// Level thresholds
const LEVELS = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, maxPoints: 99 },
  { id: 'silver', name: 'Silver', minPoints: 100, maxPoints: 499 },
  { id: 'gold', name: 'Gold', minPoints: 500, maxPoints: 1499 },
  { id: 'platinum', name: 'Platinum', minPoints: 1500, maxPoints: 999999 },
]

function calculateLevel(points: number): string {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i].id
    }
  }
  return 'bronze'
}

/**
 * GET /gamification/me
 * Get current user's gamification stats
 */
gamification.get('/me', async (c) => {
  const currentUser = c.get('user')

  try {
    // Get or create gamification record
    let userGamification = await db.userGamification.findUnique({
      where: { userId: currentUser.sub },
      include: {
        badges: {
          include: {
            badge: true,
          },
        },
      },
    })

    if (!userGamification) {
      // Create gamification record for new user
      userGamification = await db.userGamification.create({
        data: {
          userId: currentUser.sub,
        },
        include: {
          badges: {
            include: {
              badge: true,
            },
          },
        },
      })
    }

    // Get user stats
    const [totalReports, verifiedReports, completedReports, totalUpvotes, totalComments] =
      await Promise.all([
        db.report.count({ where: { reporterId: currentUser.sub } }),
        db.report.count({
          where: {
            reporterId: currentUser.sub,
            status: { in: ['verified', 'in_progress', 'completed', 'verified_complete'] },
          },
        }),
        db.report.count({
          where: {
            reporterId: currentUser.sub,
            status: { in: ['completed', 'verified_complete'] },
          },
        }),
        db.vote.count({ where: { userId: currentUser.sub } }),
        db.comment.count({ where: { authorId: currentUser.sub } }),
      ])

    // Calculate current level
    const currentLevel = calculateLevel(userGamification.totalPoints)
    const levelInfo = LEVELS.find((l) => l.id === currentLevel)!
    const nextLevel = LEVELS.find((l) => l.minPoints > userGamification.totalPoints)

    return ok(c, {
      totalPoints: userGamification.totalPoints,
      currentLevel: currentLevel,
      levelInfo: {
        name: levelInfo.name,
        minPoints: levelInfo.minPoints,
        maxPoints: levelInfo.maxPoints,
      },
      nextLevel: nextLevel
        ? {
            name: nextLevel.name,
            minPoints: nextLevel.minPoints,
            pointsNeeded: nextLevel.minPoints - userGamification.totalPoints,
          }
        : null,
      currentStreak: userGamification.currentStreak,
      longestStreak: userGamification.longestStreak,
      impactScore: userGamification.impactScore,
      stats: {
        totalReports,
        verifiedReports,
        completedReports,
        totalUpvotes,
        totalComments,
      },
      badges: userGamification.badges.map((ub) => ({
        id: ub.badge.id,
        code: ub.badge.code,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        color: ub.badge.color,
        target: ub.badge.target,
        progress: ub.progress,
        unlocked: !!ub.unlockedAt,
        unlockedAt: ub.unlockedAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    console.error('Get gamification error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat data gamifikasi', 500)
  }
})

/**
 * GET /gamification/badges
 * Get all available badges
 */
gamification.get('/badges', async (c) => {
  const currentUser = c.get('user')

  try {
    const badges = await db.badge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    })

    // Get user's badge progress
    const userBadges = await db.userBadge.findMany({
      where: { userId: currentUser.sub },
    })

    const userBadgeMap = new Map(userBadges.map((ub) => [ub.badgeId, ub]))

    const data = badges.map((badge) => {
      const userBadge = userBadgeMap.get(badge.id)
      return {
        id: badge.id,
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        color: badge.color,
        target: badge.target,
        progress: userBadge?.progress ?? 0,
        unlocked: !!userBadge?.unlockedAt,
        unlockedAt: userBadge?.unlockedAt?.toISOString() ?? null,
      }
    })

    return ok(c, data)
  } catch (error) {
    console.error('Get badges error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat badge', 500)
  }
})

/**
 * GET /gamification/leaderboard
 * Get leaderboard (top users by points)
 */
gamification.get('/leaderboard', async (c) => {
  const currentUser = c.get('user')
  const query = c.req.query()
  const page = parseInt(query.page || '1', 10)
  const limit = parseInt(query.limit || '20', 10)
  const skip = getSkip({ page, limit })

  try {
    const [leaderboard, total] = await Promise.all([
      db.userGamification.findMany({
        skip,
        take: limit,
        orderBy: { totalPoints: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  reports: true,
                },
              },
            },
          },
        },
      }),
      db.userGamification.count(),
    ])

    // Get current user's rank
    const currentUserGamification = await db.userGamification.findUnique({
      where: { userId: currentUser.sub },
      select: { totalPoints: true },
    })
    
    const currentUserRank = currentUserGamification
      ? await db.userGamification.count({
          where: {
            totalPoints: {
              gt: currentUserGamification.totalPoints,
            },
          },
        })
      : total

    const data = leaderboard.map((entry, index) => ({
      rank: skip + index + 1,
      userId: entry.user.id,
      name: entry.user.name || 'Anonim',
      level: calculateLevel(entry.totalPoints),
      points: entry.totalPoints,
      reports: entry.user._count.reports,
      isCurrentUser: entry.user.id === currentUser.sub,
    }))

    return ok(c, {
      data,
      meta: buildMeta(total, { page, limit }),
      currentUserRank: currentUserRank + 1,
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat leaderboard', 500)
  }
})

/**
 * GET /gamification/points/history
 * Get user's point history
 */
gamification.get('/points/history', async (c) => {
  const currentUser = c.get('user')
  const query = c.req.query()
  const page = parseInt(query.page || '1', 10)
  const limit = parseInt(query.limit || '20', 10)
  const skip = getSkip({ page, limit })

  try {
    const [history, total] = await Promise.all([
      db.pointHistory.findMany({
        where: { userId: currentUser.sub },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.pointHistory.count({ where: { userId: currentUser.sub } }),
    ])

    const data = history.map((entry) => ({
      id: entry.id,
      points: entry.points,
      action: entry.action,
      description: entry.description,
      metadata: entry.metadata,
      createdAt: entry.createdAt.toISOString(),
    }))

    return paginated(c, data, buildMeta(total, { page, limit }))
  } catch (error) {
    console.error('Get point history error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat riwayat poin', 500)
  }
})

/**
 * Helper function to award points (called internally by other routes)
 */
export async function awardPoints(
  userId: string,
  points: number,
  action: string,
  description: string,
  metadata?: any
): Promise<void> {
  try {
    // Get or create gamification record
    let userGamification = await db.userGamification.findUnique({
      where: { userId },
    })

    if (!userGamification) {
      userGamification = await db.userGamification.create({
        data: { userId },
      })
    }

    // Update points and level
    const newTotalPoints = userGamification.totalPoints + points
    const newLevel = calculateLevel(newTotalPoints)

    await db.userGamification.update({
      where: { userId },
      data: {
        totalPoints: newTotalPoints,
        currentLevel: newLevel,
        lastActivityAt: new Date(),
      },
    })

    // Record point history
    await db.pointHistory.create({
      data: {
        userId,
        points,
        action,
        description,
        metadata,
      },
    })
  } catch (error) {
    console.error('Award points error:', error)
    // Don't throw - gamification should not break main functionality
  }
}

/**
 * Helper function to update badge progress
 */
export async function updateBadgeProgress(
  userId: string,
  badgeCode: string,
  progress: number
): Promise<void> {
  try {
    const badge = await db.badge.findUnique({
      where: { code: badgeCode },
    })

    if (!badge) return

    // Get or create user badge
    let userBadge = await db.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
    })

    if (!userBadge) {
      userBadge = await db.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          progress,
        },
      })
    } else {
      await db.userBadge.update({
        where: { id: userBadge.id },
        data: { progress },
      })
    }

    // Check if badge should be unlocked
    if (badge.target && progress >= badge.target && !userBadge.unlockedAt) {
      await db.userBadge.update({
        where: { id: userBadge.id },
        data: { unlockedAt: new Date() },
      })

      // Award bonus points for unlocking badge
      await awardPoints(
        userId,
        50,
        'badge_unlocked',
        `Badge "${badge.name}" dibuka`,
        { badgeCode }
      )
    }
  } catch (error) {
    console.error('Update badge progress error:', error)
    // Don't throw - gamification should not break main functionality
  }
}

export default gamification
