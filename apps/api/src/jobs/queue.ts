// ── apps/api/src/jobs/queue.ts ──
// BullMQ queue setup for background jobs

import { Queue, QueueOptions } from 'bullmq'
import { redis } from '../lib/redis.js'
import { env } from '../env.js'

/**
 * Queue configuration
 */
const queueConfig: QueueOptions = {
  connection: {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
}

/**
 * AI Analysis Queue
 * Processes AI analysis for new reports
 */
export const aiQueue = new Queue('ai-analysis', queueConfig)

/**
 * Notification Queue
 * Sends notifications via email, WhatsApp, and push
 */
export const notificationQueue = new Queue('notifications', queueConfig)

/**
 * Job types for AI queue
 */
export interface AIAnalysisJob {
  reportId: string
  hasPhoto: boolean
  photoUrl?: string
}

/**
 * Job types for notification queue
 */
export interface NotificationJob {
  type:
    | 'report_submitted'
    | 'report_verified'
    | 'report_in_progress'
    | 'report_completed'
    | 'report_disputed'
    | 'sla_breached'
    | 'new_report_in_jurisdiction'
  recipientId: string
  recipientType: 'citizen' | 'officer'
  data: Record<string, any>
}

/**
 * Add AI analysis job
 */
export async function addAIAnalysisJob(data: AIAnalysisJob) {
  try {
    const job = await aiQueue.add('analyze-report', data, {
      priority: 1, // High priority
    })
    console.log(`✓ AI analysis job added: ${job.id}`)
    return job
  } catch (error) {
    console.error('Failed to add AI analysis job:', error)
    throw error
  }
}

/**
 * Add notification job
 */
export async function addNotificationJob(data: NotificationJob) {
  try {
    const job = await notificationQueue.add('send-notification', data, {
      priority: data.type === 'sla_breached' ? 1 : 5, // SLA breach is high priority
    })
    console.log(`✓ Notification job added: ${job.id}`)
    return job
  } catch (error) {
    console.error('Failed to add notification job:', error)
    throw error
  }
}

/**
 * Graceful shutdown
 */
export async function closeQueues() {
  await aiQueue.close()
  await notificationQueue.close()
  console.log('✓ Queues closed')
}

// Export queues for worker access
export { queueConfig }
