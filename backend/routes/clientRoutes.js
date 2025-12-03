import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  getMyProfile, 
  createProfile, 
  updateProfile, 
  uploadProfilePic, 
  saveHandyman, 
  removeSavedHandyman,
  deleteAccount 
} from "../controllers/client/clientDashboardController.js";
import authSession from "../middleware/authSession.js";
import PostService from "../models/handyman/PostService.js";

const router = express.Router();

/* MULTER CONFIGURATION */
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

/* SECURITY: PREVENT HANDYMAN FROM USING CLIENT ROUTES*/
const ensureClient = (req, res, next) => {
  if (req.user?.userType !== "client") {
    return res.status(403).json({ message: "Access denied: Client account required" });
  }
  next();
};

/* ---------------------- CLIENT — Search for handymen ---------------------- */
router.get("/find-handyman", async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const services = await PostService.find({
      category: { $regex: category, $options: "i" },
      isActive: true
    }).populate("handymanId", "name location rating experience");

    res.status(200).json(services);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error while searching" });
  }
});

/* ---------------------- ROUTES ---------------------- */

router.get("/", authSession, ensureClient, getMyProfile);

router.post("/", authSession, ensureClient, createProfile);

router.put("/", authSession, ensureClient, updateProfile);

router.post(
  "/upload-profile-pic",
  authSession,
  ensureClient,
  upload.single("profileImage"),
  uploadProfilePic
);

router.post("/save-handyman", authSession, ensureClient, saveHandyman);

router.delete("/remove-handyman/:handymanId", authSession, ensureClient, removeSavedHandyman);

router.delete("/", authSession, ensureClient, deleteAccount);

export default router;
