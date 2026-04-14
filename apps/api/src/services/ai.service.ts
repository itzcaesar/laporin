// ── apps/api/src/services/ai.service.ts ──
// AI service using OpenRouter API

import { env } from '../env.js'
import { db } from '../db.js'

/**
 * OpenRouter API configuration
 */
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const API_KEY = env.OPENROUTER_API_KEY || env.ANTHROPIC_API_KEY

// Free models available on OpenRouter
const MODELS = {
  vision: 'google/gemini-flash-1.5-8b-exp', // For image classification
  text: 'meta-llama/llama-3.1-8b-instruct', // For text analysis (remove :free suffix)
  quick: 'meta-llama/llama-3.2-3b-instruct', // For quick tasks (remove :free suffix)
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(
  model: string,
  messages: Array<{ role: string; content: any }>,
  maxTokens: number = 500
): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://laporin.site',
      'X-Title': 'Laporin',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Classify report photo using vision model
 * @param base64Image - Base64 encoded image
 * @param mimeType - Image MIME type (image/jpeg, image/png, image/webp)
 * @returns Category ID and reasoning
 */
export async function classifyReportPhoto(
  base64Image: string,
  mimeType: string
): Promise<{ categoryId: number; reasoning: string }> {
  try {
    // Get all categories for classification
    const categories = await db.category.findMany({
      select: { id: true, name: true, emoji: true },
    })

    const categoryList = categories
      .map((cat) => `${cat.id}. ${cat.name}`)
      .join('\n')

    const prompt = `Anda adalah AI classifier untuk laporan infrastruktur publik di Indonesia.

Analisis foto ini dan tentukan kategori yang paling sesuai dari daftar berikut:

${categoryList}

Berikan respons dalam format JSON:
{
  "categoryId": <number>,
  "reasoning": "<penjelasan singkat dalam Bahasa Indonesia>"
}

Hanya berikan JSON, tanpa teks tambahan.`

    // Note: Vision models with images require special handling
    // For now, we'll skip actual image classification
    // TODO: Implement proper image classification with vision model
    throw new Error('Image classification not yet implemented')
  } catch (error) {
    console.error('AI classify photo error:', error)
    // Fallback to default category (Other)
    return {
      categoryId: 23, // "Lainnya" category
      reasoning: 'Gagal mengklasifikasi foto, menggunakan kategori default',
    }
  }
}

/**
 * Predict danger level based on report content
 * @param title - Report title
 * @param description - Report description
 * @param categoryId - Category ID
 * @returns Danger level and reasoning
 */
export async function predictDangerLevel(
  title: string,
  description: string,
  categoryId: number
): Promise<{ dangerLevel: 'low' | 'medium' | 'high' | 'critical'; reasoning: string }> {
  try {
    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    })

    const prompt = `Anda adalah AI analyzer untuk menilai tingkat bahaya infrastruktur rusak di Indonesia.

Laporan:
- Judul: ${title}
- Kategori: ${category?.name || 'Unknown'}
- Deskripsi: ${description}

Tentukan tingkat bahaya (danger level):
- low: Kerusakan ringan, tidak mendesak
- medium: Kerusakan sedang, perlu perbaikan segera
- high: Kerusakan parah, berpotensi bahaya
- critical: Sangat berbahaya, perlu penanganan darurat

Berikan respons dalam format JSON:
{
  "dangerLevel": "low|medium|high|critical",
  "reasoning": "<penjelasan singkat dalam Bahasa Indonesia>"
}

Hanya berikan JSON, tanpa teks tambahan.`

    const response = await callOpenRouter(
      MODELS.text,
      [{ role: 'user', content: prompt }],
      300
    )

    const result = JSON.parse(response)
    return {
      dangerLevel: result.dangerLevel,
      reasoning: result.reasoning,
    }
  } catch (error) {
    console.error('AI predict danger level error:', error)
    return {
      dangerLevel: 'medium',
      reasoning: 'Gagal memprediksi tingkat bahaya, menggunakan level default',
    }
  }
}

/**
 * Summarize report description
 * @param description - Full report description
 * @returns Concise summary in Bahasa Indonesia
 */
export async function summarizeReport(description: string): Promise<string> {
  try {
    const prompt = `Ringkas deskripsi laporan infrastruktur berikut dalam 1-2 kalimat singkat (maksimal 150 karakter) dalam Bahasa Indonesia:

${description}

Hanya berikan ringkasan, tanpa teks tambahan.`

    const response = await callOpenRouter(
      MODELS.quick,
      [{ role: 'user', content: prompt }],
      100
    )

    return response.trim()
  } catch (error) {
    console.error('AI summarize error:', error)
    // Return truncated description as fallback
    return description.substring(0, 150) + (description.length > 150 ? '...' : '')
  }
}

/**
 * Detect if report is likely a hoax
 * @param title - Report title
 * @param description - Report description
 * @param location - Location string
 * @returns Hoax detection result
 */
export async function detectHoax(
  title: string,
  description: string,
  location: string
): Promise<{ isHoax: boolean; confidence: number; reason: string }> {
  try {
    const prompt = `Anda adalah AI detector untuk mendeteksi laporan hoax/palsu tentang infrastruktur di Indonesia.

Analisis laporan berikut:
- Judul: ${title}
- Lokasi: ${location}
- Deskripsi: ${description}

Indikator hoax:
- Bahasa tidak wajar atau berlebihan
- Informasi tidak konsisten
- Lokasi tidak jelas atau tidak masuk akal
- Deskripsi terlalu dramatis tanpa detail konkret
- Tanda-tanda clickbait atau sensasional

Berikan respons dalam format JSON:
{
  "isHoax": true/false,
  "confidence": <0-100>,
  "reason": "<penjelasan singkat dalam Bahasa Indonesia>"
}

Hanya berikan JSON, tanpa teks tambahan.`

    const response = await callOpenRouter(
      MODELS.text,
      [{ role: 'user', content: prompt }],
      300
    )

    const result = JSON.parse(response)
    return {
      isHoax: result.isHoax,
      confidence: result.confidence,
      reason: result.reason,
    }
  } catch (error) {
    console.error('AI detect hoax error:', error)
    return {
      isHoax: false,
      confidence: 0,
      reason: 'Gagal mendeteksi hoax, laporan dianggap valid',
    }
  }
}

/**
 * Generate public-facing impact summary
 * @param report - Report data
 * @returns Impact summary text
 */
export async function generateImpactSummary(report: {
  title: string
  description: string
  upvoteCount: number
  categoryName: string
}): Promise<string> {
  try {
    const prompt = `Buat ringkasan dampak publik untuk laporan infrastruktur berikut dalam 1 kalimat (maksimal 100 karakter):

Kategori: ${report.categoryName}
Judul: ${report.title}
Upvotes: ${report.upvoteCount}
Deskripsi: ${report.description}

Fokus pada dampak ke masyarakat. Gunakan Bahasa Indonesia yang formal.

Hanya berikan ringkasan, tanpa teks tambahan.`

    const response = await callOpenRouter(
      MODELS.quick,
      [{ role: 'user', content: prompt }],
      80
    )

    return response.trim()
  } catch (error) {
    console.error('AI generate impact summary error:', error)
    return `Kerusakan ${report.categoryName.toLowerCase()} yang mempengaruhi masyarakat`
  }
}

/**
 * Generate analytics insights for government dashboard
 * @param data - Analytics data
 * @returns Natural language insights
 */
export async function generateAnalyticsInsight(data: {
  totalReports: number
  resolvedCount: number
  avgResolutionDays: number
  topCategories: Array<{ name: string; count: number }>
  period: string
}): Promise<string> {
  try {
    const topCategoriesText = data.topCategories
      .slice(0, 3)
      .map((cat) => `${cat.name} (${cat.count})`)
      .join(', ')

    const prompt = `Anda adalah AI analyst untuk dashboard pemerintah. Buat insight singkat (2-3 kalimat) dalam Bahasa Indonesia dari data berikut:

Periode: ${data.period}
Total Laporan: ${data.totalReports}
Terselesaikan: ${data.resolvedCount}
Rata-rata Waktu Penyelesaian: ${data.avgResolutionDays} hari
Kategori Teratas: ${topCategoriesText}

Berikan insight yang actionable dan fokus pada tren atau rekomendasi.

Hanya berikan insight, tanpa teks tambahan.`

    const response = await callOpenRouter(
      MODELS.text,
      [{ role: 'user', content: prompt }],
      200
    )

    return response.trim()
  } catch (error) {
    console.error('AI generate analytics insight error:', error)
    return 'Data analitik tersedia. Silakan review dashboard untuk detail lebih lanjut.'
  }
}

/**
 * Detect duplicate reports using pgvector similarity
 * @param reportId - Current report ID
 * @param embedding - Text embedding vector
 * @returns Duplicate detection result
 */
export async function detectDuplicate(
  reportId: string,
  embedding: number[]
): Promise<{ isDuplicate: boolean; similarReportId?: string; similarity?: number }> {
  try {
    // Query similar reports using pgvector cosine similarity
    // Threshold: 0.85 similarity (very similar)
    const similarReports = await db.$queryRaw<
      Array<{ id: string; similarity: number }>
    >`
      SELECT 
        id,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM ai_analysis_cache
      WHERE report_id != ${reportId}
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${embedding}::vector) > 0.85
      ORDER BY similarity DESC
      LIMIT 1
    `

    if (similarReports.length > 0) {
      const similar = similarReports[0]
      return {
        isDuplicate: true,
        similarReportId: similar.id,
        similarity: similar.similarity,
      }
    }

    return { isDuplicate: false }
  } catch (error) {
    console.error('AI detect duplicate error:', error)
    return { isDuplicate: false }
  }
}

/**
 * Generate text embedding for duplicate detection
 * @param text - Text to embed
 * @returns Embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // For now, return a simple hash-based embedding
    // In production, use a proper embedding model
    // This is a placeholder implementation
    const hash = text.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0
    }, 0)

    // Generate a 384-dimensional vector (common embedding size)
    const embedding = new Array(384).fill(0).map((_, i) => {
      return Math.sin(hash * (i + 1)) * 0.5 + 0.5
    })

    return embedding
  } catch (error) {
    console.error('Generate embedding error:', error)
    return new Array(384).fill(0)
  }
}

/**
 * Chatbot for citizen questions
 * @param message - User message
 * @param history - Conversation history
 * @returns AI response
 */
export async function chatbot(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const systemPrompt = `Anda adalah asisten virtual Laporin, platform pelaporan infrastruktur publik di Indonesia.

Tugas Anda:
- Membantu warga melaporkan kerusakan infrastruktur
- Menjelaskan cara menggunakan platform
- Memberikan informasi status laporan
- Menjawab pertanyaan umum tentang infrastruktur publik

Gunakan Bahasa Indonesia yang ramah dan profesional.
Jika tidak tahu jawaban, arahkan pengguna untuk menghubungi customer service.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await callOpenRouter(MODELS.text, messages, 500)
    return response.trim()
  } catch (error) {
    console.error('AI chatbot error:', error)
    return 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi nanti atau hubungi customer service kami.'
  }
}
