"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { inr } from "@/lib/format";
import { Drawer } from "./Drawer";
import { Icon } from "./Icon";
import { http, useStore } from "./Store";
import type { CartView } from "@/lib/cart";

export function BagDrawer() {
  const { cart, bagOpen, setBagOpen, setCart, toast } = useStore();
  const router = useRouter();
  const close = () => setBagOpen(false);

  const remove = async (variantId: string) => {
    try { setCart(await http<CartView>("/api/cart/items", { method: "DELETE", json: { variantId } })); }
    catch (e) { toast((e as Error).message, "err"); }
  };

  const items = cart?.items ?? [];
  return (
    <Drawer
      open={bagOpen}
      onClose={close}
      title="My Bag"
      footer={items.length > 0 && (
        <div className="border-t border-line px-5 py-4">
          <div className="mb-3 flex justify-between text-[15px]"><span>Subtotal ({cart!.qty} item{cart!.qty > 1 ? "s" : ""})</span><b>{inr(cart!.subtotal)}</b></div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-outline h-11 text-[15px]" onClick={() => { close(); router.push("/bag"); }}>View Bag</button>
            <button className="btn-black h-11 text-[15px] normal-case" onClick={() => { close(); router.push("/checkout"); }}>Checkout</button>
          </div>
        </div>
      )}
    >
      <div className="-mx-5 border-t border-line pt-4" />
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <Icon name="bag" size={56} className="mx-auto text-[#cfcfcf]" />
          <p className="mt-4 font-semibold">Your bag is empty</p>
          <button className="btn-black mt-5 h-11 px-8 text-sm" onClick={close}>Continue Shopping</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-3 border border-line p-3">
              <div className="relative">
                <img src={i.image} alt="" className="h-[82px] w-[82px] object-cover" />
                <button aria-label="Remove item" onClick={() => remove(i.variantId)} className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full border border-ink bg-white"><Icon name="close" size={12} stroke={2} /></button>
              </div>
              <Link href={`/${i.slug}/catalogue/${i.productId}/${i.variantId}`} onClick={close} className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[14px] leading-5">{i.name}</p>
                <p className="mt-1 text-[12px] text-ink2">Size: {i.size} / Qty: {i.qty}</p>
                <p className="mt-1 text-[13px] font-bold">{inr(i.price * i.qty)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
