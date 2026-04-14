// ── apps/api/src/lib/priorityScore.ts ──
// Calculates priority score for reports (0-100)
// Higher score = needs attention sooner

/**
 * Input parameters for priority score calculation
 */
export interface PriorityScoreInput {
  dangerLevel: number   // 1–5 from AI prediction
  categoryId: number    // Some categories weigh more by default
  upvoteCount: number   // Citizen engagement signal
  ageHours: number      // How long report has been open
  slaBreached: boolean  // Past the SLA target date
}

/**
 * Category weights for priority calculation.
 * Higher weight = more urgent by default.
 */
const CATEGORY_WEIGHTS: Record<number, number> = {
  6: 1.5,   // Website Pemerintah Disusupi Judol (urgent)
  12: 1.4,  // Jembatan Umum (urgent)
  19: 1.4,  // Banjir / Genangan Jalan (urgent)
  20: 1.4,  // Rel Kereta & Perlintasan (urgent)
  3: 1.2,   // Lampu Lalu Lintas & Lampu Jalan (high)
  8: 1.2,   // Jembatan Penyeberangan & Zebra Cross (high)
  11: 1.2,  // Drainase / Saluran Air (high)
  13: 1.2,  // Fasilitas Air Bersih (high)
  17: 1.2,  // Fasilitas Kesehatan Pemerintah (high)
  21: 1.2,  // Pelabuhan / Dermaga (high)
}

/**
 * Calculates a priority score from 0 to 100.
 * Higher score = needs attention sooner.
 * Used to sort the government dashboard report list.
 * 
 * Algorithm breakdown:
 * - Danger level: 0-50 points (50% weight)
 * - Upvote count: 0-15 points (15% weight, logarithmic)
 * - Age: 0-20 points (20% weight, capped at 72 hours)
 * - SLA breach: 0-15 points (15% weight, binary)
 * - Category weight: multiplier applied to final score
 * 
 * @param input - Priority score calculation parameters
 * @returns Priority score from 0 to 100
 */
export function calculatePriorityScore(input: PriorityScoreInput): number {
  // Danger level contribution (0-50 points)
  const dangerPoints = (input.dangerLevel / 5) * 50

  // Upvote contribution (0-15 points, logarithmic scale)
  // log10(1) = 0, log10(10) = 1, log10(100) = 2, log10(1000) = 3
  const upvotePoints = Math.min(Math.log10(input.upvoteCount + 1) * 10, 15)

  // Age contribution (0-20 points, capped at 72 hours)
  // Linear scale: 0 hours = 0 points, 72 hours = 20 points
  const agePoints = Math.min((input.ageHours / 72) * 20, 20)

  // SLA breach contribution (0-15 points, binary)
  const slaPoints = input.slaBreached ? 15 : 0

  // Base score before category weight
  const baseScore = dangerPoints + upvotePoints + agePoints + slaPoints

  // Apply category weight multiplier
  const categoryWeight = CATEGORY_WEIGHTS[input.categoryId] ?? 1.0
  const weightedScore = baseScore * categoryWeight

  // Clamp to 0-100 range and round
  return Math.min(Math.round(weightedScore), 100)
}

/**
 * Gets the category weight multiplier for a given category.
 * 
 * @param categoryId - Category ID
 * @returns Weight multiplier (1.0 = normal, >1.0 = higher priority)
 */
export function getCategoryWeight(categoryId: number): number {
  return CATEGORY_WEIGHTS[categoryId] ?? 1.0
}

/**
 * Calculates how many hours a report has been open.
 * 
 * @param createdAt - Report creation timestamp
 * @returns Hours since creation
 */
export function calculateAgeHours(createdAt: Date): number {
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours
}
