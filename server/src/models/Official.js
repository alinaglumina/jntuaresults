import mongoose from 'mongoose';
// People shown under "About Us": Director of Evaluation, Controller of Examinations, Additional Controllers
export const SECTIONS = ['director-evaluation', 'controller', 'additional-controllers'];
export default mongoose.model('Official', new mongoose.Schema({
  section: { type: String, enum: SECTIONS, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  designation: { type: String, trim: true, maxlength: 300, default: '' },
  order: { type: Number, default: 0 },
  photoKey: String, photoMime: String,
}, { timestamps: true }));
