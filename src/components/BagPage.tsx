"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CartView } from "@/lib/cart";
import { inr } from "@/lib/format";
import { onlineDiscount } from "@/lib/pricing";
import { Icon } from "./Icon";
import { OffersDrawer, type CouponInfo } from "./Offers";
import { DotLoader } from "./ProductCard";
import { http, useStore } from "./Store";

export function Qty({ value, max, onChange, disabled }: { value: number; max: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="flex h-[38px] w-[160px] items-center border border-[#9a9a9a]">
      <button aria-label="Decrease quantity" disabled={disabled} onClick={() => onChange(value - 1)} className="flex h-full w-11 items-center justify-center disabled:opacity-40"><Icon name="minus" size={18} /></button>
      <span className="flex-1 text-center text-[14px]" aria-live="polite">{value}</span>
      <button aria-label="Increase quantity" disabled={disabled || value >= Math.min(max, 10)} onClick={() => onChange(value + 1)} className="flex h-full w-11 items-center justify-center disabled:opacity-40"><Icon name="plus" size={18} /></button>
    </div>
  );
}

export function BagPage({ coupons }: { coupons: (CouponInfo & { minAmount: number; minQty: number; maxDiscount: number })[] }) {
  const { cart, setCart, toast, ready } = useStore();
  const [offers, setOffers] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  const mutate = async (key: string, fn: () => Promise<CartView>) => {
    setBusy(key);
    try { setCart(await fn()); } catch (e) { toast((e as Error).message, "err"); } finally { setBusy(null); }
  };
  const setQty = (variantId: string, qty: number) => mutate(variantId, () => http("/api/cart/items", { method: "PATCH", json: { variantId, qty } }));
  const remove = (variantId: string) => mutate(variantId, () => http("/api/cart/items", { method: "DELETE", json: { variantId } }));
  const applyCoupon = async (code: string) => {
    try { setCart(await http("/api/cart/coupon", { method: "POST", json: { code } })); toast("Offer applied on this order!"); return true; }
    catch (e) { toast((e as Error).message, "err"); return false; }
  };
  const removeCoupon = () => mutate("coupon", () => http("/api/cart/coupon", { method: "DELETE" }));

  if (!ready || !cart) return <DotLoader />;

  if (!cart.items.length)
    return (
      <div className="container-x py-20 text-center">
        <Icon name="bag" size={72} className="mx-auto text-[#cfcfcf]" />
        <h1 className="mt-5 text-[22px] font-semibold">Your bag is empty</h1>
        <p className="mt-2 text-[14px] text-muted">Looks like you haven&apos;t added anything to your bag yet.</p>
        <Link href="/" className="btn-black mt-6 inline-flex h-12 items-center px-10 text-[15px]">Continue Shopping</Link>
      </div>
    );

  const eligible = coupons.map((c) => ({ ...c, eligible: cart.subtotal >= c.minAmount && cart.qty >= c.minQty }));
  const maxSave = Math.max(0, ...coupons.map((c) => c.maxDiscount)) + onlineDiscount(cart.subtotal);
  const outOfStock = cart.items.some((i) => i.qty > i.stock);

  return (
    <div className="container-x pb-10 pt-6 md:flex md:justify-between md:gap-10">
      <div className="md:w-[612px]">
        <h1 className="text-[26px] font-normal">My Bag</h1>
        <ul className="mt-4 space-y-3">
          {cart.items.map((i) => (
            <li key={i.variantId} className={`relative flex gap-3 border border-line p-3 ${busy === i.variantId ? "opacity-60" : ""}`}>
              <Link href={`/${i.slug}/catalogue/${i.productId}/${i.variantId}`}><img src={i.image} alt="" className="h-[128px] w-[94px] object-cover" /></Link>
              <div className="min-w-0 flex-1 pr-7">
                <Link href={`/${i.slug}/catalogue/${i.productId}/${i.variantId}`} className="line-clamp-2 text-[15px] leading-6">{i.name} ({i.size})</Link>
                <p className="mt-1 text-[13px] text-muted">{i.size}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Qty value={i.qty} max={i.stock} disabled={busy === i.variantId} onChange={(n) => (n <= 0 ? remove(i.variantId) : setQty(i.variantId, n))} />
                  <span className="text-[16px] font-bold">{inr(i.price * i.qty)}</span>
                </div>
                {i.stock <= 0 ? <p className="mt-2 text-[12px] font-semibold text-sale">Out of stock — please remove this item</p>
                  : i.qty > i.stock && <p className="mt-2 text-[12px] font-semibold text-sale">Only {i.stock} left — please reduce quantity</p>}
              </div>
              <button aria-label="Remove item" onClick={() => remove(i.variantId)} className="absolute right-3 top-3"><Icon name="close" size={22} /></button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 md:mt-3 md:w-[460px]">
        <button onClick={() => setOffers(true)} className="flex w-full items-center gap-4 border border-[#bfe0c0] bg-offerbg px-6 py-4 text-left">
          <Icon name="tag" size={22} className="text-offer" />
          <span className="flex-1">
            {cart.couponCode && !cart.couponError
              ? <><b className="block text-[13px]">{cart.couponCode} applied</b><span className="text-[12px] text-offer">You saved {inr(cart.coupon)}</span></>
              : <><b className="block text-[13px]">Save upto {inr(maxSave)}</b><span className="text-[12px] text-offer">{coupons.length + 2} offers available</span></>}
          </span>
          <span className="text-[15px] font-bold text-offer">OFFERS</span>
        </button>
        {cart.couponCode && (
          <div className="flex items-center justify-between border-x border-b border-[#bfe0c0] px-6 py-2 text-[12px]">
            <span className={cart.couponError ? "text-sale" : "text-offer"}>{cart.couponError ?? `Coupon ${cart.couponCode} applied`}</span>
            <button onClick={removeCoupon} className="font-semibold underline">Remove</button>
          </div>
        )}
        <div className="mt-3 bg-[#f6f6f6] px-6 py-6 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:mt-0 max-md:py-4">
          <div className="flex justify-between text-[17px] font-bold"><span>Subtotal ({cart.qty} items)</span><span>{inr(cart.subtotal - cart.coupon)}</span></div>
          <p className="mt-1 text-[14px] text-offer">Saving {inr(cart.saving + cart.coupon)}</p>
          <button disabled={outOfStock} onClick={() => router.push("/checkout")} className="btn-black mt-6 h-[45px] w-full text-[15px] normal-case max-md:mt-3">Checkout</button>
        </div>
        <div className="h-[140px] md:hidden" />
      </div>

      <OffersDrawer open={offers} onClose={() => setOffers(false)} coupons={eligible} withInput onApply={applyCoupon} applied={cart.couponError ? null : cart.couponCode} saving={(k) => (k === "ONLINE" ? onlineDiscount(cart.subtotal - cart.coupon) : 50)} />
    </div>
  );
}
