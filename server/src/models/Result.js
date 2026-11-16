import mongoose from 'mongoose';
const resultSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 400 },
  publishDate: { type: Date, required: true, index: true },
  // Uploaded file (any format) — or an external link instead
  fileKey: String, fileName: String, fileMime: String, fileSize: Number,
  fileType: { type: String, enum: ['sheet', 'file', 'link'], default: 'file' }, // sheet = xlsx/xls/csv (viewed in-site)
  externalUrl: { type: String, trim: true },
  isPublished: { type: Boolean, default: true, index: true },
}, { timestamps: true });
resultSchema.index({ title: 'text' });
export default mongoose.model('Result', resultSchema);
