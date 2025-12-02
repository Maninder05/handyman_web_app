import HandyProfile from "../../models/handyman/HandyDashboard.js";
import User from "../../models/auth/User.js";
//import Orders from "../../models/handyman/Orders.js";
//import PostService from "../../models/handyman/PostService.js";
//import FindJob from "../../models/handyman/FindJob.js";
//import Reviews from "../../models/mutual/Reviews.js";
//import Messages from "../../models/mutual/Messages.js";
//import Notifications from "../../models/mutual/Notifications.js";
//import Payment from "../../models/mutual/Payment.js";
//import Bookings from "../../models/client/Bookings.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET LOGGED-IN HANDYMAN'S PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const { id, email } = req.user;
    
    if (!id || !email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Try to find existing handyman
    let profile = await HandyProfile.findOne({ userId: id });

    // Auto-create if doesn't exist
    if (!profile) {
      profile = await HandyProfile.create({
        userId: id,
        email,
        userType: 'handyman'
      });
    }

    res.status(200).json(profile);
    
  } catch (err) {
    console.error("Error fetching handyman profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// CREATE HANDYMAN PROFILE
export const createProfile = async (req, res) => {
  try {
    const { id, email } = req.user;
    
    if (!id || !email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const existingProfile = await HandyProfile.findOne({ userId: id });
    if (existingProfile) {
      return res.status(400).json({ message: "You already have a profile" });
    }

    const newProfile = await HandyProfile.create({
      userId: id,
      email,
      userType: 'handyman',
      ...req.body
    });
    
    res.status(201).json({
      message: "Profile created successfully",
      profile: newProfile
    });
  } catch (err) {
    console.error("Error creating profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE HANDYMAN PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    
    const {
      name,
      contact,
      phone,
      address,
      bio,
      additionalLinks,
      skills,
      services,
      planType,
      profilePic,
      profileImage
    } = req.body;

    const profile = await HandyProfile.findOneAndUpdate(
      { userId: id },
      {
        $set: {
          ...(name && { name }),
          ...(contact && { contact }),
          ...(phone && { phone }),
          ...(address && { address }),
          ...(bio && { bio }),
          ...(additionalLinks && { additionalLinks }),
          ...(skills && { skills }),
          ...(services && { services }),
          ...(planType && { planType }),
          ...(profilePic && { profilePic }),
          ...(profileImage && { profileImage })
        }
      },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      profile
    });
  } catch (err) {
    console.error("Error updating profile:", err);
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
    const oldProfile = await HandyProfile.findOne({ userId: id });
    
    // Delete old profile picture if exists
    if (oldProfile?.profilePic) {
      const oldPath = path.join(__dirname, "../../", oldProfile.profilePic);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log(`Deleted old profile picture: ${oldPath}`);
      }
    }

    const profile = await HandyProfile.findOneAndUpdate(
      { userId: id },
      {
        $set: {
          profilePic: profilePicUrl,
          profileImage: profilePicUrl
        }
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
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

// UPLOAD CERTIFICATION
export const uploadCertification = async (req, res) => {
  try {
    const { id } = req.user;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const certificationData = {
      fileName: req.file.originalname,
      fileUrl: `/uploads/certifications/${req.file.filename}`,
      uploadedAt: new Date()
    };

    const profile = await HandyProfile.findOneAndUpdate(
      { userId: id },
      { $push: { certifications: certificationData } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({
      message: "Certification uploaded successfully",
      certification: certificationData
    });
  } catch (err) {
    console.error("Error uploading certification:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE CERTIFICATION
export const deleteCertification = async (req, res) => {
  try {
    const { id } = req.user;
    const { certificationId } = req.params;
    
    // Get the certification to delete the file
    const profile = await HandyProfile.findOne({ userId: id });
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const certification = profile.certifications.id(certificationId);
    
    if (certification?.fileUrl) {
      const filePath = path.join(__dirname, "../../", certification.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted certification file: ${filePath}`);
      }
    }

    // Remove from database
    const updatedProfile = await HandyProfile.findOneAndUpdate(
      { userId: id },
      { $pull: { certifications: { _id: certificationId } } },
      { new: true }
    );

    res.status(200).json({
      message: "Certification deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting certification:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE ACCOUNT - PERMANENTLY DELETES EVERYTHING
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.user;
    
    console.log(`🗑️ Starting account deletion for handyman ID: ${id}`);

    // 1. Get handyman profile
    const handymanProfile = await HandyProfile.findOne({ userId: id });

    if (!handymanProfile) {
      return res.status(404).json({ 
        success: false, 
        message: "Handyman profile not found" 
      });
    }

    const handymanProfileId = handymanProfile._id;

    // 2. Delete profile image from filesystem
    if (handymanProfile.profilePic || handymanProfile.profileImage) {
      const imagePath = path.join(
        __dirname, 
        "../../", 
        handymanProfile.profilePic || handymanProfile.profileImage
      );
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(` Deleted profile image: ${imagePath}`);
      }
    }

    // 3. Delete certification files from filesystem
    if (handymanProfile.certifications && handymanProfile.certifications.length > 0) {
      for (const cert of handymanProfile.certifications) {
        if (cert.fileUrl) {
          const certPath = path.join(__dirname, "../../", cert.fileUrl);
          if (fs.existsSync(certPath)) {
            fs.unlinkSync(certPath);
            console.log(` Deleted certification: ${certPath}`);
          }
        }
      }
    }

    // 4. Delete all related data from MongoDB collections
    const deletePromises = [
      // Delete handyman profile
      HandyProfile.deleteOne({ userId: id }),
      
      // Delete all orders/bookings for this handyman
      Orders.deleteMany({ handymanId: handymanProfileId }),
      
      // Delete all services posted by this handyman
      PostService.deleteMany({ handymanId: handymanProfileId }),
      
      // Delete all job applications by this handyman
      FindJob.deleteMany({ handymanId: handymanProfileId }),
      
      // Delete bookings where handyman is involved
      Bookings.deleteMany({ handymanId: handymanProfileId }),
      
      // Delete all reviews received by this handyman
      Reviews.deleteMany({ handymanId: handymanProfileId }),
      
      // Delete all messages sent/received by this handyman
      Messages.deleteMany({ 
        $or: [
          { senderId: id }, 
          { receiverId: id }
        ] 
      }),
      
      // Delete all notifications for this handyman
      Notifications.deleteMany({ userId: id }),
      
      // Delete all payment records
      Payment.deleteMany({ handymanId: handymanProfileId })
    ];

    await Promise.all(deletePromises);
    console.log(` Deleted all related handyman data from database`);

    // 5. Delete user account
    const userResult = await User.findByIdAndDelete(id);

    if (!userResult) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    console.log(` Deleted user account: ${id}`);

    // 6. Destroy session
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

    console.log(` HANDYMAN ACCOUNT ${id} FULLY DELETED - ALL DATA REMOVED`);

  } catch (err) {
    console.error(" Error deleting handyman account:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during account deletion", 
      error: err.message 
    });
  }
};

// GET ALL HANDYMEN (for browsing/admin)
export const getAllHandymen = async (req, res) => {
  try {
    const { verified, planType, skills } = req.query;
    
    const filter = { isActive: true };
    
    if (verified !== undefined) {
      filter.verified = verified === 'true';
    }
    
    if (planType) {
      filter.planType = planType;
    }
    
    if (skills) {
      filter.skills = { $in: skills.split(',') };
    }

    const handymen = await HandyProfile.find(filter).sort({ createdAt: -1 });

    res.status(200).json(handymen);
  } catch (err) {
    console.error("Error fetching handymen:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// VERIFY HANDYMAN (Admin Only)
export const verifyHandyman = async (req, res) => {
  try {
    const { handymanId } = req.params;
    const { verified } = req.body;
    
    const profile = await HandyProfile.findByIdAndUpdate(
      handymanId,
      { $set: { verified } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({
      message: `Handyman ${verified ? 'verified' : 'unverified'} successfully`,
      profile
    });
  } catch (err) {
    console.error("Error verifying handyman:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};