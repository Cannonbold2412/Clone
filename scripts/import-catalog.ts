// Import real product photos/videos from a local folder you own.
//
//   npm run import -- <folder> [--replace]
//
// <folder>/products.csv columns (header row required):
//   name,type,color,price,mrp,sizes,description,images,collections
//   - sizes:       "FREE SIZE:25"  or  "S:10|M:10|L:5"        (size:stock)
//   - images:      "front.jpg|back.jpg|detail.jpg"           (paths relative to <folder>)
//   - collections: "LEHENGA CHOLI|TOP SELLER"                (existing collection names)
//   - specs (optional): "Fabric=DOLA SILK|Wash Care=DRY CLEAN" (Product Information rows)
// <folder>/videos/*.mp4|webm  → copied to public/media/videos and shown in the home page video blocks.
// --replace removes existing products that have never been ordered before importing.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const PUBLIC = path.join(process.cwd(), "public", "media");

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, newlines inside quotes). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  const [head, ...body] = rows;
  const keys = head.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const id = (n: number) => crypto.randomBytes(n).toString("base64url").slice(0, n);
const slugify = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");

function copyInto(src: string, subdir: string, keepName = false) {
  const ext = path.extname(src).toLowerCase();
  const name = keepName ? path.basename(src).replace(/[^\w.-]/g, "_") : crypto.createHash("sha1").update(fs.readFileSync(src)).digest("hex").slice(0, 16) + ext;
  const dest = path.join(PUBLIC, subdir, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  return `/media/${subdir}/${name}`;
}

async function main() {
  const dir = process.argv[2];
  if (!dir || !fs.existsSync(dir)) throw new Error("Usage: npm run import -- <folder> [--replace]");
  const replace = process.argv.includes("--replace");

  for (const [sub, re] of [["videos", /\.(mp4|webm)$/i], ["banners", /\.(webp|jpe?g|png)$/i]] as const) {
    const src = path.join(dir, sub);
    if (!fs.existsSync(src)) continue;
    const files = fs.readdirSync(src).filter((f) => re.test(f)).sort();
    files.forEach((f) => copyInto(path.join(src, f), sub, true)); // names kept: they set display order
    console.log(`Copied ${files.length} ${sub}`);
  }

  const csvPath = path.join(dir, "products.csv");
  if (!fs.existsSync(csvPath)) return console.log("No products.csv — skipped products");
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const cols = new Map((await db.collection.findMany()).map((c) => [c.name.toUpperCase(), c.id]));

  if (replace) {
    const del = await db.product.deleteMany({ where: { variants: { none: { orderItems: { some: {} } } } } });
    console.log(`Removed ${del.count} unordered product(s)`);
  }

  let n = 0;
  for (const [i, r] of rows.entries()) {
    const line = `row ${i + 2} (${r.name || "?"})`;
    const images = (r.images || "").split("|").map((s) => s.trim()).filter(Boolean);
    const missing = images.filter((f) => !fs.existsSync(path.join(dir, f)));
    const sizes = (r.sizes || "FREE SIZE:10").split("|").map((s) => {
      const [size, stock] = s.split(":");
      return { size: size.trim(), stock: Number(stock ?? 10) };
    });
    const price = Number(r.price), mrp = Number(r.mrp || r.price);
    if (!r.name || !images.length || missing.length || !price || sizes.some((s) => !s.size || Number.isNaN(s.stock))) {
      console.warn(`Skipping ${line}: ${missing.length ? "missing " + missing.join(", ") : "needs name, price, sizes and at least one image"}`);
      continue;
    }
    const urls = images.map((f) => copyInto(path.join(dir, f), "products"));
    const productId = id(12);
    await db.product.create({
      data: {
        id: productId, slug: slugify(r.name), name: r.name, productType: r.type || "Lehenga Choli",
        color: (r.color || "MULTI").toUpperCase(), description: r.description || r.name,
        specs: JSON.stringify(r.specs
          ? r.specs.split("|").map((kv) => kv.split("=").map((x) => x.trim())).filter((kv) => kv.length === 2 && kv[0] && kv[1])
          : [["Size", sizes.map((s) => s.size).join(", ")], ["Brand", "Zari Lane"], ["Country", "INDIA"]]),
        images: JSON.stringify(urls), popularity: rows.length - i,
        variants: { create: sizes.map((s) => ({ id: id(8), size: s.size, stock: s.stock, price, mrp })) },
        collections: {
          create: (r.collections || "").split("|").map((c) => cols.get(c.trim().toUpperCase())).filter((c): c is string => !!c)
            .map((collectionId) => ({ collectionId, position: i })),
        },
      },
    });
    n++;
  }
  console.log(`Imported ${n}/${rows.length} product(s)`);
}

if (process.argv[1]?.includes("import-catalog")) main().finally(() => db.$disconnect());
