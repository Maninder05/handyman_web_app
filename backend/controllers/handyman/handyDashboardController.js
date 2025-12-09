import HandyProfile from "../../models/handyman/HandyDashboard.js";
import User from "../../models/auth/User.js";
import HandymanSubscription from "../../models/mutual/HandymanSubscriptionModel.js";
import mongoose from "mongoose";
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

   // GET LOGGED-IN HANDYMAN PROFILE (FIXED)
export const getMyProfile = async (req, res) => {
  try {
    const { id, email, userType } = req.user;
    
    if (!id || !email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userType !== "handyman") {
      return res.status(403).json({ message: "Not a handyman account" });
    }

    // Get user to fetch username
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify userType is handyman
    if (user.userType !== 'handyman') {
      return res.status(403).json({ message: "Only handymen can access this endpoint" });
    }

    // Try to find existing handyman
    let profile = await HandyProfile.findOne({ userId: id });

    // Auto-create profile if it doesn't exist (needed for new accounts)
    if (!profile) {
      profile = await HandyProfile.create({
        userId: id,
        email,
        name: user.username || email.split('@')[0], // Use username or email prefix as name
        userType: 'handyman'
      });
    }

    // Convert to object and add username
    const profileObj = profile.toObject();
    profileObj.username = user.username;
    // Ensure userType is set (in case profile doesn't have it)
    if (!profileObj.userType) {
      profileObj.userType = user.userType || 'handyman';
    }

    // Fetch subscription info if it exists
    try {
      // Convert id to ObjectId if needed
      const handymanObjectId = mongoose.Types.ObjectId.isValid(id) 
        ? new mongoose.Types.ObjectId(id) 
        : id;
      
      console.log(`🔵 Looking up subscription for handyman: ${id} (ObjectId: ${handymanObjectId})`);
      
      const subscription = await HandymanSubscription.findOne({ handyman: handymanObjectId });
      console.log(`Subscription lookup for handyman ${id}:`, subscription ? {
        planType: subscription.planType,
        status: subscription.status,
        handyman: subscription.handyman,
        _id: subscription._id
      } : 'No subscription found');
      
      if (subscription) {
        // Accept active, trialing, or incomplete subscriptions (new subscriptions might be incomplete initially)
        const validStatuses = ['active', 'trialing', 'incomplete'];
        if (validStatuses.includes(subscription.status)) {
          // Capitalize first letter of planType (basic -> Basic, standard -> Standard, premium -> Premium)
          const planType = subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1);
          profileObj.planType = planType;
          profileObj.subscriptionStatus = subscription.status;
          profileObj.subscriptionEndDate = subscription.endDate;
          console.log(`Setting planType to: ${planType} (status: ${subscription.status})`);
        } else {
          // Subscription exists but is not active - don't set planType
          console.log(`Subscription found but status is '${subscription.status}', no plan assigned`);
          // Don't set planType - user has no active plan
        }
      } else {
        // No subscription found - user has no plan
        console.log('No subscription found - user has no active plan');
        // Don't set planType - user has no active plan
      }
    } catch (subError) {
      console.error("Error fetching subscription:", subError);
      // Don't set planType if subscription fetch fails - user has no active plan
    }

    res.status(200).json(profileObj);
    
  } catch (err) {
    console.error("Error fetching handyman profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/*============================================================================
    CREATE HANDYMAN PROFILE
============================================================================*/
export const createProfile = async (req, res) => {
  try {
    const { id, email, userType } = req.user;
    
    if (!id || !email) return res.status(401).json({ message: "Unauthorized" });
    if (userType !== "handyman") return res.status(403).json({ message: "Not a handyman account" });

    const existingProfile = await HandyProfile.findOne({ userId: id });
    if (existingProfile) {
      return res.status(400).json({ message: "You already have a profile" });
    }

    const newProfile = await HandyProfile.create({
      userId: id,
      email,
      userType: "handyman",
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

/*============================================================================
    UPDATE HANDYMAN PROFILE (unchanged)
============================================================================*/
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

/*============================================================================
    UPLOAD PROFILE PICTURE (unchanged)
============================================================================*/
export const uploadProfilePic = async (req, res) => {
  try {
    const { id } = req.user;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const profilePicUrl = `/uploads/profiles/${req.file.filename}`;

    const oldProfile = await HandyProfile.findOne({ userId: id });
    
    if (oldProfile?.profilePic) {
      const oldPath = path.join(__dirname, "../../", oldProfile.profilePic);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
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

/*============================================================================
    UPLOAD CERTIFICATION (unchanged)
============================================================================*/
export const uploadCertification = async (req, res) => {
  try {
    const { id } = req.user;
    
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

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

/*============================================================================
    DELETE CERTIFICATION (unchanged)
============================================================================*/
export const deleteCertification = async (req, res) => {
  try {
    const { id } = req.user;
    const { certificationId } = req.params;
    
    const profile = await HandyProfile.findOne({ userId: id });
    
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const certification = profile.certifications.id(certificationId);
    
    if (certification?.fileUrl) {
      const filePath = path.join(__dirname, "../../", certification.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await HandyProfile.findOneAndUpdate(
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

/*============================================================================
    DELETE ACCOUNT (unchanged except auto-create removal)
============================================================================*/
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.user;
    
    console.log(`🗑️ Starting account deletion for handyman ID: ${id}`);

    const handymanProfile = await HandyProfile.findOne({ userId: id });

    if (!handymanProfile) {
      return res.status(404).json({ 
        success: false, 
        message: "Handyman profile not found" 
      });
    }

    const handymanProfileId = handymanProfile._id;

    if (handymanProfile.profilePic || handymanProfile.profileImage) {
      const imagePath = path.join(__dirname, "../../", handymanProfile.profilePic || handymanProfile.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    if (handymanProfile.certifications?.length > 0) {
      for (const cert of handymanProfile.certifications) {
        if (cert.fileUrl) {
          const certPath = path.join(__dirname, "../../", cert.fileUrl);
          if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
        }
      }
    }

    const deletePromises = [
      HandyProfile.deleteOne({ userId: id })
    ];

    await Promise.all(deletePromises);

    const userResult = await User.findByIdAndDelete(id);

    if (!userResult) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.session) {
      req.session.destroy(() => {});
    }

    res.status(200).json({
      success: true,
      message: "Account and all associated data permanently deleted"
    });

  } catch (err) {
    console.error("Error deleting handyman account:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during account deletion", 
      error: err.message 
    });
  }
};

/*============================================================================
    GET ALL HANDYMEN (unchanged)
============================================================================*/
export const getAllHandymen = async (req, res) => {
  try {
    const { verified, planType, skills } = req.query;
    
    const filter = { isActive: true };
    
    if (verified !== undefined) filter.verified = verified === "true";
    if (planType) filter.planType = planType;
    if (skills) filter.skills = { $in: skills.split(",") };

    const handymen = await HandyProfile.find(filter).sort({ createdAt: -1 });

    res.status(200).json(handymen);
  } catch (err) {
    console.error("Error fetching handymen:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/*============================================================================
    VERIFY HANDYMAN (unchanged)
============================================================================*/
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
