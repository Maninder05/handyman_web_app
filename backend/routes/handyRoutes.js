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
import PostService from '../models/handyman/PostService.js';

const router = express.Router();

/*  MULTER CONFIGURATION  */

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

// Service Image Storage
const serviceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

// Uploaders
const uploadProfile = multer({ storage: profileStorage });
const uploadCert = multer({ storage: certificationStorage });
const uploadServiceImage = multer({ storage: serviceStorage });

/*  Prevent Client From Using Handyman Routes */
const ensureHandyman = (req, res, next) => {
  if (req.user?.userType !== "handyman") {
    return res.status(403).json({ message: "Access denied: Handyman account required" });
  }
  next();
};

/*  PROFILE ROUTES */


router.get("/", authSession, ensureHandyman, getMyProfile);
// Get logged-in handyman profile (auto-create if not exists)
router.get("/", authSession, getMyProfile);
router.get("/me", authSession, getMyProfile);

router.post("/", authSession, ensureHandyman, createProfile);

router.put("/", authSession, ensureHandyman, updateProfile);

router.post(
  "/upload-profile-pic",
  authSession,
  ensureHandyman,
  uploadProfile.single("profileImage"),
  uploadProfilePic
);

router.post(
  "/upload-certification",
  authSession,
  ensureHandyman,
  uploadCert.single("certification"),
  uploadCertification
);

router.delete("/certification/:certificationId", authSession, ensureHandyman, deleteCertification);

router.delete("/", authSession, ensureHandyman, deleteAccount);

/*  PUBLIC ROUTES*/

router.get("/all", getAllHandymen);

router.put("/verify/:handymanId", authSession, verifyHandyman);

/* ---------------------- SERVICE ROUTES ---------------------- */

router.post(
  "/services",
  authSession,
  ensureHandyman,
  uploadServiceImage.single("image"),
  async (req, res) => {
    try {
      const handymanId = req.user.id;
      const { title, description, category, price, priceType } = req.body;

      if (!title || !description || !category || !price) {
        return res.status(400).json({
          message: "Missing required fields: title, description, category, price",
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
        priceType: priceType || "Hourly",
        images,
        isActive: true,
      });

      await newService.save();

      return res.status(201).json({
        message: "Service published",
        service: newService,
      });
    } catch (err) {
      console.error("Error creating service:", err);
      res.status(500).json({ message: "Server error creating service" });
    }
  }
);

router.get("/services", async (req, res) => {
  try {
    const services = await PostService.find().sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ message: "Server error fetching services" });
  }
});

export default router;
