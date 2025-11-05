import HandyProfile from "../models/handyman/HandyDashboard.js";
import User from "../models/auth/User.js";

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
    
    const profile = await HandyProfile.findOneAndUpdate(
      { userId: id },
      { $pull: { certifications: { _id: certificationId } } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({
      message: "Certification deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting certification:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.user;
    
    const profile = await HandyProfile.findOneAndDelete({ userId: id });
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Delete user account too
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
    
    // TODO: Add admin authentication check here
    
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