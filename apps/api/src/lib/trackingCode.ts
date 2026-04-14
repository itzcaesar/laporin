// ── apps/api/src/lib/trackingCode.ts ──
// Generates unique human-readable tracking codes for reports

/**
 * Generates a unique human-readable tracking code.
 * 
 * Format: LP-{YEAR}-{REGION_CODE}-{SEQUENCE}
 * Example: LP-2026-BDG-00142
 * 
 * @param regionCode - 3-letter region code (e.g., "BDG" for Bandung)
 * @param sequence - Sequential number for this region
 * @returns Formatted tracking code
 */
export function generateTrackingCode(regionCode: string, sequence: number): string {
  const year = new Date().getFullYear()
  const seq = String(sequence).padStart(5, '0')
  const code = `LP-${year}-${regionCode.toUpperCase()}-${seq}`
  
  return code
}

/**
 * Parses a tracking code into its components.
 * 
 * @param trackingCode - Tracking code to parse (e.g., "LP-2026-BDG-00142")
 * @returns Parsed components or null if invalid format
 */
export function parseTrackingCode(trackingCode: string): {
  year: number
  regionCode: string
  sequence: number
} | null {
  const pattern = /^LP-(\d{4})-([A-Z]{2,10})-(\d{5})$/
  const match = trackingCode.match(pattern)

  if (!match) {
    return null
  }

  return {
    year: parseInt(match[1], 10),
    regionCode: match[2],
    sequence: parseInt(match[3], 10),
  }
}

/**
 * Validates a tracking code format.
 * 
 * @param trackingCode - Tracking code to validate
 * @returns True if valid format, false otherwise
 */
export function isValidTrackingCode(trackingCode: string): boolean {
  return parseTrackingCode(trackingCode) !== null
}
