import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  attachments: [
    {
      url: String,
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ read: 1 });

export default mongoose.model("Message", messageSchema);
