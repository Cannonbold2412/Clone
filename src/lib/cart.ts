import { cookies } from "next/headers";
import { db } from "./db";
import { currentUser } from "./auth";
import { totals, couponError, type PayMethod } from "./pricing";

const CART = "zl_cart";

const include = { items: { include: { variant: { include: { product: true } } }, orderBy: { id: "asc" as const } } };

/** Cart for the current visitor: user's cart when logged in, else the guest cart from the cookie. */
export async function getCart(create = false) {
  const user = await currentUser();
  const jar = await cookies();
  const guestId = jar.get(CART)?.value;
  if (user) {
    let cart = await db.cart.findFirst({ where: { userId: user.id }, include });
    if (!cart && create) cart = await db.cart.create({ data: { userId: user.id }, include });
    return cart;
  }
  let cart = guestId ? await db.cart.findFirst({ where: { id: guestId, userId: null }, include }) : null;
  if (!cart && create) {
    cart = await db.cart.create({ data: {}, include });
    jar.set(CART, cart.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60, secure: process.env.NODE_ENV === "production" });
  }
  return cart;
}

/** On login, move guest cart items into the user's cart. */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const guestId = jar.get(CART)?.value;
  if (!guestId) return;
  const guest = await db.cart.findFirst({ where: { id: guestId, userId: null }, include: { items: true } });
  jar.delete(CART);
  if (!guest) return;
  const mine = await db.cart.findFirst({ where: { userId } });
  if (!mine) {
    await db.cart.update({ where: { id: guest.id }, data: { userId } });
    return;
  }
  for (const it of guest.items)
    await db.cartItem.upsert({
      where: { cartId_variantId: { cartId: mine.id, variantId: it.variantId } },
      update: { qty: { increment: it.qty } },
      create: { cartId: mine.id, variantId: it.variantId, qty: it.qty },
    });
  if (guest.couponCode && !mine.couponCode) await db.cart.update({ where: { id: mine.id }, data: { couponCode: guest.couponCode } });
  await db.cart.delete({ where: { id: guest.id } });
}

type FullCart = NonNullable<Awaited<ReturnType<typeof getCart>>>;

export async function cartView(cart: FullCart | null, method: PayMethod | null = null, shippingFee = 0) {
  const items = (cart?.items ?? []).map((i) => {
    const p = i.variant.product;
    return {
      variantId: i.variantId, productId: p.id, slug: p.slug, name: p.name, size: i.variant.size,
      image: JSON.parse(p.images)[0] as string, price: i.variant.price, mrp: i.variant.mrp, qty: i.qty, stock: i.variant.stock,
    };
  });
  const coupon = cart?.couponCode ? await db.coupon.findUnique({ where: { code: cart.couponCode } }) : null;
  const t = totals(items, { coupon, method, shippingFee });
  return {
    items, couponCode: cart?.couponCode ?? null,
    couponError: coupon ? couponError(coupon, t.subtotal, t.qty) : null,
    ...t,
  };
}

export type CartView = Awaited<ReturnType<typeof cartView>>;
