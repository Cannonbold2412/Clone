import { api } from "@/lib/api";
import { listProducts, parseFilters } from "@/lib/catalog";

export const GET = api(async (req) => {
  const sp = new URL(req.url).searchParams;
  const { filters, sort, page, q } = parseFilters(sp);
  return listProducts({ collectionId: sp.get("collection") || undefined, q: q || undefined, filters, sort, page });
});
