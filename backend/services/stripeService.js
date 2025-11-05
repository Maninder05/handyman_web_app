// backend/services/stripe.client.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Stripe from "stripe";

// Load <backend>/.env no matter where Node is launched from
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

// Optional debug (uncomment if needed):
// console.log("[stripe.client] using .env at:", envPath);
// console.log("[stripe.client] STRIPE_SECRET_KEY present?", !!process.env.STRIPE_SECRET_KEY);

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey) {
  throw new Error(
    "Missing STRIPE_SECRET_KEY. Ensure backend/.env exists and contains STRIPE_SECRET_KEY=sk_test_... (Test mode)."
  );
}

export const stripe = new Stripe(apiKey); // use account default API version

export function verifyStripeEvent(req) {
  const sig = req.headers["stripe-signature"];
  if (!sig) throw new Error("Missing stripe-signature header");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  return stripe.webhooks.constructEvent(req.rawBody, sig, secret);
}
