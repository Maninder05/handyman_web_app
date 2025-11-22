import express from 'express';
import authSession from '../middleware/authSession.js';
import {
  getSettings,
  updateDisplay,
  updateNotifications,
  changePassword,
  deleteAccount,
} from '../controllers/mutual/settingsController.js';

const router = express.Router();

// Get all settings
router.get('/', authSession, getSettings);

// Update display settings
router.put('/display', authSession, updateDisplay);

// Update notification settings
router.put('/notifications', authSession, updateNotifications);

// Change password
router.put('/change-password', authSession, changePassword);

// Delete account
router.delete('/account', authSession, deleteAccount);

export default router;