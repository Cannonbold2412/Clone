"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "./Icon";
import { DotLoader, GridSkeleton, ProductGrid } from "./ProductCard";
import { http } from "./Store";
import type { Card } from "@/lib/catalog";

type Facet = { label: string; options: { value: string; label: string; count: number }[] };
type Result = { items: Card[]; total: number; hasMore: boolean; facets: Record<string, Facet> };
const FILTER_KEYS = ["type", "size", "color", "price"] as const;

const SORT_LABELS: Record<string, string> = { popularity: "Popularity", price_desc: "Price High to Low", price_asc: "Price Low to High", newest: "Newest", sequential: "Sequential" };

function Check({ on }: { on: boolean }) {
  return <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border ${on ? "border-black bg-black text-white" : "border-[#555]"}`}>{on && <Icon name="check" size={14} stroke={3} />}</span>;
}

/** Product listing with URL-synced filters/sort and infinite scroll. Used by collections and search. */
export function Listing({ initial, collectionId, q, searchMode = false }: { initial: Result; collectionId?: string; q?: string; searchMode?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [data, setData] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  const sel = (k: string) => (sp.get(k) ?? "").split(",").filter(Boolean);
  const sort = sp.get("sort") ?? (searchMode ? "relevance" : "popularity");

  const query = (p: number, params = sp) => {
    const u = new URLSearchParams(params);
    if (collectionId) u.set("collection", collectionId);
    if (q) u.set("q", q);
    u.set("page", String(p));
    return "/api/products?" + u;
  };

  useEffect(() => { setData(initial); setPage(1); }, [initial]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || loading || !data.hasMore) return;
      setLoading(true);
      try {
        const r = await http<Result>(query(page + 1));
        setData((d) => ({ ...r, items: [...d.items, ...r.items] }));
        setPage((p) => p + 1);
      } finally { setLoading(false); }
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.hasMore, loading, page]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (bar.current && !bar.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const push = (u: URLSearchParams) => {
    u.delete("page");
    // Server page re-renders with the new searchParams and hands us fresh `initial`.
    startTransition(() => router.replace(`${pathname}${u.size ? "?" + u : ""}`, { scroll: false }));
  };
  const toggle = (k: string, v: string) => {
    const cur = sel(k);
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    const u = new URLSearchParams(sp);
    if (next.length) u.set(k, next.join(",")); else u.delete(k);
    push(u);
  };
  const setSort = (s: string) => { const u = new URLSearchParams(sp); u.set("sort", s); push(u); setOpen(null); };
  const clearAll = () => { const u = new URLSearchParams(sp); FILTER_KEYS.forEach((k) => u.delete(k)); push(u); };

  const applied = FILTER_KEYS.flatMap((k) => sel(k).map((v) => ({ k, v, label: data.facets[k]?.options.find((o) => o.value === v)?.label ?? v })));
  const sortOptions = searchMode ? { relevance: "Relevance", ...SORT_LABELS } : SORT_LABELS;
  const facets = FILTER_KEYS.map((k) => [k, data.facets[k]] as const).filter(([, f]) => f && f.options.length);

  const Options = ({ k, f }: { k: string; f: Facet }) => (
    <ul>
      {f.options.map((o) => (
        <li key={o.value}>
          <button onClick={() => toggle(k, o.value)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-[#555]">
            <Check on={sel(k).includes(o.value)} />
            <span className="flex-1">{o.label}</span>
            <span className="font-semibold text-ink">{o.count}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      {/* Desktop bar */}
      <div ref={bar} className="relative mt-6 hidden h-[66px] items-center bg-soft px-5 md:flex">
        {searchMode ? (
          <p className="flex-1 text-[15px]">{data.total} Products found{q ? ` for "${q}"` : ""}</p>
        ) : (
          <div className="flex flex-1 gap-9">
            {facets.map(([k, f]) => (
              <div key={k} className="relative">
                <button onClick={() => setOpen(open === k ? null : k)} className="flex items-center gap-1.5 text-[15px] font-semibold" aria-expanded={open === k}>
                  {f.label} <Icon name={open === k ? "up" : "down"} size={18} />
                </button>
                {open === k && (
                  <div className="absolute left-[-10px] top-9 z-30 max-h-[330px] w-[240px] overflow-y-auto border border-line bg-white shadow-md">
                    <Options k={k} f={f} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="relative flex h-full items-center border-l border-[#d8d8d8] pl-5">
          <button onClick={() => setOpen(open === "sort" ? null : "sort")} className="flex items-center gap-2 text-[15px] font-semibold">
            <Icon name="sort" size={18} /> Sort: {sortOptions[sort as keyof typeof sortOptions] ?? "Popularity"}
          </button>
          {open === "sort" && (
            <ul className="absolute right-0 top-[58px] z-30 w-[245px] border border-line bg-white shadow-md">
              {Object.entries(sortOptions).map(([v, l]) => (
                <li key={v}><button onClick={() => setSort(v)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-[#555]"><Check on={sort === v} />{l}</button></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Mobile bar */}
      <div className="mt-4 flex h-[62px] items-center bg-soft md:hidden">
        {searchMode ? <p className="flex-1 px-3 text-[15px]">{data.total} Products found</p> : (
          <button onClick={() => setSheet(true)} className="flex flex-1 items-center justify-center gap-2 text-[15px] font-semibold"><Icon name="sort" size={18} />Filters{applied.length ? ` (${applied.length})` : ""}</button>
        )}
        <div className="h-9 w-px bg-[#d8d8d8]" />
        <div className="relative flex flex-1 justify-center">
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="absolute inset-0 opacity-0" aria-label="Sort">
            {Object.entries(sortOptions).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span className="flex items-center gap-2 text-[15px] font-semibold"><Icon name="sort" size={18} />Sort: {sortOptions[sort as keyof typeof sortOptions]}</span>
        </div>
      </div>

      {applied.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[13px]">
          <span className="text-[#555]">Applied Filters:</span>
          {applied.map((a) => (
            <button key={a.k + a.v} onClick={() => toggle(a.k, a.v)} className="flex items-center gap-1 border border-[#bbb] px-2 py-1 text-[11px] font-semibold">{a.label}<Icon name="close" size={12} stroke={2} /></button>
          ))}
          <button onClick={clearAll} className="text-[12px] font-semibold underline">Clear All</button>
        </div>
      )}

      <div className="mt-8">
        {refreshing ? <GridSkeleton /> : data.items.length ? <ProductGrid items={data.items} /> : (
          <div className="py-20 text-center">
            <Icon name="search" size={48} className="mx-auto text-[#c4c4c4]" />
            <p className="mt-4 text-[16px] font-semibold">No products found</p>
            <p className="mt-1 text-[13px] text-muted">Try removing some filters or searching for something else.</p>
            {applied.length > 0 && <button onClick={clearAll} className="btn-black mt-5 h-11 px-6 text-sm">Clear Filters</button>}
          </div>
        )}
      </div>
      <div ref={sentinel} />
      {loading && <DotLoader />}

      {/* Mobile filter sheet */}
      {sheet && (
        <div className="anim-fade fixed inset-0 z-[70] flex flex-col bg-white md:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <button onClick={() => setSheet(false)} className="flex items-center gap-2 text-[16px] font-semibold"><Icon name="back" size={20} />Filters</button>
            <button onClick={clearAll} className="text-[15px] font-semibold">Clear All</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4">
            {facets.map(([k, f]) => (
              <details key={k} open={k === "type"} className="border-b border-line py-2">
                <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">{f.label}<Icon name="down" size={20} className="transition-transform [details[open]_&]:rotate-180" /></summary>
                <Options k={k} f={f} />
              </details>
            ))}
          </div>
          <div className="p-4"><button onClick={() => setSheet(false)} className="btn-black h-12 w-full normal-case">Show Results ({data.total})</button></div>
        </div>
      )}
    </div>
  );
}
