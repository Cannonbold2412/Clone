import type { Metadata } from "next";
import { FlowHeader } from "@/components/Chrome";
import { Listing } from "@/components/Listing";
import { SearchBox } from "@/components/SearchBox";
import { listProducts, parseFilters } from "@/lib/catalog";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q, sort, filters } = parseFilters(await searchParams);
  const initial = await listProducts({ q: q || undefined, sort, filters });
  return (
    <>
    <FlowHeader />
    <div className="container-x py-6 md:py-8">
      <h1 className="section-title normal-case">Search</h1>
      <SearchBox initial={q} />
      <Listing initial={initial} q={q || undefined} searchMode />
    </div>
    </>
  );
}
