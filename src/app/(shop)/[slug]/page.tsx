import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { POLICIES } from "@/lib/policies";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = POLICIES[(await params).slug];
  return p ? { title: { absolute: `ZARI LANE ${p.title}` } } : {};
}

export default async function PolicyPage({ params }: Props) {
  const page = POLICIES[(await params).slug];
  if (!page) notFound();
  return (
    <article className="container-x py-10 text-[13px] leading-5 text-[#555]">
      <h1 className="mb-6 text-center text-[30px] font-bold text-[#666]">{page.title}</h1>
      {page.blocks.map((b, i) => (
        <section key={i} className="mb-5">
          {b.h && <h2 className={`mb-2 font-bold ${i === 0 && !b.ol && !b.ul ? "text-[13px] text-black" : "text-[16px] text-[#666]"}`}>{b.h}</h2>}
          {b.p?.map((t) => <p key={t} className="mb-2">{t}</p>)}
          {b.ol && <ol className="list-decimal pl-10">{b.ol.map((t) => <li key={t}>{t}</li>)}</ol>}
          {b.ul && <ul className="list-disc pl-10">{b.ul.map((t) => <li key={t}>{t}</li>)}</ul>}
        </section>
      ))}
    </article>
  );
}
