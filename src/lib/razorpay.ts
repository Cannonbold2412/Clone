import crypto from "node:crypto";

// Razorpay integration. With RAZORPAY_KEY_ID/SECRET set, real Razorpay (test or live) is used.
// Without keys (dev only) a local simulator stands in: same order ids, same HMAC verification path.

export const SIM_SECRET = "zarilane_local_simulator_secret";

export function gateway() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (keyId && keySecret) return { mode: "razorpay" as const, keyId, keySecret };
  if (process.env.NODE_ENV !== "production" || process.env.PAYMENT_SIMULATOR === "true")
    return { mode: "simulator" as const, keyId: "rzp_test_simulator", keySecret: SIM_SECRET };
  throw new Error("Razorpay keys are not configured");
}

export async function createRazorpayOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  const g = gateway();
  if (g.mode === "simulator") return { id: "order_sim_" + crypto.randomBytes(7).toString("hex") };
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${g.keyId}:${g.keySecret}`).toString("base64"),
    },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.description || "Could not create Razorpay order");
  return data as { id: string };
}

export function signPayment(orderId: string, paymentId: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function verifySignature(orderId: string, paymentId: string, signature: string, secret = gateway().keySecret) {
  return safeEqual(signPayment(orderId, paymentId, secret), signature);
}

export function verifyWebhook(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return safeEqual(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}
