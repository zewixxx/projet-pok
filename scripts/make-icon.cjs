/**
 * Génère l'icône de l'application (build/icon.png et build/icon.ico) sans dépendance.
 * Même dessin que le logo de la barre latérale (src/shell/Logo.tsx) : deux cartes sur un carré dégradé.
 * Usage : node scripts/make-icon.cjs
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ── Géométrie (espace de dessin 40 × 40, identique au SVG du logo) ───────────────

const rad = (deg) => (deg * Math.PI) / 180;

function rotate([x, y], [cx, cy], deg) {
  const a = rad(deg);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

function inRoundedRect([x, y], x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x;
  const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function inPolygon([x, y], pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function cubic(p0, p1, p2, p3, steps = 16) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

// Pique dessiné sur la carte de devant (avant rotation de la carte).
const SPADE_TOP = [
  ...cubic([23, 14.2], [20.6, 16.7], [18.8, 18.2], [18.8, 20]),
  [23, 23],
  ...cubic([27.2, 20], [27.2, 18.2], [25.4, 16.7], [23, 14.2]),
];
const SPADE_STEM = [
  [22.6, 21.5],
  [21.3, 24.1],
  [24.7, 24.1],
  [23.4, 21.5],
];

function inSpade([x, y]) {
  return (
    inPolygon([x, y], SPADE_TOP) ||
    inPolygon([x, y], SPADE_STEM) ||
    (x - 21.0) ** 2 + (y - 19.98) ** 2 <= 2.2 * 2.2 ||
    (x - 25.0) ** 2 + (y - 19.98) ** 2 <= 2.2 * 2.2
  );
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Couleur RGBA (0-1) d'un point de l'espace de dessin. */
function shade(px, py) {
  if (!inRoundedRect([px, py], 0, 0, 40, 40, 11)) return [0, 0, 0, 0];

  // Fond dégradé en diagonale, avec reflet en haut.
  const t = (px + py) / 80;
  let r = lerp(0x7c, 0x8b, t) / 255;
  let g = lerp(0x86, 0x4f, t) / 255;
  let b = lerp(0xff, 0xe8, t) / 255;
  const sheen = Math.max(0, 0.28 * (1 - py / 22));
  r = lerp(r, 1, sheen);
  g = lerp(g, 1, sheen);
  b = lerp(b, 1, sheen);

  // Carte de derrière : blanc à 38 %.
  const back = rotate([px, py], [17, 21], 13);
  if (inRoundedRect(back, 8.5, 9, 23.5, 30, 3)) {
    r = lerp(r, 1, 0.38);
    g = lerp(g, 1, 0.38);
    b = lerp(b, 1, 0.38);
  }

  // Carte de devant : blanche, avec le pique.
  const front = rotate([px, py], [23, 21], -9);
  if (inRoundedRect(front, 15.5, 8.5, 30.5, 29.5, 3)) {
    r = g = b = 1;
    if (inSpade(front)) {
      r = 0x4f / 255;
      g = 0x58 / 255;
      b = 0xe0 / 255;
    }
  }
  return [r, g, b, 1];
}

function render(size) {
  const SS = 4; // suréchantillonnage 4 × 4 pour des bords lisses
  const scale = 40 / size;
  const data = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let ar = 0;
      let ag = 0;
      let ab = 0;
      let aa = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const [r, g, b, a] = shade((x + (sx + 0.5) / SS) * scale, (y + (sy + 0.5) / SS) * scale);
          ar += r * a;
          ag += g * a;
          ab += b * a;
          aa += a;
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      if (aa > 0) {
        data[i] = Math.round((ar / aa) * 255);
        data[i + 1] = Math.round((ag / aa) * 255);
        data[i + 2] = Math.round((ab / aa) * 255);
        data[i + 3] = Math.round((aa / n) * 255);
      }
    }
  }
  return data;
}

// ── Encodage PNG et ICO ──────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([len, typed, crc]);
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // profondeur
  header[9] = 6; // RGBA
  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0;
    rgba.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(rows, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function encodeIco(images) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(1, 2); // type icône
  head.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, png } of images) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = size >= 256 ? 0 : size;
    e.writeUInt16LE(1, 4); // plans
    e.writeUInt16LE(32, 6); // bits par pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += png.length;
  }
  return Buffer.concat([head, ...entries, ...images.map((i) => i.png)]);
}

const outDir = path.join(__dirname, "..", "build");
fs.mkdirSync(outDir, { recursive: true });

const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = sizes.map((size) => ({ size, png: encodePng(size, render(size)) }));
fs.writeFileSync(path.join(outDir, "icon.ico"), encodeIco(images));
fs.writeFileSync(path.join(outDir, "icon.png"), encodePng(512, render(512)));
console.log("Icône générée dans", outDir);
