import type { Metadata } from "next";
import { BagPage } from "@/components/BagPage";
import { FlowHeader } from "@/components/Chrome";
import { couponList } from "@/lib/catalog";

export const metadata: Metadata = { title: "My Bag" };
export const dynamic = "force-dynamic";

export default async function Bag() {
  return (
    <>
      <FlowHeader title="My Bag" />
      <BagPage coupons={await couponList()} />
    </>
  );
}
