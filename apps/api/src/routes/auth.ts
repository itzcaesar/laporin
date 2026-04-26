// ── apps/api/src/routes/auth.ts ──
// Authentication endpoints

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db.js'
import { hashPassword, comparePassword } from '../lib/password.js'
import { signToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js'
import { encrypt } from '../lib/crypto.js'
import { generateOtp } from '../lib/crypto.js'
import { authMiddleware, type AuthVariables } from '../middleware/auth.js'
import { ok, err } from '../lib/response.js'
import { sendOtpEmail } from '../services/notification.service.js'
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  sendOtpSchema,
  verifyOtpSchema,
  changePasswordSchema,
} from '../validators/auth.validator.js'
import { Redis } from 'ioredis'
import { env } from '../env.js'

const auth = new Hono<{ Variables: AuthVariables }>()

// Redis client for OTP storage (optional in development)
let redis: Redis | null = null
try {
  redis = new Redis(env.REDIS_URL)
  redis.on('error', (err: Error) => {
    console.warn('Redis connection error:', err.message)
    redis = null
  })
} catch (error) {
  console.warn('Redis not available, OTP features will be disabled')
}

/**
 * POST /auth/register
 * Register a new citizen account
 */
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name, nik, phone } = c.req.valid('json')

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return err(c, 'EMAIL_EXISTS', 'Email sudah terdaftar', 409)
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Encrypt NIK if provided
    const nikEncrypted = nik ? encrypt(nik) : null

    // Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        nikEncrypted,
        phone,
        role: 'citizen',
        isVerified: false, // Require email verification
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    })

    // Generate tokens
    const accessToken = await signToken({
      sub: user.id,
      role: user.role,
    })

    const refreshTokenId = crypto.randomUUID()
    const refreshToken = await signRefreshToken({
      sub: user.id,
      tokenId: refreshTokenId,
    })

    // Store refresh token in database
    await db.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    return ok(c, {
      user,
      accessToken,
      refreshToken,
    }, 201)
  } catch (error) {
    console.error('Registration error:', error)
    return err(c, 'INTERNAL_ERROR', 'Registrasi gagal', 500)
  }
})

/**
 * POST /auth/login
 * Login with email and password
 */
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        nip: true,
        agencyId: true,
        passwordHash: true,
        isActive: true,
        isVerified: true,
      },
    })

    if (!user) {
      return err(c, 'INVALID_CREDENTIALS', 'Email atau password salah', 401)
    }

    // Check if account is active
    if (!user.isActive) {
      return err(c, 'ACCOUNT_INACTIVE', 'Akun ini telah dinonaktifkan', 403)
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash)

    if (!isPasswordValid) {
      return err(c, 'INVALID_CREDENTIALS', 'Email atau password salah', 401)
    }

    // Generate tokens
    const accessToken = await signToken({
      sub: user.id,
      role: user.role,
      nip: user.nip || undefined,
      agencyId: user.agencyId || undefined,
    })

    const refreshTokenId = crypto.randomUUID()
    const refreshToken = await signRefreshToken({
      sub: user.id,
      tokenId: refreshTokenId,
    })

    // Store refresh token in database
    await db.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return ok(c, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    return err(c, 'INTERNAL_ERROR', 'Terjadi kesalahan server', 500)
  }
})

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
auth.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json')

  try {
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken)

    // Check if refresh token exists in database and is not revoked
    const storedToken = await db.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            nip: true,
            agencyId: true,
            isActive: true,
          },
        },
      },
    })

    if (!storedToken || storedToken.isRevoked) {
      return err(c, 'INVALID_TOKEN', 'Token tidak valid atau telah dicabut', 401)
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      return err(c, 'TOKEN_EXPIRED', 'Token telah kadaluarsa', 401)
    }

    // Check if user is still active
    if (!storedToken.user.isActive) {
      return err(c, 'ACCOUNT_INACTIVE', 'Akun telah dinonaktifkan', 403)
    }

    // Generate new access token
    const accessToken = await signToken({
      sub: storedToken.user.id,
      role: storedToken.user.role,
      nip: storedToken.user.nip || undefined,
      agencyId: storedToken.user.agencyId || undefined,
    })

    return ok(c, {
      accessToken,
      role: storedToken.user.role,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return err(c, 'INVALID_TOKEN', 'Token tidak valid', 401)
  }
})

/**
 * POST /auth/logout
 * Logout and invalidate refresh token
 */
auth.post('/logout', zValidator('json', logoutSchema), async (c) => {
  const { refreshToken } = c.req.valid('json')

  try {
    // Verify and decode refresh token
    const payload = await verifyRefreshToken(refreshToken)

    // Revoke the refresh token
    await db.refreshToken.update({
      where: { id: payload.tokenId },
      data: { isRevoked: true },
    })

    return ok(c, { message: 'Berhasil logout' })
  } catch (error) {
    // Even if token is invalid, return success (idempotent logout)
    return ok(c, { message: 'Berhasil logout' })
  }
})

/**
 * POST /auth/otp/send
 * Send OTP to email for verification
 */
auth.post('/otp/send', zValidator('json', sendOtpSchema), async (c) => {
  const { email } = c.req.valid('json')

  if (!redis) {
    return c.json({ error: 'OTP service temporarily unavailable' }, 503)
  }

  try {
    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, isVerified: true },
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    if (user.isVerified) {
      return c.json({ error: 'Email already verified' }, 400)
    }

    // Generate 6-digit OTP
    const otp = generateOtp()

    // Store OTP in Redis with 10 minute expiry
    const otpKey = `otp:${email}`
    await redis.setex(otpKey, 600, otp) // 600 seconds = 10 minutes

    // Send OTP via email
    const emailResult = await sendOtpEmail(email, user.name, otp)
    if (!emailResult.success) {
      console.warn(`Failed to send OTP email to ${email}:`, emailResult.error)
    }

    // Also log in development for debugging
    if (env.NODE_ENV === 'development') {
      console.log(`📧 OTP for ${email}: ${otp}`)
    }

    return c.json({
      data: {
        message: 'OTP sent to email',
        expiresIn: 600, // seconds
        // In development, include OTP in response
        ...(env.NODE_ENV === 'development' && { otp }),
      },
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return c.json({ error: 'Failed to send OTP' }, 500)
  }
})

/**
 * POST /auth/otp/verify
 * Verify OTP code and mark email as verified
 */
auth.post('/otp/verify', zValidator('json', verifyOtpSchema), async (c) => {
  const { email, otp } = c.req.valid('json')

  if (!redis) {
    return c.json({ error: 'OTP service temporarily unavailable' }, 503)
  }

  try {
    // Get OTP from Redis
    const otpKey = `otp:${email}`
    const storedOtp = await redis.get(otpKey)

    if (!storedOtp) {
      return c.json({ error: 'OTP expired or not found' }, 400)
    }

    if (storedOtp !== otp) {
      return c.json({ error: 'Invalid OTP' }, 400)
    }

    // Mark user as verified
    const user = await db.user.update({
      where: { email },
      data: { isVerified: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
      },
    })

    // Delete OTP from Redis
    await redis.del(otpKey)

    // Generate new tokens
    const accessToken = await signToken({
      sub: user.id,
      role: user.role,
    })

    const refreshTokenId = crypto.randomUUID()
    const refreshToken = await signRefreshToken({
      sub: user.id,
      tokenId: refreshTokenId,
    })

    // Store refresh token
    await db.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return c.json({
      data: {
        user,
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return c.json({ error: 'OTP verification failed' }, 500)
  }
})

/**
 * GET /auth/me
 * Get current user profile (authenticated)
 */
auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')

  try {
    const profile = await db.user.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        nip: true,
        phone: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        agencyId: true,
        agency: {
          select: {
            id: true,
            name: true,
            shortName: true,
            regionCode: true,
          },
        },
      },
    })

    if (!profile) {
      return err(c, 'NOT_FOUND', 'Pengguna tidak ditemukan', 404)
    }

    return ok(c, {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      nip: profile.nip,
      agencyId: profile.agencyId,
      agencyName: profile.agency?.name ?? null,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return err(c, 'INTERNAL_ERROR', 'Gagal memuat profil', 500)
  }
})

/**
 * PATCH /auth/password/change
 * Change password (authenticated)
 */
auth.patch('/password/change', authMiddleware, zValidator('json', changePasswordSchema), async (c) => {
  const user = c.get('user')
  const { currentPassword, newPassword } = c.req.valid('json')

  try {
    // Get user with password hash
    const dbUser = await db.user.findUnique({
      where: { id: user.sub },
      select: { passwordHash: true },
    })

    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, dbUser.passwordHash)

    if (!isPasswordValid) {
      return c.json({ error: 'Current password is incorrect' }, 400)
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    await db.user.update({
      where: { id: user.sub },
      data: { passwordHash: newPasswordHash },
    })

    // Revoke all existing refresh tokens for security
    await db.refreshToken.updateMany({
      where: { userId: user.sub, isRevoked: false },
      data: { isRevoked: true },
    })

    return c.json({
      data: { message: 'Password changed successfully. Please login again.' },
    })
  } catch (error) {
    console.error('Change password error:', error)
    return c.json({ error: 'Failed to change password' }, 500)
  }
})

export default auth
