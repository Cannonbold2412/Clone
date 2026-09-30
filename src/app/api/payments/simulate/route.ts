import crypto from "node:crypto";
import { z } from "zod";
import { api, body } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { gateway, signPayment } from "@/lib/cashfree";

// Local stand-in for Cashfree checkout. Only active when no Cashfree keys are configured.
// Returns a payment id + HMAC signature, which /verify then checks in simulator mode.
export const POST = api(async (req) => {
  const g = gateway();
  if (g.mode !== "simulator") throw new HttpError(404, "Not found");
  const u = await requireUser();
  const { order_id, outcome } = z.object({ order_id: z.string(), outcome: z.enum(["success", "failure"]) }).parse(await body(req));
  const pay = await db.payment.findUnique({ where: { gatewayOrderId: order_id }, include: { order: true } });
  if (!pay || pay.order.userId !== u.id) throw new HttpError(404, "Payment not found");
  const payment_id = "cfpay_sim_" + crypto.randomBytes(7).toString("hex");
  if (outcome === "failure")
    return { error: { description: "Payment failed due to bank decline (simulated).", payment_id } };
  return { order_id, payment_id, signature: signPayment(order_id, payment_id, g.secret) };
});
