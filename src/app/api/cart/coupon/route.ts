import { z } from "zod";
import { api, body } from "@/lib/api";
import { HttpError } from "@/lib/auth";
import { db } from "@/lib/db";
import { cartView, getCart } from "@/lib/cart";
import { couponError, totals } from "@/lib/pricing";

export const POST = api(async (req) => {
  const { code } = z.object({ code: z.string().trim().min(1, "Please enter a coupon code").max(30) }).parse(await body(req));
  const cart = await getCart();
  if (!cart?.items.length) throw new HttpError(400, "Your bag is empty");
  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  const t = totals(cart.items.map((i) => ({ price: i.variant.price, mrp: i.variant.mrp, qty: i.qty })));
  const err = couponError(coupon, t.subtotal, t.qty);
  if (err) throw new HttpError(400, err);
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: coupon!.code } });
  return cartView(await getCart());
});

export const DELETE = api(async () => {
  const cart = await getCart();
  if (cart) await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  return cartView(await getCart());
});
