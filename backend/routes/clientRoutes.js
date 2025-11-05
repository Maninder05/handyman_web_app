import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {getMyProfile, createProfile, updateProfile, uploadProfilePic, saveHandyman, removeSavedHandyman,deleteAccount } from "../controllers/client/clientDashboardController.js";
import authSession from "../middleware/authSession.js";

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

// Get logged-in client profile (auto-create if not exists)
router.get("/", authSession, getMyProfile);

// Create client profile manually
router.post("/", authSession, createProfile);

// Update existing profile details
router.put("/", authSession, updateProfile);

// Upload or update profile picture
router.post(
  "/upload-profile-pic",
  authSession,
  upload.single("profileImage"),
  uploadProfilePic
);

// Save a handyman (favorite)
router.post("/save-handyman", authSession, saveHandyman);

// Remove saved handyman
router.delete("/remove-handyman/:handymanId", authSession, removeSavedHandyman);

// Delete account (profile + user)
router.delete("/", authSession, deleteAccount);


export default router;
