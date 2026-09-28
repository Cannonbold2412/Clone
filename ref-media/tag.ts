import fs from "node:fs";
import { parseCsv } from "../zarilane/scripts/import-catalog";
const p = "C:/Users/Lenovo/Desktop/Clone/ref-media/out/products.csv";
const rows = parseCsv(fs.readFileSync(p, "utf8"));
const cell = (v: string) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
const keys = Object.keys(rows[0]);
const counts: Record<string, number> = {};
for (const r of rows) {
  const c = new Set(r.collections.split("|").filter(Boolean));
  if (c.has("NEW ARRIVAL")) c.add("FRESH COLLECTION");
  r.collections = [...c].join("|");
  for (const x of c) counts[x] = (counts[x] || 0) + 1;
}
fs.writeFileSync(p, keys.join(",") + "\n" + rows.map((r) => keys.map((k) => cell(r[k])).join(",")).join("\n") + "\n");
const types: Record<string, number> = {};
for (const r of rows) types[r.type] = (types[r.type] || 0) + 1;
console.log(rows.length, counts, types, "no-images", rows.filter((r) => !r.images).length);
