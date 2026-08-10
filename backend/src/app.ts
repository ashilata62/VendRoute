import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { globalErrorHandler } from './middlewares/errorHandler.js';
import { ENV } from './config/env.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploads
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'VendRoute Backend API is healthy!' });
});

// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
// Backend server started
