/**
 * Auth Constants
 */

// Token expiration times (in seconds for JWT, milliseconds for cookies)
export const AUTH_TOKEN_EXPIRY = {
  ACCESS_TOKEN: '1h',
  ACCESS_TOKEN_MS: 60 * 60 * 1000, // 1 hour
  REFRESH_TOKEN: '30d',
  REFRESH_TOKEN_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Cookie names
export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
};

// Cookie configuration
const rawSameSite = (process.env.AUTH_COOKIE_SAMESITE ?? '').toLowerCase();
const resolvedSameSite =
  rawSameSite === 'none' || rawSameSite === 'strict' || rawSameSite === 'lax'
    ? (rawSameSite as 'none' | 'strict' | 'lax')
    : process.env.NODE_ENV === 'production'
      ? 'none'
      : 'lax';

const resolvedSecure =
  process.env.AUTH_COOKIE_SECURE === 'true' ||
  resolvedSameSite === 'none' ||
  process.env.NODE_ENV === 'production';

export const AUTH_COOKIE_CONFIG = {
  httpOnly: true,
  secure: resolvedSecure,
  sameSite: resolvedSameSite,
  path: '/',
  ...(process.env.AUTH_COOKIE_DOMAIN
    ? { domain: process.env.AUTH_COOKIE_DOMAIN }
    : {}),
};

// Rate limiting configuration
export const AUTH_RATE_LIMITS = {
  REGISTER: { ttl: 60 * 1000, limit: 5 }, // 5 per minute
  LOGIN: { ttl: 60 * 1000, limit: 10 }, // 10 per minute
  FORGOT_PASSWORD: { ttl: 60 * 1000, limit: 3 }, // 3 per minute
  VERIFY_EMAIL: { ttl: 60 * 1000, limit: 10 }, // 10 per minute
  RESEND_VERIFICATION: { ttl: 60 * 1000, limit: 3 }, // 3 per minute
};

// Passcode configuration
export const AUTH_PASSCODE = {
  LENGTH: 6,
  EXPIRY_MINUTES: 30,
};

export const EMAIL_VERIFICATION = {
  CODE_LENGTH: 6,
  CODE_EXPIRY_MINUTES: 15,
  TOKEN_EXPIRY_MINUTES: 15,
  RESEND_COOLDOWN_SECONDS: 60,
  MAX_ATTEMPTS: 5,
};

export const RESET_PASSWORD_SESSION = {
  CODE_LENGTH: AUTH_PASSCODE.LENGTH,
  TOKEN_EXPIRY_MINUTES: AUTH_PASSCODE.EXPIRY_MINUTES,
  RESEND_COOLDOWN_SECONDS: 60,
  MAX_ATTEMPTS: 5,
};

export const AUTH_SESSION_TOKEN_PREFIX = {
  VERIFICATION: 'vt_',
  RESET_PASSWORD: 'rpt_',
};

// JWT configuration
export const AUTH_JWT_CONFIG = {
  SECRET_ENV_KEY: 'CLIENT_JWT_SECRET_V2',
  ALGORITHM: 'HS256' as const,
};
