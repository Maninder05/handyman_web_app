// handyPaymentService.js (ESM)
import Stripe from "stripe";
import HandyBooking from "../models/handyBookings.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const currency = process.env.CURRENCY || "cad";
const gstBps = Number(process.env.GST_RATE_BPS || 500) / 10000;           // 5%
const platformFeeBps = Number(process.env.PLATFORM_FEE_BPS || 1200) / 10000; // 12%

const calcTax = (n) => Math.round(n * gstBps);
const calcPlatformFee = (n) => Math.round(n * platformFeeBps);

/** 1) Create the order (no charge yet) */
export async function createOrder({
  bookingID,
  customerEmail,
  customerId,
  proId,
  proStripeAccountId,
  title,
  description,
  scheduledAt,
  subtotalAmount
}) {
  if (!subtotalAmount || subtotalAmount <= 0) throw new Error("subtotalAmount must be > 0");
  if (!proStripeAccountId) throw new Error("proStripeAccountId is required");

  const taxAmount = calcTax(subtotalAmount);
  const platformFeeAmount = calcPlatformFee(subtotalAmount);
  const totalAmount = subtotalAmount + taxAmount;

  const stripeCustomer = await stripe.customers.create({
    email: customerEmail,
    metadata: { appCustomerId: String(customerId) }
  });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const booking = await HandyBooking.create({
    bookingID,
    customerId,
    proId,
    proStripeAccountId,
    title,
    description,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    subtotalAmount,
    taxAmount,
    platformFeeAmount,
    totalAmount,
    currency,
    stripeCustomerId: stripeCustomer.id,
    status: "await_approval",
    expiresAt
  });

  return booking;
}

/** 2) Handyman accepts → create a manual-capture PI (bank HOLD) and return clientSecret */
export async function acceptOrderAndCreateAuthPI(bookingMongoId) {
  const b = await HandyBooking.findById(bookingMongoId);
  if (!b) throw new Error("Booking not found");

  // prevent accept after expiry
  if (b.status === "await_approval" && b.expiresAt && b.expiresAt < new Date()) {
    b.status = "declined";
    await b.save();
    throw new Error("Offer expired (auto-declined after 24h).");
  }

  // already accepted / has PI?
  if (b.paymentIntentId) return { clientSecret: b.clientSecret, booking: b };

  const pi = await stripe.paymentIntents.create({
    amount: b.totalAmount,
    currency: b.currency,
    capture_method: "manual",                        // 👈 AUTH now, CAPTURE later
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    customer: b.stripeCustomerId,
    description: `Handyman booking: ${b.title || "Service"}`,
    // Destination charge: funds routed to handyman when captured; app fee withheld
    transfer_data: { destination: b.proStripeAccountId },
    application_fee_amount: b.platformFeeAmount,
    on_behalf_of: b.proStripeAccountId,
    metadata: { bookingID: b.bookingID || String(b._id) }
  });

  b.paymentIntentId = pi.id;
  b.clientSecret = pi.client_secret;
  b.status = "accepted";
  await b.save();

  return { clientSecret: pi.client_secret, booking: b };
}

/** 3) Optional: mark work started */
export async function markInProgress(bookingMongoId) {
  const b = await HandyBooking.findByIdAndUpdate(
    bookingMongoId,
    { status: "in_progress" },
    { new: true }
  );
  if (!b) throw new Error("Booking not found");
  return b;
}

/** 4) Handyman marks done → wait client confirm */
export async function markDoneByHandyman(bookingMongoId) {
  const b = await HandyBooking.findByIdAndUpdate(
    bookingMongoId,
    { status: "await_client_confirm" },
    { new: true }
  );
  if (!b) throw new Error("Booking not found");
  return b;
}

/** 5) Client confirms → capture (finalize) the charge */
export async function capturePayment(bookingMongoId) {
  const b = await HandyBooking.findById(bookingMongoId);
  if (!b) throw new Error("Booking not found");
  if (!b.paymentIntentId) throw new Error("No PaymentIntent on this booking");

  const captured = await stripe.paymentIntents.capture(b.paymentIntentId);
  b.status = "captured"; // webhook will flip to paid_out/completed
  await b.save();
  return captured;
}

/** Utility: auto-decline if 24h passed */
export async function autoDeclineExpired(bookingMongoId) {
  const b = await HandyBooking.findById(bookingMongoId);
  if (!b) return null;
  if (b.status !== "await_approval") return b;
  if (b.expiresAt && b.expiresAt < new Date()) {
    b.status = "declined";
    await b.save();
  }
  return b;
}
