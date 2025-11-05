import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // optional for OAuth users
    userType: { type: String, enum: ["customer", "handyman"], required: true }, // BACK TO "customer"
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