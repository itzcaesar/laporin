// ── Shared Constants ─────────────────────────────────────────────────────────
// Shared constants for the Laporin monorepo

/**
 * Report Status Constants
 */
export const REPORT_STATUS = {
  NEW: 'new',
  VERIFIED: 'verified',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  VERIFIED_COMPLETE: 'verified_complete',
  REJECTED: 'rejected',
  DISPUTED: 'disputed',
  CLOSED: 'closed',
} as const

export const REPORT_STATUS_LABELS: Record<string, string> = {
  new: 'Baru',
  verified: 'Terverifikasi',
  in_progress: 'Dalam Proses',
  completed: 'Selesai',
  verified_complete: 'Selesai & Terverifikasi',
  rejected: 'Ditolak',
  disputed: 'Disanggah',
  closed: 'Ditutup',
}

/**
 * Priority Constants
 */
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  urgent: 'Mendesak',
}

export const PRIORITY_SLA_DAYS: Record<string, number> = {
  low: 30,      // P4
  medium: 14,   // P3
  high: 7,      // P2
  urgent: 2,    // P1
}

/**
 * Role Constants
 */
export const ROLE = {
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const

export const ROLE_LABELS: Record<string, string> = {
  citizen: 'Warga',
  officer: 'Petugas',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

/**
 * Media Type Constants
 */
export const MEDIA_TYPE = {
  PHOTO: 'photo',
  VIDEO: 'video',
  PROGRESS_PHOTO: 'progress_photo',
  COMPLETION_PHOTO: 'completion_photo',
} as const

/**
 * File Size Limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  PHOTO: 10 * 1024 * 1024,           // 10 MB
  VIDEO: 50 * 1024 * 1024,           // 50 MB
  PROGRESS_PHOTO: 10 * 1024 * 1024,  // 10 MB
  COMPLETION_PHOTO: 10 * 1024 * 1024, // 10 MB
} as const

/**
 * Allowed MIME Types
 */
export const ALLOWED_MIME_TYPES = {
  PHOTO: ['image/jpeg', 'image/png', 'image/webp'],
  VIDEO: ['video/mp4', 'video/quicktime'],
  PROGRESS_PHOTO: ['image/jpeg', 'image/png', 'image/webp'],
  COMPLETION_PHOTO: ['image/jpeg', 'image/png', 'image/webp'],
} as const

/**
 * Notification Channel Constants
 */
export const NOTIFICATION_CHANNEL = {
  PUSH: 'push',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
} as const

/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

/**
 * Rate Limit Constants
 */
export const RATE_LIMITS = {
  AUTH_LOGIN: { max: 5, windowSeconds: 900 },        // 5 per 15 min
  AUTH_REGISTER: { max: 3, windowSeconds: 3600 },    // 3 per hour
  AUTH_OTP: { max: 3, windowSeconds: 600 },          // 3 per 10 min
  AI_CLASSIFY: { max: 10, windowSeconds: 3600 },     // 10 per hour
  AI_VERIFY: { max: 10, windowSeconds: 3600 },       // 10 per hour
  AI_CHATBOT: { max: 30, windowSeconds: 3600 },      // 30 per hour
  AI_DUPLICATE: { max: 20, windowSeconds: 3600 },    // 20 per hour
  REPORT_CREATE: { max: 10, windowSeconds: 3600 },   // 10 per hour
  REPORT_UPDATE: { max: 20, windowSeconds: 3600 },   // 20 per hour
} as const

/**
 * Cache TTL Constants (in seconds)
 */
export const CACHE_TTL = {
  CATEGORIES: 24 * 60 * 60,           // 24 hours
  STATISTICS: 5 * 60,                 // 5 minutes
  MAP_PINS: 2 * 60,                   // 2 minutes
  DASHBOARD: 5 * 60,                  // 5 minutes
  GEOCODING: 30 * 24 * 60 * 60,       // 30 days
  AI_INSIGHTS: 25 * 60 * 60,          // 25 hours
  WORKLOAD_FORECAST: 23 * 60 * 60,    // 23 hours
} as const

/**
 * Gamification Constants
 */
export const GAMIFICATION = {
  POINTS: {
    REPORT_CREATED: 10,
    REPORT_VERIFIED: 20,
    REPORT_COMPLETED: 50,
    COMMENT_ADDED: 5,
    UPVOTE_RECEIVED: 2,
    SURVEY_COMPLETED: 15,
  },
  LEVELS: {
    BRONZE: { min: 0, max: 99 },
    SILVER: { min: 100, max: 499 },
    GOLD: { min: 500, max: 1499 },
    PLATINUM: { min: 1500, max: Infinity },
  },
} as const

/**
 * Danger Level Constants
 */
export const DANGER_LEVEL = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 1,
} as const

export const DANGER_LEVEL_LABELS: Record<number, string> = {
  1: 'Sangat Rendah',
  2: 'Rendah',
  3: 'Sedang',
  4: 'Tinggi',
  5: 'Sangat Tinggi',
}

/**
 * Indonesia Geographic Bounds
 */
export const INDONESIA_BOUNDS = {
  LAT_MIN: -11,
  LAT_MAX: 6,
  LNG_MIN: 95,
  LNG_MAX: 141,
} as const

/**
 * API Response Codes
 */
export const API_ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const
