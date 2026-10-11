/* Validate an authored act against the NODE model, the way DISCOVER is written.
   usage: node acts/_validate.cjs <act>        (run from the-book/sdlc)
   Loads the book in index.html's order, then the act's four files:
   acts/<act>-library.js, acts/<act>-units.js, acts/<act>.js, acts/<act>-depth.js */
const path = require('path');
const B = path.join(__dirname, '..') + '/';
const act = process.argv[2];
if (!act) { console.error('usage: node acts/_validate.cjs <act>'); process.exit(2); }
global.window = { NODE_MODEL: {} };
for (const f of ['model', 'system', 'roadmap', 'knowledge', 'lenses', 'artifacts', 'roles']) require(B + f + '.js');
for (const f of ['discover-units', 'discover', 'discover-depth', 'discover-agile']) require(B + 'acts/' + f + '.js');
for (const f of ['library', 'units', '', 'depth']) {
  const p = B + 'acts/' + act + (f ? '-' + f : '') + '.js';
  try { require(p); } catch (e) { console.error('LOAD FAILED', p, '\n', e.stack); process.exit(1); }
}
const M = window.NODE_MODEL, A = (window.NODE_ACTS || {})[act];
const errs = [], warns = [];
const E = (m) => errs.push(m), Wn = (m) => warns.push(m);
if (!A) { console.error('window.NODE_ACTS.' + act + ' missing'); process.exit(1); }
const stage = window.NODE_ROADMAP.stages.find((s) => s.id === act);
const LENS = new Set(M.lenses.map((l) => l.n));
const KLIB = window.NODE_KNOWLEDGE, ALIB = window.NODE_ARTIFACTS;
const ART = new Set(); Object.values(ALIB).forEach((a) => (a.aliases || []).forEach((n) => ART.add(n)));
const kOK = (n) => !!(KLIB[n] || KLIB[n.split(' — ')[0]] || Object.keys(KLIB).some((k) => n.startsWith(k)));
const empty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
const SECS = M.contract.map((s) => [s.id, s.fields.map((f) => f[0])]);
const WF = M.workflow.map((x) => x[0]).filter((k) => !['steps', 'exit', 'outputs'].includes(k) || true);
const checkContract = (where, c, needContinuity) => {
  if (!c) return E(where + ': no contract');
  for (const [sid, fields] of SECS) {
    if (sid === 'continuity' && !needContinuity) continue;
    if (!c[sid]) { E(`${where}: contract.${sid} missing`); continue; }
    for (const f of fields) if (empty(c[sid][f])) E(`${where}: contract.${sid}.${f} empty`);
  }
  for (const n of [...(c.lenses?.applicable || []), ...(c.lenses?.required || [])]) if (!LENS.has(n) && !LENS.has(n.split(' (')[0])) Wn(`${where}: lens "${n}" is not a lens-library name`);
  for (const k of Object.values(c.knowledge || {}).flat()) if (!kOK(k)) Wn(`${where}: knowledge "${k}" not in the knowledge library`);
  for (const n of [...(c.artifacts?.outputs || []), ...(c.artifacts?.inputs || [])]) if (!ART.has(n)) Wn(`${where}: artifact "${n}" has no template (alias)`);
};
const loopsOk = (where, loops, ids) => (loops || []).forEach(([f, t, ty]) => {
  if (!ids.has(f)) E(`${where}: loop from unknown "${f}"`);
  if (!(ids.has(t) || t === 'authority' || t === 'stop')) E(`${where}: loop to unknown "${t}"`);
  if (!['rework', 'alternate', 'escalate', 'stop'].includes(ty)) E(`${where}: loop type "${ty}"`);
});
['status', 'tagline', 'purpose', 'gate', 'outcomes', 'routing', 'lenses', 'contract', 'processes', 'loops'].forEach((k) => empty(A[k]) && E('act.' + k + ' empty'));
checkContract('act', A.contract, true);
if (stage && A.processes.length !== stage.processes.length) Wn(`act has ${A.processes.length} processes; roadmap skeleton has ${stage.processes.length}`);
loopsOk('act', A.loops, new Set(A.processes.map((p) => p.id)));
let subs = 0, wfs = 0, steps = 0;
const outs = new Set();
for (const p of A.processes) {
  const pw = 'process ' + p.id;
  ['id', 'short', 'title', 'summary', 'gate', 'status'].forEach((k) => empty(p[k]) && E(pw + '.' + k + ' empty'));
  checkContract(pw, p.contract, true);
  if (!Array.isArray(p.subprocesses) || p.subprocesses.length < 3) { E(pw + ': fewer than 3 subprocesses'); continue; }
  loopsOk(pw, p.loops, new Set(p.subprocesses.map((s) => s.id)));
  for (const s of p.subprocesses) {
    subs++;
    const sw = `${p.id}.${s.id}`;
    ['id', 'short', 'title', 'summary', 'gate'].forEach((k) => empty(s[k]) && E(sw + '.' + k + ' empty'));
    checkContract(sw, s.contract, true);
    if (!s.workflows?.length) { E(sw + ': no workflow'); continue; }
    for (const w of s.workflows) {
      wfs++;
      const ww = `${sw}.${w.id}`;
      if ((w.steps || []).length < 3) E(ww + ': fewer than 3 steps');
      if (!(w.steps || []).some((x) => x.decision)) E(ww + ': no decision step');
      steps += (w.steps || []).length;
      loopsOk(ww, w.loops, new Set((w.steps || []).map((x) => x.id)));
      for (const k of ['definition', 'inputs', 'preconditions', 'actors', 'decisions', 'cases', 'branches', 'failures', 'recovery', 'rework', 'criteria', 'checks', 'evidence', 'gate', 'outputs', 'exit', 'handoff', 'traceability', 'learning']) if (empty(w.wf?.[k])) E(`${ww}: wf.${k} empty`);
      for (const x of w.steps || []) if (x.out) { outs.add(x.out); }
      for (const n of w.wf?.outputs || []) if (!ART.has(n)) Wn(`${ww}: output "${n}" has no template`);
    }
  }
}
const T = A.tailoring;
if (!T || !T.light || !T.standard || !T.rigorous) E('tailoring light / standard / rigorous missing');
else {
  const fids = new Set([act, ...A.processes.map((p) => act + '.' + p.id), ...A.processes.flatMap((p) => (p.subprocesses || []).map((s) => `${act}.${p.id}.${s.id}`))]);
  for (const prof of ['light', 'standard', 'rigorous']) {
    for (const f of T[prof].skip || []) if (!fids.has(f)) E(`tailoring.${prof}.skip unknown ${f}`);
    for (const f of Object.keys(T[prof].condense || {})) if (!fids.has(f)) E(`tailoring.${prof}.condense unknown ${f}`);
    for (const f of Object.keys(T[prof].add || {})) if (!fids.has(f)) E(`tailoring.${prof}.add unknown ${f}`);
  }
}
if (!A.traceChain?.length) E('traceChain missing');
else {
  /* the backlog's own IDs and the shared learning log run through every act */
  const SHARED = new Set(['INI', 'EPC', 'FEA', 'STY', 'LRN']);
  const taken = new Set((window.NODE_ACTS.discover.traceChain || []).map((x) => x[0]).filter((x) => !SHARED.has(x)));
  for (const [pre, , aid] of A.traceChain) { if (taken.has(pre)) E(`trace prefix ${pre} already used by DISCOVER`); if (!ALIB[aid]) Wn(`traceChain ${pre}: artifact id "${aid}" not in the library`); }
}
console.log(`${act}: ${A.processes.length} processes, ${subs} subprocesses, ${wfs} workflows, ${steps} steps, ${Object.keys(ALIB).length} artifacts in library`);
console.log(`errors: ${errs.length}   warnings: ${warns.length}`);
errs.slice(0, 60).forEach((e) => console.log('  ERROR', e));
warns.slice(0, 40).forEach((w) => console.log('  warn ', w));
process.exit(errs.length ? 1 : 0);
