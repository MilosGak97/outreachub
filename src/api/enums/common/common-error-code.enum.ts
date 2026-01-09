/**
 * Common error codes for app-wide use
 *
 * The enum values ARE the customer-facing messages.
 * Use the enum key for logging/debugging, and the value for user display.
 *
 * @example
 * throw new NotFoundException(CommonErrorCode.NOT_FOUND);
 * // Response: { message: "Resource not found" }
 */
export enum CommonErrorCode {
  // ═══════════════════════════════════════════════════════════════
  // AUTHENTICATION & AUTHORIZATION
  // ═══════════════════════════════════════════════════════════════

  UNAUTHORIZED = 'Authentication required',
  INVALID_TOKEN = 'Invalid or expired token',
  TOKEN_EXPIRED = 'Your session has expired. Please sign in again.',
  FORBIDDEN = 'You do not have permission to perform this action',
  INSUFFICIENT_PERMISSIONS = 'You do not have the required permissions for this action',

  // ═══════════════════════════════════════════════════════════════
  // RESOURCE ERRORS
  // ═══════════════════════════════════════════════════════════════

  NOT_FOUND = 'Resource not found',
  ALREADY_EXISTS = 'Resource already exists',
  CONFLICT = 'Operation conflicts with current state',
  GONE = 'Resource no longer available',

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION ERRORS
  // ═══════════════════════════════════════════════════════════════

  VALIDATION_ERROR = 'Validation failed',
  INVALID_INPUT = 'Invalid input provided',
  MISSING_REQUIRED_FIELD = 'Required field is missing',
  INVALID_FORMAT = 'Invalid format',
  INVALID_UUID = 'Invalid ID format',

  // ═══════════════════════════════════════════════════════════════
  // SERVER ERRORS
  // ═══════════════════════════════════════════════════════════════

  INTERNAL_ERROR = 'An unexpected error occurred',
  SERVICE_UNAVAILABLE = 'Service temporarily unavailable',
  DATABASE_ERROR = 'A database error occurred',
  TIMEOUT = 'Request timed out',

  // ═══════════════════════════════════════════════════════════════
  // RATE LIMITING
  // ═══════════════════════════════════════════════════════════════

  RATE_LIMITED = 'Too many requests. Please try again later.',
  QUOTA_EXCEEDED = 'You have exceeded your quota',
}

/**
 * HTTP status codes for common errors
 */
export const CommonErrorStatus = {
  // Auth
  UNAUTHORIZED: 401,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 401,
  FORBIDDEN: 403,
  INSUFFICIENT_PERMISSIONS: 403,

  // Resource
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  CONFLICT: 409,
  GONE: 410,

  // Validation
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_REQUIRED_FIELD: 400,
  INVALID_FORMAT: 400,
  INVALID_UUID: 400,

  // Server
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  DATABASE_ERROR: 500,
  TIMEOUT: 504,

  // Rate limiting
  RATE_LIMITED: 429,
  QUOTA_EXCEEDED: 429,
} as const;
