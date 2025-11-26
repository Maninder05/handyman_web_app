import express from "express";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Notification from "../models/Notification.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all conversations for a user
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name email profilePicture role")
      .sort({ lastMessageAt: -1 });

    const conversationsWithUnread = conversations.map((conv) => {
      const unreadCount = conv.unreadCount.get(req.user._id.toString()) || 0;
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      // !== means: “Not equal, AND not same type.”

      return {
        _id: conv._id,
        conversationId: conv._id,
        otherUser: otherParticipant,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
      };
    });

    res.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get messages for a specific conversation
router.get("/conversation/:userId", authenticateToken, async (req, res) => {
  try {
    const conversationId = Conversation.generateId(
      req.user._id.toString(),
      req.params.userId
    );

    const messages = await Message.find({ conversationId })
      .populate("senderId", "name profilePicture")
      .populate("receiverId", "name profilePicture")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        read: false,
      },
      { read: true }
    );

    // Update conversation unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${req.user._id}`]: 0,
    });

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send a message
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Receiver and content required" });
    }

    const conversationId = Conversation.generateId(
      req.user._id.toString(),
      receiverId
    );

    // Create message
    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      receiverId,
      content,
    });

    await message.populate("senderId", "name profilePicture");
    await message.populate("receiverId", "name profilePicture");

    // Update or create conversation
    const currentUnreadCount = await Conversation.findById(conversationId)
      .then((conv) => conv?.unreadCount.get(receiverId) || 0)
      .catch(() => 0);

    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        participants: [req.user._id, receiverId],
        lastMessage: content,
        lastMessageAt: new Date(),
        [`unreadCount.${receiverId}`]: currentUnreadCount + 1,
      },
      { upsert: true, new: true }
    );

    // Create notification
    const notification = await Notification.create({
      userId: receiverId,
      title: "New Message",
      body: `${req.user.name}: ${content.substring(0, 50)}${
        content.length > 50 ? "..." : ""
      }`,
      type: "message",
      relatedId: message._id,
      relatedModel: "Message",
    });

    const io = req.app.get("io");
    if (io) {
      io.to(receiverId).emit("newMessage", message);
      io.to(receiverId).emit("notification", { notification });
    }

    res.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get unread message count
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user._id,
      read: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

export default router;
