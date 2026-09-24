// =====================================================================
// URL validation utilities for WhatsApp Channel links
// =====================================================================

/** Accepted WhatsApp channel URL patterns */
const WA_CHANNEL_PATTERNS = [
  /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/,
];

/**
 * Validates that a string is a WhatsApp Channel URL.
 * Returns the extracted invite code or null.
 */
export function extractChannelCode(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  for (const pattern of WA_CHANNEL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validates that the invite code has the right shape.
 * WhatsApp channel invite codes start with "0029" and are 24 chars long
 * but we accept any alphanumeric code of reasonable length.
 */
export function isValidChannelCode(code: string): boolean {
  return /^[A-Za-z0-9_-]{10,64}$/.test(code);
}

/**
 * Full validation pipeline:
 * 1. Check URL is provided
 * 2. Extract channel code
 * 3. Validate code format
 */
export function validateChannelUrl(url: unknown): {
  valid: boolean;
  code: string | null;
  error: string | null;
} {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { valid: false, code: null, error: 'Please provide a WhatsApp Channel URL.' };
  }

  const code = extractChannelCode(url.trim());

  if (!code) {
    return {
      valid: false,
      code: null,
      error:
        'Invalid URL. Please use a WhatsApp Channel link like: https://whatsapp.com/channel/0029...',
    };
  }

  if (!isValidChannelCode(code)) {
    return {
      valid: false,
      code: null,
      error: 'The channel code in the URL appears to be invalid.',
    };
  }

  return { valid: true, code, error: null };
}
