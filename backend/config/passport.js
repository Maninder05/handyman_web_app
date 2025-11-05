import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/auth/User.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const API_URL = process.env.API_URL || "https://localhost:7000";

// Function to generate a random session token
const generateSessionToken = () => crypto.randomBytes(32).toString('hex');

// Session expiry (15 minutes from now)
const generateSessionExpiry = () => new Date(Date.now() + 15 * 60 * 1000);

// Only setup Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${API_URL}/api/users/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("Google profile didn't return email"), null);

          let user = await User.findOne({ email });

          if (!user) {
            user = new User({
              username: profile.displayName || email.split('@')[0],
              email,
              userType: 'customer',
              authProvider: 'google',
              oauthId: profile.id,
            });
          } else {
            user.authProvider = 'google';
            user.oauthId = profile.id;
          }

          // Set session token and expiry
          user.sessionToken = generateSessionToken();
          user.sessionExpiresAt = generateSessionExpiry();

          await user.save();

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.log('[passport] Google OAuth keys not found in .env. Skipping Google login.');
}

// Only setup Facebook OAuth if credentials are provided
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: `${API_URL}/api/users/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("Facebook profile didn't return email"), null);

          let user = await User.findOne({ email });

          if (!user) {
            user = new User({
              username: profile.displayName || email.split('@')[0],
              email,
              userType: 'customer',
              authProvider: 'facebook',
              oauthId: profile.id,
            });
          } else {
            user.authProvider = 'facebook';
            user.oauthId = profile.id;
          }

          // Set session token and expiry
          user.sessionToken = generateSessionToken();
          user.sessionExpiresAt = generateSessionExpiry();

          await user.save();

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.log('[passport] Facebook OAuth keys not found in .env. Skipping Facebook login.');
}

export default passport;