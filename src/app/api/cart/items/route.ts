import { z } from "zod";
import { api, body } from "@/lib/api";
import { HttpError } from "@/lib/auth";
import { db } from "@/lib/db";
import { cartView, getCart } from "@/lib/cart";

const Input = z.object({ variantId: z.string().min(1), qty: z.number().int().min(0).max(10, "You can add up to 10 units of an item") });

// POST adds qty to the line; PATCH sets the line qty (0 removes); DELETE removes the line.
async function change(req: Request, mode: "add" | "set" | "remove") {
  const { variantId, qty } = mode === "remove" ? { ...Input.pick({ variantId: true }).parse(await body(req)), qty: 0 } : Input.parse(await body(req));
  const variant = await db.variant.findUnique({ where: { id: variantId } });
  if (!variant) throw new HttpError(404, "Product not found");
  const cart = (await getCart(true))!;
  const line = cart.items.find((i) => i.variantId === variantId);
  const next = mode === "add" ? (line?.qty ?? 0) + Math.max(1, qty) : qty;
  if (next <= 0) {
    if (line) await db.cartItem.delete({ where: { id: line.id } });
  } else {
    if (variant.stock <= 0) throw new HttpError(409, "This product is out of stock");
    if (next > variant.stock) throw new HttpError(409, `Only ${variant.stock} left in stock`);
    if (next > 10) throw new HttpError(400, "You can add up to 10 units of an item");
    await db.cartItem.upsert({ where: { cartId_variantId: { cartId: cart.id, variantId } }, update: { qty: next }, create: { cartId: cart.id, variantId, qty: next } });
  }
  return cartView(await getCart());
}

export const POST = api((req) => change(req, "add"));
export const PATCH = api((req) => change(req, "set"));
export const DELETE = api((req) => change(req, "remove"));
