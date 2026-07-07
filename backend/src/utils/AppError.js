// Custom error class for operational errors (not programming bugs)
// Includes a statusCode and isOperational flag for the error handler
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // 4xx = client error, 5xx = server error
    this.isOperational = true;
    // Capture stack trace excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
