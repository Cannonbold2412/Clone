"use client";

import { useEffect } from "react";
import { Icon } from "./Icon";

/** Right-side sheet with dimmed overlay; closes on overlay click / Escape. Full-width on mobile. */
export function Drawer({ open, onClose, title, children, footer, width = 400, underline }: {
  open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: number; underline?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      <div className="anim-fade absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="anim-slide absolute right-0 top-0 flex h-full w-full flex-col bg-white" style={{ maxWidth: width }}>
        <div className="flex items-start justify-between px-5 pb-3 pt-6">
          <div>
            <h2 className="text-[20px] font-bold">{title}</h2>
            {underline && <div className="mt-1 h-[3px] w-5 bg-ink" />}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1"><Icon name="close" size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer}
      </div>
    </div>
  );
}
