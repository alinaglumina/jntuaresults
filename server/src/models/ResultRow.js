import mongoose from 'mongoose';
// One student's row from an uploaded Excel result. Looked up by (resultId, key).
const s = new mongoose.Schema({
  resultId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sheet: { type: Number, required: true },   // index into Result.sheets
  key: { type: String, required: true },     // normalized hall ticket number
  values: [String],
}, { versionKey: false });
s.index({ resultId: 1, key: 1 });
export default mongoose.model('ResultRow', s);
