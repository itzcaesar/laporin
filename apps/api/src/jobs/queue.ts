// ── apps/api/src/jobs/queue.ts ──
// BullMQ queue setup for background jobs

import { Queue, QueueOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { env } from '../env.js'

/**
 * BullMQ requires maxRetriesPerRequest: null — cannot share the ioredis cache client
 */
export function createBullMQConnection() {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
}

/**
 * Queue configuration — built lazily so no Redis connection is opened at
 * module-load time (prevents startup crash when Redis is temporarily unavailable).
 */
function getQueueConfig(): QueueOptions {
  return {
    connection: createBullMQConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 24 * 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600,
      },
    },
  }
}

/**
 * Lazy queue singletons — created on first use so a Redis failure at
 * module-load time does not crash the process before the HTTP server starts.
 */
let _aiQueue: Queue | null = null
let _notificationQueue: Queue | null = null

export function getAIQueue(): Queue {
  if (!_aiQueue) _aiQueue = new Queue('ai-analysis', getQueueConfig())
  return _aiQueue
}

export function getNotificationQueue(): Queue {
  if (!_notificationQueue) _notificationQueue = new Queue('notifications', getQueueConfig())
  return _notificationQueue
}

/** @deprecated use getAIQueue() */
export const aiQueue = { add: (...args: Parameters<Queue['add']>) => getAIQueue().add(...args), close: () => _aiQueue?.close() }
/** @deprecated use getNotificationQueue() */
export const notificationQueue = { add: (...args: Parameters<Queue['add']>) => getNotificationQueue().add(...args), close: () => _notificationQueue?.close() }

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
    const job = await getAIQueue().add('analyze-report', data, {
      priority: 1,
    })
    console.log(`✓ AI analysis job added: ${job.id}`)
    return job
  } catch (error) {
    console.error('Failed to add AI analysis job:', error)
    throw error
  }
}

export async function addNotificationJob(data: NotificationJob) {
  try {
    const job = await getNotificationQueue().add('send-notification', data, {
      priority: data.type === 'sla_breached' ? 1 : 5,
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
  await _aiQueue?.close()
  await _notificationQueue?.close()
  console.log('✓ Queues closed')
}


