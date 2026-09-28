import { db } from "./db";

export const PRICE_BUCKETS: [number, number][] = [
  [0, 200], [200, 500], [500, 700], [700, 1000], [1000, 1500], [1500, 2000], [2000, 2500], [2500, 100000],
];
export const bucketLabel = ([a, b]: [number, number]) => (b >= 100000 ? `${a}+` : `${a} - ${b}`);
export const SORTS = { popularity: "Popularity", price_desc: "Price High to Low", price_asc: "Price Low to High", newest: "Newest", sequential: "Sequential" } as const;
export type SortKey = keyof typeof SORTS;

export type Filters = { type?: string[]; size?: string[]; color?: string[]; price?: string[] };

const productInclude = { variants: true, collections: true } as const;
type Row = Awaited<ReturnType<typeof loadRows>>[number];

async function loadRows(collectionId?: string) {
  return db.product.findMany({
    where: collectionId ? { collections: { some: { collectionId } } } : undefined,
    include: productInclude,
  });
}

export function card(p: Row) {
  const v = [...p.variants].sort((a, b) => a.price - b.price)[0];
  const inStock = p.variants.find((x) => x.stock > 0) ?? v;
  return {
    id: p.id, slug: p.slug, name: p.name, images: JSON.parse(p.images) as string[],
    price: v.price, mrp: v.mrp, sku: inStock.id, soldOut: p.variants.every((x) => x.stock <= 0),
    singleVariant: p.variants.length === 1,
  };
}
export type Card = ReturnType<typeof card>;

function matches(p: Row, f: Filters, skip?: keyof Filters) {
  const price = Math.min(...p.variants.map((v) => v.price));
  if (skip !== "type" && f.type?.length && !f.type.includes(p.productType)) return false;
  if (skip !== "size" && f.size?.length && !p.variants.some((v) => f.size!.includes(v.size))) return false;
  if (skip !== "color" && f.color?.length && !f.color.includes(p.color)) return false;
  if (skip !== "price" && f.price?.length && !f.price.some((k) => { const [a, b] = PRICE_BUCKETS[Number(k)] ?? [0, 0]; return price >= a && price < b; })) return false;
  return true;
}

function textMatch(p: Row, q: string) {
  const hay = `${p.name} ${p.productType} ${p.color}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

// ponytail: filters/sort run in memory over the collection; move to SQL once the catalog is in the thousands.
export async function listProducts(opts: { collectionId?: string; q?: string; filters?: Filters; sort?: SortKey; page?: number; pageSize?: number }) {
  const { filters = {}, sort = "popularity", page = 1, pageSize = 16 } = opts;
  let rows = await loadRows(opts.collectionId);
  if (opts.q) rows = rows.filter((p) => textMatch(p, opts.q!));

  const facet = (key: keyof Filters, values: (p: Row) => string[]) => {
    const counts = new Map<string, number>();
    for (const p of rows) if (matches(p, filters, key)) for (const v of new Set(values(p))) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, label: value, count }));
  };
  const priceCounts = PRICE_BUCKETS.map((b, i) => ({
    value: String(i), label: bucketLabel(b),
    count: rows.filter((p) => matches(p, filters, "price") && (() => { const m = Math.min(...p.variants.map((v) => v.price)); return m >= b[0] && m < b[1]; })()).length,
  }));
  const facets = {
    type: { label: "Product Type", options: facet("type", (p) => [p.productType]) },
    size: { label: "Size", options: facet("size", (p) => p.variants.map((v) => v.size)) },
    color: { label: "Colour/Variant", options: facet("color", (p) => [p.color]) },
    price: { label: "Price Range", options: priceCounts },
  };

  const pos = (p: Row) => p.collections.find((c) => c.collectionId === opts.collectionId)?.position ?? 0;
  const minPrice = (p: Row) => Math.min(...p.variants.map((v) => v.price));
  const sorted = rows.filter((p) => matches(p, filters)).sort((a, b) => {
    // Sold-out items sink to the bottom, as on the reference store.
    const so = Number(a.variants.every((v) => v.stock <= 0)) - Number(b.variants.every((v) => v.stock <= 0));
    if (so) return so;
    switch (sort) {
      case "price_asc": return minPrice(a) - minPrice(b);
      case "price_desc": return minPrice(b) - minPrice(a);
      case "newest": return +b.createdAt - +a.createdAt;
      case "sequential": return pos(a) - pos(b);
      default: return b.popularity - a.popularity;
    }
  });
  const items = sorted.slice((page - 1) * pageSize, page * pageSize).map(card);
  return { items, total: sorted.length, hasMore: page * pageSize < sorted.length, facets };
}

export async function getProduct(id: string) {
  return db.product.findUnique({ where: { id }, include: { variants: { orderBy: { price: "asc" } }, collections: true } });
}

export async function productCards(collectionId: string, take = 8) {
  return (await listProducts({ collectionId, sort: "sequential", pageSize: take })).items;
}

export function parseFilters(sp: URLSearchParams | Record<string, string | string[] | undefined>): { filters: Filters; sort: SortKey; page: number; q: string } {
  const get = (k: string) => (sp instanceof URLSearchParams ? sp.get(k) : ([] as (string | undefined)[]).concat(sp[k])[0]) ?? "";
  const list = (k: string) => get(k).split(",").filter(Boolean);
  const sort = (get("sort") in SORTS ? get("sort") : "popularity") as SortKey;
  return { filters: { type: list("type"), size: list("size"), color: list("color"), price: list("price") }, sort, page: Math.max(1, Number(get("page")) || 1), q: get("q").slice(0, 100) };
}

export const collectionHref = (c: { slug: string; id: string }) => `/${c.slug}/collection/${c.id}`;
export const productHref = (p: { slug: string; id: string; sku: string }) => `/${p.slug}/catalogue/${p.id}/${p.sku}`;

export async function navData() {
  const cols = await db.collection.findMany({ orderBy: { sort: "asc" } });
  return {
    nav: [{ href: "/", label: "HOME" }, ...cols.filter((c) => c.inNav).map((c) => ({ href: collectionHref(c), label: c.name }))],
    searched: cols.filter((c) => !c.inNav || c.name !== "FRESH COLLECTION").map((c) => ({ href: collectionHref(c), label: c.name })),
  };
}

export async function getReviews(take?: number) {
  const rows = await db.review.findMany({ orderBy: { createdAt: "desc" }, take });
  return rows.map((r) => ({ id: r.id, name: r.name, rating: r.rating, text: r.text, image: r.image, date: r.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }) }));
}

/** Social proof from real confirmed orders: first name + city only. */
export async function recentPurchases(take = 10) {
  const items = await db.orderItem.findMany({
    where: { order: { status: { in: ["CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] } } },
    orderBy: { order: { createdAt: "desc" } }, take,
    include: { order: true, variant: { include: { product: true } } },
  });
  return items.map((i) => {
    const a = JSON.parse(i.order.address) as { name: string; city: string };
    const p = i.variant.product;
    return { key: i.id, name: p.name, image: i.image, href: `/${p.slug}/catalogue/${p.id}/${i.variantId}`, who: `${a.name.split(" ")[0]} in ${a.city}`, at: i.order.createdAt };
  });
}

export async function couponList() {
  return (await db.coupon.findMany({ where: { active: true } })).map((c) => ({ code: c.code, title: c.title, description: c.description, minAmount: c.minAmount, minQty: c.minQty, maxDiscount: c.maxDiscount ?? 0 }));
}
