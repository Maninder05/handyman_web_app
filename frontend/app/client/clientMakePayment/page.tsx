// frontend/app/clientPay/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:7000";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function ClientPayPage() {
  const sp = useSearchParams();
  const offerId = sp.get("offerId") || "";
  const [clientSecret, setClientSecret] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!offerId) return;
      try {
        const res = await fetch(`${API_BASE}/api/client-pay/create-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerId }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!data.clientSecret) throw new Error("No clientSecret returned");
        setClientSecret(data.clientSecret);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, [offerId]);

  const options = useMemo(() => ({ clientSecret }), [clientSecret]);

  return (
    <div>
      <h2>Client Payment</h2>
      <p>Offer: <code>{offerId || "(none)"}</code></p>
      {err && <p style={{ color: "red" }}>{err}</p>}
      {!offerId && <p>Add <code>?offerId=YOUR_OFFER_ID</code> to the URL.</p>}
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </div>
  );
}

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [msg, setMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setMsg(null);
    setStatus(null);

    // 1) Confirm the payment
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {}, // keep minimal; no redirects
      redirect: "if_required",
    });

    if (error) {
      setMsg(error.message || "Payment failed");
      setLoading(false);
      return;
    }

    // 2) Ask Stripe for the final status using the clientSecret
    const piRes = await stripe.retrievePaymentIntent(clientSecret);
    const pi = piRes.paymentIntent;

    if (pi) {
      setStatus(pi.status); // e.g., 'succeeded', 'processing', 'requires_action'
      if (pi.status === "succeeded") setMsg("Paid ✅");
      else if (pi.status === "processing") setMsg("Processing… (bank confirming)");
      else if (pi.status === "requires_action") setMsg("Action required (3DS)");
      else setMsg(`Status: ${pi.status}`);
    } else {
      setMsg("Could not retrieve payment status.");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={loading} style={{ marginTop: 8 }}>
        {loading ? "Processing…" : "Pay Now"}
      </button>
      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
      {status && <p style={{ fontSize: 12, opacity: 0.8 }}>Stripe status: {status}</p>}
    </form>
  );
}
