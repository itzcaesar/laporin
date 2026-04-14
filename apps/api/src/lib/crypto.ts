// ── apps/api/src/lib/crypto.ts ──
// AES-256 encryption for sensitive data (NIK)

import crypto from 'crypto'
import { env } from '../env.js'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 64

/**
 * Derives an encryption key from the JWT secret using PBKDF2.
 * This ensures we don't need a separate encryption key in .env.
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(env.JWT_SECRET, salt, 100000, 32, 'sha256')
}

/**
 * Encrypts sensitive data (like NIK) using AES-256-GCM.
 * 
 * @param plaintext - Data to encrypt
 * @returns Encrypted string in format: salt:iv:authTag:ciphertext (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  // Derive encryption key from salt
  const key = deriveKey(salt)
  
  // Create cipher and encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
  ciphertext += cipher.final('hex')
  
  // Get authentication tag
  const authTag = cipher.getAuthTag()
  
  // Combine all parts: salt:iv:authTag:ciphertext
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    authTag.toString('hex'),
    ciphertext,
  ].join(':')
}

/**
 * Decrypts data encrypted with the encrypt() function.
 * 
 * @param encrypted - Encrypted string in format: salt:iv:authTag:ciphertext
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decrypt(encrypted: string): string {
  // Split the encrypted string
  const parts = encrypted.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format')
  }
  
  const [saltHex, ivHex, authTagHex, ciphertext] = parts
  
  // Convert from hex
  const salt = Buffer.from(saltHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  // Derive the same key
  const key = deriveKey(salt)
  
  // Create decipher and decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let plaintext = decipher.update(ciphertext, 'hex', 'utf8')
  plaintext += decipher.final('utf8')
  
  return plaintext
}

/**
 * Generates a cryptographically secure random token.
 * Used for password reset tokens, email verification tokens, etc.
 * 
 * @param length - Number of random bytes (default: 32)
 * @returns Hex-encoded random string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generates a 6-digit OTP code.
 * 
 * @returns 6-digit string (e.g., "042891")
 */
export function generateOtp(): string {
  const otp = crypto.randomInt(0, 1000000)
  return otp.toString().padStart(6, '0')
}
