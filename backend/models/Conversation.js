import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  lastMessage: {
    type: String,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Generate conversation ID from two user IDs
conversationSchema.statics.generateId = function (userId1, userId2) {
  return [userId1, userId2].sort().join("_");
};

export default mongoose.model("Conversation", conversationSchema);
