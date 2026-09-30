import { z } from "zod";
import { api, body } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { markPaymentFailed } from "@/lib/orders";

const Input = z.object({
  order_id: z.string(),
  reason: z.enum(["FAILED", "CANCELLED"]),
  error: z.string().max(300).default(""),
  payment_id: z.string().optional(),
});

// Browser reports a failed or dismissed checkout. Only moves an unpaid order to PAYMENT_FAILED.
export const POST = api(async (req) => {
  const u = await requireUser();
  const r = Input.parse(await body(req));
  const pay = await db.payment.findUnique({ where: { gatewayOrderId: r.order_id }, include: { order: true } });
  if (!pay || pay.order.userId !== u.id) throw new HttpError(404, "Payment not found");
  const fallback = r.reason === "CANCELLED" ? "Payment cancelled by user" : "Payment failed";
  const order = await markPaymentFailed(r.order_id, r.reason, r.error || fallback, r.payment_id);
  return { orderId: pay.orderId, status: order?.status };
});
