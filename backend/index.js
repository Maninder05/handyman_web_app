import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import http from 'http';
import { Server } from 'socket.io';

// Passport config
import './config/passport.js';

// Routes - ONLY ONE IMPORT PER FILE!
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import handymanRoutes from './routes/handyRoutes.js';
import settingsRoutes from './routes/mutualRoutes.js';

dotenv.config();

const app = express();  
const PORT = process.env.PORT || 7000;

// HTTP server
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Core middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Directory setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

// API Routes - ✅ ALL ROUTES HERE AFTER APP IS CREATED!
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/handymen', handymanRoutes);
app.use('/api/settings', settingsRoutes);  // ✅ ALREADY HERE, PERFECT!

// Socket.io Events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
  });

  socket.on('sendNotification', ({ receiverId, notification }) => {
    io.to(receiverId).emit('receiveNotification', notification);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
  });