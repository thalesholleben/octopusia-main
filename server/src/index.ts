import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import passport from 'passport';

import { configurePassport } from './config/passport';
import authRoutes from './routes/auth.routes';
import financeRoutes from './routes/finance.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';

config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// Passport configuration
configurePassport();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
