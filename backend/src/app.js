import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

// Import security middleware setup
import securityMiddleware from './middlewares/security.js';
import errorHandler from './middlewares/errorHandler.js';

// Import route files
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import threadRoutes from './routes/thread.routes.js';
import commentRoutes from './routes/comment.routes.js';
import voteRoutes from './routes/vote.routes.js';
import uploadRoutes from './routes/upload.routes.js';

const app = express();

// Security middlewares (helmet, CORS, rate limiting)
const authLimiter = securityMiddleware(app);

// Body parsing and cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/threads', threadRoutes);
app.use('/api/v1/threads/:id/comments', commentRoutes);
app.use('/api/v1/votes', voteRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'DebugDen API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
