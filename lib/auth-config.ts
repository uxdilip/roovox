/**
 * Authentication Configuration
 * Feature flags to control authentication methods
 */

export const PHONE_AUTH_ENABLED = 
  process.env.NEXT_PUBLIC_PHONE_AUTH_ENABLED === 'true';

export const EMAIL_AUTH_ENABLED = 
  process.env.NEXT_PUBLIC_EMAIL_AUTH_ENABLED === 'true';

export const GOOGLE_AUTH_ENABLED = 
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== 'false'; // Default to true

/**
 * Get authentication status message
 */
export function getAuthStatusMessage(): string | null {
  if (!PHONE_AUTH_ENABLED) {
    return 'Phone authentication is temporarily unavailable. Please sign in with Google.';
  }
  return null;
}

/**
 * Check if any authentication method is available
 */
export function hasAvailableAuthMethod(): boolean {
  return PHONE_AUTH_ENABLED || EMAIL_AUTH_ENABLED || GOOGLE_AUTH_ENABLED;
}

/**
 * Get primary authentication method
 */
export function getPrimaryAuthMethod(): 'phone' | 'email' | 'google' | null {
  if (PHONE_AUTH_ENABLED) return 'phone';
  if (EMAIL_AUTH_ENABLED) return 'email';
  if (GOOGLE_AUTH_ENABLED) return 'google';
  return null;
}
