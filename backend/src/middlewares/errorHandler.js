import AppError from '../utils/AppError.js';

// Global error handler — catches all thrown errors and sends consistent response
const errorHandler = (err, req, res, next) => {
  // Default values for unexpected errors
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = [];

  // Handle specific Mongoose errors
  // Duplicate key error (e.g., duplicate username/email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for ${field}. Please use another ${field}.`;
    statusCode = 400;
  }

  // Mongoose validation error — extract individual field errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  }

  // Invalid ObjectId format
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  // JWT token errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token. Please log in again.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired. Please log in again.';
    statusCode = 401;
  }

  // Log error for debugging
  console.error('ERROR:', err);

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    // Show stack trace in development only
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
