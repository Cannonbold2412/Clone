import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewCarousel } from "@/components/Home";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductGrid } from "@/components/ProductCard";
import { RecentPurchases } from "@/components/RecentPurchases";
import { couponList, getProduct, getReviews, productCards, recentPurchases } from "@/lib/catalog";
import { timeAgo } from "@/lib/format";

type Props = { params: Promise<{ id: string; sku: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).id);
  if (!p) return {};
  const img = JSON.parse(p.images)[0];
  return {
    title: { absolute: `ZARI LANE ${p.name} Price in India - Buy ZARI LANE ${p.name} online at zarilane.in` },
    description: p.description.slice(0, 160),
    openGraph: { title: p.name, images: [img] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id, sku } = await params;
  const p = await getProduct(id);
  if (!p) notFound();
  const [recent, reviews, trending, best, coupons] = await Promise.all([
    recentPurchases(10), getReviews(12), productCards("nwArr004", 4), productCards("bstSl007", 8), couponList(),
  ]);
  const product = {
    id: p.id, slug: p.slug, name: p.name, description: p.description, returnDays: p.returnDays,
    images: JSON.parse(p.images) as string[], specs: JSON.parse(p.specs) as [string, string][],
    variants: p.variants.map((v) => ({ id: v.id, size: v.size, price: v.price, mrp: v.mrp, stock: v.stock })),
  };
  return (
    <>
      <ProductDetail p={product} sku={sku} coupons={coupons.map((c) => ({ ...c, eligible: false }))} />
      <RecentPurchases items={recent.map((r) => ({ ...r, ago: timeAgo(r.at) }))} />
      <section className="container-x py-10"><h2 className="section-title">CUSTOMERS FEEDBACK</h2><div className="mt-8"><ReviewCarousel reviews={reviews} /></div></section>
      <section className="container-x py-10"><h2 className="section-title">TRENDING NOW ✨</h2><div className="mt-8"><ProductGrid items={trending} /></div></section>
      <section className="container-x py-10"><h2 className="section-title">BEST SELLERS</h2><div className="mt-8"><ProductGrid items={best.filter((b) => b.id !== p.id)} /></div></section>
      <div className="h-[70px] md:hidden" />
    </>
  );
}
