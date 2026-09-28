import fs from "node:fs";
import { parseCsv } from "../zarilane/scripts/import-catalog";
const rows = parseCsv(fs.readFileSync("C:/Users/Lenovo/Desktop/Clone/ref-media/out/products.csv", "utf8"));
for (const r of rows.filter((r) => r.type === "Other")) console.log(r.name, "|", r.sizes);
console.log("sizes:", [...new Set(rows.flatMap((r) => r.sizes.split("|").map((s) => s.split(":")[0])))].join(", "));
console.log("colors:", [...new Set(rows.map((r) => r.color))].join(", "));
console.log("prices:", Math.min(...rows.map((r) => +r.price)), "-", Math.max(...rows.map((r) => +r.price)));
