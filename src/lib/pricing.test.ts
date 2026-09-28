import { test } from "node:test";
import assert from "node:assert/strict";
import { totals, couponError, type CouponRule } from "./pricing";
import { verifySignature, signPayment } from "./razorpay";

const SALE10: CouponRule = { code: "SALE10", kind: "PERCENT", value: 10, maxDiscount: 200, minAmount: 2449, minQty: 2, active: true };

test("online payment: 20% capped at 150 (reference: 1799 -> 1649)", () => {
  const t = totals([{ price: 1799, mrp: 4499, qty: 1 }], { method: "ONLINE" });
  assert.equal(t.total, 1649);
  assert.equal(t.payNow, 1649);
  assert.equal(t.saving, 2700);
});

test("coupon eligibility and cap", () => {
  assert.match(couponError(SALE10, 1799, 1)!, /Add 1 more item/);
  const t = totals([{ price: 1799, mrp: 4499, qty: 2 }], { coupon: SALE10, method: "COD", shippingFee: 149 });
  assert.equal(t.coupon, 200); // 10% of 3598 = 359 -> capped 200
  assert.equal(t.total, 3598 - 200 + 149);
  assert.equal(t.payNow, 0);
});

test("partial: 50 off, 149 advance", () => {
  const t = totals([{ price: 1299, mrp: 4599, qty: 1 }], { method: "PARTIAL" });
  assert.equal(t.total, 1249);
  assert.equal(t.payNow, 149);
  assert.equal(t.payOnDelivery, 1100);
});

test("razorpay signature round trip", () => {
  const sig = signPayment("order_1", "pay_1", "secret");
  assert.ok(verifySignature("order_1", "pay_1", sig, "secret"));
  assert.ok(!verifySignature("order_1", "pay_2", sig, "secret"));
  assert.ok(!verifySignature("order_1", "pay_1", "bad", "secret"));
});

test("webhook signature", async () => {
  const { verifyWebhook } = await import("./razorpay");
  const crypto = await import("node:crypto");
  process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
  const body = '{"event":"payment.captured"}';
  const sig = crypto.createHmac("sha256", "whsec_test").update(body).digest("hex");
  assert.ok(verifyWebhook(body, sig));
  assert.ok(!verifyWebhook(body + " ", sig));
});
