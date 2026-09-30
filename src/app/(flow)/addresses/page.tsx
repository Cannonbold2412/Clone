import type { Metadata } from "next";
import { AccountNav, AddressBook, LoginGate } from "@/components/Account";
import { FlowHeader } from "@/components/Chrome";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Saved Addresses", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await currentUser();
  if (!user) return <><FlowHeader title="Login" backHref="/" /><LoginGate /></>;
  const list = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return (
    <>
      <FlowHeader title="Saved Addresses" backHref="/" />
      <div className="container-x py-6 pb-24">
        <AccountNav email={user.email ?? ""} />
        <AddressBook initial={list} email={user.email ?? ""} />
      </div>
    </>
  );
}
