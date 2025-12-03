import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import http from 'http';

// Passport config
import './config/passport.js';

// Routes - ONLY ONE IMPORT PER FILE!
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import handymanRoutes from './routes/handyRoutes.js';
import settingsRoutes from './routes/mutualRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import JobDeclineRoutes from './routes/JobDeclineRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();  // ✅ CREATE APP FIRST!
const PORT = process.env.PORT || 7000;

// HTTP server
const server = http.createServer(app);

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
app.use('/api/settings', settingsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/jobs', JobDeclineRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/support', supportRoutes);

// Initialize Socket.io (after routes are set up)
import { initializeSocket } from './socket.js';
initializeSocket(server);

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