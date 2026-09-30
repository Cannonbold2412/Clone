"use client";

import { useCallback, useState } from "react";
import { inr } from "@/lib/format";
import { Icon } from "./Icon";
import { http } from "./Store";

export type PayOrder = { orderId: string; number: string; payment: { gatewayOrderId: string; sessionId: string; amount: number }; prefill: { email: string; name: string } };
export type Gateway = { mode: "cashfree" | "simulator"; env: "sandbox" | "production" };
export type Outcome = { result: "paid" | "failed" | "cancelled"; orderId: string; error?: string };

type SimPayment = { order_id: string; payment_id: string; signature: string };
type CfResult = { error?: { message?: string }; paymentDetails?: unknown };
type CfInstance = { checkout: (o: { paymentSessionId: string; redirectTarget: "_modal" }) => Promise<CfResult | undefined> };
declare global { interface Window { Cashfree?: (o: { mode: "sandbox" | "production" }) => CfInstance } }

function loadScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Cashfree) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Cashfree Checkout (or the local simulator) and resolves once the server has verified / recorded the outcome. */
export function usePayment(gateway: Gateway | null) {
  const [sim, setSim] = useState<{ order: PayOrder; resolve: (o: Outcome) => void } | null>(null);

  // The server asks Cashfree (or checks the simulator HMAC); the browser's own word is never enough.
  const verify = (order: PayOrder, sig?: SimPayment) =>
    http<{ paid: boolean }>("/api/payments/verify", { method: "POST", json: { order_id: order.payment.gatewayOrderId, ...sig } });
  const report = (order: PayOrder, reason: "FAILED" | "CANCELLED", error: string, paymentId?: string) =>
    http("/api/payments/failed", { method: "POST", json: { order_id: order.payment.gatewayOrderId, reason, error, payment_id: paymentId } }).catch(() => {});

  const pay = useCallback(async (order: PayOrder): Promise<Outcome> => {
    if (!gateway) throw new Error("Payment is not available right now");
    if (gateway.mode === "simulator") return new Promise((resolve) => setSim({ order, resolve }));

    if (!(await loadScript()) || !window.Cashfree) throw new Error("Could not load Cashfree. Please check your connection and try again.");
    const result = await window.Cashfree({ mode: gateway.env }).checkout({ paymentSessionId: order.payment.sessionId, redirectTarget: "_modal" });
    try {
      if ((await verify(order)).paid) return { result: "paid", orderId: order.orderId };
    } catch (e) {
      return { result: "failed", orderId: order.orderId, error: (e as Error).message };
    }
    const msg = result?.error?.message ?? "";
    const cancelled = !msg || /abort|clos|cancel|drop/i.test(msg);
    await report(order, cancelled ? "CANCELLED" : "FAILED", cancelled ? "Payment cancelled by user" : msg);
    return { result: cancelled ? "cancelled" : "failed", orderId: order.orderId, error: cancelled ? undefined : msg };
  }, [gateway]);

  const finishSim = async (kind: "success" | "failure" | "dismiss") => {
    if (!sim) return;
    const { order, resolve } = sim;
    setSim(null);
    if (kind === "dismiss") { await report(order, "CANCELLED", "Payment cancelled by user"); return resolve({ result: "cancelled", orderId: order.orderId }); }
    try {
      const r = await http<Partial<SimPayment> & { description?: string; payment_id?: string }>("/api/payments/simulate", { method: "POST", json: { order_id: order.payment.gatewayOrderId, outcome: kind } });
      if (r.description) { await report(order, "FAILED", r.description, r.payment_id); return resolve({ result: "failed", orderId: order.orderId, error: r.description }); }
      await verify(order, r as SimPayment);
      resolve({ result: "paid", orderId: order.orderId });
    } catch (e) {
      resolve({ result: "failed", orderId: order.orderId, error: (e as Error).message });
    }
  };

  const modal = sim && <SimulatedCheckout order={sim.order} onFinish={finishSim} />;
  return { pay, modal };
}

function SimulatedCheckout({ order, onFinish }: { order: PayOrder; onFinish: (k: "success" | "failure" | "dismiss") => void }) {
  const [method, setMethod] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const go = (k: "success" | "failure") => { setBusy(true); onFinish(k); };
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-3 text-left" role="dialog" aria-modal="true" aria-label="Payment">
      <div className="anim-fade relative w-full max-w-[720px] overflow-hidden rounded-lg bg-white shadow-2xl md:flex">
        <div className="bg-[#0b1d3a] p-6 text-white md:w-[260px]">
          <div className="flex items-center gap-3"><img src="/logo.svg" alt="" className="h-10 w-10 rounded bg-white" /><div><p className="font-semibold">Zari Lane</p><p className="text-[11px] opacity-70">Order #{order.number}</p></div></div>
          <p className="mt-8 text-[12px] opacity-70">Amount payable</p>
          <p className="text-[28px] font-bold">{inr(order.payment.amount / 100)}</p>
          <p className="mt-8 inline-block rounded bg-[#f5a623] px-2 py-1 text-[11px] font-bold text-black">TEST MODE · SIMULATOR</p>
          <p className="mt-3 text-[11px] leading-4 opacity-70">No Cashfree keys configured. This local simulator issues a signed test payment that the server verifies before confirming the order.</p>
        </div>
        <div className="flex-1 p-6">
          <button aria-label="Close payment" onClick={() => onFinish("dismiss")} className="absolute right-3 top-3 p-1 text-[#555]"><Icon name="close" /></button>
          {!method ? (
            <>
              <p className="text-[15px] font-semibold">Payment Options</p>
              <ul className="mt-4 space-y-2">
                {[["UPI", "Google Pay, PhonePe, Paytm & more"], ["Card", "Visa, MasterCard, RuPay"], ["Netbanking", "All Indian banks"], ["Wallet", "PhonePe, Freecharge & more"]].map(([m, d]) => (
                  <li key={m}><button onClick={() => setMethod(m)} className="flex w-full items-center justify-between rounded border border-[#e3e3e3] px-4 py-3 text-left hover:border-[#0b1d3a]"><span><b className="block text-[14px]">{m}</b><span className="text-[12px] text-muted">{d}</span></span><Icon name="right" size={18} /></button></li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <button onClick={() => setMethod(null)} className="flex items-center gap-1 text-[13px] font-semibold"><Icon name="back" size={16} />{method}</button>
              <p className="mt-6 text-[14px]">Simulated bank page. Choose the outcome of this test payment:</p>
              <div className="mt-6 flex gap-3">
                <button disabled={busy} onClick={() => go("success")} className="h-11 flex-1 rounded bg-[#1aa34a] text-[14px] font-bold text-white disabled:opacity-60">Success</button>
                <button disabled={busy} onClick={() => go("failure")} className="h-11 flex-1 rounded bg-[#d93025] text-[14px] font-bold text-white disabled:opacity-60">Failure</button>
              </div>
              {busy && <p className="mt-4 text-center text-[12px] text-muted">Processing payment…</p>}
            </>
          )}
          <p className="mt-8 flex items-center gap-1 text-[11px] text-muted"><Icon name="lock" size={14} /> Secured by Cashfree (simulated)</p>
        </div>
      </div>
    </div>
  );
}
