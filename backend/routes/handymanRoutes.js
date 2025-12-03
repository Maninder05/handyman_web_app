import express from "express";
import {
  getMyProfile,
  createProfile,
  updateProfile,
  uploadProfilePic,
  deleteAccount,
} from "../controllers/handyman/handyDashboardController.js";
import authSession from "../middleware/authSession.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* ---------------------- MULTER CONFIGURATION ---------------------- */
const storage = multer.diskStorage({
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

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed!"), false);
    } else {
      cb(null, true);
    }
  },
});

/* ---------------------- ROUTES ---------------------- */

// Get logged-in handyman profile (auto-create if not exists)
router.get("/me", authSession, getMyProfile);

// Create handyman profile manually
router.post("/", authSession, createProfile);

// Update handyman profile
router.put("/", authSession, updateProfile);

// Upload profile picture
router.post("/upload-pic", authSession, upload.single("image"), uploadProfilePic);

// Delete account
router.delete("/account", authSession, deleteAccount);

export default router;