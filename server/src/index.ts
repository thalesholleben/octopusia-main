import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import passport from 'passport';

import { configurePassport } from './config/passport';
import authRoutes from './routes/auth.routes';
import financeRoutes from './routes/finance.routes';
import userRoutes from './routes/user.routes';
import goalsRoutes from './routes/goals.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';

config();

const app = express();
const PORT = process.env.PORT || 3001;

// Desabilitar ETag (evita 304 Not Modified)
app.set('etag', false);

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Registration-Key'],
}));
app.use(express.json());
app.use(passport.initialize());

// Handle preflight requests
app.options('*', cors());

// Passport configuration
configurePassport();

// Middleware no-cache para API (evita 304 Not Modified)
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/goals', goalsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public config - WhatsApp Agent URL
app.get('/api/config/whatsapp-url', (req, res) => {
  res.json({ url: process.env.WHATSAPP_AGENT_URL || null });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
