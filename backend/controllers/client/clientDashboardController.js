import ClientProfile from "../../models/client/ClientDashboard.js";
import User from "../../models/auth/User.js";
import Bookings from "../../models/client/Bookings.js";
import PostJob from "../../models/client/PostJob.js";
import Reviews from "../../models/mutual/Reviews.js";
import Messages from "../../models/mutual/Messages.js";
import Notifications from "../../models/mutual/Notifications.js";
import Payment from "../../models/mutual/Payment.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET LOGGED-IN CLIENT'S PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const { id, email } = req.user;
    
    if (!id || !email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Try to find existing client
    let profile = await ClientProfile.findOne({ userId: id });

    // Auto-create if doesn't exist
    if (!profile) {
      profile = await ClientProfile.create({ 
        userId: id, 
        email,
        userType:'customer'
      });
    }

    res.status(200).json(profile);
    
  } catch (err) {
    console.error("Error fetching client profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// CREATE CLIENT PROFILE
export const createProfile = async (req, res) => {
  try {
    const { id, email } = req.user;
    
    if (!id || !email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const existingClient = await ClientProfile.findOne({ userId: id });
    
    if (existingClient) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const newClient = await ClientProfile.create({ 
      userId: id, 
      email,
      userType: 'customer',
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

    // Update Client Profile
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

    // Also update email in User model if changed
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

    // Get old profile pic to delete it
    const oldClient = await ClientProfile.findOne({ userId: id });
    
    // Delete old profile picture if exists
    if (oldClient?.profilePic) {
      const oldPath = path.join(__dirname, "../../", oldClient.profilePic);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log(`Deleted old profile picture: ${oldPath}`);
      }
    }

    const client = await ClientProfile.findOneAndUpdate(
      { userId: id },
      { 
        $set: { 
          profilePic: profilePicUrl,
          profileImage: profilePicUrl
        } 
      },
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

// SAVE/FAVORITE HANDYMAN
export const saveHandyman = async (req, res) => {
  try {
    const { id } = req.user;
    const { handymanId } = req.body;
    
    const client = await ClientProfile.findOneAndUpdate(
      { userId: id },
      { $addToSet: { savedHandymen: handymanId } },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

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

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({
      message: "Handyman removed from saved list",
      savedHandymen: client.savedHandymen
    });
  } catch (err) {
    console.error("Error removing saved handyman:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE ACCOUNT - PERMANENTLY DELETES EVERYTHING
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.user;
    
    console.log(`🗑️ Starting account deletion for client ID: ${id}`);

    // 1. Get client profile to access profile image and _id
    const clientProfile = await ClientProfile.findOne({ userId: id });

    if (!clientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: "Client profile not found" 
      });
    }

    const clientProfileId = clientProfile._id;

    // 2. Delete profile image from filesystem
    if (clientProfile.profilePic || clientProfile.profileImage) {
      const imagePath = path.join(
        __dirname, 
        "../../", 
        clientProfile.profilePic || clientProfile.profileImage
      );
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(` Deleted profile image: ${imagePath}`);
      }
    }

    // 3. Delete all related data from MongoDB collections
    const deletePromises = [
      // Delete client profile
      ClientProfile.deleteOne({ userId: id }),
      
      // Delete all bookings by this client
      Bookings.deleteMany({ clientId: clientProfileId }),
      
      // Delete all job posts by this client
      PostJob.deleteMany({ clientId: clientProfileId }),
      
      // Delete all reviews given by this client
      Reviews.deleteMany({ clientId: clientProfileId }),
      
      // Delete all messages sent/received by this client
      Messages.deleteMany({ 
        $or: [
          { senderId: id }, 
          { receiverId: id }
        ] 
      }),
      
      // Delete all notifications for this client
      Notifications.deleteMany({ userId: id }),
      
      // Delete all payment records
      Payment.deleteMany({ clientId: clientProfileId })
    ];

    await Promise.all(deletePromises);
    console.log(`Deleted all related client data from database`);

    // 4. Delete user account
    const userResult = await User.findByIdAndDelete(id);

    if (!userResult) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    console.log(` Deleted user account: ${id}`);

    // 5. Destroy session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Account and all associated data permanently deleted"
    });

    console.log(` CLIENT ACCOUNT ${id} FULLY DELETED - ALL DATA REMOVED`);

  } catch (err) {
    console.error(" Error deleting client account:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during account deletion", 
      error: err.message 
    });
  }
};