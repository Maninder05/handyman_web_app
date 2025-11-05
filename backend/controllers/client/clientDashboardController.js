import ClientProfile from "../../models/client/ClientDashboard.js";
import User from "../../models/auth/User.js";

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

    const existingClient = await Client.findOne({ userId: id });
    
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

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.user;
    
    // Delete client profile
    const client = await ClientProfile.findOneAndDelete({ userId: id });
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Delete user account
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};