import type { Metadata } from "next";
import { ReviewGrid } from "@/components/ReviewGrid";
import { getReviews } from "@/lib/catalog";

export const metadata: Metadata = { title: "Customers Feedback" };
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getReviews();
  return (
    <div className="container-x py-10">
      <h1 className="section-title">CUSTOMERS FEEDBACK</h1>
      <p className="mt-2 text-center text-[14px] text-muted">{reviews.length} reviews · 5.0 average rating</p>
      <div className="mt-8"><ReviewGrid reviews={reviews} /></div>
    </div>
  );
}
