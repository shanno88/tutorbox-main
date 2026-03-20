/**
 * API Key Generation and Management
 *
 * Utilities for generating, hashing, and storing API keys.
 */

import crypto from "crypto";

/**
 * Generate a random API key
 *
 * Format: tutorbox_[random_32_chars]
 * Example: tutorbox_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *
 * @returns Generated API key (unhashed, for sending to user)
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  return `tutorbox_${randomBytes}`;
}

/**
 * Hash an API key for storage
 *
 * Uses SHA-256 to hash the key before storing in database.
 * This way, even if database is compromised, keys are not exposed.
 *
 * @param apiKey - Unhashed API key
 * @returns Hashed API key (for storage)
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Verify an API key against its hash
 *
 * @param apiKey - Unhashed API key (from request)
 * @param hash - Hashed API key (from database)
 * @returns true if key matches hash
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey);
  return computedHash === hash;
}
