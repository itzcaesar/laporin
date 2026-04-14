// ── apps/api/src/validators/auth.validator.ts ──
// Zod validation schemas for authentication endpoints

import { z } from 'zod'

/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()

/**
 * NIK (Nomor Induk Kependudukan) validation
 * Indonesian national ID: 16 digits
 */
const nikSchema = z
  .string()
  .length(16, 'NIK must be exactly 16 digits')
  .regex(/^\d{16}$/, 'NIK must contain only numbers')
  .optional()

/**
 * NIP (Nomor Induk Pegawai) validation
 * Government employee ID: 18 digits
 */
const nipSchema = z
  .string()
  .length(18, 'NIP must be exactly 18 digits')
  .regex(/^\d{18}$/, 'NIP must contain only numbers')
  .optional()

/**
 * POST /auth/register
 * Register a new citizen account
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  nik: nikSchema,
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian phone number').optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * POST /auth/register/officer
 * Register a new government officer account (admin only)
 */
export const registerOfficerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2).max(100),
  nip: z.string().length(18, 'NIP must be exactly 18 digits').regex(/^\d{18}$/),
  agencyId: z.string().uuid('Invalid agency ID'),
  role: z.enum(['officer', 'admin']).default('officer'),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/).optional(),
})

export type RegisterOfficerInput = z.infer<typeof registerOfficerSchema>

/**
 * POST /auth/login
 * Login with email and password
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export type RefreshInput = z.infer<typeof refreshSchema>

/**
 * POST /auth/logout
 * Logout and invalidate refresh token
 */
export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export type LogoutInput = z.infer<typeof logoutSchema>

/**
 * POST /auth/otp/send
 * Send OTP to email for verification
 */
export const sendOtpSchema = z.object({
  email: emailSchema,
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>

/**
 * POST /auth/otp/verify
 * Verify OTP code
 */
export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
})

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

/**
 * POST /auth/password/forgot
 * Request password reset
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * POST /auth/password/reset
 * Reset password with token
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * PATCH /auth/password/change
 * Change password (authenticated)
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
