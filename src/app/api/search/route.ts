import { api } from "@/lib/api";
import { listProducts } from "@/lib/catalog";

// Typeahead suggestions.
export const GET = api(async (req) => {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (!q) return { items: [] };
  const { items } = await listProducts({ q, pageSize: 8 });
  return { items: items.map((i) => ({ id: i.id, slug: i.slug, sku: i.sku, name: i.name, image: i.images[0] })) };
});
