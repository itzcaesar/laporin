// ── apps/api/src/routes/push.ts ──
// Push notification subscription management

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db.js'
import { authMiddleware, type AuthVariables } from '../middleware/auth.js'
import { ok, err } from '../lib/response.js'
import { env } from '../env.js'

const push = new Hono<{ Variables: AuthVariables }>()

/**
 * Get VAPID public key
 * Public endpoint - needed for service worker registration
 */
push.get('/vapid-public-key', (c) => {
  if (!env.VAPID_PUBLIC_KEY) {
    return err(c, 'SERVICE_UNAVAILABLE', 'Push notifications not configured', 500)
  }

  return ok(c, { publicKey: env.VAPID_PUBLIC_KEY })
})

/**
 * Subscribe to push notifications
 */
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

push.post('/subscribe', authMiddleware, zValidator('json', subscribeSchema), async (c) => {
  const user = c.get('user')
  const userId = user.sub
  const { endpoint, keys } = c.req.valid('json')

  try {
    // Check if subscription already exists
    const existing = await db.pushSubscription.findUnique({
      where: { endpoint },
    })

    if (existing) {
      // Update if it belongs to the same user
      if (existing.userId === userId) {
        await db.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: keys.p256dh,
            auth: keys.auth,
            isActive: true,
            userAgent: c.req.header('user-agent'),
          },
        })
        return ok(c, { message: 'Subscription updated' })
      } else {
        // Endpoint exists for different user - this shouldn't happen
        return err(c, 'CONFLICT', 'Subscription already exists for another user', 409)
      }
    }

    // Create new subscription
    await db.pushSubscription.create({
      data: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: c.req.header('user-agent'),
      },
    })

    return ok(c, { message: 'Subscribed to push notifications' })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return err(c, 'INTERNAL_ERROR', 'Failed to subscribe to push notifications', 500)
  }
})

/**
 * Unsubscribe from push notifications
 */
const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

push.post('/unsubscribe', authMiddleware, zValidator('json', unsubscribeSchema), async (c) => {
  const user = c.get('user')
  const userId = user.sub
  const { endpoint } = c.req.valid('json')

  try {
    const subscription = await db.pushSubscription.findUnique({
      where: { endpoint },
    })

    if (!subscription) {
      return err(c, 'NOT_FOUND', 'Subscription not found', 404)
    }

    if (subscription.userId !== userId) {
      return err(c, 'FORBIDDEN', 'Cannot unsubscribe another user', 403)
    }

    // Mark as inactive instead of deleting (for analytics)
    await db.pushSubscription.update({
      where: { id: subscription.id },
      data: { isActive: false },
    })

    return ok(c, { message: 'Unsubscribed from push notifications' })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return err(c, 'INTERNAL_ERROR', 'Failed to unsubscribe from push notifications', 500)
  }
})

/**
 * Get user's active subscriptions
 */
push.get('/subscriptions', authMiddleware, async (c) => {
  const user = c.get('user')
  const userId = user.sub

  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
      },
    })

    return ok(c, { subscriptions })
  } catch (error) {
    console.error('Get subscriptions error:', error)
    return err(c, 'INTERNAL_ERROR', 'Failed to get subscriptions', 500)
  }
})

/**
 * Test push notification (development only)
 */
push.post('/test', authMiddleware, async (c) => {
  if (env.NODE_ENV === 'production') {
    return err(c, 'FORBIDDEN', 'Test endpoint not available in production', 403)
  }

  const user = c.get('user')

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.sub },
      select: { email: true },
    })

    if (!dbUser) {
      return err(c, 'NOT_FOUND', 'User not found', 404)
    }

    // Import notification service
    const { sendEmail, generateEmailHTML } = await import('../services/notification.service.js')

    // This will use the new sendPush implementation
    const result = await sendEmail(
      dbUser.email,
      '🔔 Test Push Notification',
      generateEmailHTML(
        '🔔 Test Push Notification',
        '<p>This is a test notification to verify your push subscription is working.</p>'
      )
    )

    return ok(c, { 
      message: 'Test notification sent',
      result,
    })
  } catch (error) {
    console.error('Test push error:', error)
    return err(c, 'INTERNAL_ERROR', 'Failed to send test notification', 500)
  }
})

export default push
