/* Reading guide — a full-screen, interactive explainer for the Node book.
 * Looks like a deck, plays like a walkthrough: each scene is a live diagram built from the book's real data, and the
 * explanation arrives as callouts that point at the exact thing being explained — with a spotlight, a camera that
 * zooms in, lists that reveal one item at a time, and an autoplay narrator.
 * Open from any [data-guide] button or with G. ← → step, Space plays/pauses, Esc closes. */
(() => {
  "use strict";
  const API = window.NODE_API, B = window.NODE_BOOK, M = window.NODE_MODEL;
  if (!API || !B || !M) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const arr = B.arr, C = B.C;
  const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const nice = (k) => String(k || "").charAt(0) + String(k || "").slice(1).toLowerCase();
  const human = (k) => String(k).replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const wrap = (s, max, lines = 2) => { const w = String(s).split(" "), out = [""]; w.forEach((x) => { const l = out[out.length - 1]; if ((l + " " + x).trim().length > max && l) out.push(x); else out[out.length - 1] = (l + " " + x).trim(); }); return out.slice(0, lines).map((l, i) => (i === lines - 1 && out.length > lines ? l.replace(/.{0,2}$/, "…") : l)); };
  const each = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  /* progressive reveal: items after st.rv are hidden; the current one is marked */
  const RV = (st, i) => (st.rv == null ? "rv in" : i < st.rv ? "rv in" : i === st.rv ? "rv in cur" : "rv out");

  /* ---------- the real data this guide explains ---------- */
  const STAGES = API.STAGES, SYS = API.SYS, A1 = STAGES.find((s) => s.status && s.status !== "placeholder") || STAGES[0];
  const P0 = A1.processes[0], SP0 = API.kids(P0)[0], W0 = SP0 && SP0.workflows[0];
  const TRACKS = SYS.tracks || [];
  const trackOf = (id) => TRACKS.find((t) => t.acts.includes(id)) || {};
  const RC = (k) => (M.routes[k] && M.routes[k].c) || "#008080";
  const KLIB = window.NODE_KNOWLEDGE || {};
  const ACTMAP = B.mapModel(A1), WFMAP = W0 ? B.mapModel(W0) : null;
  const LASTN = ACTMAP.nodes.length - 1;
  const ROUTE_SAYS = { forward: "The work is ready — it moves on to the next step.", alternate: "A different but valid path — for example, reframing the idea instead of pushing on.", rework: "Not good enough yet — go back to an earlier step, fix it, and come forward again.", escalate: "The decision is above your authority — send it up to someone who can make it.", stop: "The work ends here on purpose — parked or killed, always with a record." };
  const actColor = (s) => trackOf(s.id).c || "#008080";

  /* ---------- a flow map drawn from a real map model ---------- */
  function flowMap(mm, o = {}) {
    if (!mm) return "";
    const N = mm.nodes.length, gap = o.gap || 150, padX = 78, W = padX * 2 + (N - 1) * gap;
    const extra = o.layers ? (o.layers.owners ? 18 : 0) + (o.layers.checks ? 30 : 0) + (o.layers.outputs ? 46 : 0) : 0;
    const yc = 190, H = 380 + extra, X = (i) => padX + i * gap;
    const hw = (n) => (n.io === "entry" ? 34 : n.io === "gate" ? 30 : 62);
    const shownN = (i) => o.rvN == null || i <= o.rvN;
    const vis = (ty) => !o.routes || o.routes.has(ty);
    const dim = (ty) => (o.relevant ? !o.relevant(ty) : false);
    const ce = (i, e) => `fm-e ${vis(e.ty) ? "" : "off"} ${dim(e.ty) ? "dim" : ""} ${o.selE === i ? "sel" : ""} ${o.flowE && o.flowE.has && o.flowE.has(i) ? "flow" : ""} ${shownN(e.f) && (typeof e.t !== "number" || shownN(e.t)) ? "" : "hid"}`;
    const defs = Object.keys(M.routes).map((k) => `<marker id="gm-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="${RC(k)}"/></marker>`).join("");
    const parts = [];
    let up = 0, down = 0;
    parts.push(`<text x="10" y="22" class="fm-band" fill="${RC("escalate")}">▲ ESCALATE</text><text x="10" y="${H - 12}" class="fm-band" fill="${RC("stop")}">■ STOP</text>`);
    mm.edges.forEach((e, i) => {
      const ty = e.ty, c = RC(ty);
      if (ty === "forward" && !e.cyc && typeof e.t === "number" && e.t === e.f + 1) { parts.push(`<line class="${ce(i, e)}" data-e="${i}" x1="${X(e.f) + hw(mm.nodes[e.f]) + 2}" y1="${yc}" x2="${X(e.t) - hw(mm.nodes[e.t]) - 6}" y2="${yc}" stroke="${c}" marker-end="url(#gm-${ty})"/>`); return; }
      if (e.cyc) return;
      const x1 = X(e.f) + (ty === "escalate" ? 12 : ty === "stop" ? -12 : 0);
      if (e.t === "authority") { parts.push(`<g class="${ce(i, e)}" data-e="${i}"><path d="M${x1} ${yc - 28} L${x1} 40" stroke="${c}" marker-end="url(#gm-${ty})" fill="none"/><rect class="hit" x="${x1 - 8}" y="34" width="16" height="${yc - 62}"/>${o.labels !== false ? `<text x="${x1 + 6}" y="${54 + (up++ % 2) * 14}" class="fm-l" fill="${c}">${esc(e.n || "")}</text>` : ""}</g>`); return; }
      if (e.t === "stop") { parts.push(`<g class="${ce(i, e)}" data-e="${i}"><path d="M${x1} ${yc + 28} L${x1} ${H - 34}" stroke="${c}" marker-end="url(#gm-${ty})" fill="none"/><rect class="hit" x="${x1 - 8}" y="${yc + 28}" width="16" height="${H - 62 - yc}"/>${o.labels !== false ? `<text x="${x1 + 6}" y="${H - 44 - (down++ % 2) * 14}" class="fm-l" fill="${c}">${esc(e.n || "")}</text>` : ""}</g>`); return; }
      if (typeof e.t !== "number") return;
      const back = e.t < e.f, lvl = back ? up++ : down++, h = 46 + (lvl % 3) * 24, sy = back ? yc - 28 : yc + 28, cy = back ? sy - h : sy + h;
      const xa = X(e.f) - (back ? 10 : -10), xb = X(e.t) + (back ? 10 : -10);
      parts.push(`<g class="${ce(i, e)}" data-e="${i}"><path d="M${xa} ${sy} C ${xa} ${cy}, ${xb} ${cy}, ${xb} ${sy}" stroke="${c}" fill="none" marker-end="url(#gm-${ty})"/>${o.labels !== false && e.n ? `<text x="${(xa + xb) / 2}" y="${back ? cy + h * 0.25 - 4 : cy - h * 0.25 + 12}" class="fm-l mid" fill="${c}">${esc(e.n)}</text>` : ""}</g>`);
    });
    mm.nodes.forEach((n, i) => {
      const x = X(i), on = o.sel === i, hi = o.hiN ? o.hiN.has(i) : true, cls = `fm-n ${on ? "sel" : ""} ${hi ? "" : "faded"} ${o.done && o.done.has(i) ? "done" : ""} ${shownN(i) ? "" : "hid"}`;
      let shape;
      if (n.io === "entry") shape = `<rect x="${x - 34}" y="${yc - 17}" width="68" height="34" rx="17" class="ent"/><text x="${x}" y="${yc + 4}" class="fm-t inv">ENTRY</text>`;
      else if (n.io === "gate") shape = `<rect x="${x - 21}" y="${yc - 21}" width="42" height="42" rx="6" transform="rotate(45 ${x} ${yc})" class="gate"/><text x="${x}" y="${yc + 4}" class="fm-t gt">GATE</text>${wrap(n.label, 16).map((l, k) => `<text x="${x}" y="${yc + 46 + k * 13}" class="fm-s gt">${esc(l)}</text>`).join("")}`;
      else { const dec = n.unit && n.unit.decision; shape = `<rect x="${x - 62}" y="${yc - 27}" width="124" height="54" rx="11" class="box ${dec ? "dec" : ""}"/>${n.num ? `<text x="${x - 54}" y="${yc - 13}" class="fm-num">${dec ? "◆ " : ""}${esc(n.num)}</text>` : ""}${wrap(n.label, 16).map((l, k, a) => `<text x="${x}" y="${yc + 5 + (k - (a.length - 1) / 2) * 14 + (n.num ? 5 : 0)}" class="fm-t">${esc(l)}</text>`).join("")}`; }
      let under = "", uy = yc + (n.io === "gate" ? 76 : 44);
      if (o.layers && n.unit && n.io !== "gate") {
        if (o.layers.owners) { const ow = B.ownerOf(n.unit); if (ow) under += `<text x="${x}" y="${uy}" class="fm-s ow lay">● ${esc(wrap(ow, 22, 1)[0])}</text>`; uy += 18; }
        if (o.layers.checks) { const ex = arr(C(n.unit, "definition").exit)[0]; if (ex) under += wrap("✓ " + ex, 24).map((l, k) => `<text x="${x}" y="${uy + k * 12}" class="fm-s ck lay">${esc(l)}</text>`).join(""); uy += 30; }
        if (o.layers.outputs) { API.outOf(n.unit).slice(0, 2).forEach((t, k) => { under += `<g class="fm-art lay"><rect x="${x - 58}" y="${uy - 11 + k * 21}" width="116" height="17" rx="5"/><text x="${x}" y="${uy + 1 + k * 21}" class="fm-s">${esc(wrap(t, 21, 1)[0])}</text></g>`; }); uy += 46; }
      }
      parts.push(`<g class="${cls}" data-n="${i}" tabindex="0">${shape}${under}</g>`);
    });
    if (o.token != null && mm.nodes[o.token]) parts.push(`<g class="fm-tok" data-tok style="transform:translate(${X(o.token)}px, ${yc - 46}px)"><circle r="9"/><circle r="9" class="ring"/></g>`);
    return `<div class="fm-wrap"><svg class="fm" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Flow map"><defs>${defs}</defs>${parts.join("")}</svg></div>`;
  }

  /* ---------- detail renderers (the slide-in drawer) ---------- */
  const det = (title, body, sub) => `<span class="gd-det-k">${sub || "Details"}</span><h4>${title}</h4>${body}`;
  const list = (a, cls = "") => (arr(a).length ? `<ul class="gd-ul ${cls}">${arr(a).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="gd-nd">Not yet defined.</p>`);
  const chipRow = (a, cls = "") => `<div class="gd-chips">${arr(a).map((x) => `<span class="${cls}">${esc(x)}</span>`).join("")}</div>`;
  const value = (v) => (Array.isArray(v) ? list(v) : v && typeof v === "object" ? `<div class="gd-kvs">${Object.entries(v).map(([k, x]) => `<div><b>${esc(human(k))}</b>${value(x)}</div>`).join("")}</div>` : `<p>${esc(v)}</p>`);
  const unitDet = (u) => { if (!u) return ""; const D = C(u, "definition"), own = B.ownerOf(u); return det(`${esc(u.num || "")} ${esc(u.title || u.short || "")}`, `${u.summary ? `<p>${esc(u.summary)}</p>` : D.purpose ? `<p>${esc(D.purpose)}</p>` : ""}<div class="gd-meta">${own ? `<span><span class="ms">person</span>${esc(own)}</span>` : ""}${u.gate ? `<span><span class="ms">verified_user</span>${esc(u.gate)}</span>` : ""}</div>${API.outOf(u).length ? `<span class="gd-mini">Produces</span>${chipRow(API.outOf(u).slice(0, 5), "doc")}` : ""}`, B.unitLabel ? B.unitLabel(u) : "Unit"); };
  const knDet = (name) => { const e = B.kEntry(name); if (!e) return det(esc(name), `<p class="gd-nd">No entry in the knowledge library.</p>`, "Knowledge"); return det(esc(name), `<p>${esc(e.what || "")}</p>${arr(e.how).length ? `<span class="gd-mini">How it works</span>${list(e.how, "num")}` : ""}${e.structure ? `<span class="gd-mini">Its shape</span><div class="gd-struct">${B.renderStructure(e.structure)}</div>` : ""}`, e.type || "Knowledge"); };
  const lensDet = (id, note) => { const l = B.lensById[id]; if (!l) return ""; return det(`<span class="ms" style="color:${B.LG_COLOR[l.g]}">${l.i}</span> ${esc(l.n)}`, `<p>${esc(l.c || "")}</p>${note ? `<div class="gd-callout"><b>Asks here:</b> ${esc(note)}</div>` : ""}<p class="gd-mini">Group: ${esc(l.g)}</p>`, "Lens"); };
  const artDet = (id) => { const a = B.ALIB[id]; if (!a) return ""; const secs = a.tpl && arr(a.tpl.sections).map((s) => (Array.isArray(s) ? s[0] : s && typeof s === "object" ? s.h || s.title || s.n || "" : s)).filter(Boolean); return det(esc(a.aliases ? a.aliases[0] : id), `<p>${esc(a.what || "")}</p>${secs && secs.length ? `<span class="gd-mini">What's inside the template</span>${list(secs.slice(0, 8), "num")}` : ""}${arr(a.good).length ? `<span class="gd-mini">What good looks like</span>${list(a.good, "ok")}` : ""}`, "Artifact template"); };

  /* ======================================================================
   * SCENES. Beat fields: say (html) · at (selector in the stage, or fn(st)) · pos (below|above|right|left)
   * · zoom (camera scale onto the target) · set(st). Scene fields: ch, ic, t, lead, init, beats, stage, detail, click, change, after, go.
   * ====================================================================== */
  const CH = [["Start", "auto_stories", ""], ["Structure", "account_tree", "How the book is organised: acts, levels, pages, and the contract every unit shares."], ["Reading a map", "route", "How to read the maps: routes, scenarios, layers, gates, and walking a workflow."], ["Context", "visibility", "Everything around a piece of work: knowledge, lenses, roles and the paper trail."], ["Doing the work", "smart_toy", "Prompts, agent kits, and one real case followed from start to finish."], ["Your practice", "tune", "Fit the method to your project — and make it a daily habit."]];
  const S = [];

  /* 1 — welcome */
  const FEATS = [["account_tree", "Maps", "Click a box, zoom in, follow the loops — every unit has one."], ["content_copy", "Prompts", "Ready instructions for your AI agent. Copy, paste, go."], ["description", "Templates", "Open the document each step produces, with what good looks like."], ["fact_check", "Checks", "Know exactly when a step is done — no guessing."], ["visibility", "Lenses", "See the work from every angle: users, money, security, operations."], ["inventory_2", "Agent kits", "Whole folders your agent can use — context, skills, rules."]];
  S.push({ ch: 0, ic: "auto_stories", t: "How this book works", lead: "A map of how software is really built — with ready instructions for your AI agents at every step.",
    init: () => ({ k: 0, rv: null }),
    beats: [
      { say: "Welcome. This book follows <b>one lifecycle</b> in eight acts. Every piece of software you'll build goes round this circle — again and again.", at: ".gd-ring .hub", pos: "right", set: (s) => Object.assign(s, { k: 0, rv: null }) },
      ...each(FEATS.length, (i) => ({ say: `<b>${FEATS[i][1]}.</b> ${FEATS[i][2]}`, at: `[data-f="${i}"]`, pos: "below", set: (s) => Object.assign(s, { k: 1, rv: i }) })),
      { say: "All six, on every page. Now let's see how it's organised.", at: ".gd-feat", pos: "below", set: (s) => Object.assign(s, { k: 1, rv: null }) },
      { say: "Six chapters, in order. Use <b>Next</b>, the arrow keys — or press <b>▶ Play</b> below and let the guide narrate itself. Click anything on the diagrams as you go.", at: ".gd-chaps", pos: "below", set: (s) => Object.assign(s, { k: 2 }) },
    ],
    stage: (s) => {
      if (s.k === 1) return `<div class="gd-feat">${FEATS.map(([ic, t, d], i) => `<div data-f="${i}" class="${RV(s, i)}"><span class="ms">${ic}</span><b>${t}</b><em>${d}</em></div>`).join("")}</div>`;
      if (s.k === 2) return `<div class="gd-chaps">${CH.slice(1).map(([c, ic, d], i) => `<button data-gch="${i + 1}" style="animation-delay:${i * 0.12}s"><i><span class="ms">${ic}</span></i><b>${i + 1}. ${c}</b><em>${d}</em></button>`).join("")}</div>`;
      const R = 150, cx = 230, cy = 190;
      return `<div class="gd-center"><svg class="gd-ring" viewBox="0 0 460 380"><circle cx="${cx}" cy="${cy}" r="${R}" class="track"/>${STAGES.map((st, i) => { const a = (i / STAGES.length) * Math.PI * 2 - Math.PI / 2, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); return `<g class="rn" style="--c:${actColor(st)};animation-delay:${i * 0.25}s"><circle cx="${x}" cy="${y}" r="26"/><text x="${x}" y="${y - 2}" class="rr">${ROMAN[i]}</text><text x="${x}" y="${y + 11}" class="rk">${esc(st.key)}</text></g>`; }).join("")}<circle class="runner" r="7"><animateMotion dur="8s" repeatCount="indefinite" path="M${cx} ${cy - R} a${R} ${R} 0 1 1 -0.1 0"/></circle><g class="hub"><text x="${cx}" y="${cy - 6}" class="rc1">NODE</text><text x="${cx}" y="${cy + 16}" class="rc2">the lifecycle</text></g></svg></div>`;
    }, go: ["how-to-read", "How to Read chapter"] });

  /* 2 — eight acts */
  S.push({ ch: 1, ic: "hub", t: "Eight acts, three tracks", lead: "Building software is split into eight acts. Each answers one big question before the work moves on.",
    init: () => ({ tr: null, gates: false, loop: false, sel: null, rv: null }),
    beats: [
      ...STAGES.map((st, i) => ({ say: `<b>${ROMAN[i]} · ${esc(nice(st.key))}</b> asks: <i>“${esc(st.tagline || "")}”</i> It ends with the <b>${esc(st.gate)}</b>.${st === A1 ? " <b>This act is fully open</b> — it's where you'll start." : ""}`, at: `[data-act="${i}"]`, pos: "below", zoom: 1.25, set: (s) => Object.assign(s, { rv: i, tr: null, gates: false, loop: false, sel: null }) })),
      ...TRACKS.map((t) => ({ say: `<b style="color:${t.c}">${esc(t.name)}</b> asks <i>“${esc(t.q)}”</i>. ${esc(t.what || "")}`, at: `[data-tr="${t.id}"]`, pos: "below", set: (s) => Object.assign(s, { rv: null, tr: t.id, gates: false, loop: false }) })),
      { say: "Between acts sit <b>gates</b> — a real decision, with an owner and criteria. Work only crosses when it's ready.", at: `[data-gt="0"]`, pos: "below", zoom: 1.3, set: (s) => Object.assign(s, { rv: null, tr: null, gates: true, loop: false }) },
      { say: "It is <b>not a waterfall</b>. What you learn in EVOLVE feeds the next DISCOVER, and discovery keeps running ahead while delivery ships. Watch the pulse go round. <b>Click any act</b> to open it.", at: ".loop", pos: "above", set: (s) => Object.assign(s, { rv: null, tr: null, gates: true, loop: true }) },
    ],
    stage: (s) => {
      const gap = 118, x0 = 70, y = 170, W = x0 * 2 + gap * 7;
      const bands = TRACKS.map((t) => { const idx = t.acts.map((a) => STAGES.findIndex((x) => x.id === a)).filter((i) => i >= 0); const a = Math.min(...idx), b = Math.max(...idx); const hid = s.rv != null && a > s.rv; return `<g class="band ${s.tr && s.tr !== t.id ? "faded" : ""} ${hid ? "hid" : ""}" data-tr="${t.id}" style="--c:${t.c}"><rect x="${x0 + a * gap - 50}" y="${y - 108}" width="${(b - a) * gap + 100}" height="38" rx="12"/><text x="${x0 + a * gap - 38}" y="${y - 84}">${esc(t.name.toUpperCase())}</text></g>`; }).join("");
      const links = STAGES.slice(0, -1).map((st, i) => `<line x1="${x0 + i * gap + 34}" y1="${y}" x2="${x0 + (i + 1) * gap - 34}" y2="${y}" class="lk ${s.rv != null && i + 1 > s.rv ? "hid" : ""}"/>${s.gates ? `<g class="gt" data-gt="${i}"><rect x="${x0 + i * gap + gap / 2 - 7}" y="${y - 7}" width="14" height="14" transform="rotate(45 ${x0 + i * gap + gap / 2} ${y})"/>${wrap(st.gate, 13).map((l, k) => `<text x="${x0 + i * gap + gap / 2}" y="${y + 30 + k * 12}">${esc(l)}</text>`).join("")}</g>` : ""}`).join("");
      const acts = STAGES.map((st, i) => { const f = s.tr && trackOf(st.id).id !== s.tr; return `<g class="act ${f ? "faded" : ""} ${s.sel === i ? "sel" : ""} ${st === A1 ? "open" : ""} ${s.rv != null && i > s.rv ? "hid" : ""} ${s.rv === i ? "cur" : ""}" data-act="${i}" style="--c:${actColor(st)}"><circle cx="${x0 + i * gap}" cy="${y}" r="32"/><text x="${x0 + i * gap}" y="${y - 3}" class="r">${ROMAN[i]}</text><text x="${x0 + i * gap}" y="${y + 12}" class="k">${esc(st.key)}</text>${wrap(st.tagline || "", 16).map((l, k) => `<text x="${x0 + i * gap}" y="${y + (s.gates ? 74 : 54) + k * 13}" class="q">${esc(l)}</text>`).join("")}</g>`; }).join("");
      const loop = s.loop ? `<path d="M${x0 + 7 * gap} ${y + 34} C ${x0 + 7 * gap} ${y + 150}, ${x0} ${y + 150}, ${x0} ${y + 34}" class="loop"/><text x="${x0 + 3.5 * gap}" y="${y + 140}" class="loopt">what you learn feeds the next cycle</text><circle r="7" class="pulse"><animateMotion dur="5s" repeatCount="indefinite" path="M${x0} ${y} L${x0 + 7 * gap} ${y} C ${x0 + 7 * gap} ${y + 150}, ${x0} ${y + 150}, ${x0} ${y}"/></circle>` : "";
      return `<svg class="gd-acts" viewBox="0 0 ${W} 340">${bands}${links}${loop}${acts}</svg>`;
    },
    detail: (s) => { if (s.sel == null) return ""; const st = STAGES[s.sel], open = st === A1; return det(`${ROMAN[s.sel]} · ${esc(nice(st.key))}`, `<p class="gd-big">“${esc(st.tagline || "")}”</p><p>${esc(st.purpose || "")}</p><div class="gd-meta"><span><span class="ms">verified_user</span>${esc(st.gate)}</span><span><span class="ms">${open ? "lock_open" : "lock"}</span>${open ? "Open in full" : "Unlocks on enrolment"}</span></div>${arr(st.outcomes).length ? `<span class="gd-mini">You come out with</span>${list(st.outcomes.slice(0, 4), "ok")}` : ""}`, "Act"); },
    click: (s, el) => { const a = el.closest("[data-act]"); if (a) { s.sel = +a.dataset.act; return true; } }, go: ["circuit", "Lifecycle Circuit"] });

  /* 3 — zoom: five levels */
  const childrenOf = (u) => (u.kind === "stage" ? u.processes : u.kind === "process" ? API.kids(u) : u.kind === "subprocess" ? u.workflows || [] : u.kind === "workflow" ? u.steps || [] : []);
  const LV = Object.fromEntries((M.levels || []).map((l) => [l.id, l]));
  const levelSay = { stage: `An <b>act</b> is a whole stage. Inside DISCOVER are its <b>processes</b> — the big jobs, in order. Let's zoom into the first.`, process: `A <b>process</b> is a major capability with its own gate. ${esc(LV.process ? LV.process.body : "")}`, subprocess: `A <b>subprocess</b> is work one person or a small team can own. ${esc(LV.subprocess ? LV.subprocess.body : "")}`, workflow: `A <b>workflow</b> is the sequence you actually carry out — steps and decisions. ${esc(LV.workflow ? LV.workflow.body : "")}`, step: "A <b>step</b> is one precise task: who does it and what it produces. The smallest unit — and the one you hand to an agent most often." };
  const ZP = [A1, P0, SP0, W0, W0 && W0.steps[0]].filter(Boolean);
  S.push({ ch: 1, ic: "zoom_in", t: "Zoom in: five levels", lead: "Every act zooms in, level by level, until you reach one small task.",
    init: () => ({ path: [A1] }),
    beats: [...ZP.map((u, i) => ({ say: levelSay[u.kind] || "", at: i < ZP.length - 1 ? ".gd-tiles > button:first-child" : ".gd-stepcard", pos: i < ZP.length - 1 ? "right" : "below", set: (s) => (s.path = ZP.slice(0, i + 1)) })), { say: "Five levels — the breadcrumb always shows the way back up. <b>Now you try:</b> click any tile to zoom in, and the trail to zoom out.", at: ".gd-lvls", pos: "below", set: (s) => (s.path = [A1]) }],
    stage: (s) => {
      const u = s.path[s.path.length - 1], ks = childrenOf(u), lvls = ["stage", "process", "subprocess", "workflow", "step"];
      const meter = `<div class="gd-lvls">${lvls.map((k, i) => `<span class="${k === u.kind ? "on" : i < lvls.indexOf(u.kind) ? "past" : ""}">${API.PLEVEL[k]}</span>`).join("")}</div>`;
      const crumbs = `<div class="gd-crumbs">${s.path.map((x, i) => `<button data-zc="${i}" class="${i === s.path.length - 1 ? "on" : ""}"><small>${esc(API.PLEVEL[x.kind] || x.kind)}</small>${esc(x.num ? x.num + " " : "")}${esc(x.short || x.title || x.key)}</button>`).join('<span class="ms">chevron_right</span>')}</div>`;
      const body = ks.length ? `<div class="gd-tiles">${ks.map((k, i) => `<button data-zi="${i}" style="animation-delay:${i * 0.07}s" class="${k.decision ? "dec" : ""}"><small>${esc(k.num || "")}${k.decision ? " · decision" : ""}</small><b>${esc(k.title || k.short)}</b>${k.summary ? `<em>${esc(wrap(k.summary, 70, 2).join(" "))}</em>` : k.actor ? `<em><span class="ms">person</span>${esc(k.actor)}</em>` : ""}${childrenOf(k).length ? `<span class="cnt">${childrenOf(k).length} inside <span class="ms">zoom_in</span></span>` : ""}</button>`).join("")}</div>` : `<div class="gd-stepcard"><span class="ms">task_alt</span><h3>${esc(u.title)}</h3><div class="gd-meta"><span><span class="ms">person</span>${esc(u.actor || "")}</span></div>${arr(u.out).length ? `<span class="gd-mini">Produces</span>${chipRow(u.out, "doc")}` : ""}</div>`;
      return `${meter}${crumbs}<div class="gd-zoom">${body}</div>`;
    },
    click: (s, el) => { const z = el.closest("[data-zi]"); if (z) { const u = s.path[s.path.length - 1]; s.path = [...s.path, childrenOf(u)[+z.dataset.zi]]; return true; } const c = el.closest("[data-zc]"); if (c) { s.path = s.path.slice(0, +c.dataset.zc + 1); return true; } }, go: [`u-${P0.fid}`, `${P0.num} ${P0.title}`] });

  /* 4 — anatomy of a page */
  const HS = [["head", "The header", "Number, title and a one-line summary. <b>1.1</b> means the first process of Act I."], ["meta", "Owner, gate and timebox", "Who owns it, the decision that ends it, and how long it takes on a real project."], ["map", "Its map", "The units inside it, in order, with every route work can take. Next chapter: how to read it."], ["tabs", "The contract tabs", "Ten sections that describe the unit completely — the same ten on every page."], ["prompt", "Prompt and agent kit", "Ready instructions for your AI agent, for exactly this unit — plus the files it needs."], ["learn", "Learning", "Objectives, an exercise and a quick check, so you know you've got it."]];
  S.push({ ch: 1, ic: "web", t: "Anatomy of a page", lead: `Every act, process and subprocess page is built the same way. Here's ${esc(P0.num)} ${esc(P0.title)}, part by part.`,
    init: () => ({ rv: null }),
    beats: [...HS.map(([k, t, d], i) => ({ say: `<b>${i + 1}. ${t}.</b> ${d}`, at: `[data-hs="${k}"]`, pos: "right", zoom: 1.08, set: (s) => (s.rv = i) })), { say: "Six parts, every time. Once you can read one page, you can read them all.", at: ".gd-page", pos: "right", set: (s) => (s.rv = null) }],
    stage: (s) => {
      const D = C(P0, "definition"), tb = C(P0, "continuity").timebox, own = B.ownerOf(P0), T = B.teachOf(P0) || {}, subs = API.kids(P0);
      const hs = (k, inner) => { const i = HS.findIndex((h) => h[0] === k); return `<div class="gd-hs ${RV(s, i)}" data-hs="${k}">${inner}<i class="tag">${i + 1}</i></div>`; };
      return `<div class="gd-page">
        ${hs("head", `<small class="lbl">${esc(P0.num)} · Process · ${esc(nice(A1.key))}</small><h3>${esc(P0.title)}</h3><p>${esc(P0.summary || D.purpose || "")}</p>`)}
        ${hs("meta", `<div class="gd-meta">${own ? `<span><span class="ms">person</span>${esc(own)}</span>` : ""}<span><span class="ms">verified_user</span>${esc(P0.gate || "")}</span>${tb ? `<span><span class="ms">schedule</span>${esc(tb)}</span>` : ""}</div>`)}
        ${hs("map", `<div class="gd-pmap"><span class="e">Entry</span>${subs.map((k) => `<span class="n">${esc(k.num)} ${esc(k.short || k.title)}</span>`).join('<span class="ms">arrow_forward</span>')}<span class="ms">arrow_forward</span><span class="g">◆</span></div>`)}
        ${hs("tabs", `<div class="gd-ptabs">${M.contract.map((c, i) => `<span class="${i === 0 ? "on" : ""}">${esc(c.name)}</span>`).join("")}</div>`)}
        ${hs("prompt", `<div class="gd-pbtns"><span><span class="ms">chat</span>Prompt</span><span><span class="ms">inventory_2</span>Agent kit</span><span><span class="ms">content_copy</span>Copy</span></div>`)}
        ${hs("learn", `<div class="gd-plearn"><b>You'll be able to</b>${(T.objectives || []).slice(0, 2).map((o) => `<span>✓ ${esc(o)}</span>`).join("")}</div>`)}</div>`;
    }, go: [`u-${P0.fid}`, "Open this page in the book"] });

  /* 5 — the NODE contract */
  S.push({ ch: 1, ic: "contract", t: "The NODE contract", lead: `Every unit answers the same ${M.contract.length} questions — like a recipe card with fixed headings. This is ${nice(A1.key)}'s, for real.`,
    init: () => ({ c: 0, rv: 0 }),
    beats: [...M.contract.map((c, i) => ({ say: `<b>${i + 1}. ${esc(c.name)}</b> — ${esc(c.q)} <span class="gd-tip">The panel shows what ${esc(nice(A1.key))} says.</span>`, at: `[data-ci="${i}"]`, pos: "below", set: (s) => Object.assign(s, { c: i, rv: i }) })), { say: "All ten. Together they say <b>everything</b> about a piece of work. Click any section to read it again.", at: ".gd-cwheel", pos: "left", set: (s) => Object.assign(s, { rv: null }) }],
    stage: (s) => { const sec = M.contract[s.c]; return `<div class="gd-contract"><div class="gd-csec" key="${s.c}">${sec ? `<h4><span class="ms">${sec.icon}</span>${esc(sec.name)} <small>in ${esc(nice(A1.key))}</small></h4><p class="gd-q">${esc(sec.q)}</p>${value(C(A1, sec.id))}` : ""}</div><div class="gd-cwheel">${M.contract.map((c, i) => `<button data-ci="${i}" class="${i === s.c ? "on" : ""} ${RV(s, i)}"><span class="ms">${c.icon}</span><b>${esc(c.name)}</b><small>${i + 1}</small></button>`).join("")}</div></div>`; },
    click: (s, el) => { const b = el.closest("[data-ci]"); if (b) { s.c = +b.dataset.ci; return true; } }, go: ["contract", "NODE Contract chapter"] });

  /* 6 — reading a map */
  S.push({ ch: 2, ic: "account_tree", t: "Reading a map", lead: `Every unit has a map. This is ${nice(A1.key)}'s, exactly as the book draws it.`,
    init: () => ({ rvN: 0, routes: new Set(["forward"]), sel: null, token: null, labels: false }),
    beats: [
      { say: "Every map starts at <b>Entry</b> — where work arrives, with its entry criteria.", at: `[data-n="0"]`, pos: "below", zoom: 1.4, set: (s) => Object.assign(s, { rvN: 0, token: 0, routes: new Set(["forward"]), sel: null, labels: false }) },
      ...ACTMAP.nodes.map((n, i) => ({ n, i })).filter(({ n }) => n.unit).map(({ n, i }) => ({ say: `<b>${esc(n.num)} ${esc(n.unit.title)}.</b> ${esc(wrap(n.unit.summary || "", 140, 1)[0])}`, at: `[data-n="${i}"]`, pos: "below", zoom: 1.35, set: (s) => Object.assign(s, { rvN: i, token: i, routes: new Set(["forward"]), sel: null }) })),
      { say: `It ends at a <b>gate</b> — the diamond. Here: the <b>${esc(A1.gate)}</b>, the decision about whether the work moves on.`, at: `[data-n="${LASTN}"]`, pos: "below", zoom: 1.4, set: (s) => Object.assign(s, { rvN: null, token: LASTN, routes: new Set(["forward"]) }) },
      { say: "The <b>solid arrows</b> are the main path — when everything goes to plan, you read left to right.", at: "line.fm-e", pos: "below", set: (s) => Object.assign(s, { token: null, routes: new Set(["forward"]) }) },
      { say: "But real work loops. The <b>coloured arrows</b> are the other routes — going back, escalating, stopping. Each one is a named, planned situation.", at: `g.fm-e`, pos: "below", set: (s) => Object.assign(s, { routes: new Set(Object.keys(M.routes)), labels: true }) },
      { say: "Your turn: <b>click any box</b> — details slide in from the side. In the book, double-click a box to zoom into its own map.", at: ".fm", pos: "below", set: (s) => Object.assign(s, { sel: 1 }) },
    ],
    stage: (s) => flowMap(ACTMAP, { rvN: s.rvN, routes: s.routes, sel: s.sel, token: s.token, labels: s.labels }),
    detail: (s) => { const n = s.sel != null && ACTMAP.nodes[s.sel]; return !n ? "" : n.unit ? unitDet(n.unit) : n.io === "entry" ? det("Entry", list(C(A1, "definition").entry, "ok"), "Entry criteria") : det(esc(A1.gate), list(C(A1, "controls").criteria, "ok"), "The gate"); },
    click: (s, el) => { const n = el.closest("[data-n]"); if (n) { s.sel = +n.dataset.n; return true; } }, go: [`act-${A1.id}`, `Open the ${nice(A1.key)} map`] });

  /* 7 — routes */
  const loopsOf = (mm, ty) => mm.edges.map((e, i) => ({ e, i })).filter(({ e }) => e.ty === ty && e.n);
  const target = (mm, e) => (typeof e.t === "number" ? mm.nodes[e.t].label : e.t === "authority" ? "Escalate ↑" : "Stop");
  const firstE = (ty) => ACTMAP.edges.findIndex((e) => e.ty === ty && (ty !== "forward" || e.t === e.f + 1));
  S.push({ ch: 2, ic: "fork_right", t: "Routes: five ways work moves", lead: "Arrows come in five colours — and every coloured arrow on this map is a real, named situation.",
    init: () => ({ routes: new Set(["forward"]), selE: null, focus: null }),
    beats: [
      ...Object.keys(M.routes).map((k) => { const L = loopsOf(ACTMAP, k); return { say: `<b style="color:${RC(k)}">${esc(M.routes[k].label)}.</b> ${ROUTE_SAYS[k]}${L.length ? ` Here: <b>${L.map(({ e }) => esc(e.n)).join("</b>, <b>")}</b>.` : ""}`, at: `[data-e="${firstE(k)}"]`, pos: k === "escalate" ? "right" : "below", set: (s) => Object.assign(s, { routes: new Set(k === "forward" ? ["forward"] : ["forward", k]), focus: k, selE: null }) }; }),
      { say: "All five together. Toggle them with the buttons, or <b>click any arrow</b> to see where it goes and why.", at: ".gd-legend", pos: "below", set: (s) => Object.assign(s, { routes: new Set(Object.keys(M.routes)), focus: null }) },
    ],
    stage: (s) => `<div class="gd-legend">${Object.keys(M.routes).map((k) => `<button data-rt="${k}" class="${s.routes.has(k) ? "on" : ""}" style="--c:${RC(k)}"><i></i>${esc(M.routes[k].label)}</button>`).join("")}</div>${flowMap(ACTMAP, { routes: s.routes, selE: s.selE, relevant: s.focus && s.focus !== "forward" ? (ty) => ty === s.focus : null, flowE: new Set(ACTMAP.edges.map((e, i) => i).filter((i) => s.focus && ACTMAP.edges[i].ty === s.focus)) })}`,
    detail: (s) => { if (s.selE == null) return ""; const e = ACTMAP.edges[s.selE]; return det(esc(e.n || M.routes[e.ty].label), `<p><b>${esc(ACTMAP.nodes[e.f].label)}</b> → <b>${esc(target(ACTMAP, e))}</b></p><p>${ROUTE_SAYS[e.ty]}</p>${B.routeOf(A1, e.ty) ? `<div class="gd-callout" style="--c:${RC(e.ty)}">${esc(B.routeOf(A1, e.ty))}</div>` : ""}`, `${M.routes[e.ty].label} route`); },
    click: (s, el) => { const r = el.closest("[data-rt]"); if (r) { const k = r.dataset.rt; s.routes.has(k) ? s.routes.delete(k) : s.routes.add(k); s.focus = null; return true; } const e = el.closest("[data-e]"); if (e) { s.selE = +e.dataset.e; return true; } }, go: [`act-${A1.id}`, "Try the Routes dropdown"] });

  /* 8 — scenarios */
  const CASES = C(A1, "cases");
  const SC_SAYS = { all: "Everything at once — every route the work can take.", happyPath: "When everything goes right: only the forward path. Good for learning the order — dangerous to plan with alone.", alternates: "Valid detours — different paths that are still fine.", edgeCases: "Unusual starting conditions. They change what's needed at Entry, so the Entry is ringed.", exceptions: "Things that need rework or escalation — not failures, but not smooth.", failures: "Where the work loops back or stops. Knowing these up front is what makes a plan honest." };
  S.push({ ch: 2, ic: "alt_route", t: "Scenarios: good days and bad", lead: "Scenarios replay the same map for different situations — so you plan for what can go wrong, not just the happy path.",
    init: () => ({ sc: "all", rv: 0 }),
    beats: B.SCEN.map(([k, n, ic, c], i) => { const cs = CASES[k]; const ex = Array.isArray(cs) ? cs[0] : null; return { say: `<b style="color:${c}">${esc(n)}.</b> ${SC_SAYS[k] || ""}${ex ? `<span class="gd-tip">In ${esc(nice(A1.key))}: ${esc(ex)}</span>` : ""}`, at: `[data-sc="${k}"]`, pos: "below", set: (s) => Object.assign(s, { sc: k, rv: i }) }; }),
    stage: (s) => { const sc = B.SCEN.find((x) => x[0] === s.sc); return `<div class="gd-scen">${B.SCEN.map(([k, n, ic, c], i) => `<button data-sc="${k}" class="${k === s.sc ? "on" : ""} ${RV(s, i)}" style="--c:${c}"><span class="ms">${ic}</span>${esc(n)}</button>`).join("")}</div>${flowMap(ACTMAP, { relevant: sc[4] ? (ty) => sc[4].includes(ty) : null, hiN: s.sc === "edgeCases" ? new Set([0]) : null, flowE: new Set(ACTMAP.edges.map((e, i) => i).filter((i) => sc[4] && sc[4].includes(ACTMAP.edges[i].ty))) })}`; },
    detail: (s) => { if (s.sc === "all") return ""; const sc = B.SCEN.find((x) => x[0] === s.sc), cs = CASES[s.sc]; return det(`${esc(sc[1])} in ${esc(nice(A1.key))}`, cs ? (Array.isArray(cs) ? list(cs) : `<p>${esc(cs)}</p>`) : `<p class="gd-nd">Not yet written.</p>`, "Written cases"); },
    click: (s, el) => { const b = el.closest("[data-sc]"); if (b) { s.sc = b.dataset.sc; s.rv = null; return true; } }, go: [`act-${A1.id}`, "Try the scenarios"] });

  /* 9 — layers */
  const STATES = String(C(A1, "flow").stateTransitions || "").split(/\s*→\s*/).filter(Boolean);
  const LYS = [["owners", "person", "Owners", "who is responsible for each box. The first thing to check before work starts."], ["checks", "check_circle", "Checks", "the “done when” for each box. If you can't tick it, the work isn't finished."], ["outputs", "description", "Artifacts", "what each box produces. These documents carry the work from step to step."], ["states", "timeline", "States", `the status the work moves through: ${STATES.join(" → ")}.`]];
  S.push({ ch: 2, ic: "layers", t: "Layers: detail on demand", lead: "One map can't show everything without becoming unreadable. Layers switch extra information on and off.",
    init: () => ({ L: { owners: false, checks: false, outputs: false, states: false } }),
    beats: [
      { say: "The bare map: just the flow. Clean — but it doesn't say <b>who</b>, <b>when it's done</b> or <b>what it makes</b>.", at: ".fm", pos: "below", set: (s) => (s.L = { owners: false, checks: false, outputs: false, states: false }) },
      ...LYS.map(([k, ic, n, d], i) => ({ say: `<b>${n}</b> — ${esc(d)}`, at: k === "states" ? ".gd-states" : `[data-n="1"] .lay`, pos: "below", zoom: k === "states" ? 1 : 1.3, set: (s) => (s.L = Object.fromEntries(LYS.map(([kk], j) => [kk, k === "states" ? kk === "states" : j <= i && kk !== "states"]))) })),
      { say: "Your turn: <b>switch layers on and off</b>. In the book they're in the <b>Layers</b> dropdown above every map, and your choice is remembered.", at: ".gd-legend", pos: "below", set: (s) => (s.L = { owners: true, checks: false, outputs: true, states: true }) },
    ],
    stage: (s) => `<div class="gd-legend">${LYS.map(([k, ic, n]) => `<button data-ly="${k}" class="${s.L[k] ? "on" : ""}" style="--c:#0d1117"><span class="ms">${ic}</span>${n}</button>`).join("")}</div>${s.L.states && STATES.length ? `<div class="gd-states">${STATES.map((x, i) => `<span style="animation-delay:${i * 0.15}s">${esc(x)}</span>`).join('<span class="ms">arrow_forward</span>')}</div>` : ""}${flowMap(ACTMAP, { layers: s.L, labels: false, routes: new Set(["forward"]) })}`,
    click: (s, el) => { const b = el.closest("[data-ly]"); if (b) { s.L[b.dataset.ly] = !s.L[b.dataset.ly]; return true; } }, go: [`act-${A1.id}`, "Open the Layers dropdown"] });

  /* 10 — gates */
  const CRIT = arr(C(A1, "controls").criteria);
  const gateOutcome = (s) => (s.noProblem ? "stop" : s.aboveLimit ? "escalate" : s.pivot ? "alternate" : s.ok.size === CRIT.length && CRIT.length ? "forward" : "rework");
  S.push({ ch: 2, ic: "verified_user", t: "Gates: deciding to move on", lead: `A gate is a decision, not a formality. This is the real ${esc(A1.gate)}, with its real criteria — try it.`,
    init: () => ({ ok: new Set(), aboveLimit: false, noProblem: false, pivot: false }),
    beats: [
      { say: "Nothing is ticked yet — the evidence isn't there, so the gate sends the work back for <b>rework</b>.", at: ".gd-dec", pos: "left", set: (s) => Object.assign(s, { ok: new Set(), aboveLimit: false, noProblem: false, pivot: false }) },
      ...CRIT.map((c, i) => ({ say: `Criterion ${i + 1}: <b>${esc(c)}</b> ✓${i < CRIT.length - 1 ? " — still not enough on its own." : " — that's all of them."}`, at: `[data-crl="${i}"]`, pos: "below", spot: false, set: (s) => Object.assign(s, { ok: new Set(each(i + 1, (k) => k)), aboveLimit: false, noProblem: false, pivot: false }) })),
      { say: "Every criterion met: <b>Go</b>. The work moves forward — into the portfolio backlog, and on to PLAN.", at: ".gd-dec", pos: "left", set: (s) => Object.assign(s, { ok: new Set(CRIT.map((_, i) => i)) }) },
      { say: "Ready — but the investment is <b>above the sponsor's limit</b>. The gate can't decide alone: it <b>escalates</b>.", spot: false, at: `[data-sitl="aboveLimit"]`, pos: "below", set: (s) => Object.assign(s, { aboveLimit: true, noProblem: false, pivot: false }) },
      { say: "A better framing emerged: <b>Pivot</b> — an alternate route back to reframing, without starting over.", spot: false, at: `[data-sitl="pivot"]`, pos: "below", set: (s) => Object.assign(s, { aboveLimit: false, pivot: true, noProblem: false }) },
      { say: "No real problem after all? The gate <b>stops</b> it — killed or parked, with a decision record. Stopping early is a <b>success</b>: it saves building the wrong thing. Now tick things yourself.", spot: false, at: `[data-sitl="noProblem"]`, pos: "above", set: (s) => Object.assign(s, { aboveLimit: false, pivot: false, noProblem: true }) },
    ],
    stage: (s) => {
      const out = gateOutcome(s), lbl = { forward: "Go", rework: "Rework", escalate: "Escalate", alternate: "Pivot", stop: "Kill / Park" }[out];
      return `<div class="gd-gatex"><div class="gd-crit"><span class="gd-mini">Criteria — tick what's true</span>${CRIT.map((c, i) => `<label data-crl="${i}" class="${s.ok.has(i) ? "on" : ""}"><input type="checkbox" data-cr="${i}" ${s.ok.has(i) ? "checked" : ""}/><span>${esc(c)}</span></label>`).join("")}<span class="gd-mini">Situations</span>${[["aboveLimit", "Investment is above the sponsor's limit"], ["pivot", "A better framing of the problem emerged"], ["noProblem", "No real problem was found"]].map(([k, t]) => `<label data-sitl="${k}" class="sit ${s[k] ? "on" : ""}"><input type="checkbox" data-sit="${k}" ${s[k] ? "checked" : ""}/><span>${t}</span></label>`).join("")}</div>
        <div class="gd-dec" style="--c:${RC(out)}"><div class="dia"><i></i><span>${esc(A1.gate)}</span></div><div class="arrow" key="${out}"><span class="ms">${{ forward: "arrow_forward", rework: "undo", escalate: "north", alternate: "alt_route", stop: "block" }[out]}</span></div><div class="res"><b>${lbl}</b><em>${M.routes[out].label} route</em><p>${esc(B.routeOf(A1, out) || ROUTE_SAYS[out])}</p></div></div></div>`;
    },
    click: (s, el) => { const c = el.closest("[data-cr]"); if (c) { const i = +c.dataset.cr; s.ok.has(i) ? s.ok.delete(i) : s.ok.add(i); return true; } const t = el.closest("[data-sit]"); if (t) { s[t.dataset.sit] = !s[t.dataset.sit]; return true; } }, go: [`act-${A1.id}`, "See the gate in the book"] });

  /* 11 — walk a workflow */
  const WF_N = WFMAP ? WFMAP.nodes : [];
  const decI = WF_N.findIndex((n) => n.unit && n.unit.decision);
  const wfEdge = (ty) => (WFMAP ? WFMAP.edges.findIndex((e) => e.ty === ty && e.f === decI) : -1);
  S.push({ ch: 2, ic: "conversion_path", t: "Walk through a workflow", lead: W0 ? `A workflow is the level you actually carry out. Let's walk ${esc(W0.num)} ${esc(W0.title)} — including its decision.` : "",
    init: () => ({ at: 0, selE: null, path: "" }),
    beats: WF_N.length ? [
      { say: "Start at <b>Entry</b>. A workflow is a short list of steps; each says <b>who</b> does it and <b>what</b> it produces. Details for each step slide in on the right.", at: `[data-n="0"]`, pos: "below", zoom: 1.4, set: (s) => Object.assign(s, { at: 0, selE: null, path: "" }) },
      ...WF_N.map((n, i) => ({ n, i })).filter(({ n, i }) => n.unit && i < decI).map(({ n, i }) => ({ say: `<b>${esc(n.unit.title)}</b> — done by the <b>${esc(n.unit.actor || "")}</b>${arr(n.unit.out).length ? `, producing <b>${arr(n.unit.out).map(esc).join(", ")}</b>` : ""}.`, at: `[data-n="${i}"]`, pos: "below", zoom: 1.35, set: (s) => Object.assign(s, { at: i, selE: null, path: "" }) })),
      { say: `<b>A decision: “${esc(WF_N[decI] ? WF_N[decI].unit.title : "")}”</b> Diamonds are where the path splits. <b>Pick an answer</b> below the map.`, at: ".gd-choice", pos: "above", set: (s) => Object.assign(s, { at: decI, selE: null, path: "" }) },
      { say: `<b>No:</b> “${esc(wfEdge("rework") >= 0 ? WFMAP.edges[wfEdge("rework")].n : "")}” — the work loops back. Twice? “${esc(wfEdge("escalate") >= 0 ? WFMAP.edges[wfEdge("escalate")].n : "")}”. Planned, not a surprise.`, at: `[data-e="${wfEdge("rework")}"]`, pos: "above", set: (s) => Object.assign(s, { at: decI, selE: wfEdge("rework"), path: "no" }) },
      { say: `<b>Yes:</b> on to the last step and the gate — <b>${esc(W0.gate || "")}</b>. A whole workflow, start to finish.`, at: `[data-n="${WF_N.length - 1}"]`, pos: "below", zoom: 1.3, set: (s) => Object.assign(s, { at: WF_N.length - 1, selE: null, path: "yes" }) },
    ] : [{ say: "" }],
    stage: (s) => WFMAP ? `${flowMap(WFMAP, { token: s.at, selE: s.selE, done: new Set(WF_N.map((n, i) => i).filter((i) => i < s.at)), flowE: s.selE != null ? new Set([s.selE, wfEdge("escalate")]) : null })}${s.at === decI ? `<div class="gd-choice"><span>${esc(WF_N[decI].unit.title)}</span><button data-yn="yes" class="${s.path === "yes" ? "on" : ""}">Yes</button><button data-yn="no" class="${s.path === "no" ? "on" : ""}">No</button></div>` : `<div class="gd-choice ghost"><button data-wstep="-1"><span class="ms">arrow_back</span>Step back</button><button data-wstep="1">Step forward<span class="ms">arrow_forward</span></button></div>`}` : "",
    detail: (s) => { const n = WF_N[s.at]; if (!n) return ""; if (!n.unit) return det(n.io === "entry" ? "Entry" : esc(n.label), n.io === "entry" ? list(C(W0, "definition").entry, "ok") : list(C(W0, "definition").exit, "ok"), n.io === "entry" ? "Entry criteria" : "Done when"); const kn = B.nodeKnow(W0, n), ln = B.nodeLens(W0, n); return det(esc(n.unit.title), `<div class="gd-meta"><span><span class="ms">person</span>${esc(n.unit.actor || "")}</span>${n.unit.decision ? `<span><span class="ms">call_split</span>Decision</span>` : ""}</div>${arr(n.unit.out).length ? `<span class="gd-mini">Produces</span>${chipRow(n.unit.out, "doc")}` : ""}${kn.length ? `<span class="gd-mini">Knowledge used here</span>${kn.map((k) => `<span class="gd-kc" style="--c:${B.KN_COLOR(k.type)}">${esc(k.name)}</span>`).join("")}` : ""}${ln.length ? `<span class="gd-mini">Lenses asking questions here</span>${ln.map((l) => `<div class="gd-callout" style="--c:${B.LG_COLOR[(B.lensById[l.id] || {}).g]}"><b>${esc((B.lensById[l.id] || {}).n || l.id)}${l.req ? " · required" : ""}:</b> ${esc(l.note || "")}</div>`).join("")}` : ""}`, `Step ${n.num || ""}`); },
    click: (s, el) => { const y = el.closest("[data-yn]"); if (y) { if (y.dataset.yn === "no") Object.assign(s, { selE: wfEdge("rework"), path: "no" }); else Object.assign(s, { at: WF_N.length - 1, selE: null, path: "yes" }); return true; } const w = el.closest("[data-wstep]"); if (w) { s.at = Math.max(0, Math.min(WF_N.length - 1, s.at + +w.dataset.wstep)); s.path = ""; s.selE = null; return true; } const n = el.closest("[data-n]"); if (n) { s.at = +n.dataset.n; s.selE = null; s.path = ""; return true; } }, go: SP0 ? [`u-${SP0.fid}`, "Open it in the book"] : null });

  /* 12 — knowledge */
  const KT = Object.keys(B.KN_SING);
  const KT_SAYS = { frameworks: "A whole way of approaching the work.", standards: "An official, agreed reference you follow.", patterns: "A proven shape for a problem that keeps coming back.", practices: "Something good teams do regularly.", principles: "A rule of thumb that guides decisions.", methods: "A defined procedure, step by step.", techniques: "A hands-on trick for one specific task.", tools: "Software or materials you use." };
  const KN1 = B.nodeKnow(A1, ACTMAP.nodes[1]), KFIRST = KN1.find((k) => k.type === "techniques" || k.type === "methods") || KN1[0];
  S.push({ ch: 3, ic: "menu_book", t: "Knowledge: proven ways to work", lead: `You don't have to invent how to do discovery or testing. The book links ${Object.keys(KLIB).length} pieces of established knowledge to the exact steps where you use them.`,
    init: () => ({ ty: null, node: null, item: null, rv: null }),
    beats: [
      ...KT.map((t, i) => ({ say: `<b>${esc(B.KN_SING[t])}s</b> — ${KT_SAYS[t]}${arr(C(A1, "knowledge")[t])[0] ? ` In ${esc(nice(A1.key))}: <i>${esc(arr(C(A1, "knowledge")[t])[0])}</i>.` : ""}`, at: `[data-kt="${t}"]`, pos: "below", set: (s) => Object.assign(s, { rv: i, ty: null, node: null, item: null }) })),
      { say: `Knowledge sits at <b>places on the map</b>. Here's everything used at <b>${esc(ACTMAP.nodes[1].label)}</b>.`, at: ".gd-knode", pos: "above", set: (s) => Object.assign(s, { rv: null, node: 1, item: null }) },
      { say: `Open any item to learn it on the spot — what it is, how it works, its shape. This is <b>${esc(KFIRST ? KFIRST.name : "")}</b>.`, at: ".gd-knode button.on", pos: "above", set: (s) => Object.assign(s, { node: 1, item: KFIRST ? KFIRST.name : null }) },
      { say: "Your turn: click other boxes and items. In the book, tick types in the <b>Knowledge</b> dropdown and they appear under every box.", at: ".fm", pos: "below", set: (s) => Object.assign(s, { node: 2, item: null }) },
    ],
    stage: (s) => {
      const counts = KT.map((t) => [t, Object.values(KLIB).filter((k) => k.type === B.KN_SING[t]).length]), max = Math.max(1, ...counts.map((c) => c[1]));
      const bars = `<div class="gd-kbars">${counts.map(([t, n], i) => `<button data-kt="${t}" class="${s.ty === t ? "on" : ""} ${RV(s, i)}" style="--c:${B.KN_COLOR(t)}"><span class="b"><i style="height:${Math.round((n / max) * 100)}%"></i></span><b>${n}</b><small>${esc(B.KN_SING[t])}</small></button>`).join("")}</div>`;
      const kn = s.node != null && ACTMAP.nodes[s.node] ? B.nodeKnow(A1, ACTMAP.nodes[s.node]) : [];
      const rows = s.node != null ? `<div class="gd-knode"><span class="gd-mini">Knowledge at ${esc(ACTMAP.nodes[s.node].label)}</span><div>${kn.filter((k) => !s.ty || k.type === s.ty).map((k, i) => `<button data-ki="${esc(k.name)}" class="${s.item === k.name ? "on" : ""}" style="--c:${B.KN_COLOR(k.type)};animation-delay:${i * 0.05}s"><i></i>${esc(k.name)}<small>${esc(B.KN_SING[k.type])}</small></button>`).join("") || '<p class="gd-nd">None of this type here.</p>'}</div></div>` : "";
      return `${bars}${s.rv == null ? flowMap(ACTMAP, { sel: s.node, labels: false, routes: new Set(["forward"]), gap: 140 }) + rows : ""}`;
    },
    detail: (s) => (s.item ? knDet(s.item) : s.ty ? det(esc(B.KN_SING[s.ty]), `<p>${KT_SAYS[s.ty]}</p><span class="gd-mini">In ${esc(nice(A1.key))}</span>${chipRow(arr(C(A1, "knowledge")[s.ty]))}`, "Knowledge type") : ""),
    click: (s, el) => { const t = el.closest("[data-kt]"); if (t) { s.ty = s.ty === t.dataset.kt ? null : t.dataset.kt; s.item = null; s.rv = null; if (s.node == null) s.node = 1; return true; } const k = el.closest("[data-ki]"); if (k) { s.item = k.dataset.ki; return true; } const n = el.closest("[data-n]"); if (n) { s.node = +n.dataset.n; s.item = null; return true; } }, go: ["knowledge", "Knowledge Model chapter"] });

  /* 13 — lenses */
  const LG = B.LGROUPS.map((g) => [g, M.lenses.filter((l) => l.g === g)]);
  const LG_SAYS = { Value: "Is it worth doing? Business, product, customers, money.", Build: "Can we make it well? Architecture, engineering, data.", Trust: "Is it safe, legal and fair? Security, privacy, compliance.", Run: "Can we operate it? Operations, support, cost.", Reach: "Can people find and use it? Accessibility, UX, go-to-market." };
  const LREQ = B.lensOfUnit(A1);
  const lensNote = (() => { if (!WFMAP) return null; for (const n of WFMAP.nodes) { const l = B.nodeLens(W0, n).find((x) => x.note); if (l) return { n, l }; } return null; })();
  S.push({ ch: 3, ic: "visibility", t: "Lenses: every point of view", lead: `Good work satisfies more than one person. A lens is a point of view the work is checked from — ${M.lenses.length} of them, in five groups.`,
    init: () => ({ g: null, req: false, lens: null, rv: null }),
    beats: [
      ...LG.map(([g, ls], i) => ({ say: `<b style="color:${B.LG_COLOR[g]}">${g}</b> · ${ls.length} lenses — ${LG_SAYS[g] || ""}`, at: `[data-lg="${g}"]`, pos: "right", set: (s) => Object.assign(s, { rv: i, g, req: false, lens: null }) })),
      { say: `Each unit marks lenses <b>required</b> (must be heard) or <b>applicable</b> (depends on your project). ${esc(nice(A1.key))} requires ${LREQ.filter((x) => x.req).length} and lists ${LREQ.filter((x) => !x.req).length} more.`, at: ".gd-lreq", pos: "left", set: (s) => Object.assign(s, { rv: null, g: null, req: true, lens: null }) },
      ...(lensNote ? [{ say: `At step level a lens asks a <b>specific question</b>. At “${esc(lensNote.n.label)}”, <b>${esc((B.lensById[lensNote.l.id] || {}).n || "")}</b> asks: <i>“${esc(lensNote.l.note)}”</i>`, at: ".gd-lreq button.on", pos: "left", set: (s) => Object.assign(s, { req: true, lens: lensNote.l.id, note: lensNote.l.note }) }] : []),
    ],
    stage: (s) => {
      const tot = M.lenses.length, R = 120, cx = 150, cy = 150; let a0 = -Math.PI / 2;
      const arcs = LG.map(([g, ls], i) => { const a1 = a0 + (ls.length / tot) * Math.PI * 2, large = a1 - a0 > Math.PI ? 1 : 0, p = (a) => `${cx + R * Math.cos(a)} ${cy + R * Math.sin(a)}`, mid = (a0 + a1) / 2; const out = `<g class="seg ${s.g === g ? "on" : s.g ? "off" : ""} ${s.rv != null && i > s.rv ? "hid" : ""}" data-lg="${g}" style="--c:${B.LG_COLOR[g]}"><path d="M${p(a0)} A${R} ${R} 0 ${large} 1 ${p(a1)}"/><text x="${cx + (R + 36) * Math.cos(mid)}" y="${cy + (R + 36) * Math.sin(mid) + 4}">${g} · ${ls.length}</text></g>`; a0 = a1; return out; }).join("");
      const donut = `<svg class="gd-donut" viewBox="-50 -16 400 332">${arcs}<text x="${cx}" y="${cy - 4}" class="c1">${tot}</text><text x="${cx}" y="${cy + 16}" class="c2">lenses</text></svg>`;
      const listL = s.req ? LREQ.map((x, i) => { const l = B.lensById[x.id]; return l ? `<button data-lz="${x.id}" class="${x.req ? "rq" : ""} ${s.lens === x.id ? "on" : ""}" style="--c:${B.LG_COLOR[l.g]};animation-delay:${i * 0.04}s"><span class="ms">${l.i}</span>${esc(l.n)}<small>${x.req ? "required" : "applicable"}</small></button>` : ""; }).join("") : s.g ? LG.find((x) => x[0] === s.g)[1].map((l, i) => `<button data-lz="${l.id}" class="${s.lens === l.id ? "on" : ""}" style="--c:${B.LG_COLOR[l.g]};animation-delay:${i * 0.06}s"><span class="ms">${l.i}</span>${esc(l.n)}</button>`).join("") : "";
      return `<div class="gd-lenses">${donut}<div class="gd-lreq">${listL}</div></div>`;
    },
    detail: (s) => (s.lens ? lensDet(s.lens, s.note) : ""),
    click: (s, el) => { const g = el.closest("[data-lg]"); if (g) { Object.assign(s, { g: g.dataset.lg, req: false, lens: null, note: null, rv: null }); return true; } const l = el.closest("[data-lz]"); if (l) { s.lens = l.dataset.lz; s.note = null; return true; } }, go: ["lenses", "Lens Library"] });

  /* 14 — RACI */
  const RACI = (() => { const procs = A1.processes, roles = new Map(); procs.forEach((p, pi) => arr(C(p, "execution").roles).forEach((x) => { const m = String(x).match(/^([RACI])\s*[—-]\s*(.*)$/); if (!m) return; m[2].split(/,|;/).map((y) => y.trim()).filter(Boolean).forEach((name) => { const r = roles.get(name) || {}; r[pi] = (r[pi] || "") + m[1]; roles.set(name, r); }); })); return { procs, roles: [...roles.entries()].slice(0, 10) }; })();
  const RL = { R: ["Responsible", "#008080", "does the work. There can be several."], A: ["Accountable", "#e91e63", "owns the result and signs it off. Exactly <b>one</b> — the rule that ends “I thought you were doing it”."], C: ["Consulted", "#6d48d8", "gives input <b>before</b> the work is done. Two-way."], I: ["Informed", "#c49000", "is told <b>after</b>. One-way."] };
  S.push({ ch: 3, ic: "groups", t: "Roles: who does what", lead: "Most project confusion is about who's responsible. Every unit settles it with four letters. This is DISCOVER's real matrix.",
    init: () => ({ L: null, role: null }),
    beats: [
      { say: "Rows are <b>roles</b>, columns are DISCOVER's <b>processes</b>. Each cell says how that role is involved.", at: ".gd-raci table", pos: "below", set: (s) => Object.assign(s, { L: null, role: null }) },
      ...Object.entries(RL).map(([L, [n, c, d]]) => ({ say: `<b style="color:${c}">${L} — ${n}:</b> ${d}`, at: `[data-rl="${L}"]`, pos: "above", set: (s) => Object.assign(s, { L, role: null }) })),
      { say: "Click any <b>role</b> to see what it does and what it decides.", at: ".gd-raci tbody th button", pos: "right", set: (s) => Object.assign(s, { L: null, role: RACI.roles[0] ? RACI.roles[0][0] : null }) },
    ],
    stage: (s) => `<div class="gd-raci"><table><thead><tr><th></th>${RACI.procs.map((p) => `<th title="${esc(p.title)}">${esc(p.num)}<small>${esc(p.short || "")}</small></th>`).join("")}</tr></thead><tbody>${RACI.roles.map(([name, r]) => `<tr><th><button data-role="${esc(name)}" class="${s.role === name ? "on" : ""}">${esc(name)}</button></th>${RACI.procs.map((p, pi) => `<td>${(r[pi] || "").split("").map((L) => `<i class="l${L} ${s.L && s.L !== L ? "off" : ""} ${s.L === L ? "pop" : ""}">${L}</i>`).join("")}</td>`).join("")}</tr>`).join("")}</tbody></table><div class="gd-legend">${Object.entries(RL).map(([L, [n]]) => `<button data-rl="${L}" class="${!s.L || s.L === L ? "on" : ""}"><i class="l${L}">${L}</i>${n}</button>`).join("")}</div></div>`,
    detail: (s) => { if (!s.role) return ""; const ids = B.roleIdsOf(s.role); const r = ids.length ? B.RLIB[ids[0]] : null; return r ? det(esc(r.n), `<p>${esc(r.what || "")}</p>${arr(r.decides).length ? `<span class="gd-mini">Decides</span>${list(r.decides)}` : ""}${arr(r.resp).length ? `<span class="gd-mini">Responsible for</span>${list(arr(r.resp).slice(0, 4))}` : ""}`, "Role") : det(esc(s.role), `<p class="gd-nd">Not in the role library yet.</p>`, "Role"); },
    click: (s, el) => { const r = el.closest("[data-role]"); if (r) { s.role = r.dataset.role; return true; } const l = el.closest("[data-rl]"); if (l) { s.L = s.L === l.dataset.rl ? null : l.dataset.rl; return true; } }, go: [`act-${A1.id}`, "See roles on a unit"] });

  /* 15 — artifacts & traceability */
  const TC = A1.traceChain || [];
  const TCB = [[0, "It starts with a <b>request</b> — REQ-014 in the worked example: order clerks re-typing emailed PDF orders."], [2, "It becomes an <b>idea</b>, then <b>hypotheses</b> — guesses you'll test, not facts."], [5, "Research sessions produce <b>insights</b>. Each one links back to the session it came from."], [6, "Insights shape the <b>problem statement</b> — now backed by evidence."], [8, "Experiments size the <b>opportunity</b>. Risks are logged as they appear."], [10, "It all lands in a <b>decision</b>, recorded with its reasons."], [12, "A Go becomes an <b>initiative</b> in the portfolio backlog — then features and stories."], [TC.length - 1, "And what you learn goes into the <b>learning log</b>, feeding the next cycle."]].filter(([i]) => i < TC.length);
  S.push({ ch: 3, ic: "description", t: "Artifacts: the paper trail", lead: `Work you can't show didn't happen. Every artifact gets an ID, so you can trace a request all the way to a decision. ${Object.keys(B.ALIB).length} templates in all.`,
    init: () => ({ at: -1, art: null }),
    beats: [...TCB.map(([i, say]) => ({ say, at: `[data-ti="${i}"]`, pos: "below", zoom: 1.12, set: (s) => Object.assign(s, { at: i, art: null }) })), { say: "The whole chain — anyone can follow it backwards and see <b>why</b>. Click any record to open its template.", at: ".gd-trace", pos: "below", set: (s) => Object.assign(s, { at: TC.length - 1, art: B.artId("Context brief") || null }) }],
    stage: (s) => `<div class="gd-trace">${TC.map(([id, n, art], i) => `<button data-ti="${i}" data-ar="${esc(art)}" class="${i <= s.at ? "lit" : "dark"} ${i === s.at ? "cur" : ""} ${s.art === art ? "on" : ""}"><b>${esc(id)}</b><small>${esc(n)}</small></button>`).join('<span class="lnk"></span>')}</div>`,
    detail: (s) => (s.art ? artDet(s.art) : ""),
    click: (s, el) => { const a = el.closest("[data-ar]"); if (a) { s.art = a.dataset.ar; return true; } }, go: [`act-${A1.id}`, "Open an artifact"] });

  /* 16 — prompts */
  const PL = [A1, P0, SP0, W0, W0 && W0.steps[0]].filter(Boolean);
  const PL_SAYS = [`<b>Act</b> — “run the whole of ${esc(nice(A1.key))}”. To plan, or to let an agent drive while you approve each gate.`, `<b>Process</b> — one capability, start to finish: <i>${esc(P0.title)}</i>.`, `<b>Subprocess</b> — a focused unit of work you own: <i>${esc(SP0 ? SP0.title : "")}</i>.`, `<b>Workflow</b> — step by step, with checkpoints. The agent stops at each decision for you.`, `<b>Step</b> — one precise task. The fastest way to get help with a single thing.`];
  S.push({ ch: 4, ic: "chat", t: "Prompts: copy, paste, go", lead: "Every unit has a ready prompt for your AI agent, written from the same contract you've been reading.",
    init: () => ({ lv: 0, sc: "solo" }),
    beats: [...PL.map((u, i) => ({ say: PL_SAYS[i] + " Watch it type.", at: `[data-pl="${i}"]`, pos: "below", set: (s) => (s.lv = i) })), { say: "Change the <b>scale</b> and the wording adapts to a solo builder, a team, an enterprise or a platform. Then <b>Copy</b> and paste into Claude, Codex or any agent.", at: "[data-psc]", pos: "left", set: (s) => (s.lv = 3) }],
    stage: (s) => { const u = PL[s.lv]; let txt = ""; try { txt = API.promptText(u, s.sc); } catch {} return `<div class="gd-ptool"><div class="gd-scen">${PL.map((x, i) => `<button data-pl="${i}" class="${i === s.lv ? "on" : ""}" style="--c:#e91e63">${esc(API.PLEVEL[x.kind])}</button>`).join("")}</div><select data-psc aria-label="Scale">${(B.SCALES || []).map((x) => `<option value="${x.id}" ${x.id === s.sc ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div><div class="gd-term"><div class="bar"><i></i><i></i><i></i><span>${esc(API.PLEVEL[u.kind])} · ${esc(u.num || "")} ${esc(u.title || u.key)}</span><button data-pcopy><span class="ms">content_copy</span>Copy</button></div><pre data-full="${esc(txt)}"></pre></div>`; },
    after: (root, s, T) => { const pre = root.querySelector(".gd-term pre"); if (!pre) return; const full = pre.dataset.full; let i = 0; const t = setInterval(() => { i = Math.min(full.length, i + 18); pre.innerHTML = esc(full.slice(0, i)) + (i < full.length ? '<span class="cur"></span>' : ""); pre.scrollTop = pre.scrollHeight; if (i >= full.length) clearInterval(t); }, 16); T.push(t); },
    click: (s, el) => { const p = el.closest("[data-pl]"); if (p) { s.lv = +p.dataset.pl; return true; } const cp = el.closest("[data-pcopy]"); if (cp) { const pre = el.closest(".gd-canvas").querySelector("pre"); try { navigator.clipboard.writeText(pre.dataset.full); } catch {} cp.innerHTML = '<span class="ms">check</span>Copied'; return false; } },
    change: (s, el) => { if (el.matches("[data-psc]")) { s.sc = el.value; return true; } }, go: ["agents", "Working with Agents"] });

  /* 17 — the agent kit */
  const KITB = ["context", "skills", "commands", "workflows", "agents", "guardrails", "rubrics"].map((k) => (B.KIT_LAYERS || []).find((x) => x.id === k)).filter(Boolean);
  S.push({ ch: 4, ic: "inventory_2", t: "The agent kit", lead: "A prompt is one layer. The kit gives your agent everything else — generated for each act, at your scale. This is the real one.",
    init: () => ({ sc: "team", layer: "context", file: null }),
    beats: [...KITB.map((L) => ({ say: `<b>${esc(L.name)}</b> — ${esc(L.what || "")}`, at: `[data-kl="${L.id}"]`, pos: "right", set: (s) => Object.assign(s, { layer: L.id, file: null }) })), { say: "Drop the whole folder into your project and your agent picks it up. <b>Browse any file</b> — or change the scale and watch the kit change.", at: "[data-ksc]", pos: "left", set: (s) => Object.assign(s, { layer: "context", file: null }) }],
    stage: (s) => { let files = []; try { files = API.actKit(A1, s.sc); } catch {} const by = {}; files.forEach((f) => (by[f.layer] = by[f.layer] || []).push(f)); const cur = by[s.layer] || []; const file = files.find((f) => f.path === s.file) || cur[0];
      return `<div class="gd-ptool"><span class="gd-count"><b data-countup="${files.length}">${files.length}</b> files at this scale</span><select data-ksc aria-label="Scale">${(B.SCALES || []).map((x) => `<option value="${x.id}" ${x.id === s.sc ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div><div class="gd-kitx"><div class="lay">${(B.KIT_LAYERS || []).filter((l) => by[l.id]).map((l) => `<button data-kl="${l.id}" class="${l.id === s.layer ? "on" : ""}"><span class="ms">${l.icon || "folder"}</span>${esc(l.name)}<small>${by[l.id].length}</small></button>`).join("")}</div><div class="files">${cur.slice(0, 40).map((f, i) => `<button data-kf="${esc(f.path)}" class="${file && f.path === file.path ? "on" : ""}" style="animation-delay:${Math.min(i, 12) * 0.03}s"><span class="ms">description</span>${esc(f.path)}</button>`).join("")}${cur.length > 40 ? `<p class="gd-nd">+ ${cur.length - 40} more</p>` : ""}</div><pre class="prev">${file ? esc(file.body.split("\n").slice(0, 60).join("\n")) : ""}</pre></div>`; },
    after: (root) => { const b = root.querySelector("[data-countup]"); if (!b) return; const n = +b.dataset.countup, t0 = performance.now(); const tick = (t) => { const p = Math.min(1, (t - t0) / 900); b.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); },
    click: (s, el) => { const l = el.closest("[data-kl]"); if (l) { s.layer = l.dataset.kl; s.file = null; return true; } const f = el.closest("[data-kf]"); if (f) { s.file = f.dataset.kf; return true; } },
    change: (s, el) => { if (el.matches("[data-ksc]")) { s.sc = el.value; s.file = null; return true; } }, go: ["agents", "Working with Agents"] });

  /* 18 — the worked example */
  const WT = A1.walkthrough || [];
  const nodeAt = (fid) => ACTMAP.nodes.findIndex((n) => n.unit && (fid === n.unit.fid || String(fid).startsWith(n.unit.fid + ".")));
  S.push({ ch: 4, ic: "movie", t: "A real case, start to finish", lead: `One realistic case, followed through ${nice(A1.key)} unit by unit — ${WT.length} moments. Press ▶ Play and watch it unfold.`,
    init: () => ({ i: 0, art: null }),
    beats: WT.map((w, i) => { const at = nodeAt(w.at); return { say: `<span class="gd-tag">${i + 1} / ${WT.length}</span><b>${esc(w.title)}.</b> ${esc(w.text)}`, at: at >= 0 ? `[data-n="${at}"]` : `[data-n="0"]`, pos: "below", zoom: 1.25, set: (s) => Object.assign(s, { i, art: null }) }; }),
    stage: (s) => { const w = WT[s.i] || {}, at = nodeAt(w.at); return `${flowMap(ACTMAP, { token: at >= 0 ? at : 0, sel: at >= 0 ? at : null, labels: false, routes: new Set(["forward"]), done: new Set(ACTMAP.nodes.map((n, i) => i).filter((i) => i < at)) })}<div class="gd-story"><div class="bar"><i style="width:${((s.i + 1) / WT.length) * 100}%"></i></div><span class="gd-mini">Artifacts at this moment</span>${(w.arts || []).map((id, k) => `<button data-ar="${esc(id)}" style="animation-delay:${k * 0.12}s">${esc((B.ALIB[id] && B.ALIB[id].aliases[0]) || id)}</button>`).join("") || '<p class="gd-nd">—</p>'}</div>`; },
    detail: (s) => (s.art ? artDet(s.art) : ""),
    click: (s, el) => { const a = el.closest("[data-ar]"); if (a) { s.art = a.dataset.ar; return true; } }, go: [`act-${A1.id}`, "Use “Walk through” in the book"] });

  /* 19 — tailoring and scale */
  const TL = A1.tailoring || {};
  S.push({ ch: 5, ic: "tune", t: "Tailoring and scale", lead: "The same lifecycle fits a two-person startup and a bank. Tailoring makes it lighter or more rigorous; scale changes how teams and agents are organised.",
    init: () => ({ prof: "standard", scale: null }),
    beats: [...M.profiles.map((p) => ({ say: `<b>${esc(p.name)}</b> — ${esc((TL[p.id] || {}).when || "")}${p.id !== "standard" ? " Changed processes are highlighted." : ""}`, at: `[data-pf="${p.id}"]`, pos: "below", set: (s) => Object.assign(s, { prof: p.id, scale: null }) })), ...(B.SCALES || []).map((x) => ({ say: `<b>${esc(x.name)}</b> — ${esc(x.who || "")}`, at: `[data-scl="${x.id}"]`, pos: "above", set: (s) => Object.assign(s, { scale: x.id }) }))],
    stage: (s) => {
      const notes = A1.processes.map((p) => { const t = B.tailorOf(p, s.prof); const skipped = ((TL[s.prof] && TL[s.prof].skip) || []).filter((f) => f.startsWith(p.fid + ".")); return { p, note: t ? (t.skip ? "Skipped" : t.condense || t.add || "") : "", skipped }; });
      const sc = (B.SCALES || []).find((x) => x.id === s.scale);
      return `<div class="gd-scen">${M.profiles.map((p) => `<button data-pf="${p.id}" class="${p.id === s.prof ? "on" : ""}" style="--c:${p.id === "light" ? "#c49000" : p.id === "rigorous" ? "#e91e63" : "#008080"}"><span class="ms">${p.icon}</span>${esc(p.name)}</button>`).join("")}</div>
        <div class="gd-tail">${notes.map(({ p, note, skipped }, i) => `<div class="${note ? "chg" : ""}" style="animation-delay:${i * 0.06}s"><small>${esc(p.num)}</small><b>${esc(p.title)}</b>${note ? `<em>${esc(note)}</em>` : `<em class="same">Runs as standard</em>`}${skipped.length ? `<span class="sk">${skipped.length} skipped</span>` : ""}</div>`).join("")}</div>
        <div class="gd-scales">${(B.SCALES || []).map((x) => `<button data-scl="${x.id}" class="${x.id === s.scale ? "on" : ""}"><span class="ms">${x.icon || "groups"}</span><b>${esc(x.name)}</b></button>`).join("")}</div>${sc ? `<div class="gd-kvs scl">${[["Who", sc.who], ["How agents help", sc.agents], ["Backlogs", sc.backlogs], ["Checkpoints", sc.gates]].filter((x) => x[1]).map(([k, v]) => `<div><b>${k}</b><p>${esc(v)}</p></div>`).join("")}</div>` : ""}`;
    },
    click: (s, el) => { const p = el.closest("[data-pf]"); if (p) { s.prof = p.dataset.pf; return true; } const c = el.closest("[data-scl]"); if (c) { s.scale = c.dataset.scl; return true; } }, go: [`act-${A1.id}`, "Try a tailoring profile"] });

  /* 20 — the delivery system */
  const FL = (SYS.flows || []).slice(0, 9);
  const SYSN = Object.fromEntries([...(SYS.backlogs || []).map((b) => [b.id, b.name]), ...(SYS.side || []).map((b) => [b.id, b.name]), ...TRACKS.map((t) => [t.id, t.name]), ...STAGES.map((s) => [s.id, nice(s.key)]), ...(SYS.cadences || []).map((c) => [c.id, c.name])]);
  const SYSI = [...new Set(FL.flatMap((f) => [f.f, f.t]))];
  S.push({ ch: 5, ic: "view_stream", t: "How teams actually deliver", lead: "Discovery and delivery run side by side, fed by backlogs at three levels. Follow the work as it flows.",
    init: () => ({ f: -1 }),
    beats: [{ say: "Two tracks run in parallel: <b>discovery</b> finds what's worth building, <b>delivery</b> builds it. Backlogs hold the work in between. The dots are work flowing.", at: ".gd-sys", pos: "below", set: (s) => (s.f = -1) }, ...FL.map((f, i) => ({ say: `<b>${esc(SYSN[f.f] || f.f)} → ${esc(SYSN[f.t] || f.t)}${f.n ? ` · ${esc(f.n)}` : ""}.</b> ${esc(f.what || "")}`, at: `[data-sid="${f.t}"]`, pos: "below", zoom: 1.15, set: (s) => (s.f = i) }))],
    stage: (s) => {
      const cols = 4, W = 760, cw = W / cols, pos = Object.fromEntries(SYSI.map((id, i) => [id, { x: 40 + (i % cols) * cw + cw / 2 - 40, y: 40 + Math.floor(i / cols) * 120 }])), H = 60 + Math.ceil(SYSI.length / cols) * 120;
      const edges = FL.map((f, i) => { const a = pos[f.f], b = pos[f.t]; if (!a || !b) return ""; const on = s.f === i, c = RC(f.ty || "forward"), d = `M${a.x + 70} ${a.y + 44} C ${a.x + 70} ${a.y + 90}, ${b.x + 70} ${b.y - 46}, ${b.x + 70} ${b.y}`; return `<path d="${d}" class="se ${on ? "on" : s.f >= 0 ? "dim" : ""}" stroke="${c}"/>${s.f < 0 || on ? `<circle r="5" fill="${c}"><animateMotion dur="${on ? 1.6 : 3 + (i % 4)}s" repeatCount="indefinite" path="${d}"/></circle>` : ""}`; }).join("");
      const nodes = SYSI.map((id) => { const p = pos[id], f = FL[s.f], on = f && (f.f === id || f.t === id); return `<g class="sn ${on ? "on" : ""}" data-sid="${id}"><rect x="${p.x - 8}" y="${p.y}" width="156" height="44" rx="12"/><text x="${p.x + 70}" y="${p.y + 27}">${esc(wrap(SYSN[id] || id, 22, 1)[0])}</text></g>`; }).join("");
      return `<svg class="gd-sys" viewBox="0 0 ${W + 60} ${H}">${edges}${nodes}</svg>${s.f >= 0 && FL[s.f].art && B.ALIB[FL[s.f].art] ? `<p class="gd-mini center">Carried by: <b>${esc(B.ALIB[FL[s.f].art].aliases[0])}</b></p>` : `<div class="gd-chips center">${(SYS.gates || []).map((g) => `<span class="dec">${esc(g.name)}</span>`).join("")}</div>`}`;
    }, go: ["map", "Lifecycle Map · system view"] });

  /* 21 — the reasoning chain */
  S.push({ ch: 5, ic: "psychology_alt", t: "The reasoning chain", lead: `${M.chain.length} questions to ask about any piece of work, in order. Senior engineers ask them without thinking — written down, anyone can.`,
    init: () => ({ q: 0, rv: 0 }),
    beats: [...M.chain.map(([q, d, refs, pit], i) => ({ say: `<b>${i + 1}. ${esc(q)}</b> ${esc(d)}${pit ? `<span class="gd-tip warn">Common mistake: ${esc(pit)}</span>` : ""}`, at: `[data-q="${i}"]`, pos: i % 2 ? "left" : "right", set: (s) => Object.assign(s, { q: i, rv: i }) })), { say: "The whole chain. Use it in every review — of your own work, and of your agent's.", at: ".gd-chainx", pos: "above", set: (s) => Object.assign(s, { rv: null, q: -1 }) }],
    stage: (s) => `<ol class="gd-chainx">${M.chain.map(([q, d, refs], i) => `<li class="${i === s.q ? "on" : i < s.q ? "past" : ""} ${RV(s, i)}" data-q="${i}"><i>${i + 1}</i><b>${esc(q)}</b>${arr(refs).length ? `<em>${arr(refs).map((r) => esc(r[0])).join(" · ")}</em>` : ""}</li>`).join("")}</ol>`,
    click: (s, el) => { const q = el.closest("[data-q]"); if (q) { s.q = +q.dataset.q; s.rv = null; return true; } }, go: ["reasoning", "Reasoning Chain"] });

  /* 22 — learning */
  const T0 = B.teachOf(P0) || {};
  const OBJ = arr(T0.objectives);
  S.push({ ch: 5, ic: "quiz", t: "Learning built in", lead: `Every process teaches itself. Here is ${esc(P0.num)} ${esc(P0.title)}'s — try the real check.`,
    init: () => ({ ans: {}, part: 0, rv: 0 }),
    beats: [...OBJ.map((o, i) => ({ say: `Objective ${i + 1}: <b>${esc(o)}</b>`, at: `[data-ob="${i}"]`, pos: "below", set: (s) => Object.assign(s, { part: 0, rv: i }) })), { say: "Then an <b>exercise</b>, done on your own project. Reading isn't learning — doing is.", at: ".gd-learn.ex", pos: "below", set: (s) => (s.part = 1) }, { say: "And a quick <b>check</b>. Answer the questions — you get the explanation either way.", at: ".gd-quiz .qq", pos: "above", set: (s) => (s.part = 2) }],
    stage: (s) => s.part === 0 ? `<div class="gd-objs">${OBJ.map((o, i) => `<div data-ob="${i}" class="${RV(s, i)}"><span class="ms">flag</span><b>${esc(o)}</b></div>`).join("")}</div>` : s.part === 1 ? `<div class="gd-learn ex"><span class="ms">edit_note</span><p>${esc(T0.exercise || "")}</p></div>` : `<div class="gd-quiz">${arr(T0.checks).map(([q, opts, ci, why], qi) => `<div class="qq"><b>${qi + 1}. ${esc(q)}</b><div>${opts.map((o, oi) => `<button data-qa="${qi}:${oi}" class="${s.ans[qi] != null ? (oi === ci ? "ok" : s.ans[qi] === oi ? "no" : "") : ""}" ${s.ans[qi] != null ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>${s.ans[qi] != null ? `<p class="why ${s.ans[qi] === ci ? "ok" : "no"}"><span class="ms">${s.ans[qi] === ci ? "check_circle" : "info"}</span>${esc(why)}</p>` : ""}</div>`).join("")}</div>`,
    click: (s, el) => { const a = el.closest("[data-qa]"); if (a) { const [q, o] = a.dataset.qa.split(":").map(Number); s.ans[q] = o; const ok = arr(T0.checks)[q] && arr(T0.checks)[q][2] === o; if (ok) burst(a); return true; } }, go: [`u-${P0.fid}`, "See it in a process"] });

  /* 23 — your routine */
  const LOOP = [["map", "Find where you are", "Open your act and its map."], ["account_tree", "Pick the next step", "Zoom in to the workflow you're doing now."], ["visibility", "Check the context", "Lenses, knowledge, roles and the artifacts it needs."], ["content_copy", "Copy the prompt", "Give it to your agent, at the right level."], ["fact_check", "Review the result", "Against the step's checks and lenses — you decide."], ["verified_user", "Pass the gate", "Forward, rework, escalate — or stop."]];
  S.push({ ch: 5, ic: "rocket_launch", t: "Your routine, every day", lead: "That's the whole book. Put it together as one loop you repeat for every piece of work — that's how the method becomes a habit.",
    init: () => ({ k: 0, rv: 0 }),
    beats: [...LOOP.map(([ic, t, d], i) => ({ say: `<b>${i + 1}. ${t}.</b> ${d}`, at: `[data-lp="${i}"]`, pos: i < 3 ? "right" : "left", set: (s) => Object.assign(s, { k: i, rv: i, done: false }) })), { say: "Then round again. 🎉 <b>You've finished the guide.</b> Reopen it any time with the <b>Guide</b> button or the <b>G</b> key. Start with DISCOVER — it's fully open.", at: ".gd-loopx .rc1", pos: "right", set: (s) => Object.assign(s, { k: -1, rv: null, done: true }) }],
    stage: (s) => { const R = 140, cx = 220, cy = 180; return `<svg class="gd-loopx" viewBox="0 0 440 360"><circle cx="${cx}" cy="${cy}" r="${R}" class="track"/>${LOOP.map(([ic, t], i) => { const a = (i / LOOP.length) * Math.PI * 2 - Math.PI / 2, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); return `<g class="lp ${i === s.k ? "on" : ""} ${s.rv != null && i > s.rv ? "hid" : ""}" data-lp="${i}"><circle cx="${x}" cy="${y}" r="${i === s.k ? 34 : 26}"/><text x="${x}" y="${y + 7}" class="ms">${ic}</text><text x="${x}" y="${y + (y > cy ? 54 : -42)}" class="t">${esc(t)}</text></g>`; }).join("")}${s.rv == null ? `<circle class="runner" r="7"><animateMotion dur="9s" repeatCount="indefinite" path="M${cx} ${cy - R} a${R} ${R} 0 1 1 -0.1 0"/></circle>` : ""}<text x="${cx}" y="${cy + 6}" class="rc1">${s.done ? "DONE ✓" : "REPEAT"}</text></svg>`; },
    after: (root, s) => { if (s.done) setTimeout(() => burst(root.querySelector(".gd-loopx"), 40), 300); },
    click: (s, el) => { const l = el.closest("[data-lp]"); if (l) { s.k = +l.dataset.lp; s.rv = null; return true; } }, go: [`act-${A1.id}`, `Start reading ${nice(A1.key)}`] });

  /* chapter opening cards — inserted before the first scene of each chapter */
  for (let c = CH.length - 1; c >= 1; c--) {
    const at = S.findIndex((s) => s.ch === c); if (at < 0) continue;
    const topics = S.filter((s) => s.ch === c);
    S.splice(at, 0, { ch: c, ic: CH[c][1], t: `Chapter ${c}: ${CH[c][0]}`, lead: CH[c][2], card: true,
      init: () => ({ rv: 0 }),
      beats: [...topics.map((t, i) => ({ say: `<b>${i + 1}. ${esc(t.t)}</b> — ${t.lead.replace(/<[^>]+>/g, "").split(/(?<=[.!?])\s/)[0]}`, at: `[data-tp="${i}"]`, pos: "right", set: (s) => (s.rv = i) })), { say: `${topics.length} topics. Ready? Let's go.`, at: ".gd-chcard .go", pos: "right", set: (s) => (s.rv = null) }],
      stage: (s) => `<div class="gd-chcard"><div class="num"><span class="ms">${CH[c][1]}</span><i>${c}</i></div><div><span class="k">Chapter ${c} of ${CH.length - 1}</span><h3>${esc(CH[c][0])}</h3><p>${esc(CH[c][2])}</p><ol>${topics.map((t, i) => `<li data-tp="${i}" class="${RV(s, i)}"><span class="ms">${t.ic}</span>${esc(t.t)}</li>`).join("")}</ol><button class="go" data-gskip>Start the chapter<span class="ms">arrow_forward</span></button></div></div>` });
  }

  /* ---------- a little burst for a right answer / the finish ---------- */
  function burst(anchor, n = 18) {
    if (!anchor || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = anchor.getBoundingClientRect(), box = document.createElement("div");
    box.className = "gd-burst"; box.style.left = r.left + r.width / 2 + "px"; box.style.top = r.top + r.height / 2 + "px";
    box.innerHTML = each(n, (i) => `<i style="--a:${(i / n) * 360}deg;--d:${50 + Math.random() * 70}px;--c:${["#e91e63", "#4fd1c5", "#c49000", "#6d48d8", "#008080"][i % 5]}"></i>`).join("");
    document.body.appendChild(box); setTimeout(() => box.remove(), 1000);
  }

  /* ======================================================================
   * the engine: scene shell, callouts with pointer + spotlight + camera, drawer, autoplay
   * ====================================================================== */
  const css = document.createElement("style");
  css.textContent = `
  .gd { position: fixed; inset: 0; z-index: 1000; display: none; grid-template-rows: auto auto minmax(0,1fr) auto; background: #fdf8f8; color: #1c1b1b; font: 15px/1.55 "Geist", ui-sans-serif, system-ui, sans-serif; }
  .gd.on { display: grid; animation: gdIn .35s cubic-bezier(.22,1,.36,1); }
  @keyframes gdIn { from { opacity: 0; transform: scale(.985); } }
  .gd::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(rgba(0,0,0,.05) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }
  .gd > * { position: relative; }
  .gd button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  .gd-top { display: flex; align-items: center; gap: 12px; padding: 10px clamp(16px, 3vw, 32px); }
  .gd-brand { display: flex; align-items: center; gap: 8px; font: 900 17px "Montserrat", sans-serif; letter-spacing: -.02em; color: #040505; }
  .gd-brand i { width: 28px; height: 28px; border-radius: 9px; display: grid; place-items: center; background: #0d1117; color: #fff; font-style: normal; } .gd-brand i .ms { font-size: 16px; }
  .gd-brand > span { font: 700 10px "Geist Mono", monospace; letter-spacing: .2em; text-transform: uppercase; color: #e91e63; margin-left: 4px; }
  .gd-ch { display: flex; gap: 4px; margin-left: auto; overflow-x: auto; scrollbar-width: none; }
  .gd-ch button { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 999px; font: 700 10.5px "Geist Mono", monospace; letter-spacing: .08em; text-transform: uppercase; color: #8a8e8f; white-space: nowrap; }
  .gd-ch button:hover { color: #040505; background: rgba(0,0,0,.04); } .gd-ch button.on { background: #0d1117; color: #fff; } .gd-ch button.done::after { content: "✓"; color: #008080; } .gd-ch button.on.done::after { color: #4fd1c5; }
  .gd-x { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: rgba(0,0,0,.05) !important; color: #040505; flex: none; } .gd-x:hover { background: #0d1117 !important; color: #fff !important; }
  .gd-bar { height: 3px; background: rgba(0,0,0,.06); } .gd-bar i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #008080, #e91e63); transition: width .5s cubic-bezier(.22,1,.36,1); }
  .gd-body { overflow: auto; padding: clamp(10px, 2vh, 24px) clamp(12px, 3vw, 44px) 24px; }
  .gd-scene { max-width: 1440px; margin: 0 auto; display: grid; gap: 12px; }
  .gd-scene.nx { animation: gdNx .5s cubic-bezier(.22,1,.36,1); } .gd-scene.pv { animation: gdPv .5s cubic-bezier(.22,1,.36,1); }
  @keyframes gdNx { from { opacity: 0; transform: translateX(40px); } } @keyframes gdPv { from { opacity: 0; transform: translateX(-40px); } }
  .gd-sh { display: grid; grid-template-columns: auto 1fr; gap: 2px 14px; align-items: center; }
  .gd-sh .ic { grid-row: span 2; width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; background: #0d1117; color: #4fd1c5; } .gd-sh .ic .ms { font-size: 24px; }
  .gd-sh .eb { font: 700 10.5px "Geist Mono", monospace; letter-spacing: .18em; text-transform: uppercase; color: #008080; }
  .gd h2 { margin: 0; font: 900 clamp(1.4rem, 2.4vw, 2.2rem)/1 "Montserrat", sans-serif; text-transform: uppercase; letter-spacing: -.04em; color: #040505; }
  .gd-lead { grid-column: 1 / -1; font-size: 14.5px; color: #3a3d3e; max-width: 900px; margin-top: 4px; }
  /* canvas: stage + spotlight + pointer + callout + drawer */
  .gd-canvas { position: relative; overflow: hidden; border-radius: 26px; background: #fff; border: 1px solid #ece8e6; box-shadow: 0 50px 90px -60px rgba(13,17,23,.45); min-height: 54vh; }
  .gd-cam { padding: clamp(14px, 1.8vw, 26px) clamp(14px, 1.8vw, 26px) 200px; transition: transform .6s cubic-bezier(.22,1,.36,1), margin .45s cubic-bezier(.22,1,.36,1); transform-origin: 50% 50%; }
  .gd-canvas.drawer-on .gd-cam { margin-right: 360px; }
  .gd-hl { position: absolute; z-index: 5; border-radius: 14px; pointer-events: none; opacity: 0; transition: left .5s cubic-bezier(.22,1,.36,1), top .5s cubic-bezier(.22,1,.36,1), width .5s cubic-bezier(.22,1,.36,1), height .5s cubic-bezier(.22,1,.36,1), opacity .3s, box-shadow .4s; border: 2.5px solid #e91e63; }
  .gd-hl.on { opacity: 1; } .gd-hl.spot { box-shadow: 0 0 0 4000px rgba(253,248,248,.6); }
  .gd-hl::after { content: ""; position: absolute; inset: -8px; border-radius: 18px; border: 2px solid #e91e63; animation: gdPulse 1.8s ease-out infinite; }
  @keyframes gdPulse { from { opacity: .7; transform: scale(.96); } to { opacity: 0; transform: scale(1.08); } }
  .gd-ptr { position: absolute; left: 0; top: 0; z-index: 6; pointer-events: none; width: 100%; overflow: visible; }
  .gd-ptr path { fill: none; stroke: #e91e63; stroke-width: 2; stroke-dasharray: 5 5; animation: gdDash 1s linear infinite; } .gd-ptr circle { fill: #e91e63; }
  .gd-co { position: absolute; z-index: 7; width: min(360px, calc(100% - 24px)); padding: 14px 16px 12px; border-radius: 18px; background: #0d1117; color: #e6edf3; box-shadow: 0 30px 60px -24px rgba(13,17,23,.75), 0 0 0 1px rgba(255,255,255,.06); transition: left .5s cubic-bezier(.22,1,.36,1), top .5s cubic-bezier(.22,1,.36,1), opacity .3s; opacity: 0; left: 50%; top: 40%; }
  .gd-co.on { opacity: 1; }
  .gd-co-h { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font: 700 10px "Geist Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: #4fd1c5; }
  .gd-co-h .min { margin-left: auto; width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center; color: rgba(255,255,255,.5); } .gd-co-h .min:hover { background: rgba(255,255,255,.1) !important; color: #fff; } .gd-co-h .min .ms { font-size: 16px; }
  .gd-co-t { font-size: 15px; line-height: 1.55; } .gd-co-t b { color: #fff; } .gd-co-t i { color: #ffd2e0; }
  .gd-co-t .w { display: inline-block; opacity: 0; transform: translateY(6px); animation: gdW .35s cubic-bezier(.22,1,.36,1) forwards; }
  @keyframes gdW { to { opacity: 1; transform: none; } }
  .gd-tip { display: block; margin-top: 8px; padding: 7px 10px; border-radius: 10px; background: rgba(79,209,197,.1); color: #bdeee9; font-size: 13px; } .gd-tip.warn { background: rgba(233,30,99,.14); color: #ffc2d6; }
  .gd-tag { display: inline-block; margin-right: 6px; padding: 1px 7px; border-radius: 99px; background: #e91e63; color: #fff; font: 800 10px "Geist Mono"; }
  .gd-co-f { display: flex; align-items: center; gap: 6px; margin-top: 10px; }
  .gd-co-f button { display: inline-flex; align-items: center; gap: 3px; padding: 6px 12px; border-radius: 999px; font: 800 11px "Geist", sans-serif; letter-spacing: .06em; text-transform: uppercase; background: rgba(255,255,255,.08) !important; color: #fff !important; }
  .gd-co-f button.pri { margin-left: auto; background: #e91e63 !important; } .gd-co-f button:disabled { opacity: .3; cursor: default; } .gd-co-f .ms { font-size: 16px; }
  .gd-co.mini { width: auto; padding: 8px 10px; cursor: pointer; } .gd-co.mini .gd-co-t, .gd-co.mini .gd-co-f { display: none; } .gd-co.mini .gd-co-h { margin: 0; }
  .gd-drawer { position: absolute; z-index: 8; top: 0; right: 0; bottom: 0; width: 360px; padding: 16px 18px; background: #fff; border-left: 1px solid #ece8e6; box-shadow: -30px 0 60px -40px rgba(13,17,23,.4); overflow: auto; transform: translateX(105%); transition: transform .45s cubic-bezier(.22,1,.36,1); }
  .gd-canvas.drawer-on .gd-drawer { transform: none; }
  .gd-drawer .x { position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: #f6f4f3 !important; } .gd-drawer .x .ms { font-size: 18px; }
  .gd-det-k { font: 700 9.5px "Geist Mono", monospace; letter-spacing: .16em; text-transform: uppercase; color: #e91e63; }
  .gd-drawer h4 { margin: 2px 34px 6px 0; font: 900 16px/1.15 "Montserrat", sans-serif; text-transform: uppercase; letter-spacing: -.01em; color: #040505; display: flex; align-items: center; gap: 6px; }
  .gd-drawer p { font-size: 13.5px; color: #3a3d3e; margin: 4px 0; } .gd-big { font-size: 15px !important; font-weight: 700; color: #040505 !important; }
  .gd-dbody { animation: gdUp .4s cubic-bezier(.22,1,.36,1); }
  /* controls under the canvas */
  .gd-ctl { display: flex; align-items: center; gap: 10px; }
  .gd-segs { flex: 1; display: flex; gap: 3px; } .gd-segs button { flex: 1; height: 6px; border-radius: 3px; background: #ece8e6 !important; padding: 0; transition: background .3s; } .gd-segs button.past { background: #4fd1c5 !important; } .gd-segs button.on { background: #e91e63 !important; }
  .gd-segs button:hover { background: #c9c5c2 !important; }
  .gd-play { position: relative; display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px 7px 10px; border-radius: 999px; font: 800 11.5px "Geist", sans-serif; letter-spacing: .06em; text-transform: uppercase; background: #0d1117 !important; color: #fff !important; overflow: hidden; }
  .gd-play .ms { font-size: 18px; } .gd-play i { position: absolute; left: 0; bottom: 0; height: 3px; width: 0; background: #e91e63; }
  .gd-play.on i { animation: gdFill var(--dur, 5s) linear forwards; } @keyframes gdFill { to { width: 100%; } }
  @keyframes gdBob { 50% { transform: translateY(-3px); } } @keyframes gdUp { from { opacity: 0; transform: translateY(10px); } } @keyframes gdFade { from { opacity: .3; } }
  .gd-badge { position: absolute; z-index: 9; top: 14px; right: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; background: #008080; color: #fff; font: 800 12px "Geist"; box-shadow: 0 14px 30px -14px rgba(0,128,128,.8); animation: gdBadge 2.6s cubic-bezier(.22,1,.36,1) forwards; }
  @keyframes gdBadge { 0% { opacity: 0; transform: translateY(-10px) scale(.9); } 12%, 80% { opacity: 1; transform: none; } 100% { opacity: 0; } }
  .gd-burst { position: fixed; z-index: 2000; pointer-events: none; } .gd-burst i { position: absolute; width: 8px; height: 8px; border-radius: 2px; background: var(--c); animation: gdBurst .9s cubic-bezier(.22,1,.36,1) forwards; }
  @keyframes gdBurst { from { transform: rotate(var(--a)) translateX(0) scale(1); opacity: 1; } to { transform: rotate(var(--a)) translateX(var(--d)) scale(.4); opacity: 0; } }
  /* progressive reveal */
  .rv { transition: opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1); }
  .rv.out { opacity: 0; transform: translateY(14px) scale(.97); pointer-events: none; }
  .rv.cur { animation: gdPop .55s cubic-bezier(.22,1,.36,1); }
  .hid { opacity: 0 !important; pointer-events: none; transition: opacity .4s; }
  @keyframes gdPop { 0% { transform: scale(.92); } 60% { transform: scale(1.04); } 100% { transform: none; } }
  /* shared bits */
  .center { text-align: center; justify-content: center; }
  .gd-mini { display: block; margin: 10px 0 4px; font: 700 9.5px "Geist Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: #8a8e8f; } .gd-mini b { color: #040505; }
  .gd-nd { color: #8a8e8f; font-size: 13px; font-style: italic; }
  .gd-ul { list-style: none; display: grid; gap: 4px; margin: 4px 0; } .gd-ul li { position: relative; padding-left: 16px; font-size: 13.5px; color: #3a3d3e; } .gd-ul li::before { content: "•"; position: absolute; left: 3px; color: #e91e63; font-weight: 900; }
  .gd-ul.ok li::before { content: "✓"; color: #008080; } .gd-ul.num { counter-reset: n; } .gd-ul.num li { counter-increment: n; } .gd-ul.num li::before { content: counter(n); font: 800 10px "Geist Mono", monospace; color: #6d48d8; top: 3px; }
  .gd-chips { display: flex; flex-wrap: wrap; gap: 5px; } .gd-chips span { padding: 4px 10px; border-radius: 999px; background: #faf8f7; border: 1px solid #ece8e6; font-size: 12px; font-weight: 600; }
  .gd-chips .doc { border-color: color-mix(in srgb, #008080 35%, #fff); background: color-mix(in srgb, #008080 6%, #fff); } .gd-chips .dec { background: #0d1117; color: #fff; border-color: #0d1117; }
  .gd-meta { display: flex; flex-wrap: wrap; gap: 5px; margin: 6px 0; } .gd-meta span { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; background: #f6f4f3; font-size: 12px; font-weight: 700; color: #3a3d3e; } .gd-meta .ms { font-size: 14px; }
  .gd-callout { display: block; margin: 6px 0; padding: 8px 10px; border-radius: 10px; border-left: 3px solid var(--c, #e91e63); background: color-mix(in srgb, var(--c, #e91e63) 7%, #fff); font-size: 13px; }
  .gd-kc { display: inline-block; margin: 2px 3px 2px 0; padding: 3px 9px; border-radius: 999px; border: 1.5px solid var(--c); font-size: 12px; font-weight: 700; color: #040505; }
  .gd-kvs { display: grid; gap: 8px; } .gd-kvs > div > b { display: block; font: 700 9.5px "Geist Mono", monospace; letter-spacing: .12em; text-transform: uppercase; color: #008080; } .gd-kvs p { margin: 2px 0; font-size: 13.5px; }
  .gd-legend { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
  .gd-legend button { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; border: 1.5px solid #ece8e6 !important; font-size: 12px; font-weight: 700; color: #8a8e8f; transition: all .2s; }
  .gd-legend button i { width: 14px; height: 3px; border-radius: 2px; background: var(--c); } .gd-legend button .ms { font-size: 15px; }
  .gd-legend button.on { border-color: var(--c, #0d1117) !important; color: #040505; background: color-mix(in srgb, var(--c, #0d1117) 7%, #fff) !important; }
  /* flow map */
  .fm-wrap { overflow-x: auto; } .fm { width: 100%; min-width: 660px; height: auto; display: block; font-family: "Geist", sans-serif; }
  .fm-e line, .fm-e path, line.fm-e { stroke-width: 2.4; fill: none; transition: opacity .4s; } .fm-e.off { opacity: .06; } .fm-e.dim { opacity: .12; } .fm-e.hid { opacity: 0; }
  .fm-e.sel path, .fm-e.sel line, line.fm-e.sel { stroke-width: 4.5; } .fm-e { cursor: pointer; } .fm-e .hit { fill: transparent; }
  .fm-e.flow path, line.fm-e.flow { stroke-dasharray: 7 6; animation: gdDash 1.1s linear infinite; } @keyframes gdDash { to { stroke-dashoffset: -26; } }
  .fm-l { font-size: 12px; font-weight: 800; paint-order: stroke; stroke: #fff; stroke-width: 4px; } .fm-l.mid { text-anchor: middle; }
  .fm-band { font: 800 10.5px "Geist Mono", monospace; letter-spacing: .14em; opacity: .55; }
  .fm-n { cursor: pointer; transition: opacity .45s; } .fm-n.faded { opacity: .22; } .fm-n:hover .box { stroke: #e91e63; }
  .fm-n .box { fill: #fff; stroke: #0d1117; stroke-width: 1.6; transition: fill .3s, stroke .3s; } .fm-n .box.dec { stroke: #e91e63; stroke-width: 2; fill: #fff5f8; }
  .fm-n .ent { fill: #0d1117; } .fm-n .gate { fill: #fff; stroke: #e91e63; stroke-width: 2.6; }
  .fm-n.sel .box { stroke: #e91e63; stroke-width: 3; fill: #fff0f5; } .fm-n.sel .gate { fill: #ffe4ee; } .fm-n.done .box { fill: #e8f6f5; stroke: #008080; }
  .fm-t { font-size: 12.5px; font-weight: 700; fill: #0d1117; text-anchor: middle; } .fm-t.inv { fill: #fff; font-size: 10.5px; font-weight: 800; letter-spacing: .08em; } .fm-t.gt { fill: #e91e63; font-size: 8.5px; font-weight: 900; }
  .fm-s { font-size: 11px; fill: #5b5f60; text-anchor: middle; } .fm-s.gt { fill: #e91e63; font-weight: 800; } .fm-s.ow { font-weight: 700; } .fm-s.ck { fill: #0b6b6b; }
  .fm-num { font: 800 10.5px "Geist Mono", monospace; fill: #8a8e8f; } .fm-art rect { fill: #e8f6f5; stroke: #008080; stroke-width: 1; } .fm-art text { fill: #0b5555; font-weight: 600; }
  .fm .lay { animation: gdFade .6s ease; }
  .fm-tok { transition: transform .6s cubic-bezier(.22,1,.36,1); } .fm-tok circle { fill: #e91e63; } .fm-tok .ring { fill: none; stroke: #e91e63; stroke-width: 2; animation: gdRing 1.4s ease-out infinite; transform-origin: center; transform-box: fill-box; }
  @keyframes gdRing { from { opacity: .9; r: 9; } to { opacity: 0; r: 22; } }
  /* welcome */
  .gd-center { display: grid; place-items: center; } .gd-ring { width: min(100%, 500px); } .gd-ring .track { fill: none; stroke: #ece8e6; stroke-width: 2; stroke-dasharray: 4 6; }
  .gd-ring .rn circle { fill: #fff; stroke: var(--c); stroke-width: 2.5; } .gd-ring .rn { animation: gdGlow 2s ease-in-out infinite; } @keyframes gdGlow { 0%, 100% { opacity: .55; } 15% { opacity: 1; } }
  .gd-ring .rr { font: 900 13px "Montserrat"; fill: var(--c); text-anchor: middle; } .gd-ring .rk { font: 800 7.5px "Geist Mono"; fill: #3a3d3e; text-anchor: middle; letter-spacing: .06em; }
  .gd-ring .runner, .gd-loopx .runner { fill: #e91e63; } .gd-ring .rc1, .gd-loopx .rc1 { font: 900 30px "Montserrat"; fill: #040505; text-anchor: middle; letter-spacing: -.04em; } .gd-ring .rc2 { font: 700 11px "Geist Mono"; fill: #e91e63; text-anchor: middle; letter-spacing: .14em; text-transform: uppercase; }
  .gd-feat { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; } .gd-feat div { padding: 20px; border-radius: 18px; background: #faf8f7; border: 1px solid #ece8e6; }
  .gd-feat .ms { font-size: 30px; color: #e91e63; } .gd-feat b { display: block; font: 900 17px "Montserrat"; text-transform: uppercase; margin-top: 6px; } .gd-feat em { font-style: normal; font-size: 13px; color: #5b5f60; }
  .gd-chaps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; } .gd-chaps button { display: grid; grid-template-columns: 44px 1fr; gap: 2px 12px; padding: 16px; border-radius: 18px; text-align: left; background: #faf8f7 !important; border: 1.5px solid #ece8e6 !important; animation: gdUp .5s both; transition: border-color .2s, transform .2s; }
  .gd-chaps button:hover { border-color: #e91e63 !important; transform: translateY(-3px); } .gd-chaps i { grid-row: span 2; width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center; font-style: normal; background: #0d1117; color: #4fd1c5; }
  .gd-chaps b { font: 900 15px "Montserrat"; text-transform: uppercase; } .gd-chaps em { font-style: normal; font-size: 12.5px; color: #5b5f60; }
  /* chapter card */
  .gd-chcard { display: grid; grid-template-columns: auto 1fr; gap: clamp(20px, 4vw, 56px); align-items: center; padding: clamp(10px, 3vw, 40px); }
  .gd-chcard .num { position: relative; width: clamp(130px, 18vw, 220px); aspect-ratio: 1; border-radius: 40px; display: grid; place-items: center; background: #0d1117; color: #fff; animation: gdPop .7s cubic-bezier(.22,1,.36,1); }
  .gd-chcard .num i { font: 900 clamp(4rem, 9vw, 7rem)/1 "Montserrat"; font-style: normal; letter-spacing: -.06em; } .gd-chcard .num .ms { position: absolute; top: 16px; right: 16px; color: #4fd1c5; font-size: 26px; }
  .gd-chcard .k { font: 700 11px "Geist Mono"; letter-spacing: .2em; text-transform: uppercase; color: #e91e63; } .gd-chcard h3 { font: 900 clamp(2rem, 4.5vw, 3.6rem)/.95 "Montserrat"; text-transform: uppercase; letter-spacing: -.045em; margin: 6px 0 8px; } .gd-chcard p { font-size: 15px; color: #5b5f60; max-width: 560px; }
  .gd-chcard ol { list-style: none; display: grid; gap: 6px; margin: 16px 0; } .gd-chcard li { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 14px; background: #faf8f7; font-weight: 700; max-width: 460px; }
  .gd-chcard li .ms { color: #e91e63; } .gd-chcard .go { display: inline-flex; align-items: center; gap: 6px; padding: 12px 20px; border-radius: 999px; background: #e91e63 !important; color: #fff !important; font: 900 12px "Geist"; letter-spacing: .1em; text-transform: uppercase; box-shadow: 0 14px 30px -14px rgba(233,30,99,.7); }
  /* acts */
  .gd-acts { width: 100%; } .gd-acts .band rect { fill: color-mix(in srgb, var(--c) 10%, #fff); stroke: var(--c); stroke-width: 1.2; } .gd-acts .band text { font: 800 10px "Geist Mono"; fill: var(--c); letter-spacing: .1em; } .gd-acts .band, .gd-acts .lk, .gd-acts .act { transition: opacity .45s; } .gd-acts .faded { opacity: .18; }
  .gd-acts .lk { stroke: #c9c5c2; stroke-width: 2; } .gd-acts .gt rect { fill: #fff; stroke: #e91e63; stroke-width: 2; } .gd-acts .gt text { font: 700 8.5px "Geist"; fill: #e91e63; text-anchor: middle; } .gd-acts .gt { animation: gdFade .5s; }
  .gd-acts .act { cursor: pointer; } .gd-acts .act circle { fill: #fff; stroke: var(--c); stroke-width: 3; transition: fill .25s; } .gd-acts .act:hover circle, .gd-acts .act.sel circle { fill: color-mix(in srgb, var(--c) 14%, #fff); }
  .gd-acts .act.cur { animation: gdFade .5s; } .gd-acts .act.open circle { fill: var(--c); } .gd-acts .act.open .r, .gd-acts .act.open .k { fill: #fff; }
  .gd-acts .r { font: 900 13px "Montserrat"; fill: var(--c); text-anchor: middle; } .gd-acts .k { font: 800 7.5px "Geist Mono"; fill: #3a3d3e; text-anchor: middle; } .gd-acts .q { font-size: 10px; fill: #5b5f60; text-anchor: middle; }
  .gd-acts .loop { fill: none; stroke: #e91e63; stroke-width: 2.4; stroke-dasharray: 7 6; animation: gdDash 1.2s linear infinite; } .gd-acts .loopt { font: 800 11px "Geist"; fill: #e91e63; text-anchor: middle; } .gd-acts .pulse { fill: #e91e63; }
  /* zoom */
  .gd-lvls { display: flex; gap: 4px; margin-bottom: 10px; } .gd-lvls span { flex: 1; text-align: center; padding: 6px; border-radius: 10px; font: 800 10px "Geist Mono"; letter-spacing: .08em; text-transform: uppercase; background: #faf8f7; color: #a8acad; transition: all .4s; }
  .gd-lvls span.past { background: #e8f6f5; color: #008080; } .gd-lvls span.on { background: #e91e63; color: #fff; }
  .gd-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; margin-bottom: 12px; } .gd-crumbs .ms { color: #c9c5c2; font-size: 18px; }
  .gd-crumbs button { padding: 4px 10px; border-radius: 10px; font-size: 12.5px; font-weight: 700; text-align: left; } .gd-crumbs button small { display: block; font: 700 8.5px "Geist Mono"; letter-spacing: .1em; text-transform: uppercase; color: #8a8e8f; } .gd-crumbs button.on { background: #0d1117 !important; color: #fff; } .gd-crumbs button:hover:not(.on) { background: #faf8f7 !important; }
  .gd-zoom { animation: gdZoom .55s cubic-bezier(.22,1,.36,1); } @keyframes gdZoom { from { opacity: 0; transform: scale(.9); } }
  .gd-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .gd-tiles button { display: grid; gap: 4px; align-content: start; padding: 14px; min-height: 120px; border-radius: 16px; text-align: left; background: #faf8f7 !important; border: 1.5px solid #ece8e6 !important; animation: gdUp .45s both; transition: border-color .2s, transform .2s; }
  .gd-tiles button:hover { border-color: #e91e63 !important; transform: translateY(-3px); } .gd-tiles button.dec { border-color: #e91e63 !important; background: #fff5f8 !important; }
  .gd-tiles small { font: 800 10px "Geist Mono"; color: #e91e63; } .gd-tiles b { font: 900 14px/1.2 "Montserrat"; text-transform: uppercase; color: #040505; } .gd-tiles em { font-style: normal; font-size: 12px; color: #5b5f60; display: flex; gap: 4px; align-items: center; } .gd-tiles em .ms { font-size: 14px; }
  .gd-tiles .cnt { margin-top: auto; display: inline-flex; align-items: center; gap: 4px; font: 700 10px "Geist Mono"; color: #008080; text-transform: uppercase; } .gd-tiles .cnt .ms { font-size: 15px; }
  .gd-stepcard { display: grid; justify-items: start; gap: 6px; padding: 26px; border-radius: 20px; background: linear-gradient(135deg, #fff5f8, #fff); border: 2px solid #e91e63; max-width: 520px; } .gd-stepcard > .ms { font-size: 34px; color: #e91e63; } .gd-stepcard h3 { font: 900 22px "Montserrat"; text-transform: uppercase; letter-spacing: -.02em; }
  /* page anatomy */
  .gd-page { display: grid; gap: 10px; padding: 18px; border-radius: 18px; background: #fdfcfc; border: 1px solid #ece8e6; max-width: 760px; }
  .gd-hs { position: relative; padding: 10px 12px; border-radius: 12px; } .gd-hs .tag { position: absolute; top: -9px; right: -9px; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font: 800 10.5px "Geist Mono"; font-style: normal; background: #0d1117; color: #fff; }
  .gd-hs h3 { font: 900 20px "Montserrat"; text-transform: uppercase; letter-spacing: -.02em; } .gd-hs p { font-size: 13px; color: #5b5f60; } .gd-hs .lbl { font: 700 9.5px "Geist Mono"; letter-spacing: .14em; color: #008080; }
  .gd-pmap { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; } .gd-pmap .e { padding: 5px 10px; border-radius: 99px; background: #0d1117; color: #fff; } .gd-pmap .n { padding: 5px 9px; border-radius: 8px; border: 1.5px solid #0d1117; } .gd-pmap .g { color: #e91e63; font-size: 18px; } .gd-pmap .ms { font-size: 14px; color: #8a8e8f; }
  .gd-ptabs { display: flex; flex-wrap: wrap; gap: 3px; } .gd-ptabs span { padding: 4px 8px; font: 700 9.5px "Geist Mono"; text-transform: uppercase; color: #8a8e8f; border-bottom: 2px solid transparent; } .gd-ptabs span.on { color: #040505; border-color: #008080; }
  .gd-pbtns { display: flex; gap: 6px; } .gd-pbtns span { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 10px; background: #0d1117; color: #fff; font-size: 12px; font-weight: 700; } .gd-pbtns span:first-child { background: #e91e63; } .gd-pbtns .ms { font-size: 15px; }
  .gd-plearn { display: grid; gap: 3px; font-size: 12.5px; } .gd-plearn b { font: 700 9.5px "Geist Mono"; text-transform: uppercase; letter-spacing: .12em; color: #6d48d8; }
  /* contract */
  .gd-contract { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 14px; }
  .gd-cwheel { display: grid; gap: 4px; align-content: start; } .gd-cwheel button { display: grid; grid-template-columns: 22px 1fr auto; gap: 8px; align-items: center; padding: 8px 10px; border-radius: 12px; text-align: left; font-size: 13px; font-weight: 700; color: #3a3d3e; }
  .gd-cwheel button .ms { font-size: 18px; color: #008080; } .gd-cwheel small { font: 700 9.5px "Geist Mono"; color: #c9c5c2; } .gd-cwheel button:hover { background: #faf8f7 !important; }
  .gd-cwheel button.on { background: #e91e63 !important; color: #fff; } .gd-cwheel button.on .ms, .gd-cwheel button.on small { color: #fff; }
  .gd-csec { padding: 16px 18px; border-radius: 18px; background: #faf8f7; animation: gdUp .45s; min-height: 340px; } .gd-csec h4 { display: flex; align-items: center; gap: 8px; font: 900 18px "Montserrat"; text-transform: uppercase; } .gd-csec h4 small { font: 700 10px "Geist Mono"; color: #8a8e8f; letter-spacing: .1em; } .gd-csec h4 .ms { color: #e91e63; }
  .gd-q { font-size: 14px; font-style: italic; color: #5b5f60; margin: 4px 0 12px; }
  /* scenarios etc */
  .gd-scen { display: flex; flex-wrap: wrap; gap: 3px; padding: 3px; border-radius: 14px; background: #f6f4f3; margin-bottom: 10px; width: fit-content; }
  .gd-scen button { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 11px; font-size: 12.5px; font-weight: 700; color: #5b5f60; } .gd-scen button .ms { font-size: 16px; color: var(--c); }
  .gd-scen button.on { background: #fff !important; color: #040505; box-shadow: 0 1px 3px rgba(0,0,0,.12), inset 0 -2px 0 var(--c); }
  .gd-states { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-bottom: 8px; } .gd-states span:not(.ms) { padding: 4px 10px; border-radius: 99px; background: #6d48d8; color: #fff; font-size: 11.5px; font-weight: 700; animation: gdUp .45s both; } .gd-states .ms { color: #6d48d8; font-size: 15px; }
  /* gate */
  .gd-gatex { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: center; }
  .gd-crit label { display: flex; gap: 10px; align-items: flex-start; padding: 9px 11px; margin-bottom: 5px; border-radius: 12px; border: 1.5px solid #ece8e6; cursor: pointer; font-size: 13.5px; transition: all .3s; } .gd-crit label.on { border-color: #008080; background: #e8f6f5; } .gd-crit label.sit.on { border-color: #e91e63; background: #fff5f8; }
  .gd-crit input { accent-color: #008080; margin-top: 2px; width: 16px; height: 16px; flex: none; } .gd-crit label.sit input { accent-color: #e91e63; }
  .gd-dec { display: grid; justify-items: center; gap: 6px; text-align: center; }
  .gd-dec .dia { position: relative; width: 170px; height: 170px; display: grid; place-items: center; } .gd-dec .dia i { position: absolute; inset: 28px; transform: rotate(45deg); border: 3px solid var(--c); border-radius: 14px; background: #fff; transition: border-color .4s; animation: gdPing 2.4s ease-out infinite; }
  @keyframes gdPing { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 40%, transparent); } 70%, 100% { box-shadow: 0 0 0 18px transparent; } }
  .gd-dec .dia span { position: relative; max-width: 96px; font: 900 11.5px/1.15 "Montserrat"; text-transform: uppercase; color: #040505; }
  .gd-dec .arrow { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #fff; animation: gdPop .55s; } .gd-dec .arrow .ms { font-size: 30px; }
  .gd-dec .res b { display: block; font: 900 28px "Montserrat"; text-transform: uppercase; color: var(--c); letter-spacing: -.03em; animation: gdUp .4s; } .gd-dec .res em { font: 700 10px "Geist Mono"; text-transform: uppercase; letter-spacing: .14em; color: #8a8e8f; font-style: normal; } .gd-dec .res p { font-size: 13px; color: #3a3d3e; max-width: 320px; }
  .gd-choice { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; } .gd-choice > span { font-weight: 800; color: #e91e63; margin-right: 6px; }
  .gd-choice button { display: inline-flex; align-items: center; gap: 4px; padding: 8px 18px; border-radius: 999px; font-size: 13px; font-weight: 800; border: 2px solid #0d1117 !important; } .gd-choice button.on, .gd-choice button:hover { background: #0d1117 !important; color: #fff; }
  .gd-choice.ghost button { border-color: #ece8e6 !important; font-weight: 700; } .gd-choice .ms { font-size: 16px; }
  /* knowledge */
  .gd-kbars { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; margin-bottom: 8px; } .gd-kbars button { display: grid; justify-items: center; gap: 2px; padding: 8px 2px; border-radius: 12px; } .gd-kbars button.on, .gd-kbars button:hover { background: color-mix(in srgb, var(--c) 10%, #fff) !important; }
  .gd-kbars .b { width: 26px; height: 90px; border-radius: 7px; background: #f6f4f3; display: flex; align-items: flex-end; overflow: hidden; } .gd-kbars .b i { width: 100%; background: var(--c); border-radius: 7px; transform-origin: bottom; transition: transform .7s cubic-bezier(.22,1,.36,1); } .gd-kbars .rv.out .b i { transform: scaleY(0); }
  .gd-kbars b { font: 900 16px "Montserrat"; } .gd-kbars small { font-size: 10.5px; color: #5b5f60; }
  .gd-knode > div { display: flex; flex-wrap: wrap; gap: 5px; } .gd-knode button { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; border: 1.5px solid color-mix(in srgb, var(--c) 40%, #fff) !important; font-size: 12.5px; font-weight: 700; animation: gdUp .4s both; } .gd-knode button i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); } .gd-knode small { font: 700 9px "Geist Mono"; color: #8a8e8f; text-transform: uppercase; }
  .gd-knode button.on { background: var(--c) !important; color: #fff; } .gd-knode button.on small { color: rgba(255,255,255,.8); } .gd-knode button.on i { background: #fff; }
  .gd-struct { font-size: 12.5px; }
  /* lenses */
  .gd-lenses { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 14px; align-items: center; } .gd-donut { width: 100%; max-height: 52vh; }
  .gd-donut .seg path { fill: none; stroke: var(--c); stroke-width: 34; cursor: pointer; transition: stroke-width .3s, opacity .4s; } .gd-donut .seg:hover path, .gd-donut .seg.on path { stroke-width: 44; } .gd-donut .seg.off { opacity: .3; } .gd-donut .seg { transition: opacity .45s; }
  .gd-donut .seg text { font: 800 11px "Geist"; fill: var(--c); text-anchor: middle; cursor: pointer; } .gd-donut .c1 { font: 900 38px "Montserrat"; text-anchor: middle; fill: #040505; } .gd-donut .c2 { font: 700 10px "Geist Mono"; text-anchor: middle; fill: #8a8e8f; letter-spacing: .14em; text-transform: uppercase; }
  .gd-lreq { display: grid; gap: 4px; max-height: 50vh; overflow: auto; align-content: start; min-height: 40px; } .gd-lreq button { display: grid; grid-template-columns: 22px 1fr auto; gap: 8px; align-items: center; padding: 7px 10px; border-radius: 10px; text-align: left; font-size: 13px; font-weight: 700; border-left: 3px solid var(--c) !important; background: color-mix(in srgb, var(--c) 5%, #fff) !important; animation: gdUp .4s both; }
  .gd-lreq button .ms { font-size: 17px; color: var(--c); } .gd-lreq small { font: 700 9px "Geist Mono"; text-transform: uppercase; color: #8a8e8f; } .gd-lreq .rq small { color: var(--c); } .gd-lreq button.on { background: var(--c) !important; color: #fff; } .gd-lreq button.on .ms, .gd-lreq button.on small { color: #fff; }
  /* raci */
  .gd-raci { overflow-x: auto; } .gd-raci table { width: 100%; border-collapse: separate; border-spacing: 4px; } .gd-raci thead th { font: 800 11px "Geist Mono"; color: #040505; text-align: center; } .gd-raci thead small { display: block; font: 600 10px "Geist"; color: #8a8e8f; }
  .gd-raci tbody th { text-align: left; } .gd-raci tbody th button { padding: 6px 8px; border-radius: 8px; font-size: 12.5px; font-weight: 700; text-align: left; } .gd-raci tbody th button:hover, .gd-raci tbody th button.on { background: #0d1117 !important; color: #fff; }
  .gd-raci td { text-align: center; background: #faf8f7; border-radius: 8px; height: 36px; } .gd-raci td i, .gd-legend i[class^="l"] { display: inline-grid; place-items: center; width: 24px; height: 24px; margin: 0 1px; border-radius: 7px; font: 900 12px "Montserrat"; font-style: normal; color: #fff; transition: opacity .35s, transform .35s; }
  .lR { background: #008080; } .lA { background: #e91e63; } .lC { background: #6d48d8; } .lI { background: #c49000; } .gd-raci td i.off { opacity: .1; } .gd-raci td i.pop { transform: scale(1.3); }
  .gd-legend i[class^="l"] { width: 18px; height: 18px; font-size: 10px; }
  /* trace */
  .gd-trace { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; } .gd-trace .lnk { width: 14px; height: 2px; background: #ece8e6; }
  .gd-trace button { display: grid; gap: 1px; padding: 9px 11px; border-radius: 12px; text-align: left; background: #faf8f7 !important; border: 1.5px solid #ece8e6 !important; transition: all .45s cubic-bezier(.22,1,.36,1); }
  .gd-trace b { font: 800 12px "Geist Mono"; color: #8a8e8f; } .gd-trace small { font-size: 11px; color: #5b5f60; } .gd-trace button.dark { opacity: .28; filter: grayscale(1); }
  .gd-trace button.lit { border-color: #008080 !important; background: #e8f6f5 !important; } .gd-trace button.lit b { color: #008080; } .gd-trace button.cur { transform: scale(1.08); border-color: #e91e63 !important; background: #fff5f8 !important; } .gd-trace button.cur b { color: #e91e63; }
  .gd-trace button.on { border-color: #e91e63 !important; background: #e91e63 !important; } .gd-trace button.on b, .gd-trace button.on small { color: #fff; }
  /* prompts & kit */
  .gd-ptool { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; } .gd-ptool .gd-scen { margin: 0; }
  .gd-ptool select { padding: 7px 10px; border-radius: 10px; border: 1.5px solid #ece8e6; background: #fff; font: 700 12px "Geist"; }
  .gd-count { font-size: 13px; color: #5b5f60; } .gd-count b { font: 900 22px "Montserrat"; color: #e91e63; }
  .gd-term { border-radius: 16px; background: #0d1117; overflow: hidden; } .gd-term .bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,.07); color: rgba(255,255,255,.55); font: 600 11px "Geist Mono"; }
  .gd-term .bar i { width: 10px; height: 10px; border-radius: 50%; background: #ff5f57; } .gd-term .bar i:nth-child(2) { background: #febc2e; } .gd-term .bar i:nth-child(3) { background: #28c840; } .gd-term .bar span { margin-left: 6px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gd-term .bar button { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 99px; background: #e91e63 !important; color: #fff !important; font: 800 10.5px "Geist"; } .gd-term .bar button .ms { font-size: 14px; }
  .gd-term pre { margin: 0; height: min(42vh, 400px); overflow: auto; padding: 14px; color: #c9d1d9; font: 12px/1.6 "Geist Mono", monospace; white-space: pre-wrap; word-break: break-word; }
  .gd-term pre .cur { display: inline-block; width: 8px; height: 14px; background: #4fd1c5; vertical-align: -2px; animation: gdBlink 1s steps(1) infinite; } @keyframes gdBlink { 50% { opacity: 0; } }
  .gd-kitx { display: grid; grid-template-columns: 190px 240px minmax(0, 1fr); gap: 8px; height: min(46vh, 440px); }
  .gd-kitx .lay, .gd-kitx .files { display: grid; gap: 3px; align-content: start; overflow: auto; }
  .gd-kitx .lay button, .gd-kitx .files button { display: flex; align-items: center; gap: 6px; padding: 7px 9px; border-radius: 10px; text-align: left; font-size: 12.5px; font-weight: 700; } .gd-kitx .lay small { margin-left: auto; font: 700 10px "Geist Mono"; color: #8a8e8f; } .gd-kitx .ms { font-size: 16px; color: #e91e63; }
  .gd-kitx .files button { font: 600 11px "Geist Mono"; word-break: break-all; animation: gdUp .35s both; } .gd-kitx button.on { background: #0d1117 !important; color: #fff; } .gd-kitx button.on small { color: #4fd1c5; } .gd-kitx button:hover:not(.on) { background: #faf8f7 !important; }
  .gd-kitx .prev { margin: 0; overflow: auto; padding: 12px; border-radius: 14px; background: #0d1117; color: #c9d1d9; font: 11.5px/1.55 "Geist Mono", monospace; white-space: pre-wrap; word-break: break-word; animation: gdFade .35s; }
  /* story */
  .gd-story { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 4px; } .gd-story .bar { flex-basis: 100%; height: 4px; border-radius: 4px; background: #f6f4f3; overflow: hidden; } .gd-story .bar i { display: block; height: 100%; background: #e91e63; transition: width .5s; }
  .gd-story .gd-mini { margin: 6px 6px 0 0; } .gd-story button { padding: 5px 11px; border-radius: 99px; border: 1.5px solid color-mix(in srgb, #008080 40%, #fff) !important; background: #e8f6f5 !important; font-size: 12px; font-weight: 700; animation: gdUp .4s both; }
  /* tailoring */
  .gd-tail { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; } .gd-tail div { padding: 12px; border-radius: 14px; background: #faf8f7; border: 1.5px solid #ece8e6; display: grid; gap: 3px; align-content: start; transition: all .4s; animation: gdUp .4s both; }
  .gd-tail div.chg { border-color: #c49000; background: #fffaf0; } .gd-tail small { font: 800 10px "Geist Mono"; color: #8a8e8f; } .gd-tail b { font-size: 13px; } .gd-tail em { font-style: normal; font-size: 12px; color: #3a3d3e; } .gd-tail em.same { color: #a8acad; } .gd-tail .sk { font: 700 10px "Geist Mono"; color: #e91e63; text-transform: uppercase; }
  .gd-scales { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 8px; } .gd-scales button { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 12px; border: 1.5px solid #ece8e6 !important; font-size: 13px; } .gd-scales button .ms { color: #6d48d8; } .gd-scales button.on { background: #0d1117 !important; color: #fff; border-color: #0d1117 !important; } .gd-scales button.on .ms { color: #4fd1c5; }
  .gd-kvs.scl { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); padding: 12px; border-radius: 14px; background: #faf8f7; animation: gdUp .4s; }
  /* delivery */
  .gd-sys { width: 100%; } .gd-sys .sn rect { fill: #fff; stroke: #0d1117; stroke-width: 1.5; transition: all .35s; } .gd-sys .sn text { font: 700 11.5px "Geist"; text-anchor: middle; fill: #0d1117; } .gd-sys .sn.on rect { fill: #0d1117; } .gd-sys .sn.on text { fill: #fff; }
  .gd-sys .se { fill: none; stroke-width: 2; opacity: .5; transition: opacity .35s; } .gd-sys .se.on { opacity: 1; stroke-width: 3.2; stroke-dasharray: 7 6; animation: gdDash 1s linear infinite; } .gd-sys .se.dim { opacity: .08; }
  /* reasoning */
  .gd-chainx { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } .gd-chainx li { display: grid; grid-template-columns: 30px 1fr; gap: 2px 10px; align-items: center; padding: 10px 12px; border-radius: 14px; background: #faf8f7; cursor: pointer; }
  .gd-chainx i { grid-row: span 2; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font: 800 11px "Geist Mono"; font-style: normal; background: #ece8e6; color: #5b5f60; } .gd-chainx b { font-size: 13px; } .gd-chainx em { display: block; font: 700 10px "Geist Mono"; font-style: normal; color: #6d48d8; }
  .gd-chainx li.past i { background: #6d48d8; color: #fff; } .gd-chainx li.on { background: #0d1117; color: #fff; } .gd-chainx li.on i { background: #e91e63; color: #fff; } .gd-chainx li.on em { color: #4fd1c5; }
  /* learning */
  .gd-objs { display: grid; gap: 10px; max-width: 760px; } .gd-objs div { display: flex; gap: 12px; align-items: center; padding: 16px 18px; border-radius: 16px; background: #faf8f7; border: 1.5px solid #ece8e6; font-size: 16px; } .gd-objs .ms { color: #008080; font-size: 24px; }
  .gd-learn.ex { display: flex; gap: 14px; padding: 22px; border-radius: 18px; background: #fffaf0; border: 2px dashed #c49000; max-width: 760px; animation: gdUp .45s; } .gd-learn.ex .ms { font-size: 34px; color: #c49000; } .gd-learn.ex p { font-size: 16px; }
  .gd-quiz { display: grid; gap: 14px; max-width: 820px; } .gd-quiz .qq > b { display: block; font-size: 14.5px; margin-bottom: 6px; } .gd-quiz .qq > div { display: grid; gap: 5px; }
  .gd-quiz button { text-align: left; padding: 9px 12px; border-radius: 12px; border: 1.5px solid #ece8e6 !important; font-size: 13.5px; transition: all .2s; } .gd-quiz button:hover:not(:disabled) { border-color: #0d1117 !important; transform: translateX(3px); }
  .gd-quiz button.ok { border-color: #008080 !important; background: #e8f6f5 !important; font-weight: 700; animation: gdPop .5s; } .gd-quiz button.no { border-color: #e91e63 !important; background: #fff5f8 !important; animation: gdShake .4s; } .gd-quiz button:disabled { cursor: default; }
  @keyframes gdShake { 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
  .gd-quiz .why { display: flex; gap: 6px; margin-top: 6px; font-size: 13px; padding: 8px 10px; border-radius: 10px; animation: gdUp .35s; } .gd-quiz .why.ok { background: #e8f6f5; color: #0b5555; } .gd-quiz .why.no { background: #fff5f8; color: #8a1240; } .gd-quiz .why .ms { font-size: 17px; }
  /* routine */
  .gd-loopx { width: min(100%, 500px); display: block; margin: 0 auto; } .gd-loopx .track { fill: none; stroke: #ece8e6; stroke-width: 2; stroke-dasharray: 4 6; }
  .gd-loopx .lp { cursor: pointer; transition: opacity .45s; } .gd-loopx .lp circle { fill: #fff; stroke: #0d1117; stroke-width: 2; transition: all .35s; } .gd-loopx .lp text.ms { font-family: "Material Symbols Outlined"; font-size: 22px; text-anchor: middle; fill: #0d1117; } .gd-loopx .lp .t { font: 800 11px "Geist"; text-anchor: middle; fill: #3a3d3e; }
  .gd-loopx .lp.on circle { fill: #e91e63; stroke: #e91e63; } .gd-loopx .lp.on text.ms { fill: #fff; } .gd-loopx .lp.on .t { fill: #e91e63; } .gd-loopx .rc1 { font-size: 22px; }
  /* footer */
  .gd-foot { display: flex; align-items: center; gap: 12px; padding: 10px clamp(16px, 3vw, 32px) 12px; border-top: 1px solid #ece8e6; background: rgba(253,248,248,.94); backdrop-filter: blur(10px); }
  .gd-nav { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; border: 1.5px solid #ece8e6 !important; background: #fff !important; color: #040505; } .gd-nav:hover:not(:disabled) { border-color: #040505 !important; } .gd-nav:disabled { opacity: .3; cursor: default; }
  .gd-nav.nx { width: auto; max-width: 46vw; padding: 0 18px 0 20px; gap: 6px; display: inline-flex; align-items: center; border: 0 !important; border-radius: 999px; background: #e91e63 !important; color: #fff; font: 900 12px "Geist", sans-serif; letter-spacing: .1em; text-transform: uppercase; box-shadow: 0 14px 30px -14px rgba(233,30,99,.7); } .gd-nav.nx .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gd-cnt { font: 700 12px "Geist Mono", monospace; letter-spacing: .1em; color: #8a8e8f; white-space: nowrap; } .gd-cnt b { color: #040505; font-size: 14px; }
  .gd-dots { flex: 1; display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; } .gd-dots button { width: 8px; height: 8px; border-radius: 50%; background: rgba(0,0,0,.14) !important; transition: transform .25s, background .25s; padding: 0; } .gd-dots button.card { border-radius: 2px; } .gd-dots button.on { background: #e91e63 !important; transform: scale(1.5); } .gd-dots button.seen { background: rgba(0,128,128,.5) !important; }
  .gd-go { display: inline-flex; align-items: center; gap: 6px; font: 800 12px "Geist", sans-serif; color: #008080; white-space: nowrap; } .gd-go:hover { color: #040505; }
  .gd-toast { position: fixed; right: 18px; bottom: 18px; z-index: 250; display: flex; align-items: center; gap: 12px; max-width: min(420px, calc(100vw - 36px)); padding: 12px 12px 12px 16px; border-radius: 18px; background: #0d1117; color: #fff; box-shadow: 0 24px 48px -16px rgba(0,0,0,.5); font: 14px/1.4 "Geist", sans-serif; animation: gdUp .5s cubic-bezier(.22,1,.36,1); }
  .gd-toast .ms { color: #4fd1c5; } .gd-toast b { display: block; } .gd-toast span.t { color: rgba(255,255,255,.65); font-size: 13px; }
  .gd-toast button { flex: none; padding: 8px 14px; border: 0; border-radius: 999px; background: #e91e63; color: #fff; font: 800 11px "Geist", sans-serif; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; } .gd-toast button.x { background: none; padding: 6px; color: rgba(255,255,255,.5); }
  @media (max-width: 1000px) {
    .gd-ch { display: none; } .gd-top .gd-x { margin-left: auto; } .gd-dots { display: none; } .gd-cnt { flex: 1; text-align: center; } .gd-go span.t { display: none; }
    .gd-canvas.drawer-on .gd-cam { margin-right: 0; } .gd-drawer { width: min(360px, 92%); }
    .gd-contract, .gd-gatex, .gd-lenses, .gd-chcard { grid-template-columns: 1fr; } .gd-kitx { grid-template-columns: 1fr; height: auto; } .gd-kitx .files { max-height: 200px; } .gd-kitx .prev { max-height: 300px; }
    .gd-feat, .gd-chainx { grid-template-columns: 1fr 1fr; } .gd-kbars { grid-template-columns: repeat(4, 1fr); }
  }
  @media (max-width: 640px) { .gd-feat, .gd-chainx { grid-template-columns: 1fr; } .gd-co { width: calc(100% - 20px); } .gd-ptr { display: none; } }
  @media (prefers-reduced-motion: reduce) { .gd *, .gd { animation: none !important; transition: none !important; } .gd-co-t .w { opacity: 1; transform: none; } }`;
  document.head.appendChild(css);

  const el = document.createElement("div");
  el.className = "gd";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "How to read the Node book");
  el.innerHTML = `<header class="gd-top"><div class="gd-brand"><i><span class="ms">dataset</span></i>Node.<span>Interactive guide</span></div><nav class="gd-ch">${CH.map(([c], i) => `<button data-gch="${i}">${c}</button>`).join("")}</nav><button class="gd-x" data-gx aria-label="Close the guide" title="Close (Esc)"><span class="ms">close</span></button></header>
    <div class="gd-bar"><i></i></div><div class="gd-body"></div>
    <footer class="gd-foot"><button class="gd-nav" data-gp aria-label="Back"><span class="ms">arrow_back</span></button><span class="gd-cnt"></span><div class="gd-dots">${S.map((s, i) => `<button data-gi="${i}" class="${s.card ? "card" : ""}" aria-label="${esc(s.t)}" title="${esc(s.t)}"></button>`).join("")}</div><a class="gd-go" href="#"></a><button class="gd-nav nx" data-gn><span class="t">Next</span><span class="ms">arrow_forward</span></button></footer>`;
  document.body.appendChild(el);
  const body = el.querySelector(".gd-body");

  let sc = Math.max(0, Math.min(S.length - 1, store.get("node-guide-at", 0))), bt = 0, st = {}, T = [], seen = new Set(store.get("node-guide-seen-steps", [])), playing = false, mini = false, noDet = false, placeT = [], pred = null;
  const clearT = () => { T.forEach(clearInterval); T = []; placeT.forEach(clearTimeout); placeT = []; };
  const scene = () => S[sc];
  const beat = () => (scene() ? scene().beats[bt] || {} : {});
  const q = (s) => body.querySelector(s);

  /* word-by-word reveal of the callout text (keeps the HTML intact) */
  const animateWords = (root) => {
    if (!root) return;
    let i = 0; const walk = (n) => { [...n.childNodes].forEach((c) => { if (c.nodeType === 3) { const frag = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; } const sp = document.createElement("span"); sp.className = "w"; sp.style.animationDelay = Math.min(i++ * 26, 1300) + "ms"; sp.textContent = w; frag.appendChild(sp); }); c.replaceWith(frag); } else if (c.nodeType === 1 && !c.classList.contains("w")) walk(c); }); }; walk(root);
  };

  const coHTML = () => { const s = scene(), n = s.beats.length; return `<div class="gd-co-h"><span>${s.card ? "Chapter" : "Step"} ${bt + 1} / ${n}</span><button class="min" data-comin aria-label="${mini ? "Expand" : "Minimise"} the explanation" title="${mini ? "Expand" : "Minimise"}"><span class="ms">${mini ? "open_in_full" : "close_fullscreen"}</span></button></div><div class="gd-co-t">${beat().say || ""}</div><div class="gd-co-f"><button data-gbp ${bt === 0 && sc === 0 ? "disabled" : ""}><span class="ms">chevron_left</span>Back</button><button class="pri" data-gbn>${bt < n - 1 ? "Next" : sc < S.length - 1 ? "Next topic" : "Finish"}<span class="ms">chevron_right</span></button></div>`; };

  /* place the callout next to its target, draw the pointer and the spotlight */
  const targetEl = () => { const cv = q(".gd-canvas"), b = beat(), sel = typeof b.at === "function" ? b.at(st) : b.at; if (!cv || !sel) return null; try { const t = cv.querySelector(".gd-cam " + sel); return t && t.getBoundingClientRect().width ? t : null; } catch { return null; } };
  const place = () => {
    const cv = q(".gd-canvas"), co = q(".gd-co"), hl = q(".gd-hl"), ptr = q(".gd-ptr"); if (!cv || !co) return;
    const b = beat(), target = targetEl();
    const C0 = cv.getBoundingClientRect(), drawer = cv.classList.contains("drawer-on") && innerWidth > 1000 ? 360 : 0, W = C0.width - drawer, H = Math.max(cv.scrollHeight, C0.height);
    co.classList.toggle("mini", mini);
    const cw = co.offsetWidth, ch = co.offsetHeight;
    ptr.setAttribute("viewBox", `0 0 ${C0.width} ${H}`); ptr.style.height = H + "px";
    if (!target) { hl.classList.remove("on", "spot"); ptr.innerHTML = ""; co.style.left = Math.max(12, (W - cw) / 2) + "px"; co.style.top = Math.max(12, Math.min(H - ch - 12, C0.height * 0.55)) + "px"; co.classList.add("on"); return; }
    /* while the camera glides, use the target's predicted final box rather than its mid-animation one */
    const r = pred || (() => { const x = target.getBoundingClientRect(); return { x: x.left - C0.left, y: x.top - C0.top, w: x.width, h: x.height }; })();
    const pad = 6, a = { x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 };
    Object.assign(hl.style, { left: a.x + "px", top: a.y + "px", width: a.w + "px", height: a.h + "px" });
    hl.classList.add("on"); hl.classList.toggle("spot", b.spot !== false && !mini);
    const g = 22, opts = { below: { x: a.x + a.w / 2 - cw / 2, y: a.y + a.h + g }, above: { x: a.x + a.w / 2 - cw / 2, y: a.y - ch - g }, right: { x: a.x + a.w + g, y: a.y + a.h / 2 - ch / 2 }, left: { x: a.x - cw - g, y: a.y + a.h / 2 - ch / 2 } };
    const clampP = (p) => ({ x: Math.max(10, Math.min(W - cw - 10, p.x)), y: Math.max(10, Math.min(H - ch - 10, p.y)) });
    const overlaps = (p) => !(p.x >= a.x + a.w || p.x + cw <= a.x || p.y >= a.y + a.h || p.y + ch <= a.y);
    const ok = (k) => { const raw = opts[k], p = clampP(raw); const inside = raw.y >= 10 && raw.y + ch <= H - 10 && (k === "below" || k === "above" ? true : raw.x >= 10 && raw.x + cw <= W - 10); return inside && !overlaps(p); };
    const order = [b.pos || "below", "below", "above", "right", "left"].filter((v, i, x) => x.indexOf(v) === i);
    const side = order.find(ok) || order[0], p = clampP(opts[side]);
    co.style.left = p.x + "px"; co.style.top = p.y + "px"; co.classList.add("on");
    const tx = a.x + a.w / 2, ty = a.y + a.h / 2;
    const from = side === "below" ? [Math.max(p.x + 24, Math.min(p.x + cw - 24, tx)), p.y] : side === "above" ? [Math.max(p.x + 24, Math.min(p.x + cw - 24, tx)), p.y + ch] : side === "right" ? [p.x, Math.max(p.y + 18, Math.min(p.y + ch - 18, ty))] : [p.x + cw, Math.max(p.y + 18, Math.min(p.y + ch - 18, ty))];
    const to = side === "below" ? [tx, a.y + a.h] : side === "above" ? [tx, a.y] : side === "right" ? [a.x + a.w, ty] : [a.x, ty];
    const bend = side === "below" || side === "above" ? [(from[0] + to[0]) / 2 + 24, (from[1] + to[1]) / 2] : [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - 20];
    ptr.innerHTML = mini || overlaps(p) ? "" : `<path d="M${from[0]} ${from[1]} Q ${bend[0]} ${bend[1]} ${to[0]} ${to[1]}"/><circle cx="${to[0]}" cy="${to[1]}" r="4.5"/>`;
    const top = Math.min(a.y, p.y) + cv.offsetTop - 16, bottom = Math.max(a.y + a.h, p.y + ch) + cv.offsetTop + 16;
    if (top < body.scrollTop || bottom > body.scrollTop + body.clientHeight) body.scrollTo({ top: Math.max(0, bottom - top > body.clientHeight ? top : bottom - body.clientHeight + 10), behavior: "smooth" });
  };
  /* the camera: gently zoom into the target when a beat asks for it */
  const aim = () => {
    const cam = q(".gd-cam"); if (!cam) return;
    const b = beat(), target = targetEl(), cv = q(".gd-canvas");
    pred = null;
    if (b.zoom && b.zoom > 1 && target && innerWidth > 760) {
      /* measure untransformed, then scale around the target's centre: its centre stays put and its size grows by k */
      const k = b.zoom, prevT = cam.style.transform, prevO = cam.style.transformOrigin;
      cam.style.transition = "none"; cam.style.transform = "none";
      const C0 = cam.getBoundingClientRect(), CV = cv.getBoundingClientRect(), r = target.getBoundingClientRect();
      const ox = r.left + r.width / 2 - C0.left, oy = r.top + r.height / 2 - C0.top;
      pred = { x: r.left - CV.left + r.width / 2 - (r.width * k) / 2, y: r.top - CV.top + r.height / 2 - (r.height * k) / 2, w: r.width * k, h: r.height * k };
      cam.style.transformOrigin = prevO; cam.style.transform = prevT; void cam.offsetWidth; cam.style.transition = "";
      cam.style.transformOrigin = `${ox}px ${oy}px`; cam.style.transform = `scale(${k})`;
    } else cam.style.transform = "none";
    placeT.push(setTimeout(place, 20), setTimeout(() => { pred = null; place(); }, 700));
  };

  const ctlHTML = () => { const s = scene(); return `<div class="gd-segs">${s.beats.map((_, i) => `<button data-gb="${i}" class="${i === bt ? "on" : i < bt ? "past" : ""}" aria-label="Step ${i + 1}"></button>`).join("")}</div><button class="gd-play ${playing ? "on" : ""}" data-play title="Play / pause (Space)"><span class="ms">${playing ? "pause" : "play_arrow"}</span>${playing ? "Pause" : "Play"}<i></i></button>`; };
  const draw = (dir) => {
    clearT();
    const s = scene(), D = s.detail && !noDet ? s.detail(st) : "";
    body.innerHTML = `<article class="gd-scene ${dir > 0 ? "nx" : dir < 0 ? "pv" : ""}"><header class="gd-sh"><span class="ic"><span class="ms">${s.ic}</span></span><span class="eb">${CH[s.ch][0]} · ${sc + 1} of ${S.length}</span><h2>${esc(s.t)}</h2><p class="gd-lead">${s.lead}</p></header>
      <div class="gd-ctl">${ctlHTML()}</div>
      <div class="gd-canvas ${D ? "drawer-on" : ""}"><div class="gd-cam"><div class="gd-stage-in">${s.stage(st)}</div></div><div class="gd-hl"></div><svg class="gd-ptr"></svg><div class="gd-co" aria-live="polite">${coHTML()}</div><aside class="gd-drawer"><button class="x" data-dx aria-label="Close details"><span class="ms">close</span></button><div class="gd-dbody">${D}</div></aside></div></article>`;
    if (dir !== undefined) body.scrollTop = 0;
    animateWords(q(".gd-co-t"));
    if (s.after) s.after(q(".gd-canvas"), st, T);
    placeT.push(setTimeout(aim, 0)); foot(); schedule();
  };
  const redraw = (beatChanged) => {
    clearT();
    const s = scene(), cv = q(".gd-canvas"); if (!cv) return draw();
    const D = s.detail && !noDet ? s.detail(st) : "";
    q(".gd-stage-in").innerHTML = s.stage(st);
    const had = cv.classList.contains("drawer-on"); cv.classList.toggle("drawer-on", !!D);
    const db = q(".gd-dbody"); if (db.innerHTML !== D) { db.innerHTML = D; if (D && had) { db.style.animation = "none"; void db.offsetWidth; db.style.animation = ""; } }
    q(".gd-co").innerHTML = coHTML(); if (beatChanged) animateWords(q(".gd-co-t"));
    q(".gd-ctl").innerHTML = ctlHTML();
    if (s.after) s.after(cv, st, T);
    placeT.push(setTimeout(aim, 0)); foot(); schedule();
  };
  const foot = () => {
    const s = scene();
    seen.add(sc); store.set("node-guide-seen-steps", [...seen]); store.set("node-guide-at", sc);
    el.querySelector(".gd-bar i").style.width = `${((sc + (bt + 1) / s.beats.length) / S.length) * 100}%`;
    el.querySelector(".gd-cnt").innerHTML = `<b>${String(sc + 1).padStart(2, "0")}</b> / ${S.length}`;
    el.querySelectorAll(".gd-dots button").forEach((b, i) => { b.classList.toggle("on", i === sc); b.classList.toggle("seen", seen.has(i) && i !== sc); });
    el.querySelectorAll(".gd-ch button").forEach((b, i) => { b.classList.toggle("on", i === s.ch); b.classList.toggle("done", S.every((x, k) => x.ch !== i || seen.has(k))); });
    el.querySelector("[data-gp]").disabled = sc === 0 && bt === 0;
    const last = bt === s.beats.length - 1;
    el.querySelector("[data-gn] .t").textContent = !last ? "Next" : sc < S.length - 1 ? `Next: ${S[sc + 1].t}` : "Start reading";
    const g = el.querySelector(".gd-go");
    if (s.go) { g.hidden = false; g.href = "#/" + s.go[0]; g.innerHTML = `<span class="ms">open_in_new</span><span class="t">${esc(s.go[1])}</span>`; } else g.hidden = true;
  };
  /* autoplay: wait long enough to read, then move on */
  const schedule = () => {
    if (!playing) return;
    const txt = (beat().say || "").replace(/<[^>]+>/g, ""), dur = Math.max(3800, Math.min(12000, 1600 + txt.length * 48));
    const pb = q(".gd-play"); if (pb) pb.style.setProperty("--dur", dur + "ms");
    T.push(setTimeout(() => { if (playing) next(true); }, dur));
  };
  const enter = (i, b = 0, dir = 0) => {
    const prevCh = scene() ? scene().ch : undefined;
    sc = Math.max(0, Math.min(S.length - 1, i)); const s = scene(); bt = Math.max(0, Math.min(s.beats.length - 1, b)); st = s.init ? s.init() : {}; noDet = false; mini = false;
    for (let k = 0; k <= bt; k++) s.beats[k].set && s.beats[k].set(st);
    draw(dir);
    if (dir > 0 && prevCh !== undefined && prevCh !== s.ch && prevCh > 0) { const cv = q(".gd-canvas"); if (cv) { const bd = document.createElement("div"); bd.className = "gd-badge"; bd.innerHTML = `<span class="ms">task_alt</span>Chapter complete: ${esc(CH[prevCh][0])}`; cv.appendChild(bd); setTimeout(() => bd.remove(), 2700); } }
  };
  /* stepping forward keeps whatever the reader changed; jumping (or going back) replays the beats up to the target */
  const setBeat = (b) => { const s = scene(); b = Math.max(0, Math.min(s.beats.length - 1, b)); noDet = false; if (b === bt + 1) s.beats[b].set && s.beats[b].set(st); else { st = s.init ? s.init() : {}; for (let k = 0; k <= b; k++) s.beats[k].set && s.beats[k].set(st); } bt = b; redraw(true); };
  const next = (auto) => { if (auto !== true) stopPlay(false); if (bt < scene().beats.length - 1) setBeat(bt + 1); else if (sc < S.length - 1) enter(sc + 1, 0, 1); else { stopPlay(false); close(); location.hash = "#/" + (scene().go || ["cover"])[0]; } };
  const prev = () => { stopPlay(false); if (bt > 0) setBeat(bt - 1); else if (sc > 0) { const p = sc - 1; enter(p, S[p].beats.length - 1, -1); } };
  const stopPlay = (render = true) => { if (!playing) return; playing = false; T.forEach(clearInterval); T = []; if (render) { const c = q(".gd-ctl"); if (c) c.innerHTML = ctlHTML(); } };
  const togglePlay = () => { if (playing) return stopPlay(); playing = true; const c = q(".gd-ctl"); if (c) c.innerHTML = ctlHTML(); schedule(); };
  const open = (i) => { el.classList.add("on"); document.documentElement.style.overflow = "hidden"; enter(typeof i === "number" ? i : sc, 0); store.set("node-guide-seen", true); document.querySelector(".gd-toast")?.remove(); setTimeout(() => el.querySelector("[data-gn]").focus(), 50); };
  const close = () => { el.classList.remove("on"); document.documentElement.style.overflow = ""; playing = false; clearT(); };
  window.NODE_GUIDE = { open, close, scenes: S.length, beats: S.reduce((a, s) => a + s.beats.length, 0) };

  el.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-gx]")) return close();
    if (t.closest("[data-gp]")) return prev();
    if (t.closest("[data-gn]") || t.closest("[data-gbn]")) return next();
    if (t.closest("[data-gskip]")) { stopPlay(false); return sc < S.length - 1 ? enter(sc + 1, 0, 1) : null; }
    if (t.closest("[data-gbp]")) { stopPlay(false); return bt > 0 ? setBeat(bt - 1) : prev(); }
    if (t.closest("[data-play]")) return togglePlay();
    if (t.closest("[data-comin]") || t.closest(".gd-co.mini")) { mini = !mini; q(".gd-co").innerHTML = coHTML(); place(); return; }
    if (t.closest("[data-dx]")) { noDet = true; q(".gd-canvas").classList.remove("drawer-on"); placeT.push(setTimeout(place, 480)); return; }
    const b = t.closest("[data-gb]"); if (b) { stopPlay(false); return setBeat(+b.dataset.gb); }
    const d = t.closest("[data-gi]"); if (d) { stopPlay(false); return enter(+d.dataset.gi, 0, +d.dataset.gi > sc ? 1 : -1); }
    const c = t.closest("[data-gch]"); if (c) { stopPlay(false); const i = S.findIndex((s) => s.ch === +c.dataset.gch); return enter(i, 0, i > sc ? 1 : -1); }
    if (t.closest(".gd-go")) return close();
    const s = scene();
    if (s.click && t.closest(".gd-cam, .gd-drawer")) { stopPlay(); noDet = false; if (s.click(st, t)) redraw(false); }
  });
  el.addEventListener("change", (e) => { const s = scene(); if (s.change && s.change(st, e.target)) { stopPlay(); redraw(false); } });
  el.addEventListener("click", (e) => { if (e.target.matches && e.target.matches("[data-cr], [data-sit]")) e.preventDefault(); }, true);
  el.addEventListener("keydown", (e) => { const n = e.target.closest && e.target.closest("[data-n]"); if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.stopPropagation(); n.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
  document.addEventListener("keydown", (e) => {
    if (el.classList.contains("on")) {
      if (e.target.closest && e.target.closest("select, input[type=text]")) return;
      const k = e.key, onBtn = e.target.closest && e.target.closest("button, [data-n], label");
      if (["ArrowRight", "ArrowLeft", "Escape", "Home", "End", "PageDown", "PageUp"].includes(k) || (k === " " && !onBtn)) { e.preventDefault(); e.stopImmediatePropagation(); }
      if (k === "ArrowRight" || k === "PageDown") next(); else if (k === "ArrowLeft" || k === "PageUp") prev();
      else if (k === "Home") enter(0); else if (k === "End") enter(S.length - 1); else if (k === "Escape") close();
      else if (k === " " && !onBtn) togglePlay();
      return;
    }
    if ((e.key === "g" || e.key === "G") && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"))) { e.preventDefault(); open(); }
  }, true);
  addEventListener("resize", () => { if (el.classList.contains("on")) placeT.push(setTimeout(aim, 150)); });
  let tx = null;
  body.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  body.addEventListener("touchend", (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 70 && !e.target.closest(".fm-wrap, .gd-raci, .gd-kitx, pre, .gd-drawer")) dx < 0 ? next() : prev(); }, { passive: true });
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-guide]"); if (b) { e.preventDefault(); open(b.dataset.guide === "" ? undefined : +b.dataset.guide); } });

  if (!store.get("node-guide-seen", false)) {
    setTimeout(() => {
      if (el.classList.contains("on")) return;
      const t = document.createElement("div");
      t.className = "gd-toast";
      t.innerHTML = `<span class="ms">school</span><span><b>New to the book?</b><span class="t">An interactive guide walks you through it, step by step.</span></span><button data-guide="0">Start</button><button class="x" aria-label="Dismiss"><span class="ms">close</span></button>`;
      t.querySelector(".x").addEventListener("click", () => { t.remove(); store.set("node-guide-seen", true); });
      document.body.appendChild(t);
    }, 1200);
  }
})();
