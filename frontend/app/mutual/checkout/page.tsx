"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  PayPalScriptProvider,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";

// ====================================================================
// ⚙️ CONFIGURATION
// ====================================================================
const PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const EXPRESS_BASE_URL = "http://localhost:7000";

const CARD_API_ENDPOINT = `${EXPRESS_BASE_URL}/api/subscriptions/subscribe-inline`;
const PAYPAL_API_ENDPOINT = `${EXPRESS_BASE_URL}/api/subscriptions/subscribe-paypal`;

const stripePromise = PUBLIC_KEY ? loadStripe(PUBLIC_KEY) : null;

// ====================================================================
// 💡 PLAN DATA
// ====================================================================
const PLANS = [
  { name: "Basic", monthly: 10, yearly: 96 },
  { name: "Seasonal", monthly: 12, yearly: 108 },
  { name: "Pro", monthly: 15, yearly: 144 },
];
const TAX_RATE = { gst: 0.05, pst: 0 };

const getPlanData = (planName: string, billing: "monthly" | "yearly") => {
  const plan = PLANS.find((p) => p.name === planName);
  if (!plan) return null;

  const base = plan[billing];
  const gst = base * TAX_RATE.gst;
  const pst = base * TAX_RATE.pst;
  const total = base + gst + pst;

  return {
    plan,
    price: base,
    gst,
    pst,
    total,
    unit: billing === "monthly" ? "Month" : "Year",
  };
};

// ====================================================================
// 🧾 ORDER SUMMARY (Sticky Left)
// 🧭 HEADER
// ====================================================================
const Header = () => (
  <header className="w-full bg-white text-gray-900 py-4 px-6 flex items-center justify-center shadow-md border-b border-gray-100 fixed top-0 z-50">
    <div className="flex items-center space-x-3 max-w-6xl w-full justify-between">
      <div className="flex items-center space-x-2">
        <img src="/images/handymanNovember.png" alt="Handyman Logo" className="h-7 w-7" />
        <span className="text-lg font-bold tracking-wider">PAYMENT</span>
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-500 font-semibold">
        <Lock className="w-4 h-4 text-gray-500" />
        <span>Secure Checkout</span>
      </div>
    </div>
  </header>
);

// ====================================================================
// 🧾 ORDER SUMMARY
// ====================================================================
const OrderSummary = ({ details }: { details: ReturnType<typeof getPlanData> }) => {
  if (!details) return null;
  return (
    <div className="sticky top-8 bg-white p-8 rounded-2xl shadow-md border border-gray-200 h-fit">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
        Order Summary
      </h2>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          {details.plan.name} Plan
        </h3>
        <p className="text-gray-500 text-sm">{details.unit} Subscription</p>
      </div>

      <div className="space-y-3 text-gray-700">
        <div className="flex justify-between">
          <span>Base Price</span>
          <span>${details.price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>GST (5%)</span>
          <span>${details.gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>PST (0%)</span>
          <span>${details.pst.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t mt-6 pt-4 flex justify-between items-center text-xl font-semibold text-green-700">
        <span>Total</span>
        <span>CAD ${details.total.toFixed(2)}</span>
      </div>
    </div>
  );
};

// ====================================================================
// 👤 ACCOUNT INFO
// ====================================================================
const AccountSection = ({ user }: { user: { name: string; email: string } | null }) => {
  if (!user) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
      <div className="bg-green-50 p-4 rounded-xl border border-green-200">
        <div className="flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="font-medium text-gray-800">{user.name || "Handyman"}</span>
        </div>
        <p className="text-sm text-gray-600 ml-8">{user.email}</p>
      </div>
      <p className="text-sm text-gray-500 mt-3">
        This purchase will be linked to your account.{" "}
        <Link href="/" className="text-blue-600 hover:underline">
          Not you? Log out
        </Link>
        .
      </p>
    </div>
  );
};

// ====================================================================
// 💳 STRIPE CARD FORM
// ====================================================================
const StripeCardForm = ({ selectedPriceId, details, userEmail }: { selectedPriceId: string; details: any; userEmail: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-3 focus:border-black focus:ring-0 text-gray-900 placeholder-gray-400";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    try {
      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) throw new Error("Card element not found.");

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumber,
        billing_details: {
          name,
          email: userEmail,
          address: { postal_code: postalCode },
        },
      });

      if (pmError) throw new Error(pmError.message || "Card error");

      // Get authentication token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to complete this purchase. Please log in and try again.");
      }

      const res = await fetch(CARD_API_ENDPOINT, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId: selectedPriceId,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Server error");

      router.push(`/mutual/success?plan=${details?.plan.name}&method=Card`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Name on card *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Full name as shown on card"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Card number *
        </label>
        <div className="border border-gray-300 rounded-md px-3 py-3 focus-within:border-black">
          <CardNumberElement
            options={{
              style: {
                base: { fontSize: "16px", color: "#111" },
              },
            }}
          />
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            MM/YY *
          </label>
          <div className="border border-gray-300 rounded-md px-3 py-3 focus-within:border-black">
            <CardExpiryElement options={{ style: { base: { fontSize: "16px" } } }} />
          </div>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Security Code *
          </label>
          <div className="border border-gray-300 rounded-md px-3 py-3 focus-within:border-black">
            <CardCvcElement options={{ style: { base: { fontSize: "16px" } } }} />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Postal Code *
        </label>
        <input
          type="text"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          className={inputClass}
          placeholder="e.g., T2P 1J9"
          required
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        disabled={loading || !stripe}
        className="w-full py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-black transition disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...
          </span>
        ) : (
          "Place Order"
        )}
      </button>
    </form>
  );
};

// ====================================================================
// 💰 PAYPAL BLOCK
// ====================================================================
const PayPalBlock = ({ selectedPriceId, details }: any) => {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleApprove = async (data: any, actions: any) => {
    const order = await actions.order.capture();

    // Get authentication token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("You must be logged in to complete this purchase. Please log in and try again.");
    }

    const res = await fetch(PAYPAL_API_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        orderId: order.id,
        planName: details.plan.name,
      }),
    });

    if (res.ok) {
      router.push(`/mutual/success?plan=${details.plan.name}&method=PayPal`);
    } else setError("Payment confirmation failed.");
  };

  return (
    <div className="mt-6">
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <PayPalButtons
        style={{ layout: "vertical", color: "gold" }}
        createOrder={(data, actions) =>
          actions.order.create({
            purchase_units: [
              {
                amount: { value: details.total.toFixed(2), currency_code: "CAD" },
                custom_id: selectedPriceId,
              },
            ],
          })
        }
        onApprove={handleApprove}
        onError={(err) => setError(err.message)}
      />
    </div>
  );
};

// ====================================================================
// 💳 PAYMENT METHODS (No Preselection)
// ====================================================================
const PaymentMethods = ({ selectedPriceId, details, userEmail }: { selectedPriceId: string; details: any; userEmail: string }) => {
  const [method, setMethod] = useState<"card" | "paypal" | null>(null);

  const activeStyle =
    "border-2 border-black shadow-sm transition duration-150";
  const inactiveStyle =
    "border border-gray-300 hover:border-black/50 transition duration-150";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        How would you like to pay?
      </h2>

      <div className="space-y-3">
        {/* Credit or Debit Card */}
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={`w-full flex items-center justify-between px-4 py-4 rounded-lg bg-white ${
            method === "card" ? activeStyle : inactiveStyle
          }`}
        >
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              checked={method === "card"}
              onChange={() => setMethod("card")}
              className="accent-black h-4 w-4"
            />
            <CreditCard className="w-5 h-5 text-gray-800" />
            <span className="font-medium text-gray-800 text-lg">Card</span>
          </div>

          <div className="flex space-x-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
              alt="Visa"
              className="h-5"
            />
            <img
              src="/images/ma_symbol.svg"
              alt="Mastercard"
              className="h-5"
            />
          </div>
        </button>

        {/* PayPal */}
        <button
          type="button"
          onClick={() => setMethod("paypal")}
          className={`w-full flex items-center justify-between px-4 py-4 rounded-lg bg-white ${
            method === "paypal" ? activeStyle : inactiveStyle
          }`}
        >
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              checked={method === "paypal"}
              onChange={() => setMethod("paypal")}
              className="accent-black h-4 w-4"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
              alt="PayPal"
              className="h-6"
            />
          </div>
        </button>
      </div>

      {method === "card" && (
        <div className="mt-6">
          <Elements stripe={stripePromise}>
            <StripeCardForm selectedPriceId={selectedPriceId} details={details} userEmail={userEmail} />
          </Elements>
        </div>
      )}

      {method === "paypal" && (
        <div className="mt-6">
          <PayPalScriptProvider
            options={{ clientId: PAYPAL_CLIENT_ID, currency: "CAD" }}
          >
            <PayPalBlock selectedPriceId={selectedPriceId} details={details} />
          </PayPalScriptProvider>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// 🧩 MAIN PAGE
// ====================================================================
export default function CheckoutPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const planName = sp.get("planName") || "";
  const billing = (sp.get("billing") as "monthly" | "yearly") || "monthly";
  const selectedPriceId = sp.get("priceId") || "";
  const details = getPlanData(planName, billing);

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You must be logged in to access this page.");
          setTimeout(() => router.push("/signup?mode=login"), 2000);
          return;
        }

        // Fetch handyman profile
        const res = await fetch(`${EXPRESS_BASE_URL}/api/handymen/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
          if (res.status === 401) {
            localStorage.removeItem("token");
            setError("Your session has expired. Please log in again.");
            setTimeout(() => router.push("/signup?mode=login"), 2000);
            return;
          }
          if (res.status === 403) {
            setError(errorData.message || "Only handymen can access this page.");
            setTimeout(() => router.push("/"), 2000);
            return;
          }
          throw new Error(errorData.message || `Failed to fetch user profile (${res.status})`);
        }

        const profileData = await res.json();
        
        // Verify user is a handyman (additional check)
        if (profileData.userType !== "handyman") {
          setError("Only handymen can purchase memberships.");
          setTimeout(() => router.push("/"), 2000);
          return;
        }

        setUser({
          name: profileData.name || profileData.username || "Handyman",
          email: profileData.email,
        });
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError(err.message || "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  if (!details) {
    return (
      <div className="p-10 text-center text-red-600">
        Invalid plan. Return to{" "}
        <Link href="/mutual/membership" className="text-blue-600 underline">
          membership page
        </Link>
        .
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/mutual/membership" className="text-blue-600 underline">
            Return to membership page
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4">
      <main className="max-w-6xl w-full grid md:grid-cols-5 gap-10">
        <div className="md:col-span-3">
          <OrderSummary details={details} />
        </div>
        <div className="md:col-span-2 space-y-8">
          <AccountSection user={user} />
          <PaymentMethods selectedPriceId={selectedPriceId} details={details} userEmail={user.email} />
        </div>
      </main>
    </div>
  );
}