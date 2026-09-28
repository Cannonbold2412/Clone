// One-off: pull catalogue media + product data from the reference store's public pages (user has permission)
// into ./out (next to this script) in the importer's format (products.csv + images/ + videos/ + home.json).
// Run from anywhere:  node ../ref-media/fetch.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://theclassyaura.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140 Safari/537.36";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
fs.mkdirSync(path.join(OUT, "images"), { recursive: true });
fs.mkdirSync(path.join(OUT, "videos"), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 3) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (!r.ok) throw new Error(r.status + " " + url);
      return r;
    } catch (e) { if (i >= tries - 1) throw e; await sleep(1000 * (i + 1)); }
  }
}
function state(html) {
  const m = html.match(/__SERVER_APP_STATE__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/);
  return m ? Function('"use strict";return (' + m[1] + ")")() : null;
}
// Old brand → new brand in any text we keep.
const rebrand = (s = "") => s
  .replace(/the\s*classy\s*aura/gi, "Zari Lane").replace(/theclassyaura(\.com)?/gi, "zarilane.in")
  .replace(/The Brand Shop/g, "Zari Lane").replace(/\+?91[\s-]*8128866154/g, "");
// Ask the image CDN for a 900px webp instead of the multi-MB original.
const sized = (u) => u.replace(/\/tr:[^/]+\//, "/tr:f-webp,w-900,fo-auto/");

async function download(url, file) {
  const dest = path.join(OUT, file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return file;
  const r = await get(url);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  return file;
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; await fn(items[k], k); await sleep(250); }
  }));
}

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// Every product/collection URL comes from the public sitemap.
const sitemap = [...(await (await get(BASE + "/sitemap.xml")).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const urls = sitemap.filter((u) => u.includes("/catalogue/"));
console.log(`Sitemap: ${urls.length} products`);

// Collection membership from each collection page (public SSR shows the first page).
const membership = new Map(); // productId -> Set(collection name)
for (const u of sitemap.filter((u) => u.includes("/collection/"))) {
  const s = state(await (await get(u.trim())).text());
  const inj = s?.initialData?.ssrInjection;
  for (const e of inj?.entities ?? []) {
    if (!membership.has(e.short_id)) membership.set(e.short_id, new Set());
    membership.get(e.short_id).add(inj.title);
  }
}

const rows = [];
const stats = { products: 0, images: 0, productVideos: 0, failed: [] };
await pool(urls, 3, async (url, idx) => {
  try {
    const s = state(await (await get(url)).text());
    const d = s?.initialData?.serverInjection?.data;
    if (!d) throw new Error("no data");
    const w = (t) => d.widgets.find((x) => x.type === t);
    const media = w("product_media")?.entities ?? [];
    const images = [];
    for (const [k, m] of media.entries()) {
      if (m.type === "image" && m.image?.src_url) {
        images.push(await download(sized(m.image.src_url), `images/${d.short_id}_${k}.webp`));
        stats.images++;
      } else if (m.type === "video") stats.productVideos++;
    }
    const skus = (d.customer_skus ?? []).filter((x) => x.is_active !== false);
    const title = rebrand(d.content?.title ?? "");
    const desc = rebrand((w("enriched_text_media")?.entities ?? []).filter((e) => e.type === "text").map((e) => e.text).join("\n\n") || d.content?.description || "");
    const specs = (w("product_attributes")?.entities ?? [])
      .map((a) => [a.label, /brand/i.test(a.label) ? "Zari Lane" : rebrand(String(a.value))])
      .filter(([k, v]) => k && v).map(([k, v]) => `${k.replace(/[|=]/g, " ")}=${v.replace(/[|=]/g, " ")}`).join("|");
    const cols = new Set(membership.get(d.short_id) ?? []);
    cols.add(/saree/i.test(title) ? "SAREE" : "LEHENGA CHOLI");
    if (idx < 24) cols.add("NEW ARRIVAL");
    rows[idx] = [
      title, /saree/i.test(title) ? "Saree" : /lehenga|choli|chaniya/i.test(title) ? "Lehenga Choli" : "Other",
      (skus[0]?.colour || d.sku_data?.colour || "MULTI").toUpperCase(),
      skus[0]?.selling_price ?? d.sku_data?.selling_price, skus[0]?.mrp ?? d.sku_data?.mrp,
      skus.map((x) => `${x.size}:${Math.min(x.quantity ?? 0, 50)}`).join("|"),
      desc, images.join("|"), [...cols].join("|"), specs,
    ];
    stats.products++;
    if (stats.products % 25 === 0) console.log(`${stats.products}/${urls.length} products, ${stats.images} images`);
  } catch (e) { stats.failed.push(url + " :: " + e.message); }
});

fs.writeFileSync(path.join(OUT, "products.csv"),
  "name,type,color,price,mrp,sizes,description,images,collections,specs\n" +
  rows.filter(Boolean).map((r) => r.map(csvCell).join(",")).join("\n") + "\n");

// Home page media: hero banners, category tile, videos, posters (whatever the public SSR includes).
const home = state(await (await get(BASE + "/")).text());
const homeOut = [];
for (const [wi, wd] of (home?.initialData?.ssrInjection?.widgets ?? []).entries()) {
  for (const [ei, e] of (wd.entities ?? []).entries()) {
    const found = JSON.stringify(e).match(/https:\/\/[^"]+\.(?:jpe?g|png|webp|mp4|m3u8|mov)/gi) ?? [];
    for (const [k, u] of [...new Set(found)].entries()) {
      if (/preview|bl-\d/.test(u)) continue;
      const isVideo = /\.(mp4|mov)$/i.test(u);
      if (/\.m3u8$/i.test(u)) { homeOut.push({ widget: wd.type, title: wd.title, skipped: u }); continue; }
      const file = isVideo ? `videos/home_${wi}_${ei}_${k}.mp4` : `images/home_${wd.type}_${wi}_${ei}_${k}.webp`;
      try { await download(isVideo ? u : sized(u), file); homeOut.push({ widget: wd.type, title: wd.title, file, link: e.link ?? e.redirect_url ?? null }); }
      catch (err) { homeOut.push({ widget: wd.type, failed: u, err: err.message }); }
    }
  }
}
fs.writeFileSync(path.join(OUT, "home.json"), JSON.stringify(homeOut, null, 2));
console.log(JSON.stringify({ ...stats, failed: stats.failed.length, failedList: stats.failed.slice(0, 5), home: homeOut.length }, null, 2));
