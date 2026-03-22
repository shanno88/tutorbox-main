/**
 * Admin Billing Helpers
 *
 * Utilities for admin billing operations, including key masking and data formatting.
 */

/**
 * Mask an API key hash for display
 *
 * Takes a key hash and returns a masked version showing only first 4 and last 4 characters.
 * Format: tutorbox_abcd...1234
 *
 * @param keyHash - The key hash from database
 * @returns Masked key string
 */
export function maskApiKey(keyHash: string): string {
  if (keyHash.length <= 8) {
    return "tutorbox_****";
  }
  const first4 = keyHash.substring(0, 4);
  const last4 = keyHash.substring(keyHash.length - 4);
  return `tutorbox_${first4}...${last4}`;
}

/**
 * Check if a string looks like an email
 *
 * @param value - String to check
 * @returns true if looks like email
 */
export function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

/**
 * Format a date to ISO string or null
 *
 * @param date - Date or null
 * @returns ISO string or undefined
 */
export function formatDate(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return new Date(date).toISOString();
}
