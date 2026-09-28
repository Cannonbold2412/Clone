import { bannerSvg, posterSvg, productSvg } from "@/lib/art";

const SAFE = /^[0-9a-z-]+$/i;

// /img/p/<spec>/<view>.svg | /img/banner/<n>.svg | /img/poster/<label>/<spec>.svg
export async function GET(_: Request, { params }: { params: Promise<{ parts: string[] }> }) {
  const parts = (await params).parts.map((s) => decodeURIComponent(s).replace(/\.svg$/, ""));
  let svg: string | null = null;
  if (parts[0] === "p" && SAFE.test(parts[1] ?? "")) svg = productSvg(parts[1], Number(parts[2]) || 0);
  else if (parts[0] === "banner") svg = bannerSvg(Number(parts[1]) || 0);
  else if (parts[0] === "poster" && SAFE.test(parts[2] ?? "")) svg = posterSvg(parts[1].replace(/[^A-Z0-9 ]/gi, ""), parts[2]);
  if (!svg) return new Response("Not found", { status: 404 });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": process.env.NODE_ENV === "production" ? "public, max-age=31536000, immutable" : "no-cache" },
  });
}
