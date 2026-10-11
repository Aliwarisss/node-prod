/* Build the agent kit from the Node book (the-book/sdlc) — exactly the files the book's "Agent kit" tab generates.
 * The book builds its kit in the browser (app.js → actKit), from the contracts. This runs the book headless — every
 * script index.html loads, over a forgiving DOM stub — and asks it for each act's kit at each scale.
 * Writes lib/program/kit-data/:
 *   <act>.json  { act, layers, scales, files: [{ path, layer, title, units, body }], variants: { <scale>: { <path>: body } } }
 *   (files are the "solo" scale; variants hold only what differs at the other scales)
 *   index.json  { acts: [{ id, files, layers: { <layer>: n } }], layers, scales }
 * Run after the book changes:  npm run program:kit */
/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node (CommonJS) script */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BOOK = path.join(ROOT, "the-book", "sdlc") + "/";
const OUT = path.join(ROOT, "lib", "program", "kit-data");

/* a DOM that accepts anything: every property is a callable stub returning another stub */
const stub = () => {
  const f = function () { return stub(); };
  return new Proxy(f, {
    get: (t, k) => (k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : k === Symbol.iterator ? function* () {} : k === "then" ? undefined : k === "dataset" || k === "style" ? {} : k === "classList" ? { add() {}, remove() {}, toggle() {}, contains: () => false } : stub()),
    set: () => true,
    apply: () => stub(),
  });
};
const store = { getItem: () => null, setItem() {}, removeItem() {} };
const ctx = {
  console: { log() {}, warn() {}, error: console.error }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
  matchMedia: () => ({ matches: false, addEventListener() {} }), location: { hash: "", pathname: "/", search: "", href: "" }, history: { replaceState() {}, pushState() {} },
  localStorage: store, sessionStorage: store, navigator: { clipboard: {} }, addEventListener() {}, removeEventListener() {}, scrollTo() {}, innerWidth: 1400, innerHeight: 900,
  URL, URLSearchParams,
};
ctx.document = stub();
ctx.window = ctx;
vm.createContext(ctx);

/* the scripts, in the order index.html loads them (the shared site chrome isn't needed) */
const html = fs.readFileSync(BOOK + "index.html", "utf8");
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1].split("?")[0]).filter((s) => !s.startsWith("../"));
for (const s of scripts) vm.runInContext(fs.readFileSync(BOOK + s.replace(/^\.\//, ""), "utf8"), ctx, { filename: s });

const API = ctx.NODE_API, B = ctx.NODE_BOOK;
if (!API || !B) throw new Error("The book didn't expose NODE_API / NODE_BOOK — check app.js.");
const plain = (o) => JSON.parse(JSON.stringify(o));
const layers = plain(B.KIT_LAYERS.map((l) => ({ id: l.id, name: l.name, icon: l.icon, what: l.what || "", tools: l.tools || "" })));
const scales = plain(B.SCALES.map((s) => ({ id: s.id, name: s.name, icon: s.icon, who: s.who || "" })));
const BASE = scales[0].id;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const index = { acts: [], layers, scales };
let bytes = 0;
for (const act of API.STAGES) {
  const base = API.actKit(act, BASE).map((f) => ({ path: f.path, layer: f.layer, title: f.title, units: [...new Set(f.units)], body: f.body }));
  const byPath = Object.fromEntries(base.map((f) => [f.path, f.body]));
  const variants = {};
  for (const sc of scales.slice(1)) {
    variants[sc.id] = {};
    for (const f of API.actKit(act, sc.id)) if (byPath[f.path] !== f.body) variants[sc.id][f.path] = f.body;
  }
  const data = JSON.stringify({ act: act.id, files: base, variants });
  fs.writeFileSync(path.join(OUT, `${act.id}.json`), data);
  bytes += data.length;
  const count = {};
  for (const f of base) count[f.layer] = (count[f.layer] || 0) + 1;
  index.acts.push({ id: act.id, files: base.length, layers: count });
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index));
console.log(`agent kit: ${index.acts.length} acts · ${index.acts.reduce((n, a) => n + a.files, 0)} files · ${scales.length} scales · ${(bytes / 1024 / 1024).toFixed(1)} MB`);
