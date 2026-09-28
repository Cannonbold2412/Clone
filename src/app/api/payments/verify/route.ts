import { z } from "zod";
import { api, body } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { markPaid } from "@/lib/orders";
import { verifySignature } from "@/lib/razorpay";

const Input = z.object({ razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() });

// Called by the browser after Razorpay Checkout success. Never trust the client: check the HMAC signature.
export const POST = api(async (req) => {
  const u = await requireUser();
  const r = Input.parse(await body(req));
  const pay = await db.payment.findUnique({ where: { razorpayOrderId: r.razorpay_order_id }, include: { order: true } });
  if (!pay || pay.order.userId !== u.id) throw new HttpError(404, "Payment not found");
  if (!verifySignature(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature)) throw new HttpError(400, "Payment verification failed");
  const order = await markPaid(r.razorpay_order_id, r.razorpay_payment_id);
  return { orderId: order.id, status: order.status };
});
