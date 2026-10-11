/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node (CommonJS) script */
/* The certificate's background: Node's certificate design with the parts that change per trainee (the program line top
 * left, the title, the name) cleared — painted over with the design's own textured background — so the certificate page
 * can set them as live text. Each patch is a tile of plain background, shifted to the brightness around it (the design
 * has a vignette) and faded in at its edges, so no seams show. Run once from the source design:
 *   node scripts/build-certificate-art.cjs <path-to-design.jpg>
 * Writes public/certificate/background.jpg (2000 × 1416). */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC = process.argv[2];
if (!SRC) { console.error("usage: node scripts/build-certificate-art.cjs <design.jpg>"); process.exit(1); }
const OUT = path.join(__dirname, "..", "public", "certificate", "background.jpg");

/* a plain stretch of the textured background (between the top border and the title) */
const PLAIN = { left: 720, top: 70, width: 700, height: 300 };
/* the areas that change, with room around the old text for the faded edge */
const CLEAR = [
  { left: 44, top: 50, width: 300, height: 205 }, // "Training / Program / 2021"
  { left: 745, top: 392, width: 1170, height: 258 }, // "Certificate of / Appreciation"
  { left: 850, top: 762, width: 1062, height: 278 }, // the name
];
const FEATHER = 22;

const mean = async (img, r) => (await sharp(img).extract(r).stats()).channels.slice(0, 3).map((c) => c.mean);

(async () => {
  const src = await fs.promises.readFile(SRC);
  const meta = await sharp(src).metadata();
  if (meta.width !== 2000 || meta.height !== 1416) console.warn(`expected 2000×1416, got ${meta.width}×${meta.height}`);
  const plain = await sharp(src).extract(PLAIN).toBuffer();
  const plainMean = await mean(src, PLAIN);
  const layers = [];
  for (const r of CLEAR) {
    /* tile the plain background to the area's size */
    const tiles = [];
    for (let y = 0; y < r.height; y += PLAIN.height) for (let x = 0; x < r.width; x += PLAIN.width) {
      tiles.push({ input: await sharp(plain).extract({ left: 0, top: 0, width: Math.min(PLAIN.width, r.width - x), height: Math.min(PLAIN.height, r.height - y) }).toBuffer(), left: x, top: y });
    }
    const tiled = await sharp({ create: { width: r.width, height: r.height, channels: 3, background: "#2b2b2b" } }).composite(tiles).png().toBuffer();
    /* the brightness just around it: thin strips on all four sides */
    const S = 14;
    const sides = [
      { left: r.left, top: r.top - S - 2, width: r.width, height: S },
      { left: r.left, top: r.top + r.height + 2, width: r.width, height: S },
      { left: r.left - S - 2, top: r.top, width: S, height: r.height },
      { left: r.left + r.width + 2, top: r.top, width: S, height: r.height },
    ].filter((x) => x.left >= 0 && x.top >= 0 && x.left + x.width <= meta.width && x.top + x.height <= meta.height);
    const ms = await Promise.all(sides.map((x) => mean(src, x)));
    const target = [0, 1, 2].map((i) => ms.reduce((n, m) => n + m[i], 0) / ms.length);
    const shifted = await sharp(tiled).removeAlpha().linear([1, 1, 1], target.map((t, i) => t - plainMean[i])).toColourspace("srgb").raw().toBuffer(); // 3 channels: r g b
    /* faded edges: opaque inside, easing to clear over FEATHER px at each side */
    const rgba = Buffer.alloc(r.width * r.height * 4);
    const ease = (d) => { const t = Math.min(1, Math.max(0, d / FEATHER)); return t * t * (3 - 2 * t); };
    for (let y = 0; y < r.height; y++) for (let x = 0; x < r.width; x++) {
      const i = y * r.width + x;
      rgba[i * 4] = shifted[i * 3]; rgba[i * 4 + 1] = shifted[i * 3 + 1]; rgba[i * 4 + 2] = shifted[i * 3 + 2];
      rgba[i * 4 + 3] = Math.round(255 * ease(Math.min(x, y, r.width - 1 - x, r.height - 1 - y)));
    }
    const patch = await sharp(rgba, { raw: { width: r.width, height: r.height, channels: 4 } }).png().toBuffer();
    layers.push({ input: patch, left: r.left, top: r.top });
  }
  await fs.promises.mkdir(path.dirname(OUT), { recursive: true });
  await sharp(src).composite(layers).jpeg({ quality: 90, mozjpeg: true }).toFile(OUT);
  console.log("wrote", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
