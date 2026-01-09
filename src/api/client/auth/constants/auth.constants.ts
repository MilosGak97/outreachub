/**
 * Authentication constants for token expiration and cookie configuration
 */

// JWT Token Expiration Times
export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: '1h',
  REFRESH_TOKEN: '30d',
  EMAIL_VERIFICATION: '5d',
  FORGOT_PASSWORD: '7d',
  PASSCODE: '15m',
} as const;

// Convert expiration strings to milliseconds for cookie maxAge
export const TOKEN_EXPIRATION_MS = {
  ACCESS_TOKEN: 60 * 60 * 1000, // 1 hour
  REFRESH_TOKEN: 30 * 24 * 60 * 60 * 1000, // 30 days
  EMAIL_VERIFICATION: 5 * 24 * 60 * 60 * 1000, // 5 days
  FORGOT_PASSWORD: 7 * 24 * 60 * 60 * 1000, // 7 days
  PASSCODE: 15 * 60 * 1000, // 15 minutes
} as const;

// Convert expiration strings to seconds for database storage
export const TOKEN_EXPIRATION_SECONDS = {
  ACCESS_TOKEN: 60 * 60, // 1 hour
  REFRESH_TOKEN: 30 * 24 * 60 * 60, // 30 days
  EMAIL_VERIFICATION: 5 * 24 * 60 * 60, // 5 days
  FORGOT_PASSWORD: 7 * 24 * 60 * 60, // 7 days
  PASSCODE: 15 * 60, // 15 minutes
} as const;

// Cookie Configuration
export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: true, // Always use secure cookies
  sameSite: 'none' as const,
} as const;

// Cookie Names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;
