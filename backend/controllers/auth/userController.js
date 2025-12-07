import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../../models/auth/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecret";
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

function sanitizeUser(userDoc) {
  const u = userDoc.toObject();
  delete u.password;
  return u;
}

// -------- Signup --------
export const signup = async (req, res) => {
  try {
    const { username, email, password, userType } = req.body;

    // validation
    if (!username || !email || !password || !userType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    // hash password with salt
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPass,
      userType,
      authProvider: "local",
    });

    // generate a session token (random string)
    const sessionToken = crypto.randomBytes(32).toString("hex");
    newUser.sessionToken = sessionToken;
    newUser.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await newUser.save();

    // create JWT (short-lived) 
    const token = jwt.sign({ 
      id: newUser._id, 
      email: newUser.email, 
      sessionToken 
    }, JWT_SECRET, { expiresIn: "15m" });

    res.status(201).json({
      message: "Signup successful",
      user: sanitizeUser(newUser),
      token,
      userType: newUser.userType, // ADDED: Send userType at top level
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// -------- Login --------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // compare password (for local users)
    if (!user.password) {
      return res.status(400).json({ message: "Use OAuth to login (no local password found)" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // create session token + sliding expiry
    const sessionToken = crypto.randomBytes(32).toString("hex");
    user.sessionToken = sessionToken;
    user.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await user.save();

    // create JWT token (short-lived)
    const token = jwt.sign({ 
      id: user._id, 
      email: user.email, 
      sessionToken 
    }, JWT_SECRET, { expiresIn: "15m" });

    res.json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
      userType: user.userType, // ADDED: Send userType at top level
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Logout helper — clears session token
export const logout = async (req, res) => {
  try {
    const userId = req.body.userId || req.user?.id;
    if (!userId) return res.status(400).json({ message: "UserId required to logout" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.sessionToken = undefined;
    user.sessionExpiresAt = undefined;
    await user.save();
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    const { id } = req.user;
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      userType: user.userType,
      displayName: user.displayName || null
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Update display name (for admins)
export const updateDisplayName = async (req, res) => {
  try {
    const { id } = req.user;
    const { displayName } = req.body;

    console.log('[updateDisplayName] Request received - User ID:', id, 'Display Name:', displayName);

    if (!id) {
      console.log('[updateDisplayName] No user ID found');
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(id);
    if (!user) {
      console.log('[updateDisplayName] User not found:', id);
      return res.status(404).json({ message: "User not found" });
    }

    // Only admins can set display names
    if (user.userType !== 'admin') {
      console.log('[updateDisplayName] User is not admin:', user.userType);
      return res.status(403).json({ message: "Only admins can set display names" });
    }

    user.displayName = displayName?.trim() || null;
    await user.save();

    console.log('[updateDisplayName] Display name updated successfully:', user.displayName);

    // Update all conversations where this admin is assigned
    try {
      const SupportConversation = (await import('../../models/mutual/SupportConversation.js')).default;
      const { getIO } = await import('../../socket.js');
      
      const conversations = await SupportConversation.find({ assignedTo: id });
      for (const conv of conversations) {
        conv.assignedAgentName = user.displayName || user.username || 'Support Agent';
        await conv.save();
        
        // Emit socket event to notify clients of the update
        const io = getIO();
        io.to(`support_${conv._id}`).emit("conversation_updated", {
          conversationId: conv._id,
          conversation: conv
        });
      }
      
      console.log(`[updateDisplayName] Updated ${conversations.length} conversations with new display name`);
    } catch (err) {
      console.error('[updateDisplayName] Error updating conversations:', err);
      // Don't fail the request if conversation update fails
    }

    res.json({
      message: "Display name updated successfully",
      displayName: user.displayName || null
    });
  } catch (err) {
    console.error('[updateDisplayName] Error:', err);
    res.status(500).json({ 
      message: "Server error: " + (err.message || "Unknown error"),
      error: err.message || "Unknown error"
    });
  }
};