import Notification from "../models/Notification.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";

// Create notification for new message
export const createMessageNotification = async (
  senderId,
  receiverId,
  message,
  chatId
) => {
  try {
    const sender = await User.findById(senderId).select("name email");
    const receiver = await User.findById(receiverId).select("name email");

    const notification = new Notification({
      userId: receiverId,
      title: `New Message from ${sender.name}`,
      body: message.length > 50 ? `${message.substring(0, 50)}...` : message,
      type: "message",
      relatedId: chatId,
      relatedModel: "Chat",
      senderId: senderId,
      senderName: sender.name,
      link: `/messages/${chatId}`,
      read: false,
    });

    await notification.save();

    // Emit socket event
    const io = req.app.get("socketio");
    if (io) {
      io.to(receiverId.toString()).emit("notification", {
        notification: {
          ...notification.toObject(),
          sender: {
            name: sender.name,
            email: sender.email,
          },
        },
      });
    }

    return notification;
  } catch (error) {
    console.error("Error creating message notification:", error);
    throw error;
  }
};

// Get notifications with pagination
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId: req.user._id };

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("senderId", "name email profileImage")
      .populate("relatedId");

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.json({
      notifications,
      unreadCount,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Mark notification as read and redirect to chat
export const markNotificationReadAndRedirect = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // If it's a message notification, get chat details
    if (notification.type === "message" && notification.relatedId) {
      const chat = await Chat.findById(notification.relatedId)
        .populate("participants", "name email profileImage")
        .populate("jobId", "title");

      return res.json({
        notification,
        redirect: true,
        redirectUrl: `/chat/${notification.relatedId}`,
        chat: chat || null,
      });
    }

    res.json({ notification, redirect: false });
  } catch (error) {
    console.error("Error handling notification:", error);
    res.status(500).json({ error: "Failed to handle notification" });
  }
};
