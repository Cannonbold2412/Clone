import crypto from "node:crypto";
import { z } from "zod";
import { api, body } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { gateway, signPayment } from "@/lib/razorpay";

// Local stand-in for Razorpay's hosted checkout. Only active when no Razorpay keys are configured.
// Returns exactly what Razorpay's handler would (payment id + HMAC signature), which /verify then checks.
export const POST = api(async (req) => {
  const g = gateway();
  if (g.mode !== "simulator") throw new HttpError(404, "Not found");
  const u = await requireUser();
  const { razorpay_order_id, outcome } = z.object({ razorpay_order_id: z.string(), outcome: z.enum(["success", "failure"]) }).parse(await body(req));
  const pay = await db.payment.findUnique({ where: { razorpayOrderId: razorpay_order_id }, include: { order: true } });
  if (!pay || pay.order.userId !== u.id) throw new HttpError(404, "Payment not found");
  const razorpay_payment_id = "pay_sim_" + crypto.randomBytes(7).toString("hex");
  if (outcome === "failure")
    return { error: { code: "BAD_REQUEST_ERROR", description: "Payment failed due to bank decline (simulated).", reason: "payment_failed", metadata: { order_id: razorpay_order_id, payment_id: razorpay_payment_id } } };
  return { razorpay_order_id, razorpay_payment_id, razorpay_signature: signPayment(razorpay_order_id, razorpay_payment_id, g.keySecret) };
});
