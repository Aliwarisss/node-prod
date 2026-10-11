/* NODE SDLC Book — renderer.
 * Reads window.NODE_MODEL (framework), window.NODE_ROADMAP (skeleton) and window.NODE_ACTS (authored acts).
 */
(() => {
  "use strict";
  const M = window.NODE_MODEL, RM = window.NODE_ROADMAP, ACTS = window.NODE_ACTS || {};
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const ACC = ["var(--teal)", "var(--pink)", "var(--orange)"];
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  /* ================= unit tree ================= */
  const STAGES = RM.stages;
  STAGES.forEach((s) => { if (ACTS[s.id]) Object.assign(s, ACTS[s.id]); });
  const KIND = ["stage", "process", "subprocess", "workflow", "step"];
  const PLURAL = { stage: "acts", process: "processes", subprocess: "subprocesses", workflow: "workflows", step: "steps" };
  const kids = (u) => (u === ROOT ? STAGES : u.processes || u.subprocesses || u.workflows || u.steps || []);
  const ROOT = { fid: "", title: "SDLC Lifecycle", short: "Lifecycle", level: -1, kind: "lifecycle" };
  const UNITS = {};
  /* A workflow carries the 20-field workflow contract (u.wf). Derive a NODE-shaped
     contract from it so the map, gate, branches and scenarios work the same way. */
  const wfContract = (u) => {
    const w = u.wf, loop = (ty) => (u.loops || []).filter((l) => l[2] === ty).map((l) => l[3]).join("; ");
    return {
      definition: { purpose: w.definition, outcome: (w.outputs || []).join(", "), entry: w.preconditions, exit: w.exit },
      flow: { normal: u.steps.map((s) => s.title) },
      cases: { happyPath: u.steps.filter((s) => !s.decision).map((s) => s.title).join(" → "), alternates: w.branches, edgeCases: w.cases, exceptions: w.recovery, failures: w.failures },
      routing: { forward: w.handoff, rework: w.rework, alternate: loop("alternate"), escalation: loop("escalate"), stop: loop("stop") },
      controls: { criteria: w.criteria, checks: w.checks, gates: [w.gate] },
      lenses: { decisions: w.decisions },
      execution: { agents: w.actors },
      artifacts: { inputs: w.inputs, outputs: w.outputs, evidence: w.evidence },
      continuity: { handoff: w.handoff, traceability: w.traceability, learning: w.learning, timebox: w.timebox, measures: w.measures },
    };
  };
  function build(list, parent, level) {
    list.forEach((u, i) => {
      u.level = level; u.parent = parent; u.kind = KIND[level];
      u.fid = level === 0 ? u.id : parent.fid + "." + u.id;
      u.num = level === 0 ? String(i + 1) : level === 4 ? "S" + (i + 1) : parent.num + "." + (i + 1);
      if (u.wf && !u.contract) u.contract = wfContract(u);
      u.si = level === 0 ? i : parent.si;
      if (!u.short) u.short = level === 0 ? u.key : u.title;
      if (!u.title) u.title = u.key;
      UNITS[u.fid] = u;
      build(kids(u), u, level + 1);
    });
  }
  build(STAGES, ROOT, 0);
  /* an act's feature mode (continuous discovery) is a workflow that hangs off the act itself */
  STAGES.forEach((s) => { if (!s.continuous) return; build([s.continuous], s, 3); s.continuous.num = `${s.si + 1}.∞`; s.continuous.steps.forEach((x, i) => (x.num = "S" + (i + 1))); });
  const SYS = M.system || {};
  const isOpen = (u) => u.level === 0 || u.status === "draft" || u.status === "confirmed";
  const pageOf = (u) => (u === ROOT ? "map" : u.level === 0 ? "act-" + u.id : isOpen(u) ? "u-" + u.fid : null);
  const ancestors = (u) => { const a = []; for (let x = u; x && x !== ROOT; x = x.parent) a.unshift(x); return a; };
  const unitLabel = (u) => (u.level === 0 ? `Act ${ROMAN[u.si]}` : `${cap(u.kind)} ${u.num}`);
  const lensById = Object.fromEntries(M.lenses.map((l) => [l.id, l]));
  const KT = M.knowledgeTypes;
  const lensState = (s, id) => (s.lenses.required.includes(id) ? "req" : s.lenses.applicable.includes(id) ? "app" : "none");
  const title = (k) => k.charAt(0) + k.slice(1).toLowerCase();
  const statusBadge = (st) => `<span class="badge ${st === "placeholder" || !st ? "ph-st" : st}">${st || "placeholder"}</span>`;
  const acc = (u) => ACC[(u.si ?? 0) % 3];

  /* ================= book structure ================= */
  const P1 = "Part I · Model", P2 = "Part II · Acts", P3 = "Part III · Mastery", FM = "Front Matter";
  const PAGES = [
    { id: "cover", part: FM, title: "Cover", icon: "auto_stories" },
    { id: "preface", part: FM, title: "Preface", num: "P", icon: "edit_note" },
    { id: "how-to-read", part: FM, title: "How to Read", num: "R", icon: "layers" },
    { id: "circuit", part: P1, title: "Lifecycle Circuit", num: "01", icon: "hub" },
    { id: "map", part: P1, title: "Lifecycle Map", num: "02", icon: "account_tree" },
    { id: "contract", part: P1, title: "NODE Contract", num: "03", icon: "contract" },
    { id: "lenses", part: P1, title: "Lens Library", num: "04", icon: "visibility" },
    { id: "knowledge", part: P1, title: "Knowledge Model", num: "05", icon: "menu_book" },
    { id: "agents", part: P1, title: "Working with Agents", num: "06", icon: "smart_toy" },
  ];
  (function addUnits(list) {
    list.forEach((u) => {
      if (!isOpen(u)) return;
      PAGES.push({ id: pageOf(u), part: P2, title: u.level === 0 ? title(u.key) : u.title, num: u.level === 0 ? ROMAN[u.si] : u.num, icon: u.level === 0 ? u.icon : "account_tree", unit: u, sub: u.level > 0, status: u.status });
      addUnits(kids(u));
      if (u.level === 0 && u.continuous) addUnits([u.continuous]);
    });
  })(STAGES);
  PAGES.push({ id: "reasoning", part: P3, title: "Reasoning Chain", num: "07", icon: "psychology_alt" });
  PAGES.push({ id: "canvas", part: P3, title: "Initiative Canvas", num: "08", icon: "draw" });
  const pageIndex = Object.fromEntries(PAGES.map((p, i) => [p.id, i]));

  /* ================= helpers ================= */
  const header = ({ lbl, h1, p, acc: a, right = "" }) => `<div class="ph" style="--acc:${a || "var(--teal)"}"><div><span class="lbl">${lbl}</span><h1>${h1}</h1>${p ? `<p>${p}</p>` : ""}</div>${right ? `<div class="right">${right}</div>` : ""}</div>`;
  const sec = (t) => `<div class="sec lbl">${t}</div>`;
  const stepper = (active) => `<div class="stepper">${STAGES.map((s, i) => `<a class="step ${i === active ? "on" : ""}" style="--acc:${ACC[i % 3]}" href="#/act-${s.id}"><span class="ms">${s.icon}</span>${ROMAN[i]} ${s.key}</a>`).join("")}</div>`;
  const trail = (u) => `<nav class="trail lbl" aria-label="Location"><a href="#/map">Lifecycle</a>${ancestors(u).map((a) => `<span>›</span>${a === u ? `<b>${esc(a.short)}</b>` : `<a href="#/${pageOf(a) || "map"}">${esc(a.short)}</a>`}`).join("")}</nav>`;

  function tabs(id, items) {
    return { html: `<div class="tabs" role="tablist" data-tabs="${id}">${items.map((t, i) => `<button class="tab" role="tab" aria-selected="${i === 0}" data-i="${i}">${t[0]}</button>`).join("")}</div>${items.map((t, i) => `<div class="tabp" data-p="${i}" ${i ? "hidden" : ""}>${t[1]}</div>`).join("")}`,
      mount(root) {
        const bar = $(`[data-tabs="${id}"]`, root); if (!bar) return;
        bar.addEventListener("click", (e) => {
          const b = e.target.closest(".tab"); if (!b) return;
          bar.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", x === b));
          let el = bar.nextElementSibling; while (el && el.classList.contains("tabp")) { el.hidden = el.dataset.p !== b.dataset.i; el = el.nextElementSibling; }
        });
      } };
  }

  /* ================= contract view (progressive) ================= */
  const hasVal = (v) => v && (!Array.isArray(v) || v.length);
  function contractStats(ct) {
    let total = 0, filled = 0;
    M.contract.forEach((c) => c.fields.forEach(([k]) => { total++; if (hasVal((ct?.[c.id] || {})[k])) filled++; }));
    return { total, filled, pct: Math.round((filled / total) * 100) };
  }
  function contractView(ct, a) {
    const uid = "c" + Math.random().toString(36).slice(2, 7);
    return { html: `<div class="cols c-37" id="${uid}"><div class="vtabs" role="tablist"></div><div class="panel"></div></div>`,
      mount(root) {
        const box = $("#" + uid, root); let c = 0;
        const draw = () => {
          box.firstElementChild.innerHTML = M.contract.map((x, i) => {
            const v = ct?.[x.id] || {}; const f = x.fields.filter(([k]) => hasVal(v[k])).length;
            return `<button class="vtab" role="tab" aria-selected="${i === c}" data-i="${i}"><span class="ms">${x.icon}</span>${x.name}<span class="lbl ${f === x.fields.length ? "full" : f ? "" : "none"}">${f}/${x.fields.length}</span></button>`;
          }).join("");
          const x = M.contract[c], v = ct?.[x.id] || {};
          box.lastElementChild.innerHTML = `<div class="fade"><div class="pn-head"><h3>${x.name}</h3><span class="lbl">Section ${c + 1} / ${M.contract.length}</span></div><p class="q">${esc(x.q)}</p>
            <div class="fields">${x.fields.map(([k, n]) => { const val = v[k]; return `<div class="field ${hasVal(val) ? "" : "gap"}"><b>${n}</b>${hasVal(val) ? (Array.isArray(val) ? `<ul class="vl">${val.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : `<span>${esc(val)}</span>`) : `<span>Not yet defined</span>`}</div>`; }).join("")}</div>
            <div class="pn-nav">${c > 0 ? `<button class="tool" data-step="-1"><span class="ms">arrow_back</span>${M.contract[c - 1].name}</button>` : "<span></span>"}${c < M.contract.length - 1 ? `<button class="tool" data-step="1">${M.contract[c + 1].name}<span class="ms">arrow_forward</span></button>` : ""}</div></div>`;
        };
        box.addEventListener("click", (e) => {
          const t = e.target.closest(".vtab"), s = e.target.closest("[data-step]");
          if (t) { c = +t.dataset.i; draw(); } else if (s) { c += +s.dataset.step; draw(); }
        });
        draw();
      } };
  }

  /* ================= flow map (any level) =================
   * Horizontal map: Entry → children → Gate, with rework / alternate / escalate / stop loops.
   * The map box is interactive: click a node, the gate, a loop or the bars to see
   * everything the contract says about it in the details panel inside the box.
   */
  const RC = (ty) => M.routes[ty].c;
  const C = (u, s) => (u && u.contract && u.contract[s]) || {};
  const arr = (v) => (v == null || v === "" ? [] : Array.isArray(v) ? v : [v]);
  const ownerOf = (u) => { if (u.actor) return u.actor; const r = arr(C(u, "execution").roles).find((x) => /^R\b/.test(x)); return r ? r.replace(/^R\s*[—-]\s*/, "") : arr(C(u, "execution").agents)[0] || ""; };
  const outOf = (u) => (u.kind === "step" ? arr(u.out) : arr(C(u, "artifacts").outputs).length ? arr(C(u, "artifacts").outputs) : arr(u.outcomes));
  /* ---- knowledge overlay helpers ---- */
  const KN_KEYS = M.contract.find((c) => c.id === "knowledge").fields.map((f) => f[0]);
  const KN_NAME = Object.fromEntries(M.contract.find((c) => c.id === "knowledge").fields.map(([k, n]) => [k, n]));
  const KN_SING = { frameworks: "Framework", standards: "Standard", patterns: "Pattern", practices: "Practice", principles: "Principle", methods: "Method", techniques: "Technique", tools: "Tool" };
  const KN_COLOR = (t) => (M.knowledgeTypes[KN_SING[t]] || ["#64748b"])[0];
  const KLIB = window.NODE_KNOWLEDGE || {};
  const kBase = (n) => n.split(" — ")[0].replace(/\s*\([^)]*\)\s*$/, "").trim();
  const kEntry = (n) => KLIB[n] || KLIB[kBase(n)] || Object.keys(KLIB).filter((x) => n.startsWith(x)).sort((a, b) => b.length - a.length).map((k) => KLIB[k])[0] || null;
  const kHow = (n) => (kEntry(n) || {}).what || "";
  /* Draws a knowledge item's structure / template */
  function renderStructure(st) {
    if (!st) return '<span class="nd">No template</span>';
    const e = esc, pair = (x) => (Array.isArray(x) ? x : [x, ""]);
    switch (st.kind) {
      case "steps": return `<ol class="ks-steps">${st.items.map((x) => `<li>${e(x)}</li>`).join("")}</ol>`;
      case "cycle": return `<div class="ks-cycle">${st.items.map((x, i) => { const [t, p] = pair(x); return `<div class="ks-cy"><i>${i + 1}</i><b>${e(t)}</b>${p ? `<span>${e(p)}</span>` : ""}</div>`; }).join('<span class="ms ks-ar">arrow_forward</span>')}<span class="ms ks-ar loop" title="Repeats">replay</span></div>`;
      case "chain": return `<div class="ks-chain">${st.items.map((x) => `<span class="ks-ch">${e(x)}</span>`).join('<span class="ms">arrow_forward</span>')}</div>`;
      case "levels": return `<div class="ks-levels">${st.items.reduceRight((inner, x) => { const [l, n] = pair(x); return `<div class="ks-lv"><div class="ks-lvh"><b>${e(l)}</b><span>${e(n)}</span></div>${inner}</div>`; }, "")}</div>`;
      case "fields": return `<div class="ks-fields">${st.items.map((x) => { const [fl, p] = pair(x); return `<div><b>${e(fl)}</b><span>${e(p) || "&nbsp;"}</span></div>`; }).join("")}</div>`;
      case "table": return `<div class="ks-tw"><table class="ks-table"><thead><tr>${st.cols.map((c) => `<th>${e(c)}</th>`).join("")}</tr></thead><tbody>${st.rows.map((r) => `<tr>${r.map((c) => `<td>${e(c) || "&nbsp;"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      case "matrix": return `<div class="ks-matrix"><span class="ks-y">${e(st.y)}</span><div class="ks-q">${st.q.map((q) => `<div>${e(q) || "&nbsp;"}</div>`).join("")}</div><span class="ks-x">${e(st.x)}</span></div>`;
      case "grid": return `<div class="ks-grid" style="grid-template-columns:repeat(${st.cols},minmax(0,1fr))">${st.cells.map(([t, p, a]) => `<div style="grid-area:${a}"><b>${e(t)}</b><span>${e(p)}</span></div>`).join("")}</div>`;
      case "sentence": return `<div class="ks-sentence">${e(st.text).replace(/\[([^\]]+)\]/g, "<u>$1</u>")}</div>`;
      case "dodont": return `<div class="ks-dd"><div class="do"><b><span class="ms">check_circle</span>Do</b><ul>${st.dos.map((x) => `<li>${e(x)}</li>`).join("")}</ul></div><div class="dont"><b><span class="ms">cancel</span>Don't</b><ul>${st.donts.map((x) => `<li>${e(x)}</li>`).join("")}</ul></div></div>`;
    }
    return "";
  }
  const kVariant = (n) => (n.includes(" — ") ? n.split(" — ").slice(1).join(" — ") : (n.match(/\(([^)]*)\)\s*$/) || [])[1] || "");
  const knowOf = (u) => { const kn = (u && u.contract && u.contract.knowledge) || {}; return KN_KEYS.flatMap((t) => (Array.isArray(kn[t]) ? kn[t] : []).filter((n) => !/^None specific/i.test(n)).map((name) => ({ name, type: t }))); };
  const typeIn = (name, u) => (knowOf(u).find((x) => x.name === name) || {}).type || "techniques";
  /* knowledge applied at one node of the current map */
  const nodeKnow = (cur, n) => {
    if (cur.wf) { const uses = cur.wf.uses || {}, key = n.io === "entry" ? "entry" : n.io === "gate" ? "gate" : n.unit?.id; return (uses[key] || []).map((name) => ({ name, type: typeIn(name, cur.parent) })); }
    if (!n.unit) return [];
    if (n.unit.wf) { const names = [...new Set(Object.values(n.unit.wf.uses || {}).flat())]; return names.map((name) => ({ name, type: typeIn(name, n.unit.parent) })); }
    return knowOf(n.unit);
  };
  /* ---- lens overlay helpers ---- */
  const LLIB = window.NODE_LENSES || {};
  const LGROUPS = ["Value", "Build", "Trust", "Run", "Reach"];
  const LG_COLOR = { Value: "#008080", Build: "#6d48d8", Trust: "#e91e63", Run: "#ff5722", Reach: "#0284c7" };
  const lnorm = (x) => String(x).toLowerCase().replace(/\(.*?\)/g, "").trim();
  const lensIdOf = (name) => { if (lensById[name]) return name; const b = lnorm(name); const l = M.lenses.find((x) => lnorm(x.n) === b) || M.lenses.find((x) => lnorm(x.n).split(" / ").some((p) => p === b)) || M.lenses.find((x) => lnorm(x.n).startsWith(b) || b.startsWith(lnorm(x.n).split(" / ")[0])); return l ? l.id : null; };
  const lensOfUnit = (u) => {
    if (!u) return [];
    if (u.wf && u.parent) return lensOfUnit(u.parent);
    const LN = (u.contract && u.contract.lenses) || {};
    const req = (LN.required && LN.required.length ? LN.required : (u.lenses || {}).required || []).map(lensIdOf).filter(Boolean);
    const app = (LN.applicable && LN.applicable.length ? LN.applicable : (u.lenses || {}).applicable || []).map(lensIdOf).filter(Boolean);
    return [...req.map((id) => ({ id, req: true })), ...app.filter((id) => !req.includes(id)).map((id) => ({ id, req: false }))];
  };
  const parseLens = (x) => { const i = x.indexOf(":"); return i < 0 ? { id: x.trim(), note: "" } : { id: x.slice(0, i).trim(), note: x.slice(i + 1).trim() }; };
  const nodeLens = (cur, n) => {
    if (cur.wf) {
      const parentL = lensOfUnit(cur.parent), key = n.io === "entry" ? "entry" : n.io === "gate" ? "gate" : n.unit?.id;
      return ((cur.wf.lensUses || {})[key] || []).map(parseLens).map((x) => ({ ...x, req: !!parentL.find((p) => p.id === x.id && p.req) }));
    }
    if (!n.unit) return [];
    if (n.unit.wf) {
      const parentL = lensOfUnit(n.unit.parent), seen = new Map();
      Object.values(n.unit.wf.lensUses || {}).flat().map(parseLens).forEach((x) => { if (!seen.has(x.id)) seen.set(x.id, { id: x.id, req: !!parentL.find((p) => p.id === x.id && p.req) }); });
      return [...seen.values()];
    }
    return lensOfUnit(n.unit);
  };
  /* ---- roles ---- */
  const RLIB = window.NODE_ROLES || {};
  const ROLE_ALIAS = {}; Object.entries(RLIB).forEach(([id, r]) => r.aliases.forEach((n) => (ROLE_ALIAS[n] = [...(ROLE_ALIAS[n] || []), id])));
  const raciOf = (x) => (String(x).match(/^([RACI])\s*[—-]/) || [])[1] || "";
  const roleIdsOf = (x) => { const base = String(x).replace(/^[RACI]\s*[—-]\s*/, ""); const ex = ROLE_ALIAS[base.toLowerCase()]; if (ex) return ex; return [...new Set(base.split(/,|;/).map((y) => y.trim().toLowerCase()).filter(Boolean).flatMap((y) => ROLE_ALIAS[y] || []))]; };
  const roleChips = (v) => (arr(v).length ? `<div class="chips">${arr(v).flatMap((x) => { const ids = roleIdsOf(x), r = raciOf(x); return ids.length ? ids.map((id) => `<button class="chip role-chip" data-rolesel="${id}" title="Open role">${r ? `<b class="raci">${r}</b>` : ""}${esc(RLIB[id].n)}</button>`) : [`<span class="chip">${esc(x)}</span>`]; }).join("")}</div>` : '<span class="nd">Not yet defined</span>');
  /* where each role appears across all units: RACI letters, steps performed, artifacts owned */
  const ROLE_INDEX = {};
  const roleNote = (id, rec) => (ROLE_INDEX[id] = ROLE_INDEX[id] || []).push(rec);
  Object.values(UNITS).forEach((u) => {
    if (u.kind === "step") { roleIdsOf(u.actor || "").forEach((id) => roleNote(id, { kind: "step", u: u.parent, step: u })); return; }
    const EXu = (u.contract && u.contract.execution) || {};
    arr(EXu.roles).forEach((x) => roleIdsOf(x).forEach((id) => roleNote(id, { kind: "raci", u, raci: raciOf(x) || "·" })));
    arr(EXu.agents).forEach((x) => roleIdsOf(x).forEach((id) => roleNote(id, { kind: "agent", u })));
  });
  const nodeRoles = (cur, n) => (n.unit ? (n.unit.kind === "step" ? roleIdsOf(n.unit.actor || "") : [...new Set([...arr(C(n.unit, "execution").roles), ...arr(C(n.unit, "execution").agents)].flatMap(roleIdsOf))]) : []);
  /* ---- teaching ---- */
  const teachOf = (u) => u && (u.teach || (u.wf && u.parent && u.parent.teach));
  /* stable per-question shuffle so the right answer isn't always in the same place */
  const shuffled = (a, seed) => { let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); const r = [...a]; for (let i = r.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; const j = h % (i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const learnBlock = (u) => {
    const T = teachOf(u); if (!T) return "";
    return `<div class="learn"><div class="kv"><span class="lbl"><span class="ms">flag</span>You will be able to</span><ul class="vl ck">${T.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></div>
      <div class="kv"><span class="lbl"><span class="ms">edit</span>Exercise</span><p class="ex-box">${esc(T.exercise)}</p></div>
      <div class="kv"><span class="lbl"><span class="ms">quiz</span>Check your understanding</span>${T.checks.map(([q, opts, ci, why], qi) => `<div class="quiz"><b>${qi + 1}. ${esc(q)}</b><div class="qopts">${shuffled(opts.map((o, oi) => [o, oi === ci]), q).map(([o, ok]) => `<button class="qopt" data-quiz="${ok ? 1 : 0}">${esc(o)}</button>`).join("")}</div><p class="qwhy" hidden>${esc(why)}</p></div>`).join("")}</div></div>`;
  };
  const wfCount = (u) => M.workflow.filter(([k]) => (k === "steps" ? (u.steps || []).length : arr((u.wf || {})[k]).length)).length;
  const routeOf = (u, k) => C(u, "routing")[k === "escalate" ? "escalation" : k] || (u.routing || {})[k] || "";
  const lensNames = (u, which) => (arr(C(u, "lenses")[which]).length ? arr(C(u, "lenses")[which]) : arr((u.lenses || {})[which]).map((id) => lensById[id]?.n || id));
  ROOT.contract = {
    definition: {
      purpose: "Take a software initiative from first signal to a running, evolving system — deciding with evidence at every gate.",
      outcome: "Value delivered, measured and fed back into the next cycle.",
      jtbd: "Help us turn ideas into outcomes without losing control of risk, quality or learning.",
      entry: ["An idea, signal, request or opportunity"],
      exit: ["Outcomes measured; the system iterates, scales, pivots or retires"],
    },
    flow: { stateTransitions: STAGES.map((s) => title(s.key)).join(" → ") },
  };
  ROOT.gate = "Next cycle";

  const list = (v, cls = "") => (arr(v).length ? `<ul class="vl ${cls}">${arr(v).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : `<span class="nd">Not yet defined</span>`);
  /* ---- artifact helpers ---- */
  const ALIB = window.NODE_ARTIFACTS || {};
  const ART_ALIAS = {}; Object.entries(ALIB).forEach(([id, a]) => a.aliases.forEach((n) => (ART_ALIAS[n] = id)));
  const artId = (n) => ART_ALIAS[n] || null;
  const artName = (id) => ALIB[id]?.aliases[0] || id;
  /* lineage: where every artifact is produced, used or kept as evidence, across all authored units */
  const ART_INDEX = {};
  const artNote = (name, role, u, step) => { const id = artId(name); if (!id) return; (ART_INDEX[id] = ART_INDEX[id] || []).push({ role, u, step, name }); };
  Object.values(UNITS).forEach((u) => {
    if (u.kind === "step") { if (u.out) artNote(u.out, "produces", u.parent, u); return; }
    const a = u.wf ? { inputs: u.wf.inputs, outputs: u.wf.outputs, evidence: u.wf.evidence } : (u.contract && u.contract.artifacts) || {};
    (a.inputs || []).forEach((n) => artNote(n, "uses", u)); (a.outputs || []).forEach((n) => artNote(n, "produces", u)); (a.evidence || []).forEach((n) => artNote(n, "evidence", u));
  });
  const ART_OUT = {};
  Object.entries(ART_INDEX).forEach(([id, l]) => l.filter((x) => x.role === "produces").forEach((x) => { (ART_OUT[x.u.fid] = ART_OUT[x.u.fid] || new Set()).add(id); }));
  /* if an artifact changes, which units must re-check, directly and downstream */
  const impactOf = (id) => {
    const seen = new Set([id]), hits = [], hitU = new Set(); let frontier = [id];
    for (let d = 0; d < 6 && frontier.length; d++) {
      const next = [];
      frontier.forEach((a) => (ART_INDEX[a] || []).filter((x) => x.role === "uses").forEach((x) => {
        if (!hitU.has(x.u.fid)) { hitU.add(x.u.fid); hits.push({ u: x.u, via: a, depth: d }); }
        [...(ART_OUT[x.u.fid] || [])].forEach((o) => { if (!seen.has(o)) { seen.add(o); next.push(o); } });
      }));
      frontier = next;
    }
    return hits;
  };
  /* artifacts touching one node of the current map */
  const nodeArts = (cur, n) => {
    const out = [], add = (name, role) => { const id = artId(name); if (id && !out.some((x) => x.id === id && x.role === role)) out.push({ id, name, role }); };
    const AA = cur.wf ? { inputs: cur.wf.inputs, outputs: cur.wf.outputs, evidence: cur.wf.evidence } : C(cur, "artifacts");
    if (n.io === "entry") arr(AA.inputs).forEach((x) => add(x, "uses"));
    else if (n.io === "gate") { arr(AA.outputs).forEach((x) => add(x, "produces")); arr(AA.evidence).forEach((x) => add(x, "evidence")); }
    else if (n.unit?.kind === "step") { if (n.unit.out) add(n.unit.out, "produces"); }
    else if (n.unit) { const k = n.unit, KA = k.wf ? { inputs: k.wf.inputs, outputs: k.wf.outputs, evidence: k.wf.evidence } : C(k, "artifacts"); arr(KA.inputs).forEach((x) => add(x, "uses")); arr(KA.outputs).forEach((x) => add(x, "produces")); arr(KA.evidence).forEach((x) => add(x, "evidence")); }
    return out;
  };
  const chipsOf = (v, cls = "") => (arr(v).length ? `<div class="chips">${arr(v).map((t) => { const aid = (cls === "doc" || cls === "ev") && artId(t); return aid ? `<button class="chip ${cls} art-chip" data-artsel="${aid}" title="Open the artifact template">${esc(t)}</button>` : `<span class="chip ${cls}">${esc(t)}</span>`; }).join("")}</div>` : `<span class="nd">Not yet defined</span>`);
  const kv = (label, body, icon) => `<div class="kv"><span class="lbl">${icon ? `<span class="ms">${icon}</span>` : ""}${label}</span>${body}</div>`;
  const txt = (v) => (v ? `<p>${esc(v)}</p>` : `<span class="nd">Not yet defined</span>`);
  const routesBlock = (u) => `<div class="rt-mini">${Object.entries(M.routes).map(([k, r]) => { const t = routeOf(u, k); return t ? `<div style="--rc:${r.c}"><span class="ms">${r.icon}</span><b>${r.label}</b>${esc(t)}</div>` : ""; }).join("") || '<span class="nd">Not yet defined</span>'}</div>`;

  function mapModel(u) {
    const ks = kids(u);
    let nodes;
    if (u === ROOT) nodes = STAGES.map((s, i) => ({ id: s.id, label: s.key, num: ROMAN[i], unit: s }));
    else if (!ks.length) nodes = [{ id: "__in", label: "Entry", io: "entry" }, { id: "__self", label: u.short, num: u.num, unit: u, self: true }, { id: "__out", label: u.gate || "Exit", io: "gate" }];
    else nodes = [{ id: "__in", label: "Entry", io: "entry" }, ...ks.map((k) => ({ id: k.id, label: k.short, num: k.num, unit: k })), { id: "__out", label: u.gate || "Exit", io: "gate" }];
    const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) edges.push({ f: i, t: i + 1, ty: "forward" });
    if (u === ROOT) edges.push({ f: nodes.length - 1, t: 0, ty: "forward", cyc: true, n: "Next cycle" });
    const loops = u === ROOT ? RM.loops.filter((l) => l[2] !== "forward") : u.loops || [];
    loops.forEach(([f, t, ty, n]) => { if (idx[f] === undefined) return; edges.push({ f: idx[f], t: t in idx ? idx[t] : t, ty, n }); });
    return { nodes, edges };
  }
  const wrap = (s, max) => {
    const w = String(s).split(" "), lines = [""];
    w.forEach((x) => { const l = lines[lines.length - 1]; if ((l + " " + x).trim().length > max && l) lines.push(x); else lines[lines.length - 1] = (l + " " + x).trim(); });
    return lines.slice(0, 2).map((l, i) => (i === 1 && lines.length > 2 ? l + "…" : l));
  };

  /* ---- details panel content ---- */
  function detailHTML(u, mm, sel, mode) {
    const D = C(u, "definition"), F = C(u, "flow"), K = C(u, "cases"), CT = C(u, "controls"), EX = C(u, "execution"), AR = C(u, "artifacts"), KN = C(u, "knowledge"), LN = C(u, "lenses");
    const head = (lbl, h, extra = "") => `<div class="dt-head"><span class="lbl">${lbl}</span><h3>${h}</h3>${extra}</div>`;
    const hint = `<p class="dt-hint"><span class="ms">touch_app</span>Click any node, the gate, a loop or the Authority / Stop lines to see its details.</p>`;

    const lensBlock = () => `${kv("Lenses · required / applicable", `<div class="chips">${lensNames(u, "required").map((n) => `<span class="chip req">${esc(n)}</span>`).join("")}${lensNames(u, "applicable").map((n) => `<span class="chip app">${esc(n)}</span>`).join("") || (lensNames(u, "required").length ? "" : '<span class="nd">Not yet defined</span>')}</div>`, "visibility")}
      ${kv("Lens concerns", list(LN.concerns), "report")}${kv("Lens constraints", list(LN.constraints), "block")}${kv("Evidence lenses need", chipsOf(LN.evidence, "ev"), "inventory")}${kv("Decisions lenses shape", chipsOf(LN.decisions, "dec"), "how_to_vote")}`;
    const knowBlock = () => M.contract.find((c) => c.id === "knowledge").fields.map(([k, n]) => kv(n, chipsOf(KN[k], "kn"), "menu_book")).join("");
    const CO = C(u, "continuity");
    const contBlock = () => `${kv("Handoff", txt(CO.handoff), "move_down")}${kv("Traceability", list(CO.traceability), "link")}${kv("Timebox", txt(CO.timebox), "schedule")}${kv("Measures", list(CO.measures), "monitoring")}${kv("Learning", list(CO.learning), "school")}`;
    const chain = (STAGES[u.si] || {}).traceChain;
    const execBlock = () => `${kv("Roles · RACI", roleChips(EX.roles), "groups")}${kv("Agents", roleChips(EX.agents), "smart_toy")}${kv("Tools", chipsOf(EX.tools), "construction")}${kv("Authority", txt(EX.authority), "gavel")}`;

    const wfBlock = () => M.workflow.map(([k, n]) => {
      if (k === "steps") return kv("Steps", `<ol class="vl wsteps">${(u.steps || []).map((s) => `<li><b>${s.num}</b>${s.decision ? "◆ " : ""}${esc(s.title)} <em>· ${esc(s.actor)}</em>${s.out ? ` → ${esc(s.out)}` : ""}</li>`).join("")}</ol>`, "format_list_numbered");
      const v = (u.wf || {})[k];
      return kv(n, Array.isArray(v) ? list(v) : txt(v), "");
    }).join("");
    const parBlock = () => `${(u.parallel || []).map((g, gi) => kv(`Parallel group ${gi + 1}`, chipsOf(g.map((id) => { const k = kids(u).find((x) => x.id === id); return k ? `${k.num} ${k.short}` : id; })), "call_split")).join("")}${kv("How the parallel work runs", list(F.parallel), "info")}${kv("Depends on", list(F.dependencies), "link")}`;

    const lensChips = (items) => (items.length ? kv(`Lenses engaged · ${items.length}`, `<div class="chips">${items.map((x) => { const l = lensById[x.id]; return `<button class="chip lens-chip ${x.req ? "rq" : ""}" style="--kc:${LG_COLOR[l.g]}" data-lensel="${x.id}" title="${x.req ? "Required" : "Applicable"}${x.note ? " — " + esc(x.note) : ""}">${esc(l.n)}</button>`; }).join("")}</div>`, "visibility") : "");
    const knChips = (items) => (items.length ? kv(`Knowledge applied · ${items.length}`, `<div class="chips">${items.map((x) => `<button class="chip kn-chip" style="--kc:${KN_COLOR(x.type)}" data-knsel="${esc(x.type)}|${esc(x.name)}" title="${KN_SING[x.type]}">${esc(x.name)}</button>`).join("")}</div>`, "menu_book") : "");
    if (sel && sel.k === "kn" && mm) return knSheet(u, mm, sel, false);
    if (sel && sel.k === "lens" && mm) return lensSheet(u, mm, sel, false);
    if (sel && sel.k === "art" && mm) return artSheet(u, mm, sel, false);
    if (sel && sel.k === "role" && mm) return roleSheet(u, mm, sel, false);
    if (sel && sel.k === "prompt" && UNITS[sel.fid]) return kitCard(UNITS[sel.fid], sel.tab, false);
    if (sel && sel.k === "track" && mm) return trackPanel(u, mm, sel);
    if (sel && sel.k === "walk") return walkPanel(u, sel);
    if (sel && sel.k === "wf") return `${head("Workflow contract", esc(u.title))}<div class="dt-grid">${wfBlock()}</div>`;
    if (sel && sel.k === "par") return `${head("Parallel work", "Steps that run at the same time")}<div class="dt-grid">${parBlock()}</div>`;
    if (sel && sel.k === "lenses") return `${head("Lenses", "Whose perspectives matter here")}<div class="dt-grid">${lensBlock()}</div>`;
    if (sel && sel.k === "knowledge") return `${head("Knowledge", "Established knowledge that applies")}<div class="dt-grid">${knowBlock()}</div>`;
    if (sel && sel.k === "exec") return `${head("Execution", "Who does the work, with what, under whose authority")}<div class="dt-grid">${execBlock()}</div>`;

    if (!sel || !mm) {
      const caseCols = [["happyPath", "Happy path"], ["alternates", "Alternates"], ["edgeCases", "Edge cases"], ["exceptions", "Exceptions"], ["failures", "Failures"]];
      const leaf = u !== ROOT && !kids(u).length;
      return `${head(`Overview · ${u === ROOT ? "Lifecycle" : unitLabel(u)}`, esc(u.title))}${mm ? hint : ""}
        ${u !== ROOT ? `<div class="pr-cta"><button class="tool dark" data-prompt="${u.fid}"><span class="ms">smart_toy</span>Prompt & agent kit · run this ${u.kind === "stage" ? "act" : u.kind}</button><span>The prompt, context file, command, workflow spec, skills, subagents, tools, guardrails and rubrics — built from this ${u.kind === "stage" ? "act" : u.kind}'s contract.</span></div>` : ""}
        ${leaf ? `<div class="note" style="margin-bottom:10px">No ${PLURAL[KIND[u.level + 1]] || "children"} authored yet — this map shows ${esc(u.title)} itself: its entry, the unit, and its gate and branches.</div>` : ""}
        <div class="dt-grid">
          ${kv("Purpose · why", txt(D.purpose || u.purpose || u.summary), "flag")}
          ${kv("Outcome", txt(D.outcome), "target")}
          ${kv("Job to be done", D.jtbd ? `<p class="jt">“${esc(D.jtbd)}”</p>` : txt(""), "work")}
          ${F.stateTransitions ? kv("States", `<div class="states">${String(F.stateTransitions).split(/\s*→\s*/).map((s) => `<span>${esc(s)}</span>`).join('<span class="ms">arrow_forward</span>')}</div>`, "timeline") : ""}
          ${Object.keys(K).length ? kv("What can happen", `<div class="cases">${caseCols.filter(([k]) => arr(K[k]).length).map(([k, n]) => `<div><b>${n}</b>${list(K[k])}</div>`).join("")}</div>`, "warning") : ""}
        </div>
        ${u.level === 0 || u.mode ? actSysBlock(u) : ""}
        ${u !== ROOT ? `<div class="dt-sub lbl"><span class="ms">sync_alt</span>Continuity</div><div class="dt-grid">${contBlock()}</div>` : ""}
        ${u.level === 0 && chain ? `<div class="dt-sub lbl"><span class="ms">link</span>Trace-ID chain</div><div class="tchain">${chain.map(([pre, nm, aid]) => `<button class="tc" data-artsel="${aid}"><b>${pre}-###</b>${esc(nm)}</button>`).join('<span class="ms">arrow_forward</span>')}</div>` : ""}
        ${teachOf(u) ? `<div class="dt-sub lbl"><span class="ms">school</span>Learn</div>${learnBlock(u)}` : ""}
        ${u.parallel?.length ? `<div class="dt-sub lbl"><span class="ms">call_split</span>Parallel work</div><div class="dt-grid">${parBlock()}</div>` : ""}
        ${u.wf ? `<div class="dt-sub lbl"><span class="ms">account_tree</span>Workflow contract · ${wfCount(u)}/${M.workflow.length} fields</div><div class="dt-grid">${wfBlock()}</div>`
          : `<div class="dt-sub lbl"><span class="ms">visibility</span>Lenses</div><div class="dt-grid">${lensBlock()}</div>
        <div class="dt-sub lbl"><span class="ms">groups</span>Execution</div><div class="dt-grid">${execBlock()}</div>
        <div class="dt-sub lbl"><span class="ms">menu_book</span>Knowledge</div><div class="dt-grid">${knowBlock()}</div>`}`;
    }

    if (sel.k === "n") {
      const n = mm.nodes[sel.i];
      if (n.io === "entry") {
        return `${head("Entry", `When ${u === ROOT ? "the lifecycle" : "this " + u.kind} starts`)}
          <div class="dt-grid">${kv("Entry criteria", list(D.entry, "ck"), "login")}${kv("Inputs", chipsOf(AR.inputs, "doc"), "input")}${kv("Depends on", list(F.dependencies), "link")}${kv("Runs in parallel", list(F.parallel), "call_split")}${kv("Normal flow", list(F.normal), "conversion_path")}${knChips(nodeKnow(u, n))}${lensChips(nodeLens(u, n))}</div>`;
      }
      if (n.io === "gate") {
        return `${head("Gate", esc(u.gate || arr(CT.gates)[0] || "Exit"), EX.authority ? `<span class="dt-auth"><span class="ms">gavel</span>${esc(EX.authority)}</span>` : "")}
          <div class="dt-grid">${kv("Gates", list(CT.gates), "verified_user")}${kv("Criteria", list(CT.criteria, "ck"), "rule")}${kv("Checks", list(CT.checks), "fact_check")}${kv("Rules & policies", list([...arr(CT.rules), ...arr(CT.policies)]), "policy")}${kv("Decision", chipsOf(LN.decisions, "dec"), "how_to_vote")}
          ${kv("Exit · done when", list(D.exit, "ck"), "logout")}${kv("Outputs", chipsOf(outOf(u), "doc"), "output")}${kv("Evidence", chipsOf(AR.evidence, "ev"), "inventory")}${kv("Where work goes next", routesBlock(u), "fork_right")}${kv("Handoff", txt(CO.handoff), "move_down")}${kv("Measures", list(CO.measures), "monitoring")}${knChips(nodeKnow(u, n))}${lensChips(nodeLens(u, n))}</div>`;
      }
      const k = n.unit, kd = C(k, "definition"), pg = k === u ? null : pageOf(k), own = ownerOf(k);
      const myLoops = mm.edges.map((e, i) => ({ e, i })).filter(({ e }) => e.n && !e.cyc && (e.f === sel.i || e.t === sel.i));
      if (k.kind === "step") {
        const out = myLoops.filter(({ e }) => e.f === sel.i);
        return `${head(`Step ${k.num}${k.decision ? " · decision" : ""}`, esc(k.title), `<div class="dt-tags"><span class="chip who"><span class="ms">person</span>${esc(k.actor)}</span></div>`)}
          <div class="dt-grid">
            ${kv("Actor", roleChips([k.actor]), "person")}
            ${k.reuses && UNITS[k.reuses] ? kv("Reuses, at small scale", `<a class="chip doc" href="#/${pageOf(UNITS[k.reuses])}">${esc(UNITS[k.reuses].num + " " + UNITS[k.reuses].title)}</a>`, "recycling") : ""}
            ${kv(k.decision ? "Decision" : "Action", txt(k.title), k.decision ? "how_to_vote" : "play_arrow")}
            ${k.decision ? "" : kv("Produces", chipsOf(outOf(k), "doc"), "output")}
            ${k.decision ? kv("Branches from here", `<div class="rt-mini"><div style="--rc:${RC("forward")}"><span class="ms">arrow_forward</span><b>Yes</b>${esc(mm.nodes[sel.i + 1]?.label || "Continue")}</div>${out.map(({ e }) => `<div style="--rc:${RC(e.ty)}"><span class="ms">${M.routes[e.ty].icon}</span><b>${M.routes[e.ty].label}</b>${esc(e.n)}</div>`).join("")}</div>`, "call_split") : ""}
            ${myLoops.length ? kv("Loops", `<div class="chips">${myLoops.map(({ e, i }) => `<button class="chip lpc" style="--c:${RC(e.ty)}" data-sel="e:${i}">${esc(e.n)}</button>`).join("")}</div>`, "sync_alt") : ""}
            ${knChips(nodeKnow(u, mm.nodes[sel.i]))}${lensChips(nodeLens(u, mm.nodes[sel.i]))}
          </div>
          <div class="dt-actions"><button class="tool dark" data-prompt="${k.fid}"><span class="ms">smart_toy</span>Prompt for this step</button></div>`;
      }
      return `${head(`${unitLabel(k)}${k.status ? " · " + k.status : ""}`, esc(k.title), `<div class="dt-tags">${own ? `<span class="chip who"><span class="ms">person</span>${esc(own)}</span>` : ""}${k.gate ? `<span class="chip gt"><span class="ms">verified_user</span>${esc(k.gate)}</span>` : ""}</div>`)}
        <div class="dt-grid">
          ${kv("What · purpose", txt(kd.purpose || k.purpose || k.summary), "flag")}
          ${kv("When · entry", list(kd.entry, "ck"), "login")}
          ${kv("Needs · inputs", chipsOf(C(k, "artifacts").inputs, "doc"), "input")}
          ${kv("Produces", chipsOf(outOf(k), "doc"), "output")}
          ${kv("Outcome", txt(kd.outcome), "target")}
          ${kv("Done when · exit", list(kd.exit, "ck"), "logout")}
          ${kv("Hands over", txt(C(k, "continuity").handoff), "move_down")}
          ${C(k, "continuity").timebox ? kv("Timebox", txt(C(k, "continuity").timebox), "schedule") : ""}
          ${kv("Who", roleChips([...arr(C(k, "execution").roles)]), "groups")}
          ${kv("Routes", routesBlock(k), "fork_right")}
          ${arr(C(k, "controls").criteria).length ? kv("Criteria", list(C(k, "controls").criteria), "rule") : ""}
          ${arr(C(k, "artifacts").evidence).length ? kv("Evidence", chipsOf(C(k, "artifacts").evidence, "ev"), "inventory") : ""}
          ${myLoops.length ? kv("Loops", `<div class="chips">${myLoops.map(({ e, i }) => `<button class="chip lpc" style="--c:${RC(e.ty)}" data-sel="e:${i}">${esc(e.n)}</button>`).join("")}</div>`, "sync_alt") : ""}
            ${knChips(nodeKnow(u, mm.nodes[sel.i]))}${lensChips(nodeLens(u, mm.nodes[sel.i]))}
          ${kids(k).length ? kv(cap(PLURAL[KIND[k.level + 1]]), chipsOf(kids(k).map((g) => `${g.num} ${g.short}`)), "account_tree") : ""}
        </div>
        <div class="dt-actions"><button class="tool dark" data-prompt="${k.fid}"><span class="ms">smart_toy</span>Prompt for this ${k.kind}</button>${kids(k).length ? `<button class="tool" data-drill="${sel.i}"><span class="ms">zoom_in</span>Drill into its map</button>` : ""}${pg ? `<a class="tool" href="#/${pg}"><span class="ms">menu_book</span>Open chapter</a>` : ""}</div>`;
    }

    if (sel.k === "e") {
      const e = mm.edges[sel.i], r = M.routes[e.ty];
      const from = mm.nodes[e.f], to = typeof e.t === "number" ? mm.nodes[e.t] : null;
      const toLabel = to ? (to.num ? to.num + " " : "") + to.label : e.t === "authority" ? "Authority" : "Stop";
      const why = ({ rework: "Work returns to an earlier step to be corrected.", alternate: "A different, valid path — usually a reframe or pivot.", escalate: "The issue can't be resolved here and goes to someone with authority.", stop: "Work ends deliberately; the decision and learning are recorded.", forward: "Exit met — hand off to the next step." })[e.ty];
      const fromRoute = from.unit ? routeOf(from.unit, e.ty) : "";
      return `${head(`${r.label} loop`, esc(e.n || r.label))}
        <div class="dt-path" style="--c:${r.c}"><span>${esc((from.num ? from.num + " " : "") + from.label)}</span><span class="ms">${r.icon}</span><span>${esc(toLabel)}</span></div>
        <div class="dt-grid">${kv("What it means", txt(why), "info")}${fromRoute ? kv(`Route defined by ${esc(from.label)}`, txt(fromRoute), "fork_right") : ""}${kv(`${r.label} route at ${u === ROOT ? "lifecycle" : u.kind} level`, txt(routeOf(u, e.ty)), "account_tree")}${e.ty === "escalate" && EX.authority ? kv("Authority", txt(EX.authority), "gavel") : ""}</div>`;
    }

    if (sel.k === "b") {
      const r = M.routes[sel.t];
      const why = ({ forward: "The gate is passed: work and its outputs hand off to the next unit.", alternate: "A different valid path — usually a reframe or pivot.", rework: "The gate found gaps; work returns to be corrected.", escalate: "The decision is above this level's authority.", stop: "Work ends deliberately; the decision and learning are recorded." })[sel.t];
      return `${head(`Gate branch · ${r.label}`, esc(routeOf(u, sel.t)))}
        <div class="dt-path" style="--c:${r.c}"><span>${esc(u.gate || "Gate")}</span><span class="ms">${r.icon}</span><span>${r.label}</span></div>
        <div class="dt-grid">${kv("What it means", txt(why), "info")}${kv("Decision", chipsOf(LN.decisions, "dec"), "how_to_vote")}
        ${sel.t === "forward" ? kv("Exit · done when", list(D.exit, "ck"), "logout") + kv("Hands over", chipsOf(outOf(u), "doc"), "output") : ""}
        ${sel.t === "escalate" ? kv("Authority", txt(EX.authority), "gavel") : ""}
        ${sel.t === "stop" ? kv("Failures behind a stop", list(K.failures), "error") : ""}
        ${sel.t === "alternate" ? kv("Alternates", list(K.alternates), "alt_route") : ""}
        ${sel.t === "rework" ? kv("Exceptions", list(K.exceptions), "report") : ""}
        ${kv("Evidence the gate uses", chipsOf(AR.evidence, "ev"), "inventory")}</div>`;
    }

    if (sel.k === "auth") {
      const es = mm.edges.map((e, i) => ({ e, i })).filter(({ e }) => e.ty === "escalate");
      return `${head("Authority", "Who decides when work escalates")}
        <div class="dt-grid">${kv("Authority", txt(EX.authority), "gavel")}${kv("Roles", chipsOf(EX.roles), "groups")}${kv("Escalation route", txt(routeOf(u, "escalate")), "north")}${kv("Escalations on this map", es.length ? `<div class="chips">${es.map(({ e, i }) => `<button class="chip lpc" style="--c:${RC("escalate")}" data-sel="e:${i}">${esc(mm.nodes[e.f].label)}: ${esc(e.n)}</button>`).join("")}</div>` : txt(""), "sync_alt")}</div>`;
    }
    if (sel.k === "stop") {
      const ss = mm.edges.map((e, i) => ({ e, i })).filter(({ e }) => e.ty === "stop");
      return `${head("Stop / Abort", "When work ends deliberately")}
        <div class="dt-grid">${kv("Stop route", txt(routeOf(u, "stop")), "block")}${kv("Failures to watch", list(K.failures), "error")}${kv("Stops on this map", ss.length ? `<div class="chips">${ss.map(({ e, i }) => `<button class="chip lpc" style="--c:${RC("stop")}" data-sel="e:${i}">${esc(mm.nodes[e.f].label)}: ${esc(e.n)}</button>`).join("")}</div>` : txt(""), "sync_alt")}</div>`;
    }
    return "";
  }

  const SCEN = [
    ["all", "All paths", "route", "#040505", null],
    ["happyPath", "Happy path", "sentiment_satisfied", "#008080", ["forward"]],
    ["alternates", "Alternates", "alt_route", "#0284c7", ["alternate"]],
    ["edgeCases", "Edge cases", "border_style", "#8b5cf6", []],
    ["exceptions", "Exceptions", "report", "#c49000", ["escalate", "rework"]],
    ["failures", "Failures", "error", "#e91e63", ["stop", "rework"]],
  ];
  const LAYERS = [["owners", "Owners", "person"], ["checks", "Checks", "check_circle"], ["outputs", "Artifacts · in & out", "description"], ["states", "States", "timeline"], ["lenses", "Lenses · knowledge · actors", "visibility"], ["branches", "Gate branches", "call_split"], ["tracks", "Continuous tracks", "sync_alt"]];

  /* ---- knowledge sheet: what it is, what it says, how it works, its template, and how it's used in this flow ---- */
  function knSheet(u, mm, sel, full) {
    const D = C(u, "definition"), CT = C(u, "controls");
    const name = sel.name, type = sel.type, col = KN_COLOR(type), E = kEntry(name) || {};
    const hits = mm.nodes.map((n, i) => ({ n, i })).filter(({ n }) => nodeKnow(u, n).some((x) => x.name === name));
    const where = (n) => {
      if (n.io === "entry") return `Applied before work starts — ${esc(arr(D.entry)[0] || "entry criteria")}.`;
      if (n.io === "gate") return `Applied at the gate (${esc(u.gate || "exit")}) — ${esc(arr(CT.criteria)[0] || "gate criteria")}.`;
      const k = n.unit;
      if (k.kind === "step") return `${esc(k.actor)} uses it ${k.decision ? "to decide" : "to"} “${esc(k.title)}”${k.out ? ` → produces <b class="kn-out">${esc(k.out)}</b>` : ""}.`;
      const stepsOf = (w) => Object.entries(w.wf.uses || {}).filter(([, v]) => v.includes(name)).map(([s2]) => { const st = w.steps.find((x) => x.id === s2); return s2 === "entry" ? `${w.short}: entry` : s2 === "gate" ? `${w.short}: gate` : `${w.short} ${st.num} ${st.title}${st.actor ? " (" + st.actor + ")" : ""}`; });
      const steps = k.wf ? stepsOf(k) : (k.workflows || []).flatMap(stepsOf);
      return `${esc(C(k, "definition").purpose || k.summary || "")}${steps.length ? ` <em>Used at: ${steps.map(esc).join(" · ")}</em>` : ""}`;
    };
    const variant = kVariant(name), inParent = knowOf(u).some((x) => x.name === name);
    const cat = RM.knowledge.find((x) => x[0] === kBase(name) || x[0] === name);
    const flowStrip = `<div class="kn-flow" style="--kc:${col}">${hits.length ? hits.map(({ n }, j) => `${j ? '<span class="ms">arrow_forward</span>' : ""}<span>${esc(n.num ? n.num + " " : "")}${esc(n.io ? n.label.toUpperCase() : n.label)}</span>`).join("") : '<span class="nd">Not applied on this map</span>'}</div>`;
    const block = (title, icon, body, cls = "") => `<section class="ksec ${cls}"><h4><span class="ms">${icon}</span>${title}</h4>${body}</section>`;
    const what = block(`What it is`, "info", `<p>${esc(E.what || "")}</p>${E.source ? `<p class="ksrc">Source: ${esc(E.source)}</p>` : ""}`);
    const says = E.says ? block("What the standard says", "gavel", `<ul class="vl">${E.says.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`) : "";
    const applies = E.applies ? block("How it applies in this lifecycle", "conversion_path", `<p>${esc(E.applies)}</p>`) : "";
    const here = variant ? block("Applied here as", "tune", `<p>${esc(variant)}</p>`) : "";
    const how = block("How it works", "play_circle", `<ol class="ks-how">${(E.how || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`);
    const tpl = block(`Structure · template`, "grid_view", `<div class="ks-wrap ${full ? "big" : ""}">${renderStructure(E.structure)}</div>`, "tpl");
    const flow = block("How it's used in this flow", "account_tree", hits.length ? `<ol class="kn-where">${hits.map(({ n }) => `<li><b>${esc(n.num ? n.num + " " : "")}${esc(n.io ? n.label.toUpperCase() : n.label)}</b>${where(n)}</li>`).join("")}</ol>` : '<span class="nd">Not applied on this map</span>');
    const use = E.use ? block("When to use it", "schedule", `<p>${esc(E.use)}</p>`) : "";
    const watch = E.pitfalls ? block("Watch out for", "warning", `<ul class="vl">${E.pitfalls.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`) : "";
    const meta = block(`What a ${KN_SING[type].toLowerCase()} is`, "category", `<p>${esc((M.knowledgeTypes[KN_SING[type]] || [])[1] || "")}</p>${inParent ? `<p class="ksrc">Also in the knowledge contract of ${esc(u === ROOT ? "the lifecycle" : unitLabel(u) + " " + u.title)}.</p>` : ""}${cat ? `<p><a class="kn-link" href="#/knowledge/${cat[1]}">See all ${esc(cat[1])}s in the catalogue →</a></p>` : ""}`);
    const top = `<div class="ks-head" style="--kc:${col}"><span class="ks-type"><i></i>${KN_SING[type]}</span><h3>${esc(kBase(name))}</h3>${variant ? `<span class="ks-var">${esc(variant)}</span>` : ""}
      <div class="ks-acts">${full ? `<button class="tool" data-act="sheet-close"><span class="ms">close</span>Close sheet</button>` : `<button class="tool dark" data-act="sheet"><span class="ms">open_in_full</span>Open full sheet</button>`}</div></div>`;
    if (!full) return `<div class="ks panel" style="--kc:${col}">${top}${flowStrip}${what}${says}${applies}${here}${how}${tpl}${flow}${use}${watch}${meta}</div>`;
    return `<div class="ks full" style="--kc:${col}">${top}${flowStrip}<div class="ks-cols"><div class="ks-main">${tpl}${how}</div><div class="ks-side">${what}${says}${applies}${here}${flow}${use}${watch}${meta}</div></div></div>`;
  }

  /* ---- lens sheet: what the lens is, what it asks, and how it works at each point of this flow ---- */
  function lensSheet(u, mm, sel, full) {
    const lens = lensById[sel.id], E = LLIB[sel.id] || {}, col = LG_COLOR[lens.g], LN = C(u.wf ? u.parent : u, "lenses");
    const here = lensOfUnit(u).find((x) => x.id === sel.id);
    const hits = mm.nodes.map((n, i) => ({ n, i, l: nodeLens(u, n).find((x) => x.id === sel.id) })).filter((h) => h.l);
    const label = (n) => esc((n.num ? n.num + " " : "") + (n.io ? n.label.toUpperCase() : n.label));
    const where = (n, l) => {
      if (l.note) return `${n.unit?.actor ? esc(n.unit.actor) + " — " : ""}${esc(l.note)}`;
      const k = n.unit; if (!k) return "";
      const fromWf = (w) => Object.entries(w.wf.lensUses || {}).flatMap(([sid, arr2]) => arr2.map(parseLens).filter((x) => x.id === sel.id).map((x) => { const st = w.steps.find((y) => y.id === sid); return `<li><b>${esc(w.short)} ${esc(st ? st.num + " " + st.title : sid)}</b>${esc(x.note)}</li>`; }));
      const inner = k.wf ? fromWf(k) : (k.workflows || []).flatMap(fromWf);
      const kl = (k.contract && k.contract.lenses) || {};
      return `${esc(C(k, "definition").purpose || k.summary || "")}${arr(kl.concerns).length ? `<em>Concerns here: ${arr(kl.concerns).map(esc).join(" · ")}</em>` : ""}${inner.length ? `<ul class="ls-inner">${inner.join("")}</ul>` : ""}`;
    };
    const block = (title, icon, body, cls = "") => `<section class="ksec ${cls}"><h4><span class="ms">${icon}</span>${title}</h4>${body}</section>`;
    const ul = (v) => `<ul class="vl">${arr(v).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    const status = here ? (here.req ? "Required here" : "Applicable here") : "Not engaged at this level";
    const flowStrip = `<div class="kn-flow" style="--kc:${col}">${hits.length ? hits.map(({ n, l }, j) => `${j ? '<span class="ms">arrow_forward</span>' : ""}<span class="${l.req ? "rq" : ""}">${label(n)}</span>`).join("") : '<span class="nd">Not engaged on this map</span>'}</div>`;
    const what = block("What this lens is", "visibility", `<p>${esc(E.what || lens.c)}</p><p class="ksrc">Usually held by: ${arr(E.holder).map(esc).join(", ")}</p>`);
    const asks = block("Questions it asks", "help", `<ol class="ks-how">${arr(E.asks).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`);
    const flow = block("How it works in this flow", "account_tree", hits.length ? `<ol class="kn-where">${hits.map(({ n, l }) => `<li><b>${label(n)} <span class="ls-badge ${l.req ? "rq" : ""}">${l.req ? "required" : "applicable"}</span></b>${where(n, l)}</li>`).join("")}</ol>` : '<span class="nd">Not engaged on this map</span>');
    const concerns = block("What it worries about", "report", ul(E.concerns) + (here && arr(LN.concerns).length ? `<p class="ksrc">Recorded for ${esc(u.title)}: ${arr(LN.concerns).map(esc).join(" · ")}${arr(LN.constraints).length ? " — constraints: " + arr(LN.constraints).map(esc).join(" · ") : ""}</p>` : ""));
    const evidence = block("Evidence it needs", "inventory", ul(E.evidence) + (here && arr(LN.evidence).length ? `<p class="ksrc">Recorded here: ${arr(LN.evidence).map(esc).join(" · ")}</p>` : ""));
    const decisions = block("Decisions it shapes", "how_to_vote", ul(E.decisions) + (here && arr(LN.decisions).length ? `<p class="ksrc">Decisions here: ${arr(LN.decisions).map(esc).join(" · ")}</p>` : ""));
    const tpl = block("Lens checklist · template", "grid_view", `<div class="ks-wrap ${full ? "big" : ""}">${renderStructure(E.structure)}</div>`, "tpl");
    const act = u === ROOT ? "" : (E.acts || {})[STAGES[u.si].id];
    const inAct = act ? block(`In ${title(STAGES[u.si].key)}`, "explore", `<p>${esc(act)}</p>`) : "";
    const typeKey = (n) => { const t = (KLIB[n] || {}).type; return t ? Object.keys(KN_SING).find((k) => KN_SING[k] === t) : null; };
    const related = arr(E.knowledge).length ? block("Related knowledge", "menu_book", `<div class="chips">${E.knowledge.map((n) => typeKey(n) ? `<button class="chip kn-chip" style="--kc:${KN_COLOR(typeKey(n))}" data-knsel="${typeKey(n)}|${esc(n)}">${esc(n)}</button>` : `<span class="chip">${esc(n)}</span>`).join("")}</div>`) : "";
    const ignored = block("If this lens is ignored", "warning", ul(E.ignored));
    const top = `<div class="ks-head" style="--kc:${col}"><span class="ks-type"><i></i>${lens.g} lens</span><h3>${esc(lens.n)}</h3><span class="ks-var">${status}</span>
      <div class="ks-acts"><a class="tool" href="#/lenses/${lens.id}"><span class="ms">visibility</span>Lens library</a>${full ? `<button class="tool" data-act="sheet-close"><span class="ms">close</span>Close sheet</button>` : `<button class="tool dark" data-act="sheet"><span class="ms">open_in_full</span>Open full sheet</button>`}</div></div>`;
    if (!full) return `<div class="ks panel" style="--kc:${col}">${top}${flowStrip}${what}${asks}${flow}${tpl}${concerns}${evidence}${decisions}${inAct}${related}${ignored}</div>`;
    return `<div class="ks full" style="--kc:${col}">${top}${flowStrip}<div class="ks-cols"><div class="ks-main">${flow}${tpl}${asks}</div><div class="ks-side">${what}${inAct}${concerns}${evidence}${decisions}${related}${ignored}</div></div></div>`;
  }

  /* ---- artifact sheet: what it is, its template, what good looks like, and where it flows ---- */
  /* ---- artifact templates rendered as the real thing: document, sheet, form, message, canvas, pack ---- */
  const ph = (t) => esc(t).replace(/\{([^}]+)\}/g, '<mark class="at-ph">{$1}</mark>');
  const COLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const typeHint = (t) => !t ? "" : t.startsWith("select:") ? `▾ list: ${t.slice(7).split("/").join(" · ")}` : t.startsWith("formula:") ? `fx ${t.slice(8)}` : ({ id: "ID", text: "text", long: "long text", date: "date", person: "person", num: "number", money: "currency", pct: "percent", link: "link", check: "checkbox" })[t] || t;
  const cellVal = (v, t) => { if (v == null || v === "") return ""; if (t && t.startsWith("select:")) return `<span class="at-dd">${esc(v)}<i>▾</i></span>`; if (t && t.startsWith("formula:")) return `<span class="at-fxv">${esc(v)}</span>`; return esc(v); };
  function renderArtifact(T) {
    if (!T) return '<span class="nd">No template</span>';
    if (T.fmt === "doc") {
      return `<div class="at-doc"><div class="at-page">
        <div class="at-dochead"><span class="at-kind"><span class="ms">description</span>Document</span><h5>${ph(T.title)}</h5>
          <table class="at-meta">${(T.meta || []).map((m) => `<tr><th>${esc(m)}</th><td></td></tr>`).join("")}</table></div>
        ${T.sections.map(([h, g, ex]) => `<div class="at-sec"><h6>${esc(h)}</h6><div class="at-guide"><span class="ms">edit_note</span>${esc(g)}</div>${ex ? `<div class="at-ex"><b>Example</b>${ph(ex)}</div>` : ""}<div class="at-lines"><i></i><i></i></div></div>`).join("")}
        ${T.decision ? `<div class="at-sec"><h6>Decision</h6><div class="at-opts">${T.decision.map((o) => `<span><i></i>${esc(o)}</span>`).join("")}</div></div>` : ""}
        ${T.signoff ? `<div class="at-signs">${T.signoff.map((r) => `<div><span class="at-sigline"></span><b>${esc(r)}</b><em>Signature · Date</em></div>`).join("")}</div>` : ""}
      </div></div>`;
    }
    if (T.fmt === "sheet") {
      const cols = T.cols, rows = T.rows || [], blank = T.blank || 3;
      const body = rows.map((r, ri) => `<tr><td class="rn">${ri + 3}</td>${cols.map((c, ci) => `<td class="${c[1] && c[1].startsWith("formula:") ? "fx" : ""}">${cellVal(r[ci], c[1])}</td>`).join("")}</tr>`).join("")
        + Array.from({ length: blank }, (_, bi) => `<tr class="blank"><td class="rn">${rows.length + bi + 3}</td>${cols.map(() => "<td></td>").join("")}</tr>`).join("");
      return `<div class="at-sheet"><div class="at-bar"><span class="ms">table_view</span><b>${esc(T.file)}</b><span class="at-fxb">fx</span></div>
        <div class="at-gw"><table class="at-xl"><thead><tr><th class="rn"></th>${cols.map((_, i) => `<th>${COLS[i]}</th>`).join("")}</tr></thead><tbody>
          <tr class="hdr"><td class="rn">1</td>${cols.map((c) => `<td>${esc(c[0])}</td>`).join("")}</tr>
          <tr class="rule"><td class="rn">2</td>${cols.map((c) => `<td>${esc(typeHint(c[1]))}</td>`).join("")}</tr>
          ${body}</tbody></table></div>
        <div class="at-tabs"><span class="on">${esc(T.tab || "Sheet1")}</span><span>+</span>${T.notes ? `<em>${esc(T.notes)}</em>` : ""}</div></div>`;
    }
    if (T.fmt === "form") {
      const ctl = ([label, t, hint]) => {
        if (t === "check") return `<label class="at-chk"><i></i>${esc(label)}</label>`;
        const icon = { date: "calendar_month", person: "person", link: "link", money: "euro", num: "tag" }[t];
        const box = t === "long" ? `<div class="at-in at-ta">${esc(hint || "")}</div>`
          : t === "sign" ? `<div class="at-sigbox">Sign here</div>`
          : t && t.startsWith("select:") ? `<div class="at-in at-sel">Select…<i>▾</i></div><div class="at-opts sm">${t.slice(7).split("/").map((o) => `<span>${esc(o)}</span>`).join("")}</div>`
          : `<div class="at-in">${icon ? `<span class="ms">${icon}</span>` : ""}${esc(hint || "")}</div>`;
        return `<div class="at-fld"><span class="at-lbl">${esc(label)}</span>${box}</div>`;
      };
      return `<div class="at-form"><div class="at-formhead"><span class="ms">assignment</span><b>${esc(T.title)}</b></div>${T.fields.map(ctl).join("")}<div class="at-submit">Submit</div></div>`;
    }
    if (T.fmt === "message") {
      return `<div class="at-mail"><div class="at-mailbar"><span class="ms">mail</span>${esc(T.channel)}</div>
        <div class="at-mailrow"><b>To</b><span>${ph(T.to)}</span></div><div class="at-mailrow"><b>Subject</b><span>${ph(T.subject)}</span></div>
        <div class="at-mailbody">${T.body.map((l) => `<p>${ph(l)}</p>`).join("")}</div><div class="at-send">Send</div></div>`;
    }
    if (T.fmt === "canvas") return `<div class="at-board"><div class="at-boardbar"><span class="ms">dashboard</span>${esc(T.board)}</div><div class="at-boardbody">${renderStructure(T.structure)}</div></div>`;
    if (T.fmt === "pack") {
      return `<div class="at-pack"><div class="at-cover"><span class="ms">folder_open</span><b>${ph(T.title)}</b><em>${T.parts.length} sections</em></div>
        <ol class="at-toc">${T.parts.map(([p, note], i) => { const a = ALIB[p]; return `<li><span class="at-tab">${i + 1}</span>${a ? `<button class="at-link" data-artsel="${p}">${esc(a.aliases[0])}</button><em class="at-fmt">${esc(a.format)}</em>` : `<b>${esc(p)}</b><em class="at-fmt">write</em>`}<span class="at-note">${esc(note)}</span></li>`; }).join("")}</ol></div>`;
    }
    return "";
  }
  /* markdown export so the template can be taken into a real document or sheet */
  function artToMd(id) {
    const a = ALIB[id], T = a.tpl, out = [];
    const strip = (t) => String(t);
    if (T.fmt === "doc") {
      out.push(`# ${strip(T.title)}`, "", ...(T.meta || []).map((m) => `- **${m}:** `), "");
      T.sections.forEach(([h, g, ex]) => out.push(`## ${h}`, `_${g}_`, ex ? `> Example: ${ex}` : "", "", ""));
      if (T.decision) out.push("## Decision", ...T.decision.map((o) => `- [ ] ${o}`), "");
      if (T.signoff) out.push("## Sign-off", ...T.signoff.map((r) => `- ${r}: ____________  Date: ______`));
    } else if (T.fmt === "sheet") {
      out.push(`# ${T.file} — ${T.tab}`, "", `| ${T.cols.map((c) => c[0]).join(" | ")} |`, `| ${T.cols.map(() => "---").join(" | ")} |`, `| ${T.cols.map((c) => typeHint(c[1])).join(" | ")} |`, ...(T.rows || []).map((r) => `| ${T.cols.map((_, i) => r[i] || "").join(" | ")} |`), `| ${T.cols.map(() => " ").join(" | ")} |`);
      if (T.notes) out.push("", `_${T.notes}_`);
    } else if (T.fmt === "form") {
      out.push(`# ${T.title}`, "", ...T.fields.map(([l, t, h]) => (t === "check" ? `- [ ] ${l}` : `- **${l}:** ____________${h ? ` _(${h})_` : ""}${t && t.startsWith("select:") ? ` — options: ${t.slice(7).split("/").join(" / ")}` : ""}`)));
    } else if (T.fmt === "message") {
      out.push(`**To:** ${T.to}`, `**Subject:** ${T.subject}`, "", ...T.body);
    } else if (T.fmt === "canvas") {
      const st = T.structure; out.push(`# ${T.board}`, "");
      if (st.kind === "grid") st.cells.forEach(([t, p]) => out.push(`## ${t}`, `_${p}_`, ""));
      else if (st.kind === "matrix") out.push(`Axes: ${st.x} / ${st.y}`, ...st.q.map((q) => `- ${q}`));
      else if (st.kind === "table") out.push(`| ${st.cols.join(" | ")} |`, `| ${st.cols.map(() => "---").join(" | ")} |`, ...st.rows.map((r) => `| ${r.join(" | ")} |`));
      else (st.items || []).forEach((x) => out.push(`- ${Array.isArray(x) ? x.join(" — ") : x}`));
    } else if (T.fmt === "pack") {
      out.push(`# ${T.title}`, "", ...T.parts.map(([p, n], i) => `${i + 1}. **${ALIB[p] ? ALIB[p].aliases[0] : p}** — ${n}`));
    }
    return out.join("\n");
  }

  function artSheet(u, mm, sel, full) {
    const E = ALIB[sel.id] || {}, col = "#0d1117";
    const ROLE = { produces: ["Produced", "upload", "var(--teal)"], uses: ["Used", "download", "#0284c7"], evidence: ["Kept as evidence", "inventory", "#c49000"] };
    const hits = mm.nodes.map((n, i) => ({ n, i, a: nodeArts(u, n).filter((x) => x.id === sel.id) })).filter((h) => h.a.length);
    const label = (n) => esc((n.num ? n.num + " " : "") + (n.io ? n.label.toUpperCase() : n.label));
    const block = (title, icon, body, cls = "") => `<section class="ksec ${cls}"><h4><span class="ms">${icon}</span>${title}</h4>${body}</section>`;
    const ul = (v, c = "") => `<ul class="vl ${c}">${arr(v).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    const roleTag = (r) => `<span class="ar-role" style="--rc:${ROLE[r][2]}"><span class="ms">${ROLE[r][1]}</span>${ROLE[r][0]}</span>`;
    const flowStrip = `<div class="kn-flow" style="--kc:#0d1117">${hits.length ? hits.map(({ n, a }, j) => `${j ? '<span class="ms">arrow_forward</span>' : ""}<span>${label(n)} · ${a.map((x) => ROLE[x.role][0].toLowerCase()).join(" / ")}</span>`).join("") : '<span class="nd">Not on this map</span>'}</div>`;
    const stepWhere = (n) => (n.unit?.kind === "step" ? `${esc(n.unit.actor)} produces it in “${esc(n.unit.title)}”.` : n.io === "entry" ? "Needed before work starts." : n.io === "gate" ? `Checked at the gate (${esc(u.gate || "exit")}).` : esc(C(n.unit, "definition").purpose || n.unit?.summary || ""));
    const onMap = block("Where it flows on this map", "account_tree", hits.length ? `<ol class="kn-where">${hits.map(({ n, a }) => `<li><b>${label(n)} ${a.map((x) => roleTag(x.role)).join("")}</b>${stepWhere(n)}${a[0].name !== artName(sel.id) ? ` <em>Named here as “${esc(a[0].name)}”</em>` : ""}</li>`).join("")}</ol>` : '<span class="nd">Not on this map</span>');
    const idx = ART_INDEX[sel.id] || [];
    const linkU = (x) => { const tgt = x.u; const pg = pageOf(tgt); const nm = `${tgt.level === 0 ? "Act " + ROMAN[tgt.si] : tgt.num} ${tgt.short}${x.step ? " · " + x.step.num + " " + x.step.title : ""}`; return pg ? `<a href="#/${pg}">${esc(nm)}</a>` : esc(nm); };
    const chainA = ((STAGES[u.si] || {}).traceChain || []), ci = chainA.findIndex((x) => x[2] === sel.id);
    const traceB = ci >= 0 ? block("Trace ID", "link", `<p>Every ${esc(artName(sel.id))} carries an ID <b class="tid">${chainA[ci][0]}-###</b>${ci > 0 ? ` and links back to <b class="tid">${chainA[ci - 1][0]}-###</b>` : ""}.</p><div class="tchain sm">${chainA.map(([pre, nm, aid], j) => `<button class="tc ${j === ci ? "on" : ""}" data-artsel="${aid}"><b>${pre}</b>${esc(nm)}</button>`).join('<span class="ms">arrow_forward</span>')}</div>`) : "";
    const imp = impactOf(sel.id);
    const impactB = block("If this changes, re-check", "crisis_alert", imp.length ? `<ol class="kn-where">${imp.map((x) => `<li><b>${(() => { const pg = pageOf(x.u); const nm = `${x.u.level === 0 ? "Act " + ROMAN[x.u.si] : x.u.num} ${x.u.short}`; return pg ? `<a href="#/${pg}">${esc(nm)}</a>` : esc(nm); })()} <span class="ar-role" style="--rc:${x.depth ? "#c49000" : "#e91e63"}">${x.depth ? "downstream" : "uses it"}</span></b>${x.depth ? `via ${esc(artName(x.via))}` : "Consumes this artifact directly."}</li>`).join("")}</ol>` : (() => {
      const L = ART_INDEX[sel.id] || [], leaves = L.some((x) => x.role === "produces" && x.u.level === 0), st = L.find((x) => x.step);
      const notes = [];
      if (leaves) notes.push(`It leaves the act — tell the receiving act (${esc(C(STAGES[u.si], "continuity").handoff || "next act")}) and re-check its intake.`);
      if (st) { const later = st.u.steps.slice(st.u.steps.indexOf(st.step) + 1); if (later.length) notes.push(`Within ${esc(st.u.short)}: re-run ${later.map((x) => esc(x.num + " " + x.title)).join(", ")}.`); }
      return notes.length ? `<ul class="vl">${notes.map((n) => `<li>${n}</li>`).join("")}</ul>` : '<span class="nd">No authored unit consumes it yet</span>';
    })());
    const lineage = block("Lineage across the act", "conversion_path", ["produces", "uses", "evidence"].map((r) => { const l = idx.filter((x) => x.role === r); return l.length ? `<div class="ar-lin">${roleTag(r)}<div>${[...new Map(l.map((x) => [x.u.fid + (x.step ? x.step.id : ""), x])).values()].map(linkU).join(" · ")}</div></div>` : ""; }).join("") + (E.external ? `<p class="ksrc">Arrives from outside this act — not produced inside DISCOVER.</p>` : ""));
    const what = block("What it is", "description", `<p>${esc(E.what || "")}</p>`);
    const why = block("Why it exists", "flag", `<p>${esc(E.purpose || "")}</p><p class="ksrc">Owner: ${esc(E.owner || "")} · Used by: ${arr(E.users).map(esc).join(", ")}</p>`);
    const tpl = block(`Template · ${esc(E.format || "")}`, "edit_document", `<div class="at-tools"><button class="tool" data-act="art-copy" data-id="${sel.id}"><span class="ms">content_copy</span>Copy as Markdown</button><span class="at-copied" hidden>Copied</span></div><div class="ks-wrap at-wrap ${full ? "big" : ""}">${renderArtifact(E.tpl)}</div>`, "tpl");
    const good = block("Good when", "verified", ul(E.good, "ck"));
    const aka = E.aliases && E.aliases.length > 1 ? `<span class="ks-var">Also called: ${E.aliases.slice(1).map(esc).join(" · ")}</span>` : "";
    const top = `<div class="ks-head" style="--kc:${col}"><span class="ks-type"><i></i>${esc(E.type === E.format ? E.type : (E.type || "Artifact") + " · " + (E.format || ""))}</span><h3>${esc(artName(sel.id))}</h3>${E.external ? '<span class="ks-var">External input</span>' : ""}${aka}
      <div class="ks-acts">${full ? `<button class="tool" data-act="sheet-close"><span class="ms">close</span>Close sheet</button>` : `<button class="tool dark" data-act="sheet"><span class="ms">open_in_full</span>Open full sheet</button>`}</div></div>`;
    if (!full) return `<div class="ks panel" style="--kc:${col}">${top}${flowStrip}${what}${why}${traceB}${tpl}${good}${onMap}${lineage}${impactB}</div>`;
    return `<div class="ks full" style="--kc:${col}">${top}${flowStrip}<div class="ks-cols"><div class="ks-main">${tpl}${good}</div><div class="ks-side">${what}${why}${traceB}${onMap}${lineage}${impactB}</div></div></div>`;
  }

  /* ---- role sheet ---- */
  function roleSheet(u, mm, sel, full) {
    const R = RLIB[sel.id] || {}, col = "#0d1117";
    const hits = mm.nodes.map((n, i) => ({ n, i })).filter(({ n }) => nodeRoles(u, n).includes(sel.id));
    const label = (n) => esc((n.num ? n.num + " " : "") + (n.io ? n.label.toUpperCase() : n.label));
    const block = (t, ic, b) => `<section class="ksec"><h4><span class="ms">${ic}</span>${t}</h4>${b}</section>`;
    const ul = (v) => (arr(v).length ? `<ul class="vl">${arr(v).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : '<span class="nd">—</span>');
    const idx = ROLE_INDEX[sel.id] || [];
    const linkU = (x) => { const pg = pageOf(x.u); const nm = `${x.u.level === 0 ? "Act " + ROMAN[x.u.si] : x.u.num} ${x.u.short}${x.step ? " · " + x.step.num + " " + x.step.title : ""}`; return pg ? `<a href="#/${pg}">${esc(nm)}</a>` : esc(nm); };
    const raci = ["A", "R", "C", "I"].map((L) => { const l = idx.filter((x) => x.kind === "raci" && x.raci === L); return l.length ? `<div class="ar-lin"><span class="ar-role" style="--rc:#0d1117">${L} — ${({ A: "Accountable", R: "Responsible", C: "Consulted", I: "Informed" })[L]}</span><div>${l.map(linkU).join(" · ")}</div></div>` : ""; }).join("");
    const stepsDone = idx.filter((x) => x.kind === "step");
    const owned = Object.entries(ALIB).filter(([, a]) => roleIdsOf(a.owner || "").includes(sel.id));
    const top = `<div class="ks-head" style="--kc:${col}"><span class="ks-type"><i></i>${esc(R.group || "Role")} role</span><h3>${esc(R.n || sel.id)}</h3>
      <div class="ks-acts">${full ? `<button class="tool" data-act="sheet-close"><span class="ms">close</span>Close sheet</button>` : `<button class="tool dark" data-act="sheet"><span class="ms">open_in_full</span>Open full sheet</button>`}</div></div>`;
    const strip = `<div class="kn-flow" style="--kc:${col}">${hits.length ? hits.map(({ n }, j) => `${j ? '<span class="ms">arrow_forward</span>' : ""}<span>${label(n)}</span>`).join("") : '<span class="nd">Not on this map</span>'}</div>`;
    const body = [block("What this role is", "badge", `<p>${esc(R.what || "")}</p>`), block("Responsibilities", "task_alt", ul(R.resp)), block("Decides", "how_to_vote", ul(R.decides)), block("Skills", "psychology", ul(R.skills)),
      block("Accountabilities across the act", "groups", raci || '<span class="nd">No RACI entries</span>'),
      block(`Steps performed · ${stepsDone.length}`, "play_arrow", stepsDone.length ? `<ol class="kn-where">${stepsDone.map((x) => `<li><b>${esc(x.u.short)} · ${esc(x.step.num)}</b>${esc(x.step.title)}</li>`).join("")}</ol>` : '<span class="nd">—</span>'),
      block(`Artifacts owned · ${owned.length}`, "description", owned.length ? `<div class="chips">${owned.map(([id, a]) => `<button class="chip doc art-chip" data-artsel="${id}">${esc(a.aliases[0])}</button>`).join("")}</div>` : '<span class="nd">—</span>')];
    return full ? `<div class="ks full">${top}${strip}<div class="ks-cols"><div class="ks-main">${body.slice(4).join("")}</div><div class="ks-side">${body.slice(0, 4).join("")}</div></div></div>` : `<div class="ks panel">${top}${strip}${body.join("")}</div>`;
  }

  /* ---- continuous tracks ---- */
  const trackCell = (cur, n, t) => {
    const k = n.unit;
    if (t === "gov") return n.io === "gate" ? (cur.gate || "Gate") : k && k.kind !== "step" ? (k.gate || "") : k && k.decision ? "decision" : "";
    if (t === "sec") { const l = nodeLens(cur, n).filter((x) => x.id === "sec" || x.id === "priv").map((x) => lensById[x.id].n.split(" ")[0]); return l.join(" · "); }
    if (t === "qual") { const ev = nodeArts(cur, n).filter((x) => x.role === "evidence").length, ch = k ? arr(C(k, "controls").checks).length : n.io === "gate" ? arr(C(cur, "controls").checks).length : 0; return ev || ch ? `${ev} evidence · ${ch} checks` : ""; }
    if (t === "trace") { const tr = k ? arr(C(k, "continuity").traceability)[0] : n.io === "gate" ? arr(C(cur, "continuity").traceability)[0] : ""; const m = String(tr || "").match(/\b[A-Z]{1,4}-#+/g); return m ? [...new Set(m)].join(" ") : tr ? "linked" : ""; }
    return "";
  };
  function trackPanel(u, mm, sel) {
    const T = M.tracks.find((x) => x.id === sel.id);
    const rows = mm.nodes.map((n) => ({ n, v: trackCell(u, n, sel.id) })).filter((x) => x.v);
    const detail = { gov: [kv("Authority", txt(C(u, "execution").authority), "gavel"), kv("Gates", list(C(u, "controls").gates), "verified_user"), kv("Escalation", txt(routeOf(u, "escalate")), "north")],
      sec: [kv("Security & privacy lenses", txt(lensOfUnit(u).filter((x) => ["sec", "priv"].includes(x.id)).map((x) => lensById[x.id].n + (x.req ? " (required)" : "")).join(", ") || "Not engaged at this level"), "shield"), kv("Policies", list(C(u, "controls").policies), "policy")],
      qual: [kv("Criteria", list(C(u, "controls").criteria, "ck"), "rule"), kv("Checks", list(C(u, "controls").checks), "fact_check"), kv("Evidence", chipsOf(C(u, "artifacts").evidence, "ev"), "inventory")],
      trace: [kv("Traceability", list(C(u, "continuity").traceability), "link"), kv("Learning", list(C(u, "continuity").learning), "school"), kv("Measures", list(C(u, "continuity").measures), "monitoring")] }[sel.id];
    return `<div class="dt-head"><span class="lbl">Continuous track</span><h3>${esc(T.name)}</h3></div><div class="dt-grid">${detail.join("")}${kv("On this map", rows.length ? `<ol class="kn-where">${rows.map(({ n, v }) => `<li><b>${esc((n.num ? n.num + " " : "") + (n.io ? n.label.toUpperCase() : n.label))}</b>${esc(v)}</li>`).join("")}</ol>` : '<span class="nd">—</span>', T.icon)}</div>`;
  }

  /* ---- guided walkthrough ---- */
  function walkPanel(u, sel) {
    const st = STAGES[u.si] || {}, W = st.walkthrough || [], w = W[sel.i]; if (!w) return "";
    const tgt = UNITS[w.at];
    const pg = tgt ? pageOf(tgt) : null;
    return `<div class="dt-head"><span class="lbl">Walkthrough · ${sel.i + 1} / ${W.length}</span><h3>${esc(w.title)}</h3></div>
      <div class="walk-bar"><i style="width:${((sel.i + 1) / W.length) * 100}%"></i></div>
      ${tgt ? `<p class="ksrc">At ${esc(tgt.level === 0 ? "Act " + ROMAN[tgt.si] + " " + tgt.key : tgt.num + " " + tgt.title)}</p>` : ""}
      <p class="walk-text">${esc(w.text)}</p>
      ${(w.arts || []).length ? kv("Artifacts at this point", `<div class="chips">${w.arts.map((id) => `<button class="chip doc art-chip" data-artsel="${id}">${esc(ALIB[id].aliases[0])}</button>`).join("")}</div>`, "description") : ""}
      <div class="dt-actions"><button class="tool" data-walk="-1" ${sel.i ? "" : "disabled"}><span class="ms">arrow_back</span>Back</button><button class="tool dark" data-walk="1" ${sel.i < W.length - 1 ? "" : "disabled"}>Next<span class="ms">arrow_forward</span></button>${pg ? `<a class="tool" href="#/${pg}"><span class="ms">menu_book</span>Open this unit</a>` : ""}<button class="tool" data-walk="x"><span class="ms">close</span>End walkthrough</button></div>`;
  }

  /* ---- tailoring ---- */
  const tailorOf = (u, prof) => { const T = (STAGES[u.si] || {}).tailoring; if (!T || !T[prof] || u === ROOT) return null; const P = T[prof]; return { skip: P.skip.includes(u.fid), condense: P.condense[u.fid], add: P.add[u.fid] }; };
  const tailorNote = (u, prof) => { const t = tailorOf(u, prof); return !t ? "" : t.skip ? "Skipped in this profile" : t.condense || t.add || ""; };
  /* walkthrough: is node n on the path to the step's target? */
  const walkHit = (st, i, n) => { const w = (st.walkthrough || [])[i]; return !!(w && n.unit && (w.at === n.unit.fid || w.at.startsWith(n.unit.fid + "."))); };

  /* ================= delivery system (dual-track · backlogs · cadences) ================= */
  const SYS_TRACK = Object.fromEntries((SYS.tracks || []).map((t) => [t.id, t]));
  const trackOfAct = (id) => (SYS.tracks || []).find((t) => t.acts.includes(id));
  const SYS_ITEMS = {};
  (SYS.backlogs || []).forEach((b) => (SYS_ITEMS[b.id] = { kind: "bl", name: b.name, o: b }));
  (SYS.side || []).forEach((b) => (SYS_ITEMS[b.id] = { kind: "side", name: b.name, o: b }));
  (SYS.gates || []).forEach((g) => (SYS_ITEMS[g.id] = { kind: "gate", name: g.name, o: g }));
  STAGES.forEach((s) => (SYS_ITEMS[s.id] = { kind: "act", name: s.key, o: s }));
  const sysName = (id) => (SYS_ITEMS[id] ? SYS_ITEMS[id].name : SYS_TRACK[id] ? SYS_TRACK[id].name : id);
  const SYS_FC = { forward: "#008080", alternate: "#0284c7", rework: "#ff5722", feedback: "#c49000" };
  const SYS_FL = { forward: "Forward", alternate: "Alternate", rework: "Rework", feedback: "Feedback" };
  const CAD_KN = { quarterly: ["WSJF", "Multi-level backlog"], roadmap: ["Multi-level backlog"], touchpoint: ["Continuous discovery", "Opportunity solution tree"], refinement: ["Backlog refinement", "Definition of Ready", "INVEST"], planning: ["Scrum"], daily: ["Scrum", "Kanban"], review: ["Scrum"], retro: ["Retrospective", "Scrum"], opsreview: ["Kanban"] };
  const knChipsOf = (names) => `<div class="chips">${names.filter((n) => KLIB[n]).map((n) => { const t = Object.keys(KN_SING).find((k) => KN_SING[k] === KLIB[n].type); return `<button class="chip kn-chip" style="--kc:${KN_COLOR(t)}" data-knsel="${t}|${esc(n)}">${esc(n)}</button>`; }).join("")}</div>`;
  const flowRow = (i) => { const f = SYS.flows[i]; return `<button class="sflow" style="--c:${SYS_FC[f.ty]}" data-sys="flow:${i}"><i></i><b>${esc(sysName(f.f))} → ${esc(sysName(f.t))}</b><span>${esc(f.n)}</span></button>`; };
  const flowsOf = (id) => SYS.flows.map((f, i) => ({ f, i })).filter(({ f }) => f.f === id || f.t === id);
  const flowsBlock = (id) => { const l = flowsOf(id); return l.length ? kv(`Flows in and out · ${l.length}`, `<div class="sflows">${l.map(({ i }) => flowRow(i)).join("")}</div>`, "swap_calls") : ""; };
  const artChip = (id) => (id && ALIB[id] ? `<div class="chips"><button class="chip doc art-chip" data-artsel="${id}">${esc(ALIB[id].aliases[0])}</button></div>` : '<span class="nd">—</span>');

  /* how an act or its feature mode sits in the delivery system */
  function actSysBlock(u) {
    const act = u.level === 0 ? u : u.parent, T = trackOfAct(act.id); if (!T) return "";
    const modes = (SYS.modes || []).filter((m) => m.act === act.id);
    const cads = (SYS.cadences || []).filter((c) => c.at === T.id || (T.id === "discovery" && ["refinement", "quarterly"].includes(c.id)));
    return `<div class="dt-sub lbl"><span class="ms">all_inclusive</span>In the delivery system</div><div class="dt-grid">
      ${kv("Track", `<p><b style="color:${T.c}">${esc(T.name)}</b> — ${esc(T.q)}</p><p class="ksrc">${esc(T.what)}</p>`, T.icon)}
      ${modes.length ? kv("Runs in two modes", `<div class="modes">${modes.map((m) => `<div class="mode ${(u.mode || "initiative") === m.id ? "on" : ""}"><b><span class="ms">${m.icon}</span>${esc(m.name)}</b><span>${esc(m.when)}</span><em>${esc(m.runs)} → ${esc(m.feeds)}</em>${(u.mode || "initiative") === m.id ? "" : `<button class="tool" data-go="${m.unit || act.fid}"><span class="ms">swap_horiz</span>Switch to ${esc(m.name.toLowerCase())}</button>`}</div>`).join("")}</div>`, "alt_route") : ""}
      ${kv("Feeds and is fed by", `<div class="sflows">${flowsOf(act.id).map(({ i }) => flowRow(i)).join("")}</div>`, "swap_calls")}
      ${kv("Cadences", `<div class="chips">${cads.map((c) => `<span class="chip">${esc(c.name)} · ${esc(c.every.toLowerCase())}</span>`).join("")}</div>`, "event_repeat")}
    </div>`;
  }

  /* the details panel for the system and timeline views */
  function sysDetail(sel) {
    const hd = (lbl, h, extra = "") => `<div class="dt-head"><span class="lbl">${lbl}</span><h3>${h}</h3>${extra}</div>`;
    const t = sel && sel.k === "sys" ? sel.t.split(":") : null;
    if (!t) {
      return `${hd("Overview · Delivery system", "How the acts run together")}
        <p class="dt-hint"><span class="ms">touch_app</span><span>Click a track, an act, a backlog, Ready / Done, a flow or a cadence. Switch to <b>Sprint timeline</b> to see the tracks run in parallel, or <b>Logical order</b> for the acts as a dependency chain.</span></p>
        <div class="dt-grid">${kv("The idea", `<p>${esc(SYS.summary)}</p><p class="ksrc">${esc(SYS.orderNote)}</p>`, "lightbulb")}
        ${kv("Tracks", `<div class="sflows">${SYS.tracks.map((x) => `<button class="sflow" style="--c:${x.c}" data-sys="track:${x.id}"><i></i><b>${esc(x.name)}</b><span>${esc(x.q)}</span></button>`).join("")}</div>`, "view_stream")}
        ${kv("Backlog levels", `<table class="sys-tbl"><tr><th>Level</th><th>Holds</th><th>Owner</th><th>Horizon</th></tr>${SYS.backlogs.map((b) => `<tr data-sys="bl:${b.id}"><td><b>${esc(b.name)}</b></td><td>${esc(b.holds)}</td><td>${esc(b.owner.join(", "))}</td><td>${esc(b.horizon)}</td></tr>`).join("")}</table>`, "stacks")}
        ${kv("Ready and Done", `<div class="sflows">${SYS.gates.map((g) => `<button class="sflow" style="--c:#0d1117" data-sys="gate:${g.id}"><i></i><b>${esc(g.name)}</b><span>${esc(g.between)}</span></button>`).join("")}</div>`, "rule")}
        ${kv("Cadences", `<div class="chips">${SYS.cadences.map((c) => `<button class="chip lpc" style="--c:#6d48d8" data-sys="cad:${c.id}">${esc(c.name)} · ${esc(c.every.toLowerCase())}</button>`).join("")}</div>`, "event_repeat")}
        ${kv("DISCOVER runs in two modes", `<div class="modes">${SYS.modes.map((m) => `<div class="mode"><b><span class="ms">${m.icon}</span>${esc(m.name)}</b><span>${esc(m.when)}</span><em>→ ${esc(m.feeds)}</em></div>`).join("")}</div>`, "alt_route")}
        ${kv("Knowledge behind it", knChipsOf(["Dual-track agile", "Multi-level backlog", "Scrum", "Kanban", "Continuous discovery", "Definition of Ready", "Definition of Done", "Continuous integration & delivery", "WSJF", "Stage-gate"]), "menu_book")}</div>`;
    }
    const [k, id, c2] = t;
    if (k === "levels") {
      return `${hd("Backlogs", "Three levels, linked parent to child")}<div class="dt-grid">${kv("Levels", `<div class="sflows">${SYS.backlogs.map((b) => `<button class="sflow" style="--c:#0d1117" data-sys="bl:${b.id}"><i></i><b>${esc(b.level)} · ${esc(b.name)}</b><span>${esc(b.holds)} — ${esc(b.owner.join(", "))}, ${esc(b.horizon)}</span></button>`).join("")}</div>`, "stacks")}
        ${kv("Side backlogs", `<div class="sflows">${SYS.side.map((b) => `<button class="sflow" style="--c:${SYS_TRACK[b.track].c}" data-sys="side:${b.id}"><i></i><b>${esc(b.name)}</b><span>${esc(b.holds)}</span></button>`).join("")}</div>`, "inventory_2")}
        ${kv("Ready and Done", `<div class="sflows">${SYS.gates.map((g) => `<button class="sflow" style="--c:#0d1117" data-sys="gate:${g.id}"><i></i><b>${esc(g.name)}</b><span>${esc(g.between)}</span></button>`).join("")}</div>`, "rule")}
        ${kv("Knowledge", knChipsOf(["Multi-level backlog", "Backlog refinement", "WSJF", "User stories", "INVEST"]), "menu_book")}</div>`;
    }
    if (k === "track") {
      const T = SYS_TRACK[id];
      return `${hd("Track", esc(T.name))}<div class="dt-grid">${kv("Question it answers", `<p class="jt">${esc(T.q)}</p>`, "help")}${kv("What happens", txt(T.what), "info")}
        ${kv("Acts in this track", `<div class="chips">${T.acts.map((a) => `<button class="chip lpc" style="--c:${T.c}" data-sys="act:${a}">${esc(sysName(a))}</button>`).join("")}</div>`, "account_tree")}
        ${kv("Owner", roleChips(T.owner), "groups")}${kv("Cadence", txt(T.cadence), "event_repeat")}${kv("Produces", txt(T.produces), "output")}
        ${kv("Measures", list(T.measures), "monitoring")}${kv("Watch out for", list(T.pitfalls), "warning")}</div>`;
    }
    if (k === "bl") {
      const B = SYS.backlogs.find((x) => x.id === id), cad = SYS.cadences.find((c) => c.id === B.cadence);
      return `${hd(`Backlog · ${B.level}`, esc(B.name))}<div class="dt-grid">${kv("Holds", txt(B.holds), "inventory_2")}${kv("Item · trace ID", `<p>${esc(B.item)} · <b class="tid">${esc(B.prefix)}</b></p>`, "tag")}
        ${kv("Owner", roleChips(B.owner), "person")}${kv("Horizon", txt(B.horizon), "date_range")}
        ${cad ? kv("Cadence", `<div class="chips"><button class="chip lpc" style="--c:#6d48d8" data-sys="cad:${cad.id}">${esc(cad.name)} · ${esc(cad.every.toLowerCase())}</button></div>`, "event_repeat") : ""}
        ${kv("Enters when", list(B.entry, "ck"), "login")}${kv("Leaves when", list(B.exit, "ck"), "logout")}${kv("Refinement", txt(B.refine), "tune")}${kv("Work-in-progress rule", txt(B.wip), "speed")}
        ${kv("Artifact", artChip(B.art), "description")}${flowsBlock(B.id)}</div>`;
    }
    if (k === "side") {
      const B = SYS.side.find((x) => x.id === id), T = SYS_TRACK[B.track];
      return `${hd(`Side backlog · ${T.name}`, esc(B.name))}<div class="dt-grid">${kv("Holds", txt(B.holds), "inventory_2")}${kv("Owner", roleChips(B.owner), "person")}${kv("Feeds", txt(B.feeds), "output")}${kv("Artifact", artChip(B.art), "description")}${flowsBlock(B.id)}</div>`;
    }
    if (k === "gate") {
      const G = SYS.gates.find((x) => x.id === id);
      return `${hd(`Readiness · ${G.between}`, esc(G.name))}<div class="dt-grid">${kv("Owner", roleChips(G.owner), "person")}${kv("Criteria", list(G.criteria, "ck"), "rule")}${kv("If it fails", txt(G.fail), "undo")}${kv("Artifact", artChip(G.art), "description")}
        ${kv("Knowledge", knChipsOf([G.name, "INVEST", "Scrum"]), "menu_book")}${flowsBlock(G.id)}</div>`;
    }
    if (k === "cad") {
      const Cd = SYS.cadences.find((x) => x.id === id);
      return `${hd(`Cadence · every ${Cd.every.toLowerCase()}`, esc(Cd.name))}<div class="dt-grid">${kv("Where", `<div class="chips"><button class="chip lpc" style="--c:#6d48d8" data-sys="${SYS_TRACK[Cd.at] ? "track" : "bl"}:${Cd.at}">${esc(sysName(Cd.at))}</button></div>`, "place")}
        ${kv("Who", roleChips(Cd.who), "groups")}${kv("Takes in", list(Cd.in), "input")}${kv("Produces", list(Cd.out), "output")}${kv("Knowledge", knChipsOf(CAD_KN[Cd.id] || []), "menu_book")}</div>`;
    }
    if (k === "flow") {
      const f = SYS.flows[+id];
      return `${hd(`${SYS_FL[f.ty]} flow`, `${esc(sysName(f.f))} → ${esc(sysName(f.t))}`)}<div class="dt-grid">${kv("What moves", `<p><b>${esc(f.n)}</b></p><p>${esc(f.what)}</p>`, "swap_calls")}
        ${f.art ? kv("Carried by", artChip(f.art), "description") : ""}
        ${kv("From", `<div class="chips"><button class="chip lpc" style="--c:${SYS_FC[f.ty]}" data-sys="${SYS_ITEMS[f.f].kind}:${f.f}">${esc(sysName(f.f))}</button></div>`, "logout")}${kv("To", `<div class="chips"><button class="chip lpc" style="--c:${SYS_FC[f.ty]}" data-sys="${SYS_ITEMS[f.t].kind}:${f.t}">${esc(sysName(f.t))}</button></div>`, "login")}</div>`;
    }
    if (k === "act") {
      const s = STAGES.find((x) => x.id === id), T = trackOfAct(id), modes = (SYS.modes || []).filter((m) => m.act === id);
      return `${hd(`Act ${ROMAN[s.si]} · ${T ? T.name : ""}`, esc(title(s.key)), statusBadge(s.status))}<div class="dt-grid">${kv("Purpose", txt(s.purpose), "flag")}
        ${modes.length ? kv("Modes", `<div class="modes">${modes.map((m) => `<div class="mode"><b><span class="ms">${m.icon}</span>${esc(m.name)}</b><span>${esc(m.when)}</span><em>→ ${esc(m.feeds)}</em>${m.unit ? `<button class="tool" data-go="${m.unit}"><span class="ms">open_in_new</span>Open feature mode</button>` : ""}</div>`).join("")}</div>`, "alt_route") : ""}
        ${flowsBlock(id)}</div>
        <div class="dt-actions"><button class="tool dark" data-go="${s.fid}"><span class="ms">zoom_in</span>Open its map</button><a class="tool" href="#/act-${s.id}"><span class="ms">menu_book</span>Open chapter</a></div>`;
    }
    if (k === "cell") {
      const r = SYS.timeline.rows[+id], T = SYS_TRACK[r.track], col = SYS.timeline.cols[+c2];
      const into = SYS.timeline.links.filter((l) => l[1] === r.track), out = SYS.timeline.links.filter((l) => l[0] === r.track);
      return `${hd(`${col} · ${T.name}`, esc(r.cells[+c2]))}<div class="dt-grid">${kv("Track", `<p><b style="color:${T.c}">${esc(T.name)}</b> — ${esc(T.q)}</p>`, T.icon)}
        ${kv("Takes in", list(into.map((l) => `${l[2]} from ${SYS_TRACK[l[0]].name}${+c2 ? " (" + SYS.timeline.cols[+c2 - 1] + ")" : ""}`)), "input")}
        ${kv("Passes on", list(out.map((l) => `${l[2]} to ${SYS_TRACK[l[1]].name}${+c2 < SYS.timeline.cols.length - 1 ? " (" + SYS.timeline.cols[+c2 + 1] + ")" : ""}`)), "output")}
        ${kv("Why the offset", txt(SYS.timeline.note), "info")}</div>`;
    }
    return "";
  }

  /* ================= prompts — people using agents, at every level =================
     Every unit gets a copy-paste prompt generated from its contract, so the prompt always
     matches the unit: who uses it, when, what to attach, what to do, the knowledge and
     lenses to apply, rules, routes, the output template, checks, and what comes next.
     The person in the role drives; the agent drafts, analyses and checks; people decide. */
  const SCALES = SYS.scales || [], AW = SYS.agentWork || {};
  const scaleOf = () => { const s = store.get("node-scale", "team"); return SCALES.find((x) => x.id === s) ? s : "team"; };
  const PLEVEL = { stage: "Act", process: "Process", subprocess: "Subprocess", workflow: "Workflow", step: "Step" };
  const dot = (s) => (s && !/[.!?]$/.test(s) ? s + "." : s || "");
  const kLabel = (n) => n.replace(/ — (.+)$/, " ($1)");
  const structText = (st) => {
    if (!st) return "";
    const p = (x) => (Array.isArray(x) ? x : [x, ""]);
    if (["levels", "steps", "cycle", "chain"].includes(st.kind)) return st.items.map((x) => { const [a, b] = p(x); return b ? `${a} (${b})` : a; }).join(" → ") + (st.kind === "cycle" ? " → repeat" : "");
    if (st.kind === "grid") return "sections: " + st.cells.map((c) => c[0]).join(", ");
    if (st.kind === "matrix") return `a 2×2 matrix (${st.x} × ${st.y}): ${st.q.join(" / ")}`;
    if (st.kind === "table") return "columns: " + st.cols.join(" | ");
    if (st.kind === "fields") return "fields: " + st.items.map((x) => p(x)[0]).join(", ");
    return "";
  };
  /* the output format, taken from the artifact's own template */
  const tplOutline = (name) => {
    const id = artId(name), a = id && ALIB[id];
    if (!a) return `- ${name}`;
    const T = a.tpl, nm = a.aliases[0];
    if (T.fmt === "doc") return `- ${nm} — a document with these sections:\n${T.sections.map(([h, g]) => `    - ${h}: ${g}`).join("\n")}${T.decision ? `\n    - Decision: ${T.decision.join(" / ")}` : ""}`;
    if (T.fmt === "sheet") return `- ${nm} — a table with columns: ${T.cols.map((c) => c[0]).join(" | ")}${T.rows?.length ? `\n    (example row: ${T.cols.map((_, i) => T.rows[0][i]).filter(Boolean).join(" | ")})` : ""}`;
    if (T.fmt === "form") return `- ${nm} — fill these fields: ${T.fields.map(([l, t]) => (t.startsWith("select:") ? `${l} (${t.slice(7).split("/").join(" / ")})` : l)).join("; ")}`;
    if (T.fmt === "message") return `- ${nm} — a message to ${T.to}: a subject line and a short body`;
    if (T.fmt === "canvas") return `- ${nm} — ${structText(T.structure)}`;
    if (T.fmt === "pack") return `- ${nm} — a pack with: ${T.parts.map(([x]) => (ALIB[x] ? ALIB[x].aliases[0] : x)).join(", ")}`;
    return `- ${nm}`;
  };
  const knowLine = (n, deep) => { const e = kEntry(n); if (!e) return `- ${kLabel(n)}`; const first = String(e.what).split(/(?<=\.)\s/)[0]; return `- ${kLabel(n)} — ${first}${deep && e.how?.length ? `\n    How: ${e.how.slice(0, 5).join(" → ")}` : ""}`; };
  const lensLine = (x) => { const { id, note } = parseLens(x); return `- ${lensById[id] ? lensById[id].n : id}: ${note}`; };
  const roleOfUnit = (u) => (u.kind === "step" ? u.actor : u.wf ? arr(u.wf.actors)[0] : ownerOf(u)) || "person responsible";
  /* "I'm the product manager" / "We're the product trio" */
  const whoAmI = (role) => { const r = String(role).replace(/^([A-Z])(?=[a-z])/, (c) => c.toLowerCase()); const we = /trio|team|board|stakeholders|reviewers|engineers/i.test(r); return { me: we ? `We're the ${r}` : `I'm the ${r}`, i: we ? "We make" : "I make" }; };
  const stepKey = (u) => u.fid.slice(STAGES[u.si].fid.length + 1);
  /* what an agent needs to be able to do for this unit */
  const needsOf = (u) => {
    const txt = [u.title, ...(u.kind === "step" ? arr((u.parent.wf.uses || {})[u.id]) : knowOf(u).map((x) => x.name))].join(" ").toLowerCase();
    const n = ["Chat assistant"];
    if (/market|competitor|landscape|technology scan|existing solution|size|benchmark|desk research|vendor/.test(txt)) n.push("Web search — ask it to cite sources");
    if (/synthes|notes|transcri|analy|cluster|inventory|interview|session|evidence|pack/.test(txt)) n.push("File access — attach notes and documents");
    if (/spike|prototype|code|repo|build|test/.test(txt) && !/test the riskiest|assumption test|testable/.test(txt)) n.push("Coding agent — for spikes and prototypes");
    return n;
  };
  /* routes and the unit's next step */
  const routeLines = (u) => [["rework", "Evidence is weak or work fails a check"], ["alternate", "A different valid path appears"], ["escalate", "It goes beyond my authority"], ["stop", "It should stop"]].map(([k, when]) => (routeOf(u, k) ? `- ${when} → ${routeOf(u, k)}` : "")).filter(Boolean);
  const nextOf = (u) => {
    if (u.kind === "step") { const st = u.parent.steps, i = st.indexOf(u); return i < st.length - 1 ? `Step ${st[i + 1].num} — ${st[i + 1].title}` : u.parent.wf.handoff; }
    return C(u, "continuity").handoff || routeOf(u, "forward");
  };
  const GROUND = ["Don't invent facts, figures, quotes or sources — mark anything unverified as an assumption.", "If something you need is missing, ask me instead of guessing.", "Keep personal or confidential data out unless I've provided it for this purpose.", "Prepare decisions; don't make them — I decide."];

  /* builds the prompt card for any unit */
  function promptOf(u) {
    const kind = u.kind, lvl = PLEVEL[kind], act = STAGES[u.si], wfU = kind === "step" ? u.parent : u.wf ? u : null, W = wfU ? wfU.wf : null;
    const D = C(u, "definition"), CT = C(u, "controls"), LN = C(u, "lenses"), FL = C(u, "flow"), CS = C(u, "cases");
    const role = roleOfUnit(u), label = kind === "stage" ? `Act ${ROMAN[u.si]} ${act.key}` : `${lvl} ${u.num} · ${u.title}`;
    const ask = kind === "step" ? (act.promptAsk || {})[stepKey(u)] : null, askOut = kind === "step" ? (act.promptOut || {})[stepKey(u)] : null;
    const goal = dot(W ? W.definition : D.purpose || u.purpose || u.summary);
    // context to attach
    let attach = kind === "step" ? [...arr(W.inputs), ...u.parent.steps.slice(0, u.parent.steps.indexOf(u)).map((s) => s.out).filter(Boolean)] : W ? arr(W.inputs) : arr(C(u, "artifacts").inputs);
    attach = [...new Set(attach)];
    const when = kind === "step" ? (u.parent.steps.indexOf(u) === 0 ? arr(W.preconditions) : [`Step ${u.parent.steps[u.parent.steps.indexOf(u) - 1].num} is done`]) : W ? arr(W.preconditions) : arr(D.entry);
    // the work
    const work = [];
    if (kind === "step") {
      const branches = (u.parent.loops || []).filter((l) => l[0] === u.id);
      if (u.decision) {
        if (ask) work.push(ask);
        work.push(`Prepare the decision "${u.title.replace(/\?$/, "")}" for me — don't make it.`, "Lay out each option with the evidence for and against it, the main risks, and your recommendation with reasons.");
        work.push(`The options: Yes → continue to the next step${branches.map((l) => `; ${l[3]}`).join("")}.`);
      } else {
        work.push(ask || `${u.title}.`);
        const uses = arr((W.uses || {})[u.id]); if (uses.length) work.push(`Use ${uses.map(kLabel).join(" and ")} (see "Apply" below).`);
        if (u.out) work.push(`Write the result as the ${u.out}, in the output format below.`);
        if (branches.length) work.push(`Watch for: ${branches.map((l) => l[3]).join("; ")} — tell me straight away if that happens.`);
      }
      if (u.reuses && UNITS[u.reuses]) work.push(`This step is a small-scale version of ${UNITS[u.reuses].num} ${UNITS[u.reuses].title} — keep it light: hours, not days.`);
    } else if (W) {
      work.push("Work through these steps in order. Show me the output of each step and wait for my OK before the next.");
      wfU.steps.forEach((s) => { const br = (wfU.loops || []).filter((l) => l[0] === s.id).map((l) => l[3]); work.push(`${s.num}. ${s.decision ? "◆ DECISION — " : ""}${s.title} (${s.actor})${s.out ? ` → ${s.out}` : ""}${br.length ? `  [if: ${br.join("; ")}]` : ""}`); });
      work.push("At each ◆ decision, prepare the options and a recommendation — I decide.");
      if (arr(W.cases).length) work.push(`Cases to handle: ${arr(W.cases).join("; ")}.`);
      if (arr(W.recovery).length) work.push(`If it fails: ${arr(W.recovery).join("; ")}.`);
    } else {
      const ks = kids(u), cn = kind === "stage" ? "process" : kind === "process" ? "subprocess" : "workflow";
      work.push(`Run this ${lvl.toLowerCase()} end to end with me, one ${cn} at a time, in this order:`);
      ks.forEach((k) => { const outs = outOf(k); work.push(`${k.num} ${k.title}${k.gate ? ` — gate: ${k.gate}` : ""}${outs.length ? `\n    produces: ${outs.join(", ")}` : ""}`); });
      arr(FL.parallel).forEach((x) => work.push(`In parallel: ${x}`));
      work.push(`After each ${cn}, summarise what we produced, list open questions and assumptions, and wait for my go-ahead. Use the separate ${cn} prompts if we need more depth.`);
      work.push(`At the end, prepare the ${u.gate || "gate"} review: check our evidence against the criteria below and recommend forward, rework or stop. I decide.`);
    }
    // knowledge and lenses
    const know = kind === "step" ? arr((W.uses || {})[u.id]) : W ? [...new Set(Object.values(W.uses || {}).flat())] : knowOf(u).map((x) => x.name).slice(0, 10);
    const lensL = kind === "step" ? arr((W.lensUses || {})[u.id]).map(lensLine) : W ? [...new Set(Object.values(W.lensUses || {}).flat())].map(lensLine) : [...lensNames(u, "required").map((n) => `- ${n} (required)`), ...arr(LN.concerns).map((x) => `- Concern: ${x}`), ...arr(LN.constraints).map((x) => `- Constraint: ${x}`)];
    const rules = kind === "step" ? [] : W ? [...(W.rework ? [`Rework: ${W.rework}`] : [])] : [...arr(CT.rules), ...arr(CT.policies)];
    const outs = kind === "step" ? arr(u.out) : W ? arr(W.outputs) : outOf(u);
    const finish = kind === "step" ? (u.decision ? ["The options, evidence and recommendation are clear enough for me to decide in minutes"] : [u.out ? `The ${u.out} follows the template` : "It covers everything this step asks for", ...(u.parent.steps.indexOf(u) === u.parent.steps.length - 1 ? arr(W.exit) : [])]) : W ? [...arr(W.criteria), ...arr(W.exit)] : [...arr(CT.criteria), ...arr(D.exit)];
    const yourCheck = kind === "step" ? [...arr(W.checks).slice(0, 2), "Every fact, number and source checked", ...arr((W.lensUses || {})[u.id]).map((x) => parseLens(x).note).slice(0, 2)] : W ? [...arr(W.checks), "Every fact, number and source checked", ...arr(W.evidence).map((e) => `Evidence kept: ${e}`)] : [...arr(CT.checks), "Every fact, number and source checked", ...arr(C(u, "artifacts").evidence).slice(0, 4).map((e) => `Evidence kept: ${e}`)];
    const routes = kind === "step" ? [] : W ? arr(W.branches).map((b) => `- ${b}`) : routeLines(u);
    return { u, kind, lvl, label, role, goal, attach, when, work, know, lensL, rules, routes, outs, askOut, finish, yourCheck, next: nextOf(u), needs: needsOf(u) };
  }
  function promptText(u, scale, opts = {}) {
    const P = promptOf(u), sc = SCALES.find((s) => s.id === (scale || scaleOf()));
    const L = [];
    L.push(`# ${P.label}${P.kind !== "stage" ? ` — ${STAGES[u.si].key}` : ""}`);
    const Y = whoAmI(P.role);
    if (P.kind === "step") {
      L.push(`${Y.me} on {{initiative}}, working on step ${P.u.num} "${P.u.title}" of the workflow "${P.u.parent.title}".`);
      L.push(`The workflow's goal: ${P.goal}`);
    } else {
      L.push(`${Y.me} on {{initiative}}. ${P.kind === "stage" ? "Help me run this act end to end." : `I'm working on ${P.lvl.toLowerCase()} ${P.u.num}: ${P.u.title}.`}`.replace("Help me", Y.me.startsWith("We") ? "Help us" : "Help me"));
      L.push(`Goal: ${P.goal}`);
    }
    L.push(`${Y.i} the decisions and own the result; you help ${Y.me.startsWith("We") ? "us" : "me"} draft, analyse, structure and check.`);
    L.push("", "## Context I'm attaching", ...(P.attach.length ? P.attach.map((x) => `- ${x}`) : ["- Nothing yet — ask me for the context you need"]), "- {{anything else relevant}}");
    if (P.when.length) L.push("", "## Before we start", "Check these are true, or tell me what's missing:", ...P.when.map((x) => `- ${x}`));
    L.push("", "## What to do", ...P.work.map((x, i) => (P.kind === "step" ? `${i + 1}. ${x}` : /^\d|^S\d|^In parallel/.test(x) ? `- ${x}` : x)));
    if (P.know.length) L.push("", "## Apply", ...P.know.map((n) => knowLine(n, P.kind === "step")));
    if (P.lensL.length) L.push("", "## Keep in mind", ...P.lensL);
    if (P.rules.length) L.push("", "## Rules", ...P.rules.map((x) => `- ${x}`));
    if (P.routes.length) L.push("", "## If it goes off the happy path", ...P.routes);
    if (P.outs.length) L.push("", "## Output", ...P.outs.map(tplOutline));
    else if (P.askOut) L.push("", "## Output", `- ${P.askOut}`);
    else if (P.u.decision) L.push("", "## Output", "- A decision brief: the question, each option with evidence for and against, risks, and your recommendation — on one screen.");
    if (P.finish.length) L.push("", "## Before you finish, check", ...P.finish.map((x) => `- [ ] ${x}`));
    L.push("", "## Ground rules", ...GROUND.map((x) => `- ${x}`));
    if (sc && !opts.noScale) L.push("", `## ${sc.prompt}`);
    return L.join("\n");
  }

  /* the prompt card — panel or full sheet */
  function promptSheet(u, full) {
    const P = promptOf(u), sc = scaleOf(), kidsP = u.kind === "step" ? [] : kids(u);
    const tree = kidsP.length ? `<section class="ksec"><h4><span class="ms">account_tree</span>Prompts one level down · ${kidsP.length}</h4><div class="sflows">${kidsP.map((k) => `<button class="sflow" style="--c:#6d48d8" data-prompt="${k.fid}"><i></i><b>${esc(PLEVEL[k.kind])} ${esc(k.num)} · ${esc(k.title)}</b><span>${esc(roleOfUnit(k))}${k.decision ? " · decision" : ""}</span></button>`).join("")}</div></section>` : "";
    const up = u.parent && u.parent !== ROOT ? `<button class="tool" data-prompt="${u.parent.fid}"><span class="ms">arrow_upward</span>${esc(PLEVEL[u.parent.kind])} prompt</button>` : "";
    const top = `<div class="ks-head" style="--kc:#6d48d8"><span class="ks-type"><i></i>${esc(P.lvl)} prompt${P.kind === "step" ? "" : " · end to end"}</span><h3>${esc(P.kind === "stage" ? title(u.key) : u.title)}</h3>
      <div class="ks-acts">${up}${full ? `<button class="tool" data-act="sheet-close"><span class="ms">close</span>Close</button>` : `<button class="tool" data-act="sheet"><span class="ms">open_in_full</span>Full sheet</button>`}<button class="tool dark" data-act="pr-copy" data-fid="${u.fid}"><span class="ms">content_copy</span>Copy prompt</button><span class="at-copied" hidden>Copied ✓</span></div></div>`;
    const meta = `<div class="pr-meta">${kv("Who uses it", roleChips([P.role]), "person")}${kv("Works best with", list(P.needs), "smart_toy")}${kv("When", list(P.when.length ? P.when : ["Any time this unit is active"], "ck"), "login")}${kv("Attach", P.attach.length ? `<div class="chips">${P.attach.map((n) => (artId(n) ? `<button class="chip doc art-chip" data-artsel="${artId(n)}">${esc(n)}</button>` : `<span class="chip">${esc(n)}</span>`)).join("")}</div>` : '<span class="nd">Nothing — the agent will ask</span>', "attach_file")}</div>`;
    const scales = `<div class="pr-scale"><span class="lbl"><span class="ms">straighten</span>Scale</span><div class="seg">${SCALES.map((s) => `<button role="radio" aria-checked="${s.id === sc}" data-scale="${s.id}" style="--c:#6d48d8"><span class="ms">${s.icon}</span>${esc(s.name)}</button>`).join("")}</div></div>`;
    const pre = `<pre class="pr-text" data-fid="${u.fid}">${esc(promptText(u))}</pre>`;
    const after = `<section class="ksec"><h4><span class="ms">fact_check</span>Your check, after the agent</h4>${list(P.yourCheck, "ck")}</section><section class="ksec"><h4><span class="ms">move_down</span>Then</h4><p>${esc(P.next || "—")}</p></section>`;
    return full ? `<div class="ks full pr" style="--kc:#6d48d8">${top}${meta}${scales}<div class="ks-cols"><div class="ks-main">${pre}</div><div class="ks-side">${after}${tree}</div></div></div>`
      : `<div class="ks panel pr" style="--kc:#6d48d8">${top}${meta}${scales}${pre}${after}${tree}</div>`;
  }
  /* the prompt library for a unit and everything inside it */
  function promptTree(u) {
    const row = (k, depth) => `<details class="pr-row" style="--d:${depth}"><summary><span class="pr-lvl">${esc(PLEVEL[k.kind])}${k.kind === "step" ? "" : " · end to end"}</span><b>${esc(k.kind === "stage" ? "Act " + ROMAN[k.si] + " " + k.key : k.num + " " + k.title)}</b><em>${esc(roleOfUnit(k))}</em><button class="tool" data-act="pr-copy" data-fid="${k.fid}"><span class="ms">content_copy</span>Copy</button><span class="at-copied" hidden>Copied ✓</span></summary><pre class="pr-text" data-fid="${k.fid}">${esc(promptText(k))}</pre></details>`;
    const walk = (k, d) => row(k, d) + (k.kind === "step" ? "" : kids(k).map((c) => walk(c, d + 1)).join("")) + (k.level === 0 && k.continuous ? walk(k.continuous, d + 1) : "");
    return `<div class="pr-lib"><div class="pr-scale"><span class="lbl"><span class="ms">straighten</span>Scale</span><div class="seg">${SCALES.map((s) => `<button role="radio" aria-checked="${s.id === scaleOf()}" data-scale="${s.id}" style="--c:#6d48d8"><span class="ms">${s.icon}</span>${esc(s.name)}</button>`).join("")}</div></div>
      <p class="note">Start at the level you need: the end-to-end prompt runs everything below it and stops at each gate for your decision; a step prompt does one precise thing. Fill the {{placeholders}}, attach what the prompt lists, then check the result before you save it as the artifact.</p>${walk(u, 0)}</div>`;
  }

  /* ================= agent kit — every layer of an agent setup, generated from the contracts =================
     context (AGENTS.md) · skills · commands · workflows · subagents · tools · guardrails · rubrics · memory.
     Tool-agnostic formats; the person in the role drives, agents help. */
  const KIT_LAYERS = AW.layers || [], LAYER = Object.fromEntries(KIT_LAYERS.map((l) => [l.id, l]));
  const slug = (s) => String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  const numSlug = (u) => String(u.num).replace(/∞/g, "fm").replace(/\./g, "-").toLowerCase();
  const yq = (v) => JSON.stringify(String(v ?? ""));
  const ylist = (a, ind) => (arr(a).length ? arr(a).map((x) => `\n${ind}- ${yq(x)}`).join("") : " []");
  const SKILL_TYPES = ["Framework", "Pattern", "Practice", "Method", "Technique"];
  const artPath = (name) => { const id = artId(name); return `docs/${id || slug(name)}.md`; };
  const cmdName = (u) => { const a = STAGES[u.si].id; if (u.kind === "stage") return `${a}-run-act`; if (u.kind === "step") return `${a}-${numSlug(u.parent)}-${u.id}-${slug(u.title)}`.slice(0, 80); return `${a}-${numSlug(u)}-run-${slug(u.short || u.title)}`.slice(0, 80); };
  const wfFile = (u) => `workflows/${cmdName(u).replace("-run-", "-")}.md`;
  const skillOf = (n) => { const e = kEntry(n); if (!e || !SKILL_TYPES.includes(e.type)) return null; return slug(Object.keys(KLIB).find((k) => KLIB[k] === e)); };
  const stepUses = (s) => arr(((s.parent.wf || {}).uses || {})[s.id]);
  const stepLens = (s) => arr(((s.parent.wf || {}).lensUses || {})[s.id]).map((x) => parseLens(x).id).filter((id) => lensById[id]);
  const stepsIn = (u) => (u.kind === "step" ? [u] : u.steps ? u.steps : [...kids(u).flatMap(stepsIn), ...(u.level === 0 && u.continuous ? stepsIn(u.continuous) : [])]);
  const lensAgent = (id) => `${slug(lensById[id].n.split(" / ")[0])}-reviewer`;
  const FUNC_AGENTS = {
    researcher: { name: "Researcher", needs: "Web search", desc: "Finds and summarises external information — markets, competitors, vendors, technology — always with sources.", match: (s) => /Web search/.test(needsOf(s).join()),
      body: ["Search widely, then narrow to credible, recent sources.", "Return a findings table: finding · source (link) · date · confidence (high / medium / low).", "Separate facts from estimates; never invent a source or a number.", "End with gaps: what you couldn't find and where it might be."] },
    synthesiser: { name: "Synthesiser", needs: "File access", desc: "Reads many notes or documents and turns them into themes with evidence counts.", match: (s) => /File access/.test(needsOf(s).join()),
      body: ["Read everything attached before concluding anything.", "Code each observation, cluster into themes, and name each theme as an insight.", "Count supporting sources for every theme and keep one or two exact quotes.", "Flag contradictions and anything supported by a single source."] },
    challenger: { name: "Challenger", needs: "Chat", desc: "Plays devil's advocate: finds unvalidated assumptions, leading language, solution bias and confirmation bias.", match: (s) => s.decision || /hypothes|assumption|statement|scope|threshold|score/i.test(s.title),
      body: ["List every assumption the work relies on and whether it has evidence.", "Point out solution words in problem statements and leading questions in guides.", "Ask the question the team is avoiding.", "Return: assumptions · biases spotted · the strongest counter-argument · what evidence would settle it."] },
    "decision-brief": { name: "Decision-brief writer", needs: "Chat", desc: "Prepares a one-screen brief for a decision: options, evidence for and against, risks and a recommendation — never the decision itself.", match: (s) => s.decision,
      body: ["Restate the decision in one line and who makes it.", "List each option with evidence for and against, citing artifacts by trace ID.", "Name the main risks of each option.", "Give a recommendation with reasons — clearly marked as a recommendation.", "Never make, imply or record the decision."] },
  };
  const funcAgentsFor = (s) => Object.entries(FUNC_AGENTS).filter(([, a]) => a.match(s)).map(([id]) => id);
  const TOOL_KN = { "Research repository": "research", "Analytics": "analytics", "Prototyping tools": "design", "Backlog tool": "backlog", "Idea backlog": "backlog", "Recording & transcription": "files", "Scheduling tool": "comms", "Market databases": "web", "Spreadsheet model": "sheets", "Scoring model": "sheets", "Synthesis board": "files", "Survey tools": "web", "Recruitment platform": "comms", "Document repository": "docs", "Decision log": "docs", "Architecture repository": "docs", "Hypothesis board": "docs", "OKR tracker": "docs", "Stakeholder register": "sheets", "Portfolio register": "sheets" };
  const toolsOfStep = (s) => {
    const t = new Set(); const a = ALIB[artId(s.out || "")];
    if (a) t.add(a.tpl.fmt === "sheet" ? "sheets" : "docs");
    stepUses(s).forEach((n) => { const k = TOOL_KN[kBase(n)] || TOOL_KN[n]; if (k) t.add(k); });
    const nd = needsOf(s).join(" ");
    if (/Web search/.test(nd)) t.add("web"); if (/File access/.test(nd)) t.add("files"); if (/Coding agent/.test(nd)) t.add("repo");
    if (/backlog/i.test(s.title + (s.out || ""))) t.add("backlog"); if (/acknowledge|pitch|communicate|recruit|book/i.test(s.title)) t.add("comms");
    return [...t];
  };
  const toolName = (id) => ((AW.tools || []).find((x) => x.id === id) || {}).name || id;

  /* structure → Markdown, for skills */
  const structMd = (st) => {
    if (!st) return "";
    const p = (x) => (Array.isArray(x) ? x : [x, ""]);
    switch (st.kind) {
      case "steps": case "chain": return st.items.map((x, i) => `${i + 1}. ${p(x)[0]}${p(x)[1] ? ` — ${p(x)[1]}` : ""}`).join("\n");
      case "cycle": return st.items.map((x, i) => `${i + 1}. **${p(x)[0]}**${p(x)[1] ? ` — ${p(x)[1]}` : ""}`).join("\n") + "\n→ then repeat";
      case "levels": return st.items.map((x, i) => `${"  ".repeat(i)}- **${p(x)[0]}**${p(x)[1] ? ` — ${p(x)[1]}` : ""}`).join("\n");
      case "fields": return st.items.map((x) => `- **${p(x)[0]}:** ${p(x)[1] || "…"}`).join("\n");
      case "table": return `| ${st.cols.join(" | ")} |\n| ${st.cols.map(() => "---").join(" | ")} |\n${(st.rows || []).map((r) => `| ${r.join(" | ")} |`).join("\n")}`;
      case "matrix": return `2×2 — x: ${st.x} · y: ${st.y}\n\n| | |\n|---|---|\n| ${st.q[0]} | ${st.q[1]} |\n| ${st.q[2]} | ${st.q[3]} |`;
      case "grid": return st.cells.map((c) => `- **${c[0]}** — ${c[1] || ""}`).join("\n");
      case "sentence": return `> ${st.text}`;
      case "dodont": return `**Do**\n${st.dos.map((x) => `- ${x}`).join("\n")}\n\n**Don't**\n${st.donts.map((x) => `- ${x}`).join("\n")}`;
      default: return "";
    }
  };

  /* builds every kit file for an act at a scale: [{ path, layer, title, body, units: [fid] }] */
  const KIT_CACHE = {};
  function actKit(act, scale) {
    const key = act.id + "|" + scale; if (KIT_CACHE[key]) return KIT_CACHE[key];
    const sc = SCALES.find((x) => x.id === scale) || SCALES[0], files = [], add = (path, layer, title, body, units = []) => files.push({ path, layer, title, body, units });
    const allUnits = Object.values(UNITS).filter((u) => u.si === act.si && u.level >= 0 && u !== ROOT);
    const steps = stepsIn(act), chain = act.traceChain || [], T = trackOfAct(act.id);

    // ---- skills: knowledge applied at steps
    const skills = {};
    steps.forEach((s) => stepUses(s).forEach((n) => { const sid = skillOf(n); if (!sid) return; const e = kEntry(n); (skills[sid] = skills[sid] || { e, base: Object.keys(KLIB).find((k) => KLIB[k] === e), at: [], arts: new Set() }).at.push({ s, variant: n.includes(" — ") ? n.split(" — ")[1] : "" }); if (s.out) skills[sid].arts.add(s.out); }));
    Object.entries(skills).forEach(([sid, k]) => {
      let e = k.e; const arts = [...k.arts].filter((n) => artId(n));
      const where = k.at.slice(0, 6).map(({ s, variant }) => `${s.parent.num} ${s.num} ${s.title}`).join("; ");
      // without a library "use", say what it's for from the steps that apply it
      if (!e.use) e = { ...e, use: `you need to ${[...new Set(k.at.map(({ s }) => s.title.toLowerCase()))].slice(0, 3).join(", or ")}` };
      add(`skills/${sid}/SKILL.md`, "skills", k.base, [
        "---", `name: ${sid}`, `description: ${yq(`${String(e.what).split(/(?<=\.)\s/)[0]} Use when ${(e.use || "the task calls for it").replace(/\.$/, "").replace(/^\w/, (c) => c.toLowerCase())}. In Node: ${where}.`)}`, "---", "",
        `# ${k.base}`, "", `_${e.type}_ — ${e.what}`, "",
        "## When to use it", e.use || "When the step calls for it.", "", "Applied in Node at:", ...k.at.map(({ s, variant }) => `- ${s.parent.num} ${s.num} ${s.title}${variant ? ` (applied as: ${variant})` : ""} — command \`${cmdName(s)}\``), "",
        "## How to do it", ...(e.how || []).map((x, i) => `${i + 1}. ${x}`), "",
        ...(e.structure ? ["## Structure", structMd(e.structure), ""] : []),
        ...(e.says ? ["## What it says", ...arr(e.says).map((x) => `- ${x}`), ""] : []),
        ...(arts.length ? ["## Output", "Write results with these templates:", ...arts.map((n) => `- ${n} → \`templates/${artId(n)}.md\`, saved as \`${artPath(n)}\``), ""] : []),
        "## Quality checks", ...arr(e.pitfalls).map((x) => `- Avoid: ${x}`), ...arts.flatMap((n) => arr(ALIB[artId(n)].good).map((g) => `- ${n}: ${g}`)), "- Every claim cites evidence or is marked \"Assumption:\"", "",
        ...(e.source ? ["## Source", e.source] : []),
      ].join("\n"), k.at.map(({ s }) => s.fid));
    });
    const skillsOf = (s) => [...new Set(stepUses(s).map(skillOf).filter(Boolean))];

    // ---- subagents
    const lensIds = [...new Set(steps.flatMap(stepLens))];
    lensIds.forEach((id) => {
      const L = lensById[id], X = LLIB[id] || {}, at = steps.filter((s) => stepLens(s).includes(id));
      add(`agents/${lensAgent(id)}.md`, "agents", `${L.n} reviewer`, [
        "---", `name: ${lensAgent(id)}`, `description: ${yq(`Reviews work through the ${L.n} lens — ${L.c} Use after: ${at.slice(0, 4).map((s) => `${s.parent.num} ${s.num} ${s.title}`).join("; ")}.`)}`, "tools: read-only (the files you're given)", "---", "",
        `You are the ${L.n} reviewer on {{initiative}}. You review; you don't rewrite the work and you don't decide. Be brief and specific.`, "",
        ...(X.what ? ["## The lens", X.what, ""] : []),
        "## Questions to ask", ...arr(X.asks).map((x) => `- ${x}`), "",
        "## Concerns to check", ...arr(X.concerns).map((x) => `- ${x}`), "",
        ...(arr(X.evidence).length ? ["## Evidence this lens needs", ...arr(X.evidence).map((x) => `- ${x}`), ""] : []),
        "## In this act, look for", ...at.map((s) => `- ${s.parent.num} ${s.num} ${s.title}: ${arr(((s.parent.wf || {}).lensUses || {})[s.id]).map(parseLens).filter((x) => x.id === id).map((x) => x.note).join(" ")}`), "",
        "## Report", "Return three lists — **Pass**, **Concerns**, **Blockers** — each item naming the line or section it refers to and why. Nothing else.",
      ].join("\n"), at.map((s) => s.fid));
    });
    Object.entries(FUNC_AGENTS).forEach(([id, a]) => {
      const at = steps.filter((s) => a.match(s));
      add(`agents/${id}.md`, "agents", a.name, ["---", `name: ${id}`, `description: ${yq(`${a.desc} Use at: ${at.slice(0, 4).map((s) => `${s.parent.num} ${s.num} ${s.title}`).join("; ")}${at.length > 4 ? "…" : ""}.`)}`, `tools: ${a.needs}`, "---", "",
        `You are the ${a.name.toLowerCase()} helping a person on {{initiative}}. People make every decision; you help them see clearly.`, "", "## How you work", ...a.body.map((x) => `- ${x}`), "", "## Ground rules", ...GROUND.map((x) => `- ${x}`)].join("\n"), at.map((s) => s.fid));
    });
    const agentsOf = (s) => [...stepLens(s).map(lensAgent), ...funcAgentsFor(s)];

    // ---- commands: every step and every unit
    allUnits.forEach((u) => {
      if (u.kind === "step" && !u.parent.steps) return;
      const sk = u.kind === "step" ? skillsOf(u) : [...new Set(stepsIn(u).flatMap(skillsOf))];
      add(`commands/${cmdName(u)}.md`, "commands", `${PLEVEL[u.kind]} ${u.kind === "stage" ? act.key : u.num + (u.kind === "step" ? " " + u.parent.num : "")} · ${u.title}`, [
        "---", `description: ${yq(`${PLEVEL[u.kind]}${u.kind === "step" ? ` ${u.num} of ${u.parent.title}` : ""} — ${u.kind === "stage" ? "run " + act.key + " end to end" : u.title}`)}`, "argument-hint: <initiative> [extra context]", "---", "",
        "Follow AGENTS.md. Log what you do in PROGRESS.md and register new IDs in TRACE.md.",
        ...(sk.length ? [`Load these skills if you can: ${sk.slice(0, 8).join(", ")}${sk.length > 8 ? ` (+${sk.length - 8} more)` : ""}.`] : []),
        ...(u.kind === "step" && agentsOf(u).length ? [`Ask these reviewers to check the result: ${agentsOf(u).join(", ")}.`] : []),
        ...(u.kind !== "step" ? [`Run it as specified in \`${wfFile(u)}\`, stopping at every checkpoint.`] : []),
        "Context from me: $ARGUMENTS", "",
        promptText(u, scale, { noScale: true }).replace(/^# .*\n/, ""),
      ].join("\n"), [u.fid]);
    });

    // ---- workflows: run specs for workflows, orchestration specs above them
    const runUnits = allUnits.filter((u) => u.kind !== "step");
    runUnits.forEach((u) => {
      const W = u.wf, name = wfFile(u).slice(10, -3);
      let y;
      if (W) {
        y = [`workflow: ${name}`, `title: ${yq(u.title)}`, `owner: ${yq(arr(W.actors)[0])}`, `inputs:${ylist(arr(W.inputs).map(artPath), "  ")}`, `preconditions:${ylist(W.preconditions, "  ")}`, "steps:"];
        u.steps.forEach((s) => {
          const br = (u.loops || []).filter((l) => l[0] === s.id);
          y.push(`  - id: ${s.id}`, `    ${s.decision ? "decision" : "do"}: ${yq(s.title)}`, `    owner: ${yq(s.actor)}`);
          if (s.decision) { y.push(`    agent: "prepare a decision brief — never decide"`, `    checkpoint: decision   # stop; ${s.actor} decides`, "    branches:", `      ${yq("yes")}: ${u.steps[u.steps.indexOf(s) + 1]?.id || "gate"}`, ...br.map((l) => `      ${yq(l[3])}: ${l[1]}`)); }
          else { y.push(`    agent: "draft, then wait for review"`, `    command: ${cmdName(s)}`); const sk = skillsOf(s), ag = agentsOf(s); if (sk.length) y.push(`    skills: [${sk.join(", ")}]`); if (ag.length) y.push(`    reviewers: [${ag.join(", ")}]`); if (s.out) y.push(`    output: ${yq(artPath(s.out))}`); y.push(`    checkpoint: ${sc.id === "solo" ? "review-at-end" : "review"}`); if (br.length) y.push("    on:", ...br.map((l) => `      ${yq(l[3])}: ${l[1]}`)); }
        });
        y.push(`gate: ${yq(W.gate)}`, `criteria:${ylist(W.criteria, "  ")}`, `checks:${ylist(W.checks, "  ")}`, `on_failure:${ylist(W.recovery, "  ")}`, `rework: ${yq(W.rework)}`, `outputs:${ylist(arr(W.outputs).map(artPath), "  ")}`, `handoff: ${yq(W.handoff)}`, `learning:${ylist(W.learning, "  ")}`);
      } else {
        const ks = kids(u), D = C(u, "definition"), CT = C(u, "controls");
        y = [`orchestration: ${name}`, `title: ${yq(u.kind === "stage" ? act.key : u.title)}`, `owner: ${yq(roleOfUnit(u))}`, `inputs:${ylist(arr(C(u, "artifacts").inputs).map(artPath), "  ")}`, `entry:${ylist(D.entry, "  ")}`, "runs:"];
        ks.forEach((k) => y.push(`  - unit: ${yq(`${k.num} ${k.title}`)}`, `    spec: ${wfFile(k)}`, `    command: ${cmdName(k)}`, `    gate: ${yq(k.gate || "")}`, `    checkpoint: review   # show outputs, wait for go-ahead`));
        if (arr(C(u, "flow").parallel).length) y.push(`parallel:${ylist(C(u, "flow").parallel, "  ")}`);
        y.push(`gate: ${yq(u.gate || "")}`, `decided_by: ${yq(C(u, "execution").authority || "")}`, `criteria:${ylist(CT.criteria, "  ")}`, "routes:", ...["forward", "rework", "alternate", "escalate", "stop"].filter((k) => routeOf(u, k)).map((k) => `  ${k}: ${yq(routeOf(u, k))}`), `outputs:${ylist(outOf(u).map(artPath), "  ")}`, `handoff: ${yq(C(u, "continuity").handoff || "")}`);
      }
      add(wfFile(u), "workflows", `${PLEVEL[u.kind]} ${u.kind === "stage" ? act.key : u.num} · ${u.title}`, [
        `# ${PLEVEL[u.kind]} ${u.kind === "stage" ? act.key : u.num} · ${u.kind === "stage" ? title(act.key) : u.title}`, "", dot(W ? W.definition : C(u, "definition").purpose || u.summary), "",
        `**Run it:** ask your agent to "run \`${wfFile(u)}\` for {{initiative}}, stopping at every checkpoint", or use the command \`${cmdName(u)}\`. Each checkpoint means: show me the output and wait. At \`decision\` checkpoints the named person decides.`, "",
        "```yaml", ...y, "```",
      ].join("\n"), [u.fid]);
    });

    // ---- rubrics and templates for every artifact the act produces or uses
    const produced = new Set(); steps.forEach((s) => s.out && artId(s.out) && produced.add(artId(s.out))); allUnits.forEach((u) => outOf(u).forEach((n) => artId(n) && produced.add(artId(n))));
    const used = new Set(produced); allUnits.forEach((u) => arr(u.wf ? u.wf.inputs : C(u, "artifacts").inputs).forEach((n) => artId(n) && used.add(artId(n))));
    produced.forEach((id) => {
      const a = ALIB[id], prodSteps = steps.filter((s) => artId(s.out || "") === id), wfs = [...new Set(prodSteps.map((s) => s.parent))];
      const crit = [...arr(a.good).map((g) => [g, "artifact quality"]), ...wfs.flatMap((w) => arr(w.wf.criteria).map((c) => [c, `${w.num} criteria`])), ["Follows every section or column of the template", "template"], ["Carries its trace ID and links upstream IDs", "traceability"], ["Every claim cites evidence or is marked \"Assumption:\"", "ground rules"]];
      add(`rubrics/${id}.md`, "rubrics", a.aliases[0], [`# Rubric — ${a.aliases[0]}`, "", `Score each criterion 0 (missing) · 1 (partial) · 2 (meets). **Pass:** no 0s and at least 80% of the maximum (${crit.length * 2}).`, "",
        "| # | Criterion | From | Score |", "|---|---|---|---|", ...crit.map(([c, f], i) => `| ${i + 1} | ${c} | ${f} | |`), "",
        "## Self-check prompt", `"Score \`${artPath(a.aliases[0])}\` against \`rubrics/${id}.md\`. For every criterion below 2, quote the gap and propose the fix. Don't change the file yet."`, "",
        "Then score it yourself — the agent's score is a starting point, not the verdict."].join("\n"), [...prodSteps.map((s) => s.fid), ...allUnits.filter((u) => outOf(u).some((n) => artId(n) === id)).map((u) => u.fid)]);
    });
    used.forEach((id) => add(`templates/${id}.md`, "templates", ALIB[id].aliases[0], artToMd(id), allUnits.filter((u) => outOf(u).some((n) => artId(n) === id)).map((u) => u.fid)));

    // ---- tools, guardrails, memory, context, readme
    add("TOOLS.md", "tools", "Tools & connectors", [`# Tools & connectors — ${title(act.key)}`, "", `**Scale: ${sc.name}.** ${sc.perms}`, "", "Grant the least access each step needs. Connect tools through your agent's connectors (for example MCP servers).", "",
      "## Catalogue", "| Tool | Used for |", "|---|---|", ...(AW.tools || []).map((t) => `| ${t.name} | ${t.for} |`), "",
      "## Per step", "| Step | Owner | Tools | Agent may |", "|---|---|---|---|", ...steps.map((s) => `| ${s.parent.num} ${s.num} ${s.title} | ${s.actor} | ${toolsOfStep(s).map(toolName).join(", ")} | ${s.decision ? "prepare a brief only" : /send|acknowledge|communicate|pitch|recruit/i.test(s.title) ? "draft — a person sends" : "draft and save for review"} |`)].join("\n"), steps.map((s) => s.fid));
    add("GUARDRAILS.md", "guardrails", "Guardrails & hooks", [`# Guardrails & hooks — ${title(act.key)}`, "", AW.principle, "", "## Always", ...GROUND.map((x) => `- ${x}`), ...(AW.rules || []).map((x) => `- ${x}`), "",
      `## Scale: ${sc.name}`, `- ${sc.perms}`, ...sc.risks.map((r) => `- Watch for: ${r}`), "",
      "## Hooks — automatic where your agent supports them, a checklist everywhere else", "| When | Check | If it fails |", "|---|---|---|", ...(AW.hooks || []).map(([w, c, f]) => `| ${w} | ${c} | ${f} |`), "",
      "## Rules and policies by unit", ...allUnits.filter((u) => u.kind !== "step").flatMap((u) => { const CT = C(u, "controls"), r = [...arr(CT.rules), ...arr(CT.policies), ...arr(C(u, "lenses").constraints)]; return r.length ? [`### ${u.kind === "stage" ? act.key : u.num + " " + u.title}`, ...r.map((x) => `- ${x}`), ""] : []; })].join("\n"), allUnits.map((u) => u.fid));
    add("PROGRESS.md", "memory", "Progress log", ["# Progress log — {{initiative}}", "", "One entry per step or session, newest at the bottom. Agents append; people correct.", "", "| Date | Unit | Who / agent | What was done | Artifacts | Decisions | Open questions | Next |", "|---|---|---|---|---|---|---|---|", `| {{date}} | ${act.processes[0].num} ${act.processes[0].title} | {{name}} + agent | Kick-off | — | — | — | ${cmdName(act.processes[0])} |`].join("\n"), [act.fid]);
    add("TRACE.md", "memory", "Trace-ID register", ["# Trace-ID register — {{initiative}}", "", "Every artifact carries an ID and links the IDs it came from. Register each new ID here.", "", "## The chain", ...chain.map(([pre, nm, aid]) => `- **${pre}-###** — ${nm} (\`${artPath(ALIB[aid] ? ALIB[aid].aliases[0] : nm)}\`)`), "", "## Register", "| ID | Type | Title | File | Links to | Status |", "|---|---|---|---|---|---|", `| ${chain[0] ? chain[0][0] + "-001" : "ID-001"} | ${chain[0] ? chain[0][1] : ""} | | | — | open |`].join("\n"), [act.fid]);
    add("AGENTS.md", "context", "Context file", [
      `# AGENTS.md — {{initiative}}`, "", `> Node SDLC · Act ${ROMAN[act.si]} ${act.key} · Scale: ${sc.name}. Read this first, every session.`, "",
      "## How we work", AW.principle, ...(AW.split || []).map(([w, d]) => `- **${w}:** ${d}`), "",
      "## Where this act sits", `${T ? `${act.key} is part of the **${T.name}** — ${T.q} ` : ""}${SYS.orderNote || ""}`, ...(SYS.modes || []).filter((m) => m.act === act.id).map((m) => `- **${m.name}:** ${m.when} → ${m.feeds}.`), "",
      `## ${act.key}: ${act.purpose}`, ...act.processes.map((p) => `- **${p.num} ${p.title}** — gate: ${p.gate}. Produces: ${outOf(p).join(", ")}.`), ...(act.continuous ? [`- **${act.continuous.num} ${act.continuous.title}** — gate: ${act.continuous.gate}.`] : []), `- Act gate: **${act.gate}** — decided by: ${C(act, "execution").authority || "the sponsor"}.`, "",
      "## Conventions", "- Artifacts live in `docs/<artifact>.md`, written from `templates/<artifact>.md`.", "- Every artifact carries its trace ID and links the IDs upstream of it; register new IDs in `TRACE.md`.", `- Trace chain: ${chain.map((x) => x[0]).join(" → ")}.`, "- Log each step in `PROGRESS.md`.", "- Before saving, score the artifact against `rubrics/<artifact>.md`.", "",
      "## Your toolkit", "- `commands/` — one per step, workflow, subprocess, process and the act. Start with `" + cmdName(act) + "` or the unit you're on.", "- `workflows/` — run specs with checkpoints; stop at every checkpoint.", "- `skills/` — how-to packages for each technique; load the ones a command names.", "- `agents/` — reviewers by lens, plus researcher, synthesiser, challenger and decision-brief writer.", "- `TOOLS.md` and `GUARDRAILS.md` — what you may use and must never do.", "",
      "## Ground rules", ...GROUND.map((x) => `- ${x}`), "", `## Scale: ${sc.name}`, sc.prompt.replace(/^Scale: [^.]+\. /, ""), `Access: ${sc.perms}`,
    ].join("\n"), allUnits.map((u) => u.fid));
    add("README.md", "readme", "How to use this kit", [`# Node agent kit — ${title(act.key)}`, "", "A ready project folder for running this act with your agent. People drive, decide and sign off; agents help.", "",
      "## What's inside", ...KIT_LAYERS.filter((l) => l.id !== "prompt").map((l) => `- **${l.name}** — \`${l.file}\`: ${l.what}`), "- **Templates** — `templates/`: the artifact templates the work produces.", "",
      "## Set it up", "1. Put this folder at the root of your project repository or shared drive and fill `{{initiative}}` in AGENTS.md.", "2. Point your agent at it — how each layer is picked up:", ...KIT_LAYERS.filter((l) => l.id !== "prompt").map((l) => `   - ${l.name}: ${l.tools}`), `3. Start with the command \`${cmdName(act)}\`, or the command for the unit you're on.`, "4. After every step: check the output, score it against its rubric, save it in `docs/`, and log it in PROGRESS.md.", "",
      "Tools change quickly — check your agent's documentation for where it reads context files, skills, commands and subagents."].join("\n"), [act.fid]);
    return (KIT_CACHE[key] = files.sort((a, b) => a.path.localeCompare(b.path)));
  }
  /* which kit files belong to a unit (and everything inside it) */
  function unitKit(u, scale) {
    const files = actKit(STAGES[u.si], scale), inside = new Set([u, ...(u.kind === "step" ? [] : stepsIn(u)), ...(function all(x) { return x.kind === "step" ? [] : [x, ...kids(x).flatMap(all)]; })(u)].map((x) => x.fid));
    const mine = files.filter((f) => f.units.some((fid) => inside.has(fid)));
    const pick = (layer) => mine.filter((f) => f.layer === layer);
    return { all: files, mine, pick, ownCmd: files.find((f) => f.path === `commands/${cmdName(u)}.md`), ownWf: u.kind === "step" ? files.find((f) => f.path === wfFile(u.parent)) : files.find((f) => f.path === wfFile(u)) };
  }

  /* ---- minimal zip (stored, no compression) so the kit downloads without any library ---- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function makeZip(files) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    const u16 = (v) => [v & 0xff, (v >>> 8) & 0xff], u32 = (v) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
    files.forEach(({ path, body }) => {
      const name = enc.encode(path), data = enc.encode(body), crc = crc32(data);
      const head = [...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)];
      parts.push(new Uint8Array(head), name, data);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), name);
      off += head.length + name.length + data.length;
    });
    const cdSize = central.reduce((a, b) => a + b.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(off), ...u16(0)]);
    return new Blob([...parts, ...central, end], { type: "application/zip" });
  }

  /* ---- kit views ---- */
  const KIT_TABS = [["prompt", "Prompt"], ["context", "Context"], ["commands", "Command"], ["workflows", "Workflow"], ["skills", "Skills"], ["agents", "Subagents"], ["tools", "Tools"], ["guardrails", "Guardrails"], ["rubrics", "Rubrics"]];
  const fileView = (f) => `<div class="kf"><div class="kf-head"><span class="ms">description</span><code>${esc(f.path)}</code><button class="tool" data-act="file-copy" data-path="${esc(f.path)}"><span class="ms">content_copy</span>Copy</button><span class="at-copied" hidden>Copied ✓</span></div><pre class="pr-text kf-body">${esc(f.body)}</pre></div>`;
  const fileList = (fs) => (fs.length ? `<div class="kf-list">${fs.map((f) => `<details class="pr-row" style="--d:0"><summary><span class="pr-lvl">${esc(LAYER[f.layer]?.name || f.layer)}</span><b>${esc(f.title)}</b><em>${esc(f.path)}</em><button class="tool" data-act="file-copy" data-path="${esc(f.path)}"><span class="ms">content_copy</span>Copy</button><span class="at-copied" hidden>Copied ✓</span></summary><pre class="pr-text">${esc(f.body)}</pre></details>`).join("")}</div>` : '<span class="nd">Nothing at this level</span>');
  function kitTab(u, tab) {
    const K = unitKit(u, scaleOf()), L = LAYER[tab === "commands" ? "commands" : tab] || {}, note = L.what ? `<p class="kf-note"><b>${esc(L.name)}</b> — ${esc(L.what)} <span>${esc(L.tools || "")}</span></p>` : "";
    if (tab === "context") { const f = K.all.find((x) => x.path === "AGENTS.md"); const P = promptOf(u); return `${note}${fileView(f)}<section class="ksec"><h4><span class="ms">pin_drop</span>Add for this unit</h4><pre class="pr-text">${esc(`## Current unit\n${P.label}\nOwner: ${P.role}\nGoal: ${P.goal}\nDone when:\n${P.finish.map((x) => `- ${x}`).join("\n")}\nNext: ${P.next || ""}`)}</pre></section>`; }
    if (tab === "commands") return `${note}${K.ownCmd ? fileView(K.ownCmd) : ""}${u.kind === "step" ? "" : `<section class="ksec"><h4><span class="ms">terminal</span>Commands inside · ${K.pick("commands").length - 1}</h4>${fileList(K.pick("commands").filter((f) => f !== K.ownCmd))}</section>`}`;
    if (tab === "workflows") return `${note}${K.ownWf ? fileView(K.ownWf) : ""}${u.kind === "step" ? '<p class="ksrc">A step runs inside its workflow — this is the workflow it belongs to.</p>' : ""}`;
    if (tab === "tools") { const st = u.kind === "step" ? [u] : stepsIn(u); return `${note}<p class="ksrc"><b>Scale: ${esc((SCALES.find((s) => s.id === scaleOf()) || {}).name)}.</b> ${esc((SCALES.find((s) => s.id === scaleOf()) || {}).perms)}</p><table class="sys-tbl"><tr><th>Step</th><th>Tools</th><th>Agent may</th></tr>${st.map((s) => `<tr><td><b>${esc(s.parent.num + " " + s.num)}</b> ${esc(s.title)}</td><td>${esc(toolsOfStep(s).map(toolName).join(", "))}</td><td>${s.decision ? "prepare a brief only" : /send|acknowledge|communicate|pitch|recruit/i.test(s.title) ? "draft — a person sends" : "draft and save for review"}</td></tr>`).join("")}</table>${fileList(K.all.filter((f) => f.path === "TOOLS.md"))}`; }
    if (tab === "guardrails") { const CT = C(u.kind === "step" ? u.parent : u, "controls"); return `${note}<div class="dt-grid">${kv("Hooks", `<table class="sys-tbl"><tr><th>When</th><th>Check</th><th>If it fails</th></tr>${(AW.hooks || []).map(([w, c, f]) => `<tr><td><b>${esc(w)}</b></td><td>${esc(c)}</td><td>${esc(f)}</td></tr>`).join("")}</table>`, "bolt")}${kv("Rules & policies here", list([...arr(CT.rules), ...arr(CT.policies), ...arr(CT.checks)]), "policy")}</div>${fileList(K.all.filter((f) => f.path === "GUARDRAILS.md"))}`; }
    if (tab === "skills" && !K.pick("skills").length) {
      const names = [...new Set((u.kind === "step" ? [u] : stepsIn(u)).flatMap(stepUses))];
      return `${note}<p class="ksrc">No technique-type skills here — this ${u.kind} applies principles, standards and tools, which live in the context file, guardrails and tools rather than as skills:</p>${names.length ? `<div class="chips">${names.map((n) => `<span class="chip">${esc(kLabel(n))} · ${esc((kEntry(n) || {}).type || "")}</span>`).join("")}</div>` : ""}`;
    }
    return `${note}${fileList(K.pick(tab))}`;
  }
  function kitCard(u, tab, full) {
    tab = tab || "prompt";
    const body = tab === "prompt" ? promptSheet(u, full) : `<div class="ks ${full ? "full" : "panel"} pr" style="--kc:#6d48d8"><div class="ks-head" style="--kc:#6d48d8"><span class="ks-type"><i></i>Agent kit · ${esc(PLEVEL[u.kind])}</span><h3>${esc(u.kind === "stage" ? title(u.key) : u.title)}</h3><div class="ks-acts">${full ? `<button class="tool" data-act="sheet-close"><span class="ms">close</span>Close</button>` : `<button class="tool" data-act="sheet"><span class="ms">open_in_full</span>Full sheet</button>`}</div></div>${kitTab(u, tab)}</div>`;
    return `<div class="kit-tabs" role="tablist">${KIT_TABS.map(([k, n]) => `<button role="tab" aria-selected="${k === tab}" data-kittab="${k}"><span class="ms">${(LAYER[k] || {}).icon || "chat"}</span>${n}</button>`).join("")}</div>${body}`;
  }
  /* the act's and each unit's "Agent kit" tab: a file browser plus download */
  function kitBrowser(u) {
    const sc = scaleOf(), K = unitKit(u, sc), files = u.level === 0 ? K.all : K.mine.concat(K.all.filter((f) => ["AGENTS.md", "README.md", "TOOLS.md", "GUARDRAILS.md", "PROGRESS.md", "TRACE.md"].includes(f.path) && !K.mine.includes(f)));
    const groups = {}; files.forEach((f) => { const g = f.path.includes("/") ? f.path.split("/")[0] + "/" : "root"; (groups[g] = groups[g] || []).push(f); });
    const order = ["root", "skills/", "commands/", "workflows/", "agents/", "rubrics/", "templates/"];
    return `<div class="kit" data-fid="${u.fid}"><div class="pr-scale"><span class="lbl"><span class="ms">straighten</span>Scale</span><div class="seg">${SCALES.map((s) => `<button role="radio" aria-checked="${s.id === sc}" data-scale="${s.id}" data-kitre="1" style="--c:#6d48d8"><span class="ms">${s.icon}</span>${esc(s.name)}</button>`).join("")}</div>
        <button class="tool dark" data-act="kit-zip" data-fid="${u.fid}"><span class="ms">download</span>Download ${u.level === 0 ? "the act's" : "this unit's"} kit (.zip · ${files.length} files)</button></div>
      <p class="note">${u.level === 0 ? "The complete agent kit for this act" : "The kit files this unit uses, plus the shared files"} — generated from the contracts, for the chosen scale. Drop the folder at the root of your project; see README.md for how each tool picks the layers up.</p>
      <div class="kit-grid"><nav class="kit-nav">${order.filter((g) => groups[g]).map((g) => `<div class="kit-g"><span class="lbl">${g === "root" ? "Project root" : g} · ${groups[g].length}</span>${groups[g].map((f) => `<button data-kitfile="${esc(f.path)}" ${f.path === "README.md" ? 'aria-current="true"' : ""}>${esc(g === "root" ? f.path : f.path.slice(g.length))}</button>`).join("")}</div>`).join("")}</nav>
      <div class="kit-view">${fileView(files.find((f) => f.path === "README.md") || files[0])}</div></div></div>`;
  }

  function flowMap(start, mode) {
    const uid = "m" + Math.random().toString(36).slice(2, 7);
    return { html: `<div class="mapw" id="${uid}"></div>`,
      mount(root) {
        const box = $("#" + uid, root);
        const routesOn = { forward: true, alternate: true, rework: true, escalate: true, stop: true };
        const layers = Object.assign({ owners: true, checks: true, outputs: false, states: true, lenses: false, branches: true, tracks: false }, store.get("node-map-layers", {}));
        let cur = start, sel = null, hs = null, hl = null, scen = "all", kCells = [], sheet = false, aCells = [];
        const know = new Set(store.get("node-map-know", []));
        const lensOn = new Set(store.get("node-map-lens", []));
        let profile = store.get("node-map-profile", "standard");
        let view = store.get("node-map-view", "system");
        let lCells = [];
        let fs = store.get("node-map-fs", false);

        box.innerHTML = `<div class="mx-head"></div>
          <div class="mx-tools"><div class="seg" role="radiogroup" aria-label="Scenario"></div>
            <div class="mx-dds">${[["layers", "layers", "Layers", "What the map shows"], ["toggles", "fork_right", "Routes", "Paths drawn between steps"], ["kts", "menu_book", "Knowledge", "Knowledge in the flow"], ["lgs", "visibility", "Lenses", "Lenses in the flow"]].map(([k, ic, n, hint]) => `<details class="dd" data-dd="${k}"><summary title="${hint}"><span class="ms">${ic}</span>${n}<em class="dd-n"></em><span class="ms car">expand_more</span></summary><div class="dd-pop" role="menu" aria-label="${n}"><div class="dd-hd">${hint}</div><div class="dd-list ${k}"></div></div></details>`).join("")}</div>
            <div class="mx-know mx-prof"><span class="lbl"><span class="ms">tune</span>Tailoring profile</span><div class="seg profs"></div><span class="prof-when"></span></div></div>
          <div class="mx-body"><div class="mx-stage"><div class="scen-banner"></div><div class="mapbox"></div><div class="map-foot"></div></div><aside class="detail" aria-live="polite"></aside><div class="kn-sheet" hidden></div></div>`;

        const setFs = (on) => { fs = on; store.set("node-map-fs", on); box.classList.toggle("fs", on); document.documentElement.classList.toggle("map-fs", on); draw(); };
        const relevant = (ty) => { const s = SCEN.find((x) => x[0] === scen); return !s[4] || s[4].includes(ty); };
        /* toolbar dropdowns: a checklist row, the All/None footer, and the count on the closed button */
        const ddItem = ({ on, attr, color, icon, label, count, off, line }) => `<button class="dd-it" role="menuitemcheckbox" aria-checked="${!!on}" ${attr} ${off ? "disabled" : ""}${color ? ` style="--kc:${color}"` : ""}><span class="cb"><span class="ms">check</span></span>${icon ? `<span class="ms ic">${icon}</span>` : ""}${color ? `<i class="${line ? "ln" : "dot"}"></i>` : ""}<span class="t">${esc(label)}</span>${count !== undefined ? `<em>${count}</em>` : ""}</button>`;
        const ddFoot = (key) => `<div class="dd-ft"><button data-${key}="1"><span class="ms">done_all</span>All</button><button data-${key}="0"><span class="ms">remove_done</span>None</button></div>`;
        const ddCount = (k, text, active) => { const d = box.querySelector(`.dd[data-dd="${k}"]`); if (!d) return; d.querySelector(".dd-n").textContent = text; d.classList.toggle("act", !!active); };
        box.addEventListener("toggle", (e) => { const d = e.target; if (d.matches && d.matches(".dd") && d.open) box.querySelectorAll(".dd[open]").forEach((x) => x !== d && (x.open = false)); }, true);

        const head = () => {
          const D = C(cur, "definition"), EX = C(cur, "execution");
          const a = cur === ROOT ? "var(--teal)" : acc(cur);
          const lbl = cur === ROOT ? "SDLC · Lifecycle map" : `${unitLabel(cur)}${cur.level > 0 ? " · " + STAGES[cur.si].key : ""} · ${cap(PLURAL[KIND[cur.level + 1]] || "map")} map`;
          return `<div class="mx-title" style="--acc:${a}">
              <nav class="trail lbl"><button data-go="">Lifecycle</button>${ancestors(cur).map((x) => `<span>›</span><button data-go="${x.fid}" ${x === cur ? 'aria-current="true"' : ""}>${esc(x.short)}</button>`).join("")}</nav>
              <span class="lbl ey">${lbl}</span>
              <h2>${esc(cur === ROOT ? "The SDLC lifecycle" : cur.level === 0 ? title(cur.key) : cur.title)}</h2>
              <p>${esc(D.purpose || cur.purpose || cur.summary || "")}</p>
            </div>
            <div class="mx-meta">
              ${cur.gate ? `<span class="badge" style="--acc:${a}"><span class="ms">verified_user</span>${esc(cur.gate)}</span>` : ""}
              ${cur !== ROOT ? statusBadge(cur.status) : ""}
              ${EX.authority ? `<span class="mx-auth"><span class="ms">gavel</span>${esc(EX.authority)}</span>` : ""}
              ${cur === ROOT ? `<div class="seg vseg" role="radiogroup" aria-label="View">${[["system", "Delivery system", "all_inclusive"], ["timeline", "Sprint timeline", "view_week"], ["chain", "Logical order", "arrow_right_alt"]].map(([k, n, ic]) => `<button role="radio" aria-checked="${view === k}" data-view="${k}" style="--c:#6d48d8"><span class="ms">${ic}</span>${n}</button>`).join("")}</div>` : ""}
              ${(() => { const act = cur.level === 0 ? cur : cur.mode ? cur.parent : null; if (!act) return ""; const T = trackOfAct(act.id), md = (SYS.modes || []).filter((m) => m.act === act.id);
                return `${T ? `<span class="badge" style="--acc:${T.c}"><span class="ms">${T.icon}</span>${T.name}</span>` : ""}${md.length ? `<div class="seg vseg" role="radiogroup" aria-label="Mode">${md.map((m) => `<button role="radio" aria-checked="${(cur.mode || "initiative") === m.id}" data-go="${m.unit || act.fid}" style="--c:#6d48d8"><span class="ms">${m.icon}</span>${m.name}</button>`).join("")}</div>` : ""}`; })()}
              <div class="mx-btns">${cur.level === 0 && (cur.walkthrough || []).length ? `<button class="tool ${sel?.k === "walk" ? "pink" : ""}" data-act="walk"><span class="ms">directions_walk</span>${sel?.k === "walk" ? "In walkthrough" : "Guided walkthrough"}</button>` : ""}${mode === "explore" && cur !== ROOT && pageOf(cur) ? `<a class="tool" href="#/${pageOf(cur)}"><span class="ms">menu_book</span>Chapter</a>` : ""}<button class="tool dark" data-act="fs"><span class="ms">${fs ? "close_fullscreen" : "open_in_full"}</span>${fs ? "Exit full screen" : "Full screen"}</button></div>
            </div>`;
        };

        const svgText = (x, y, lines, o = {}) => lines.map((l, k) => `<text x="${x}" y="${y + k * (o.lh || 13)}" text-anchor="${o.anchor || "middle"}" font-size="${o.size || 11}" font-weight="${o.weight || 600}" fill="${o.fill || "#444748"}" class="${o.halo === false ? "" : "halo"}" ${o.mono ? 'font-family="Geist Mono, monospace" letter-spacing="1"' : ""}>${esc(l)}</text>`).join("");

        const build = (mm) => {
          const { nodes, edges } = mm, N = nodes.length, W = 1400;
          const F = C(cur, "flow"), AR = C(cur, "artifacts"), LN = C(cur, "lenses"), KN = C(cur, "knowledge"), CT = C(cur, "controls");
          const gateIdx = nodes.findIndex((n) => n.io === "gate");
          const branches = gateIdx >= 0 && layers.branches ? Object.keys(M.routes).filter((k) => routeOf(cur, k)) : [];
          const BW = branches.length ? 250 : 0;
          const colR = W - 24 - (BW ? BW + 60 : 0);
          const NW = Math.min(150, (colR - 24) / N - 20), NH = 60;
          const nx = (i) => 24 + NW / 2 + i * ((colR - 24 - NW) / Math.max(1, N - 1));
          const states = layers.states && F.stateTransitions ? String(F.stateTransitions).split(/\s*→\s*/) : [];
          const yAuth = 26, yState = states.length ? 70 : null;
          const NY = (yState ? 104 : 60) + 150;
          const top = NY - NH / 2, bot = NY + NH / 2;
          let off = bot + 6;
          const yOwner = layers.owners ? off + 12 : null; if (layers.owners) off += 18;
          const yCheck = layers.checks ? off + 12 : null; if (layers.checks) off += 30;
          const reworkDepth = (e) => off + 28 + Math.abs(e.f - e.t) * 22;
          const backs = edges.filter((e) => (e.ty === "rework" || (e.ty === "alternate" && false)) && typeof e.t === "number");
          let yLow = backs.reduce((m, e) => Math.max(m, reworkDepth(e)), off + 8);
          const yOut = layers.outputs ? yLow + 28 : null; if (layers.outputs) yLow += 28 + 3 * 15 + 6;
          const kItems = nodes.map((n) => (know.size ? nodeKnow(cur, n).filter((x) => know.has(x.type)) : []));
          kCells = kItems;
          const kMax = Math.min(6, Math.max(0, ...kItems.map((a) => a.length)));
          const kMore = kItems.some((a) => a.length > 6) ? 1 : 0;
          const yKn = know.size ? yLow + 34 : null; if (know.size) yLow += 34 + (Math.max(1, kMax) + kMore) * 18 + 4;
          const lItems = nodes.map((n) => (lensOn.size ? nodeLens(cur, n).filter((x) => lensOn.has(lensById[x.id]?.g)) : []));
          lCells = lItems;
          const lMax = Math.min(6, Math.max(0, ...lItems.map((a) => a.length)));
          const lMore = lItems.some((a) => a.length > 6) ? 1 : 0;
          const yLz = lensOn.size ? yLow + 34 : null; if (lensOn.size) yLow += 34 + (Math.max(1, lMax) + lMore) * 18 + 4;
          const yLens = layers.lenses ? yLow + 30 : null; if (layers.lenses) yLow += 30 + 5 * 18;
          const yTr = layers.tracks ? yLow + 34 : null; if (layers.tracks) yLow += 34 + M.tracks.length * 30;
          const yStop = yLow + 34, H = yStop + 26;
          const D = 40, DD = 34; // gate / decision-step diamond half-diagonals
          const gx = gateIdx >= 0 ? nx(gateIdx) : 0;
          const path = (e) => {
            const x1 = nx(e.f);
            const t1 = nodes[e.f].io === "gate" ? NY - D : top, b1 = nodes[e.f].io === "gate" ? NY + D : bot;
            if (e.ty === "escalate") return `M${x1},${t1} L${x1},${yAuth + 6}`;
            if (e.ty === "stop") return `M${x1},${b1} L${x1},${yStop - 6}`;
            const x2 = nx(e.t), span = Math.abs(e.f - e.t);
            const half = (i) => (nodes[i].io === "gate" ? D : nodes[i].unit?.decision ? DD : NW / 2), right = (i) => nx(i) + half(i), left = (i) => nx(i) - half(i);
            if (e.ty === "forward" && !e.cyc) return `M${right(e.f)},${NY} L${left(e.t)},${NY}`;
            if (e.cyc) return `M${x1},${top} C${x1},${top - 190} ${x2},${top - 190} ${x2},${top}`;
            if (e.ty === "alternate") { const d = Math.max((yState || 40) + 26, top - 26 - span * 22); return `M${x1 - 10},${top} C${x1 - 10},${d} ${x2 + 10},${d} ${x2 + 10},${top}`; }
            const d = reworkDepth(e);
            return `M${x1 - 10},${bot} C${x1 - 10},${d} ${x2 + 10},${d} ${x2 + 10},${bot}`;
          };
          const selE = sel?.k === "e" ? sel.i : null, selN = sel?.k === "n" ? sel.i : null, selB = sel?.k === "b" ? sel.t : null;
          let h = `<defs>${Object.keys(M.routes).map((k) => `<marker id="${uid}-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${RC(k)}"/></marker>`).join("")}</defs>`;
          // lanes
          h += `<g class="bar ${sel?.k === "auth" ? "on" : ""}" data-bar="auth"><rect x="0" y="${yAuth - 12}" width="${W}" height="22" fill="transparent"/><line x1="12" x2="${W - 12}" y1="${yAuth}" y2="${yAuth}" stroke="${RC("escalate")}" stroke-dasharray="4 6" opacity=".6"/>${svgText(W - 12, yAuth - 6, [`AUTHORITY${C(cur, "execution").authority ? " · " + C(cur, "execution").authority : ""}`.slice(0, 120)], { anchor: "end", size: 10, weight: 700, fill: RC("escalate"), mono: true })}</g>`;
          h += `<g class="bar ${sel?.k === "stop" ? "on" : ""}" data-bar="stop"><rect x="0" y="${yStop - 10}" width="${W}" height="22" fill="transparent"/><line x1="12" x2="${W - 12}" y1="${yStop}" y2="${yStop}" stroke="${RC("stop")}" stroke-dasharray="4 6" opacity=".6"/>${svgText(W - 12, yStop + 16, ["STOP / ABORT"], { anchor: "end", size: 10, weight: 700, fill: RC("stop"), mono: true })}</g>`;
          if (states.length) {
            const sx0 = 24, sx1 = colR, step = (sx1 - sx0) / states.length;
            h += svgText(12, yState - 20, ["STATE"], { anchor: "start", size: 9.5, weight: 700, fill: "#8a8e8f", mono: true });
            states.forEach((s, i) => { const cx = sx0 + step * (i + 0.5), w = Math.min(step - 16, s.length * 6.6 + 22); h += `<rect x="${cx - w / 2}" y="${yState - 12}" width="${w}" height="24" rx="12" fill="#fff" stroke="rgba(0,0,0,.12)"/>${svgText(cx, yState + 4, [s], { size: 11, weight: 700, fill: "#040505" })}${i < states.length - 1 ? `<path d="M${cx + w / 2 + 3},${yState} L${cx + step - w / 2 - 5},${yState}" stroke="#c4c7c7" marker-end="url(#${uid}-forward)" fill="none"/>` : ""}`; });
          }
          // parallel groups
          (cur.parallel || []).forEach((g, gi) => {
            const ix = g.map((id) => nodes.findIndex((n) => n.id === id)).filter((i) => i >= 0);
            if (ix.length < 2) return;
            const x0 = nx(Math.min(...ix)) - NW / 2 - 10, x1 = nx(Math.max(...ix)) + NW / 2 + 10, on = sel?.k === "par";
            h += `<g class="par ${on ? "on" : ""}" data-par="${gi}"><rect x="${x0}" y="${top - 24}" width="${x1 - x0}" height="${NH + 34}" rx="16" fill="rgba(0,128,128,${on ? 0.12 : 0.05})" stroke="#008080" stroke-dasharray="4 4" stroke-width="${on ? 2 : 1.2}"/>${svgText(x0 + 12, top - 30, ["∥ RUNS IN PARALLEL"], { anchor: "start", size: 9.5, weight: 700, fill: "#008080", mono: true })}</g>`;
          });
          // edges
          edges.forEach((e, i) => {
            let c = "arc";
            const rel = relevant(e.ty);
            if (!routesOn[e.ty]) c += " hide";
            else if (selE === i || hl === i) c += " hl";
            else if (!rel) c += " dim";
            else if (hl !== null || selE !== null) c += " dim";
            else if (hs !== null) c += e.f === hs || e.t === hs ? " hl" : " dim";
            else if (selN !== null && (e.f === selN || e.t === selN)) c += " hl";
            if (scen === "happyPath" && e.ty === "forward" && !e.cyc) c += " flow";
            const dash = e.ty === "escalate" || e.ty === "alternate" ? ' stroke-dasharray="5 4"' : e.ty === "stop" ? ' stroke-dasharray="1 4" stroke-linecap="round"' : "";
            h += `<path class="${c}" d="${path(e)}" stroke="${RC(e.ty)}"${c.includes("flow") ? "" : dash} marker-end="url(#${uid}-${e.ty})"/>`;
            if (e.ty !== "forward" || e.cyc) h += `<path class="hit" d="${path(e)}" data-e="${i}"/>`;
          });
          // gate branches
          if (branches.length) {
            const bx = W - BW - 14, sp = Math.min(64, (yStop - yAuth - 80) / branches.length);
            const dec = arr(LN.decisions)[0];
            if (dec) h += svgText(gx + D + 26, NY - (branches.length * sp) / 2 - 14, ["DECISION · " + dec], { anchor: "start", size: 9.5, weight: 700, fill: "#040505", mono: true });
            branches.forEach((k, j) => {
              const y = NY + (j - (branches.length - 1) / 2) * sp, r = M.routes[k];
              const on = selB === k, rel = relevant(k), dim = !routesOn[k] || !rel || (sel && !on && sel.k === "b");
              const lines = wrap(k === "forward" && C(cur, "continuity").handoff ? C(cur, "continuity").handoff : routeOf(cur, k), 34);
              h += `<g class="br ${on ? "on" : ""}" data-b="${k}" opacity="${dim ? 0.18 : 1}">
                <path d="M${gx + D},${NY} C${gx + D + 50},${NY} ${bx - 50},${y} ${bx},${y}" fill="none" stroke="${r.c}" stroke-width="${on ? 3 : 1.8}" ${k === "forward" ? "" : 'stroke-dasharray="5 4"'} marker-end="url(#${uid}-${k})" class="${scen === "happyPath" && k === "forward" ? "flow" : ""}"/>
                <rect x="${bx + 4}" y="${y - 22}" width="${BW}" height="44" rx="10" fill="${on ? r.c : "#fff"}" stroke="${r.c}" stroke-width="1.5"/>
                ${svgText(bx + 16, y - 7, [r.label.toUpperCase()], { anchor: "start", size: 9, weight: 700, fill: on ? "#fff" : r.c, mono: true, halo: !on })}
                ${svgText(bx + 16, y + 8, lines.slice(0, 2), { anchor: "start", size: 11, weight: 600, fill: on ? "#fff" : "#1c1b1b", lh: 12, halo: !on })}
              </g>`;
            });
          }
          // nodes
          nodes.forEach((n, i) => {
            const on = selN === i, hov = hs === i, x = nx(i), y = NY;
            const tl = n.unit ? tailorOf(n.unit, profile) : null;
            const dim = sel?.k === "walk" ? (walkHit(cur, sel.i, n) ? 1 : 0.25) : sel?.k === "role" ? (nodeRoles(cur, n).includes(sel.id) ? 1 : 0.25) : tl?.skip ? 0.3 : sel?.k === "art" ? (nodeArts(cur, n).some((x) => x.id === sel.id) ? 1 : 0.25) : sel?.k === "lens" ? (nodeLens(cur, n).some((x) => x.id === sel.id) ? 1 : 0.25) : sel?.k === "kn" ? (nodeKnow(cur, n).some((x) => x.name === sel.name) ? 1 : 0.25) : scen === "edgeCases" && !n.io ? 0.55 : 1;
            if (n.io === "gate") {
              h += `<g class="sn go" data-n="${i}" tabindex="0" role="button" aria-label="Gate ${esc(n.label)}" opacity="${dim}">
                <path d="M${x},${y - D} L${x + D},${y} L${x},${y + D} L${x - D},${y} Z" fill="${on ? "#008080" : "#0d1117"}" stroke="${on ? "#008080" : "#0d1117"}" stroke-width="2"/>
                <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" letter-spacing="1.5">GATE</text>
                ${svgText(x, y + D + 16, wrap(n.label, 18), { size: 11, weight: 800, fill: "#040505" })}
                ${layers.checks && arr(CT.criteria).length ? svgText(x, y + D + 44, [`✓ ${arr(CT.criteria).length} criteria`], { size: 10, fill: "#0b6b6b" }) : ""}
              </g>`;
            } else if (n.unit?.decision) {
              h += `<g class="sn go" data-n="${i}" tabindex="0" role="button" aria-label="Decision ${esc(n.label)}" opacity="${dim}">
                <path d="M${x},${y - DD} L${x + DD},${y} L${x},${y + DD} L${x - DD},${y} Z" fill="${on ? "#c2410c" : "#fff7ed"}" stroke="#c2410c" stroke-width="${on ? 3 : 2}"/>
                <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="16" font-weight="900" fill="${on ? "#fff" : "#c2410c"}">?</text>
                <text x="${x}" y="${y - DD - 8}" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="1" fill="#008080">${n.num}</text>
                ${svgText(x, y + DD + 15, wrap(n.label, 20), { size: 11, weight: 800, fill: "#040505", lh: 13 })}
                ${layers.owners && n.unit.actor ? svgText(x, y + DD + 44, ["● " + n.unit.actor], { size: 10.5, weight: 700, fill: "#5b5f60" }) : ""}
              </g>`;
            } else {
              const lines = wrap(n.io ? n.label.toUpperCase() : n.label, Math.max(6, Math.floor(NW / 8)));
              const ring = scen === "edgeCases" && n.io === "entry";
              h += `<g class="sn go" data-n="${i}" tabindex="0" role="button" aria-label="${esc(n.label)}" opacity="${dim}">
                <rect x="${x - NW / 2}" y="${top}" width="${NW}" height="${NH}" rx="${n.io ? 30 : 12}" fill="${n.io || on ? "#0d1117" : "#fff"}" stroke="${on ? "#008080" : ring ? "#8b5cf6" : n.io || hov ? "#0d1117" : n.unit && n.unit.level > 0 && isOpen(n.unit) ? "color-mix(in srgb, " + acc(n.unit) + " 60%, transparent)" : "rgba(0,0,0,.18)"}" stroke-width="${on || ring ? 3 : 1.5}"/>
                ${n.num ? `<text x="${x}" y="${top - 8}" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="1" fill="#008080">${n.num}</text>` : ""}
                ${lines.map((l, k) => `<text x="${x}" y="${NY + 4 + (k - (lines.length - 1) / 2) * 14}" text-anchor="middle" font-size="${n.io ? 10.5 : 12.5}" font-weight="800" fill="${n.io || on ? "#fff" : "#040505"}" ${n.io ? 'letter-spacing="1"' : ""}>${esc(l)}</text>`).join("")}
                ${n.unit && layers.owners && ownerOf(n.unit) ? svgText(x, yOwner, ["● " + ownerOf(n.unit)].map((s) => (s.length > 26 ? s.slice(0, 25) + "…" : s)), { size: 10.5, weight: 700, fill: "#5b5f60" }) : ""}
                ${n.unit && layers.checks && arr(C(n.unit, "definition").exit)[0] ? svgText(x, yCheck, wrap("✓ " + arr(C(n.unit, "definition").exit)[0], Math.floor(NW / 6.2)), { size: 10, fill: "#0b6b6b", lh: 12 }) : ""}
                ${n.io === "entry" && layers.checks && arr(C(cur, "definition").entry).length ? svgText(x, yCheck || bot + 18, [`${arr(C(cur, "definition").entry).length} entry criteria`], { size: 10, fill: "#0b6b6b" }) : ""}
              </g>`;
            }
            if (tl && (tl.skip || tl.condense || tl.add)) {
              const [tx, tc] = tl.skip ? ["SKIPPED", "#8a8e8f"] : tl.condense ? ["CONDENSED", "#c49000"] : ["+ ADDED", "#e91e63"];
              h += `<g><title>${esc(tailorNote(n.unit, profile))}</title>${svgText(x, top - 22, [tx], { size: 9, weight: 800, fill: tc, mono: true })}</g>`;
            }
            if (sel?.k === "walk" && walkHit(cur, sel.i, n)) h += `<rect x="${x - NW / 2 - 6}" y="${top - 6}" width="${NW + 12}" height="${NH + 12}" rx="16" fill="none" stroke="#e91e63" stroke-width="3" stroke-dasharray="6 4" class="walk-ring"/>`;
            if (layers.outputs) {
              const items = nodeArts(cur, n).filter((x) => (n.io === "entry" ? x.role === "uses" : x.role === "produces"));
              aCells[i] = items;
              const label = n.io === "entry" ? "IN" : "OUT";
              if (items.length) {
                h += svgText(x, yOut - 4, [label], { size: 9, weight: 700, fill: "#8a8e8f", mono: true });
                const w = Math.min(NW + 10, 170), maxc = Math.floor((w - 20) / 5.6);
                items.slice(0, 3).forEach((it, k) => {
                  const on = sel?.k === "art" && sel.id === it.id, y = yOut + 12 + k * 15, t = it.name.length > maxc ? it.name.slice(0, maxc - 1) + "…" : it.name;
                  h += `<g class="ai ${on ? "on" : ""}" data-ai="${i}:${k}"><title>Artifact: ${esc(it.name)}</title><rect x="${x - w / 2}" y="${y - 10}" width="${w}" height="14" rx="4" fill="${on ? "#0d1117" : "#fff"}" stroke="${on ? "#0d1117" : "rgba(0,0,0,.18)"}"/>${svgText(x - w / 2 + 6, y + 1, ["▤ " + t], { anchor: "start", size: 9.5, weight: 600, fill: on ? "#fff" : "#1c1b1b", halo: false })}</g>`;
                });
                if (items.length > 3) h += svgText(x, yOut + 12 + 3 * 15, [`+${items.length - 3} more — click the node`], { size: 9.5, fill: "#8a8e8f" });
              }
            }
          });
          if (know.size) {
            h += svgText(12, yKn - 20, ["KNOWLEDGE IN THE FLOW · " + KN_KEYS.filter((t) => know.has(t)).map((t) => KN_NAME[t].toUpperCase()).join(" · ")], { anchor: "start", size: 9.5, weight: 700, fill: "#6d48d8", mono: true });
            h += `<line x1="12" x2="${W - 12}" y1="${yKn - 14}" y2="${yKn - 14}" stroke="rgba(109,72,216,.18)"/>`;
            const w = Math.min(NW + 10, 170), maxc = Math.floor((w - 18) / 5.7);
            kItems.forEach((items, i) => {
              if (!items.length) return;
              h += `<line x1="${nx(i)}" x2="${nx(i)}" y1="${bot + 4}" y2="${yKn - 12}" stroke="rgba(109,72,216,.16)" stroke-dasharray="2 3"/>`;
              items.slice(0, 6).forEach((it, r) => {
                const y = yKn + r * 18, on = sel?.k === "kn" && sel.name === it.name, c = KN_COLOR(it.type);
                const label = it.name.length > maxc ? it.name.slice(0, maxc - 1) + "…" : it.name;
                h += `<g class="ki ${on ? "on" : ""}" data-ki="${i}:${r}"><title>${esc(KN_SING[it.type])}: ${esc(it.name)}</title><rect x="${nx(i) - w / 2}" y="${y - 11}" width="${w}" height="16" rx="8" fill="${on ? c : "#fff"}" stroke="${c}" stroke-width="${on ? 2 : 1.2}"/><circle cx="${nx(i) - w / 2 + 9}" cy="${y - 3}" r="3.2" fill="${on ? "#fff" : c}"/>${svgText(nx(i) - w / 2 + 17, y + 1, [label], { anchor: "start", size: 9.5, weight: 700, fill: on ? "#fff" : "#1c1b1b", halo: false })}</g>`;
              });
              if (items.length > 6) h += svgText(nx(i), yKn + 6 * 18, [`+${items.length - 6} more — click the node`], { size: 9.5, fill: "#8a8e8f" });
            });
          }
          if (lensOn.size) {
            h += svgText(12, yLz - 20, ["LENSES IN THE FLOW · " + LGROUPS.filter((g) => lensOn.has(g)).map((g) => g.toUpperCase()).join(" · ") + "   ●  filled = required   ○  outlined = applicable"], { anchor: "start", size: 9.5, weight: 700, fill: "#0d1117", mono: true });
            h += `<line x1="12" x2="${W - 12}" y1="${yLz - 14}" y2="${yLz - 14}" stroke="rgba(13,17,23,.12)"/>`;
            const w = Math.min(NW + 10, 170), maxc = Math.floor((w - 18) / 5.7);
            lItems.forEach((items, i) => {
              if (!items.length) return;
              h += `<line x1="${nx(i)}" x2="${nx(i)}" y1="${bot + 4}" y2="${yLz - 12}" stroke="rgba(13,17,23,.1)" stroke-dasharray="2 3"/>`;
              items.slice(0, 6).forEach((it, r) => {
                const lens = lensById[it.id], c = LG_COLOR[lens.g], y = yLz + r * 18, on = sel?.k === "lens" && sel.id === it.id, fillc = on ? "#0d1117" : it.req ? c : "#fff";
                const nm = lens.n.length > maxc ? lens.n.slice(0, maxc - 1) + "…" : lens.n;
                h += `<g class="li ${on ? "on" : ""}" data-li="${i}:${r}"><title>${esc(lens.g)} lens: ${esc(lens.n)} (${it.req ? "required" : "applicable"})${it.note ? " — " + esc(it.note) : ""}</title><rect x="${nx(i) - w / 2}" y="${y - 11}" width="${w}" height="16" rx="8" fill="${fillc}" stroke="${on ? "#0d1117" : c}" stroke-width="1.3"/>${svgText(nx(i) - w / 2 + 9, y + 1, [nm], { anchor: "start", size: 9.5, weight: 700, fill: on || it.req ? "#fff" : "#1c1b1b", halo: false })}</g>`;
              });
              if (items.length > 6) h += svgText(nx(i), yLz + 6 * 18, [`+${items.length - 6} more — click the node`], { size: 9.5, fill: "#8a8e8f" });
            });
          }
          if (layers.lenses) {
            const EXc = C(cur, "execution");
            const kTypes = M.contract.find((c) => c.id === "knowledge").fields;
            const WF = cur.wf;
            const rows = WF ? [
              ["wf", "ACTORS", arr(WF.actors), "#0d1117", 700],
              ["wf", "DECISIONS", arr(WF.decisions), "#c2410c", 600],
              ["wf", "BRANCHES", arr(WF.branches), "#0284c7", 600],
              ["wf", "RECOVERY", arr(WF.recovery), "#c49000", 600],
              ["wf", "TRACEABILITY · LEARNING", [...arr(WF.traceability), ...arr(WF.learning)], "#6d48d8", 600],
            ] : [
              ["lenses", "REQUIRED LENSES", lensNames(cur, "required"), "#008080", 700],
              ["lenses", "APPLICABLE LENSES", lensNames(cur, "applicable"), "#5b5f60", 600],
              ["lenses", "CONCERNS · CONSTRAINTS", [...arr(LN.concerns), ...arr(LN.constraints)], "#c2410c", 600],
              ["knowledge", "KNOWLEDGE", kTypes.filter(([k]) => arr(KN[k]).length).map(([k, n]) => n + ": " + arr(KN[k]).join(", ")), "#6d48d8", 600],
              ["exec", "AGENTS · TOOLS", [...arr(EXc.agents), ...arr(EXc.tools)], "#0d1117", 600],
            ];
            rows.forEach(([key, label, items, color, wt], r) => {
              const y = yLens + r * 18, on = sel?.k === key;
              const line = (label + "   " + (items.join("  ·  ") || "—"));
              h += `<g class="lane ${on ? "on" : ""}" data-lane="${key}"><rect x="12" y="${y - 12}" width="${W - 24}" height="17" rx="5" fill="${on ? "rgba(0,128,128,.08)" : "transparent"}"/>${svgText(24, y, [line.length > 210 ? line.slice(0, 209) + "…" : line], { anchor: "start", size: 10.5, weight: wt, fill: color })}</g>`;
            });
          }
          if (layers.tracks) {
            M.tracks.forEach((T, r) => {
              const y = yTr + r * 30, on = sel?.k === "track" && sel.id === T.id;
              h += `<g class="trk ${on ? "on" : ""}" data-track="${T.id}"><rect x="12" y="${y - 22}" width="${W - 24}" height="28" rx="6" fill="${on ? "rgba(0,0,0,.05)" : "transparent"}"/><line x1="12" x2="${W - 12}" y1="${y}" y2="${y}" stroke="${T.c}" stroke-opacity=".35" stroke-width="2"/>${svgText(14, y - 10, [T.name.toUpperCase()], { anchor: "start", size: 8.5, weight: 700, fill: T.c, mono: true })}`;
              nodes.forEach((n, i) => {
                const v = trackCell(cur, n, T.id); if (!v) return;
                const w = Math.min(NW + 6, 160), t = v.length > Math.floor(w / 5.8) ? v.slice(0, Math.floor(w / 5.8) - 1) + "…" : v;
                h += `<rect x="${nx(i) - w / 2}" y="${y - 8}" width="${w}" height="16" rx="8" fill="#fff" stroke="${T.c}" stroke-width="1.2"/>${svgText(nx(i), y + 4, [t], { size: 9.5, weight: 700, fill: "#1c1b1b", halo: false })}`;
              });
              h += "</g>";
            });
          }
          return `<svg class="rmap" viewBox="0 0 ${W} ${H}" role="img" aria-label="Flow map of ${esc(cur.title)}">${h}</svg>`;
        };

        /* ---- delivery-system view: tracks as lanes, backlogs between them, flows and cadences ---- */
        const LANES = { disc: [64, "discovery"], bl: [232, null], del: [400, "delivery"], run: [568, "run"] };
        const SYS_POS = { opportunity: [150, "disc"], discover: [400, "disc"], plan: [660, "disc"], design: [930, "disc"],
          improvement: [150, "bl"], portfolio: [400, "bl"], product: [660, "bl"], dor: [930, "bl"], iteration: [1200, "bl"],
          build: [1210, "del"], verify: [960, "del"], dod: [680, "del"], release: [440, "del"],
          evolve: [150, "run"], operate: [440, "run"], problem: [880, "run"] };
        const buildSys = () => {
          const W = 1400, H = 740, on = sel?.k === "sys" ? sel.t : "";
          const P = (id) => { const [x, ln] = SYS_POS[id], k = SYS_ITEMS[id].kind; const [hw, hh] = k === "gate" ? [32, 32] : k === "bl" ? [92, 32] : k === "side" ? [72, 26] : [76, 26]; return { x, y: LANES[ln][0] + 92, hw, hh, ln }; };
          let h = `<defs>${Object.entries(SYS_FC).map(([k, c]) => `<marker id="${uid}-s${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join("")}</defs>`;
          // cadence ribbon
          h += svgText(14, 30, ["CADENCES"], { anchor: "start", size: 9.5, weight: 700, fill: "#6d48d8", mono: true });
          let cx = 100;
          SYS.cadences.forEach((c) => { const label = `${c.name} · ${c.every.split(" ")[0].toLowerCase()}`, w = label.length * 6.2 + 20, sOn = on === "cad:" + c.id;
            h += `<g class="sy" data-sys="cad:${c.id}"><rect x="${cx}" y="14" width="${w}" height="24" rx="12" fill="${sOn ? "#6d48d8" : "#fff"}" stroke="#6d48d8" stroke-opacity="${sOn ? 1 : 0.45}"/>${svgText(cx + w / 2, 30, [label], { size: 10.5, weight: 700, fill: sOn ? "#fff" : "#1c1b1b", halo: false })}</g>`; cx += w + 8; });
          // lanes
          Object.entries(LANES).forEach(([ln, [y0, tid]]) => {
            const T = tid ? SYS_TRACK[tid] : null, c = T ? T.c : "#0d1117", key = T ? "track:" + tid : "bl:product", sOn = T && on === key;
            h += `<g class="sy lane-b" data-sys="${T ? key : "levels:all"}"><rect x="8" y="${y0}" width="${W - 16}" height="160" rx="16" fill="${c}" fill-opacity="${sOn ? 0.12 : 0.045}" stroke="${c}" stroke-opacity="${sOn ? 0.6 : 0.14}" ${T ? "" : 'stroke-dasharray="5 5"'}/>
              ${svgText(W - 24, y0 + 20, [T ? `${T.name.toUpperCase()} — ${T.q}` : "BACKLOGS — three levels, linked parent to child, plus side backlogs"], { anchor: "end", size: 10, weight: 700, fill: c, mono: true })}</g>`;
          });
          // flows
          SYS.flows.forEach((f, i) => {
            const a = P(f.f), b = P(f.t), c = SYS_FC[f.ty], sOn = on === "flow:" + i;
            let d, mx, my;
            if (a.ln === b.ln) {
              if (f.ty === "rework") { const dy = a.y + a.hh + 44; d = `M${a.x},${a.y + a.hh} C${a.x},${dy} ${b.x},${dy} ${b.x},${b.y + b.hh}`; mx = (a.x + b.x) / 2; my = dy - 8; }
              else { const s = Math.sign(b.x - a.x); d = `M${a.x + s * a.hw},${a.y} L${b.x - s * b.hw},${b.y}`; mx = (a.x + b.x) / 2; my = a.y - 7; }
            } else {
              const down = b.y > a.y, sx = Math.abs(a.x - b.x) > 40 ? Math.sign(b.x - a.x) : 0;
              const x1 = a.x + sx * a.hw * 0.45, y1 = down ? a.y + a.hh : a.y - a.hh, x2 = b.x - sx * b.hw * 0.45, y2 = down ? b.y - b.hh : b.y + b.hh, ym = (y1 + y2) / 2;
              d = `M${x1},${y1} C${x1},${ym} ${x2},${ym} ${x2},${y2}`;
              // diagonal flows cross mid-way, so label them a third of the way from their source
              const tt = 0.3, bz = (p0, p1, p2, p3) => (1 - tt) ** 3 * p0 + 3 * (1 - tt) ** 2 * tt * p1 + 3 * (1 - tt) * tt ** 2 * p2 + tt ** 3 * p3;
              mx = bz(x1, x1, x2, x2) - (sx ? 0 : 8); my = bz(y1, ym, ym, y2) + 3;
            }
            const dash = f.ty === "feedback" || f.ty === "alternate" ? ' stroke-dasharray="6 4"' : f.ty === "rework" ? ' stroke-dasharray="3 3"' : "";
            h += `<g class="sy sflow-g ${sOn ? "on" : ""}" data-sys="flow:${i}"><path d="${d}" fill="none" stroke="${c}" stroke-width="${sOn ? 3.2 : 1.8}"${dash} marker-end="url(#${uid}-s${f.ty})"/><path d="${d}" class="hit2"/>
              ${svgText(mx, my, [f.n], { size: 9.5, weight: 700, fill: c, anchor: Math.abs(a.x - b.x) <= 40 && a.ln !== b.ln ? "end" : "middle" })}</g>`;
          });
          // nodes
          Object.keys(SYS_POS).forEach((id) => {
            const p = P(id), it = SYS_ITEMS[id], key = `${it.kind}:${id}`, sOn = on === key || (on.startsWith("cad:") && SYS.cadences.find((c) => "cad:" + c.id === on)?.at === id);
            if (it.kind === "act") {
              const s = it.o, T = trackOfAct(id), c = T.c, open = s.status !== "placeholder";
              h += `<g class="sy" data-sys="${key}" tabindex="0" role="button" aria-label="${esc(s.key)}"><rect x="${p.x - p.hw}" y="${p.y - p.hh}" width="${p.hw * 2}" height="${p.hh * 2}" rx="14" fill="${sOn ? c : "#fff"}" stroke="${c}" stroke-width="${sOn ? 3 : 1.8}"/>
                <text x="${p.x}" y="${p.y - p.hh - 7}" text-anchor="middle" font-size="9.5" font-weight="700" letter-spacing="1" fill="${c}">${ROMAN[s.si]}${open ? " · " + s.status.toUpperCase() : ""}</text>
                ${svgText(p.x, p.y + 4, [s.key], { size: 12.5, weight: 800, fill: sOn ? "#fff" : "#040505", halo: false })}</g>`;
            } else if (it.kind === "bl") {
              const B = it.o;
              h += `<g class="sy" data-sys="${key}" tabindex="0" role="button" aria-label="${esc(B.name)}">${[8, 4, 0].map((o) => `<rect x="${p.x - p.hw + o}" y="${p.y - p.hh - o}" width="${p.hw * 2}" height="${p.hh * 2}" rx="10" fill="${o ? "#f4f2ef" : sOn ? "#0d1117" : "#fff"}" stroke="#0d1117" stroke-opacity="${o ? 0.25 : 0.85}" stroke-width="${sOn && !o ? 2.5 : 1.3}"/>`).join("")}
                ${svgText(p.x, p.y - 4, [B.name], { size: 12, weight: 800, fill: sOn ? "#fff" : "#040505", halo: false })}${svgText(p.x, p.y + 12, [`${B.item} · ${B.prefix}`], { size: 9.5, weight: 600, fill: sOn ? "#e8e8e8" : "#5b5f60", halo: false })}
                <text x="${p.x - p.hw}" y="${p.y - p.hh - 12}" font-size="9" font-weight="700" letter-spacing="1" fill="#0d1117" font-family="Geist Mono, monospace">${B.level.toUpperCase()}</text></g>`;
            } else if (it.kind === "side") {
              const B = it.o, c = SYS_TRACK[B.track].c;
              h += `<g class="sy" data-sys="${key}" tabindex="0" role="button" aria-label="${esc(B.name)}"><rect x="${p.x - p.hw}" y="${p.y - p.hh}" width="${p.hw * 2}" height="${p.hh * 2}" rx="10" fill="${sOn ? c : "#fff"}" stroke="${c}" stroke-dasharray="4 3" stroke-width="${sOn ? 2.5 : 1.5}"/>${svgText(p.x, p.y + 4, wrap(B.name, 18).slice(0, 1), { size: 10.5, weight: 800, fill: sOn ? "#fff" : "#1c1b1b", halo: false })}</g>`;
            } else {
              const G = it.o;
              h += `<g class="sy" data-sys="${key}" tabindex="0" role="button" aria-label="${esc(G.name)}"><path d="M${p.x},${p.y - p.hh} L${p.x + p.hw},${p.y} L${p.x},${p.y + p.hh} L${p.x - p.hw},${p.y} Z" fill="${sOn ? "#008080" : "#0d1117"}"/>
                <text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" letter-spacing="1">${id.toUpperCase()}</text>${svgText(p.x, p.y + p.hh + 14, [G.name], { size: 10, weight: 800, fill: "#040505" })}</g>`;
            }
          });
          return `<svg class="rmap" viewBox="0 0 ${W} ${H}" role="img" aria-label="Delivery system map">${h}</svg>`;
        };

        /* ---- sprint timeline: the tracks run at the same time, offset by a sprint ---- */
        const buildTimeline = () => {
          const TL = SYS.timeline, W = 1400, x0 = 200, cw = (W - x0 - 20) / TL.cols.length, y0 = 56, rh = 168, H = y0 + TL.rows.length * rh + 46, on = sel?.k === "sys" ? sel.t : "";
          const cell = (r, c) => ({ x: x0 + c * cw + 14, y: y0 + r * rh + 14, w: cw - 28, h: rh - 40 });
          let h = `<defs><marker id="${uid}-tl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#8a8e8f"/></marker></defs>`;
          TL.cols.forEach((c, i) => { h += svgText(x0 + i * cw + cw / 2, 34, [c.toUpperCase()], { size: 11, weight: 800, fill: "#040505", mono: true }); if (i) h += `<line x1="${x0 + i * cw}" x2="${x0 + i * cw}" y1="44" y2="${H - 40}" stroke="rgba(0,0,0,.08)" stroke-dasharray="3 4"/>`; });
          TL.rows.forEach((r, ri) => {
            const T = SYS_TRACK[r.track];
            h += `<g class="sy" data-sys="track:${T.id}"><rect x="8" y="${y0 + ri * rh + 6}" width="${W - 16}" height="${rh - 24}" rx="14" fill="${T.c}" fill-opacity=".05"/>${svgText(22, y0 + ri * rh + 40, [T.name.toUpperCase()], { anchor: "start", size: 10, weight: 800, fill: T.c, mono: true })}${svgText(22, y0 + ri * rh + 58, wrap(T.q, 24), { anchor: "start", size: 10.5, weight: 600, fill: "#5b5f60", lh: 13 })}</g>`;
          });
          // offset arrows: track A in sprint n → track B in sprint n+1
          TL.links.forEach(([fa, fb, label]) => {
            const ra = TL.rows.findIndex((r) => r.track === fa), rb = TL.rows.findIndex((r) => r.track === fb);
            // route through the gap between columns so arrows never cross a cell
            for (let c = 0; c < TL.cols.length - 1; c++) {
              const A = cell(ra, c), B = cell(rb, c + 1), up = rb < ra, xg = x0 + (c + 1) * cw + (up ? 7 : -7);
              const y1 = A.y + A.h * (up ? 0.3 : 0.7), y2 = B.y + B.h * (up ? 0.7 : 0.3);
              h += `<path d="M${A.x + A.w},${y1} L${xg},${y1} L${xg},${y2} L${B.x},${y2}" fill="none" stroke="${SYS_TRACK[fa].c}" stroke-opacity=".6" stroke-width="1.6" stroke-linejoin="round" stroke-dasharray="${up ? "5 4" : "0"}" marker-end="url(#${uid}-tl)"/>`;
              // label in the gap between rows, beside the gutter
              if (c === 0) h += svgText(xg + (up ? 6 : -6), y0 + Math.max(ra, rb) * rh - 3, [label], { size: 9.5, weight: 700, fill: SYS_TRACK[fa].c, anchor: up ? "start" : "end" });
            }
          });
          TL.rows.forEach((r, ri) => r.cells.forEach((tx, ci) => {
            const C2 = cell(ri, ci), T = SYS_TRACK[r.track], sOn = on === `cell:${ri}:${ci}`, lines = [];
            String(tx).split(" ").forEach((w) => { const l = lines[lines.length - 1]; if (!l || (l + " " + w).length > Math.floor((C2.w - 24) / 6.9)) lines.push(w); else lines[lines.length - 1] = l + " " + w; });
            h += `<g class="sy" data-sys="cell:${ri}:${ci}" tabindex="0" role="button"><rect x="${C2.x}" y="${C2.y}" width="${C2.w}" height="${C2.h}" rx="12" fill="${sOn ? T.c : "#fff"}" stroke="${T.c}" stroke-opacity="${sOn ? 1 : 0.5}" stroke-width="${sOn ? 2.5 : 1.3}"/>
              ${svgText(C2.x + 12, C2.y + 22, lines.slice(0, 5), { anchor: "start", size: 11, weight: 600, fill: sOn ? "#fff" : "#1c1b1b", lh: 15, halo: false })}</g>`;
          }));
          h += svgText(20, H - 14, [TL.note.length > 200 ? TL.note.slice(0, 199) + "…" : TL.note], { anchor: "start", size: 10.5, weight: 600, fill: "#5b5f60" });
          return `<svg class="rmap" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sprint timeline">${h}</svg>`;
        };

        const drawDetail = () => {
          const mm = mapModel(cur);
          const sh = box.querySelector(".kn-sheet");
          if (sheet && ["kn", "lens", "art", "role", "prompt"].includes(sel?.k) && mm) { sh.hidden = false; sh.innerHTML = `<div class="fade">${sel.k === "kn" ? knSheet(cur, mm, sel, true) : sel.k === "lens" ? lensSheet(cur, mm, sel, true) : sel.k === "role" ? roleSheet(cur, mm, sel, true) : sel.k === "prompt" ? kitCard(UNITS[sel.fid], sel.tab, true) : artSheet(cur, mm, sel, true)}</div>`; } else { sheet = false; sh.hidden = true; sh.innerHTML = ""; }
          const sysv = cur === ROOT && view !== "chain";
          box.querySelector(".detail").innerHTML = `<div class="fade">${sysv && (!sel || sel.k === "sys") ? sysDetail(sel) : detailHTML(cur, mm, sel, mode)}</div>`;
        };
        const draw = (detail = true) => {
          box.classList.toggle("fs", fs);
          const mm = mapModel(cur);
          box.querySelector(".mx-head").innerHTML = head();
          const sysv = cur === ROOT && view !== "chain"; box.classList.toggle("sysv", sysv);
          box.querySelector(".mx-tools > .seg").innerHTML = SCEN.map(([k, n, ic, c]) => `<button role="radio" aria-checked="${scen === k}" data-scen="${k}" style="--c:${c}"><span class="ms">${ic}</span>${n}</button>`).join("");
          {
            const mmK = mapModel(cur), counts = {};
            if (mmK) mmK.nodes.forEach((n) => nodeKnow(cur, n).forEach((x) => { (counts[x.type] = counts[x.type] || new Set()).add(x.name); }));
            box.querySelector(".kts").innerHTML = KN_KEYS.map((t) => ddItem({ on: know.has(t), attr: `data-kt="${t}"`, color: KN_COLOR(t), label: KN_NAME[t], count: counts[t] ? counts[t].size : 0, off: !counts[t] })).join("") + ddFoot("kt-all", know.size);
            ddCount("kts", know.size ? `${know.size}` : "Off", know.size > 0);
          }
          {
            const mmL = mapModel(cur), byG = {};
            if (mmL) mmL.nodes.forEach((n) => nodeLens(cur, n).forEach((x) => { const g = lensById[x.id]?.g; if (g) (byG[g] = byG[g] || new Set()).add(x.id); }));
            box.querySelector(".lgs").innerHTML = LGROUPS.map((g) => ddItem({ on: lensOn.has(g), attr: `data-lg="${g}"`, color: LG_COLOR[g], label: g, count: byG[g] ? byG[g].size : 0, off: !byG[g] })).join("") + ddFoot("lg-all", lensOn.size);
            ddCount("lgs", lensOn.size ? `${lensOn.size}` : "Off", lensOn.size > 0);
          }
          {
            const T = cur === ROOT ? null : (STAGES[cur.si] || {}).tailoring, pr = box.querySelector(".mx-prof");
            pr.hidden = !T;
            if (T) {
              pr.querySelector(".profs").innerHTML = M.profiles.map((p) => `<button role="radio" aria-checked="${profile === p.id}" data-prof="${p.id}" style="--c:${p.id === "light" ? "#c49000" : p.id === "rigorous" ? "#e91e63" : "#008080"}"><span class="ms">${p.icon}</span>${p.name}</button>`).join("");
              pr.querySelector(".prof-when").textContent = (T[profile] || {}).when || "";
            }
          }
          const nLy = LAYERS.filter(([k]) => layers[k]).length, nRt = Object.values(routesOn).filter(Boolean).length;
          box.querySelector(".layers").innerHTML = LAYERS.map(([k, n, ic]) => ddItem({ on: !!layers[k], attr: `data-ly="${k}"`, icon: ic, label: n })).join("") + ddFoot("ly-all", nLy === LAYERS.length);
          ddCount("layers", `${nLy}/${LAYERS.length}`, true);
          box.querySelector(".toggles").innerHTML = Object.keys(routesOn).map((k) => ddItem({ on: routesOn[k], attr: `data-rt="${k}"`, color: RC(k), label: M.routes[k].label, line: true })).join("") + ddFoot("rt-all", nRt === Object.keys(routesOn).length);
          ddCount("toggles", `${nRt}/${Object.keys(routesOn).length}`, true);
          const K = C(cur, "cases"), sc = SCEN.find((x) => x[0] === scen);
          const profHit = cur === ROOT ? null : ancestors(cur).map((x) => [x, tailorNote(x, profile)]).filter(([, t]) => t).pop();
          const profBanner = profHit && profile !== "standard" ? `<div class="sb" style="--c:${profile === "light" ? "#c49000" : "#e91e63"}"><span class="lbl"><span class="ms">tune</span>${cap(profile)} profile · ${esc(profHit[0].short)}</span><span>${esc(profHit[1])}</span></div>` : "";
          box.querySelector(".scen-banner").innerHTML = profBanner + (scen === "all" ? "" : `<div class="sb" style="--c:${sc[3]}"><span class="lbl"><span class="ms">${sc[2]}</span>${sc[1]}</span>${arr(K[scen]).length ? `<ul>${arr(K[scen]).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : `<span class="nd">Not yet defined for this ${cur === ROOT ? "map" : cur.kind}.</span>`}<em>${scen === "edgeCases" ? "Edge cases mostly affect entry conditions — the Entry node is ringed." : sc[4].length ? "Highlighted on the map: " + sc[4].map((t) => M.routes[t].label).join(", ") + " paths and gate branches." : ""}</em></div>`);
          const mb = box.querySelector(".mapbox"), mf = box.querySelector(".map-foot");
          if (sysv) {
            box.querySelector(".scen-banner").innerHTML = "";
            mb.innerHTML = view === "system" ? buildSys() : buildTimeline();
            mf.innerHTML = view === "system" ? `<div class="sys-legend">${Object.entries(SYS_FC).map(([k, c]) => `<span style="--c:${c}"><i></i>${SYS_FL[k]}</span>`).join("")}<span><b class="stk"></b>Backlog level</span><span><b class="dia"></b>Ready / Done</span><span><b class="side"></b>Side backlog</span></div>` : "";
          } else if (!mm) {
            const next = PLURAL[KIND[cur.level + 1]] || "children";
            mb.innerHTML = `<div class="map-empty"><span class="ms">construction</span><b>No ${next} authored yet</b><span>${esc(cur.title)} will be broken into ${next} in a later step. Its contract is in the panel.</span></div>`;
            mf.innerHTML = "";
          } else {
            mb.innerHTML = build(mm);
            const named = mm.edges.map((e, i) => ({ e, i })).filter(({ e }) => e.n && !e.cyc && routesOn[e.ty]);
            mf.innerHTML = named.length ? `<div class="grid g3">${named.map(({ e, i }) => `<button class="loop ${sel?.k === "e" && sel.i === i ? "hl" : ""}" style="--c:${RC(e.ty)};opacity:${relevant(e.ty) ? 1 : 0.35}" data-e="${i}"><i></i><b>${esc(e.n)}</b><span>${esc(mm.nodes[e.f].label)} → ${typeof e.t === "number" ? esc(mm.nodes[e.t].label) : e.t.toUpperCase()}</span></button>`).join("")}</div>` : "";
          }
          if (detail) drawDetail();
        };
        const drill = (i) => {
          const n = mapModel(cur)?.nodes[i]; if (!n || !n.unit) return;
          if (mode === "explore" || fs) { if (kids(n.unit).length || mode === "explore") { cur = n.unit; sel = hs = hl = null; draw(); if (mode === "explore") history.replaceState(null, "", "#/map/" + cur.fid); return; } }
          if (pageOf(n.unit)) go(pageOf(n.unit));
        };
        const select = (s) => { sel = s && sel && s.k === sel.k && s.i === sel.i && s.t === sel.t && s.name === sel.name && s.id === sel.id ? null : s; draw(); };
        box.addEventListener("click", (e) => {
          const t = e.target;
          if (t.closest("[data-act=fs]")) { setFs(!fs); return; }
          if (t.closest("[data-act=walk]")) { sel = sel?.k === "walk" ? null : { k: "walk", i: 0 }; draw(); return; }
          const wk = t.closest("[data-walk]"); if (wk) { const v = wk.dataset.walk; sel = v === "x" ? null : { k: "walk", i: Math.max(0, Math.min((cur.walkthrough || []).length - 1, sel.i + +v)) }; draw(); return; }
          const pf = t.closest("[data-prof]"); if (pf) { profile = pf.dataset.prof; store.set("node-map-profile", profile); draw(false); return; }
          const rs = t.closest("[data-rolesel]"); if (rs) { sel = { k: "role", id: rs.dataset.rolesel }; draw(); return; }
          const tk = t.closest("[data-track]"); if (tk) { select({ k: "track", id: tk.dataset.track }); return; }
          if (t.closest(".qopt")) return;
          const cp = t.closest("[data-act=art-copy]"); if (cp) { const md = artToMd(cp.dataset.id); const done = () => { const tag = cp.parentElement.querySelector(".at-copied"); if (tag) { tag.hidden = false; setTimeout(() => (tag.hidden = true), 1500); } }; try { navigator.clipboard.writeText(md).then(done, done); } catch { done(); } return; }
          if (t.closest("[data-act=sheet]")) { sheet = true; drawDetail(); box.querySelector(".kn-sheet").scrollTop = 0; return; }
          if (t.closest("[data-act=sheet-close]")) { sheet = false; drawDetail(); return; }
          const sc = t.closest("[data-scen]"); if (sc) { scen = sc.dataset.scen; draw(); return; }
          const kt = t.closest("[data-kt]"); if (kt) { const ty = kt.dataset.kt; know.has(ty) ? know.delete(ty) : know.add(ty); store.set("node-map-know", [...know]); draw(false); return; }
          const ka = t.closest("[data-kt-all]"); if (ka) { if (ka.dataset.ktAll === "0") know.clear(); else KN_KEYS.forEach((x) => know.add(x)); store.set("node-map-know", [...know]); if (sel?.k === "kn") sel = null; draw(); return; }
          const kc = t.closest("[data-knsel]"); if (kc) { const [type, ...rest] = kc.dataset.knsel.split("|"); sel = { k: "kn", name: rest.join("|"), type }; draw(); return; }
          const lg = t.closest("[data-lg]"); if (lg) { const g = lg.dataset.lg; lensOn.has(g) ? lensOn.delete(g) : lensOn.add(g); store.set("node-map-lens", [...lensOn]); draw(false); return; }
          const lga = t.closest("[data-lg-all]"); if (lga) { if (lga.dataset.lgAll === "0") lensOn.clear(); else LGROUPS.forEach((g) => lensOn.add(g)); store.set("node-map-lens", [...lensOn]); if (sel?.k === "lens") sel = null; draw(); return; }
          const li = t.closest("[data-li]"); if (li) { const [ci, ri] = li.dataset.li.split(":").map(Number); const it = (lCells[ci] || [])[ri]; if (it) select({ k: "lens", id: it.id }); return; }
          const ai = t.closest("[data-ai]"); if (ai) { const [ci, ri] = ai.dataset.ai.split(":").map(Number); const it = (aCells[ci] || [])[ri]; if (it) select({ k: "art", id: it.id }); return; }
          const as = t.closest("[data-artsel]"); if (as) { sel = { k: "art", id: as.dataset.artsel }; draw(); return; }
          const lc = t.closest("[data-lensel]"); if (lc) { sel = { k: "lens", id: lc.dataset.lensel }; draw(); return; }
          const ki = t.closest("[data-ki]"); if (ki) { const [ci, ri] = ki.dataset.ki.split(":").map(Number); const it = (kCells[ci] || [])[ri]; if (it) select({ k: "kn", name: it.name, type: it.type }); return; }
          const ly = t.closest("[data-ly]"); if (ly) { layers[ly.dataset.ly] = !layers[ly.dataset.ly]; store.set("node-map-layers", layers); draw(false); return; }
          const lya = t.closest("[data-ly-all]"); if (lya) { LAYERS.forEach(([k]) => (layers[k] = lya.dataset.lyAll === "1")); store.set("node-map-layers", layers); draw(false); return; }
          const tg = t.closest("[data-rt]"); if (tg) { routesOn[tg.dataset.rt] = !routesOn[tg.dataset.rt]; draw(false); return; }
          const rta = t.closest("[data-rt-all]"); if (rta) { Object.keys(routesOn).forEach((k) => (routesOn[k] = rta.dataset.rtAll === "1")); draw(false); return; }
          const d = t.closest("[data-drill]"); if (d) { drill(+d.dataset.drill); return; }
          const sx = t.closest("[data-sel]"); if (sx) { const [k, i] = sx.dataset.sel.split(":"); sel = { k, i: +i }; draw(); return; }
          const ktab = t.closest("[data-kittab]"); if (ktab && sel?.k === "prompt") { sel = { ...sel, tab: ktab.dataset.kittab }; drawDetail(); return; }
          if (t.closest("[data-act=file-copy]")) return;
          const pp = t.closest("[data-prompt]"); if (pp) { sel = { k: "prompt", fid: pp.dataset.prompt }; draw(); return; }
          const scb = t.closest("[data-scale]"); if (scb) { store.set("node-scale", scb.dataset.scale); drawDetail(); return; }
          if (t.closest("[data-act=pr-copy]")) return;
          const vw = t.closest("[data-view]"); if (vw) { view = vw.dataset.view; store.set("node-map-view", view); sel = null; draw(); return; }
          const sy = t.closest("[data-sys]"); if (sy) { select({ k: "sys", t: sy.dataset.sys }); return; }
          const g = t.closest(".sn"); if (g) { select({ k: "n", i: +g.dataset.n }); return; }
          const br = t.closest("[data-b]"); if (br) { select({ k: "b", t: br.dataset.b }); return; }
          const ed = t.closest("[data-e]"); if (ed) { select({ k: "e", i: +ed.dataset.e }); return; }
          const b = t.closest("[data-bar]"); if (b) { select({ k: b.dataset.bar }); return; }
          const ln = t.closest("[data-lane]"); if (ln) { select({ k: ln.dataset.lane }); return; }
          const pb = t.closest("[data-par]"); if (pb) { select({ k: "par" }); return; }
          const tb = t.closest("[data-go]");
          if (tb) { const u = tb.dataset.go === "" ? ROOT : UNITS[tb.dataset.go]; if (mode === "explore" || fs) { cur = u; sel = hs = hl = null; draw(); if (mode === "explore") history.replaceState(null, "", "#/map/" + u.fid); } else go(pageOf(u) || "map"); }
        });
        box.addEventListener("dblclick", (e) => { const g = e.target.closest(".sn"); if (g) drill(+g.dataset.n); });
        if (!window.__nodeDdClose) { window.__nodeDdClose = true; document.addEventListener("click", (e) => { const path = e.composedPath(); document.querySelectorAll("details.dd[open]").forEach((d) => { if (!path.includes(d)) d.open = false; }); }); } // the path is fixed at click time, so ticking an item (which redraws the list) doesn't count as "outside"
        box.addEventListener("keydown", (e) => {
          const od = box.querySelector(".dd[open]"); if (e.key === "Escape" && od) { e.stopPropagation(); od.open = false; od.querySelector("summary").focus(); return; }
          if (e.key === "Escape" && sheet) { e.stopPropagation(); sheet = false; drawDetail(); return; }
          if (e.key === "Escape" && fs) { e.stopPropagation(); setFs(false); return; }
          const g = e.target.closest(".sn"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select({ k: "n", i: +g.dataset.n }); }
          const sy = e.target.closest(".sy[data-sys]"); if (sy && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select({ k: "sys", t: sy.dataset.sys }); }
        });
        const mbx = box.querySelector(".mapbox");
        mbx.addEventListener("mouseover", (e) => {
          const g = e.target.closest(".sn"), a = e.target.closest(".hit");
          const ns = g ? +g.dataset.n : null, nl = !g && a ? +a.dataset.e : null;
          if (ns !== hs || nl !== hl) { hs = ns; hl = nl; draw(false); }
        });
        mbx.addEventListener("mouseleave", () => { if (hs !== null || hl !== null) { hs = hl = null; draw(false); } });
        document.documentElement.classList.toggle("map-fs", fs);
        draw();
      } };
  }

  /* headless API — other pages (e.g. the program overview) reuse the real model and generators */
  window.NODE_API = { UNITS, STAGES, SYS, PLEVEL, promptText, actKit, kids, stepsIn, cmdName, outOf, roleOfUnit };
  /* richer helpers for the reading guide (guide.js): the real maps, overlays and libraries the book draws from */
  window.NODE_BOOK = { ROOT, mapModel, C, arr, ownerOf, nodeKnow, nodeLens, nodeRoles, lensOfUnit, lensById, knowOf, kEntry, renderStructure, KN_KEYS, KN_NAME, KN_SING, KN_COLOR, LGROUPS, LG_COLOR, RLIB, roleIdsOf, ALIB, artId, teachOf, tailorOf, routeOf, SCEN, LAYERS, KIT_LAYERS, SCALES, unitKit, unitLabel };
  if (window.NODE_HEADLESS) return;

  /* ================= pages ================= */
  const R = {};
  const compose = (...parts) => ({ html: parts.map((p) => (typeof p === "string" ? p : p.html)).join(""), mount: (root) => parts.forEach((p) => p.mount && p.mount(root)) });

  R.cover = () => {
    const last = store.get("node-sdlc-last", null);
    const lp = last && pageIndex[last] > 0 ? PAGES[pageIndex[last]] : null;
    const parts = [[P1, "Part I · The Operating Model"], [P2, "Part II · The Acts"], [P3, "Part III · Mastery"]];
    return { bare: true, html: `<div class="cover dotgrid"><div class="glow"></div>
      <span class="lbl">${esc(RM.meta.program)} // Edition_${RM.meta.edition}</span>
      <h1>Idea to<br/><span>Evolution.</span></h1>
      <p>The model behind Node's project-based learning roadmap: how to think, decide, execute, validate and evolve software — applied to one real project, one unit at a time.</p>
      <div class="stats">
        <div><b>${STAGES.length}</b><span class="lbl">Acts</span></div>
        <div><b>${STAGES.reduce((a, s) => a + s.processes.length, 0)}</b><span class="lbl">Processes</span></div>
        <div><b>${Object.values(UNITS).filter((u) => u.level > 0 && isOpen(u)).length}</b><span class="lbl">Units authored</span></div>
        <div><b>${M.lenses.length}</b><span class="lbl">Lenses</span></div>
      </div>
      <div class="acts"><a class="btn pink" href="#/preface">Begin <span class="ms">arrow_forward</span></a><a class="btn ghost" href="/register"><span class="ms">how_to_reg</span>Enroll · ${esc(((window.NODE_OFFER || {}).fee || {}).amount || "PKR 5,000")}</a><a class="btn ghost" href="../course/index.html"><span class="ms">route</span>Course outline</a><a class="btn ghost" href="#/map"><span class="ms">account_tree</span>Lifecycle map</a>${lp ? `<a class="btn ghost" href="#/${lp.id}"><span class="ms">bookmark</span>${esc(lp.title)}</a>` : ""}</div>
    </div>
    <div class="contents">${parts.map(([k, name]) => `<div class="part"><span class="lbl">${name}</span>${PAGES.filter((p) => p.part === k && !p.sub).map((p) => `<a href="#/${p.id}"><span class="lbl">${p.num}</span>${esc(p.title)}${p.status && p.status !== "placeholder" ? ` <span class="badge ${p.status}" style="margin-left:auto;padding:1px 6px;font-size:8.5px">${p.status}</span>` : ""}</a>`).join("")}</div>`).join("")}</div>` };
  };

  R.preface = () => ({ html: `${header({ lbl: "Preface", h1: "An operating model, not a checklist.", p: "An end-to-end model for software delivery: from idea through production and continuous improvement." })}
    <div class="cols">
      <div class="blk">${sec("Learners finish understanding")}
        <div class="grid g2">${[["Why", "work happens"], ["What", "needs to happen"], ["How", "it happens"], ["Who", "performs it"], ["What can go wrong", ""], ["How decisions", "are made"], ["How quality", "is controlled"], ["What evidence", "is produced"], ["How work", "moves forward"], ["How the system", "evolves"]].map(([a, b], i) => `<div class="tile soft" style="--acc:${ACC[i % 3]}"><span class="lbl">${String(i + 1).padStart(2, "0")}</span><b>${a} <span style="font-weight:500;color:var(--muted)">${b}</span></b></div>`).join("")}</div>
      </div>
      <div class="blk">${sec("Philosophy")}
        <div class="dark"><span class="lbl">Principle</span><b style="display:block;font:900 20px var(--head);letter-spacing:-.03em;margin:4px 0">Reasoning before procedure.</b><p>For every unit: why it exists, what it needs and decides, what can invalidate the path, how work returns, who has authority.</p></div>
        <div class="sec lbl" style="margin-top:16px">One structure, four uses</div>
        <div class="grid g2">${[["Curriculum", "Learn it"], ["Reasoning framework", "Think with it"], ["Operating model", "Run delivery on it"], ["Reference system", "Return to it"]].map(([a, b]) => `<div class="tile"><b>${a}</b><p>${b}</p></div>`).join("")}</div>
        <div class="note" style="margin-top:12px">Turn pages with <b>← →</b>, search with <b>Ctrl K</b>, and mark pages as read. Progress is saved in this browser.</div>
      </div>
    </div>` });

  R["how-to-read"] = (param) => {
    let lv = Math.min(3, Math.max(0, +param || 0));
    return { html: `${header({ lbl: "Front matter", h1: "How to read this book.", p: "Each act goes four levels deep. Every level has the same flow map: click a node to go one level down." })}
      <div class="cols"><div class="blk">${sec("Four levels")}<div class="grid" id="lvls" role="tablist"></div>
        <div class="note" style="margin-top:12px;--nc:var(--pink)">Acts show <b>purpose, processes, outcomes and routing</b>. The full contract opens one section at a time inside each unit.</div></div>
        <div class="blk">${sec("Selected level")}<div class="dark" id="lvlPanel"></div></div></div>`,
      mount(root) {
        const draw = () => {
          $("#lvls", root).innerHTML = M.levels.map((l, i) => `<button class="lvl" role="tab" aria-selected="${i === lv}" style="--lc:${l.color};margin-left:${i * 12}px" data-i="${i}"><span class="n">0${i + 1}</span><span><b>${l.name}</b><span class="d">${l.desc}</span></span></button>`).join("");
          const L = M.levels[lv];
          const fields = L.contract === "workflow" ? M.workflow.map((f) => f[1]) : M.contract.map((c) => c.name);
          $("#lvlPanel", root).innerHTML = `<div class="fade" style="--lc:${L.color}"><span class="lbl" style="color:${L.color}">Level_0${lv + 1} // ${L.name}</span><p style="margin:6px 0 10px;color:rgba(255,255,255,.75)">${L.body}</p>
            ${M.example.map(([t, v], i) => `<div class="exrow ${i === lv ? "on" : ""}" style="margin-left:${i * 10}px"><span class="lbl">${t}</span>${esc(v)}</div>`).join("")}
            <div class="lbl" style="margin:12px 0 6px;color:rgba(255,255,255,.4)">${L.contract === "workflow" ? "Workflow contract" : "NODE contract"}</div><div class="chips">${fields.map((f) => `<span class="chip dk">${f}</span>`).join("")}</div></div>`;
        };
        $("#lvls", root).addEventListener("click", (e) => { const b = e.target.closest(".lvl"); if (b) { lv = +b.dataset.i; draw(); } });
        draw();
      } };
  };

  R.circuit = () => ({ html: `${header({ lbl: "Chapter 01 · Part I", h1: "The lifecycle circuit.", p: "Eight acts in one circuit — kinds of work that run continuously and in parallel, not phases on a calendar. Discovery and delivery run as two tracks joined by backlogs; work loops back when the evidence calls for it, and EVOLVE starts the next DISCOVER." })}
    ${sec("The acts")}
    <div class="grid g4">${STAGES.map((s, i) => `<a class="tile" style="--acc:${ACC[i % 3]}" href="#/act-${s.id}"><span class="lbl">${ROMAN[i]} · ${s.processes.length} processes ${s.status !== "placeholder" ? "· " + s.status : ""}</span><b>${s.key}</b><p>${esc(s.tagline)}</p></a>`).join("")}</div>
    <div class="cols">
      <div class="blk">${sec("Why this stage model")}
        <div class="grid g2">
          <div class="tile soft"><b>PLAN = commitment</b><p>Scope, estimates and funding come together here.</p></div>
          <div class="tile soft"><b>Retire inside EVOLVE</b><p>Sunsetting is a portfolio decision.</p></div>
          <div class="tile soft"><b>Continuous tracks</b><p>Some concerns never stop. They aren't stages.</p></div>
          <div class="tile soft"><b>A circuit, not a line</b><p>EVOLVE feeds DISCOVER. Rework links every act.</p></div>
        </div></div>
      <div class="blk">${sec("Kinds of work, not phases")}
        <p class="note" style="margin-bottom:10px">${esc(SYS.orderNote)}</p>
        <div class="grid g3">${(SYS.tracks || []).map((t) => `<a class="tile" style="--acc:${t.c}" href="#/map"><span class="lbl">${t.acts.map((a) => sysName(a)).join(" · ")}</span><b>${esc(t.name)}</b><p>${esc(t.q)} ${esc(t.cadence)}.</p></a>`).join("")}</div>
        <div class="grid g3" style="margin-top:8px">${(SYS.backlogs || []).map((b) => `<div class="tile soft"><span class="lbl">${esc(b.level)} · ${esc(b.horizon)}</span><b>${esc(b.name)}</b><p>${esc(b.holds)} — owned by ${esc(b.owner.join(", "))}.</p></div>`).join("")}</div></div>
      <div class="blk">${sec("Continuous tracks")}
        <div class="grid g2">${RM.tracks.map(([t, d]) => `<div class="tile dashed" style="--acc:var(--pink)"><b>${t}</b><p>${d}</p></div>`).join("")}</div></div>
    </div>` });

  R.map = (param) => {
    const start = (param && UNITS[param]) || ROOT;
    return compose(
      header({ lbl: "Chapter 02 · Part I", acc: "var(--orange)", h1: "Lifecycle map.", p: "How the acts run together: two tracks in parallel — discovery and delivery — joined by three levels of backlog, kept in step by cadences, with run & learn feeding both. Switch to Sprint timeline to see the overlap, or Logical order for the acts as a dependency chain. Click anything for details; open an act to drill into its own map." }),
      flowMap(start, "explore"),
      `<div class="cols" style="margin-top:14px"><div class="blk">${sec("Route types")}${Object.entries(M.routes).map(([k, r]) => `<div class="route" style="--rc:${r.c}"><span class="k"><span class="ms">${r.icon}</span>${r.label}</span><span>${({ forward: "Exit met: hand off to the next unit.", alternate: "A different valid path, such as a pivot or reframe.", rework: "Return to an earlier unit to correct it.", escalate: "Raise to someone with authority.", stop: "End deliberately and record the learning." })[k]}</span></div>`).join("")}</div>
      <div class="blk">${sec("Reading the map")}<div class="grid">
        <div class="tile soft"><b>Entry → steps → Gate</b><p>Click Entry for when work starts and what it needs. Click the Gate for criteria, decision, authority and exit.</p></div>
        <div class="tile soft"><b>Loops</b><p>Above: alternate paths. Below: rework. Up: escalation. Down: stop. Click any loop or the Authority and Stop lines.</p></div>
        <div class="tile soft"><b>Same shape at every level</b><p>Act, process, subprocess and workflow all use the same map and the same contract.</p></div>
      </div></div></div>`,
    );
  };

  R.agents = () => {
    const ex = STAGES.find((x) => x.continuous) ? Object.values(UNITS).find((x) => x.kind === "step" && x.fid.startsWith("discover.frame.hypothesise")) : null;
    return { html: `${header({ lbl: "Chapter 06 · Part I", acc: "#6d48d8", h1: "Working with agents.", p: esc(AW.principle) })}
      <div class="cols"><div class="blk">${sec("You and your agent")}<div class="grid g2">${(AW.split || []).map(([w, d]) => `<div class="tile soft"><b>${esc(w)}</b><p>${esc(d)}</p></div>`).join("")}</div>
        <div class="blk">${sec("Prompts at five levels")}<ol class="kn-where">${(AW.levels || []).map(([l, d]) => `<li><b>${esc(l)} prompt</b>${esc(d)}</li>`).join("")}</ol>
          <p class="note" style="margin-top:8px">Every prompt is built from its unit's contract — who, when, what to attach, what to do, the knowledge and lenses to apply, the output template, the checks and what comes next — so it always matches the map. Find them on any map (the <b>Prompt</b> buttons) and in each chapter's <b>Prompts</b> tab.</p></div></div>
      <div class="blk">${sec("How to use a prompt")}<ol class="kn-where">${(AW.howTo || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
        <div class="blk">${sec("Which kind of agent")}<div class="grid g2">${(AW.kinds || []).map(([k, d]) => `<div class="tile soft"><b>${esc(k)}</b><p>${esc(d)}</p></div>`).join("")}</div></div>
        <div class="blk">${sec("Ground rules")}<ul class="list">${(AW.rules || []).map((x) => `<li><span class="ms">shield</span>${esc(x)}</li>`).join("")}</ul></div></div></div>
      <div class="blk">${sec("Scales — the same lifecycle at different sizes")}
        <div class="sc-wrap"><table class="sys-tbl sc-tbl"><tr><th>Scale</th><th>Who</th><th>Backlogs</th><th>Gates</th><th>Cadence</th><th>How people use agents</th><th>Watch out</th></tr>${SCALES.map((x) => `<tr><td><b><span class="ms">${x.icon}</span> ${esc(x.name)}</b><br><span class="ksrc">${esc(x.examples)}</span></td><td>${esc(x.who)}</td><td>${esc(x.backlogs)}</td><td>${esc(x.gates)}</td><td>${esc(x.cadence)}</td><td>${esc(x.agents)}</td><td>${esc(x.risks.join("; "))}</td></tr>`).join("")}</table></div>
        <p class="note" style="margin-top:8px">Pick the scale in any prompt; it adds the right instructions for that size of work.</p></div>
      ${(() => { const CL = (window.NODE_OFFER || {}).claude; if (!CL) return ""; return `<div class="cols"><div class="blk">${sec("Get access to the flagship models")}<ol class="kn-where">${CL.access.map(([, t, d]) => `<li><b>${esc(t)}</b>${esc(d)}</li>`).join("")}</ol><p class="note" style="margin-top:8px">${esc(CL.note)}</p></div>
        <div class="blk">${sec("Claude certifications")}<div class="grid">${CL.certs.map(([, t, d, when, url]) => `<div class="tile soft"><span class="lbl">${esc(when)}</span><b>${esc(t)}</b><p>${esc(d)} <a href="${url}" target="_blank" rel="noopener">Details</a></p></div>`).join("")}</div><p class="note" style="margin-top:8px">Claude Academy and the Claude Certification Program are run by Anthropic. Node prepares you; Anthropic issues the certificates and certifications.</p></div></div>`; })()}
      <div class="blk">${sec("The agent kit — every layer, not just prompts")}
        <p class="note" style="margin-bottom:8px">A prompt is one layer. A full setup gives the agent lasting context, reusable skills, saved commands, run specifications, specialised helpers, the right tools, guardrails and a way to check its work. Node generates all of them from the contracts — open any act or unit's <b>Agent kit</b> tab to browse or download them.</p>
        <div class="sc-wrap"><table class="sys-tbl sc-tbl"><tr><th>Layer</th><th>File</th><th>What it is</th><th>Use it when</th><th>How tools pick it up</th></tr>${(AW.layers || []).map((l) => `<tr><td><b><span class="ms">${l.icon}</span> ${esc(l.name)}</b></td><td><code>${esc(l.file)}</code></td><td>${esc(l.what)}</td><td>${esc(l.when)}</td><td>${esc(l.tools)}</td></tr>`).join("")}</table></div>
        <p style="margin-top:10px"><a class="btn ghost" href="#/act-discover"><span class="ms">download</span>DISCOVER — open the Agent kit tab</a></p></div>
      ${ex ? `<div class="blk">${sec("Anatomy of a prompt — a real step from DISCOVER")}<div class="pr-lib">${promptTree(ex)}</div></div>` : ""}` };
  };

  R.contract = (param) => {
    let c = !param ? 0 : Math.min(M.contract.length - 1, Math.max(0, +param || 0));
    return { html: `${header({ lbl: "Chapter 03 · Part I", acc: "var(--pink)", h1: "One contract. Every level.", p: "Every stage, process and subprocess answers the same nine questions. Learn the shape once and it applies everywhere." })}
      <div class="cols c-37"><div class="vtabs" id="vt" role="tablist"></div><div class="panel" id="cp"></div></div>
      <div class="blk" style="margin-top:18px">${sec("Workflow contract · executable level")}
        <div class="chips">${M.workflow.map(([, n], i) => `<span class="chip"><span class="lbl" style="color:var(--orange);letter-spacing:0">${String(i + 1).padStart(2, "0")}</span>${n}</span>`).join("")}</div></div>`,
      mount(root) {
        const draw = () => {
          $("#vt", root).innerHTML = M.contract.map((x, i) => `<button class="vtab" role="tab" aria-selected="${i === c}" data-i="${i}"><span class="ms">${x.icon}</span>${x.name}<span class="lbl">0${i + 1}</span></button>`).join("");
          const x = M.contract[c];
          $("#cp", root).innerHTML = `<div class="fade"><h3>${x.name}</h3><p class="q">${esc(x.q)}</p><div class="fields">${x.fields.map(([, n, d]) => `<div class="field"><b>${n}</b><span>${esc(d || "—")}</span></div>`).join("")}</div></div>`;
        };
        $("#vt", root).addEventListener("click", (e) => { const b = e.target.closest(".vtab"); if (b) { c = +b.dataset.i; draw(); history.replaceState(null, "", "#/contract/" + c); } });
        draw();
      } };
  };

  R.lenses = (param) => {
    let sel = lensById[param] ? param : "sec", col = -1;
    return { html: `${header({ lbl: "Chapter 04 · Part I", h1: "Never one perspective.", p: "Twenty-five lenses, applied selectively: required where skipping one is an unacceptable risk, applicable where the context calls for it." })}
      <div class="cols c-73"><div><div class="mx-wrap"><table class="mx" id="mx"></table></div>
        <div class="legend"><span><i class="cell req"></i>Required</span><span><i class="cell app"></i>Applicable</span><span><i class="cell none"></i>Not typical</span></div></div>
        <div><div class="dark sticky" id="ld"></div>
          <div class="grid" style="margin-top:8px">
            <div class="tile soft"><b>Applicability is decided</b><p>Choosing a lens is itself a decision that needs evidence.</p></div>
            <div class="tile soft"><b>Conflicts escalate</b><p>When lenses disagree, the authority model resolves it.</p></div>
          </div></div></div>`,
      mount(root) {
        const draw = () => {
          let h = `<thead><tr><th></th>${STAGES.map((s, i) => `<th class="${i === col ? "cs" : ""}" data-s="${i}" title="${s.key}">${s.key.slice(0, 4)}</th>`).join("")}</tr></thead><tbody>`, g = "";
          M.lenses.forEach((l) => {
            if (l.g !== g) { g = l.g; h += `<tr class="g"><td colspan="9">${g}</td></tr>`; }
            h += `<tr class="${l.id === sel ? "rs" : ""}"><th class="ln"><button data-l="${l.id}"><span class="ms">${l.i}</span>${l.n}</button></th>${STAGES.map((s, i) => `<td class="${i === col ? "cs" : ""}"><i class="cell ${lensState(s, l.id)}"></i></td>`).join("")}</tr>`;
          });
          $("#mx", root).innerHTML = h + "</tbody>";
          const l = lensById[sel];
          $("#ld", root).innerHTML = `<div class="fade"><span class="lbl" style="color:var(--pink)">${l.g} lens</span><div style="display:flex;gap:8px;align-items:center;margin:4px 0"><span class="ms" style="font-size:22px;color:var(--teal)">${l.i}</span><b style="font:900 17px var(--head);letter-spacing:-.02em">${l.n}</b></div><p>${esc(l.c)}</p><div class="sdots">${STAGES.map((s) => `<span class="${lensState(s, l.id)}">${s.key.slice(0, 4)}</span>`).join("")}</div></div>`;
        };
        $("#mx", root).addEventListener("click", (e) => {
          const b = e.target.closest("[data-l]"), th = e.target.closest("th[data-s]");
          if (b) { sel = b.dataset.l; draw(); history.replaceState(null, "", "#/lenses/" + sel); }
          else if (th) { col = col === +th.dataset.s ? -1 : +th.dataset.s; draw(); }
        });
        draw();
      } };
  };

  R.knowledge = (param) => {
    let t = KT[param] ? param : "All";
    return { html: `${header({ lbl: "Chapter 05 · Part I", acc: "var(--orange)", h1: "Established, not invented.", p: "Frameworks, standards, patterns and practices are kept distinct, and each is chosen because it applies, not because it's on a list." })}
      <div class="kf" id="kf"></div><p class="note" id="kd" style="margin-bottom:10px"></p><div class="grid g2" id="kg"></div>`,
      mount(root) {
        const draw = () => {
          $("#kf", root).innerHTML = ["All", ...Object.keys(KT)].map((k) => `<button aria-pressed="${k === t}" data-t="${k}">${k}<i>${k === "All" ? RM.knowledge.length : RM.knowledge.filter((x) => x[1] === k).length}</i></button>`).join("");
          $("#kd", root).innerHTML = t === "All" ? "Eight kinds of knowledge. Filter by type to see how they differ." : `<b>${t}:</b> ${esc(KT[t][1])}`;
          $("#kd", root).style.setProperty("--nc", t === "All" ? "var(--teal)" : KT[t][0]);
          $("#kg", root).innerHTML = RM.knowledge.filter((x) => t === "All" || x[1] === t).map(([n, ty, st, d]) => `<div class="krow fade" style="--kc:${KT[ty][0]}"><i></i><div><b>${esc(n)}</b><small>${esc(d)}</small></div><span class="lbl">${st.map((s) => s.slice(0, 4)).join(" · ")}</span></div>`).join("");
        };
        $("#kf", root).addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { t = b.dataset.t; draw(); history.replaceState(null, "", "#/knowledge/" + t); } });
        draw();
      } };
  };

  /* ---------- act (stage) page ---------- */
  STAGES.forEach((s, si) => {
    R["act-" + s.id] = () => {
      const a = ACC[si % 3];
      const know = RM.knowledge.filter((k) => k[2].includes(s.id));
      const stats = s.contract ? contractStats(s.contract) : null;
      const outline = `<div class="cols" style="--acc:${a}">
          <div class="blk">${sec(`Major processes · ${s.processes.length}`)}
            <ol class="rows">${s.processes.map((p, j) => pageOf(p)
              ? `<li><a class="row" href="#/${pageOf(p)}"><span class="n">${si + 1}.${j + 1}</span><span><b>${esc(p.title)}</b><span class="s">${esc(p.summary)}</span></span><span class="ms">arrow_forward</span></a></li>`
              : `<li class="row" title="Not yet authored"><span class="n">${si + 1}.${j + 1}</span><span><b>${esc(p.title)}</b><span class="s">${esc(p.summary)}</span></span><span class="ms">lock</span></li>`).join("")}</ol>
            <div class="blk">${sec("Major outcomes")}<ul class="list">${s.outcomes.map((o) => `<li><span class="ms">check_circle</span>${esc(o)}</li>`).join("")}</ul></div>
          </div>
          <div class="blk">${sec("Decision & routing points")}
            ${Object.entries(M.routes).map(([k, r]) => `<div class="route" style="--rc:${r.c}"><span class="k"><span class="ms">${r.icon}</span>${r.label}</span><span>${esc(s.routing[k])}</span></div>`).join("")}
            <div class="blk">${sec("Lenses")}<div class="chips">${s.lenses.required.map((id) => `<a class="chip req" href="#/lenses/${id}"><span class="ms">${lensById[id].i}</span>${lensById[id].n}</a>`).join("")}${s.lenses.applicable.map((id) => `<a class="chip app" href="#/lenses/${id}">${lensById[id].n}</a>`).join("")}</div></div>
            <div class="blk">${sec("Knowledge")}<div class="chips">${know.map(([n, ty]) => `<a class="chip k" style="--kc:${KT[ty][0]}" href="#/knowledge/${ty}">${esc(n)}</a>`).join("")}</div></div>
          </div></div>`;
      const cv = s.contract ? contractView(s.contract, a) : null;
      const walk = (s.walkthrough || []).length ? `<div class="blk">${sec(`Worked example · ${s.walkthrough.length} steps`)}<ol class="kn-where">${s.walkthrough.map((w) => { const t = UNITS[w.at]; return `<li><b>${esc(w.title)}${t && t.level > 0 ? ` · <a href="#/${pageOf(t)}">${esc(t.num + " " + t.short)}</a>` : ""}</b>${esc(w.text)}</li>`; }).join("")}</ol></div>` : "";
      const learn = teachOf(s) || walk ? `<div class="cols"><div class="blk">${sec("Learn")}${learnBlock(s)}</div>${walk}</div>` : "";
      const tb = tabs("act", [["Outline", outline], ...(cv ? [[`Stage contract · ${stats.pct}%`, cv.html]] : []), ...(learn ? [["Learn", learn]] : []), ["Prompts", promptTree(s)], ["Agent kit", kitBrowser(s)]]);
      return compose(
        header({ lbl: `Act ${ROMAN[si]} · Part II`, acc: a, h1: title(s.key) + ".", p: esc(s.purpose), right: `<span class="badge" style="--acc:${a}"><span class="ms">verified_user</span>${esc(s.gate)}</span>${statusBadge(s.status)}` }),
        stepper(si),
        `<div class="blk" style="margin-top:14px">${sec("Process map")}`, flowMap(s, "nav"), `</div><div style="margin-top:16px"></div>`,
        tb, cv ? { mount: cv.mount } : "",
      );
    };
  });

  /* ---------- process / subprocess / workflow page ---------- */
  Object.values(UNITS).filter((u) => u.level > 0 && isOpen(u)).forEach((u) => {
    R["u-" + u.fid] = () => {
      const a = acc(u), ks = kids(u), next = KIND[u.level + 1];
      const st = u.wf ? { pct: Math.round((wfCount(u) / M.workflow.length) * 100) } : contractStats(u.contract);
      const cv = u.wf ? { html: `<div class="panel"><div class="fields">${M.workflow.map(([k, n]) => {
          const v = k === "steps" ? u.steps.map((s) => `${s.num} ${s.decision ? "◆ " : ""}${s.title} — ${s.actor}${s.out ? " → " + s.out : ""}`) : u.wf[k];
          const has = Array.isArray(v) ? v.length : v;
          return `<div class="field ${has ? "" : "gap"}"><b>${n}</b>${has ? (Array.isArray(v) ? `<ul class="vl">${v.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : `<span>${esc(v)}</span>`) : "<span>Not yet defined</span>"}</div>`;
        }).join("")}</div></div>` } : contractView(u.contract, a);
      const list = ks.length ? `<ol class="rows" style="--acc:${a}">${ks.map((k) => pageOf(k)
        ? `<li><a class="row" href="#/${pageOf(k)}"><span class="n">${k.num}</span><span><b>${esc(k.title)}</b><span class="s">${esc(k.summary || "")}</span></span><span class="ms">arrow_forward</span></a></li>`
        : `<li class="row"><span class="n">${k.num}</span><span><b>${esc(k.title)}</b><span class="s">${esc(k.summary || "")}</span></span><span class="ms">lock</span></li>`).join("")}</ol>`
        : `<div class="note">No ${PLURAL[next] || "children"} authored yet. They're the next step down.</div>`;
      const tb = tabs("unit", [[`${u.wf ? "Workflow contract" : "Contract"} · ${st.pct}%`, cv.html], [`${cap(PLURAL[next] || "children")} · ${ks.length}`, list], ...(teachOf(u) ? [["Learn", `<div class="blk">${learnBlock(u)}</div>`]] : []), ["Prompts", promptTree(u)], ["Agent kit", kitBrowser(u)]]);
      return compose(
        header({ lbl: `${unitLabel(u)} · ${STAGES[u.si].key}`, acc: a, h1: esc(u.title), p: esc(u.summary), right: `${u.gate ? `<span class="badge" style="--acc:${a}"><span class="ms">verified_user</span>${esc(u.gate)}</span>` : ""}${statusBadge(u.status)}` }),
        `<div class="meter"><i style="width:${st.pct}%;background:${a}"></i></div>`,
        `<div class="blk" style="margin-top:12px">${sec(`${cap(next || "child")} map`)}`, flowMap(u, "nav"), `</div><div style="margin-top:16px"></div>`,
        tb, { mount: cv.mount || (() => {}) },
      );
    };
  });

  R.reasoning = (param) => {
    let q = Math.min(M.chain.length - 1, Math.max(0, +param || 0));
    return { html: `${header({ lbl: "Chapter 06 · Part III", acc: "var(--pink)", h1: "Reasoning before procedure.", p: "Given a real initiative, a graduate works through this chain alone and knows which part of the contract answers each question." })}
      <div class="cols"><div class="grid" id="cq" role="tablist" style="gap:2px"></div><div class="panel sticky" id="ca"></div></div>`,
      mount(root) {
        const draw = () => {
          $("#cq", root).innerHTML = M.chain.map(([t], i) => `<button class="cq" role="tab" aria-selected="${i === q}" data-i="${i}"><span class="n">${String(i + 1).padStart(2, "0")}</span>${esc(t)}</button>`).join("");
          const [t, a, src, w] = M.chain[q];
          $("#ca", root).innerHTML = `<div class="fade"><span class="lbl" style="color:var(--pink)">Question ${q + 1} / 12</span><h3 style="margin-top:4px">${esc(t)}</h3><p class="q" style="margin-bottom:0">${esc(a)}</p><div class="links">${src.map(([l, h]) => `<a href="#/${h}"><span class="ms">link</span>${esc(l)}</a>`).join("")}</div><div class="note" style="margin-top:10px;--nc:var(--orange);background:#fff"><b>Failure mode:</b> ${esc(w)}</div></div>`;
        };
        $("#cq", root).addEventListener("click", (e) => { const b = e.target.closest(".cq"); if (b) { q = +b.dataset.i; draw(); history.replaceState(null, "", "#/reasoning/" + q); } });
        draw();
      } };
  };

  R.canvas = () => {
    const data = store.get("node-sdlc-canvas", { name: "", a: [] });
    const count = () => data.a.filter(Boolean).length;
    return { html: `${header({ lbl: "Chapter 07 · Part III", acc: "var(--orange)", h1: "Initiative canvas.", p: "Work a real initiative through the chain. Answers save in this browser as you type." })}
      <div class="cv-head"><input id="cvN" placeholder="Name your initiative…" value="${esc(data.name)}" aria-label="Initiative name" /><span class="lbl" id="cvS" style="color:var(--faint)">${count()} / 12</span><button class="tool" id="cvC"><span class="ms">content_copy</span>Copy</button><button class="tool" id="cvX"><span class="ms">restart_alt</span>Clear</button></div>
      <div class="cv">${M.chain.map(([t], i) => `<div class="${data.a[i] ? "done" : ""}"><label for="cv${i}"><span class="n">${String(i + 1).padStart(2, "0")}</span>${esc(t)}</label><textarea id="cv${i}" placeholder="Your answer…">${esc(data.a[i] || "")}</textarea></div>`).join("")}</div>`,
      mount(root) {
        let tm;
        const save = () => {
          data.name = $("#cvN", root).value;
          data.a = M.chain.map((_, i) => $("#cv" + i, root).value.trim() ? $("#cv" + i, root).value : "");
          store.set("node-sdlc-canvas", data);
          $("#cvS", root).textContent = `${count()} / 12 · saved`;
          root.querySelectorAll(".cv > div").forEach((d, i) => d.classList.toggle("done", !!data.a[i]));
        };
        root.addEventListener("input", (e) => { if (e.target.matches("textarea, #cvN")) { clearTimeout(tm); tm = setTimeout(save, 300); } });
        $("#cvC", root).addEventListener("click", async () => {
          const md = `# ${data.name || "Untitled initiative"}\n\n` + M.chain.map(([t], i) => `## ${i + 1}. ${t}\n\n${data.a[i] || "_—_"}\n`).join("\n");
          try { await navigator.clipboard.writeText(md); $("#cvS", root).textContent = "Copied"; } catch { $("#cvS", root).textContent = "Copy blocked"; }
        });
        $("#cvX", root).addEventListener("click", () => { if (confirm("Clear every answer?")) { root.querySelectorAll("textarea").forEach((t) => (t.value = "")); $("#cvN", root).value = ""; save(); } });
      } };
  };

  /* ================= shell ================= */
  const read = new Set(store.get("node-sdlc-read", []));
  let cur = -1;
  const pageEl = $("#page");
  $("#sbFoot").insertAdjacentHTML("beforeend", `Edition ${esc(RM.meta.edition)} · ${esc(RM.meta.status)}`);

  function renderToc() {
    let h = "", part = "";
    const curU = PAGES[cur]?.unit;
    const chain = curU ? ancestors(curU) : [];
    const tocKids = (u) => [...kids(u), ...(u.level === 0 && u.continuous ? [u.continuous] : [])];
    const subTree = (u, depth) => `<div class="subs" style="margin-left:${30 + depth * 10}px">${tocKids(u).filter((k) => k.kind !== "step").map((k) => {
      const pg = pageOf(k), on = curU === k;
      const row = pg ? `<a class="open ${on ? "active" : ""} ${read.has(pg) ? "read" : ""}" href="#/${pg}"><span class="ms">${on ? "radio_button_checked" : "description"}</span>${k.num} ${esc(k.short)}</a>` : `<a href="#/${pageOf(u) || "map"}" title="Not yet authored"><span class="ms">lock</span>${k.num} ${esc(k.short)}</a>`;
      return row + (chain.includes(k) && kids(k).length ? subTree(k, depth + 1) : "");
    }).join("")}</div>`;
    PAGES.forEach((p, i) => {
      if (p.sub) return;
      if (p.part !== part) { if (part) h += "</div>"; part = p.part; h += `<div class="toc-part"><span class="lbl">${p.part}</span>`; }
      h += `<a href="#/${p.id}" class="${i === cur ? "active" : ""} ${read.has(p.id) ? "read" : ""}"><span class="tn">${p.num || "—"}</span><span class="tt">${p.title}</span>${p.status && p.status !== "confirmed" ? `<span class="st ${p.status}">${p.status === "placeholder" ? "todo" : p.status}</span>` : ""}<span class="ms chk">check_circle</span></a>`;
      if (p.unit && chain[0] === p.unit) h += subTree(p.unit, 0);
    });
    $("#toc").innerHTML = h + "</div>";
    const countable = PAGES.filter((p) => p.id !== "cover");
    const pct = Math.round((countable.filter((p) => read.has(p.id)).length / countable.length) * 100);
    $("#progLabel").textContent = pct + "%"; $("#progBar").style.width = pct + "%";
  }

  function go(id) { location.hash = "#/" + id; }

  function render() {
    const raw = location.hash.replace(/^#\/?/, "");
    const slash = raw.indexOf("/");
    const id = slash < 0 ? raw : raw.slice(0, slash), param = slash < 0 ? undefined : raw.slice(slash + 1);
    const idx = pageIndex[id] ?? 0, p = PAGES[idx];
    const same = idx === cur, dir = cur === -1 || same ? "" : idx > cur ? "tn" : "tp";
    cur = idx;
    const out = R[p.id](param);
    const prev = PAGES[idx - 1], next = PAGES[idx + 1];
    const foot = `<div class="foot">${prev ? `<a class="pg" href="#/${prev.id}"><span class="lbl">← Prev</span><b>${esc(prev.title)}</b></a>` : ""}
      <span class="folio lbl">— ${String(idx).padStart(2, "0")} —</span>
      ${p.id !== "cover" ? `<button class="mark ${read.has(p.id) ? "on" : ""}" id="mark"><span class="ms">${read.has(p.id) ? "task_alt" : "radio_button_unchecked"}</span>${read.has(p.id) ? "Read" : "Mark read"}</button>` : ""}
      ${next ? `<a class="pg nx" href="#/${next.id}"><span class="lbl">Next →</span><b>${esc(next.title)}</b></a>` : ""}</div>`;
    document.documentElement.classList.remove("map-fs");
    pageEl.innerHTML = out.bare ? out.html + `<div style="max-width:1120px;margin:0 auto">${foot}</div>` : `<article class="sheet ${dir}">${out.html}${foot}</article>`;
    if (out.mount) out.mount(pageEl);
    const st = $(".stepper", pageEl), on = st && $(".step.on", st);
    if (on) st.scrollLeft = on.offsetLeft - (st.clientWidth - on.offsetWidth) / 2;
    $("#crumbs").innerHTML = `<span class="pt">${p.part}</span><span class="sep">/</span><b>${esc(p.title)}</b>`;
    $("#pno").textContent = `${String(idx + 1).padStart(2, "0")} / ${String(PAGES.length).padStart(2, "0")}`;
    $("#prevBtn").disabled = idx === 0; $("#nextBtn").disabled = idx === PAGES.length - 1;
    document.title = p.id === "cover" ? "Node SDLC Book" : `${p.title} · Node SDLC Book`;
    if (p.id !== "cover") store.set("node-sdlc-last", p.id);
    renderToc(); closeSb();
    if (!same) window.scrollTo({ top: 0 });
    $("#toc a.active")?.scrollIntoView({ block: "nearest" });
  }

  document.addEventListener("click", (e) => {
    const cp = e.target.closest("[data-act=pr-copy]");
    if (cp) {
      e.preventDefault(); e.stopPropagation();
      const done = () => { const tag = cp.parentElement.querySelector(".at-copied"); if (tag) { tag.hidden = false; setTimeout(() => (tag.hidden = true), 1500); } };
      try { navigator.clipboard.writeText(promptText(UNITS[cp.dataset.fid])).then(done, done); } catch { done(); }
      return;
    }
    const fc = e.target.closest("[data-act=file-copy]");
    if (fc) {
      e.preventDefault(); e.stopPropagation();
      const pre = (fc.closest(".kf") || fc.closest("details")).querySelector("pre"), done = () => { const tag = fc.parentElement.querySelector(".at-copied"); if (tag) { tag.hidden = false; setTimeout(() => (tag.hidden = true), 1500); } };
      try { navigator.clipboard.writeText(pre.textContent).then(done, done); } catch { done(); }
      return;
    }
    const kfl = e.target.closest("[data-kitfile]");
    if (kfl) {
      const kit = kfl.closest(".kit"), u = UNITS[kit.dataset.fid], file = actKit(STAGES[u.si], scaleOf()).find((x) => x.path === kfl.dataset.kitfile);
      kit.querySelectorAll("[data-kitfile]").forEach((b) => b.removeAttribute("aria-current")); kfl.setAttribute("aria-current", "true");
      kit.querySelector(".kit-view").innerHTML = fileView(file);
      return;
    }
    const kz = e.target.closest("[data-act=kit-zip]");
    if (kz) {
      const u = UNITS[kz.dataset.fid], K = unitKit(u, scaleOf()), files = u.level === 0 ? K.all : K.mine.concat(K.all.filter((x) => ["AGENTS.md", "README.md", "TOOLS.md", "GUARDRAILS.md", "PROGRESS.md", "TRACE.md"].includes(x.path) && !K.mine.includes(x)));
      const root = `node-kit-${slug(u.kind === "stage" ? u.key : u.num + "-" + (u.short || u.title))}-${scaleOf()}`;
      const a = document.createElement("a"); a.href = URL.createObjectURL(makeZip(files.map((x) => ({ path: `${root}/${x.path}`, body: x.body })))); a.download = root + ".zip"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      return;
    }
    const scb = e.target.closest("[data-scale]");
    if (scb) {
      store.set("node-scale", scb.dataset.scale);
      document.querySelectorAll("pre.pr-text[data-fid]").forEach((p) => (p.textContent = promptText(UNITS[p.dataset.fid])));
      document.querySelectorAll("[data-scale]").forEach((b) => b.setAttribute("aria-checked", b.dataset.scale === scb.dataset.scale));
      document.querySelectorAll(".kit[data-fid]").forEach((k) => (k.outerHTML = kitBrowser(UNITS[k.dataset.fid])));
      return;
    }
  }, true);
  document.addEventListener("click", (e) => {
    const o = e.target.closest(".qopt"); if (!o) return;
    const q = o.closest(".quiz"); if (q.classList.contains("done")) return;
    q.classList.add("done"); o.classList.add(o.dataset.quiz === "1" ? "right" : "wrong");
    q.querySelector('.qopt[data-quiz="1"]').classList.add("right"); q.querySelector(".qwhy").hidden = false;
  });
  pageEl.addEventListener("click", (e) => {
    if (!e.target.closest("#mark")) return;
    const id = PAGES[cur].id; read.has(id) ? read.delete(id) : read.add(id);
    store.set("node-sdlc-read", [...read]);
    const on = read.has(id), b = $("#mark");
    b.classList.toggle("on", on); b.innerHTML = `<span class="ms">${on ? "task_alt" : "radio_button_unchecked"}</span>${on ? "Read" : "Mark read"}`;
    renderToc();
  });
  $("#prevBtn").addEventListener("click", () => cur > 0 && go(PAGES[cur - 1].id));
  $("#nextBtn").addEventListener("click", () => cur < PAGES.length - 1 && go(PAGES[cur + 1].id));
  addEventListener("scroll", () => { const m = document.documentElement.scrollHeight - innerHeight; $("#readbar").style.width = (m > 0 ? Math.min(100, (scrollY / m) * 100) : 0) + "%"; }, { passive: true });

  const sb = $("#sidebar"), scrim = $("#scrim"), sEl = $("#search"), qEl = $("#q");
  function closeSb() { sb.classList.remove("on"); if (!sEl.classList.contains("on")) scrim.classList.remove("on"); }
  /* desktop: the floating sidebar hides and shows (remembered); small screens: it slides in as a drawer */
  const wide = () => matchMedia("(min-width: 1024px)").matches;
  const setSbHidden = (h) => { document.documentElement.classList.toggle("sb-hidden", h); store.set("node-sb-hidden", h); };
  setSbHidden(!!store.get("node-sb-hidden", false));
  $("#menuBtn").addEventListener("click", () => { if (wide()) setSbHidden(!document.documentElement.classList.contains("sb-hidden")); else { sb.classList.add("on"); scrim.classList.add("on"); } });
  $("#sbHide").addEventListener("click", () => (wide() ? setSbHidden(true) : closeSb()));

  /* ================= search ================= */
  const INDEX = [
    ...PAGES.filter((p) => !p.sub).map((p) => ({ t: p.title, s: p.part, h: p.id, i: p.icon, k: "Chapter" })),
    ...Object.values(UNITS).filter((u) => u.level > 0 && u.kind !== "step").map((u) => ({ t: u.title, s: `${unitLabel(u)} · ${STAGES[u.si].key} · ${u.summary || ""}`, h: pageOf(u) || pageOf(u.parent) || "act-" + STAGES[u.si].id, i: "account_tree", k: cap(u.kind) })),
    ...M.lenses.map((l) => ({ t: l.n, s: l.c, h: "lenses/" + l.id, i: l.i, k: "Lens" })),
    ...RM.knowledge.map(([n, ty, , d]) => ({ t: n, s: `${ty} · ${d}`, h: "knowledge/" + ty, i: "menu_book", k: ty })),
    ...M.contract.map((c, i) => ({ t: c.name, s: c.q, h: "contract/" + i, i: c.icon, k: "Contract" })),
    ...M.chain.map(([q], i) => ({ t: q, s: "Reasoning chain", h: "reasoning/" + i, i: "psychology_alt", k: "Question" })),
  ];
  let hits = [], si = 0;
  const openS = () => { sEl.classList.add("on"); scrim.classList.add("on"); qEl.value = ""; find(); qEl.focus(); };
  const closeS = () => { sEl.classList.remove("on"); if (!sb.classList.contains("on")) scrim.classList.remove("on"); };
  function find() {
    const q = qEl.value.trim().toLowerCase();
    hits = q ? INDEX.filter((x) => (x.t + " " + x.s).toLowerCase().includes(q)).sort((a, b) => b.t.toLowerCase().startsWith(q) - a.t.toLowerCase().startsWith(q)).slice(0, 30) : INDEX.filter((x) => x.k === "Chapter");
    si = 0; drawHits();
  }
  function drawHits() {
    $("#res").innerHTML = hits.length ? hits.map((x, i) => `<li class="${i === si ? "sel" : ""}"><a href="#/${x.h}"><span class="ms">${x.i}</span><span style="min-width:0"><b>${esc(x.t)}</b><small>${esc(x.s.length > 70 ? x.s.slice(0, 70) + "…" : x.s)}</small></span><span class="lbl">${x.k}</span></a></li>`).join("") : `<li class="empty">Nothing found.</li>`;
    $("#res .sel")?.scrollIntoView({ block: "nearest" });
  }
  qEl.addEventListener("input", find);
  qEl.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); si = Math.min(hits.length - 1, si + 1); drawHits(); }
    if (e.key === "ArrowUp") { e.preventDefault(); si = Math.max(0, si - 1); drawHits(); }
    if (e.key === "Enter" && hits[si]) { e.preventDefault(); closeS(); location.hash = "#/" + hits[si].h; }
  });
  $("#res").addEventListener("click", closeS);
  $("#openSearch").addEventListener("click", openS);
  scrim.addEventListener("click", () => { closeS(); closeSb(); scrim.classList.remove("on"); });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); sEl.classList.contains("on") ? closeS() : openS(); return; }
    const openSheet = document.querySelector(".kn-sheet:not([hidden]) [data-act=sheet-close]");
    if (e.key === "Escape" && openSheet && !sEl.classList.contains("on")) { openSheet.click(); return; }
    const fsMap = document.querySelector(".mapw.fs");
    if (e.key === "Escape" && fsMap && !sEl.classList.contains("on")) { fsMap.querySelector("[data-act=fs]")?.click(); return; }
    if (e.key === "Escape") { closeS(); closeSb(); scrim.classList.remove("on"); return; }
    if (fsMap || e.target.closest("input, textarea, svg") || sEl.classList.contains("on")) return;
    if (e.key === "ArrowRight" && cur < PAGES.length - 1) go(PAGES[cur + 1].id);
    if (e.key === "ArrowLeft" && cur > 0) go(PAGES[cur - 1].id);
  });

  addEventListener("hashchange", render);
  render();
})();
