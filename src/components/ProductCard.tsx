"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Card } from "@/lib/catalog";
import { inr, pctOff } from "@/lib/format";
import { Icon } from "./Icon";
import { useStore } from "./Store";

export function ProductCard({ p, alwaysButton = false }: { p: Card; alwaysButton?: boolean }) {
  const [img, setImg] = useState(0);
  const [busy, setBusy] = useState(false);
  const { addToBag } = useStore();
  const router = useRouter();
  const href = `/${p.slug}/catalogue/${p.id}/${p.sku}`;
  const off = pctOff(p.price, p.mrp);

  const step = (e: React.MouseEvent, d: number) => {
    e.preventDefault();
    setImg((i) => (i + d + p.images.length) % p.images.length);
  };

  const buyNow = async () => {
    if (!p.singleVariant) return router.push(href); // needs a size choice first
    setBusy(true);
    if (await addToBag(p.sku, 1, { silent: true })) router.push("/checkout");
    setBusy(false);
  };

  return (
    <div className="group relative -m-3 p-3 transition-shadow md:hover:z-10 md:hover:shadow-[0_2px_10px_rgba(0,0,0,.12)]">
      <Link href={href} className="block">
        <div className="relative aspect-[5/7] overflow-hidden bg-soft">
          {/* Only the visible slide is mounted; keeps long grids light. */}
          <img key={img} src={p.images[img]} alt={p.name} loading="lazy" decoding="async" className="anim-fade h-full w-full object-cover" />
          {p.soldOut && <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[11px] font-bold text-sale">SOLD OUT</span>}
          <div className="absolute bottom-3 right-3 hidden gap-2 md:group-hover:flex">
            <button aria-label="Previous image" onClick={(e) => step(e, -1)} className="flex h-8 w-8 items-center justify-center border border-ink bg-white"><Icon name="left" size={18} /></button>
            <button aria-label="Next image" onClick={(e) => step(e, 1)} className="flex h-8 w-8 items-center justify-center border border-ink bg-white"><Icon name="right" size={18} /></button>
          </div>
        </div>
        <p className="mt-3 truncate text-[14px] uppercase text-ink2">{p.name}</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[16px] font-bold">{inr(p.price)}</span>
          {off > 0 && <span className="text-[12px] text-muted line-through">{inr(p.mrp)}</span>}
          {off > 0 && <span className="text-[12px] font-semibold text-sale">{off}% OFF</span>}
        </p>
      </Link>
      <button
        onClick={buyNow}
        disabled={busy || p.soldOut}
        className={`btn-black mt-3 h-11 w-full text-[15px] ${alwaysButton ? "" : "md:hidden md:group-hover:block"}`}
      >
        {p.soldOut ? "SOLD OUT" : busy ? "..." : "BUY NOW"}
      </button>
    </div>
  );
}

export function ProductGrid({ items }: { items: Card[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-11 md:gap-y-11">
      {items.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}

export function GridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-11">
      {Array.from({ length: n }, (_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[5/7]" />
          <div className="skeleton mt-3 h-4 w-3/4" />
          <div className="mt-2 flex gap-2"><div className="skeleton h-4 w-12" /><div className="skeleton h-4 w-10" /><div className="skeleton h-4 w-10" /></div>
        </div>
      ))}
    </div>
  );
}

export function DotLoader() {
  return <div className="dot-loader flex justify-center gap-3 py-10" aria-label="Loading"><span /><span /><span /></div>;
}
