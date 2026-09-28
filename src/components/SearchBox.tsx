"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { http } from "./Store";

type Sug = { id: string; slug: string; sku: string; name: string; image: string };

export function SearchBox({ initial = "" }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const [sugs, setSugs] = useState<Sug[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!initial) input.current?.focus(); }, [initial]);
  useEffect(() => {
    if (!q.trim()) { setSugs([]); return; }
    const t = setTimeout(() => http<{ items: Sug[] }>("/api/search?q=" + encodeURIComponent(q)).then((r) => setSugs(r.items)).catch(() => {}), 200);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (term: string) => {
    setOpen(false);
    router.push(term.trim() ? `/search?q=${encodeURIComponent(term.trim())}` : "/search");
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(q); }} className="relative mt-6" role="search">
      <div className="flex h-[43px] items-center gap-3 border border-[#9e9e9e] px-3">
        <Icon name="search" size={22} />
        <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search" aria-label="Search products" className="h-full flex-1 text-[15px] outline-none" enterKeyHint="search" />
        {q && <button type="button" aria-label="Clear search" onClick={() => { setQ(""); submit(""); }}><Icon name="close" size={20} /></button>}
      </div>
      {open && q.trim() && (
        <div className="absolute inset-x-0 top-[43px] z-30 max-h-[300px] overflow-y-auto border border-t-0 border-[#9e9e9e] bg-white shadow">
          <p className="px-3 pt-3 text-[14px] font-medium">Suggestions</p>
          {sugs.length ? sugs.map((s) => (
            <Link key={s.id} href={`/${s.slug}/catalogue/${s.id}/${s.sku}`} className="flex items-center gap-3 px-3 py-2 text-[14px] font-semibold hover:bg-soft">
              <img src={s.image} alt="" className="h-9 w-7 object-cover" />{s.name}
            </Link>
          )) : <p className="px-3 py-3 text-[13px] text-muted">No matching products. Press enter to search.</p>}
        </div>
      )}
    </form>
  );
}
