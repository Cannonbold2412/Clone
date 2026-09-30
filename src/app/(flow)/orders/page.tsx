import type { Metadata } from "next";
import Link from "next/link";
import { AccountNav, LoginGate } from "@/components/Account";
import { FlowHeader } from "@/components/Chrome";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { inr } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orders";

export const metadata: Metadata = { title: "My Orders", robots: { index: false } };
export const dynamic = "force-dynamic";

const statusColor = (s: string) =>
  s === "DELIVERED" || s === "CONFIRMED" ? "text-offer" : s === "PAYMENT_FAILED" || s === "CANCELLED" ? "text-sale" : s === "PENDING_PAYMENT" ? "text-[#b7791f]" : "text-[#1d4ed8]";

export default async function OrdersPage() {
  const user = await currentUser();
  if (!user) return <><FlowHeader title="Login" backHref="/" /><LoginGate /></>;
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: true } });
  return (
    <>
      <FlowHeader title="My Orders" backHref="/" />
      <div className="container-x py-6 pb-24">
        <AccountNav email={user.email ?? ""} />
        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[18px] font-semibold">No orders yet</p>
            <p className="mt-2 text-[14px] text-muted">When you place an order, it will show up here.</p>
            <Link href="/" className="btn-black mt-6 inline-flex h-12 items-center px-10 text-[15px]">Start Shopping</Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex gap-4 border border-line p-4 transition-shadow hover:shadow-md">
                  <img src={o.items[0]?.image} alt="" className="h-[110px] w-[80px] object-cover" />
                  <div className="min-w-0 flex-1 text-[13px]">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-bold">Order #{o.number}</span>
                      <span className={`font-bold ${statusColor(o.status)}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
                    </div>
                    <p className="mt-1 text-muted">Placed on {o.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="mt-2 truncate text-[14px]">{o.items[0]?.name}{o.items.length > 1 ? ` + ${o.items.length - 1} more` : ""}</p>
                    <p className="mt-2 font-bold">
                      {inr(o.total)}{" "}
                      <span className="ml-1 font-normal text-muted">· {o.paymentMethod === "COD" ? "Cash on Delivery" : o.paymentMethod === "PARTIAL" ? "Part online, part COD" : "Online payment"}</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
