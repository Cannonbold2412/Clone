import { NextResponse } from "next/server";
import { markPaid, markPaymentFailed } from "@/lib/orders";
import { verifyWebhook } from "@/lib/razorpay";

// Razorpay Dashboard → Webhooks: URL <site>/api/webhooks/razorpay, events payment.captured, order.paid, payment.failed.
// Safety net for customers who close the tab after paying: the order is confirmed even if /verify never ran.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-razorpay-signature") ?? ""))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const evt = JSON.parse(raw);
  const p = evt.payload?.payment?.entity;
  try {
    if ((evt.event === "payment.captured" || evt.event === "order.paid") && p?.order_id) await markPaid(p.order_id, p.id, p.amount);
    else if (evt.event === "payment.failed" && p?.order_id) await markPaymentFailed(p.order_id, "FAILED", p.error_description ?? "Payment failed", p.id);
  } catch (e) {
    // Unknown order ids (other integrations on the same account) are acknowledged, not retried forever.
    console.error("[webhook]", evt.event, e);
  }
  return NextResponse.json({ ok: true });
}
