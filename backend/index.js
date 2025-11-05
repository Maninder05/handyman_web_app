import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from 'cookie-parser';
import passport from 'passport';
import http from "http";
import { Server } from "socket.io";
import './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from "./routes/clientRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 7000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve uploaded images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use('/api/users', authRoutes);
app.use('/api/client', clientRoutes);

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log(' Connected to MongoDB successfully!');
  server.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
  });
}).catch((err) => {
  console.error(' Database connection error:', err);
});

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
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

  socket.on("sendNotification", ({ receiverId, notification }) => {
    io.to(receiverId).emit("receiveNotification", notification);
    console.log("Notification sent to", receiverId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

