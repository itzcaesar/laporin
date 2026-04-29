// ── apps/api/src/services/ai.service.ts ──
// AI service using OpenRouter API with free models

import { env } from '../env.js'
import { db } from '../db.js'
import type {
  OpenRouterMessage,
  OpenRouterResponse,
  DangerLevelResult,
  HoaxDetectionResult,
  DuplicateDetectionResult,
  BudgetEstimate,
  PhotoVerificationResult,
  WorkloadPrediction,
} from '../types/common.js'

/**
 * OpenRouter API configuration
 */
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const API_KEY = env.OPENROUTER_API_KEY || env.ANTHROPIC_API_KEY

// Free models available on OpenRouter (in priority order)
const MODELS = {
  vision: 'google/gemini-flash-1.5-8b',         // For image classification (free)
  text: 'meta-llama/llama-3.3-70b-instruct:free', // Primary text model (free)
  quick: 'meta-llama/llama-3.2-3b-instruct:free', // Quick tasks (free)
}

// Fallback chain when free models are rate-limited (429)
const TEXT_FALLBACKS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct', // Paid fallback — last resort
]

const QUICK_FALLBACKS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct',
]

/**
 * Call OpenRouter API with a single model, returns { content, status }
 */
async function callModel(
  model: string,
  messages: OpenRouterMessage[],
  maxTokens: number
): Promise<{ content: string; status: number }> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://laporin.site',
      'X-Title': 'Laporin',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  })
  return { content: await response.text(), status: response.status }
}

/**
 * Call OpenRouter API with automatic model fallback on 429 rate limits
 */
async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  maxTokens: number = 500
): Promise<string> {
  // Build fallback list: start with requested model, then apply appropriate chain
  const isQuickModel = model === MODELS.quick || QUICK_FALLBACKS.includes(model)
  const chain = isQuickModel ? QUICK_FALLBACKS : TEXT_FALLBACKS

  // Ensure the requested model is tried first even if not in chain
  const tryOrder = [model, ...chain.filter((m) => m !== model)]

  let lastError = ''
  for (const tryModel of tryOrder) {
    console.log(`[AI] Trying model: ${tryModel}`)
    try {
      const { content, status } = await callModel(tryModel, messages, maxTokens)

      if (status === 429) {
        console.log(`[AI] Model unavailable (429): ${tryModel} — trying next fallback.`)
        lastError = `${tryModel} rate limited`
        continue
      }

      if (!String(status).startsWith('2')) {
        console.warn(`[AI] Model error (${status}): ${tryModel} — ${content.substring(0, 100)}`)
        lastError = `${tryModel} returned ${status}`
        continue
      }

      const data = JSON.parse(content) as OpenRouterResponse
      return data.choices[0].message.content
    } catch (err) {
      lastError = String(err)
      console.warn(`[AI] Model threw: ${tryModel} — ${lastError}`)
      continue
    }
  }

  throw new Error(`All AI models exhausted. Last error: ${lastError}`)
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

    // Call vision model with image
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://laporin.site',
        'X-Title': 'Laporin',
      },
      body: JSON.stringify({
        model: MODELS.vision,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Vision model error (${response.status}):`, errorText)
      throw new Error(`Vision model returned ${response.status}`)
    }

    const data = (await response.json()) as OpenRouterResponse
    const content = data.choices[0].message.content

    // Parse JSON response
    const result = JSON.parse(content)

    // Validate categoryId exists
    const validCategory = categories.find((cat) => cat.id === result.categoryId)
    if (!validCategory) {
      console.warn(`Invalid categoryId ${result.categoryId} returned by AI, using default`)
      return {
        categoryId: 23,
        reasoning: 'Kategori tidak valid dari AI, menggunakan default',
      }
    }

    return {
      categoryId: result.categoryId,
      reasoning: result.reasoning,
    }
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
): Promise<DangerLevelResult> {
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
): Promise<HoaxDetectionResult> {
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
): Promise<DuplicateDetectionResult> {
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
 * Uses OpenRouter's text embedding model or falls back to OpenAI-compatible endpoint
 * @param text - Text to embed
 * @returns Embedding vector (1536 dimensions for compatibility with pgvector)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use OpenRouter's embedding endpoint (compatible with OpenAI format)
    // Model: text-embedding-3-small (1536 dimensions)
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://laporin.site',
        'X-Title': 'Laporin',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Embedding API error (${response.status}):`, errorText)
      throw new Error(`Embedding API returned ${response.status}`)
    }

    const data = await response.json()
    
    // OpenAI-compatible response format
    if (data.data && data.data[0] && data.data[0].embedding) {
      return data.data[0].embedding
    }

    throw new Error('Invalid embedding response format')
  } catch (error) {
    console.error('Generate embedding error:', error)
    
    // Fallback: Use a simple TF-IDF-like hash-based embedding
    // This is better than the previous implementation but still not ideal
    console.warn('Using fallback hash-based embedding (not recommended for production)')
    
    // Tokenize and create a more sophisticated hash
    const tokens = text.toLowerCase().match(/\b\w+\b/g) || []
    const embedding = new Array(1536).fill(0)
    
    // Use multiple hash functions for better distribution
    tokens.forEach((token, idx) => {
      const hash1 = hashString(token, 1)
      const hash2 = hashString(token, 2)
      const hash3 = hashString(token, 3)
      
      // Distribute across embedding dimensions
      embedding[hash1 % 1536] += 1 / Math.sqrt(tokens.length)
      embedding[hash2 % 1536] += 0.5 / Math.sqrt(tokens.length)
      embedding[hash3 % 1536] += 0.25 / Math.sqrt(tokens.length)
    })
    
    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
  }
}

/**
 * Hash function for fallback embedding
 */
function hashString(str: string, seed: number): number {
  let hash = seed
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Estimate budget for repair
 * @param params - Report parameters
 * @returns Budget estimate in IDR
 */
export async function estimateBudget(params: {
  categoryId: number
  description: string
  locationAddress: string
  dangerLevel: string
}): Promise<BudgetEstimate> {
  try {
    const category = await db.category.findUnique({
      where: { id: params.categoryId },
      select: { name: true },
    })

    const prompt = `Estimasi biaya perbaikan untuk kerusakan infrastruktur di Indonesia:

Kategori: ${category?.name || 'Unknown'}
Deskripsi: ${params.description}
Lokasi: ${params.locationAddress}
Tingkat Bahaya: ${params.dangerLevel}

Gunakan tarif kontraktor pemerintah daerah Indonesia (2026).
Pertimbangkan: lokasi urban vs rural (urban lebih mahal), tingkat kerusakan, estimasi ukuran/skala.

Berikan respons dalam format JSON:
{
  "minIdr": <number>,
  "maxIdr": <number>,
  "basis": "<penjelasan 1 kalimat dalam Bahasa Indonesia>"
}

Hanya berikan JSON, tanpa teks tambahan.`

    const response = await callOpenRouter(MODELS.text, [{ role: 'user', content: prompt }], 200)

    const result = JSON.parse(response)
    return {
      minIdr: result.minIdr,
      maxIdr: result.maxIdr,
      basis: result.basis,
    }
  } catch (error) {
    console.error('AI estimate budget error:', error)
    // Fallback to reasonable defaults based on category
    return {
      minIdr: 5000000,
      maxIdr: 15000000,
      basis: 'Estimasi default berdasarkan kategori',
    }
  }
}

/**
 * Verify before/after photos
 * @param params - Photo comparison parameters
 * @returns Verification result
 */
export async function verifyBeforeAfterPhoto(params: {
  beforeBase64: string
  afterBase64: string
  mimeType: string
  categoryId: number
}): Promise<PhotoVerificationResult> {
  try {
    const category = await db.category.findUnique({
      where: { id: params.categoryId },
      select: { name: true },
    })

    const prompt = `Anda adalah AI verifikator untuk perbaikan infrastruktur publik di Indonesia.

Kategori: ${category?.name || 'Unknown'}

Tugas Anda:
1. Bandingkan foto SEBELUM dan SESUDAH perbaikan
2. Tentukan apakah ada kemajuan/perbaikan yang terlihat
3. Identifikasi masalah atau kekhawatiran jika ada

Berikan respons dalam format JSON:
{
  "progressDetected": true/false,
  "confidence": <0-100>,
  "description": "<deskripsi perbandingan dalam Bahasa Indonesia, 2-3 kalimat>",
  "concerns": "<kekhawatiran jika ada, atau null>"
}

Kriteria perbaikan yang valid:
- Kerusakan terlihat diperbaiki atau berkurang
- Area terlihat lebih rapi/bersih
- Infrastruktur terlihat lebih baik dari sebelumnya

Red flags (concerns):
- Foto tidak menunjukkan lokasi yang sama
- Tidak ada perubahan signifikan
- Kondisi malah terlihat lebih buruk
- Foto terlalu blur atau tidak jelas

Hanya berikan JSON, tanpa teks tambahan.`

    // Call vision model with both images
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://laporin.site',
        'X-Title': 'Laporin',
      },
      body: JSON.stringify({
        model: MODELS.vision,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Foto SEBELUM perbaikan:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${params.mimeType};base64,${params.beforeBase64}`,
                },
              },
              {
                type: 'text',
                text: 'Foto SESUDAH perbaikan:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${params.mimeType};base64,${params.afterBase64}`,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 400,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Vision model error (${response.status}):`, errorText)
      throw new Error(`Vision model returned ${response.status}`)
    }

    const data = (await response.json()) as OpenRouterResponse
    const content = data.choices[0].message.content

    // Parse JSON response
    const result = JSON.parse(content)

    return {
      progressDetected: result.progressDetected,
      confidence: result.confidence / 100, // Convert to 0-1 range
      description: result.description,
      concerns: result.concerns,
    }
  } catch (error) {
    console.error('AI verify before/after photo error:', error)
    return {
      progressDetected: false,
      confidence: 0,
      description: 'Gagal memverifikasi foto, mohon verifikasi manual',
      concerns: 'Sistem verifikasi foto mengalami gangguan',
    }
  }
}

/**
 * Generate daily insight for government dashboard
 * @param data - Dashboard data
 * @returns Daily insight text
 */
export async function generateDailyInsight(data: {
  agencyName: string
  topRisingCategory: string
  risePercent: number
  totalOpen: number
  slaBreached: number
  seasonContext: string
}): Promise<string> {
  try {
    const prompt = `Buat SATU insight harian singkat dalam Bahasa Indonesia (maksimal 30 kata) untuk dashboard pemerintah ${data.agencyName}:

- Kategori meningkat: ${data.topRisingCategory} (+${data.risePercent}%)
- Laporan terbuka: ${data.totalOpen}, SLA terlampaui: ${data.slaBreached}
- Musim: ${data.seasonContext}

Buat insight yang actionable untuk petugas pemerintah.
Hanya berikan kalimat insight, tanpa teks tambahan.`

    const response = await callOpenRouter(MODELS.quick, [{ role: 'user', content: prompt }], 120)

    return response.trim()
  } catch (error) {
    console.error('AI generate daily insight error:', error)
    return `${data.topRisingCategory} meningkat ${data.risePercent}%. Perhatikan ${data.slaBreached} laporan yang melampaui SLA.`
  }
}

/**
 * Predict workload for next week
 * @param agencyId - Agency ID
 * @returns Workload prediction
 */
export async function predictWorkload(agencyId: string): Promise<WorkloadPrediction> {
  try {
    // Get historical data (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const historicalData = await db.$queryRaw<
      Array<{ week: number; count: bigint }>
    >`
      SELECT 
        EXTRACT(WEEK FROM created_at) as week,
        COUNT(*) as count
      FROM reports
      WHERE agency_id = ${agencyId}
        AND created_at >= ${ninetyDaysAgo}
      GROUP BY EXTRACT(WEEK FROM created_at)
      ORDER BY week DESC
    `

    // Simple average-based prediction
    const avgWeekly =
      historicalData.length > 0
        ? historicalData.reduce((sum, item) => sum + Number(item.count), 0) /
          historicalData.length
        : 0

    // Add 10% buffer for seasonal variation
    const predictedWeeklyTotal = Math.round(avgWeekly * 1.1)

    // Get by subdistrict
    const bySubdistrict = await db.$queryRaw<
      Array<{ region_code: string; count: bigint }>
    >`
      SELECT 
        region_code,
        COUNT(*) as count
      FROM reports
      WHERE agency_id = ${agencyId}
        AND created_at >= ${ninetyDaysAgo}
      GROUP BY region_code
      ORDER BY count DESC
      LIMIT 10
    `

    // Get officer count per region for staffing context
    const officerCounts = await db.$queryRaw<
      Array<{ region_code: string; officer_count: bigint }>
    >`
      SELECT 
        r.region_code,
        COUNT(DISTINCT u.id) as officer_count
      FROM reports r
      LEFT JOIN users u ON u.agency_id = ${agencyId}::uuid
        AND u.role IN ('officer', 'admin')
        AND u.is_active = true
      WHERE r.agency_id = ${agencyId}::uuid
        AND r.created_at >= ${ninetyDaysAgo}
      GROUP BY r.region_code
    `

    const officerMap = new Map(
      officerCounts.map((o) => [o.region_code, Number(o.officer_count)])
    )

    const subdistrictPredictions = bySubdistrict.map((item) => ({
      code: item.region_code,
      predicted: Math.round((Number(item.count) / 90) * 7 * 1.1), // Weekly prediction
      currentStaff: officerMap.get(item.region_code) || 0,
    }))

    // Generate recommendation if needed
    let recommendation: string | null = null
    if (predictedWeeklyTotal > avgWeekly * 1.5) {
      const prompt = `Prediksi laporan minggu depan: ${predictedWeeklyTotal} (rata-rata: ${Math.round(avgWeekly)}).
Buat rekomendasi staffing singkat (1 kalimat, maksimal 20 kata) dalam Bahasa Indonesia.
Hanya berikan rekomendasi, tanpa teks tambahan.`

      const response = await callOpenRouter(
        MODELS.quick,
        [{ role: 'user', content: prompt }],
        80
      )
      recommendation = response.trim()
    }

    return {
      predictedWeeklyTotal,
      bySubdistrict: subdistrictPredictions,
      recommendation,
    }
  } catch (error) {
    console.error('AI predict workload error:', error)
    return {
      predictedWeeklyTotal: 0,
      bySubdistrict: [],
      recommendation: null,
    }
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
      { role: 'system' as const, content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await callOpenRouter(MODELS.text, messages, 500)
    return response.trim()
  } catch (error) {
    console.error('AI chatbot error:', error)
    return 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi nanti atau hubungi customer service kami.'
  }
}
