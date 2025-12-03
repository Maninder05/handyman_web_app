import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import { createMessageNotification } from "./notificationController.js";
import User from "../models/User.js";

// Create or get chat
export const getOrCreateChat = async (req, res) => {
  try {
    const { receiverId, jobId } = req.body;

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [req.user._id, receiverId] },
    });

    if (existingChat) {
      return res.json({
        chat: existingChat,
        isNew: false,
      });
    }

    // Create new chat
    const newChat = new Chat({
      participants: [req.user._id, receiverId],
      jobId: jobId || null,
      createdBy: req.user._id,
    });

    await newChat.save();

    // Create notification for the receiver
    const sender = await User.findById(req.user._id);
    await createMessageNotification(
      req.user._id,
      receiverId,
      `${sender.name} started a conversation with you`,
      newChat._id
    );

    res.status(201).json({
      chat: newChat,
      isNew: true,
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, attachments = [] } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get receiver
    const receiverId = chat.participants.find(
      (participant) => participant.toString() !== req.user._id.toString()
    );

    // Create message
    const message = new Message({
      chatId,
      sender: req.user._id,
      receiver: receiverId,
      content,
      attachments,
    });

    await message.save();

    // Update chat
    chat.lastMessage = content;
    chat.lastMessageAt = new Date();
    chat.unreadCount += 1;
    await chat.save();

    // Create notification
    await createMessageNotification(req.user._id, receiverId, content, chatId);

    // Emit socket event
    const io = req.app.get("socketio");
    if (io) {
      io.to(chatId).emit("new_message", {
        message: {
          ...message.toObject(),
          sender: req.user,
        },
      });
    }

    res.status(201).json({
      message,
      chat,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Mark messages as read
    await Message.updateMany(
      { chatId, receiver: req.user._id, read: false },
      { read: true }
    );

    // Reset unread count
    chat.unreadCount = 0;
    await chat.save();

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "name email profileImage")
      .populate("receiver", "name email profileImage");

    const total = await Message.countDocuments({ chatId });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      chat,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Get user chats
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate("participants", "name email profileImage")
      .populate("jobId", "title")
      .sort({ lastMessageAt: -1 });

    res.json({ chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};
