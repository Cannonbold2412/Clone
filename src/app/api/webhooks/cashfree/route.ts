import { NextResponse } from "next/server";
import { markPaid, markPaymentFailed } from "@/lib/orders";
import { verifyWebhook } from "@/lib/cashfree";

// Cashfree Dashboard → Developers → Webhooks: URL <site>/api/webhooks/cashfree, events Payment Success / Failed / User Dropped.
// Safety net for customers who close the tab after paying: the order is confirmed even if /verify never ran.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-webhook-timestamp") ?? "", req.headers.get("x-webhook-signature") ?? ""))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const evt = JSON.parse(raw);
  const orderId = evt.data?.order?.order_id;
  const p = evt.data?.payment;
  try {
    if (evt.type === "PAYMENT_SUCCESS_WEBHOOK" && orderId) await markPaid(orderId, String(p?.cf_payment_id), Math.round(p?.payment_amount * 100));
    else if (evt.type === "PAYMENT_FAILED_WEBHOOK" && orderId) await markPaymentFailed(orderId, "FAILED", p?.payment_message ?? "Payment failed", p?.cf_payment_id && String(p.cf_payment_id));
    else if (evt.type === "PAYMENT_USER_DROPPED_WEBHOOK" && orderId) await markPaymentFailed(orderId, "CANCELLED", "Payment cancelled by user");
  } catch (e) {
    // Unknown order ids (other integrations on the same account) are acknowledged, not retried forever.
    console.error("[webhook]", evt.type, e);
  }
  return NextResponse.json({ ok: true });
}
