// ── apps/api/src/lib/jwt.ts ──
// JWT token signing and verification using jose library

import { SignJWT, jwtVerify } from 'jose'
import { env } from '../env.js'

/**
 * JWT payload structure for access tokens
 */
export interface JwtPayload {
  sub: string        // User ID
  role: string       // User role
  nip?: string       // Government employee ID (if applicable)
  agencyId?: string  // Agency ID (if applicable)
  [key: string]: any // Index signature for jose compatibility
}

/**
 * JWT payload structure for refresh tokens
 */
export interface RefreshTokenPayload {
  sub: string        // User ID
  tokenId: string    // Refresh token ID in database
  [key: string]: any // Index signature for jose compatibility
}

/**
 * Signs an access token with user information.
 * 
 * @param payload - User information to encode in the token
 * @returns Signed JWT string
 */
export async function signToken(payload: JwtPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET)

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret)

  return token
}

/**
 * Signs a refresh token.
 * 
 * @param payload - Refresh token payload
 * @returns Signed JWT string
 */
export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET)

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(secret)

  return token
}

/**
 * Verifies and decodes an access token.
 * 
 * @param token - JWT string to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const secret = new TextEncoder().encode(env.JWT_SECRET)

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JwtPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Verifies and decodes a refresh token.
 * 
 * @param token - Refresh token JWT string
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET)

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as RefreshTokenPayload
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}
