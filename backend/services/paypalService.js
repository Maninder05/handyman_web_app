// backend/services/paypal.client.js
const isLive = (process.env.PAYPAL_ENV || "sandbox").toLowerCase() === "live";
export const PAYPAL_API_BASE = isLive
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const cid = process.env.PAYPAL_CLIENT_ID;
const secret = process.env.PAYPAL_CLIENT_SECRET;
if (!cid || !secret) {
  console.warn("[paypal] Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET");
}

async function getAccessToken() {
  const auth = Buffer.from(`${cid}:${secret}`).toString("base64");
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[paypal] oauth failed", res.status, text);
    throw new Error(`[paypal] oauth failed ${res.status}`);
  }
  const data = await res.json();
  return data.access_token;
}

export async function getPaypalSubscription(subId) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[paypal] get sub failed", res.status, text);
    throw new Error(`[paypal] get sub ${subId} failed ${res.status}`);
  }
  return res.json();
}
