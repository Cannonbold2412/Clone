// Procedural SVG artwork used for product photos, banners and the logo.
// Keeps the catalog self-contained (no copyrighted photography).

type Palette = { skirt: string; blouse: string; dupatta: string; accent: string };

const WALLS = ["#ece4dc", "#e7e1d8", "#efe6e1", "#e3ddd6", "#f0e9df"];

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

function skirtPattern(id: string, p: Palette, pattern: string) {
  const light = shade(p.skirt, 0.12);
  const dark = shade(p.skirt, -0.12);
  if (pattern === "stripes")
    return `<pattern id="${id}" width="60" height="700" patternUnits="userSpaceOnUse">
      <rect width="20" height="700" fill="${p.skirt}"/><rect x="20" width="20" height="700" fill="${p.accent}"/><rect x="40" width="20" height="700" fill="${p.dupatta}"/>
      <rect x="19" width="2" height="700" fill="#e8c874"/><rect x="39" width="2" height="700" fill="#e8c874"/></pattern>`;
  if (pattern === "floral")
    return `<pattern id="${id}" width="54" height="54" patternUnits="userSpaceOnUse">
      <rect width="54" height="54" fill="${p.skirt}"/>
      <circle cx="14" cy="14" r="8" fill="${p.accent}" opacity=".9"/><circle cx="14" cy="14" r="3" fill="#f3d27a"/>
      <circle cx="41" cy="40" r="9" fill="${light}"/><circle cx="41" cy="40" r="3.5" fill="${p.dupatta}"/>
      <path d="M30 18 q6 -8 12 0 q-6 8 -12 0z" fill="${dark}" opacity=".7"/></pattern>`;
  if (pattern === "patola")
    return `<pattern id="${id}" width="44" height="44" patternUnits="userSpaceOnUse">
      <rect width="44" height="44" fill="${p.skirt}"/>
      <path d="M22 2 L42 22 L22 42 L2 22z" fill="none" stroke="${p.accent}" stroke-width="4"/>
      <path d="M22 13 L31 22 L22 31 L13 22z" fill="${light}"/><circle cx="22" cy="22" r="3" fill="#f1d17b"/></pattern>`;
  return `<pattern id="${id}" width="30" height="700" patternUnits="userSpaceOnUse">
      <rect width="30" height="700" fill="${p.skirt}"/><rect x="26" width="4" height="700" fill="${dark}" opacity=".35"/></pattern>`;
}

function figure(p: Palette, pattern: string, uid: string, skin: string) {
  const border = `<pattern id="b${uid}" width="36" height="46" patternUnits="userSpaceOnUse">
      <rect width="36" height="46" fill="#caa24a"/><rect y="4" width="36" height="38" fill="${shade(p.accent, -0.05)}"/>
      <path d="M18 8 L30 23 L18 38 L6 23z" fill="#e9cd7c"/><circle cx="18" cy="23" r="4" fill="${p.skirt}"/></pattern>`;
  return `<defs>${skirtPattern("s" + uid, p, pattern)}${border}
    <linearGradient id="sh${uid}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>
    <ellipse cx="250" cy="668" rx="200" ry="16" fill="#000" opacity=".12"/>
    <path d="M200 300 L300 300 L470 640 Q250 690 30 640 Z" fill="url(#s${uid})"/>
    <path d="M200 300 L300 300 L470 640 Q250 690 30 640 Z" fill="url(#sh${uid})"/>
    <path d="M40 612 Q250 660 460 612 L470 640 Q250 690 30 640 Z" fill="url(#b${uid})"/>
    <path d="M216 250 L284 250 L300 300 L200 300 Z" fill="${skin}"/>
    <path d="M205 180 Q250 165 295 180 L300 252 L200 252 Z" fill="${p.blouse}"/>
    <path d="M205 236 L295 236 L297 252 L203 252 Z" fill="#d6b25a"/>
    <path d="M205 182 Q180 190 170 240 L186 246 Q196 206 210 200 Z" fill="${p.blouse}"/>
    <path d="M170 240 L150 310 L162 314 L186 246 Z" fill="${skin}"/>
    <path d="M295 182 Q330 188 342 238 L326 244 Q314 208 292 200 Z" fill="${p.blouse}"/>
    <path d="M342 238 L352 300 L338 302 L326 244 Z" fill="${skin}"/>
    <path d="M292 176 Q330 200 318 330 Q300 470 350 560 L380 552 Q336 450 350 320 Q356 210 300 172 Z" fill="${p.dupatta}" opacity=".93"/>
    <path d="M350 560 L380 552 L384 566 L354 574 Z" fill="#d6b25a"/>
    <rect x="238" y="140" width="24" height="30" fill="${skin}"/>
    <ellipse cx="250" cy="116" rx="30" ry="36" fill="${skin}"/>
    <path d="M218 112 Q220 72 252 74 Q284 74 284 116 Q286 150 300 176 Q270 150 272 110 Q252 96 230 110 Q226 150 206 176 Q220 146 218 112Z" fill="#2b1d17"/>
    <circle cx="228" cy="132" r="4" fill="#e3c26b"/><circle cx="272" cy="132" r="4" fill="#e3c26b"/>`;
}

export function productSvg(spec: string, view: number) {
  // spec: skirt-blouse-dupatta-accent-pattern (hex w/o #)
  const [a, b, c, d, pattern = "plain"] = spec.split("-");
  const p = { skirt: "#" + a, blouse: "#" + b, dupatta: "#" + c, accent: "#" + d };
  const h = hash(spec);
  const wall = WALLS[h % WALLS.length];
  const skin = ["#c98e6b", "#b97c5b", "#d9a07c"][h % 3];
  const uid = (h % 100000).toString(36) + view;
  const zoom = [
    "",
    "translate(-125 -40) scale(1.5)",
    "translate(-250 -560) scale(2)",
    "translate(500 0) scale(-1 1)",
    "translate(-60 -10) scale(1.2)",
  ][view % 5];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700" preserveAspectRatio="xMidYMid slice">
  <rect width="500" height="700" fill="${wall}"/>
  <rect x="380" y="0" width="120" height="700" fill="${shade(wall, 0.05)}"/>
  <rect x="392" y="30" width="96" height="300" fill="none" stroke="${shade(wall, -0.06)}" stroke-width="3"/>
  <rect x="392" y="360" width="96" height="300" fill="none" stroke="${shade(wall, -0.06)}" stroke-width="3"/>
  <rect y="560" width="500" height="140" fill="${shade(wall, -0.08)}"/>
  <g transform="${zoom}">${figure(p, pattern, uid, skin)}</g>
</svg>`;
}

const BANNERS = [
  { title: "FESTIVE BLOOM", sub: "Floral Lehengas &amp; More", bg: ["#efe3d6", "#d9c3ae"], spec: "f3ede2-6d2248-6d2248-c45a8b-floral", ink: "#fffaf0" },
  { title: "UPTO 71% OFF", sub: "Navratri Edit — Limited Time", bg: ["#f2c230", "#b8373d"], spec: "c9a227-b8373d-2f5d8a-b8373d-patola", ink: "#7a1420" },
  { title: "NEW COLLECTION", sub: "Dola Silk • Tussar • Georgette", bg: ["#d8d2cc", "#8c7a6b"], spec: "1f5f5b-a0283c-a0283c-e3a33b-stripes", ink: "#1f1f1f" },
];

export function bannerSvg(n: number) {
  const b = BANNERS[n % BANNERS.length];
  const [a, bb, c, d, pat] = b.spec.split("-");
  const p = { skirt: "#" + a, blouse: "#" + bb, dupatta: "#" + c, accent: "#" + d };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b.bg[0]}"/><stop offset="1" stop-color="${b.bg[1]}"/></linearGradient></defs>
  <rect width="1600" height="640" fill="url(#g)"/>
  <g opacity=".35" fill="none" stroke="#fff" stroke-width="6"><path d="M120 640 V260 a150 150 0 0 1 300 0 V640"/><path d="M470 640 V300 a120 120 0 0 1 240 0 V640"/></g>
  <g transform="translate(1000 20) scale(0.9)">${figure(p, pat, "bn" + n, "#c98e6b")}</g>
  <text x="90" y="430" font-family="Georgia, 'Times New Roman', serif" font-size="92" font-weight="700" fill="${b.ink}" letter-spacing="4">${b.title}</text>
  <text x="96" y="492" font-family="Georgia, serif" font-style="italic" font-size="40" fill="${b.ink}">${b.sub}</text>
  <text x="96" y="560" font-family="Arial, sans-serif" font-size="26" fill="${b.ink}" text-decoration="underline">Explore More</text>
</svg>`;
}

export function posterSvg(label: string, spec: string) {
  const [a, bb, c, d, pat] = spec.split("-");
  const p = { skirt: "#" + a, blouse: "#" + bb, dupatta: "#" + c, accent: "#" + d };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 560" preserveAspectRatio="xMidYMid slice">
  <rect width="1600" height="560" fill="#efe9e3"/>
  ${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(${i * 320 + 10} 10) scale(0.62 0.78)" opacity=".75">${figure(i % 2 ? { ...p, skirt: p.accent, accent: p.skirt } : p, pat, "pp" + i, "#c98e6b")}</g>`).join("")}
  <rect width="1600" height="560" fill="#fff" opacity=".3"/>
  <text x="800" y="330" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="150" fill="#1b1b1b" letter-spacing="2">${label}</text>
</svg>`;
}

export function logoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><radialGradient id="lg" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#e9c8f2"/><stop offset=".6" stop-color="#f3a9cf"/><stop offset="1" stop-color="#e98bbd"/></radialGradient></defs>
  <circle cx="32" cy="32" r="31" fill="url(#lg)"/>
  <text x="31" y="40" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="24" fill="#3b2a6b" letter-spacing="-1">ZL.</text>
  <text x="32" y="49" text-anchor="middle" font-family="Arial, sans-serif" font-size="5" fill="#3b2a6b" letter-spacing=".5">ZARI LANE</text>
</svg>`;
}
