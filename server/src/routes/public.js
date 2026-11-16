import { Router } from 'express';
import mongoose from 'mongoose';
import Result from '../models/Result.js';
import rateLimit from 'express-rate-limit';
import ResultRow from '../models/ResultRow.js';
import { normKey } from '../lib/sheet.js';
import { verifyCaptcha } from '../middleware/captcha.js';
import { getFile } from '../config/storage.js';

const router = Router();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const publicShape = (r) => ({
  id: r._id, title: r.title, publishDate: r.publishDate, type: r.fileType,
  fileName: r.fileName, fileSize: r.fileSize, url: r.fileType === 'link' ? r.externalUrl : undefined,
});
const okId = (id) => mongoose.isValidObjectId(id);

// List: newest first, 25 per page by default, optional search ?q=
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const page = Math.max(1, Number(req.query.page) || 1);
    const filter = { isPublished: true };
    const q = String(req.query.q || '').trim().slice(0, 100);
    if (q) filter.title = new RegExp(esc(q), 'i');
    const [items, total] = await Promise.all([
      Result.find(filter).sort({ publishDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Result.countDocuments(filter),
    ]);
    res.json({ items: items.map(publicShape), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!okId(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const r = await Result.findOne({ _id: req.params.id, isPublished: true }).lean();
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(publicShape(r));
  } catch (e) { next(e); }
});

// Student lookup: returns only the rows for one hall ticket number
const lookupLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many searches. Please wait a minute.' } });
router.post('/:id/lookup', lookupLimiter, verifyCaptcha, async (req, res, next) => {
  try {
    if (!okId(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const key = normKey(req.body?.hallTicket);
    if (!key) return res.status(400).json({ error: 'Hallticket Number Required' });
    if (key.length > 40) return res.status(400).json({ error: 'Invalid Hallticket Number' });
    const r = await Result.findOne({ _id: req.params.id, isPublished: true, fileType: 'sheet' }).lean();
    if (!r) return res.status(404).json({ error: 'Not found' });
    const rows = await ResultRow.find({ resultId: r._id, key }).sort({ _id: 1 }).limit(200).lean();
    if (!rows.length) return res.status(404).json({ error: 'No result found for this Hallticket Number' });
    const bySheet = new Map();
    for (const row of rows) { if (!bySheet.has(row.sheet)) bySheet.set(row.sheet, []); bySheet.get(row.sheet).push(row.values); }
    res.json({ title: r.title, hallTicket: key, sheets: [...bySheet].map(([i, vals]) => ({ name: r.sheets[i]?.name, headers: r.sheets[i]?.headers || [], keyCol: r.sheets[i]?.keyCol, rows: vals })) });
  } catch (e) { next(e); }
});

// File download / inline view (streams from storage)
router.get('/:id/file', async (req, res, next) => {
  try {
    if (!okId(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const r = await Result.findOne({ _id: req.params.id, isPublished: true }).lean();
    // Excel results hold every student's marks: they are only reachable one hall ticket at a time via /lookup
    if (!r || !r.fileKey || r.fileType === 'sheet') return res.status(404).json({ error: 'File not found' });
    const { stream, length } = await getFile(r.fileKey);
    const inline = /^(application\/pdf|image\/(png|jpe?g|gif|webp))$/.test(r.fileMime || '');
    res.setHeader('Content-Type', r.fileMime || 'application/octet-stream');
    if (length) res.setHeader('Content-Length', length);
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(r.fileName || 'result')}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=300');
    stream.on('error', next); stream.pipe(res);
  } catch (e) { e.code === 'ENOENT' || e.name === 'NoSuchKey' ? res.status(404).json({ error: 'File not found' }) : next(e); }
});
export default router;
