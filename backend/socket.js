// socket.js - Socket.io instance
import { Server } from "socket.io";
import http from "http";

let io = null;

export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("join_support_room", ({ conversationId }) => {
      socket.join(`support_${conversationId}`);
      console.log(`User joined support room: ${conversationId}`);
    });

    socket.on("support_message", ({ conversationId, message }) => {
      // Broadcast to all users in the conversation room (including agents)
      io.to(`support_${conversationId}`).emit("support_message", {
        conversationId,
        message
      });
      // Also notify admins/agents about new messages
      io.to("admin_support").emit("new_support_message", {
        conversationId,
        message
      });
    });

    socket.on("typing", ({ conversationId, isTyping, senderType }) => {
      // Broadcast typing indicator to all users in the conversation room (except the sender)
      socket.to(`support_${conversationId}`).emit("typing", {
        conversationId,
        isTyping,
        senderType
      });
    });

    socket.on("join_admin_support", () => {
      socket.join("admin_support");
      console.log("Admin joined support monitoring");
    });

    socket.on("sendNotification", ({ receiverId, notification }) => {
      io.to(receiverId).emit("receiveNotification", notification);
      console.log("Notification sent to", receiverId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
}

