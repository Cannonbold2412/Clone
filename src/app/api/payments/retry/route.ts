import { z } from "zod";
import { api, body } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { newPaymentAttempt } from "@/lib/orders";

export const POST = api(async (req) => {
  const u = await requireUser();
  const { orderId } = z.object({ orderId: z.string() }).parse(await body(req));
  const order = await db.order.findFirst({ where: { id: orderId, userId: u.id } });
  if (!order) throw new HttpError(404, "Order not found");
  const p = await newPaymentAttempt(order.id);
  return { orderId: order.id, number: order.number, payment: { gatewayOrderId: p.gatewayOrderId, sessionId: p.sessionId, amount: p.amount }, prefill: { email: u.email ?? "", name: u.name ?? "" } };
});
