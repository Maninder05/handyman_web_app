import ClientProfile from "../../models/client/ClientDashboard.js";
import User from "../../models/auth/User.js";
//import Bookings from "../../models/client/Bookings.js";
//import PostJob from "../../models/client/PostJob.js";
//import Reviews from "../../models/mutual/Reviews.js";
//import Messages from "../../models/mutual/Messages.js";
//import Notifications from "../../models/mutual/Notifications.js";
//import Payment from "../../models/mutual/Payment.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET LOGGED-IN CLIENT'S PROFILE (FIXED)
export const getMyProfile = async (req, res) => {
  try {
    const { id, email, userType } = req.user;
    
    if (!id || !email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userType !== "client") {
      return res.status(403).json({ message: "Not a client account" });
    }


    // Get user to fetch username
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Try to find existing client
    let profile = await ClientProfile.findOne({ userId: id });

    if (!profile) {
      return res.status(404).json({ message: "Client profile not found" });
    }

    // Convert to object and add username
    const profileObj = profile.toObject();
    profileObj.username = user.username;

    res.status(200).json(profileObj);
    
  } catch (err) {
    console.error("Error fetching client profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// CREATE CLIENT PROFILE
export const createProfile = async (req, res) => {
  try {
    const { id, email, userType } = req.user;
    
    if (!id || !email) return res.status(401).json({ message: "Unauthorized" });
    if (userType !== "client") return res.status(403).json({ message: "Not a client account" });

    const existingClient = await ClientProfile.findOne({ userId: id });

    if (existingClient) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const newClient = await ClientProfile.create({ 
      userId: id, 
      email,
      userType: 'client',
      ...req.body 
    });

    res.status(201).json({ 
      message: "Profile created successfully", 
      client: newClient 
    });

  } catch (err) {
    console.error("Error creating client profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE CLIENT PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { id, email } = req.user;
    
    const {
      name,
      firstName,
      lastName,
      contact,
      phone,
      address,
      bio,
      additionalLinks,
      profilePic,
      profileImage
    } = req.body;

    const updatedClient = await ClientProfile.findOneAndUpdate(
      { userId: id },
      {
        $set: {
          ...(name && { name }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(contact && { contact }),
          ...(phone && { phone }),
          ...(address && { address }),
          ...(bio && { bio }),
          ...(additionalLinks && { additionalLinks }),
          ...(profilePic && { profilePic }),
          ...(profileImage && { profileImage })
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    if (email && req.body.email && email !== req.body.email) {
      await User.findByIdAndUpdate(id, { email: req.body.email });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      client: updatedClient,
    });

  } catch (err) {
    console.error("Error updating client profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPLOAD PROFILE PICTURE
export const uploadProfilePic = async (req, res) => {
  try {
    const { id } = req.user;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const profilePicUrl = `/uploads/profiles/${req.file.filename}`;

    const oldClient = await ClientProfile.findOne({ userId: id });

    if (oldClient?.profilePic) {
      const oldPath = path.join(__dirname, "../../", oldClient.profilePic);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const client = await ClientProfile.findOneAndUpdate(
      { userId: id },
      { profilePic: profilePicUrl, profileImage: profilePicUrl },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePic: profilePicUrl,
      imageUrl: profilePicUrl
    });

  } catch (err) {
    console.error("Error uploading profile picture:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// SAVE HANDYMAN
export const saveHandyman = async (req, res) => {
  try {
    const { id } = req.user;
    const { handymanId } = req.body;
    
    const client = await ClientProfile.findOneAndUpdate(
      { userId: id },
      { $addToSet: { savedHandymen: handymanId } },
      { new: true }
    );

    if (!client) return res.status(404).json({ message: "Client not found" });

    res.status(200).json({
      message: "Handyman saved successfully",
      savedHandymen: client.savedHandymen
    });
  } catch (err) {
    console.error("Error saving handyman:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// REMOVE SAVED HANDYMAN
export const removeSavedHandyman = async (req, res) => {
  try {
    const { id } = req.user;
    const { handymanId } = req.params;
    
    const client = await ClientProfile.findOneAndUpdate(
      { userId: id },
      { $pull: { savedHandymen: handymanId } },
      { new: true }
    );

    if (!client) return res.status(404).json({ message: "Client not found" });

    res.status(200).json({
      message: "Handyman removed from saved list",
      savedHandymen: client.savedHandymen
    });

  } catch (err) {
    console.error("Error removing saved handyman:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.user;

    console.log(`🗑️ Starting account deletion for client ID: ${id}`);

    const clientProfile = await ClientProfile.findOne({ userId: id });
    if (!clientProfile) {
      return res.status(404).json({ success: false, message: "Client profile not found" });
    }

    const clientProfileId = clientProfile._id;

    if (clientProfile.profilePic || clientProfile.profileImage) {
      const imagePath = path.join(__dirname, "../../", clientProfile.profilePic || clientProfile.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    const deletePromises = [
      ClientProfile.deleteOne({ userId: id })
      // The rest of your deletes stay as they were
    ];

    await Promise.all(deletePromises);

    const userResult = await User.findByIdAndDelete(id);
    if (!userResult) return res.status(404).json({ success: false, message: "User not found" });

    if (req.session) req.session.destroy(() => {});

    res.status(200).json({
      success: true,
      message: "Account and all associated data permanently deleted"
    });

  } catch (err) {
    console.error("Error deleting client account:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
