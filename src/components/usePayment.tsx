"use client";

import { useCallback, useRef, useState } from "react";
import { inr } from "@/lib/format";
import { Icon } from "./Icon";
import { http } from "./Store";

export type PayOrder = { orderId: string; number: string; payment: { razorpayOrderId: string; amount: number }; prefill: { contact: string; name: string } };
export type Gateway = { mode: "razorpay" | "simulator"; keyId: string };
export type Outcome = { result: "paid" | "failed" | "cancelled"; orderId: string; error?: string };

type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RzpInstance = { open: () => void; on: (e: string, cb: (r: { error: { description: string; metadata?: { payment_id?: string } } }) => void) => void };
declare global { interface Window { Razorpay?: new (opts: object) => RzpInstance } }

function loadScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Razorpay Checkout (or the local simulator) and resolves once the server has verified / recorded the outcome. */
export function usePayment(gateway: Gateway | null) {
  const [sim, setSim] = useState<{ order: PayOrder; resolve: (o: Outcome) => void } | null>(null);
  const settled = useRef(false);

  const verify = async (order: PayOrder, r: RzpResponse): Promise<Outcome> => {
    try {
      await http("/api/payments/verify", { method: "POST", json: r });
      return { result: "paid", orderId: order.orderId };
    } catch (e) {
      return { result: "failed", orderId: order.orderId, error: (e as Error).message };
    }
  };
  const report = (order: PayOrder, reason: "FAILED" | "CANCELLED", error: string, paymentId?: string) =>
    http("/api/payments/failed", { method: "POST", json: { razorpay_order_id: order.payment.razorpayOrderId, reason, error, razorpay_payment_id: paymentId } }).catch(() => {});

  const pay = useCallback(async (order: PayOrder): Promise<Outcome> => {
    settled.current = false;
    if (!gateway) throw new Error("Payment is not available right now");
    if (gateway.mode === "simulator") return new Promise((resolve) => setSim({ order, resolve }));

    if (!(await loadScript()) || !window.Razorpay) throw new Error("Could not load Razorpay. Please check your connection and try again.");
    return new Promise<Outcome>((resolve) => {
      let failedMsg = "";
      const rzp = new window.Razorpay!({
        key: gateway.keyId,
        amount: order.payment.amount,
        currency: "INR",
        name: "Zari Lane",
        description: `Order #${order.number}`,
        image: `${location.origin}/logo.svg`,
        order_id: order.payment.razorpayOrderId,
        prefill: order.prefill,
        notes: { order_number: order.number },
        theme: { color: "#000000" },
        retry: { enabled: true },
        handler: async (r: RzpResponse) => { settled.current = true; resolve(await verify(order, r)); },
        modal: {
          confirm_close: true,
          ondismiss: async () => {
            if (settled.current) return;
            settled.current = true;
            await report(order, failedMsg ? "FAILED" : "CANCELLED", failedMsg || "Payment cancelled by user");
            resolve({ result: failedMsg ? "failed" : "cancelled", orderId: order.orderId, error: failedMsg });
          },
        },
      });
      // Razorpay keeps the modal open after a failure so the customer can retry; we record it and wait for dismiss/success.
      rzp.on("payment.failed", (r) => { failedMsg = r.error.description; report(order, "FAILED", failedMsg, r.error.metadata?.payment_id); });
      rzp.open();
    });
  }, [gateway]);

  const finishSim = async (kind: "success" | "failure" | "dismiss") => {
    if (!sim) return;
    const { order, resolve } = sim;
    setSim(null);
    if (kind === "dismiss") { await report(order, "CANCELLED", "Payment cancelled by user"); return resolve({ result: "cancelled", orderId: order.orderId }); }
    try {
      const r = await http<RzpResponse & { error?: { description: string; metadata: { payment_id: string } } }>("/api/payments/simulate", { method: "POST", json: { razorpay_order_id: order.payment.razorpayOrderId, outcome: kind } });
      if (r.error) { await report(order, "FAILED", r.error.description, r.error.metadata.payment_id); return resolve({ result: "failed", orderId: order.orderId, error: r.error.description }); }
      resolve(await verify(order, r));
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
          <p className="mt-3 text-[11px] leading-4 opacity-70">No Razorpay keys configured. This local simulator issues a signed test payment that the server verifies exactly like a real Razorpay payment.</p>
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
          <p className="mt-8 flex items-center gap-1 text-[11px] text-muted"><Icon name="lock" size={14} /> Secured by Razorpay (simulated)</p>
        </div>
      </div>
    </div>
  );
}
