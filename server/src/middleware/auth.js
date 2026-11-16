import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const signToken = (admin) => jwt.sign({ sub: String(admin._id), email: admin.email }, env.jwtSecret, { expiresIn: '12h' });
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'Login required' });
  try { req.admin = jwt.verify(t, env.jwtSecret); next(); } catch { res.status(401).json({ error: 'Session expired, please log in again' }); }
}
