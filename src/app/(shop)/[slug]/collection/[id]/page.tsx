import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing } from "@/components/Listing";
import { listProducts, parseFilters } from "@/lib/catalog";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await db.collection.findUnique({ where: { id: (await params).id } });
  return c ? { title: { absolute: `ZARI LANE ${c.name} - Buy ${c.name} from zarilane.in online at best prices` } } : {};
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const c = await db.collection.findUnique({ where: { id: (await params).id } });
  if (!c) notFound();
  const { filters, sort } = parseFilters(await searchParams);
  const initial = await listProducts({ collectionId: c.id, filters, sort });
  return (
    <div className="container-x pb-10 pt-8 md:pt-10">
      <h1 className="section-title">{c.name}</h1>
      <Listing initial={initial} collectionId={c.id} />
    </div>
  );
}
