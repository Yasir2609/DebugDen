import { validationResult } from 'express-validator';

// Middleware that runs express-validator checks and returns errors if any
// Usage: attach validation chain before this middleware in routes
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Extract field-specific errors for the frontend
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  next();
};

export default validate;
