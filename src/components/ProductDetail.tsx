"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inr, pctOff } from "@/lib/format";
import { onlineDiscount } from "@/lib/pricing";
import { Icon } from "./Icon";
import { OffersDrawer, type CouponInfo } from "./Offers";
import { useStore } from "./Store";

type Variant = { id: string; size: string; price: number; mrp: number; stock: number };
type P = { id: string; slug: string; name: string; description: string; images: string[]; specs: [string, string][]; returnDays: number; variants: Variant[] };

export function ProductDetail({ p, sku, coupons }: { p: P; sku: string; coupons: CouponInfo[] }) {
  const router = useRouter();
  const { addToBag, toast } = useStore();
  const [img, setImg] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);
  const [moreTitle, setMoreTitle] = useState(false);
  const [allSpecs, setAllSpecs] = useState(false);
  const [offers, setOffers] = useState(false);
  const [busy, setBusy] = useState<"" | "bag" | "buy">("");
  const [needSize, setNeedSize] = useState(false);
  const v = p.variants.find((x) => x.id === sku) ?? p.variants[0];
  const soldOut = v.stock <= 0;
  const off = pctOff(v.price, v.mrp);
  const lowest = v.price - onlineDiscount(v.price);
  const VISIBLE_THUMBS = 5;

  const pick = (id: string) => { setNeedSize(false); router.replace(`/${p.slug}/catalogue/${p.id}/${id}`, { scroll: false }); };

  const act = async (kind: "bag" | "buy") => {
    if (p.variants.length > 1 && !p.variants.some((x) => x.id === sku)) { setNeedSize(true); return; }
    if (soldOut) return toast("This size is out of stock", "err");
    setBusy(kind);
    const ok = await addToBag(v.id, 1, { silent: kind === "buy" });
    setBusy("");
    if (ok && kind === "buy") router.push("/checkout");
  };

  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else { await navigator.clipboard.writeText(url); toast("Link copied to clipboard"); }
    } catch { /* user dismissed share sheet */ }
  };

  const specs = allSpecs ? p.specs : p.specs.slice(0, 5);
  const Buttons = ({ className = "" }) => (
    <div className={`flex gap-2 ${className}`}>
      <button onClick={() => act("bag")} disabled={!!busy || soldOut} aria-label="Add to bag" className="flex h-[46px] w-[56px] shrink-0 items-center justify-center border border-ink bg-white transition-colors hover:bg-black hover:text-white disabled:opacity-40">
        {busy === "bag" ? "…" : <Icon name="bagPlus" size={28} stroke={1.4} />}
      </button>
      <button onClick={() => act("buy")} disabled={!!busy || soldOut} className="btn-black h-[46px] flex-1 text-[16px]">
        {soldOut ? "OUT OF STOCK" : busy === "buy" ? "PLEASE WAIT…" : "BUY NOW"}
      </button>
    </div>
  );

  return (
    <div className="container-x pt-3 md:flex md:gap-10 md:pt-6">
      {/* Gallery */}
      <div className="flex gap-4 md:w-[57%] md:gap-8">
        <div className="relative w-[29%] shrink-0 md:w-[114px]">
          <div className="max-h-[350px] overflow-hidden md:max-h-[640px]">
            <div className="flex flex-col gap-4 transition-transform" style={{ transform: `translateY(-${thumbTop * 125}px)` }}>
              {p.images.map((src, i) => (
                <button key={src} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`} className={`block p-[3px] ${i === img ? "border-2 border-ink" : "border-2 border-transparent"}`}>
                  <img src={src} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          {p.images.length > VISIBLE_THUMBS - 2 && (
            <button aria-label="More images" onClick={() => setThumbTop((t) => (t + 1) % Math.max(1, p.images.length - 2))} className="absolute -bottom-2 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center border border-ink bg-white">
              <Icon name="down" size={22} />
            </button>
          )}
        </div>
        <div className="relative flex-1">
          <img src={p.images[img]} alt={p.name} className="aspect-[5/7] w-full object-cover md:max-w-[474px]" />
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
            {p.images.map((_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === img ? "bg-black" : "bg-white/80"}`} />)}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 md:mt-0 md:w-[408px] md:shrink-0">
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-[17px] font-normal leading-[25px]">
            {moreTitle || p.name.length <= 70 ? p.name : <>{p.name.slice(0, 66)}..<button onClick={() => setMoreTitle(true)} className="text-[13px] font-semibold underline">More</button></>}
          </h1>
          <button onClick={share} aria-label="Share" className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full bg-soft"><Icon name="share" size={16} /></button>
        </div>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-[30px] font-bold">{inr(v.price)}</span>
          {off > 0 && <><span className="text-[17px] text-muted line-through">{inr(v.mrp)}</span><span className="text-[17px] font-semibold text-sale">{off}% Off</span></>}
        </p>
        <button onClick={() => setOffers(true)} className="mt-3 flex h-[36px] w-full items-center gap-2 border border-dashed border-offer px-2 text-[13px] text-offer">
          <Icon name="ticket" size={16} /> <span className="flex-1 text-left"><span className="md:hidden">View Available Offers</span><span className="hidden md:inline">Get this as low as {inr(lowest)}</span></span> <Icon name="right" size={16} />
        </button>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#555]"><Icon name="info" size={14} /> Final Price inclusive of all taxes</p>

        <div className="mt-4 bg-soft">
          <div className="grid grid-cols-3 gap-2 px-3 py-4 text-center text-[12px] font-medium">
            {[["rupee", "Cash on Delivery", null], ["swap", `${p.returnDays} days Return (Wrong/damaged items only)`, "/return-policy"], ["truck", "Free Delivery", null]].map(([icon, label, href]) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <span className="flex h-[31px] w-[31px] items-center justify-center rounded-full bg-white"><Icon name={icon!} size={18} /></span>
                {href ? <Link href={href} className="font-semibold underline">{label}</Link> : <span className="font-semibold">{label}</span>}
              </div>
            ))}
          </div>
          <p className="bg-[#e4e4e4] py-2 text-center text-[13px] font-semibold">Get it delivered in 3-7 days</p>
        </div>

        <Buttons className="mt-4 hidden md:flex" />

        <div className={`mt-4 border p-3 ${needSize ? "border-sale" : "border-line"}`}>
          <p className="text-[15px] font-bold">Size {needSize && <span className="text-[12px] font-medium text-sale">— please select a size</span>}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.variants.map((x) => {
              const active = x.id === v.id && !needSize;
              return (
                <button key={x.id} onClick={() => pick(x.id)} disabled={x.stock <= 0}
                  className={`relative h-[36px] min-w-[60px] flex-1 border px-3 text-[13px] ${active ? "border-ink font-semibold" : "border-[#bbb]"} ${x.stock <= 0 ? "cursor-not-allowed text-[#b5b5b5] line-through" : ""}`}>
                  {x.size}
                </button>
              );
            })}
          </div>
          {v.stock > 0 && v.stock <= 5 && <p className="mt-2 text-[12px] font-semibold text-sale">Hurry, only {v.stock} left!</p>}
        </div>

        <div className="mt-4 border border-line p-3">
          <p className="mb-1 text-[15px] font-bold">Product Information</p>
          <table className="w-full text-[13px]">
            <tbody>
              {specs.map(([k, val]) => (
                <tr key={k} className="border-b border-line last:border-0"><td className="w-1/2 py-3 text-[#555]">{k}</td><td className="py-3 font-semibold">{val}</td></tr>
              ))}
            </tbody>
          </table>
          {allSpecs && (
            <div className="mt-3">
              <p className="text-[15px] font-bold">Product Description</p>
              <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-[#333]">{p.description}</p>
            </div>
          )}
          <div className="mt-2 text-right">
            <button onClick={() => setAllSpecs((s) => !s)} className="inline-flex items-center gap-1 text-[13px] font-semibold underline">{allSpecs ? "Read Less" : "Read More"}<Icon name={allSpecs ? "up" : "down"} size={14} /></button>
          </div>
        </div>
      </div>

      {/* Mobile sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-line bg-white p-3 md:hidden"><Buttons /></div>

      <OffersDrawer open={offers} onClose={() => setOffers(false)} coupons={coupons} saving={(k) => (k === "ONLINE" ? onlineDiscount(v.price) : k === "PARTIAL" ? 50 : 0)} />
    </div>
  );
}
