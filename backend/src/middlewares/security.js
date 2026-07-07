import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

const securityMiddleware = (app) => {
  app.use(helmet());

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );

  // Prevent NoSQL injection
  app.use(mongoSanitize());

  // Global rate limiter — generous in dev, strict in prod
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  // Stricter rate limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 10 : 50,
    message: { success: false, message: 'Too many auth attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  return authLimiter;
};

export default securityMiddleware;
