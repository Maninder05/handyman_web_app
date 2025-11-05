import UserSetting from '../models/UserSetting.js';
import User from '../models/ModelUser.js';
import bcrypt from 'bcryptjs';

// Get all settings for logged-in user
export const getSettings = async (req, res) => {
  try {
    const { id, email, userType } = req.user;

    if (!id || !email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let settings = await UserSetting.findOne({ userId: id });

    if (!settings) {
      settings = await UserSetting.create({
        userId: id,
        email,
        userType, // client, handyman, or admin
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notificationsEnabled: true,
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          jobAlerts: true,
          messageAlerts: true
        }
      });
    }

    res.status(200).json(settings);
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update display settings
export const updateDisplay = async (req, res) => {
  try {
    const { id, email, userType } = req.user;
    const { theme, language, timezone } = req.body;

    if (!id) return res.status(401).json({ message: "Unauthorized" });

    if (theme && !['light', 'dark', 'auto'].includes(theme)) {
      return res.status(400).json({ message: "Invalid theme value" });
    }
    if (language && !['en', 'es', 'fr', 'de'].includes(language)) {
      return res.status(400).json({ message: "Invalid language value" });
    }
    if (timezone && !['UTC', 'EST', 'CST', 'MST', 'PST'].includes(timezone)) {
      return res.status(400).json({ message: "Invalid timezone value" });
    }

    const updatedSettings = await UserSetting.findOneAndUpdate(
      { userId: id },
      {
        theme,
        language,
        timezone,
        $setOnInsert: { userId: id, email, userType }
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "Display settings updated successfully",
      settings: updatedSettings
    });
  } catch (err) {
    console.error("Error updating display settings:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update notification settings
export const updateNotifications = async (req, res) => {
  try {
    const { id, email, userType } = req.user;
    const notifications = req.body;

    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const validKeys = ['emailNotifications', 'smsNotifications', 'pushNotifications', 'jobAlerts', 'messageAlerts'];
    if (Object.keys(notifications).some(key => !validKeys.includes(key))) {
      return res.status(400).json({ message: "Invalid notification settings" });
    }

    const updatedSettings = await UserSetting.findOneAndUpdate(
      { userId: id },
      { notifications, $setOnInsert: { userId: id, email, userType } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Notification settings updated successfully",
      settings: updatedSettings
    });
  } catch (err) {
    console.error("Error updating notifications:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { id, email } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!id || !email) return res.status(401).json({ message: "Unauthorized" });
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Please provide current and new password" });
    if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const { id, email, userType } = req.user;
    if (!id || !email) return res.status(401).json({ message: "Unauthorized" });

    await UserSetting.findOneAndDelete({ userId: id });

    if (userType === 'client') {
      const Client = (await import('../models/clientProfile.js')).default;
      await Client.findOneAndDelete({ userId: id });
    } else if (userType === 'handyman') {
      const HandyProfile = (await import('../models/HandyAddProfile.js')).default;
      await HandyProfile.findOneAndDelete({ userId: id });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
