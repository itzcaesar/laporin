// ── apps/api/src/services/notification.service.ts ──
// Notification service for email, WhatsApp, and push notifications

import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../env.js'
import { db } from '../db.js'
import type { NotificationChannel, NotificationStatus } from '@prisma/client'

/**
 * Email transporter (Resend SMTP)
 */
let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  }
  return transporter
}

/**
 * Notification data types
 */
export interface NotificationData {
  reportSubmitted: {
    trackingCode: string
    title: string
    categoryName: string
  }
  reportVerified: {
    trackingCode: string
    title: string
    picName: string
    estimatedEnd?: string
  }
  reportInProgress: {
    trackingCode: string
    title: string
    estimatedEnd?: string
  }
  reportCompleted: {
    trackingCode: string
    title: string
    completedAt: string
  }
  reportDisputed: {
    trackingCode: string
    title: string
    disputeNote: string
  }
  slaBreached: {
    trackingCode: string
    title: string
    daysOverdue: number
    priority: string
  }
  newReportInJurisdiction: {
    trackingCode: string
    title: string
    categoryName: string
    dangerLevel: number
    regionName: string
  }
}

export type NotificationType = keyof NotificationData

/**
 * Send email notification
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = getTransporter()
    await transport.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Email send failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send WhatsApp notification via Fonnte API
 */
async function sendWhatsApp(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!env.FONNTE_TOKEN) {
      console.warn('FONNTE_TOKEN not configured, skipping WhatsApp')
      return { success: false, error: 'FONNTE_TOKEN not configured' }
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: env.FONNTE_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: phone,
        message,
        countryCode: '62', // Indonesia
      }),
    })

    const result = await response.json()

    if (!response.ok || result.status === false) {
      throw new Error(result.reason || 'Fonnte API error')
    }

    return { success: true }
  } catch (error) {
    console.error('WhatsApp send failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send push notification (Web Push VAPID)
 * TODO: Implement when push subscription table is added
 */
async function sendPush(
  userId: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  // Placeholder for future implementation
  console.log(`[Push] Would send to user ${userId}: ${title}`)
  return { success: false, error: 'Push notifications not yet implemented' }
}

/**
 * Log notification to database
 */
async function logNotification(
  userId: string,
  reportId: string | null,
  channel: NotificationChannel,
  status: NotificationStatus,
  title: string,
  body: string
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId,
        reportId,
        channel,
        status,
        title,
        body,
        sentAt: status === 'sent' ? new Date() : null,
      },
    })
  } catch (error) {
    console.error('Failed to log notification:', error)
  }
}

/**
 * Generate email HTML template
 */
function generateEmailHTML(
  title: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string
): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    h1 {
      color: #1f2937;
      font-size: 20px;
      margin-bottom: 16px;
    }
    .content {
      color: #4b5563;
      margin-bottom: 24px;
    }
    .cta {
      text-align: center;
      margin: 32px 0;
    }
    .cta a {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📢 Laporin</div>
    </div>
    <h1>${title}</h1>
    <div class="content">
      ${content}
    </div>
    ${
      ctaText && ctaUrl
        ? `
    <div class="cta">
      <a href="${ctaUrl}">${ctaText}</a>
    </div>
    `
        : ''
    }
    <div class="footer">
      <p>Email ini dikirim secara otomatis oleh sistem Laporin.</p>
      <p>Jangan balas email ini. Untuk bantuan, kunjungi <a href="https://laporin.site">laporin.site</a></p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Send notification for: Report Submitted
 */
export async function notifyReportSubmitted(
  userId: string,
  reportId: string,
  data: NotificationData['reportSubmitted']
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true, name: true },
  })

  if (!user) {
    console.error(`User ${userId} not found`)
    return
  }

  const title = '✅ Laporan Berhasil Diterima'
  const emailContent = `
    <p>Halo ${user.name || 'Warga'},</p>
    <p>Terima kasih telah melaporkan masalah infrastruktur melalui Laporin.</p>
    <p><strong>Kode Pelacakan:</strong> ${data.trackingCode}</p>
    <p><strong>Judul:</strong> ${data.title}</p>
    <p><strong>Kategori:</strong> ${data.categoryName}</p>
    <p>Laporan Anda sedang dalam proses verifikasi oleh petugas kami. Anda akan menerima notifikasi lebih lanjut setelah laporan diverifikasi.</p>
  `
  const whatsappMessage = `✅ *Laporan Diterima*\n\nKode: ${data.trackingCode}\nJudul: ${data.title}\n\nLaporan Anda sedang diverifikasi. Pantau status di https://laporin.site/laporan/${data.trackingCode}`

  // Send email
  const emailResult = await sendEmail(
    user.email,
    title,
    generateEmailHTML(
      title,
      emailContent,
      'Lihat Laporan',
      `https://laporin.site/laporan/${data.trackingCode}`
    )
  )
  await logNotification(
    userId,
    reportId,
    'email',
    emailResult.success ? 'sent' : 'failed',
    title,
    emailContent
  )

  // Send WhatsApp (if phone exists)
  if (user.phone) {
    const whatsappResult = await sendWhatsApp(user.phone, whatsappMessage)
    await logNotification(
      userId,
      reportId,
      'whatsapp',
      whatsappResult.success ? 'sent' : 'failed',
      title,
      whatsappMessage
    )
  }

  // Send push
  const pushResult = await sendPush(userId, title, `Kode: ${data.trackingCode}`)
  await logNotification(
    userId,
    reportId,
    'push',
    pushResult.success ? 'sent' : 'failed',
    title,
    `Kode: ${data.trackingCode}`
  )
}

/**
 * Send notification for: Report Verified
 */
export async function notifyReportVerified(
  userId: string,
  reportId: string,
  data: NotificationData['reportVerified']
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true, name: true },
  })

  if (!user) return

  const title = '✅ Laporan Diverifikasi'
  const emailContent = `
    <p>Halo ${user.name || 'Warga'},</p>
    <p>Laporan Anda telah diverifikasi dan dinyatakan <strong>valid</strong>.</p>
    <p><strong>Kode Pelacakan:</strong> ${data.trackingCode}</p>
    <p><strong>Judul:</strong> ${data.title}</p>
    <p><strong>Penanggung Jawab:</strong> ${data.picName}</p>
    ${data.estimatedEnd ? `<p><strong>Estimasi Selesai:</strong> ${data.estimatedEnd}</p>` : ''}
    <p>Perbaikan akan segera dimulai. Anda akan menerima notifikasi saat status berubah.</p>
  `
  const whatsappMessage = `✅ *Laporan Diverifikasi*\n\nKode: ${data.trackingCode}\nPIC: ${data.picName}\n${data.estimatedEnd ? `Est. selesai: ${data.estimatedEnd}\n` : ''}\nPantau: https://laporin.site/laporan/${data.trackingCode}`

  const emailResult = await sendEmail(
    user.email,
    title,
    generateEmailHTML(
      title,
      emailContent,
      'Lihat Status',
      `https://laporin.site/laporan/${data.trackingCode}`
    )
  )
  await logNotification(
    userId,
    reportId,
    'email',
    emailResult.success ? 'sent' : 'failed',
    title,
    emailContent
  )

  if (user.phone) {
    const whatsappResult = await sendWhatsApp(user.phone, whatsappMessage)
    await logNotification(
      userId,
      reportId,
      'whatsapp',
      whatsappResult.success ? 'sent' : 'failed',
      title,
      whatsappMessage
    )
  }

  const pushResult = await sendPush(userId, title, `PIC: ${data.picName}`)
  await logNotification(
    userId,
    reportId,
    'push',
    pushResult.success ? 'sent' : 'failed',
    title,
    `PIC: ${data.picName}`
  )
}

/**
 * Send notification for: Report In Progress
 */
export async function notifyReportInProgress(
  userId: string,
  reportId: string,
  data: NotificationData['reportInProgress']
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true, name: true },
  })

  if (!user) return

  const title = '🚧 Perbaikan Dimulai'
  const emailContent = `
    <p>Halo ${user.name || 'Warga'},</p>
    <p>Kabar baik! Perbaikan untuk laporan Anda telah dimulai.</p>
    <p><strong>Kode Pelacakan:</strong> ${data.trackingCode}</p>
    <p><strong>Judul:</strong> ${data.title}</p>
    ${data.estimatedEnd ? `<p><strong>Estimasi Selesai:</strong> ${data.estimatedEnd}</p>` : ''}
    <p>Kami akan memberitahu Anda ketika perbaikan selesai.</p>
  `
  const whatsappMessage = `🚧 *Perbaikan Dimulai*\n\nKode: ${data.trackingCode}\n${data.estimatedEnd ? `Est. selesai: ${data.estimatedEnd}\n` : ''}\nPantau: https://laporin.site/laporan/${data.trackingCode}`

  const emailResult = await sendEmail(
    user.email,
    title,
    generateEmailHTML(
      title,
      emailContent,
      'Lihat Progress',
      `https://laporin.site/laporan/${data.trackingCode}`
    )
  )
  await logNotification(
    userId,
    reportId,
    'email',
    emailResult.success ? 'sent' : 'failed',
    title,
    emailContent
  )

  if (user.phone) {
    const whatsappResult = await sendWhatsApp(user.phone, whatsappMessage)
    await logNotification(
      userId,
      reportId,
      'whatsapp',
      whatsappResult.success ? 'sent' : 'failed',
      title,
      whatsappMessage
    )
  }

  const pushResult = await sendPush(userId, title, data.title)
  await logNotification(
    userId,
    reportId,
    'push',
    pushResult.success ? 'sent' : 'failed',
    title,
    data.title
  )
}

/**
 * Send notification for: Report Completed
 */
export async function notifyReportCompleted(
  userId: string,
  reportId: string,
  data: NotificationData['reportCompleted']
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true, name: true },
  })

  if (!user) return

  const title = '🎉 Perbaikan Selesai!'
  const emailContent = `
    <p>Halo ${user.name || 'Warga'},</p>
    <p>Perbaikan untuk laporan Anda telah <strong>selesai</strong>!</p>
    <p><strong>Kode Pelacakan:</strong> ${data.trackingCode}</p>
    <p><strong>Judul:</strong> ${data.title}</p>
    <p><strong>Selesai pada:</strong> ${data.completedAt}</p>
    <p>Silakan verifikasi hasil perbaikan dan berikan rating kepuasan Anda.</p>
  `
  const whatsappMessage = `🎉 *Perbaikan Selesai!*\n\nKode: ${data.trackingCode}\nSelesai: ${data.completedAt}\n\nSilakan verifikasi dan beri rating:\nhttps://laporin.site/laporan/${data.trackingCode}`

  const emailResult = await sendEmail(
    user.email,
    title,
    generateEmailHTML(
      title,
      emailContent,
      'Verifikasi & Beri Rating',
      `https://laporin.site/laporan/${data.trackingCode}`
    )
  )
  await logNotification(
    userId,
    reportId,
    'email',
    emailResult.success ? 'sent' : 'failed',
    title,
    emailContent
  )

  if (user.phone) {
    const whatsappResult = await sendWhatsApp(user.phone, whatsappMessage)
    await logNotification(
      userId,
      reportId,
      'whatsapp',
      whatsappResult.success ? 'sent' : 'failed',
      title,
      whatsappMessage
    )
  }

  const pushResult = await sendPush(userId, title, 'Silakan verifikasi hasil perbaikan')
  await logNotification(
    userId,
    reportId,
    'push',
    pushResult.success ? 'sent' : 'failed',
    title,
    'Silakan verifikasi hasil perbaikan'
  )
}

/**
 * Send notification for: Report Disputed
 */
export async function notifyReportDisputed(
  officerId: string,
  reportId: string,
  data: NotificationData['reportDisputed']
): Promise<void> {
  const officer = await db.user.findUnique({
    where: { id: officerId },
    select: { email: true, phone: true, name: true },
  })

  if (!officer) return

  const title = '⚠️ Laporan Disanggah Warga'
  const emailContent = `
    <p>Halo ${officer.name},</p>
    <p>Seorang warga telah menyanggah status laporan berikut:</p>
    <p><strong>Kode Pelacakan:</strong> ${data.trackingCode}</p>
    <p><strong>Judul:</strong> ${data.title}</p>
    <p><strong>Catatan Sanggahan:</strong> ${data.disputeNote}</p>
    <p>Silakan tinjau kembali laporan ini dan ambil tindakan yang diperlukan.</p>
  `
  const whatsappMessage = `⚠️ *Laporan Disanggah*\n\nKode: ${data.trackingCode}\nCatatan: ${data.disputeNote}\n\nTinjau: https://laporin.site/gov/laporan/${data.trackingCode}`

  const emailResult = await sendEmail(
    officer.email,
    title,
    generateEmailHTML(
      title,
      emailContent,
      'Tinjau Laporan',
      `https://laporin.site/gov/laporan/${data.trackingCode}`
    )
  )
  await logNotification(
    officerId,
    reportId,
    'email',
    emailResult.success ? 'sent' : 'failed',
    title,
    emailContent
  )

  if (officer.phone) {
    const whatsappResult = await sendWhatsApp(officer.phone, whatsappMessage)
    await logNotification(
      officerId,
      reportId,
      'whatsapp',
      whatsappResult.success ? 'sent' : 'failed',
      title,
      whatsappMessage
    )
  }

  const pushResult = await sendPush(officerId, title, data.title)
  await logNotification(
    officerId,
    reportId,
    'push',
    pushResult.success ? 'sent' : 'failed',
    title,
    data.title
  )
}

/**
 * Send notification for: SLA Breached
 */
export async function notifySLABreached(
  officerId: string,
  reportId: string,
  data: NotificationData['slaBreached']
): Promise<void> {
  const officer = await db.user.findUnique({
    where: { id: officerId },
    select: { email: true, phone: true, name: true },
  })

  if (!officer) return

  const title = '🚨 SLA Terlampaui'
  const emailContent = `
    <p>Halo ${officer.name},</p>
    <p>Laporan berikut telah melampaui target SLA:</p>
    <p><strong>Kode Pelacakan:</strong> ${data.trackingCode}</p>
    <p><strong>Judul:</strong> ${data.title}</p>
    <p><strong>Prioritas:</strong> ${data.priority}</p>
    <p><strong>Keterlambatan:</strong> ${data.daysOverdue} hari</p>
    <p>Segera ambil tindakan untuk menyelesaikan laporan ini.</p>
  `
  const whatsappMessage = `🚨 *SLA Terlampaui*\n\nKode: ${data.trackingCode}\nTerlambat: ${data.daysOverdue} hari\nPrioritas: ${data.priority}\n\nSegera tindak lanjuti!`

  const emailResult = await sendEmail(
    officer.email,
    title,
    generateEmailHTML(
      title,
      emailContent,
      'Lihat Laporan',
      `https://laporin.site/gov/laporan/${data.trackingCode}`
    )
  )
  await logNotification(
    officerId,
    reportId,
    'email',
    emailResult.success ? 'sent' : 'failed',
    title,
    emailContent
  )

  if (officer.phone) {
    const whatsappResult = await sendWhatsApp(officer.phone, whatsappMessage)
    await logNotification(
      officerId,
      reportId,
      'whatsapp',
      whatsappResult.success ? 'sent' : 'failed',
      title,
      whatsappMessage
    )
  }

  const pushResult = await sendPush(officerId, title, `${data.daysOverdue} hari terlambat`)
  await logNotification(
    officerId,
    reportId,
    'push',
    pushResult.success ? 'sent' : 'failed',
    title,
    `${data.daysOverdue} hari terlambat`
  )
}

/**
 * Send notification for: New Report in Jurisdiction
 */
export async function notifyNewReportInJurisdiction(
  officerId: string,
  reportId: string,
  data: NotificationData['newReportInJurisdiction']
): Promise<void> {
  const officer = await db.user.findUnique({
    where: { id: officerId },
    select: { email: true, phone: true, name: true },
  })

  if (!officer) return

  const dangerEmoji = ['', '⚠️', '⚠️⚠️', '🚨', '🚨🚨', '🔴'][data.dangerLevel] || ''
  const title = `📍 Laporan Baru: ${data.regionName}`
  const emailContent = `
    <p>Halo ${officer.name},</p>
    <p>Ada laporan baru di wilayah Anda:</p>
    <p><strong>Kode Pelacakan:</strong> ${data.trackingCode}</p>
    <p><strong>Judul:</strong> ${data.title}</p>
    <p><strong>Kategori:</strong> ${data.categoryName}</p>
    <p><strong>Tingkat Bahaya:</strong> ${dangerEmoji} ${data.dangerLevel}/5</p>
    <p><strong>Lokasi:</strong> ${data.regionName}</p>
    <p>Silakan verifikasi laporan ini sesegera mungkin.</p>
  `
  const whatsappMessage = `📍 *Laporan Baru*\n\nKode: ${data.trackingCode}\nKategori: ${data.categoryName}\nBahaya: ${dangerEmoji} ${data.dangerLevel}/5\nLokasi: ${data.regionName}\n\nVerifikasi: https://laporin.site/gov/laporan/${data.trackingCode}`

  const emailResult = await sendEmail(
    officer.email,
    title,
    generateEmailHTML(
      title,
      emailContent,
      'Verifikasi Laporan',
      `https://laporin.site/gov/laporan/${data.trackingCode}`
    )
  )
  await logNotification(
    officerId,
    reportId,
    'email',
    emailResult.success ? 'sent' : 'failed',
    title,
    emailContent
  )

  // Push notification only (no WhatsApp for every new report)
  const pushResult = await sendPush(
    officerId,
    title,
    `${data.categoryName} - Bahaya: ${data.dangerLevel}/5`
  )
  await logNotification(
    officerId,
    reportId,
    'push',
    pushResult.success ? 'sent' : 'failed',
    title,
    `${data.categoryName} - Bahaya: ${data.dangerLevel}/5`
  )
}
