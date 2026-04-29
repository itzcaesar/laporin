// ── apps/api/src/lib/bigint-polyfill.ts ──
// BigInt JSON serialization polyfill
//
// WHY THIS IS NEEDED:
// Prisma uses BigInt for large numeric fields (e.g., budgetEstimate in IDR).
// JavaScript's JSON.stringify() doesn't support BigInt by default and throws:
// "TypeError: Do not know how to serialize a BigInt"
//
// SOLUTION:
// Add a toJSON method to BigInt.prototype that converts to Number.
//
// SAFETY:
// - Safe for values < Number.MAX_SAFE_INTEGER (2^53 - 1 = 9,007,199,254,740,991)
// - Budget estimates in IDR are typically < 1 trillion (safe range)
// - Logs warning if value exceeds safe range
//
// ALTERNATIVES CONSIDERED:
// 1. Convert to string: Breaks numeric operations in frontend
// 2. Use custom serializer: Requires changes throughout codebase
// 3. Change Prisma schema: BigInt is correct type for large currency values
//
// REFERENCES:
// - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
// - https://github.com/GoogleChromeLabs/jsbi#why

/**
 * Maximum safe integer value in JavaScript
 * Any integer larger than this may lose precision when converted to Number
 */
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER // 9,007,199,254,740,991

/**
 * Maximum expected budget in IDR (1 trillion)
 * This is well within the safe range
 */
const MAX_EXPECTED_BUDGET_IDR = 1_000_000_000_000 // 1 trillion

/**
 * Initialize BigInt JSON serialization polyfill
 * Must be called before any JSON.stringify() operations on BigInt values
 */
export function initBigIntPolyfill(): void {
  // Check if already initialized
  if ((BigInt.prototype as any).toJSON) {
    console.log('⚠️  BigInt polyfill already initialized')
    return
  }

  // Add toJSON method to BigInt prototype
  ;(BigInt.prototype as any).toJSON = function (this: bigint): number {
    const num = Number(this)

    // Warn if value exceeds safe range
    if (num > MAX_SAFE_INTEGER) {
      console.warn(
        `⚠️  BigInt ${this} exceeds MAX_SAFE_INTEGER (${MAX_SAFE_INTEGER}), precision may be lost`
      )
    }

    // Warn if value exceeds expected budget range (likely a bug)
    if (num > MAX_EXPECTED_BUDGET_IDR) {
      console.error(
        `❌ BigInt ${this} exceeds expected budget range (${MAX_EXPECTED_BUDGET_IDR} IDR), this may be a bug`
      )
    }

    return num
  }

  console.log('✓ BigInt JSON serialization polyfill initialized')
}

/**
 * Check if a BigInt value is safe to convert to Number
 * @param value - BigInt value to check
 * @returns true if safe, false if precision may be lost
 */
export function isSafeBigInt(value: bigint): boolean {
  return value <= BigInt(MAX_SAFE_INTEGER) && value >= BigInt(-MAX_SAFE_INTEGER)
}

/**
 * Safely convert BigInt to Number with validation
 * @param value - BigInt value to convert
 * @returns Number value
 * @throws Error if value exceeds safe range
 */
export function bigIntToNumber(value: bigint): number {
  if (!isSafeBigInt(value)) {
    throw new Error(
      `BigInt ${value} exceeds safe range (±${MAX_SAFE_INTEGER}), cannot convert to Number without precision loss`
    )
  }
  return Number(value)
}

/**
 * Format BigInt as Indonesian Rupiah currency string
 * @param value - BigInt value in IDR
 * @returns Formatted currency string (e.g., "Rp 1.000.000")
 */
export function formatBigIntIDR(value: bigint): string {
  const num = Number(value)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}
