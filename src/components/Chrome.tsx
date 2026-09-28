"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { useStore } from "./Store";

export type NavItem = { href: string; label: string };

const MESSAGES = ["Minimum 50% off on all products.", "Extra 20% off on online payments."];

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % MESSAGES.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-[35px] overflow-hidden bg-black text-white">
      <div className="flex h-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {MESSAGES.map((m) => (
          <p key={m} className="flex h-full w-full shrink-0 items-center justify-center text-[12px] font-semibold">{m}</p>
        ))}
      </div>
    </div>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Link href="/" aria-label="Zari Lane home" className="inline-flex">
      <img src="/logo.svg" alt="Zari Lane" width={size} height={size} className="rounded-full" />
    </Link>
  );
}

function BagButton() {
  const { cart } = useStore();
  const n = cart?.qty ?? 0;
  return (
    <Link href="/bag" aria-label={`Bag, ${n} items`} className="relative p-1">
      <Icon name="bag" size={24} />
      {n > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white ring-2 ring-white">{n}</span>}
    </Link>
  );
}

export function Header({ nav }: { nav: NavItem[] }) {
  const router = useRouter();
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-[#9e9e9e] bg-white">
      {/* Desktop */}
      <div className="container-x hidden md:block">
        <div className="relative flex h-[68px] items-center justify-between">
          <button onClick={() => router.push("/search")} className="flex h-[43px] w-[227px] items-center gap-3 border border-[#9e9e9e] px-3 text-left text-[15px] text-[#757575]">
            <Icon name="search" size={22} className="text-ink" /> Search
          </button>
          <div className="absolute left-1/2 -translate-x-1/2"><Logo /></div>
          <div className="flex items-center gap-6">
            <Link href="/orders" aria-label="Account and orders" className="p-1"><Icon name="user" size={24} /></Link>
            <BagButton />
          </div>
        </div>
        <nav className="flex h-[35px] items-start justify-center gap-10">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`text-[14px] font-semibold hover:underline ${path === n.href ? "underline underline-offset-4" : ""}`}>{n.label}</Link>
          ))}
        </nav>
      </div>
      {/* Mobile */}
      <div className="flex h-[65px] items-center justify-between px-4 md:hidden">
        <Link href="/search" aria-label="Search" className="p-1"><Icon name="search" size={22} /></Link>
        <Logo />
        <BagButton />
      </div>
    </header>
  );
}

export function MobileTabBar({ nav }: { nav: NavItem[] }) {
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  useEffect(() => setMenu(false), [path]);
  const tab = "flex flex-1 flex-col items-center justify-center gap-1 text-[12px] font-semibold";
  return (
    <>
      {menu && (
        <div className="anim-fade fixed inset-0 bottom-[66px] z-50 overflow-y-auto bg-white px-4 py-3 md:hidden">
          {[{ href: "/", label: "HOME" }, ...nav.slice(1)].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMenu(false)} className="block py-4 text-[16px] font-semibold">{n.label}</Link>
          ))}
          <Link href="/orders" onClick={() => setMenu(false)} className="block py-4 text-[16px] font-semibold">MY ORDERS</Link>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[66px] border-t border-[#d5d5d5] bg-white md:hidden">
        <Link href="/" className={tab}><Icon name="home" size={22} />Home</Link>
        <Link href="/orders" className={tab}><Icon name="user" size={22} />Orders</Link>
        <button className={tab} onClick={() => setMenu((m) => !m)} aria-expanded={menu}><Icon name={menu ? "close" : "menu"} size={22} />Browse</button>
      </nav>
      <div className="h-[66px] md:hidden" />
    </>
  );
}

/** Simplified header used on bag / checkout / login pages (back arrow + title + logo). */
export function FlowHeader({ title, backHref }: { title?: string; backHref?: string }) {
  const router = useRouter();
  return (
    <div className="border-b border-line bg-white">
      <div className="container-x flex h-[65px] items-center justify-between">
        <button onClick={() => (backHref ? router.push(backHref) : history.length > 1 ? router.back() : router.push("/"))} className="flex items-center gap-2 text-[17px] font-bold">
          <Icon name="back" size={22} /> {title}
        </button>
        <Logo />
      </div>
    </div>
  );
}
