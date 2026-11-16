import { Router } from 'express';
import mongoose from 'mongoose';
import Official, { SECTIONS } from '../models/Official.js';
import { getFile } from '../config/storage.js';

const router = Router();
export const shape = (o) => ({
  id: o._id, section: o.section, name: o.name, designation: o.designation, order: o.order,
  photo: o.photoKey ? `/api/officials/${o._id}/photo?v=${new Date(o.updatedAt).getTime()}` : null,
});

router.get('/', async (req, res, next) => {
  try {
    const section = String(req.query.section || '');
    if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'Unknown section' });
    const items = await Official.find({ section }).sort({ order: 1, createdAt: 1 }).lean();
    res.json({ items: items.map(shape) });
  } catch (e) { next(e); }
});

router.get('/:id/photo', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
    const o = await Official.findById(req.params.id).lean();
    if (!o?.photoKey) return res.status(404).end();
    const { stream, length } = await getFile(o.photoKey);
    res.setHeader('Content-Type', o.photoMime || 'image/jpeg');
    if (length) res.setHeader('Content-Length', length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    stream.on('error', next); stream.pipe(res);
  } catch (e) { e.code === 'ENOENT' || e.name === 'NoSuchKey' ? res.status(404).end() : next(e); }
});
export default router;
