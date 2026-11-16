import mongoose from 'mongoose';
import { env } from './config/env.js';
import app from './app.js';
await mongoose.connect(env.mongoUri);
app.listen(env.port, () => console.log(`jntuaresults API on :${env.port}`));
