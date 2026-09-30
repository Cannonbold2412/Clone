import { z } from "zod";
import { api, body } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { markPaid } from "@/lib/orders";
import { fetchPaidPayment, gateway, verifySignature } from "@/lib/cashfree";

const Input = z.object({ order_id: z.string(), payment_id: z.string().optional(), signature: z.string().optional() });

// Called by the browser after Cashfree checkout closes. Never trust the client: ask Cashfree (or, in the simulator, check the HMAC).
// Returns { paid: false } when no successful payment exists, so the client can record a cancel/failure.
export const POST = api(async (req) => {
  const u = await requireUser();
  const r = Input.parse(await body(req));
  const pay = await db.payment.findUnique({ where: { gatewayOrderId: r.order_id }, include: { order: true } });
  if (!pay || pay.order.userId !== u.id) throw new HttpError(404, "Payment not found");

  let paymentId: string | null = null;
  if (gateway().mode === "simulator") {
    if (!r.payment_id || !r.signature || !verifySignature(r.order_id, r.payment_id, r.signature)) throw new HttpError(400, "Payment verification failed");
    paymentId = r.payment_id;
  } else {
    const paid = await fetchPaidPayment(r.order_id);
    if (paid && paid.amountPaise !== pay.amount) throw new HttpError(400, "Amount mismatch");
    paymentId = paid?.id ?? null;
  }
  if (!paymentId) return { paid: false, orderId: pay.orderId, status: pay.order.status };
  const order = await markPaid(r.order_id, paymentId);
  return { paid: true, orderId: order.id, status: order.status };
});
