/* Load the whole book the way index.html does: every script in ONE shared global scope, in page order.
   A top-level const/let declared twice across files throws here exactly as it would in the browser.
   usage: node acts/_loadall.cjs   (from the-book/sdlc) */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const B = path.join(__dirname, '..') + '/';
const ACTS = ['plan', 'design', 'build', 'verify', 'release', 'operate', 'evolve'];
const files = ['model', 'system', 'roadmap', 'knowledge', 'lenses', 'artifacts', 'roles',
  'acts/discover-units', 'acts/discover', 'acts/discover-depth', 'acts/discover-agile', 'acts/discover-prompts',
  ...ACTS.flatMap((a) => [`acts/${a}-library`, `acts/${a}-units`, `acts/${a}`, `acts/${a}-depth`]), 'acts/reconcile'];
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
let ok = true;
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(B + f + '.js', 'utf8'), ctx, { filename: f + '.js' }); }
  catch (e) { ok = false; console.log('FAIL', f + '.js:', e.message); }
}
const A = ctx.NODE_ACTS || {};
console.log('acts loaded:', Object.keys(A).join(', '));
for (const a of ['discover', ...ACTS]) {
  const x = A[a];
  if (!x) { ok = false; console.log('MISSING act', a); continue; }
  const subs = x.processes.flatMap((p) => p.subprocesses || []);
  const wfs = subs.flatMap((s) => s.workflows || []);
  console.log(`  ${a.padEnd(9)} ${x.processes.length} processes, ${subs.length} subprocesses, ${wfs.length} workflows, ${wfs.reduce((n, w) => n + (w.steps || []).length, 0)} steps, gate: ${x.gate}`);
}
/* aliases that point at two different templates: the later one wins the name */
const seen = {}, clash = [];
for (const [id, a] of Object.entries(ctx.NODE_ARTIFACTS)) for (const n of a.aliases || []) { if (seen[n] && seen[n] !== id) clash.push(`${n}: ${seen[n]} / ${id}`); seen[n] = id; }
console.log('artifacts:', Object.keys(ctx.NODE_ARTIFACTS).length, '| knowledge:', Object.keys(ctx.NODE_KNOWLEDGE).length, '| alias clashes:', clash.length);
clash.slice(0, 30).forEach((c) => console.log('  clash', c));
process.exit(ok ? 0 : 1);
