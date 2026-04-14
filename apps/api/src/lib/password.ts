// ── apps/api/src/lib/password.ts ──
// Password hashing and comparison using bcryptjs

import bcrypt from 'bcryptjs'

/**
 * Number of salt rounds for bcrypt hashing.
 * Higher = more secure but slower.
 */
const SALT_ROUNDS = 12

/**
 * Hashes a plain text password using bcrypt.
 * 
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  return hash
}

/**
 * Compares a plain text password with a hashed password.
 * 
 * @param password - Plain text password to check
 * @param hash - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const isMatch = await bcrypt.compare(password, hash)
  return isMatch
}
