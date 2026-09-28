"use client";

import Link from "next/link";
import { useRef } from "react";
import { Icon } from "./Icon";

export type Purchase = { key: string; name: string; image: string; href: string; who: string; ago: string };

export function RecentPurchases({ items }: { items: Purchase[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.66, behavior: "smooth" });
  if (!items.length) return null;
  return (
    <section className="container-x py-10">
      <h2 className="section-title">RECENT PURCHASES</h2>
      <div className="relative mt-8">
        <div ref={ref} className="no-scrollbar flex snap-x gap-5 overflow-x-auto">
          {items.map((p) => (
            <div key={p.key} className="flex w-[85%] shrink-0 snap-start gap-4 border border-line p-3 md:w-[384px]">
              <img src={p.image} alt="" className="h-[96px] w-[87px] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-[13px] font-bold"><span>{p.ago}</span><Link href={p.href} className="underline">VIEW</Link></div>
                <p className="mt-2 truncate text-[15px] font-semibold">{p.name}</p>
                <p className="mt-1 text-[12px]">Purchased by :</p>
                <p className="truncate text-[12px] font-semibold">{p.who}</p>
              </div>
            </div>
          ))}
        </div>
        <button aria-label="Previous" onClick={() => scroll(-1)} className="absolute left-0 top-1/2 hidden h-[42px] w-[42px] -translate-y-1/2 items-center justify-center border border-ink bg-white md:flex"><Icon name="left" /></button>
        <button aria-label="Next" onClick={() => scroll(1)} className="absolute right-0 top-1/2 hidden h-[42px] w-[42px] -translate-y-1/2 items-center justify-center border border-ink bg-white md:flex"><Icon name="right" /></button>
      </div>
    </section>
  );
}
