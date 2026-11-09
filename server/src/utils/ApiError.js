/**
 * Custom operational API Error class
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} code
   * @param {string} message
   * @param {Array|Object|null} details
   */
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details = null) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static invalidId(message = 'Invalid resource ID') {
    return new ApiError(400, 'INVALID_ID', message);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static invalidCredentials(message = 'Invalid email or password') {
    return new ApiError(401, 'INVALID_CREDENTIALS', message);
  }

  static refreshInvalid(message = 'Invalid or expired refresh token') {
    return new ApiError(401, 'REFRESH_INVALID', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static duplicate(message = 'Resource already exists') {
    return new ApiError(409, 'DUPLICATE', message);
  }

  static categoryInUse(details) {
    return new ApiError(409, 'CATEGORY_IN_USE', 'Category is in use and cannot be deleted without reassignment', details);
  }

  static businessRule(message) {
    return new ApiError(422, 'BUSINESS_RULE', message);
  }

  static rateLimited(message = 'Too many requests, please try again later') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
