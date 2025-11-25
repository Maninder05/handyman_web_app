import express from 'express';
import authSession from '../middleware/authSession.js';
import {
  getSettings,
  updateDisplay,
  updateNotifications,
  changePassword,
} from '../controllers/mutual/settingsController.js';

const router = express.Router();

// GET settings
router.get('/', authSession, getSettings);

// UPDATE display settings
router.put('/display', authSession, updateDisplay);

// UPDATE notifications
router.put('/notifications', authSession, updateNotifications);

// CHANGE password
router.put('/change-password', authSession, changePassword);

export default router;