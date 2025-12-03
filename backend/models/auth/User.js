import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // optional for OAuth users
    userType: { type: String, enum: ["customer", "handyman", "admin"], required: true }, // customer, handyman, or admin

    userType: { type: String, enum: ["client", "handyman"], required: true }, // BACK TO "client"

    stripeCustomerId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, default: "local" }, // local, google, facebook

    // Session / OAuth
    sessionToken: { type: String },
    sessionExpiresAt: { type: Date },
    oauthId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);