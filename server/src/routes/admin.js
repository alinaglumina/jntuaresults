import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import mongoose from 'mongoose';
import Result from '../models/Result.js';
import ResultRow from '../models/ResultRow.js';
import { parseWorkbook, normKey } from '../lib/sheet.js';
import { requireAuth } from '../middleware/auth.js';
import { makeKey, putFile, deleteFile } from '../config/storage.js';

const router = Router();
router.use(requireAuth);

// Any document format is allowed except ones a browser could execute.
const BLOCKED = new Set(['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.sh', '.ps1', '.vbs', '.js', '.mjs', '.jar', '.php', '.html', '.htm', '.svg', '.xhtml']);
const SHEET = new Set(['.xlsx', '.xls', '.csv']);
const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => (BLOCKED.has(path.extname(file.originalname).toLowerCase()) ? cb(new Error('This file type is not allowed')) : cb(null, true)),
});
const adminShape = (r) => ({ id: r._id, title: r.title, publishDate: r.publishDate, type: r.fileType, fileName: r.fileName, fileSize: r.fileSize, rowCount: r.rowCount, externalUrl: r.externalUrl, isPublished: r.isPublished, createdAt: r.createdAt });
const bad = (res, msg) => res.status(400).json({ error: msg });
const okUrl = (u) => { try { return ['http:', 'https:'].includes(new URL(u).protocol); } catch { return false; } };

// Stores the uploaded file on the doc. For Excel/CSV it also parses the students' rows (returned as `sheets`).
async function attach(doc, file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isSheet = SHEET.has(ext);
  const sheets = isSheet ? parseWorkbook(file.buffer) : null; // throws a readable message if the layout is wrong
  const key = makeKey(file.originalname);
  await putFile(key, file.buffer, file.mimetype);
  const old = doc.fileKey;
  Object.assign(doc, { fileKey: key, fileName: file.originalname, fileMime: file.mimetype, fileSize: file.size, fileType: isSheet ? 'sheet' : 'file', externalUrl: undefined });
  doc.sheets = sheets ? sheets.map(({ name, headers, keyCol }) => ({ name, headers, keyCol })) : [];
  doc.rowCount = sheets ? sheets.reduce((n, s) => n + s.rows.length, 0) : 0;
  return { old, sheets };
}
// Replaces all stored student rows for a result
async function loadRows(doc, sheets) {
  await ResultRow.deleteMany({ resultId: doc._id });
  if (!sheets) return;
  let batch = [];
  for (let si = 0; si < sheets.length; si++) {
    for (const values of sheets[si].rows) {
      batch.push({ resultId: doc._id, sheet: si, key: normKey(values[sheets[si].keyCol]), values });
      if (batch.length >= 1000) { await ResultRow.insertMany(batch, { ordered: false }); batch = []; }
    }
  }
  if (batch.length) await ResultRow.insertMany(batch, { ordered: false });
}

router.get('/results', async (req, res, next) => {
  try {
    const limit = 25, page = Math.max(1, Number(req.query.page) || 1);
    const [items, total] = await Promise.all([
      Result.find().sort({ publishDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Result.countDocuments()]);
    res.json({ items: items.map(adminShape), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { next(e); }
});

router.post('/results', upload.single('file'), async (req, res, next) => {
  try {
    const { title, publishDate, externalUrl } = req.body;
    if (!title?.trim()) return bad(res, 'Title is required');
    if (!publishDate || isNaN(new Date(publishDate))) return bad(res, 'A valid publish date is required');
    if (!req.file && !externalUrl) return bad(res, 'Upload a file or give a link');
    if (!req.file && !okUrl(externalUrl)) return bad(res, 'Link must start with http:// or https://');
    const doc = new Result({ title: title.trim(), publishDate, isPublished: req.body.isPublished !== 'false' });
    let sheets = null;
    if (req.file) ({ sheets } = await attach(doc, req.file)); else Object.assign(doc, { fileType: 'link', externalUrl });
    await doc.save();
    try { await loadRows(doc, sheets); } catch (e) { await ResultRow.deleteMany({ resultId: doc._id }); await Result.findByIdAndDelete(doc._id); await deleteFile(doc.fileKey); throw e; }
    res.status(201).json(adminShape(doc));
  } catch (e) { next(e); }
});

router.put('/results/:id', upload.single('file'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const doc = await Result.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const { title, publishDate, externalUrl, isPublished } = req.body;
    if (title !== undefined) { if (!title.trim()) return bad(res, 'Title is required'); doc.title = title.trim(); }
    if (publishDate) { if (isNaN(new Date(publishDate))) return bad(res, 'Invalid date'); doc.publishDate = publishDate; }
    if (isPublished !== undefined) doc.isPublished = isPublished !== 'false' && isPublished !== false;
    let oldKey, sheets, rowsChanged = false;
    if (req.file) { ({ old: oldKey, sheets } = await attach(doc, req.file)); rowsChanged = true; }
    else if (externalUrl) { if (!okUrl(externalUrl)) return bad(res, 'Link must start with http:// or https://'); oldKey = doc.fileKey; Object.assign(doc, { fileType: 'link', externalUrl, fileKey: undefined, fileName: undefined, fileMime: undefined, fileSize: undefined, sheets: [], rowCount: 0 }); rowsChanged = true; }
    await doc.save();
    if (rowsChanged) await loadRows(doc, sheets || null);
    if (oldKey) await deleteFile(oldKey);
    res.json(adminShape(doc));
  } catch (e) { next(e); }
});

router.delete('/results/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const doc = await Result.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    await ResultRow.deleteMany({ resultId: doc._id });
    await deleteFile(doc.fileKey);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
export default router;
