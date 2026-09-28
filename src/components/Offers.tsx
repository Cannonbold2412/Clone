"use client";

import { useState } from "react";
import { inr } from "@/lib/format";
import { ONLINE_OFF_MAX, ONLINE_OFF_PCT, PARTIAL_ADVANCE, PARTIAL_OFF } from "@/lib/pricing";
import { Drawer } from "./Drawer";
import { Icon } from "./Icon";

export type CouponInfo = { code: string; title: string; description: string; eligible?: boolean };

const CHECKOUT_OFFERS = [
  { key: "ONLINE", title: `Pay Online | Extra ${ONLINE_OFF_PCT}% off`, code: "ONLINE_DISCOUNT", detail: `Get extra ${ONLINE_OFF_PCT}% off (up to ${inr(ONLINE_OFF_MAX)}) when you pay online using UPI, cards, net banking or wallets. Applied automatically at the payment step.` },
  { key: "PARTIAL", title: `Pay Advance Amount | Extra ${inr(PARTIAL_OFF)} off`, code: "ADVANCE_DISCOUNT", detail: `Pay just ${inr(PARTIAL_ADVANCE)} online now, the rest in cash on delivery, and get an extra ${inr(PARTIAL_OFF)} off. Applied automatically at the payment step.` },
];

export function OffersDrawer({ open, onClose, coupons, onApply, applied, saving, withInput = false }: {
  open: boolean; onClose: () => void; coupons: CouponInfo[]; onApply?: (code: string) => Promise<boolean>; applied?: string | null; saving?: (key: string) => number; withInput?: boolean;
}) {
  const [detail, setDetail] = useState<{ title: string; code: string; detail: string; key?: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async (c: string) => {
    if (!onApply || !c.trim()) return;
    setBusy(true);
    if (await onApply(c.trim().toUpperCase())) { setCode(""); onClose(); }
    setBusy(false);
  };

  const close = () => { setDetail(null); onClose(); };

  if (detail)
    return (
      <Drawer open={open} onClose={close} title="OFFER DETAIL" underline width={400}
        footer={detail.key && saving && saving(detail.key) > 0 ? <div className="bg-[#0f8a0f] py-2 text-center text-[14px] font-medium text-white">Save {inr(saving(detail.key))} with this offer</div> : null}>
        <button onClick={() => setDetail(null)} className="mb-4 flex items-center gap-1 text-[13px] font-semibold"><Icon name="back" size={16} />All offers</button>
        <span className="inline-flex h-14 w-[72px] items-center justify-center bg-soft"><Icon name="tag" size={22} /></span>
        <h3 className="mt-5 text-[19px] font-bold">{detail.title}</h3>
        <p className="mt-2 text-[13px] text-[#444]">Coupon Code: {detail.code}</p>
        <p className="mt-4 text-[13px] leading-6 text-[#444]">{detail.detail}</p>
      </Drawer>
    );

  const Box = ({ title, sub, dim, onMore, action }: { title: string; sub?: string; dim?: boolean; onMore: () => void; action?: React.ReactNode }) => (
    <div className={`flex gap-4 border border-dashed border-[#9a9a9a] p-4 ${dim ? "text-[#9a9a9a]" : ""}`}>
      <Icon name="tag" size={24} className="mt-1 shrink-0" />
      <div className="flex-1">
        <p className="text-[15px] leading-6">{title}</p>
        {sub && <p className="text-[12px]">{sub}</p>}
        <button onClick={onMore} className={`mt-1 text-[15px] font-medium ${dim ? "" : "text-offer"}`}>Know More</button>
      </div>
      {action}
    </div>
  );

  return (
    <Drawer open={open} onClose={close} title={withInput ? "Offers" : "OFFERS & COUPONS"} underline width={400}>
      {withInput && (
        <form onSubmit={(e) => { e.preventDefault(); apply(code); }} className="mb-5 flex h-[40px] items-center border border-[#9a9a9a] bg-soft">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Type offer code" aria-label="Offer code" className="h-full flex-1 bg-transparent px-3 text-[15px] uppercase outline-none placeholder:normal-case" />
          <button disabled={busy || !code.trim()} className="px-3 text-[13px] font-semibold text-[#555] disabled:opacity-50">{busy ? "..." : "APPLY"}</button>
        </form>
      )}
      <h3 className="mb-3 text-[18px] font-bold">Checkout Offers</h3>
      <div className="space-y-2">
        {CHECKOUT_OFFERS.map((o) => <Box key={o.key} title={o.title} onMore={() => setDetail(o)} />)}
      </div>
      {coupons.length > 0 && <h3 className="mb-3 mt-7 text-[18px] font-bold">Other Offers</h3>}
      <div className="space-y-2">
        {coupons.map((c) => (
          <Box key={c.code} title={c.description} dim={!c.eligible} onMore={() => setDetail({ title: c.title, code: c.code, detail: c.description })}
            action={onApply && (applied === c.code
              ? <span className="self-center text-[12px] font-bold text-offer">APPLIED</span>
              : <button disabled={busy} onClick={() => apply(c.code)} className="self-center text-[13px] font-bold text-ink disabled:opacity-50">APPLY</button>)} />
        ))}
      </div>
    </Drawer>
  );
}
