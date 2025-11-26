// models/handyman/PostService.js
import mongoose from 'mongoose';

const postServiceSchema = new mongoose.Schema({
  handymanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  priceType: { type: String, enum: ['Hourly', 'Fixed'], default: 'Hourly' },
  category: { type: String, default: 'General' },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('PostService', postServiceSchema);
