"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CartView } from "@/lib/cart";
import { BagDrawer } from "./BagDrawer";
import { Icon } from "./Icon";

type User = { id: string; phone: string; name: string | null; admin?: boolean } | null;
type Toast = { id: number; text: string; kind: "ok" | "err" };

type Store = {
  cart: CartView | null;
  user: User;
  ready: boolean;
  setCart: (c: CartView) => void;
  refresh: () => Promise<void>;
  addToBag: (variantId: string, qty?: number, opts?: { silent?: boolean }) => Promise<boolean>;
  bagOpen: boolean;
  setBagOpen: (v: boolean) => void;
  toast: (text: string, kind?: "ok" | "err") => void;
  setUser: (u: User) => void;
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

/** fetch JSON; throws Error(message) with the server's error text on non-2xx. */
export async function http<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    });
  } catch {
    throw new Error("Network error. Please check your internet connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Something went wrong"), { status: res.status });
  return data as T;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartView | null>(null);
  const [user, setUser] = useState<User>(null);
  const [ready, setReady] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const refresh = useCallback(async () => {
    const [c, me] = await Promise.all([http<CartView>("/api/cart").catch(() => null), http<{ user: User }>("/api/auth/me").catch(() => ({ user: null }))]);
    if (c) setCart(c);
    setUser(me.user);
    setReady(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addToBag = useCallback(async (variantId: string, qty = 1, opts?: { silent?: boolean }) => {
    try {
      setCart(await http<CartView>("/api/cart/items", { method: "POST", json: { variantId, qty } }));
      if (!opts?.silent) setBagOpen(true);
      return true;
    } catch (e) {
      toast((e as Error).message, "err");
      return false;
    }
  }, [toast]);

  return (
    <Ctx.Provider value={{ cart, user, ready, setCart, refresh, addToBag, bagOpen, setBagOpen, toast, setUser }}>
      {children}
      <BagDrawer />
      <div className="fixed left-1/2 top-4 z-[100] flex -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`anim-toast flex min-w-[300px] items-center gap-3 rounded px-5 py-4 text-[15px] text-white shadow-lg ${t.kind === "ok" ? "bg-[#10b91a]" : "bg-[#d93025]"}`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95" style={{ color: t.kind === "ok" ? "#10b91a" : "#d93025" }}>
              <Icon name={t.kind === "ok" ? "check" : "close"} size={16} stroke={3} />
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
