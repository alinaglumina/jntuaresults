import { env } from '../config/env.js';
// Verifies an hCaptcha token. In production a secret is mandatory; in local dev
// with no secret the check is skipped so you can test without keys.
export async function verifyCaptcha(req, res, next) {
  if (process.env.CAPTCHA === 'off') return next(); // captcha switched off by configuration
  const secret = env.hcaptchaSecret;
  if (!secret) {
    if (env.isProd) return res.status(503).json({ error: 'Verification is not configured on the server' });
    return next();
  }
  const token = String(req.body?.captcha || '');
  if (!token) return res.status(400).json({ error: 'Please tick “I am human” first' });
  try {
    const r = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }), signal: AbortSignal.timeout(8000),
    });
    const d = await r.json();
    if (!d.success) return res.status(400).json({ error: 'Verification failed. Please tick “I am human” again.' });
    next();
  } catch { res.status(503).json({ error: 'Could not verify right now. Please try again.' }); }
}
