import express from "express";
import authSession from "../middleware/authSession.js";
import { declineJob } from "../controllers/handyman/JobDeclineController.js";

const router = express.Router();

// POST /api/jobs/decline/:bookingId
router.post("/decline/:bookingId", authSession, declineJob);

export default router;
