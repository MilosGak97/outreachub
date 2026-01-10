/**
 * Auth2 Constants
 * Separate from auth to allow both systems to coexist
 */

// Token expiration times (in seconds for JWT, milliseconds for cookies)
export const AUTH2_TOKEN_EXPIRY = {
  ACCESS_TOKEN: '1h',
  ACCESS_TOKEN_MS: 60 * 60 * 1000, // 1 hour
  REFRESH_TOKEN: '30d',
  REFRESH_TOKEN_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
  EMAIL_VERIFICATION: '24h',
  EMAIL_VERIFICATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: '1h',
  PASSWORD_RESET_MS: 60 * 60 * 1000, // 1 hour
  INVITE: '7d',
  INVITE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Cookie names (different from auth to avoid conflicts)
export const AUTH2_COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken2',
  REFRESH_TOKEN: 'refreshToken2',
};

// Cookie configuration
export const AUTH2_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// Rate limiting configuration
export const AUTH2_RATE_LIMITS = {
  REGISTER: { ttl: 60 * 1000, limit: 5 }, // 5 per minute
  LOGIN: { ttl: 60 * 1000, limit: 10 }, // 10 per minute
  FORGOT_PASSWORD: { ttl: 60 * 1000, limit: 3 }, // 3 per minute
  VERIFY_EMAIL: { ttl: 60 * 1000, limit: 10 }, // 10 per minute
  RESEND_VERIFICATION: { ttl: 60 * 1000, limit: 3 }, // 3 per minute
};

// Passcode configuration
export const AUTH2_PASSCODE = {
  LENGTH: 6,
  EXPIRY_MINUTES: 30,
};

// JWT configuration
export const AUTH2_JWT_CONFIG = {
  SECRET_ENV_KEY: 'CLIENT_JWT_SECRET_V2',
  ALGORITHM: 'HS256' as const,
};