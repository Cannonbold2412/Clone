import Link from "next/link";
import { brand } from "@/lib/format";
import { Facebook, Icon, Instagram } from "./Icon";

const POLICIES = [
  ["/about-us", "About Us"], ["/return-policy", "Return Policy"], ["/terms-and-conditions", "Terms & Conditions"],
  ["/privacy-policy", "Privacy Policy"], ["/shipping-policy", "Shipping Policy"],
];

const PAY = [["PhonePe", "#5f259f"], ["G Pay", "#5f6368"], ["paytm", "#002e6e"], ["UPI", "#555"], ["RuPay", "#1c3f94"], ["●●", "#eb001b"], ["VISA", "#1a1f71"]];

export function Footer({ searched }: { searched: { href: string; label: string }[] }) {
  return (
    <footer className="bg-black pb-8 pt-8 text-white">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-[610px]">
            <img src="/logo.svg" alt="" width={41} height={41} className="bg-white" />
            <h2 className="mt-2 text-[20px] font-normal">{brand.upper}</h2>
            <p className="mt-3 text-[13px] font-medium leading-5">Welcome to {brand.upper} website, we are an MSE based out of India. We aim to deliver high-quality products to our customers.</p>
            <div className="mt-6 flex gap-5">
              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook /></a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram /></a>
            </div>
          </div>
          <div className="text-[13px] font-medium md:w-[398px]">
            <h3 className="mb-3 text-[17px] font-bold">Contact Us</h3>
            <p className="mb-3">WhatsApp: <a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noopener noreferrer">{brand.phone}</a></p>
            <p className="mb-3">Customer Support Time: 24/7</p>
            <p>Address: 12, Textile Market Road, Ring Road, Surat - 395002, Gujarat, India</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-around gap-x-8 gap-y-3 border-y border-[#555] py-4 text-[13px] font-bold">
          {POLICIES.map(([h, l]) => <Link key={h} href={h} className="hover:underline">{l}</Link>)}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold">
          <span className="font-bold">Most searched on store</span>
          {searched.map((s) => <Link key={s.href} href={s.href} className="hover:underline">{s.label}</Link>)}
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            {PAY.map(([l, c]) => (
              <span key={l} className="flex h-8 w-[61px] items-center justify-center rounded-sm bg-white text-[11px] font-extrabold italic" style={{ color: c }}>{l}</span>
            ))}
          </div>
          <a href="#top" className="flex h-[52px] w-[204px] items-center justify-center gap-2 border border-white bg-white text-[15px] font-semibold text-black">
            <Icon name="arrowUp" size={20} /> Go to Top
          </a>
        </div>
        <p className="mt-6 text-[12px] text-[#aaa]">© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
