import mongoose from "mongoose";

const postServiceSchema = new mongoose.Schema({
  handymanId: { type: mongoose.Schema.Types.ObjectId, ref: "Handyman", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: "General" },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("PostService", postServiceSchema);
