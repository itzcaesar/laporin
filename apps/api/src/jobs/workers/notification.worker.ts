// ── apps/api/src/jobs/workers/notification.worker.ts ──
// Background worker for processing notification jobs

import { Worker, Job } from 'bullmq'
import { queueConfig, type NotificationJob } from '../queue.js'
import {
  notifyReportSubmitted,
  notifyReportVerified,
  notifyReportInProgress,
  notifyReportCompleted,
  notifyReportDisputed,
  notifySLABreached,
  notifyNewReportInJurisdiction,
} from '../../services/notification.service.js'

/**
 * Process notification job
 */
async function processNotificationJob(job: Job<NotificationJob>): Promise<void> {
  const { type, recipientId, data } = job.data

  console.log(`[Notification Worker] Processing ${type} for user ${recipientId}`)

  try {
    // Extract reportId from data if available
    const reportId = (data as any).reportId || null

    switch (type) {
      case 'report_submitted':
        await notifyReportSubmitted(recipientId, reportId, {
          trackingCode: data.trackingCode,
          title: data.title,
          categoryName: data.categoryName,
        })
        break

      case 'report_verified':
        await notifyReportVerified(recipientId, reportId, {
          trackingCode: data.trackingCode,
          title: data.title,
          picName: data.picName,
          estimatedEnd: data.estimatedEnd,
        })
        break

      case 'report_in_progress':
        await notifyReportInProgress(recipientId, reportId, {
          trackingCode: data.trackingCode,
          title: data.title,
          estimatedEnd: data.estimatedEnd,
        })
        break

      case 'report_completed':
        await notifyReportCompleted(recipientId, reportId, {
          trackingCode: data.trackingCode,
          title: data.title,
          completedAt: data.completedAt,
        })
        break

      case 'report_disputed':
        await notifyReportDisputed(recipientId, reportId, {
          trackingCode: data.trackingCode,
          title: data.title,
          disputeNote: data.disputeNote,
        })
        break

      case 'sla_breached':
        await notifySLABreached(recipientId, reportId, {
          trackingCode: data.trackingCode,
          title: data.title,
          daysOverdue: data.daysOverdue,
          priority: data.priority,
        })
        break

      case 'new_report_in_jurisdiction':
        await notifyNewReportInJurisdiction(recipientId, reportId, {
          trackingCode: data.trackingCode,
          title: data.title,
          categoryName: data.categoryName,
          dangerLevel: data.dangerLevel,
          regionName: data.regionName,
        })
        break

      default:
        console.warn(`[Notification Worker] Unknown notification type: ${type}`)
    }

    console.log(`[Notification Worker] ✓ Completed ${type} for user ${recipientId}`)
  } catch (error) {
    console.error(`[Notification Worker] ✗ Failed ${type}:`, error)
    throw error // Will trigger retry
  }
}

/**
 * Create and start notification worker
 */
export function startNotificationWorker(): Worker<NotificationJob> {
  const worker = new Worker<NotificationJob>(
    'notifications',
    processNotificationJob,
    {
      ...queueConfig,
      concurrency: 5, // Process up to 5 notifications concurrently
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Notification Worker] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Notification Worker] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[Notification Worker] Worker error:', err)
  })

  console.log('✓ Notification worker started')

  return worker
}

/**
 * Graceful shutdown
 */
export async function stopNotificationWorker(worker: Worker): Promise<void> {
  await worker.close()
  console.log('✓ Notification worker stopped')
}
