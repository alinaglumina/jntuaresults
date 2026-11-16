import { Router } from 'express';
import mongoose from 'mongoose';
import Result from '../models/Result.js';
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

// File download / inline view (streams from storage)
router.get('/:id/file', async (req, res, next) => {
  try {
    if (!okId(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const r = await Result.findOne({ _id: req.params.id, isPublished: true }).lean();
    if (!r || !r.fileKey) return res.status(404).json({ error: 'File not found' });
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
