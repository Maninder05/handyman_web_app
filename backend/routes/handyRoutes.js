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
