// ── apps/api/src/routes/ai.ts ──
// Citizen-facing AI endpoints

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { stream } from 'hono/streaming'
import { db } from '../db.js'
import { authMiddleware, type AuthVariables } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import {
  classifyReportPhoto,
  chatbot,
  detectDuplicate,
  generateEmbedding,
} from '../services/ai.service.js'

const ai = new Hono<{ Variables: AuthVariables }>()

/**
 * POST /ai/classify-photo
 * Classify infrastructure photo
 * Rate limit: 10 requests per hour per IP
 */
const classifyPhotoSchema = z.object({
  base64Image: z.string().min(100),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

ai.post(
  '/classify-photo',
  rateLimit({ max: 10, windowSeconds: 3600, keyPrefix: 'ratelimit:ai:classify' }),
  zValidator('json', classifyPhotoSchema),
  async (c) => {
    const { base64Image, mimeType } = c.req.valid('json')

    try {
      const result = await classifyReportPhoto(base64Image, mimeType)

      // Get category details
      const category = await db.category.findUnique({
        where: { id: result.categoryId },
        select: {
          id: true,
          name: true,
          emoji: true,
        },
      })

      return c.json({
        data: {
          category,
          reasoning: result.reasoning,
        },
      })
    } catch (error) {
      console.error('Classify photo error:', error)
      return c.json({ error: 'Failed to classify photo' }, 500)
    }
  }
)

/**
 * POST /ai/check-duplicate
 * Check for duplicate reports
 * Rate limit: 20 requests per hour per IP
 */
const checkDuplicateSchema = z.object({
  reportId: z.string().uuid(),
})

ai.post(
  '/check-duplicate',
  rateLimit({ max: 20, windowSeconds: 3600, keyPrefix: 'ratelimit:ai:duplicate' }),
  zValidator('json', checkDuplicateSchema),
  async (c) => {
    const { reportId } = c.req.valid('json')

    try {
      // Get report
      const report = await db.report.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          title: true,
          description: true,
          locationAddress: true,
          locationLat: true,
          locationLng: true,
        },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      // Generate embedding
      const embeddingText = `${report.title} ${report.description} ${report.locationAddress}`
      const embedding = await generateEmbedding(embeddingText)

      // Detect duplicates
      const duplicateResult = await detectDuplicate(reportId, embedding)

      if (!duplicateResult.isDuplicate) {
        return c.json({
          data: {
            isDuplicate: false,
            similarReports: [],
          },
        })
      }

      // Get similar report details
      const similarReport = await db.report.findUnique({
        where: { id: duplicateResult.similarReportId },
        select: {
          id: true,
          trackingCode: true,
          title: true,
          status: true,
          locationLat: true,
          locationLng: true,
          createdAt: true,
          category: {
            select: {
              name: true,
              emoji: true,
            },
          },
        },
      })

      // Calculate distance between reports
      let distance = 0
      if (similarReport) {
        const lat1 = Number(report.locationLat)
        const lon1 = Number(report.locationLng)
        const lat2 = Number(similarReport.locationLat)
        const lon2 = Number(similarReport.locationLng)

        // Haversine formula for distance in meters
        const R = 6371e3 // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180
        const φ2 = (lat2 * Math.PI) / 180
        const Δφ = ((lat2 - lat1) * Math.PI) / 180
        const Δλ = ((lon2 - lon1) * Math.PI) / 180

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

        distance = Math.round(R * c)
      }

      return c.json({
        data: {
          isDuplicate: true,
          similarity: duplicateResult.similarity,
          similarReports: similarReport
            ? [
                {
                  ...similarReport,
                  distance,
                },
              ]
            : [],
        },
      })
    } catch (error) {
      console.error('Check duplicate error:', error)
      return c.json({ error: 'Failed to check duplicates' }, 500)
    }
  }
)

/**
 * POST /ai/chatbot
 * AI chatbot for citizen questions
 * Rate limit: 30 requests per hour per IP
 */
const chatbotSchema = z.object({
  message: z.string().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .max(10)
    .optional()
    .default([]),
})

ai.post(
  '/chatbot',
  rateLimit({ max: 30, windowSeconds: 3600, keyPrefix: 'ratelimit:ai:chatbot' }),
  zValidator('json', chatbotSchema),
  async (c) => {
    const { message, history } = c.req.valid('json')

    try {
      const response = await chatbot(message, history)

      return c.json({
        data: {
          message: response,
        },
      })
    } catch (error) {
      console.error('Chatbot error:', error)
      return c.json({ error: 'Failed to get chatbot response' }, 500)
    }
  }
)

/**
 * POST /ai/chatbot/stream
 * Streaming chatbot response
 * Rate limit: 30 requests per hour per IP
 */
ai.post(
  '/chatbot/stream',
  rateLimit({ max: 30, windowSeconds: 3600, keyPrefix: 'ratelimit:ai:chatbot-stream' }),
  zValidator('json', chatbotSchema),
  async (c) => {
    const { message, history } = c.req.valid('json')

    return stream(c, async (stream) => {
      try {
        const response = await chatbot(message, history)

        // Simulate streaming by sending word by word
        const words = response.split(' ')
        for (const word of words) {
          await stream.write(`${word} `)
          await stream.sleep(50) // 50ms delay between words
        }
      } catch (error) {
        console.error('Chatbot stream error:', error)
        await stream.write('Maaf, terjadi kesalahan. Silakan coba lagi.')
      }
    })
  }
)

/**
 * GET /ai/suggestions
 * Get AI-powered suggestions for report improvement
 * Requires authentication
 */
const suggestionsSchema = z.object({
  reportId: z.string().uuid(),
})

ai.get(
  '/suggestions',
  authMiddleware,
  zValidator('query', suggestionsSchema),
  async (c) => {
    const { reportId } = c.req.valid('query')
    const user = c.get('user')

    try {
      // Get report
      const report = await db.report.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          reporterId: true,
          title: true,
          description: true,
          dangerLevel: true,
          aiAnalysis: {
            select: {
              dangerLevel: true,
              isHoax: true,
              impactSummary: true,
            },
          },
        },
      })

      if (!report) {
        return c.json({ error: 'Report not found' }, 404)
      }

      // Check if user owns the report
      if (report.reporterId !== user.sub) {
        return c.json({ error: 'Access denied' }, 403)
      }

      // Return AI analysis suggestions
      const suggestions = []

      if (report.aiAnalysis) {
        if (report.aiAnalysis.dangerLevel && report.aiAnalysis.dangerLevel <= 2) {
          suggestions.push({
            type: 'info',
            message: 'Laporan Anda dikategorikan sebagai prioritas rendah.',
          })
        }

        if (report.aiAnalysis.isHoax) {
          suggestions.push({
            type: 'warning',
            message: `Sistem mendeteksi kemungkinan informasi tidak akurat. Mohon verifikasi kembali detail laporan Anda.`,
          })
        }

        if (report.description.length < 50) {
          suggestions.push({
            type: 'tip',
            message: 'Tambahkan detail lebih lengkap untuk mempercepat proses verifikasi.',
          })
        }
      }

      return c.json({
        data: {
          suggestions,
          analysis: report.aiAnalysis,
        },
      })
    } catch (error) {
      console.error('Get suggestions error:', error)
      return c.json({ error: 'Failed to get suggestions' }, 500)
    }
  }
)

export default ai
