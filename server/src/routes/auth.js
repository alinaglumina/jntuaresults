import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import Admin from '../models/Admin.js';
import { signToken } from '../middleware/auth.js';
const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Try again in 15 minutes.' } });
router.post('/login', limiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim(), password = String(req.body?.password || '');
    const admin = email && (await Admin.findOne({ email }));
    // Compare even when the user is missing so response time doesn't reveal valid emails
    const ok = await bcrypt.compare(password, admin?.passwordHash || '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    if (!admin || !ok) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ token: signToken(admin), email: admin.email });
  } catch (e) { next(e); }
});
export default router;
