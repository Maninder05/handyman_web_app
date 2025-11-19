import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  handymanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Handyman",
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PostService",
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ["pending", "accepted", "in-progress", "completed", "declined"],
    default: "pending",
  },
  clientName: { type: String },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
