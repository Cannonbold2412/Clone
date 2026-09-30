"use client";

import { useState } from "react";
import { INDIAN_STATES } from "@/lib/validation";
import { http } from "./Store";

export type Address = { id: string; name: string; phone: string; email: string | null; pincode: string; line1: string; line2: string; landmark: string | null; city: string; state: string; type: string; isDefault: boolean };

const EMPTY = { name: "", phone: "", email: "", pincode: "", line1: "", line2: "", landmark: "", city: "", state: "", type: "HOME", isDefault: false };

const RULES: Record<string, [RegExp, string]> = {
  name: [/^.{2,60}$/, "Please enter full name"],
  phone: [/^[6-9]\d{9}$/, "Please enter a valid 10 digit mobile number"],
  email: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
  pincode: [/^[1-9]\d{5}$/, "Please enter a valid 6 digit pincode"],
  line1: [/^.{3,120}$/, "Please enter house / flat / building"],
  line2: [/^.{3,120}$/, "Please enter area / street / locality"],
  city: [/^.{2,60}$/, "Please enter city"],
  state: [/.+/, "Please select a state"],
};

export function AddressForm({ initial, defaultEmail, onSaved, onCancel }: { initial?: Address; defaultEmail?: string; onSaved: (a: Address) => void; onCancel?: () => void }) {
  const [f, setF] = useState(() => (initial ? { ...EMPTY, ...initial, email: initial.email ?? "", landmark: initial.landmark ?? "" } : { ...EMPTY, email: defaultEmail ?? "" }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (k: string, v: string | boolean) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    for (const [k, [re, msg]] of Object.entries(RULES)) if (!re.test(String(f[k as keyof typeof f]).trim())) errs[k] = msg;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setServerError("");
    try {
      const r = await http<{ address: Address }>(initial ? `/api/addresses/${initial.id}` : "/api/addresses", { method: initial ? "PATCH" : "POST", json: f });
      onSaved(r.address);
    } catch (err) { setServerError((err as Error).message); } finally { setBusy(false); }
  };

  const input = (k: keyof typeof RULES | "landmark", label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`a-${k}`} className="mb-1 block text-[12px] font-semibold">{label}</label>
      <input id={`a-${k}`} value={String(f[k as keyof typeof f])} onChange={(e) => set(k, props.inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value)} className="field" aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <p className="mt-1 text-[11px] text-sale">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {input("name", "Full Name*", { autoComplete: "name" })}
        {input("phone", "Mobile Number*", { inputMode: "numeric", maxLength: 10, autoComplete: "tel-national" })}
      </div>
      {input("email", "Email (optional)", { type: "email", autoComplete: "email" })}
      <div className="grid grid-cols-2 gap-3">
        {input("pincode", "Pincode*", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
        {input("city", "City*", { autoComplete: "address-level2" })}
      </div>
      {input("line1", "House No. / Flat / Building*", { autoComplete: "address-line1" })}
      {input("line2", "Area / Street / Locality*", { autoComplete: "address-line2" })}
      {input("landmark", "Landmark (optional)")}
      <div>
        <label htmlFor="a-state" className="mb-1 block text-[12px] font-semibold">State*</label>
        <select id="a-state" value={f.state} onChange={(e) => set("state", e.target.value)} className="field" aria-invalid={!!errors.state}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {errors.state && <p className="mt-1 text-[11px] text-sale">{errors.state}</p>}
      </div>
      <div>
        <p className="mb-2 text-[12px] font-semibold">Address Type</p>
        <div className="flex gap-2">
          {["HOME", "WORK", "OTHER"].map((t) => (
            <button type="button" key={t} onClick={() => set("type", t)} className={`h-8 rounded-full border px-4 text-[12px] font-semibold ${f.type === t ? "border-ink bg-ink text-white" : "border-[#bbb]"}`}>{t[0] + t.slice(1).toLowerCase()}</button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={f.isDefault} onChange={(e) => set("isDefault", e.target.checked)} /> Make this my default address</label>
      {serverError && <p className="text-[12px] font-medium text-sale" role="alert">{serverError}</p>}
      <div className="flex gap-2 pt-2">
        {onCancel && <button type="button" onClick={onCancel} className="btn-outline h-[45px] flex-1 text-[14px]">Cancel</button>}
        <button disabled={busy} className="btn-black h-[45px] flex-[2] text-[15px] normal-case">{busy ? "Saving…" : "Save & Continue"}</button>
      </div>
    </form>
  );
}
