import express from "express";
import PostService from "../models/handyman/PostService.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Image upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// 🔹 Create Service
router.post("/services", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, price, isDraft } = req.body;
    const handymanId = "64f0b8b0a2c6c123456789ab"; // replace with auth middleware

    if (!title || !description || !category || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newService = new PostService({
      handymanId,
      title,
      description,
      category,
      price,
      images: req.file ? [`/uploads/${req.file.filename}`] : [],
      isActive: !isDraft,
    });

    await newService.save();
    res.status(201).json({ message: isDraft ? "Draft saved" : "Service published" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error creating service" });
  }
});

// 🔹 Get all published services for the dashboard
router.get("/services", async (req, res) => {
  try {
    const handymanId = "64f0b8b0a2c6c123456789ab"; // replace with auth middleware
    const services = await PostService.find({ handymanId }).sort({ createdAt: -1 }); // remove isActive filter
    res.status(200).json(services);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ message: "Server error fetching services" });
  }
});


export default router;
