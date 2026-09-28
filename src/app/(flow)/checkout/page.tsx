import type { Metadata } from "next";
import { Suspense } from "react";
import { FlowHeader } from "@/components/Chrome";
import { Checkout } from "@/components/Checkout";
import { couponList } from "@/lib/catalog";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  return (
    <>
      <FlowHeader title="Checkout" backHref="/bag" />
      <Suspense><Checkout coupons={await couponList()} /></Suspense>
    </>
  );
}
