// backend/models/subscription.model.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const SubscriptionSchema = new Schema(
  {
    // app fields
    userId: { type: Schema.Types.ObjectId, ref: "user", index: true },
    provider: { type: String, enum: ["stripe", "paypal"], default: "stripe", index: true },
    planName: { type: String },
    billingInterval: { type: String, enum: ["monthly", "yearly"] },
    bookingId: { type: String, index: true },
    status: { type: String },

    // Stripe
    stripeCustomerId: { type: String, index: true },
    stripeSubscriptionId: { type: String },

    // PayPal
    paypalSubscriptionId: { type: String },
    paypalPlanId: { type: String },
    payerId: { type: String },
    payerEmail: { type: String },

    // periods
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
  },
  { timestamps: true }
);

// helpful compound
SubscriptionSchema.index({ provider: 1, status: 1, updatedAt: -1 });

// UNIQUE only when the field is present (string)
SubscriptionSchema.index(
  { stripeSubscriptionId: 1 },
  { unique: true, partialFilterExpression: { stripeSubscriptionId: { $type: "string" } } }
);
SubscriptionSchema.index(
  { paypalSubscriptionId: 1 },
  { unique: true, partialFilterExpression: { paypalSubscriptionId: { $type: "string" } } }
);

export default model("Subscription", SubscriptionSchema);
