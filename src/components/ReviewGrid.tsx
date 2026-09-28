"use client";

import { useState } from "react";
import { ReviewCard, ReviewModal } from "./Home";

type Review = Parameters<typeof ReviewCard>[0]["r"];

export function ReviewGrid({ reviews }: { reviews: Review[] }) {
  const [open, setOpen] = useState<Review | null>(null);
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {reviews.map((r) => <ReviewCard key={r.id} r={r} onMore={() => setOpen(r)} />)}
      </div>
      <ReviewModal r={open} onClose={() => setOpen(null)} />
    </>
  );
}
