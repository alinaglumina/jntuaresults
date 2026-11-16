import crypto from 'crypto';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env.js';

const { accountId, accessKeyId, secretAccessKey, bucket } = env.r2;
export const usingR2 = Boolean(accountId && accessKeyId && secretAccessKey && bucket);
const s3 = usingR2 ? new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } }) : null;
const LOCAL = path.resolve('uploads');

const safe = (n) => String(n).normalize('NFKD').replace(/[^\w.\-]+/g, '_').slice(-80);
export const makeKey = (name) => `results/${new Date().toISOString().slice(0, 7)}/${crypto.randomBytes(6).toString('hex')}-${safe(name)}`;

export async function putFile(key, buffer, mime) {
  if (usingR2) return s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mime || 'application/octet-stream' }));
  const p = path.join(LOCAL, key); await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, buffer);
}
// Returns a Node readable stream
export async function getFile(key) {
  if (usingR2) { const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key })); return { stream: r.Body, length: r.ContentLength }; }
  const p = path.join(LOCAL, key); const st = await fs.stat(p); return { stream: createReadStream(p), length: st.size };
}
export async function deleteFile(key) {
  if (!key) return;
  try {
    if (usingR2) await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    else await fs.rm(path.join(LOCAL, key), { force: true });
  } catch (e) { console.warn('deleteFile failed', key, e.message); }
}
