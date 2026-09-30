import { z } from "zod";
import { api, body } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createCheckoutOrder, newPaymentAttempt } from "@/lib/orders";

const Input = z.object({
  addressId: z.string().min(1, "Please select a delivery address"),
  method: z.enum(["ONLINE", "COD", "PARTIAL"]),
  shippingId: z.string().min(1),
  idempotencyKey: z.string().min(8).max(64),
});

export const POST = api(async (req) => {
  const u = await requireUser();
  const order = await createCheckoutOrder(u.id, Input.parse(await body(req)));
  // Retrying on the same checkout (e.g. after a cancelled/failed attempt) opens a fresh payment attempt.
  const needsPayment = order.payNow > 0 && ["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(order.status);
  const payment = needsPayment ? await newPaymentAttempt(order.id) : null;
  return {
    orderId: order.id, number: order.number, status: order.status, payNow: order.payNow,
    payment: payment && { gatewayOrderId: payment.gatewayOrderId, sessionId: payment.sessionId, amount: payment.amount },
    prefill: { contact: u.phone, name: u.name ?? "" },
  };
});
