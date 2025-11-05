import express from "express";
import { signup, login, logout } from "../controllers/auth/userController.js";
import { body } from "express-validator";
import validate from "../middleware/validate.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import crypto from "crypto";

//Example of authSession implementation over routes for protecting sensitive pages after token expires over website
// import authSession from '../middleware/authSession.js';
// router.get("/dashboard", authSession, (req, res) => {
//   res.json({ ok: true, user: req.user });
// });

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "mysecret";
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Signup validation rules
router.post(
  "/signup",
  [
    body("username")
      .notEmpty().withMessage("Username is required")
      .isLength({ min: 3 }).withMessage("Username must be at least 3 chars"),
    body("email")
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email format"),
    body("password")
      .notEmpty().withMessage("Password is required")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
    body("userType")
      .notEmpty().withMessage("User type is required")
      .isIn(["customer", "handyman"]).withMessage("User type must be customer or handyman"),
  ],
  validate,
  signup
);

// Login validation rules
router.post(
  "/login",
  [
    body("email").notEmpty().withMessage("Email required").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  validate,
  login
);

// Logout
router.post("/logout", logout);

// ----------------- OAuth routes (Google + Facebook) -----------------
// Only setup Google OAuth routes if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Start Google OAuth
  router.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));

  // Google callback
  router.get('/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_URL}/signup?oauth=fail` }),
    async (req, res) => {
      // req.user set by passport verify callback
      try {
        const user = req.user;
        // assign session token and expiry
        const sessionToken = crypto.randomBytes(32).toString("hex");
        user.sessionToken = sessionToken;
        user.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
        await user.save();

        const token = jwt.sign({ id: user._id, sessionToken }, JWT_SECRET, { expiresIn: "15m" });
        const type = user.userType; // "customer" or "handyman"
        // redirect to frontend with token (frontend will capture it from query params)
        return res.redirect(`${CLIENT_URL}/signup?token=${token}&userType=${type}&mode=login`);
      } catch (err) {
        console.error("OAuth callback error:", err);
        return res.redirect(`${CLIENT_URL}/signup?oauth=error`);
      }
    }
  );
  console.log('[routes] Google OAuth routes registered');
} else {
  console.log('[routes] Google OAuth routes skipped - credentials missing');
}

// Only setup Facebook OAuth routes if credentials are provided
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  // Start Facebook OAuth
  router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

  // Facebook callback
  router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: `${CLIENT_URL}/signup?oauth=fail` }),
    async (req, res) => {
      try {
        const user = req.user;
        const sessionToken = crypto.randomBytes(32).toString("hex");
        user.sessionToken = sessionToken;
        user.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
        await user.save();

        const token = jwt.sign({ id: user._id, sessionToken }, JWT_SECRET, { expiresIn: "15m" });
        const type = user.userType; // "customer" or "handyman"
        // redirect to frontend with token (frontend will capture it from query params)
        return res.redirect(`${CLIENT_URL}/signup?token=${token}&userType=${type}&mode=login`);
      } catch (err) {
        console.error("OAuth callback error:", err);
        return res.redirect(`${CLIENT_URL}/signup?oauth=error`);
      }
    }
  );
  console.log('[routes] Facebook OAuth routes registered');
} else {
  console.log('[routes] Facebook OAuth routes skipped - credentials missing');
}


export default router;