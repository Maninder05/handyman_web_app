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