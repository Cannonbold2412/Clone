"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, Star } from "./Icon";

function useAuto(n: number, ms: number, paused = false) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => clearInterval(t);
  }, [n, ms, paused, i]);
  return [i, (v: number) => setI(((v % n) + n) % n)] as const;
}

const Arrow = ({ dir, onClick, className = "" }: { dir: "left" | "right"; onClick: () => void; className?: string }) => (
  <button aria-label={dir === "left" ? "Previous" : "Next"} onClick={onClick} className={`absolute top-1/2 z-10 flex h-[42px] w-[42px] -translate-y-1/2 items-center justify-center border border-ink bg-white ${dir === "left" ? "left-0" : "right-0"} ${className}`}>
    <Icon name={dir} size={22} />
  </button>
);

export function HeroCarousel({ slides }: { slides: { image: string; href: string; alt: string }[] }) {
  const [i, go] = useAuto(slides.length, 5000);
  return (
    <section className="relative">
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((s, k) => (
            <Link key={k} href={s.href} className="block w-full shrink-0">
              <img src={s.image} alt={s.alt} className="aspect-[16/9] w-full object-cover md:aspect-[5/2]" fetchPriority={k === 0 ? "high" : "auto"} />
            </Link>
          ))}
        </div>
      </div>
      <Arrow dir="left" onClick={() => go(i - 1)} className="hidden md:flex" />
      <Arrow dir="right" onClick={() => go(i + 1)} className="hidden md:flex" />
      <div className="flex justify-center gap-1.5 py-3">
        {slides.map((_, k) => (
          <button key={k} aria-label={`Slide ${k + 1}`} onClick={() => go(k)} className={`h-[7px] w-[7px] rounded-full ${k === i ? "bg-black" : "bg-[#c4c4c4]"}`} />
        ))}
      </div>
    </section>
  );
}

export function CategoryTiles({ items }: { items: { name: string; href: string; image: string }[] }) {
  return (
    <div className="no-scrollbar flex justify-center gap-5 overflow-x-auto px-4">
      {items.map((c) => (
        <Link key={c.href} href={c.href} className="group shrink-0 text-center">
          {/* desktop: framed square card; mobile: circle */}
          <div className="hidden w-[204px] bg-[#e4e4e4] p-3 md:block">
            <img src={c.image} alt={c.name} className="aspect-[5/7] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            <p className="mt-3 text-[14px] font-medium uppercase">{c.name}</p>
          </div>
          <div className="md:hidden">
            <img src={c.image} alt={c.name} className="mx-auto h-[66px] w-[66px] rounded-full object-cover object-top" />
            <p className="mt-2 w-[72px] text-[12px] uppercase leading-[19px]">{c.name}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Video block like the reference; plays imported videos (public/media/videos), else a looping lookbook of product images. */
export function Reel({ images, videos = [], arrows = false, caption }: { images: string[]; videos?: string[]; arrows?: boolean; caption?: string }) {
  const [v, setV] = useState(0);
  if (videos.length)
    return (
      <div className="relative mx-auto aspect-video w-full max-w-[1200px] overflow-hidden bg-[#333]">
        <video key={v} src={videos[v]} className="h-full w-full object-contain" autoPlay muted playsInline controls preload="metadata"
          onEnded={() => setV((x) => (x + 1) % videos.length)} />
        {arrows && videos.length > 1 && <>
          <Arrow dir="left" onClick={() => setV((x) => (x - 1 + videos.length) % videos.length)} />
          <Arrow dir="right" onClick={() => setV((x) => (x + 1) % videos.length)} />
        </>}
      </div>
    );
  return <Lookbook images={images} arrows={arrows} caption={caption} />;
}

function Lookbook({ images, arrows, caption }: { images: string[]; arrows: boolean; caption?: string }) {
  const [paused, setPaused] = useState(false);
  const [i, go] = useAuto(images.length, 2200, paused);
  return (
    <div className="relative mx-auto aspect-video w-full max-w-[1200px] overflow-hidden bg-[#333]">
      <img key={i} src={images[i]} alt="" loading="lazy" className="anim-fade mx-auto h-full w-auto object-cover" />
      {caption && <p className="absolute left-6 top-6 text-[22px] font-semibold tracking-wide text-white drop-shadow md:text-[32px]">{caption}</p>}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-white">
        <div className="mb-2 h-[3px] w-full bg-white/30"><div className="h-full bg-white transition-[width] duration-500" style={{ width: `${((i + 1) / images.length) * 100}%` }} /></div>
        <button onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"} className="flex items-center gap-2 text-[13px]">
          <Icon name={paused ? "play" : "pause"} size={18} stroke={2.2} /> {paused ? "Play" : "Playing"} · {i + 1}/{images.length}
        </button>
      </div>
      {arrows && <><Arrow dir="left" onClick={() => go(i - 1)} /><Arrow dir="right" onClick={() => go(i + 1)} /></>}
    </div>
  );
}

type Review = { id: string; name: string; rating: number; text: string; image: string | null; date: string };

export function ReviewCard({ r, onMore }: { r: Review; onMore: () => void }) {
  const long = r.text.length > 110;
  return (
    <div className="flex h-full flex-col bg-soft">
      {r.image && <img src={r.image} alt="" className="aspect-square w-full object-cover" loading="lazy" />}
      <div className="p-4">
        <p className="text-[15px] font-semibold">{r.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="flex">{Array.from({ length: r.rating }, (_, k) => <Star key={k} />)}</span>
          <span className="text-[11px] text-muted">{r.date}</span>
        </div>
        <p className="mt-3 text-[13px] leading-[21px] text-[#444]">{long ? r.text.slice(0, 110) + ".." : r.text}</p>
        {long && <button onClick={onMore} className="mt-1 text-[13px] font-semibold underline">Read more</button>}
      </div>
    </div>
  );
}

export function ReviewModal({ r, onClose }: { r: Review | null; onClose: () => void }) {
  if (!r) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="anim-fade relative max-h-[90vh] w-full max-w-[720px] overflow-y-auto bg-white md:flex" onClick={(e) => e.stopPropagation()}>
        {r.image && <img src={r.image} alt="" className="aspect-square w-full object-cover md:w-1/2" />}
        <div className="p-6">
          <p className="text-[17px] font-semibold">{r.name}</p>
          <div className="mt-1 flex items-center gap-2"><span className="flex">{Array.from({ length: r.rating }, (_, k) => <Star key={k} />)}</span><span className="text-[12px] text-muted">{r.date}</span></div>
          <p className="mt-4 text-[14px] leading-6">{r.text}</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 bg-white p-1"><Icon name="close" /></button>
      </div>
    </div>
  );
}

export function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Review | null>(null);
  const [page, setPage] = useState(0);
  const scroll = useCallback((d: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: d * (el.clientWidth / (window.innerWidth >= 768 ? 3 : 1.2)), behavior: "smooth" });
  }, []);
  return (
    <div className="relative">
      <div ref={ref} onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.scrollWidth / reviews.length)))} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto md:gap-5">
        {reviews.map((r) => (
          <div key={r.id} className="w-[80%] shrink-0 snap-start md:w-[calc((100%-40px)/3)]"><ReviewCard r={r} onMore={() => setOpen(r)} /></div>
        ))}
      </div>
      <Arrow dir="left" onClick={() => scroll(-1)} className="hidden md:flex" />
      <Arrow dir="right" onClick={() => scroll(1)} className="hidden md:flex" />
      <div className="mt-4 flex justify-center gap-1.5">
        {reviews.map((_, k) => <span key={k} className={`h-[6px] w-[6px] rounded-full ${k === page ? "bg-black" : "bg-[#c4c4c4]"}`} />)}
      </div>
      <ReviewModal r={open} onClose={() => setOpen(null)} />
    </div>
  );
}
