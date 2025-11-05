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
      userType: newUser.userType, // ✅ ADDED: Send userType at top level
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
      userType: user.userType, // ✅ ADDED: Send userType at top level
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// (Optional) Logout helper — clears session token
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