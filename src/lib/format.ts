export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const pctOff = (price: number, mrp: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
export const brand = { name: "Zari Lane", upper: "ZARI LANE", domain: "zarilane.in", phone: "+91 - 9000000000", whatsapp: "919000000000" };

export function timeAgo(d: Date | string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  const units: [number, string][] = [[86400, "day"], [3600, "hour"], [60, "minute"]];
  for (const [sec, name] of units) if (s >= sec) { const n = Math.floor(s / sec); return n === 1 ? `a ${name} ago`.replace("a hour", "an hour") : `${n} ${name}s ago`; }
  return "just now";
}
