import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { corsMiddleware } from './config/cors.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import rootRouter from './routes/index.js';

const app = express();

// Trust reverse proxy (Vercel, Render, AWS Lambda)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(corsMiddleware);

// Body parser with 10kb limit per doc 06 §1.3
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser for refresh tokens
app.use(cookieParser());

// Sanitize against NoSQL query injection
app.use(mongoSanitize());

// Protect against HTTP Parameter Pollution
app.use(hpp());

// Disable x-powered-by
app.disable('x-powered-by');

// Global rate limiting
app.use('/api/v1', globalLimiter);

// API v1 routes
app.use('/api/v1', rootRouter);

// 404 handler
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

export default app;
