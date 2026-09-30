import crypto from "node:crypto";

// Cashfree Payment Gateway integration. With CASHFREE_APP_ID/CASHFREE_SECRET_KEY set, real Cashfree (sandbox or production) is used.
// Without keys (dev only) a local simulator stands in: same order ids, HMAC-verified payments.

export const SIM_SECRET = "zarilane_local_simulator_secret";
const API_VERSION = "2023-08-01";

export function gateway() {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  if (appId && secret) {
    const env = process.env.CASHFREE_ENV?.trim() === "production" ? ("production" as const) : ("sandbox" as const);
    return { mode: "cashfree" as const, env, appId, secret };
  }
  if (process.env.NODE_ENV !== "production" || process.env.PAYMENT_SIMULATOR === "true")
    return { mode: "simulator" as const, env: "sandbox" as const, appId: "", secret: SIM_SECRET };
  throw new Error("Cashfree keys are not configured");
}

const base = (env: "sandbox" | "production") => (env === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg");

async function cf<T>(path: string, init?: { method: "POST"; body: object }): Promise<T> {
  const g = gateway();
  const res = await fetch(base(g.env) + path, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json", "x-api-version": API_VERSION, "x-client-id": g.appId, "x-client-secret": g.secret },
    body: init && JSON.stringify(init.body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Cashfree request failed");
  return data as T;
}

/** Cashfree order ids are unique per attempt: [A-Za-z0-9_-], max 50 chars. `amountRupees` is in whole rupees. */
export async function createCashfreeOrder(receipt: string, amountRupees: number, customer: { id: string; phone: string }) {
  const id = `${receipt}_${crypto.randomBytes(4).toString("hex")}`;
  if (gateway().mode === "simulator") return { id, sessionId: "session_sim_" + id };
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const order = await cf<{ payment_session_id: string }>("/orders", {
    method: "POST",
    body: {
      order_id: id,
      order_amount: amountRupees,
      order_currency: "INR",
      customer_details: { customer_id: customer.id, customer_phone: customer.phone },
      // Webhook safety net; Cashfree only accepts https URLs.
      ...(site?.startsWith("https://") && { order_meta: { notify_url: `${site.replace(/\/$/, "")}/api/webhooks/cashfree` } }),
    },
  });
  return { id, sessionId: order.payment_session_id };
}

/** Server-side verification: the successful payment for this Cashfree order, or null if not paid (yet). */
export async function fetchPaidPayment(orderId: string) {
  const payments = await cf<{ payment_status: string; cf_payment_id: string | number; payment_amount: number }[]>(`/orders/${encodeURIComponent(orderId)}/payments`);
  const ok = payments.find((p) => p.payment_status === "SUCCESS");
  return ok ? { id: String(ok.cf_payment_id), amountPaise: Math.round(ok.payment_amount * 100) } : null;
}

export function signPayment(orderId: string, paymentId: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Simulator only: real payments are verified by asking Cashfree (fetchPaidPayment). */
export function verifySignature(orderId: string, paymentId: string, signature: string, secret = SIM_SECRET) {
  return safeEqual(signPayment(orderId, paymentId, secret), signature);
}

/** Cashfree signs `timestamp + rawBody` with the API secret key (base64 HMAC-SHA256). */
export function verifyWebhook(rawBody: string, timestamp: string, signature: string, secret = process.env.CASHFREE_SECRET_KEY?.trim()) {
  if (!secret || !timestamp) return false;
  return safeEqual(crypto.createHmac("sha256", secret).update(timestamp + rawBody).digest("base64"), signature);
}
