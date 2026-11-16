import 'dotenv/config';
const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
export const env = {
  port: Number(process.env.PORT) || 5000,
  isProd: process.env.NODE_ENV === 'production',
  hcaptchaSecret: process.env.HCAPTCHA_SECRET,
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  origins: list(process.env.CLIENT_ORIGIN || 'http://localhost:5173'),
  r2: {
    accountId: process.env.R2_ACCOUNT_ID, accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY, bucket: process.env.R2_BUCKET,
  },
};
if (!env.mongoUri) throw new Error('MONGODB_URI is required');
if (!env.jwtSecret || env.jwtSecret.length < 16) throw new Error('JWT_SECRET (16+ chars) is required');
