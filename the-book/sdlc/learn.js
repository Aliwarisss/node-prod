/* Learn mode — a focused, full-screen walk through DISCOVER along its happy path.
 * One big thing at a time, in the order the work actually flows: the act, why it's needed (a board of the lenses that
 * care), its map, then every process → subprocess → workflow → step, the documents each step produces, the decisions,
 * the gates, charts of the work, and the shelf of artifacts it leaves behind. Narration runs as subtitles at the bottom;
 * each subtitle line brings the next element on screen. Open from any [data-learn] button or with L. */
(() => {
  "use strict";
  const API = window.NODE_API, B = window.NODE_BOOK, M = window.NODE_MODEL;
  if (!API || !B || !M) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const arr = B.arr, C = B.C;
  const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const nice = (k) => String(k || "").charAt(0) + String(k || "").slice(1).toLowerCase();
  const first = (s) => String(s || "").split(/(?<=[.!?])\s/)[0];
  const lc = (s) => String(s || "").charAt(0).toLowerCase() + String(s || "").slice(1);
  const KLIB = window.NODE_KNOWLEDGE || {};
  const A1 = API.STAGES.find((s) => s.status && s.status !== "placeholder") || API.STAGES[0];
  const CASE = "Order intake";
  const fill = (s) => esc(s).replace(/\{initiative\}/g, CASE).replace(/\{([^}]+)\}/g, "<u>$1</u>");
  const RC = (k) => (M.routes[k] && M.routes[k].c) || "#008080";
  const PC = ["#4fd1c5", "#e91e63", "#c49000", "#8b5cf6", "#0284c7"]; // a colour per process

  /* ---------- documents: render an artifact template as a real, filled-in page ---------- */
  function paper(id, big) {
    const a = B.ALIB[id]; if (!a) return "";
    const t = a.tpl || {}, name = (a.aliases || [id])[0];
    let body = "";
    if (t.fmt === "doc") body = `${t.meta ? `<div class="pp-meta">${t.meta.slice(0, 4).map((m) => `<span>${esc(String(m).split(":")[0])}</span>`).join("")}</div>` : ""}${arr(t.sections).slice(0, big ? 6 : 4).map((s, i) => { const [h, hint, ex] = Array.isArray(s) ? s : [s]; return `<div class="pp-sec" style="--k:${i}"><b>${esc(h)}</b>${ex ? `<p class="ex">${fill(ex)}</p>` : `<p class="hint">${fill(hint || "")}</p>`}</div>`; }).join("")}`;
    else if (t.fmt === "form") body = arr(t.fields).slice(0, big ? 7 : 5).map(([l, ty, ph], i) => `<label class="pp-f" style="--k:${i}"><span>${esc(l)}</span><i class="${String(ty).startsWith("long") ? "long" : ""}">${fill(ph || "")}</i></label>`).join("");
    else if (t.fmt === "sheet") body = `<div class="pp-file">${esc(t.file || "")}${t.tab ? ` · <b>${esc(t.tab)}</b>` : ""}</div><table class="pp-t"><tr>${arr(t.cols).slice(0, 5).map((c) => `<th>${esc(Array.isArray(c) ? c[0] : c)}</th>`).join("")}</tr>${arr(t.rows).slice(0, big ? 5 : 3).map((r, i) => `<tr style="--k:${i}">${arr(r).slice(0, 5).map((c) => `<td>${fill(c)}</td>`).join("")}</tr>`).join("")}</table>`;
    else if (t.fmt === "message") body = `<div class="pp-mail"><div><span>To</span>${fill(t.to || "")}</div><div><span>Subject</span><b>${fill(t.subject || "")}</b></div></div>${arr(t.body).map((l, i) => `<p class="pp-ml" style="--k:${i}">${fill(l)}</p>`).join("")}`;
    else if (t.fmt === "canvas") body = `<div class="pp-canvas">${t.structure ? B.renderStructure(t.structure) : ""}</div>`;
    else if (t.fmt === "pack") body = arr(t.parts).map(([pid, d], i) => `<div class="pp-part" style="--k:${i}"><span class="ms">description</span><b>${esc((B.ALIB[pid] && B.ALIB[pid].aliases[0]) || pid)}</b><em>${esc(d || "")}</em></div>`).join("");
    const icon = { doc: "article", form: "edit_note", sheet: "table", message: "mail", canvas: "dashboard", pack: "folder_open" }[t.fmt] || "description";
    return `<div class="paper ${big ? "big" : ""} f-${t.fmt || "doc"}"><div class="pp-h"><span class="ms">${icon}</span><span class="pp-k">${esc(t.fmt || "doc")}</span><h4>${fill(t.title || t.board || name)}</h4></div><div class="pp-b">${body}</div>${arr(a.good).length ? `<div class="pp-good"><span class="ms">verified</span>${esc(a.good[0])}</div>` : ""}</div>`;
  }
  const artOf = (name) => B.artId(name);

  /* ---------- a big happy-path map: nodes appear one per subtitle line, the marker travels ---------- */
  function bigMap(u, opts = {}) {
    const mm = B.mapModel(u); const N = mm.nodes.length, gap = 170, pad = 90, W = pad * 2 + (N - 1) * gap, H = 250, y = 110;
    const parts = [];
    mm.nodes.forEach((n, i) => {
      if (i < N - 1) parts.push(`<line x1="${pad + i * gap + (i === 0 ? 38 : 70)}" y1="${y}" x2="${pad + (i + 1) * gap - (i + 1 === N - 1 ? 40 : 76)}" y2="${y}" class="mk-e" data-l="${i + 1}" marker-end="url(#lmA)"/>`);
    });
    mm.nodes.forEach((n, i) => {
      const x = pad + i * gap, L = i === 0 ? 0 : i;
      let sh;
      if (n.io === "entry") sh = `<rect x="${x - 38}" y="${y - 20}" width="76" height="40" rx="20" class="ent"/><text x="${x}" y="${y + 5}" class="t inv">ENTRY</text>`;
      else if (n.io === "gate") sh = `<rect x="${x - 26}" y="${y - 26}" width="52" height="52" rx="8" transform="rotate(45 ${x} ${y})" class="gt"/><text x="${x}" y="${y + 4}" class="t gtt">GATE</text>${wrapT(n.label, 16).map((l, k) => `<text x="${x}" y="${y + 60 + k * 16}" class="s gtt">${esc(l)}</text>`).join("")}`;
      else sh = `<rect x="${x - 72}" y="${y - 32}" width="144" height="64" rx="14" class="bx ${n.unit && n.unit.decision ? "dec" : ""}"/>${n.num ? `<text x="${x - 62}" y="${y - 15}" class="num">${n.unit && n.unit.decision ? "◆ " : ""}${esc(n.num)}</text>` : ""}${wrapT(n.label, 17).map((l, k, a) => `<text x="${x}" y="${y + 7 + (k - (a.length - 1) / 2) * 16 + 4}" class="t">${esc(l)}</text>`).join("")}`;
      parts.push(`<g class="mk-n" data-l="${L}" data-x="${x}" data-y="${y}">${sh}</g>`);
    });
    parts.push(`<g class="mk-tok"><circle r="11"/><circle r="11" class="ring"/></g>`);
    return `<svg class="bigmap" viewBox="0 0 ${W} ${H}"><defs><marker id="lmA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10z" fill="#4fd1c5"/></marker></defs>${parts.join("")}</svg>`;
  }
  function wrapT(s, max, lines = 2) { const w = String(s).split(" "), out = [""]; w.forEach((x) => { const l = out[out.length - 1]; if ((l + " " + x).trim().length > max && l) out.push(x); else out[out.length - 1] = (l + " " + x).trim(); }); return out.slice(0, lines); }

  /* ---------- charts ---------- */
  const stepsOf = (u) => (u.kind === "workflow" ? u.steps || [] : u.kind === "subprocess" ? (u.workflows || []).flatMap((w) => w.steps || []) : u.kind === "process" ? API.kids(u).flatMap(stepsOf) : u.processes.flatMap(stepsOf));
  const wfsOf = (u) => (u.kind === "subprocess" ? u.workflows || [] : u.kind === "process" ? API.kids(u).flatMap((s) => s.workflows || []) : u.processes.flatMap(wfsOf));
  const tally = (list) => Object.entries(list.reduce((o, k) => ((o[k] = (o[k] || 0) + 1), o), {})).sort((a, b) => b[1] - a[1]);
  const hbars = (rows, color, l) => { const max = Math.max(1, ...rows.map((r) => r[1])); return `<div class="ch-h">${rows.map(([k, v], i) => `<div class="hb" style="--w:${(v / max) * 100}%;--c:${typeof color === "function" ? color(k, i) : color};--k:${i}"><span>${esc(k)}</span><i><b></b></i><em>${v}</em></div>`).join("")}</div>`; };
  const donut = (rows, colors) => { const tot = rows.reduce((a, r) => a + r[1], 0) || 1, R = 70, Cc = 2 * Math.PI * R; let off = 0; return `<svg class="ch-d" viewBox="0 0 200 200"><circle cx="100" cy="100" r="${R}" class="track"/>${rows.map(([k, v], i) => { const len = (v / tot) * Cc, s = `<circle cx="100" cy="100" r="${R}" class="arc" style="--c:${colors[k] || PC[i % PC.length]};--len:${len};--off:${-off};--k:${i}" transform="rotate(-90 100 100)"/>`; off += len; return s; }).join("")}<text x="100" y="98" class="dn">${tot}</text><text x="100" y="118" class="dl">total</text></svg><div class="ch-leg">${rows.map(([k, v], i) => `<span style="--c:${colors[k] || PC[i % PC.length]}"><i></i>${esc(k)} · ${v}</span>`).join("")}</div>`; };
  const knowTally = (u) => { const ws = u.kind === "workflow" ? [u] : wfsOf(u); const names = new Map(); ws.forEach((w) => Object.values((w.wf || {}).uses || {}).flat().forEach((n) => names.set(n, (B.kEntry(n) || {}).type || "Technique"))); return tally([...names.values()]); };
  const lensTally = (u) => tally(B.lensOfUnit(u).map((x) => (B.lensById[x.id] || {}).g).filter(Boolean));

  /* ---------- the frames, generated from DISCOVER in the order the work flows ---------- */
  const F = []; // {kind, unit, proc, path, lines:[{say, who}], html(), on?(root, li)}
  const L = (say, who) => ({ say, who: who || "Narrator" });
  const LEVELS = ["stage", "process", "subprocess", "workflow", "step"];
  const pathOf = (u) => { const p = []; let x = u; while (x && LEVELS.includes(x.kind)) { p.unshift(x); x = x.parent; } return p; };
  const procIdx = (u) => { const p = pathOf(u).find((x) => x.kind === "process"); return p ? A1.processes.indexOf(p) : -1; };
  const nSub = A1.processes.reduce((a, p) => a + API.kids(p).length, 0), nWf = wfsOf(A1).length, nSteps = stepsOf(A1).length;

  /* lens board: why a unit exists, seen through the lenses that care about it */
  function why(u) {
    const D = C(u, "definition"), LN = C(u, "lenses"), lens = B.lensOfUnit(u), req = lens.filter((x) => x.req).slice(0, 5), app = lens.filter((x) => !x.req);
    const lines = [L(`Why does ${esc(u.kind === "stage" ? nice(u.key) : u.title)} exist? ${esc(D.purpose || u.summary || "")}`)];
    req.forEach((x) => { const l = B.lensById[x.id]; if (l) lines.push(L(`Through the <b>${esc(l.n)}</b> lens: ${esc(lc(l.c))}`, l.n)); });
    lines.push(L(`${app.length ? `Also listening: ${app.slice(0, 5).map((x) => esc((B.lensById[x.id] || {}).n || "")).join(", ")}. ` : ""}${arr(LN.concerns).length ? `The big worry: <b>${esc(lc(LN.concerns[0]))}</b>.` : ""}`));
    F.push({ kind: "why", unit: u, lines, html: () => `<div class="fr why"><div class="why-q" data-l="0"><span class="k">Why this is needed</span><p>“${esc(D.purpose || u.summary || "")}”</p>${D.outcome ? `<div class="why-o"><span class="ms">flag</span>Outcome: <b>${esc(D.outcome)}</b></div>` : ""}</div>
      <div class="board">${req.map((x, i) => { const l = B.lensById[x.id]; return l ? `<div class="lc" data-l="${i + 1}" style="--c:${B.LG_COLOR[l.g]}"><span class="ms">${l.i}</span><b>${esc(l.n)}</b><em>required · ${esc(l.g)}</em><p>${esc(l.c)}</p></div>` : ""; }).join("")}
        <div class="lc app" data-l="${req.length + 1}"><span class="ms">visibility</span><b>Also listening</b><div class="chips">${app.slice(0, 8).map((x) => `<span style="--c:${B.LG_COLOR[(B.lensById[x.id] || {}).g]}">${esc((B.lensById[x.id] || {}).n || "")}</span>`).join("")}</div>${arr(LN.concerns).length ? `<div class="notes">${arr(LN.concerns).slice(0, 3).map((c) => `<i>${esc(c)}</i>`).join("")}</div>` : ""}</div></div></div>` });
  }
  function mapFrame(u, intro) {
    const mm = B.mapModel(u), kids = mm.nodes.filter((n) => n.unit);
    const lines = [L(intro)];
    kids.forEach((n) => lines.push(L(`<b>${esc(n.num)} ${esc(n.unit.title)}</b> — ${esc(first(n.unit.summary || C(n.unit, "definition").purpose || (n.unit.actor ? `done by the ${n.unit.actor}.` : "")))}`, n.unit.actor || "Narrator")));
    lines.push(L(`Then the gate: <b>${esc(u.gate || "done")}</b>. That's the happy path — every box, in order.`));
    F.push({ kind: "map", unit: u, lines, html: () => `<div class="fr map"><div class="mp-h"><span class="k">${esc(API.PLEVEL[u.kind])} map</span><h3>${u.kind === "stage" ? "I · " + esc(nice(u.key)) : esc((u.num ? u.num + " " : "") + u.title)}</h3></div>${bigMap(u)}<div class="mp-legend"><span><i class="e"></i>Entry</span><span><i class="b"></i>${esc(API.PLEVEL[(kids[0] && kids[0].unit.kind) || "step"])}</span><span><i class="g"></i>Gate</span><span class="hp">Happy path only — the detours come later</span></div></div>`,
      on: (root, li) => { const svg = root.querySelector(".bigmap"); const cur = svg && [...svg.querySelectorAll(".mk-n")].filter((g) => +g.dataset.l <= Math.min(li, kids.length + 1)).pop(); const tok = svg && svg.querySelector(".mk-tok"); if (cur && tok) tok.style.transform = `translate(${cur.dataset.x}px, ${+cur.dataset.y - 52}px)`; } });
  }
  function stats(u) {
    const st = stepsOf(u), actors = tally(st.map((s) => s.actor).filter(Boolean)).slice(0, 6), kn = knowTally(u).slice(0, 8), ln = lensTally(u);
    const arts = new Set(st.flatMap((s) => arr(s.out)).filter(Boolean));
    const tb = String(C(u, "continuity").timebox || "").split(/[;,(]/)[0].trim();
    F.push({ kind: "stats", unit: u, lines: [L(`${esc(u.kind === "stage" ? nice(u.key) : u.title)} in numbers: <b>${st.length} steps</b>, <b>${arts.size} documents</b>${tb ? `, about <b>${esc(tb)}</b> on a real project` : ""}.`), L(`Who does the work? Mostly the <b>${esc(actors[0] ? actors[0][0] : "")}</b> — ${actors[0] ? actors[0][1] : 0} steps. Agents can draft much of it; people decide.`), L(`The knowledge it leans on: mostly <b>${esc(kn[0] ? kn[0][0].toLowerCase() + "s" : "techniques")}</b> — proven ways of working, not invention.`), L(`And the lenses involved, by group. Every group that cares gets a voice.`)],
      html: () => `<div class="fr stats"><div class="kpis" data-l="0">${[[st.length, "steps"], [arts.size, "documents"], [new Set(st.map((s) => s.actor)).size, "roles"], [st.filter((s) => s.decision).length, "decisions"]].map(([n, t]) => `<div><b data-count="${n}">${n}</b><span>${t}</span></div>`).join("")}${tb ? `<div><b class="tb">${esc(tb)}</b><span>timebox</span></div>` : ""}</div>
        <div class="charts"><div class="chart" data-l="1"><span class="k">Who does the work · steps</span>${hbars(actors, (k, i) => PC[i % PC.length])}</div><div class="chart" data-l="2"><span class="k">Knowledge used · by type</span>${hbars(kn, (k) => B.KN_COLOR(Object.keys(B.KN_SING).find((t) => B.KN_SING[t] === k) || "techniques"))}</div><div class="chart" data-l="3"><span class="k">Lenses involved · by group</span>${donut(ln, B.LG_COLOR)}</div></div></div>` });
  }
  function title(u, lines, sub) {
    const own = B.ownerOf(u), tb = C(u, "continuity").timebox, pi = procIdx(u);
    F.push({ kind: "title", unit: u, lines, html: () => `<div class="fr title k-${u.kind}" style="--pc:${PC[pi < 0 ? 0 : pi]}"><span class="lvl" data-l="0">${esc(API.PLEVEL[u.kind])}${u.kind === "stage" ? " " + ["I"][0] : ""}</span><div class="num" data-l="0">${esc(u.num || "I")}</div><h2 data-l="0">${esc(u.kind === "stage" ? nice(u.key) : u.title)}</h2>${sub ? `<p class="sub" data-l="0">${sub}</p>` : ""}<div class="meta" data-l="${lines.length > 1 ? 1 : 0}">${own ? `<span><span class="ms">person</span>${esc(own)}</span>` : ""}${u.gate ? `<span><span class="ms">verified_user</span>${esc(u.gate)}</span>` : ""}${tb ? `<span><span class="ms">schedule</span>${esc(tb)}</span>` : ""}</div></div>` });
  }
  function stepFrame(w, s, node) {
    const out = arr(s.out).filter(Boolean)[0], aid = out && artOf(out), A = aid && B.ALIB[aid];
    const kn = node ? B.nodeKnow(w, node) : [], ln = node ? B.nodeLens(w, node).filter((x) => x.note) : [];
    const lines = [L(`Step ${esc(s.num)}: the <b>${esc(s.actor || "")}</b> — ${esc(lc(s.title))}.`, s.actor)];
    if (out) lines.push(L(`This produces the <b>${esc(out)}</b>${A && A.what ? ` — ${esc(lc(A.what))}` : "."}`, s.actor));
    if (ln[0]) { const l = B.lensById[ln[0].id]; lines.push(L(`The <b>${esc(l ? l.n : ln[0].id)}</b> lens asks: <i>“${esc(ln[0].note)}”</i>`, l ? l.n : "Lens")); }
    if (kn[0]) { const e = B.kEntry(kn[0].name); lines.push(L(`Using <b>${esc(kn[0].name)}</b>${e && e.what ? ` — ${esc(lc(e.what))}` : "."}`)); }
    const initials = String(s.actor || "?").split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
    F.push({ kind: "step", unit: s, wf: w, lines, art: aid, html: () => `<div class="fr step ${aid ? "" : "noart"}"><div class="st-card" data-l="0"><div class="st-top"><span class="st-n">${esc(s.num)}</span><span class="st-wf">${esc(w.num)} ${esc(w.title)}</span></div><h3>${esc(s.title)}</h3><div class="who"><i>${initials}</i><span><b>${esc(s.actor || "")}</b><em>does this step</em></span></div>
        ${ln.length ? `<div class="sticky" data-l="${out ? 2 : 1}">${ln.slice(0, 2).map((x) => { const l = B.lensById[x.id]; return `<p style="--c:${B.LG_COLOR[(l || {}).g] || "#e91e63"}"><b>${esc(l ? l.n : x.id)}</b>${esc(x.note)}</p>`; }).join("")}</div>` : ""}
        ${kn.length ? `<div class="kn" data-l="${(out ? 2 : 1) + (ln.length ? 1 : 0)}"><span class="k">Knowledge</span>${kn.slice(0, 3).map((k) => `<span style="--c:${B.KN_COLOR(k.type)}">${esc(k.name)}</span>`).join("")}</div>` : ""}</div>
        ${aid ? `<div class="st-art" data-l="1"><span class="k"><span class="ms">arrow_forward</span>produces</span>${paper(aid, true)}</div>` : ""}</div>` });
  }
  function decisionFrame(w, s, node, idx) {
    const mm = B.mapModel(w), other = mm.edges.filter((e) => e.f === idx && e.ty !== "forward" && e.n);
    const next = mm.nodes[idx + 1];
    F.push({ kind: "decision", unit: s, wf: w, lines: [L(`A decision: <b>${esc(s.title)}</b> — asked by the ${esc(s.actor || "team")}.`, s.actor), L(`On the happy path the answer is <b>yes</b>, and the work moves on${next ? ` to <b>${esc(next.label)}</b>` : ""}.`), L(other.length ? `If not: ${other.map((e) => `<b style="color:${RC(e.ty)}">${esc(e.n)}</b>`).join(", ")}. Those are the other paths — planned, not surprises.` : "Every other answer has a planned route too.")],
      html: () => `<div class="fr decision"><div class="dz" data-l="0"><i></i><span>${esc(s.title)}</span></div><div class="br yes" data-l="1"><span class="ms">check_circle</span><b>Yes</b><em>→ ${esc(next ? next.label : "continue")}</em></div><div class="brs" data-l="2">${other.map((e) => `<div class="br" style="--c:${RC(e.ty)}"><span class="ms">${(M.routes[e.ty] || {}).icon || "alt_route"}</span><b>${esc(e.n)}</b><em>${esc(M.routes[e.ty].label)} route</em></div>`).join("")}</div></div>` });
  }
  function gateFrame(u, crit, outs, kicker) {
    crit = arr(crit).slice(0, 6);
    const lines = [L(`Before moving on, the <b>${esc(u.gate || "gate")}</b> checks the work.`)];
    crit.forEach((c) => lines.push(L(`✓ ${esc(c)}`)));
    lines.push(L(`Passed. ${esc(u.kind === "stage" ? nice(u.key) : u.title)} hands over: ${outs.length ? outs.slice(0, 4).map((o) => `<b>${esc(o)}</b>`).join(", ") : "its results"}.`));
    F.push({ kind: "gate", unit: u, lines, html: () => `<div class="fr gate"><div class="gz"><div class="dz small" data-l="0"><i></i><span>${esc(u.gate || "Gate")}</span></div><span class="k" data-l="0">${esc(kicker)}</span></div><ul class="crit">${crit.map((c, i) => `<li data-l="${i + 1}"><span class="ms">check_circle</span>${esc(c)}</li>`).join("")}</ul><div class="stamp" data-l="${crit.length + 1}">GO<small>${esc(u.gate || "")}</small></div><div class="outs" data-l="${crit.length + 1}">${outs.slice(0, 6).map((o) => `<span><span class="ms">description</span>${esc(o)}</span>`).join("")}</div></div>` });
  }
  function shelf(u, finale) {
    const outs = [...new Set(stepsOf(u).flatMap((s) => arr(s.out)).filter(Boolean))], ids = outs.map(artOf).filter(Boolean);
    F.push({ kind: "shelf", unit: u, lines: finale ? [L(`<b>${esc(nice(u.key))} is complete.</b> The ${esc(u.gate)} says <b>Go</b>.`), L(`Along the happy path you walked <b>${nSteps} steps</b> and produced <b>${ids.length} documents</b> — every one traceable back to the request.`), L(`${esc(C(u, "routing").forward || "The initiative moves on to PLAN.")}`), L(`Next: open the book and explore the other paths — the detours, loops and stops. Or replay any part from the outline.`)] : [L(`<b>${esc(u.title)}</b> is done. Here's everything it produced.`), L(`${ids.length} documents — each one carries the work forward to the next process.`)],
      html: () => `<div class="fr shelf ${finale ? "fin" : ""}">${finale ? `<div class="fin-h" data-l="0"><span class="ms">celebration</span><h2>${esc(nice(u.key))} complete</h2><p>Happy path · ${nSteps} steps · ${ids.length} documents</p></div>` : `<div class="mp-h" data-l="0"><span class="k">What ${esc(u.num)} produced</span><h3>${esc(u.title)}</h3></div>`}<div class="papers" data-l="1">${ids.slice(0, finale ? 24 : 12).map((id, i) => `<div class="pw" style="--k:${i};--r:${((i % 5) - 2) * 2}deg">${paper(id)}</div>`).join("")}</div>${finale ? `<div class="fin-n" data-l="3"><a class="lm-btn" href="#/act-${A1.id}" data-lmx><span class="ms">map</span>Open ${esc(nice(A1.key))} in the book</a><button class="lm-btn ghost" data-lgo="0"><span class="ms">replay</span>Start again</button></div>` : ""}</div>` });
  }

  /* the sequence */
  title(A1, [L(`This is <b>${esc(nice(A1.key))}</b> — the first act of the lifecycle. Its one question: <i>“${esc(A1.tagline)}”</i>`), L(`We'll follow the <b>happy path</b> — the route when everything goes to plan — through ${A1.processes.length} processes, ${nSub} subprocesses, ${nWf} workflows and ${nSteps} steps. One thing at a time.`)], `“${esc(A1.tagline)}”`);
  why(A1);
  mapFrame(A1, `Here's the map of ${esc(nice(A1.key))}: five processes, one after another.`);
  stats(A1);
  A1.processes.forEach((p) => {
    title(p, [L(`Process <b>${esc(p.num)}: ${esc(p.title)}</b>. ${esc(p.summary || "")}`), L(`Owned by the ${esc(B.ownerOf(p) || "team")}. It ends with the <b>${esc(p.gate || "")}</b>${C(p, "continuity").timebox ? ` — about ${esc(C(p, "continuity").timebox)} on a real project` : ""}.`)], esc(p.summary || ""));
    why(p);
    mapFrame(p, `Inside ${esc(p.num)}: ${API.kids(p).length} subprocesses, in order.`);
    API.kids(p).forEach((sp) => {
      title(sp, [L(`Subprocess <b>${esc(sp.num)}: ${esc(sp.title)}</b>. ${esc(sp.summary || "")}`)], esc(sp.summary || ""));
      (sp.workflows || []).forEach((w) => {
        const D = C(w, "definition");
        mapFrame(w, `Workflow <b>${esc(w.num)}: ${esc(w.title)}</b>. ${esc(D.purpose || "")} It starts when: ${esc(lc(arr(D.entry)[0] || "the work arrives"))}.`);
        const mm = B.mapModel(w);
        (w.steps || []).forEach((s) => { const idx = mm.nodes.findIndex((n) => n.unit === s); if (s.decision) decisionFrame(w, s, mm.nodes[idx], idx); else stepFrame(w, s, mm.nodes[idx]); });
        gateFrame(w, arr((w.wf || {}).criteria).length ? w.wf.criteria : D.exit, arr(w.steps).flatMap((s) => arr(s.out)).filter(Boolean), `Workflow ${w.num} · done when`);
      });
    });
    stats(p);
    gateFrame(p, C(p, "controls").criteria, API.outOf(p), `Process ${p.num} · gate`);
    shelf(p);
  });
  gateFrame(A1, C(A1, "controls").criteria, API.outOf(A1), `${nice(A1.key)} · the act's gate`);
  shelf(A1, true);
  F.forEach((f, i) => { f.i = i; f.proc = procIdx(f.unit); f.path = pathOf(f.unit.kind === "step" ? f.unit.parent : f.unit); });
  const TOTAL_LINES = F.reduce((a, f) => a + f.lines.length, 0);

  /* ======================================================================
   * the player
   * ====================================================================== */
  const css = document.createElement("style");
  css.textContent = `
  .lm { position: fixed; inset: 0; z-index: 1100; display: none; grid-template-rows: auto minmax(0, 1fr) auto auto; background: radial-gradient(1200px 600px at 80% -10%, rgba(233,30,99,.16), transparent 60%), radial-gradient(900px 600px at -10% 110%, rgba(0,128,128,.2), transparent 60%), #0b0f15; color: #e6edf3; font: 15px/1.5 "Geist", ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
  .lm.on { display: grid; animation: lmIn .5s cubic-bezier(.22,1,.36,1); } @keyframes lmIn { from { opacity: 0; } }
  .lm::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px); background-size: 26px 26px; pointer-events: none; }
  .lm [hidden] { display: none !important; }
  .lm > * { position: relative; } .lm button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  .lm .ms { font-family: "Material Symbols Outlined"; font-weight: normal; font-style: normal; line-height: 1; letter-spacing: normal; text-transform: none; white-space: nowrap; display: inline-block; font-size: 20px; }
  .lm-top { display: flex; align-items: center; gap: 12px; padding: 12px clamp(14px, 3vw, 28px); }
  .lm-brand { display: flex; align-items: center; gap: 8px; font: 900 16px "Montserrat"; letter-spacing: -.02em; } .lm-brand i { width: 28px; height: 28px; border-radius: 9px; display: grid; place-items: center; background: #e91e63; font-style: normal; } .lm-brand i .ms { font-size: 17px; }
  .lm-brand small { font: 700 10px "Geist Mono"; letter-spacing: .18em; text-transform: uppercase; color: #4fd1c5; margin-left: 4px; }
  .lm-path { display: flex; align-items: center; gap: 4px; min-width: 0; overflow: hidden; font: 700 11px "Geist Mono"; letter-spacing: .06em; color: rgba(255,255,255,.45); margin-left: 10px; }
  .lm-path span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; } .lm-path span:last-child { color: #fff; } .lm-path .ms { font-size: 14px; color: rgba(255,255,255,.25); }
  .lm-tb { margin-left: auto; display: flex; align-items: center; gap: 6px; }
  .lm-ib { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 999px; background: rgba(255,255,255,.07) !important; font: 700 12px "Geist"; } .lm-ib:hover { background: rgba(255,255,255,.14) !important; } .lm-ib .ms { font-size: 18px; } .lm-ib b { color: #4fd1c5; }
  .lm-ib.x { width: 36px; padding: 0; justify-content: center; }
  .lm-stage { display: grid; place-items: center; padding: 8px clamp(14px, 4vw, 60px); overflow: auto; }
  .lm-frame { width: min(1240px, 100%); }
  .lm-frame.in { animation: lmFr .7s cubic-bezier(.22,1,.36,1); } @keyframes lmFr { from { opacity: 0; transform: translateY(24px) scale(.97); filter: blur(6px); } }
  [data-l] { opacity: 0; transform: translateY(18px); transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1), filter .5s; }
  [data-l].on { opacity: 1; transform: none; } [data-l].past { filter: saturate(.85); }
  .k { display: inline-flex; align-items: center; gap: 6px; font: 700 11px "Geist Mono"; letter-spacing: .18em; text-transform: uppercase; color: #4fd1c5; }
  /* subtitles */
  .lm-sub { display: grid; justify-items: center; padding: 6px clamp(14px, 4vw, 60px) 10px; min-height: 104px; }
  .lm-sub .who { font: 700 10.5px "Geist Mono"; letter-spacing: .18em; text-transform: uppercase; color: #e91e63; margin-bottom: 4px; }
  .lm-sub p { max-width: 1000px; text-align: center; font-size: clamp(17px, 1.7vw, 23px); line-height: 1.45; color: #fff; text-shadow: 0 2px 12px rgba(0,0,0,.6); padding: 8px 18px; border-radius: 14px; background: rgba(0,0,0,.35); }
  .lm-sub p b { color: #4fd1c5; } .lm-sub p i { color: #ffc2d6; }
  .lm-sub .w { display: inline-block; opacity: 0; transform: translateY(5px); animation: lmW .35s ease forwards; } @keyframes lmW { to { opacity: 1; transform: none; } }
  /* controls */
  .lm-ctl { display: flex; align-items: center; gap: 10px; padding: 8px clamp(14px, 3vw, 28px) 14px; }
  .lm-scrub { position: relative; flex: 1; height: 26px; display: flex; align-items: center; gap: 2px; cursor: pointer; }
  .lm-scrub .seg { height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--c) 30%, transparent); position: relative; overflow: hidden; } .lm-scrub .seg i { position: absolute; inset: 0; width: var(--p, 0%); background: var(--c); }
  .lm-scrub .knob { position: absolute; top: 50%; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px rgba(233,30,99,.6); transition: left .4s; pointer-events: none; }
  .lm-scrub .tip { position: absolute; bottom: 26px; transform: translateX(-50%); padding: 4px 8px; border-radius: 8px; background: #fff; color: #0b0f15; font: 700 11px "Geist"; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .2s; } .lm-scrub:hover .tip { opacity: 1; }
  .lm-cb { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.08) !important; } .lm-cb:hover { background: rgba(255,255,255,.16) !important; }
  .lm-cb.play { width: 52px; height: 52px; background: #e91e63 !important; box-shadow: 0 14px 30px -12px rgba(233,30,99,.8); } .lm-cb.play .ms { font-size: 28px; }
  .lm-spd { font: 800 12px "Geist Mono"; padding: 0 12px; height: 34px; border-radius: 999px; background: rgba(255,255,255,.08) !important; }
  .lm-cnt { font: 700 12px "Geist Mono"; color: rgba(255,255,255,.5); white-space: nowrap; } .lm-cnt b { color: #fff; }
  .lm-prog { position: absolute; left: 0; right: 0; top: 0; height: 3px; } .lm-prog i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #4fd1c5, #e91e63); transition: width .3s linear; }
  /* outline drawer + artifact tray */
  .lm-draw { position: absolute; top: 0; bottom: 0; width: min(380px, 92vw); z-index: 5; background: #0f141c; border-right: 1px solid rgba(255,255,255,.08); box-shadow: 30px 0 60px -30px rgba(0,0,0,.8); transform: translateX(-105%); transition: transform .45s cubic-bezier(.22,1,.36,1); overflow: auto; padding: 16px; left: 0; }
  .lm-draw.r { left: auto; right: 0; transform: translateX(105%); border-right: 0; border-left: 1px solid rgba(255,255,255,.08); } .lm-draw.on { transform: none; }
  .lm-draw h4 { font: 900 15px "Montserrat"; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; } .lm-draw h4 button { margin-left: auto; }
  .ol a, .ol button { display: flex; gap: 8px; width: 100%; text-align: left; padding: 6px 8px; border-radius: 8px; font-size: 13px; color: rgba(255,255,255,.7); } .ol button:hover { background: rgba(255,255,255,.06) !important; color: #fff; } .ol button.cur { background: #e91e63 !important; color: #fff; } .ol button.done { color: rgba(79,209,197,.85); }
  .ol .p { font-weight: 800; color: #fff; margin-top: 8px; } .ol .s { padding-left: 20px; } .ol .w { padding-left: 34px; font-size: 12px; } .ol i { font: 700 10px "Geist Mono"; font-style: normal; color: rgba(255,255,255,.35); min-width: 38px; }
  .tray { display: grid; gap: 10px; } .tray .paper { transform: none !important; }
  /* frames: title */
  .fr.title { text-align: center; display: grid; justify-items: center; gap: 6px; padding: 30px 0; }
  .fr.title .lvl { font: 700 12px "Geist Mono"; letter-spacing: .24em; text-transform: uppercase; color: var(--pc); }
  .fr.title .num { font: 900 clamp(4rem, 12vw, 9rem)/.9 "Montserrat"; letter-spacing: -.06em; color: transparent; -webkit-text-stroke: 2px var(--pc); }
  .fr.title h2 { font: 900 clamp(2rem, 5vw, 4.4rem)/.95 "Montserrat"; text-transform: uppercase; letter-spacing: -.045em; max-width: 1000px; }
  .fr.title.k-stage h2 { font-size: clamp(3rem, 9vw, 7.5rem); } .fr.title.k-subprocess .num { font-size: clamp(3rem, 8vw, 6rem); } .fr.title.k-subprocess h2 { font-size: clamp(1.8rem, 4vw, 3.4rem); }
  .fr.title .sub { font-size: clamp(16px, 1.6vw, 21px); color: rgba(255,255,255,.7); max-width: 760px; }
  .fr.title .meta, .meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 12px; } .meta span { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; background: rgba(255,255,255,.07); font-size: 13.5px; font-weight: 700; } .meta .ms { font-size: 17px; color: #4fd1c5; }
  /* why: lens board */
  .fr.why { display: grid; gap: 20px; }
  .why-q p { font: 800 clamp(20px, 2.4vw, 32px)/1.25 "Montserrat"; letter-spacing: -.02em; margin-top: 6px; max-width: 1000px; } .why-o { margin-top: 10px; display: inline-flex; align-items: center; gap: 8px; font-size: 15px; color: rgba(255,255,255,.75); } .why-o .ms { color: #e91e63; } .why-o b { color: #fff; }
  .board { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
  .lc { padding: 18px; border-radius: 20px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-top: 4px solid var(--c, #4fd1c5); }
  .lc > .ms { font-size: 30px; color: var(--c, #4fd1c5); } .lc b { display: block; font: 900 17px "Montserrat"; text-transform: uppercase; margin-top: 6px; } .lc em { display: block; font: 700 10px "Geist Mono"; letter-spacing: .14em; text-transform: uppercase; color: var(--c); font-style: normal; margin: 2px 0 8px; } .lc p { font-size: 14px; color: rgba(255,255,255,.75); }
  .lc.cur { box-shadow: 0 0 0 2px var(--c), 0 20px 50px -20px var(--c); transform: translateY(-4px) !important; }
  .lc.app { --c: #8b949e; } .chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; } .chips span { padding: 4px 10px; border-radius: 999px; border: 1px solid var(--c); font-size: 12px; font-weight: 700; }
  .notes { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; } .notes i { padding: 8px 10px; background: #ffd966; color: #3a2e00; font-size: 12.5px; font-style: normal; font-weight: 700; transform: rotate(-1.5deg); box-shadow: 0 8px 18px -10px rgba(0,0,0,.6); } .notes i:nth-child(2) { transform: rotate(1.5deg); background: #ffb3cf; color: #4a0820; }
  /* map */
  .fr.map { display: grid; gap: 14px; } .mp-h h3, .st-card h3 { font: 900 clamp(1.6rem, 3vw, 2.6rem)/1 "Montserrat"; text-transform: uppercase; letter-spacing: -.035em; margin-top: 4px; }
  .bigmap { width: 100%; height: auto; overflow: visible; }
  .bigmap .mk-e { stroke: #4fd1c5; stroke-width: 3; stroke-dasharray: 8 7; animation: lmDash 1.2s linear infinite; } @keyframes lmDash { to { stroke-dashoffset: -30; } }
  .bigmap .bx { fill: #121a24; stroke: rgba(255,255,255,.35); stroke-width: 2; transition: all .5s; } .bigmap .bx.dec { stroke: #e91e63; }
  .bigmap .mk-n.cur .bx { fill: #e91e63; stroke: #e91e63; } .bigmap .mk-n.past .bx { fill: rgba(79,209,197,.14); stroke: #4fd1c5; }
  .bigmap .ent { fill: #fff; } .bigmap .gt { fill: #121a24; stroke: #e91e63; stroke-width: 3; } .bigmap .mk-n.cur .gt { fill: #e91e63; }
  .bigmap .t { font: 700 14px "Geist"; fill: #fff; text-anchor: middle; } .bigmap .t.inv { fill: #0b0f15; font-weight: 900; font-size: 12px; letter-spacing: .08em; } .bigmap .gtt { fill: #ff8fb4; font-weight: 800; font-size: 11px; } .bigmap .s { font: 700 13px "Geist"; text-anchor: middle; } .bigmap .num { font: 800 11px "Geist Mono"; fill: rgba(255,255,255,.5); }
  .bigmap .mk-tok { transition: transform .8s cubic-bezier(.22,1,.36,1); } .bigmap .mk-tok circle { fill: #ffd966; } .bigmap .mk-tok .ring { fill: none; stroke: #ffd966; stroke-width: 2; animation: lmRing 1.4s ease-out infinite; transform-box: fill-box; transform-origin: center; } @keyframes lmRing { to { opacity: 0; r: 26; } }
  .mp-legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12.5px; color: rgba(255,255,255,.6); } .mp-legend i { display: inline-block; width: 14px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; } .mp-legend .e { background: #fff; border-radius: 6px; } .mp-legend .b { border: 2px solid rgba(255,255,255,.4); } .mp-legend .g { background: #e91e63; transform: rotate(45deg); width: 10px; } .mp-legend .hp { margin-left: auto; color: #ffd966; }
  /* stats */
  .fr.stats { display: grid; gap: 18px; } .kpis { display: flex; flex-wrap: wrap; gap: 12px; } .kpis div { flex: 1; min-width: 120px; padding: 16px; border-radius: 18px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); } .kpis b { display: block; font: 900 clamp(28px, 3.4vw, 46px) "Montserrat"; letter-spacing: -.04em; color: #fff; } .kpis b.tb { font-size: clamp(18px, 2vw, 26px); color: #ffd966; } .kpis span { font: 700 11px "Geist Mono"; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.5); }
  .charts { display: grid; grid-template-columns: 1.2fr 1.2fr 1fr; gap: 14px; } .chart { padding: 18px; border-radius: 20px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); } .chart .k { margin-bottom: 12px; }
  .ch-h { display: grid; gap: 9px; } .hb { display: grid; grid-template-columns: 130px 1fr 30px; gap: 8px; align-items: center; font-size: 13px; } .hb span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: rgba(255,255,255,.8); } .hb i { height: 12px; border-radius: 6px; background: rgba(255,255,255,.06); overflow: hidden; } .hb i b { display: block; height: 100%; width: 0; background: var(--c); border-radius: 6px; transition: width 1.1s cubic-bezier(.22,1,.36,1); transition-delay: calc(var(--k) * 90ms + 200ms); } .on .hb i b { width: var(--w); } .hb em { font: 800 12px "Geist Mono"; font-style: normal; text-align: right; }
  .ch-d { width: 100%; max-width: 220px; display: block; margin: 0 auto; } .ch-d .track { fill: none; stroke: rgba(255,255,255,.06); stroke-width: 26; } .ch-d .arc { fill: none; stroke: var(--c); stroke-width: 26; stroke-dasharray: 0 999; stroke-dashoffset: var(--off); transition: stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1); transition-delay: calc(var(--k) * 120ms + 200ms); } .on .ch-d .arc { stroke-dasharray: var(--len) 999; }
  .ch-d .dn { font: 900 34px "Montserrat"; fill: #fff; text-anchor: middle; } .ch-d .dl { font: 700 10px "Geist Mono"; fill: rgba(255,255,255,.5); text-anchor: middle; letter-spacing: .14em; text-transform: uppercase; }
  .ch-leg { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 8px; font-size: 12px; } .ch-leg i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: var(--c); margin-right: 5px; }
  /* step */
  .fr.step { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: clamp(16px, 3vw, 40px); align-items: center; } .fr.step.noart { grid-template-columns: minmax(0, 760px); justify-content: center; }
  .st-card { padding: clamp(18px, 2.4vw, 32px); border-radius: 26px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); }
  .st-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; } .st-n { font: 900 15px "Geist Mono"; padding: 4px 12px; border-radius: 999px; background: #e91e63; } .st-wf { font: 700 11px "Geist Mono"; letter-spacing: .08em; color: rgba(255,255,255,.45); text-transform: uppercase; }
  .st-card h3 { margin: 14px 0 16px; font-size: clamp(1.7rem, 3.2vw, 2.9rem); }
  .who { display: flex; align-items: center; gap: 12px; } .who i { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; font: 900 18px "Montserrat"; font-style: normal; background: linear-gradient(135deg, #4fd1c5, #008080); color: #0b0f15; } .who b { display: block; font-size: 17px; } .who em { font-style: normal; font-size: 12.5px; color: rgba(255,255,255,.5); }
  .sticky { display: grid; gap: 8px; margin-top: 18px; } .sticky p { padding: 10px 12px; border-radius: 12px; border-left: 4px solid var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); font-size: 14px; } .sticky b { display: block; font: 800 10.5px "Geist Mono"; letter-spacing: .12em; text-transform: uppercase; color: var(--c); margin-bottom: 2px; }
  .kn { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 14px; } .kn .k { margin-right: 4px; } .kn span:not(.k) { padding: 5px 11px; border-radius: 999px; border: 1.5px solid var(--c); font-size: 12.5px; font-weight: 700; }
  .st-art .k { margin-bottom: 8px; } .st-art .k .ms { font-size: 16px; color: #e91e63; }
  /* paper */
  .paper { background: #fffdf8; color: #222; border-radius: 6px; box-shadow: 0 30px 60px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(0,0,0,.05); padding: 16px 18px; font-family: Georgia, "Times New Roman", serif; font-size: 12.5px; line-height: 1.45; transform: rotate(.6deg); max-height: 52vh; overflow: hidden; position: relative; }
  .paper.big { font-size: 13.5px; padding: 20px 24px; }
  .paper::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 40px; background: linear-gradient(transparent, #fffdf8); }
  .pp-h { display: grid; grid-template-columns: auto 1fr; gap: 0 8px; align-items: center; border-bottom: 2px solid #222; padding-bottom: 8px; margin-bottom: 10px; } .pp-h .ms { grid-row: span 2; font-size: 26px; color: #e91e63; } .pp-k { font: 700 9.5px "Geist Mono"; letter-spacing: .16em; text-transform: uppercase; color: #8a8e8f; } .pp-h h4 { font: 700 17px Georgia, serif; } .paper.big .pp-h h4 { font-size: 20px; }
  .pp-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-bottom: 10px; font: 600 10px "Geist Mono"; color: #8a8e8f; text-transform: uppercase; letter-spacing: .06em; } .pp-meta span::after { content: " ____"; color: #ccc; }
  .pp-sec, .pp-f, .pp-t tr, .pp-ml, .pp-part { opacity: 0; animation: ppIn .5s ease forwards; animation-delay: calc(var(--k) * 260ms + 350ms); } @keyframes ppIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  [data-l]:not(.on) .pp-sec, [data-l]:not(.on) .pp-f, [data-l]:not(.on) .pp-t tr, [data-l]:not(.on) .pp-ml, [data-l]:not(.on) .pp-part { animation: none; }
  .pp-sec { margin-bottom: 9px; } .pp-sec b { display: block; font: 700 12.5px "Geist", sans-serif; color: #111; } .pp-sec .ex { font-family: "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive; color: #1d4ed8; font-size: 13px; } .pp-sec .hint { color: #999; font-style: italic; } .pp-sec u, .pp-f u, .pp-ml u { text-decoration: none; background: #fff3a8; padding: 0 3px; }
  .pp-f { display: grid; gap: 3px; margin-bottom: 8px; } .pp-f span { font: 700 11.5px "Geist"; color: #333; } .pp-f i { display: block; min-height: 24px; padding: 4px 8px; border: 1px solid #d9d4cc; border-radius: 4px; background: #fff; font-style: normal; color: #9aa; font-size: 12px; } .pp-f i.long { min-height: 44px; }
  .pp-file { font: 600 11px "Geist Mono"; color: #107c41; margin-bottom: 6px; } .pp-t { width: 100%; border-collapse: collapse; font: 12px "Geist", sans-serif; } .pp-t th { background: #107c41; color: #fff; padding: 4px 6px; text-align: left; font-size: 11px; } .pp-t td { border: 1px solid #ddd; padding: 4px 6px; }
  .pp-mail { border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 8px; font: 12px "Geist", sans-serif; } .pp-mail div { display: flex; gap: 8px; } .pp-mail span { width: 54px; color: #999; } .pp-ml { margin: 4px 0; font-family: "Geist", sans-serif; }
  .pp-part { display: grid; grid-template-columns: 20px 1fr; gap: 0 8px; padding: 6px 0; border-bottom: 1px dashed #ddd; font-family: "Geist", sans-serif; } .pp-part .ms { grid-row: span 2; color: #e91e63; font-size: 18px; } .pp-part b { font-size: 12.5px; } .pp-part em { font-size: 11.5px; color: #777; font-style: normal; }
  .pp-canvas { font-family: "Geist", sans-serif; color: #222; }
  .pp-good { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 5px; margin-top: 6px; padding: 4px 10px; border-radius: 999px; background: #e8f6f5; color: #0b5555; font: 700 11px "Geist"; } .pp-good .ms { font-size: 15px; }
  /* decision */
  .fr.decision { display: grid; justify-items: center; gap: 18px; text-align: center; }
  .dz { position: relative; width: clamp(200px, 26vw, 300px); aspect-ratio: 1; display: grid; place-items: center; } .dz i { position: absolute; inset: 15%; transform: rotate(45deg); border: 4px solid #e91e63; border-radius: 20px; background: #121a24; box-shadow: 0 0 60px -10px rgba(233,30,99,.6); animation: lmPing 2.4s ease-out infinite; }
  @keyframes lmPing { 0% { box-shadow: 0 0 0 0 rgba(233,30,99,.5); } 70%, 100% { box-shadow: 0 0 0 26px rgba(233,30,99,0); } }
  .dz span { position: relative; max-width: 62%; font: 900 clamp(16px, 1.8vw, 22px)/1.15 "Montserrat"; text-transform: uppercase; } .dz.small { width: 150px; } .dz.small span { font-size: 13px; }
  .br { display: inline-flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 16px; background: rgba(255,255,255,.05); border: 1.5px solid var(--c, #4fd1c5); } .br.yes { --c: #4fd1c5; background: rgba(79,209,197,.14); font-size: 18px; } .br .ms { color: var(--c); font-size: 24px; } .br b { font-size: 15px; } .br.yes b { font-size: 20px; } .br em { font-style: normal; font-size: 13px; color: rgba(255,255,255,.6); }
  .brs { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; opacity: .8; }
  /* gate */
  .fr.gate { display: grid; grid-template-columns: auto 1fr; gap: 10px 40px; align-items: center; } .gz { display: grid; justify-items: center; gap: 8px; grid-row: span 2; }
  .crit { list-style: none; display: grid; gap: 10px; } .crit li { display: flex; gap: 12px; align-items: center; padding: 14px 18px; border-radius: 16px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); font-size: clamp(15px, 1.4vw, 19px); } .crit li .ms { color: rgba(255,255,255,.25); font-size: 26px; transition: color .4s .3s; } .crit li.on .ms { color: #4fd1c5; } .crit li.cur { border-color: #4fd1c5; background: rgba(79,209,197,.1); }
  .stamp { grid-column: 2; justify-self: start; display: grid; place-items: center; padding: 8px 28px; border: 5px solid #4fd1c5; border-radius: 14px; color: #4fd1c5; font: 900 46px/1 "Montserrat"; letter-spacing: .06em; transform: rotate(-6deg) scale(1.4); opacity: 0; } .stamp small { font: 800 11px "Geist Mono"; letter-spacing: .14em; text-transform: uppercase; }
  .stamp.on { animation: lmStamp .6s cubic-bezier(.3,1.6,.5,1) forwards; } @keyframes lmStamp { to { opacity: 1; transform: rotate(-6deg) scale(1); } }
  .outs { display: flex; flex-wrap: wrap; gap: 8px; grid-column: 2; } .outs span { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; background: #fffdf8; color: #222; font-size: 13px; font-weight: 700; } .outs .ms { font-size: 17px; color: #e91e63; }
  /* shelf */
  .fr.shelf { display: grid; gap: 18px; } .papers { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; } .pw { transform: rotate(var(--r)); } .pw .paper { max-height: 220px; font-size: 10.5px; padding: 12px; transform: none; } .pw .pp-h h4 { font-size: 13px; }
  .papers.on .pw { animation: lmDeal .6s cubic-bezier(.22,1,.36,1) both; animation-delay: calc(var(--k) * 90ms); } @keyframes lmDeal { from { opacity: 0; transform: translateY(40px) rotate(-10deg) scale(.8); } }
  .fin .papers { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); } .fin .pw .paper { max-height: 150px; }
  .fin-h { text-align: center; } .fin-h .ms { font-size: 56px; color: #ffd966; } .fin-h h2 { font: 900 clamp(2.4rem, 6vw, 5rem)/.95 "Montserrat"; text-transform: uppercase; letter-spacing: -.045em; } .fin-h p { color: rgba(255,255,255,.65); font-size: 17px; }
  .fin-n { display: flex; justify-content: center; gap: 10px; } .lm-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 22px; border-radius: 999px; background: #e91e63 !important; color: #fff !important; font: 900 13px "Geist"; letter-spacing: .08em; text-transform: uppercase; text-decoration: none; } .lm-btn.ghost { background: rgba(255,255,255,.1) !important; }
  /* start overlay */
  .lm-start { position: absolute; inset: 0; z-index: 6; display: grid; place-items: center; background: rgba(11,15,21,.82); backdrop-filter: blur(6px); text-align: center; }
  .lm-start h2 { font: 900 clamp(2.4rem, 6vw, 5rem)/.95 "Montserrat"; text-transform: uppercase; letter-spacing: -.045em; } .lm-start h2 span { color: #e91e63; } .lm-start p { max-width: 640px; margin: 14px auto 22px; color: rgba(255,255,255,.7); font-size: 16px; }
  .lm-start .go { display: inline-flex; align-items: center; gap: 10px; padding: 18px 30px; border-radius: 999px; background: #e91e63 !important; font: 900 15px "Geist"; letter-spacing: .1em; text-transform: uppercase; box-shadow: 0 20px 40px -14px rgba(233,30,99,.8); } .lm-start .go .ms { font-size: 26px; }
  .lm-start .facts { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 22px; } .lm-start .facts span { padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,.08); font-size: 13.5px; } .lm-start .facts b { color: #4fd1c5; }
  .lm-start .res { display: block; margin: 14px auto 0; color: rgba(255,255,255,.6); font-size: 13px; text-decoration: underline; }
  @media (max-width: 900px) { .fr.step, .charts, .fr.gate { grid-template-columns: 1fr; } .outs, .stamp { grid-column: auto; } .lm-path { display: none; } .paper { max-height: 38vh; } .lm-sub { min-height: 90px; } .hb { grid-template-columns: 96px 1fr 26px; } .lm-ib span.t { display: none; } }
  @media (prefers-reduced-motion: reduce) { .lm *, .lm { animation: none !important; transition: none !important; } [data-l] { opacity: 1; transform: none; } .lm-sub .w { opacity: 1; } }`;
  /* the overlay lives in its own shadow root: the book's styles can't reach in, and ours can't leak out */
  const host = document.createElement("div"); host.id = "node-learn"; document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  /* knowledge 'shapes' that some documents embed (normally styled by the book) */
  css.textContent += `
  .ks-steps { padding-left: 18px; } .ks-steps li { margin: 2px 0; }
  .ks-cycle, .ks-chain { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; } .ks-cy, .ks-ch { padding: 4px 8px; border: 1px solid #ccc; border-radius: 6px; background: #fff; } .ks-cy i { font: 800 10px "Geist Mono"; font-style: normal; color: #e91e63; margin-right: 4px; } .ks-cy span { display: block; font-size: 11px; color: #777; } .ks-ar { color: #aaa; font-size: 16px; }
  .ks-levels .ks-lv { border: 1px solid #ccc; border-radius: 8px; padding: 6px 8px; margin-top: 6px; background: #fff; } .ks-lvh b { margin-right: 6px; } .ks-lvh span { color: #777; font-size: 11px; }
  .ks-fields > div, .ks-grid > div { border: 1px solid #ddd; border-radius: 6px; padding: 5px 7px; margin: 3px 0; background: #fff; } .ks-fields b, .ks-grid b { display: block; font-size: 11.5px; } .ks-fields span, .ks-grid span { font-size: 11px; color: #777; }
  .ks-grid { display: grid; gap: 4px; } .ks-table { width: 100%; border-collapse: collapse; font-size: 11px; } .ks-table th, .ks-table td { border: 1px solid #ddd; padding: 3px 5px; }
  .ks-matrix .ks-q { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; } .ks-matrix .ks-q div { border: 1px solid #ddd; min-height: 26px; padding: 3px; font-size: 11px; background: #fff; } .ks-x, .ks-y { font-size: 10px; color: #888; }
  .ks-sentence { font-style: italic; } .ks-sentence u { background: #fff3a8; text-decoration: none; }
  .ks-dd { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } .ks-dd ul { padding-left: 16px; font-size: 11px; }`;
  shadow.appendChild(css);
  /* scope every rule to the learn overlay so generic names (.chips, .meta, [data-l]…) never touch the book */
  (function scope(rules) { [...rules].forEach((r) => { if (r.selectorText) r.selectorText = r.selectorText.split(",").map((s) => (s = s.trim(), s.startsWith(".lm") ? s : ".lm " + s)).join(", "); else if (r.cssRules && !(r instanceof CSSKeyframesRule)) scope(r.cssRules); }); })(css.sheet.cssRules);

  const el = document.createElement("div");
  el.className = "lm"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", `Learn ${nice(A1.key)} step by step`);
  const segs = A1.processes.map((p, i) => { const fs = F.filter((f) => f.proc === i); return { i, p, from: F.indexOf(fs[0]), to: F.indexOf(fs[fs.length - 1]) }; });
  el.innerHTML = `<div class="lm-prog"><i></i></div>
    <header class="lm-top"><div class="lm-brand"><i><span class="ms">school</span></i>Node.<small>Learn · ${esc(nice(A1.key))}</small></div><div class="lm-path"></div>
      <div class="lm-tb"><button class="lm-ib" data-lol title="Outline (O)"><span class="ms">list</span><span class="t">Outline</span></button><button class="lm-ib" data-ltray title="Documents produced so far"><span class="ms">inventory_2</span><b class="tn">0</b><span class="t">documents</span></button><button class="lm-ib x" data-lx aria-label="Close (Esc)" title="Close (Esc)"><span class="ms">close</span></button></div></header>
    <main class="lm-stage"><div class="lm-frame"></div></main>
    <div class="lm-sub" aria-live="polite"><span class="who"></span><p></p></div>
    <footer class="lm-ctl"><button class="lm-cb" data-lprev title="Back (←)"><span class="ms">skip_previous</span></button><button class="lm-cb play" data-lplay title="Play / pause (Space)"><span class="ms">play_arrow</span></button><button class="lm-cb" data-lnext title="Next (→)"><span class="ms">skip_next</span></button><button class="lm-spd" data-lspd title="Speed">1×</button>
      <div class="lm-scrub" data-lscrub>${F.map((f, i) => "").join("")}${[{ i: -1, from: 0, to: segs[0].from - 1 }, ...segs, { i: -2, from: segs[segs.length - 1].to + 1, to: F.length - 1 }].filter((s) => s.to >= s.from).map((s) => `<div class="seg" data-from="${s.from}" data-to="${s.to}" style="flex:${s.to - s.from + 1};--c:${s.i >= 0 ? PC[s.i] : "#8b949e"}"><i></i></div>`).join("")}<span class="knob"></span><span class="tip"></span></div>
      <span class="lm-cnt"></span></footer>
    <aside class="lm-draw ol-d"><h4><span class="ms">list</span>Outline<button class="lm-ib x" data-lolx><span class="ms">close</span></button></h4><div class="ol"></div></aside>
    <aside class="lm-draw r tr-d"><h4><span class="ms">inventory_2</span>Documents so far<button class="lm-ib x" data-ltrx><span class="ms">close</span></button></h4><div class="tray"></div></aside>
    <div class="lm-start"><div><span class="k">Learning mode · the happy path</span><h2>Learn <span>${esc(nice(A1.key))}</span><br>step by step</h2><p>One thing at a time, in the order the work flows — from why it's needed, through every process, workflow and step, to the documents it produces and the gates it passes. Sit back and watch, or step through at your own pace.</p><div class="facts"><span><b>${A1.processes.length}</b> processes</span><span><b>${nSub}</b> subprocesses</span><span><b>${nWf}</b> workflows</span><span><b>${nSteps}</b> steps</span><span><b>${F.length}</b> screens</span></div><button class="go" data-lstart><span class="ms">play_circle</span>Start learning</button><button class="res" data-lresume hidden></button></div></div>`;
  shadow.appendChild(el);
  const $ = (s) => el.querySelector(s);

  let fi = 0, li = 0, playing = false, speed = 1, T = null;
  const SPEEDS = [1, 1.5, 2, 0.75];
  const clear = () => { clearTimeout(T); T = null; };
  const frame = () => F[fi];
  const words = (root) => { let i = 0; const walk = (n) => [...n.childNodes].forEach((c) => { if (c.nodeType === 3) { const fr = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) return fr.appendChild(document.createTextNode(w)); const s = document.createElement("span"); s.className = "w"; s.style.animationDelay = Math.min(i++ * 32, 1600) / speed + "ms"; s.textContent = w; fr.appendChild(s); }); c.replaceWith(fr); } else if (c.nodeType === 1) walk(c); }); walk(root); };
  const countUp = (root) => root.querySelectorAll("[data-count]").forEach((b) => { const n = +b.dataset.count, t0 = performance.now(); const tick = (t) => { const p = Math.min(1, (t - t0) / 900); b.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); setTimeout(() => (b.textContent = n), 1000); });

  const artsUpTo = (k) => { const ids = []; for (let i = 0; i <= k; i++) if (F[i].art && !ids.includes(F[i].art)) ids.push(F[i].art); return ids; };
  const renderFrame = () => {
    const f = frame(), box = $(".lm-frame");
    box.innerHTML = f.html(); box.classList.remove("in"); void box.offsetWidth; box.classList.add("in");
    $(".lm-stage").scrollTop = 0;
    const path = f.path.map((u) => (u.kind === "stage" ? nice(u.key) : `${u.num} ${u.short || u.title}`));
    $(".lm-path").innerHTML = path.map((p) => `<span>${esc(p)}</span>`).join('<span class="ms">chevron_right</span>');
    $(".tn").textContent = artsUpTo(fi).length;
    store.set("node-learn-at", fi);
  };
  const applyLine = () => {
    const f = frame(), box = $(".lm-frame");
    box.querySelectorAll("[data-l]").forEach((e) => { const l = +e.dataset.l; e.classList.toggle("on", l <= li); e.classList.toggle("cur", l === li); e.classList.toggle("past", l < li); });
    if (li === 0) countUp(box);
    if (f.on) f.on(box, li);
    const ln = f.lines[li] || {}; $(".lm-sub .who").textContent = ln.who || ""; const p = $(".lm-sub p"); p.innerHTML = ln.say || ""; words(p);
    /* progress */
    const done = F.slice(0, fi).reduce((a, x) => a + x.lines.length, 0) + li + 1;
    $(".lm-prog i").style.width = (done / TOTAL_LINES) * 100 + "%";
    $(".lm-cnt").innerHTML = `<b>${fi + 1}</b> / ${F.length}`;
    el.querySelectorAll(".lm-scrub .seg").forEach((s) => { const a = +s.dataset.from, b = +s.dataset.to; s.style.setProperty("--p", fi > b ? "100%" : fi < a ? "0%" : ((fi - a + 1) / (b - a + 1)) * 100 + "%"); });
    $(".lm-scrub .knob").style.left = ((fi + (li + 1) / f.lines.length) / F.length) * 100 + "%";
    const cur = el.querySelector(".ol button.cur"); if (cur) cur.classList.remove("cur"); const nb = el.querySelector(`.ol button[data-lgo="${fi}"]`); if (nb) { nb.classList.add("cur"); if (el.querySelector(".ol-d.on")) nb.scrollIntoView({ block: "nearest" }); }
    schedule();
  };
  const schedule = () => { clear(); if (!playing) return; const txt = (frame().lines[li] || {}).say || "", plain = txt.replace(/<[^>]+>/g, ""); T = setTimeout(() => next(true), Math.max(2600, Math.min(9500, 1500 + plain.length * 46)) / speed); };
  const go = (i, l = 0) => { fi = Math.max(0, Math.min(F.length - 1, i)); li = Math.max(0, Math.min(frame().lines.length - 1, l)); renderFrame(); applyLine(); };
  const next = (auto) => { if (auto !== true) setPlay(playing); if (li < frame().lines.length - 1) { li++; applyLine(); } else if (fi < F.length - 1) go(fi + 1, 0); else setPlay(false); };
  const prev = () => { if (li > 0) { li--; applyLine(); } else if (fi > 0) { go(fi - 1, F[fi - 1].lines.length - 1); } };
  const setPlay = (on) => { playing = on; $("[data-lplay] .ms").textContent = on ? "pause" : "play_arrow"; if (on) schedule(); else clear(); };
  const outline = () => {
    let h = "", lastP = null, lastS = null;
    F.forEach((f, i) => {
      const u = f.unit, p = f.path.find((x) => x.kind === "process"), sp = f.path.find((x) => x.kind === "subprocess"), w = f.path.find((x) => x.kind === "workflow");
      if (f.kind === "title" && u.kind === "stage") h += `<button class="p" data-lgo="${i}"><i>I</i>${esc(nice(u.key))} — overview</button>`;
      else if (f.kind === "title" && u.kind === "process") { h += `<button class="p" data-lgo="${i}"><i>${esc(u.num)}</i>${esc(u.title)}</button>`; lastP = u; }
      else if (f.kind === "title" && u.kind === "subprocess") { h += `<button class="s" data-lgo="${i}"><i>${esc(u.num)}</i>${esc(u.title)}</button>`; lastS = u; }
      else if (f.kind === "map" && u.kind === "workflow") h += `<button class="w" data-lgo="${i}"><i>${esc(u.num)}</i>${esc(u.title)}</button>`;
      else if (f.kind === "gate" && u.kind === "stage") h += `<button class="p" data-lgo="${i}"><i>◆</i>${esc(u.gate)}</button>`;
      else if (f.kind === "shelf" && u.kind === "stage") h += `<button class="p" data-lgo="${i}"><i>★</i>Finish</button>`;
      void p; void sp; void w; void lastP; void lastS;
    });
    $(".ol").innerHTML = h;
  };
  outline();
  const open = (i) => { el.classList.add("on"); document.documentElement.style.overflow = "hidden"; const at = store.get("node-learn-at", 0); const st = $(".lm-start"); st.hidden = false; const r = $("[data-lresume]"); r.hidden = !(at > 0); r.textContent = `Resume where you left off (screen ${at + 1} of ${F.length})`; go(typeof i === "number" ? i : 0, 0); setPlay(false); setTimeout(() => $("[data-lstart]").focus(), 60); };
  const close = () => { el.classList.remove("on"); document.documentElement.style.overflow = ""; setPlay(false); el.querySelectorAll(".lm-draw").forEach((d) => d.classList.remove("on")); };
  window.NODE_LEARN = { open, close, frames: F.length, lines: TOTAL_LINES, go, next, root: shadow };

  el.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-lstart]")) { $(".lm-start").hidden = true; go(0, 0); return setPlay(true); }
    if (t.closest("[data-lresume]")) { $(".lm-start").hidden = true; go(store.get("node-learn-at", 0), 0); return setPlay(true); }
    if (t.closest("[data-lx]")) return close();
    if (t.closest("[data-lmx]")) return close();
    if (t.closest("[data-lplay]")) return setPlay(!playing);
    if (t.closest("[data-lnext]")) return next();
    if (t.closest("[data-lprev]")) return prev();
    if (t.closest("[data-lspd]")) { speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; $("[data-lspd]").textContent = speed + "×"; return schedule(); }
    if (t.closest("[data-lol]")) { $(".tr-d").classList.remove("on"); return $(".ol-d").classList.toggle("on"); }
    if (t.closest("[data-lolx]")) return $(".ol-d").classList.remove("on");
    if (t.closest("[data-ltray]")) { $(".ol-d").classList.remove("on"); const d = $(".tr-d"); d.classList.toggle("on"); if (d.classList.contains("on")) { const ids = artsUpTo(fi); $(".tray").innerHTML = ids.length ? ids.slice().reverse().map((id) => paper(id)).join("") : '<p style="color:rgba(255,255,255,.5)">Nothing yet — documents collect here as the steps produce them.</p>'; } return; }
    if (t.closest("[data-ltrx]")) return $(".tr-d").classList.remove("on");
    const g = t.closest("[data-lgo]"); if (g) { $(".lm-start").hidden = true; go(+g.dataset.lgo, 0); return; }
    const sc = t.closest("[data-lscrub]"); if (sc) { const r = sc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width; $(".lm-start").hidden = true; go(Math.floor(x * F.length), 0); return; }
  });
  el.querySelector("[data-lscrub]").addEventListener("mousemove", (e) => { const sc = e.currentTarget, r = sc.getBoundingClientRect(), x = Math.max(0, Math.min(.999, (e.clientX - r.left) / r.width)), f = F[Math.floor(x * F.length)], tip = sc.querySelector(".tip"); tip.style.left = x * 100 + "%"; const u = f.unit; tip.textContent = `${u.num ? u.num + " · " : ""}${u.kind === "stage" ? nice(u.key) : u.title || ""} · ${f.kind}`; });
  document.addEventListener("keydown", (e) => {
    if (el.classList.contains("on")) {
      const k = e.key; if (["ArrowRight", "ArrowLeft", "Escape", " ", "Home", "End", "o", "O"].includes(k)) { e.preventDefault(); e.stopImmediatePropagation(); }
      if (!$(".lm-start").hidden && (k === " " || k === "Enter")) { $(".lm-start").hidden = true; go(0, 0); return setPlay(true); }
      if (k === "ArrowRight") next(); else if (k === "ArrowLeft") prev(); else if (k === " ") setPlay(!playing); else if (k === "Escape") { const d = el.querySelector(".lm-draw.on"); d ? d.classList.remove("on") : close(); } else if (k === "Home") go(0); else if (k === "End") go(F.length - 1); else if (k === "o" || k === "O") $(".ol-d").classList.toggle("on");
      return;
    }
    if ((e.key === "l" || e.key === "L") && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"))) { e.preventDefault(); open(); }
  }, true);
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-learn]"); if (b) { e.preventDefault(); open(); } });
  let tx = null;
  el.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  el.addEventListener("touchend", (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 60 && !e.target.closest(".lm-draw, .lm-scrub")) dx < 0 ? next() : prev(); }, { passive: true });
})();
