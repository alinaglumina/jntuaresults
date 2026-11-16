import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import officialsRoutes from './routes/officials.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (origin, cb) => cb(null, !origin || env.origins.includes(origin)), credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/results', publicRoutes);
app.use('/api/officials', officialsRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: err.field === 'photo' ? 'Photo is too large (max 5 MB)' : 'File is too large (max 25 MB)' });
  if (err.name === 'MulterError' || err.message === 'This file type is not allowed' || err.message === 'Photo must be a PNG, JPG or WebP image') return res.status(400).json({ error: err.message });
  if (/hall-ticket column|Could not read this file|Too many rows/.test(err.message)) return res.status(400).json({ error: err.message });
  console.error(err); res.status(500).json({ error: 'Server error' });
});
export default app;
