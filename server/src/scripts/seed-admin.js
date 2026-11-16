// Creates (or resets the password of) the admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) { console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars) in .env'); process.exit(1); }
await mongoose.connect(MONGODB_URI);
await Admin.findOneAndUpdate({ email: ADMIN_EMAIL.toLowerCase() }, { passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) }, { upsert: true });
console.log('Admin ready:', ADMIN_EMAIL);
await mongoose.disconnect();
