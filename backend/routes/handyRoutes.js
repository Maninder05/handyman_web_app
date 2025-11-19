
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getMyProfile,
  createProfile,
  updateProfile,
  uploadProfilePic,
  uploadCertification,
  deleteCertification,
  deleteAccount,
  getAllHandymen,
  verifyHandyman
} from "../controllers/handyman/handyDashboardController.js";
import authSession from "../middleware/authSession.js";

const router = express.Router();

/* ---------------------- MULTER CONFIGURATION ---------------------- */

// Profile Picture Storage
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads/profiles";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + "-" + Date.now() + ext);
  },
});

// Certification Storage
const certificationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads/certifications";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + "-cert-" + Date.now() + ext);
  },
});

// Profile Picture Upload
const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed!"), false);
    } else {
      cb(null, true);
    }
  },
});

// Certification Upload
const uploadCert = multer({
  storage: certificationStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed!"), false);
    }
  },
});

/* ---------------------- ROUTES ---------------------- */

// Get logged-in handyman profile (auto-create if not exists)
router.get("/", authSession, getMyProfile);

// Create handyman profile manually
router.post("/", authSession, createProfile);

// Update handyman profile
router.put("/", authSession, updateProfile);

// Upload or update profile picture
router.post(
  "/upload-profile-pic",
  authSession,
  uploadProfile.single("profileImage"),
  uploadProfilePic
);

// Upload certification
router.post(
  "/upload-certification",
  authSession,
  uploadCert.single("certification"),
  uploadCertification
);

// Delete certification
router.delete("/certification/:certificationId", authSession, deleteCertification);

// Delete account (profile + user)
router.delete("/", authSession, deleteAccount);

// Get all handymen (for browsing/search)
router.get("/all", getAllHandymen);

// Verify handyman (Admin only - add admin middleware later)
router.put("/verify/:handymanId", authSession, verifyHandyman);

export default router;

// routes/handyRoutes.js
import express from 'express';
import PostService from '../models/handyman/PostService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// POST — Create Service (NO DRAFT ANYMORE)
router.post('/services', upload.single('image'), async (req, res) => {
  try {
    const handymanId = req.body.handymanId || '64f0b8b0a2c6c123456789ab';
    const { title, description, category, price, priceType } = req.body;

    if (!title || !description || !category || !price) {
      return res.status(400).json({
        message: 'Missing required fields: title, description, category, price'
      });
    }

    const images = [];
    if (req.file) {
      const fullUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
images.push(fullUrl);

    }

    const newService = new PostService({
      handymanId,
      title,
      description,
      category,
      price: Number(price),
      priceType: priceType || 'Hourly',
      images,
      isActive: true, // ALWAYS ACTIVE NOW
    });

    await newService.save();

    return res.status(201).json({
      message: 'Service published',
      service: newService,
    });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ message: 'Server error creating service' });
  }
});

// GET — All Services
router.get('/services', async (req, res) => {
  try {
    const services = await PostService.find().sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Server error fetching services' });
  }
});

export default router;
