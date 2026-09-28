"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Whatsapp } from "./Icon";
import { http, useStore } from "./Store";

export function LoginForm({ onDone, label = "Enter Mobile No*" }: { onDone?: () => void; label?: string }) {
  const { refresh, toast } = useStore();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const validPhone = /^[6-9]\d{9}$/.test(phone);

  const send = async () => {
    if (!validPhone) return setError("Please enter a valid 10 digit mobile number");
    setBusy(true); setError("");
    try {
      const r = await http<{ devOtp?: string }>("/api/auth/otp", { method: "POST", json: { phone } });
      setDevOtp(r.devOtp);
      setStep("otp"); setOtp(""); setWait(30);
      toast("OTP sent successfully");
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) return setError("Please enter the 6 digit OTP");
    setBusy(true); setError("");
    try {
      await http("/api/auth/verify", { method: "POST", json: { phone, code: otp } });
      await refresh();
      toast("Logged in successfully");
      onDone?.();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (step === "phone") send(); else verify(); }} noValidate>
      {step === "phone" ? (
        <>
          <label htmlFor="phone" className="text-[13px] font-semibold">{label}</label>
          <div className={`mt-1 flex h-[50px] items-center gap-3 border-2 px-3 ${error ? "border-sale" : "border-[#9a9a9a] focus-within:border-ink"}`}>
            <Whatsapp />
            <span className="text-[15px]">+91</span>
            <input id="phone" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone} autoFocus
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }}
              placeholder={label} className="h-full flex-1 text-[15px] outline-none" aria-invalid={!!error} />
          </div>
        </>
      ) : (
        <>
          <p className="text-[14px]">OTP sent to <b>+91 {phone}</b> <button type="button" onClick={() => { setStep("phone"); setError(""); }} className="ml-1 text-[13px] font-semibold underline">Change</button></p>
          <label htmlFor="otp" className="mt-4 block text-[13px] font-semibold">Enter OTP*</label>
          <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} autoFocus
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
            placeholder="6 digit OTP" className="field mt-1 h-[50px] border-2 text-[18px] tracking-[0.5em]" aria-invalid={!!error} />
          <div className="mt-2 flex justify-between text-[12px]">
            {devOtp ? <span className="text-muted">Dev mode OTP: <b className="text-ink">{devOtp}</b></span> : <span />}
            <button type="button" disabled={wait > 0 || busy} onClick={send} className="font-semibold underline disabled:no-underline disabled:opacity-60">{wait > 0 ? `Resend OTP in ${wait}s` : "Resend OTP"}</button>
          </div>
        </>
      )}
      {error && <p className="mt-2 text-[12px] font-medium text-sale" role="alert">{error}</p>}
      <div className="mt-5 border-t border-line pt-3">
        <button disabled={busy || (step === "phone" ? !validPhone : otp.length !== 6)} className="btn-black h-[45px] w-full text-[15px] normal-case">
          {busy ? "Please wait…" : step === "phone" ? "Continue" : "Verify & Continue"}
        </button>
      </div>
      <p className="mt-4 text-center text-[13px]">By proceeding, I agree to the <Link href="/terms-and-conditions" className="underline">T&amp;C</Link> &amp; <Link href="/privacy-policy" className="underline">Privacy Policy</Link></p>
      <p className="mt-3 bg-[#eef1fb] py-1.5 text-center text-[10px] text-[#444]">Secured by <b>Zari Lane</b> checkout</p>
    </form>
  );
}
