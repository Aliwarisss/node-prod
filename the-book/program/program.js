/* Node program overview — the 30-day roadmap for enrollment.
 * Uses the book's real model and generators (window.NODE_API, loaded headless), so Act I shows its
 * actual content and counts; acts that aren't authored yet appear as a locked outline. */
(() => {
  "use strict";
  const API = window.NODE_API, M = window.NODE_MODEL, SYS = M.system;
  if (!API) { document.body.insertAdjacentHTML("afterbegin", '<p style="padding:20px">Could not load the program model.</p>'); return; }
  const { UNITS, STAGES, PLEVEL, promptText, actKit, kids, stepsIn, cmdName, outOf, roleOfUnit } = API;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const title = (k) => k.charAt(0) + k.slice(1).toLowerCase();
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const isOpen = (s) => s.status && s.status !== "placeholder";
  const ACT1 = STAGES.find(isOpen);
  let scale = "team";
  const TRACK = Object.fromEntries(SYS.tracks.flatMap((t) => t.acts.map((a) => [a, t])));
  const unitsOf = (s) => Object.values(UNITS).filter((u) => u.si === s.si);
  const inside = (u, fid) => fid === u.fid || fid.startsWith(u.fid + ".");
  const kit = () => actKit(ACT1, scale);
  const purposeOf = (u) => (u.wf && u.wf.definition) || (u.contract && u.contract.definition && u.contract.definition.purpose) || u.purpose || u.summary || "";
  const copy = (text, btn) => { const done = () => { const o = btn.innerHTML; btn.innerHTML = "Copied ✓"; setTimeout(() => (btn.innerHTML = o), 1400); }; try { navigator.clipboard.writeText(text).then(done, done); } catch { done(); } };

  /* ---- the month: days per act ---- */
  const PLAN = [["kickoff", 0, 0], ["discover", 1, 5], ["plan", 6, 8], ["design", 9, 11], ["build", 12, 15], ["verify", 16, 18], ["release", 19, 21], ["operate", 22, 24], ["evolve", 25, 27], ["capstone", 28, 30]];
  const stationOf = (d) => PLAN.find(([, a, b]) => d >= a && d <= b);
  const procsOnDay = (s, d) => { const [, a, b] = PLAN.find((p) => p[0] === s.id), n = b - a + 1, ps = s.processes, per = Math.ceil(ps.length / n), i = d - a; return ps.slice(i * per, i * per + per); };
  const weekOf = (d) => (d === 0 ? 0 : Math.min(4, Math.ceil(d / 7)));

  /* ---- stats ---- */
  const act1Units = unitsOf(ACT1), totalProcs = STAGES.reduce((a, s) => a + s.processes.length, 0);
  $("#stats").innerHTML = [[STAGES.length, "Acts"], [totalProcs, "Processes"], [act1Units.length, "Prompts in Act I"], [kit().length, "Kit files in Act I"]].map(([n, l]) => `<div><b data-count="${n}">0</b><span>${l}</span></div>`).join("");
  const countUp = () => document.querySelectorAll("[data-count]").forEach((el) => { const n = +el.dataset.count, t0 = performance.now(); const tick = (t) => { const p = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });

  /* ---- hero console: real step prompts, typed ---- */
  const demoSteps = ["discover.frame.hypothesise.write-hypotheses.s1", "discover.validate.demand.experiment.s2", "discover.continuous.s4"].map((f) => UNITS[f]).filter(Boolean);
  const con = $("#console"), conFoot = $("#consoleFoot");
  let demoI = 0, typing = null;
  const runDemo = () => {
    const s = demoSteps[demoI % demoSteps.length]; demoI++;
    $("#consoleTitle").textContent = `example session · ${s.parent.num} ${s.num} · ${s.title.toLowerCase()}`;
    conFoot.innerHTML = [`Owner: ${s.actor}`, `Command: ${cmdName(s)}`, s.out ? `Output: ${s.out}` : "Decision brief"].map((x) => `<span>${esc(x)}</span>`).join("");
    const body = promptText(s, scale).split("\n").slice(0, 26).join("\n");
    const lines = [{ t: `you › /${cmdName(s)} "order-intake automation"`, c: "you" }, { t: "", c: "" }, ...body.split("\n").map((t) => ({ t, c: /^#/.test(t) ? "h" : "" }))];
    let li = 0, ci = 0, html = "";
    clearInterval(typing);
    typing = setInterval(() => {
      if (li >= lines.length) { clearInterval(typing); con.innerHTML = html + `\n<span class="ok">agent › Drafted. Waiting for your review before the next step.</span>\n<span class="cur"></span>`; setTimeout(runDemo, 5200); return; }
      const L = lines[li]; ci += L.c === "you" ? 2 : 9;
      const part = L.t.slice(0, ci);
      con.innerHTML = html + (L.c ? `<span class="${L.c}">${esc(part)}</span>` : esc(part)) + '<span class="cur"></span>';
      con.scrollTop = con.scrollHeight;
      if (ci >= L.t.length) { html += (L.c ? `<span class="${L.c}">${esc(L.t)}</span>` : esc(L.t)) + "\n"; li++; ci = 0; }
    }, 16);
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { const s = demoSteps[0]; con.textContent = promptText(s, scale); } else runDemo();

  /* ---- transit map ---- */
  const W = 1200, X = (d) => 112 + (d * (W - 172)) / 30, Y = { discovery: 140, delivery: 250, run: 360 };
  const COL = { discovery: "#6d48d8", delivery: "#008080", run: "#c49000" };
  let day = 1, riding = null;
  const svgT = (x, y, t, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 11}" font-weight="${o.w || 700}" fill="${o.f || "#1c1b1b"}" ${o.mono ? 'font-family="Geist Mono, monospace" letter-spacing="1.2"' : 'font-family="Geist, sans-serif"'} ${o.cls ? `class="${o.cls}"` : ""}>${esc(t)}</text>`;
  function drawMetro() {
    const st = stationOf(day);
    let h = `<defs>${Object.entries(COL).map(([k, c]) => `<pattern id="hatch-${k}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff"/><line x1="0" y1="0" x2="0" y2="8" stroke="${c}" stroke-opacity=".16" stroke-width="3"/></pattern>`).join("")}</defs>`;
    // week bands
    [[0, 0, "KICK-OFF"], [1, 7, "WEEK 1"], [8, 14, "WEEK 2"], [15, 21, "WEEK 3"], [22, 30, "WEEK 4"]].forEach(([a, b, l], i) => {
      const x1 = X(a) - (a === 0 ? 22 : 18), x2 = X(b) + (b === 0 ? 22 : 18);
      h += `<rect x="${x1}" y="52" width="${x2 - x1}" height="352" rx="14" fill="${i % 2 ? "#f6f4f3" : "#fbfaf9"}"/>${svgT((x1 + x2) / 2, 40, l, { s: 10, mono: true, f: "#8a8e8f" })}`;
    });
    // lines
    const line = (d, c, dash) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" ${dash ? 'stroke-dasharray="2 14" stroke-opacity=".75"' : ""}/>`;
    h += line(`M${X(0)},${Y.discovery} L${X(11.3)},${Y.discovery}`, COL.discovery);
    h += line(`M${X(11.3)},${Y.discovery} L${X(27.8)},${Y.discovery} C${X(28.6)},${Y.discovery} ${X(28.6)},${Y.delivery} ${X(29)},${Y.delivery}`, COL.discovery, true);
    h += line(`M${X(11.3)},${Y.discovery} C${X(11.8)},${Y.discovery} ${X(11.4)},${Y.delivery} ${X(12)},${Y.delivery} L${X(21.4)},${Y.delivery}`, COL.delivery);
    h += line(`M${X(21.4)},${Y.delivery} C${X(21.9)},${Y.delivery} ${X(21.5)},${Y.run} ${X(22)},${Y.run} L${X(27.6)},${Y.run} C${X(28.4)},${Y.run} ${X(28.4)},${Y.delivery} ${X(29)},${Y.delivery}`, COL.run);
    h += `<path d="M${X(25.6)},${Y.run - 20} C${X(25.6)},${Y.discovery + 60} ${X(26.4)},${Y.discovery + 40} ${X(26.4)},${Y.discovery + 12}" fill="none" stroke="${COL.run}" stroke-width="2" stroke-dasharray="5 5"/>${svgT(X(26.4) + 8, Y.discovery + 34, "signals", { s: 10, a: "start", f: COL.run, mono: true })}`;
    h += svgT(X(19.5), Y.discovery - 26, "FEATURE MODE · DISCOVERY KEEPS RUNNING EVERY WEEK", { s: 9.5, mono: true, f: COL.discovery });
    // interchanges
    // where = "below" (default) or "left": gate labels sit beside the diamond so they don't hit station labels
    const ix = (d, y, label, kind, where) => { const x = X(d); return `${kind === "gate" ? `<path d="M${x},${y - 11} L${x + 11},${y} L${x},${y + 11} L${x - 11},${y} Z" fill="#0d1117"/>` : `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="5" fill="#fff" stroke="#0d1117" stroke-width="2"/><rect x="${x - 6}" y="${y - 3}" width="12" height="2" fill="#0d1117"/><rect x="${x - 6}" y="${y + 2}" width="12" height="2" fill="#0d1117"/>`}${where === "left" ? svgT(x - 17, y + 4, label, { s: 9.5, mono: true, f: "#0d1117", a: "end" }) : svgT(x, y + (kind === "gate" ? 34 : 26), label, { s: 9.5, mono: true, f: "#0d1117" })}`; };
    h += `<line x1="${X(5.5)}" x2="${X(5.5)}" y1="${Y.discovery}" y2="${Y.discovery + 46}" stroke="#0d1117" stroke-width="1.5" stroke-dasharray="3 3"/>` + ix(5.5, Y.discovery + 56, "PORTFOLIO", "bl");
    h += `<line x1="${X(8.5)}" x2="${X(8.5)}" y1="${Y.discovery}" y2="${Y.discovery + 46}" stroke="#0d1117" stroke-width="1.5" stroke-dasharray="3 3"/>` + ix(8.5, Y.discovery + 56, "PRODUCT", "bl");
    h += ix(11.55, (Y.discovery + Y.delivery) / 2, "READY", "gate", "left") + ix(18.5, Y.delivery, "DONE", "gate") + ix(21.65, (Y.delivery + Y.run) / 2, "LIVE", "gate", "left");
    // track labels
    SYS.tracks.forEach((t) => (h += svgT(18, Y[t.id] + 4, t.name.split(" ")[0].toUpperCase(), { s: 9.5, mono: true, a: "start", f: COL[t.id] })));
    // stations
    PLAN.forEach(([id, a, b]) => {
      const on = st && st[0] === id;
      if (id === "kickoff") { h += `<g class="st ${on ? "on" : ""}" data-day="0" tabindex="0" role="button" aria-label="Day 0 kick-off"><circle class="pill" cx="${X(0)}" cy="${Y.discovery}" r="19" fill="#fff" stroke="#0d1117" stroke-width="${on ? 4 : 3}"/><text x="${X(0)}" y="${Y.discovery + 6}" text-anchor="middle" font-family="Material Symbols Outlined" font-size="18" fill="#0d1117">flag</text>${svgT(X(0), Y.discovery + 40, "KICK-OFF", { s: 9.5, mono: true })}</g>`; return; }
      if (id === "capstone") { h += `<g class="st ${on ? "on" : ""}" data-day="28" tabindex="0" role="button" aria-label="Capstone, days 28 to 30"><circle class="pill" cx="${X(29)}" cy="${Y.delivery}" r="34" fill="#e91e63" stroke="#0d1117" stroke-width="${on ? 4 : 0}"/><text x="${X(29)}" y="${Y.delivery - 2}" text-anchor="middle" font-family="Material Symbols Outlined" font-size="22" fill="#fff">workspace_premium</text>${svgT(X(29), Y.delivery + 15, "CAPSTONE", { s: 8.5, mono: true, f: "#fff" })}${svgT(X(29), Y.delivery + 54, "DAYS 28–30", { s: 9, mono: true, f: "#8a8e8f" })}</g>`; return; }
      const s = STAGES.find((x) => x.id === id), T = TRACK[id], y = Y[T.id], c = COL[T.id], open = isOpen(s), x1 = X(a) - 16, x2 = X(b) + 16;
      h += `<g class="st ${on ? "on" : ""}" data-day="${a}" tabindex="0" role="button" aria-label="${esc(s.key)}, days ${a} to ${b}${open ? "" : ", locked"}">
        <rect class="pill" x="${x1}" y="${y - 21}" width="${x2 - x1}" height="42" rx="21" fill="${open ? c : `url(#hatch-${T.id})`}" stroke="${on ? "#0d1117" : c}" stroke-width="${on ? 3.5 : 2.5}"/>
        ${svgT((x1 + x2) / 2 + (open ? 0 : 8), y + 4, s.key, { s: 12, w: 800, f: open ? "#fff" : "#1c1b1b" })}
        ${open ? "" : `<text x="${x1 + 17}" y="${y + 6}" text-anchor="middle" font-family="Material Symbols Outlined" font-size="15" fill="${c}">lock</text>`}
        ${svgT((x1 + x2) / 2, y - 30, `${ROMAN[s.si]} · D${a}–${b}${open ? " · OPEN" : ""}`, { s: 9, mono: true, f: open ? c : "#8a8e8f" })}</g>`;
    });
    // day axis and the runner
    for (let d = 0; d <= 30; d++) h += `<circle cx="${X(d)}" cy="418" r="${d === day ? 5 : 2}" fill="${d === day ? "#e91e63" : "#c4c7c7"}"/>${d % 5 === 0 ? svgT(X(d), 436, String(d), { s: 9, mono: true, f: "#8a8e8f" }) : ""}`;
    const ry = st ? (st[0] === "kickoff" ? Y.discovery : st[0] === "capstone" ? Y.delivery : Y[TRACK[st[0]].id]) : Y.delivery;
    h += `<line x1="${X(day)}" x2="${X(day)}" y1="60" y2="410" stroke="#e91e63" stroke-width="1.5" stroke-dasharray="4 4"/><g class="runner" style="transform:translate(${X(day)}px,${ry}px)"><circle r="9" fill="#e91e63" stroke="#fff" stroke-width="3"/></g>`;
    $("#metro").innerHTML = h;
    $("#day").value = day;
    $("#dayLbl").innerHTML = `Day ${day}<small>${day === 0 ? "KICK-OFF" : `WEEK ${weekOf(day)}`}</small>`;
    drawToday();
  }
  function drawToday() {
    const st = stationOf(day), el = $("#today");
    if (st[0] === "kickoff") {
      el.innerHTML = `<div class="today-side"><span class="tag" style="background:#0d1117">Day 0 · open</span><h3>Kick-off</h3><p>Choose the real project you'll build this month and set up how you'll work: you drive, your agents help.</p></div>
        <div class="today-main">${[["Get access to an AI model", "Set up Claude (or another capable agent) — free to start, Pro or Max for the flagship models and Claude Code.", "#get"], ["Working with agents", "Who decides, what agents do, the five prompt levels and the ground rules.", "../sdlc/index.html#/agents"], ["Choose your project", "Your own idea, a work or client brief, or a Node starter project — you'll take it through every act.", "#project"], ["Pick your scale", "Solo, product team, enterprise or platform — the kit adapts.", "#scales"], ["Install your kit", "AGENTS.md, skills, commands, workflows, subagents, guardrails and rubrics in one folder.", "#toolkit"]].map(([t, d, href], i) => `<div class="proc"><span class="n">0.${i + 1}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div><a class="go" href="${href}">Open<span class="ms" style="font-size:15px">arrow_forward</span></a></div>`).join("")}</div>`;
      return;
    }
    if (st[0] === "capstone") {
      el.innerHTML = `<div class="today-side"><span class="tag" style="background:#e91e63">Days 28–30</span><h3>Capstone</h3><p>Ship your project end to end with your kit, at your scale — present the evidence and earn your certificate.</p></div>
        <div class="today-main">${["Finish your project end to end with your agent kit", "Present the decision, the evidence and what you learned", "Earn your certificate and publish your portfolio"].map((t, i) => `<div class="proc locked"><span class="n">C${i + 1}</span><div><b>${esc(t)}</b><span class="skel"><i></i><i></i></span></div><a class="lockchip" href="/register"><span class="ms">lock</span>Enroll</a></div>`).join("")}</div>`;
      return;
    }
    const s = STAGES.find((x) => x.id === st[0]), T = TRACK[s.id], open = isOpen(s), procs = procsOnDay(s, day), files = open ? kit() : [];
    el.innerHTML = `<div class="today-side"><span class="tag" style="background:${COL[T.id]}">${esc(T.name)} · ${open ? "open" : "locked"}</span><h3>Act ${ROMAN[s.si]} · ${esc(s.key)}</h3><p>${esc(s.purpose)}</p><p style="font:700 11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--faint)">Day ${day - st[1] + 1} of ${st[2] - st[1] + 1} · Gate: ${esc(s.gate)}</p></div>
      <div class="today-main">${procs.map((p) => {
        if (!open) return `<div class="proc locked"><span class="n">${s.si + 1}.${s.processes.indexOf(p) + 1}</span><div><b>${esc(p.title)}</b><span>${esc(p.summary || "")}</span><span class="skel"><i></i><i></i></span></div><a class="lockchip" href="/register"><span class="ms">lock</span>Unlock</a></div>`;
        const st2 = stepsIn(p), ws = st2.map((x) => x.parent).filter((v, i, a) => a.indexOf(v) === i), nf = files.filter((f) => f.units.some((fid) => inside(p, fid))).length;
        return `<div class="proc"><span class="n">${esc(p.num)}</span><div><b>${esc(p.title)}</b><span>${esc(p.summary || purposeOf(p))}</span><span class="meta"><em>${kids(p).length} subprocesses</em><em>${ws.length} workflows</em><em>${st2.length} steps</em><em>${nf} kit files</em><em>Gate: ${esc(p.gate)}</em></span></div><a class="go" href="../sdlc/index.html#/u-${p.fid}">Open<span class="ms" style="font-size:15px">arrow_forward</span></a></div>`;
      }).join("")}${open && day === st[2] && s.continuous ? `<div class="proc"><span class="n">${esc(s.continuous.num)}</span><div><b>${esc(s.continuous.title)}</b><span>${esc(s.continuous.summary)}</span><span class="meta"><em>Runs weekly from here on</em><em>${s.continuous.steps.length} steps</em></span></div><a class="go" href="../sdlc/index.html#/u-${s.continuous.fid}">Open<span class="ms" style="font-size:15px">arrow_forward</span></a></div>` : ""}</div>`;
  }
  $("#day").addEventListener("input", (e) => { day = +e.target.value; stopRide(); drawMetro(); });
  $("#metro").addEventListener("click", (e) => { const g = e.target.closest(".st"); if (g) { day = +g.dataset.day; stopRide(); drawMetro(); } });
  $("#metro").addEventListener("keydown", (e) => { const g = e.target.closest(".st"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); day = +g.dataset.day; drawMetro(); } });
  const stopRide = () => { if (riding) { clearInterval(riding); riding = null; $("#ride").innerHTML = '<span class="ms">play_arrow</span><span>Ride the line</span>'; } };
  $("#ride").addEventListener("click", () => {
    if (riding) return stopRide();
    if (day >= 30) day = 0;
    $("#ride").innerHTML = '<span class="ms">pause</span><span>Pause</span>';
    riding = setInterval(() => { day++; drawMetro(); if (day >= 30) stopRide(); }, 900);
  });
  drawMetro();

  /* ---- preview explorer: real Act I, all the way down ---- */
  const KTABS = [["prompt", "Prompt"], ["commands", "Command"], ["workflows", "Workflow"], ["skills", "Skills"], ["agents", "Subagents"], ["rubrics", "Rubrics"], ["context", "AGENTS.md"]];
  let path = ["discover", "discover.frame", "discover.frame.hypothesise", "discover.frame.hypothesise.write-hypotheses", "discover.frame.hypothesise.write-hypotheses.s1"].map((f) => UNITS[f]).filter(Boolean);
  let ktab = "prompt", kfile = 0;
  const kidsOf = (u) => (u.kind === "step" ? [] : u.steps ? u.steps : [...kids(u), ...(u.level === 0 && u.continuous ? [u.continuous] : [])]);
  function drawMiller() {
    const cols = [[ACT1], ...path.map(kidsOf)].filter((c) => c.length).slice(0, 5);
    $("#miller").innerHTML = cols.map((c, ci) => `<div class="col"><h4>${ci === 0 ? "Act" : esc(PLEVEL[c[0].kind] + (c.length > 1 ? (c[0].kind === "process" ? "es" : "s") : ""))} · ${c.length}</h4>${c.map((u) => `<button data-u="${u.fid}" data-ci="${ci}" class="${u.decision ? "dec" : ""}" ${path[ci] === u ? 'aria-current="true"' : ""}><small>${esc(u.kind === "stage" ? ROMAN[u.si] : u.num)}</small><span>${esc(u.kind === "stage" ? u.key : u.short || u.title)}${u.decision ? " ◆" : ""}</span>${kidsOf(u).length ? '<span class="ms">chevron_right</span>' : ""}</button>`).join("")}</div>`).join("");
    drawUnit();
  }
  function filesFor(u, layer) {
    const all = kit();
    if (layer === "context") return all.filter((f) => f.path === "AGENTS.md");
    if (layer === "commands") return all.filter((f) => f.layer === "commands" && f.units.includes(u.fid));
    if (layer === "workflows") { const w = u.kind === "step" ? u.parent : u; return all.filter((f) => f.layer === "workflows" && f.units.includes(w.fid)); }
    return all.filter((f) => f.layer === layer && f.units.some((fid) => inside(u, fid)));
  }
  function drawUnit() {
    const u = path[path.length - 1];
    const outs = outOf(u);
    $("#unitInfo").innerHTML = `<span class="lbl">${esc(u.kind === "stage" ? "Act " + ROMAN[u.si] : PLEVEL[u.kind] + " " + u.num)}${u.decision ? " · decision" : ""}</span><h3>${esc(u.kind === "stage" ? title(u.key) : u.title)}</h3><p>${esc(purposeOf(u))}</p>
      <dl><div><dt>Who drives it</dt><dd>${esc(roleOfUnit(u))}</dd></div>${u.gate ? `<div><dt>Gate</dt><dd>${esc(u.gate)}</dd></div>` : ""}${outs.length ? `<div><dt>Produces</dt><dd>${esc(outs.slice(0, 5).join(", "))}${outs.length > 5 ? "…" : ""}</dd></div>` : ""}</dl>
      <a class="btn ghost" style="margin-top:8px;padding:10px 16px;font-size:11px;justify-self:start" href="../sdlc/index.html#/${u.kind === "stage" ? "act-" + u.id : u.kind === "step" ? "u-" + u.parent.fid : "u-" + u.fid}">Open in the book<span class="ms" style="font-size:16px">arrow_outward</span></a>`;
    $("#ktabs").innerHTML = KTABS.map(([k, n]) => { const c = k === "prompt" ? 1 : filesFor(u, k).length; return `<button role="tab" aria-selected="${k === ktab}" data-kt="${k}" ${c ? "" : 'disabled style="opacity:.35"'}>${n}${k === "prompt" ? "" : ` · ${c}`}</button>`; }).join("");
    let text, label, chips = "";
    if (ktab === "prompt") { text = promptText(u, scale); label = `Prompt · ${PLEVEL[u.kind]}${u.kind === "step" ? "" : " · end to end"}`; }
    else { const fs = filesFor(u, ktab); if (!fs.length) { ktab = "prompt"; return drawUnit(); } const f = fs[Math.min(kfile, fs.length - 1)]; text = f.body; label = f.path; if (fs.length > 1) chips = `<div class="ktabs" style="border:0;padding-top:4px">${fs.slice(0, 14).map((x, i) => `<button data-kf="${i}" aria-selected="${x === f}">${esc(x.path.split("/").slice(-1)[0] === "SKILL.md" ? x.path.split("/")[1] : x.path.split("/").pop().replace(/\.md$/, ""))}</button>`).join("")}${fs.length > 14 ? `<button disabled style="opacity:.5">+${fs.length - 14}</button>` : ""}</div>`; }
    $("#kview").innerHTML = `${chips}<div class="path"><span class="ms" style="font-size:16px">description</span>${esc(label)}<button data-copy>Copy</button></div><pre>${esc(text)}</pre>`;
    $("#kview").querySelector("[data-copy]").onclick = (e) => copy(text, e.currentTarget);
  }
  $("#miller").addEventListener("click", (e) => { const b = e.target.closest("[data-u]"); if (!b) return; const ci = +b.dataset.ci, u = UNITS[b.dataset.u]; path = [...path.slice(0, ci), u]; kfile = 0; drawMiller(); });
  $("#ktabs").addEventListener("click", (e) => { const b = e.target.closest("[data-kt]"); if (b && !b.disabled) { ktab = b.dataset.kt; kfile = 0; drawUnit(); } });
  $("#kview").addEventListener("click", (e) => { const b = e.target.closest("[data-kf]"); if (b) { kfile = +b.dataset.kf; drawUnit(); } });
  drawMiller();

  /* ---- toolkit: ten layers with real Act I counts ---- */
  const L = SYS.agentWork.layers, files = () => kit();
  const layerFiles = (id) => (id === "memory" ? files().filter((f) => f.layer === "memory" || f.layer === "templates") : id === "prompt" ? [] : files().filter((f) => f.layer === id));
  const EXAMPLE = { context: "AGENTS.md", skills: "skills/five-whys/SKILL.md", commands: null, workflows: null, agents: "agents/privacy-reviewer.md", tools: "TOOLS.md", guardrails: "GUARDRAILS.md", rubrics: "rubrics/hypothesis-list.md", memory: "TRACE.md" };
  let layer = "skills";
  function drawDeck() {
    $("#cards").innerHTML = L.map((l) => { const n = l.id === "prompt" ? act1Units.length : layerFiles(l.id).length; return `<button class="card" data-layer="${l.id}" aria-pressed="${l.id === layer}"><span class="ms">${l.icon}</span><b>${esc(l.name)}</b><code>${esc(l.file)}</code><span class="count">${n}<small>${l.id === "memory" ? "files + templates" : n === 1 ? "file" : l.id === "prompt" ? "prompts" : "files"}</small></span></button>`; }).join("");
    const l = L.find((x) => x.id === layer), fs = layerFiles(layer);
    const f = layer === "prompt" ? null : fs.find((x) => x.path === EXAMPLE[layer]) || fs.find((x) => /write-hypotheses|hypotheses/.test(x.path)) || fs[0];
    const text = layer === "prompt" ? promptText(UNITS["discover.frame.hypothesise.write-hypotheses"], scale) : f ? f.body : "";
    $("#viewer").innerHTML = `<div class="viewer-head"><span class="lbl">${esc(l.file)}</span><h3>${esc(l.name)}</h3><p>${esc(l.what)}<em>Use it when: ${esc(l.when)}</em></p></div><div class="kview"><div class="path"><span class="ms" style="font-size:16px">description</span>${esc(f ? f.path : "Workflow prompt · Write and Rank Hypotheses")}<button data-copy>Copy</button></div><pre>${esc(text)}</pre></div>`;
    $("#viewer [data-copy]").onclick = (e) => copy(text, e.currentTarget);
  }
  $("#cards").addEventListener("click", (e) => { const b = e.target.closest("[data-layer]"); if (b) { layer = b.dataset.layer; drawDeck(); } });
  drawDeck();

  /* ---- how it works ---- */
  $("#how").innerHTML = SYS.agentWork.split.map(([w, d]) => `<div><b>${esc(w)}</b><p>${esc(d)}</p></div>`).join("");
  $("#levels").innerHTML = SYS.agentWork.levels.map(([l, d], i) => `<div><i>0${i + 1}</i><b>${esc(l)} prompt</b><span>${esc(d)}</span></div>`).join("");

  /* ---- scales ---- */
  function drawScales() {
    const s = SYS.scales.find((x) => x.id === scale);
    $("#scalePicks").innerHTML = SYS.scales.map((x) => `<button data-scale="${x.id}" aria-pressed="${x.id === scale}"><span class="ms">${x.icon}</span><span><b>${esc(x.name)}</b><span>${esc(x.examples)}</span></span></button>`).join("");
    $("#scaleView").innerHTML = `<div class="grid2">${[["Who", s.who], ["Backlogs", s.backlogs], ["Gates", s.gates], ["Cadence", s.cadence], ["How people use agents", s.agents], ["What agents may touch", s.perms]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</div>
      <div class="scale-line"><b>## ${esc(s.prompt.split(". ")[0])}.</b> ${esc(s.prompt.split(". ").slice(1).join(". "))}</div>
      <p style="font-size:13px;color:var(--muted)">This line goes into AGENTS.md and every prompt in the kit. Watch out for: ${esc(s.risks.join("; "))}.</p>`;
  }
  $("#scalePicks").addEventListener("click", (e) => { const b = e.target.closest("[data-scale]"); if (b) { scale = b.dataset.scale; drawScales(); drawUnit(); drawDeck(); } });
  drawScales();

  /* ---- why node: the USPs (shared with the overview in sdlc/offer.js) ---- */
  const OFFER = window.NODE_OFFER || {};
  const WHY = (OFFER.usps || []).map(([ic, t, d], i) => [ic, t, d, ["var(--teal)", "var(--pink)", "var(--violet)"][i % 3]]);
  const COMPARE = [["Pieces of the stack, one tutorial at a time", "The whole lifecycle, idea to evolution"], ["Prompt lists you paste and hope", "Prompts at five levels plus a full agent kit"], ["Agents framed as replacing you", "You decide; agents draft, research and check"], ["One way of working for everyone", "Solo, team, enterprise and platform scales"], ["Theory you have to translate", "Templates, rubrics and artifacts you actually ship"]];
  $("#whyGrid").innerHTML = WHY.map(([ic, t, d, c], i) => `<article class="why-card"><span class="num">0${i + 1}</span><div class="ic" style="background:color-mix(in srgb, ${c} 10%, transparent);color:${c}"><span class="ms">${ic}</span></div><b>${esc(t)}</b><p>${esc(d)}</p></article>`).join("");
  $("#compare").innerHTML = `<div class="head"><span>Typical course</span><span>Node</span></div>${COMPARE.map(([a, b]) => `<div><span><span class="ms">close</span>${esc(a)}</span><span><span class="ms">check</span>${esc(b)}</span></div>`).join("")}`;

  /* ---- roadmap: the full program outline, in order ---- */
  const BOOK = "../sdlc/index.html#/";
  const WEEKS = [["Week 1", "Find the problem", ["kickoff", "discover", "plan"]], ["Week 2", "Shape and build", ["design", "build"]], ["Week 3", "Prove and ship", ["verify", "release"]], ["Week 4", "Run, learn, graduate", ["operate", "evolve", "capstone"]]];
  const daysOf = (id) => { const [, a, b] = PLAN.find((p) => p[0] === id); return a === b ? `Day ${a}` : `Days ${a}–${b}`; };
  const dayOfProc = (s, p) => { const [, a, b] = PLAN.find((x) => x[0] === s.id); for (let d = a; d <= b; d++) if (procsOnDay(s, d).includes(p)) return d; return a; };
  const stop = (c, dayLbl, card) => `<li class="rm-stop" style="--c:${c}"><div class="rm-day"><i></i><small>${dayLbl}</small></div>${card}</li>`;
  const rmAct = (s) => {
    const T = TRACK[s.id], c = COL[T.id], open = isOpen(s);
    const procs = s.processes.map((p) => {
      const d = `D${dayOfProc(s, p)}`;
      if (!open) return `<li><em>${s.si + 1}.${s.processes.indexOf(p) + 1}</em><span><b>${esc(p.title)}</b><span class="sum">${esc(p.summary || "")}</span></span><span class="d">${d} <span class="ms" style="font-size:14px;vertical-align:-3px">lock</span></span></li>`;
      const subs = kids(p).map((sp) => `<li><a href="${BOOK}u-${sp.fid}">${esc(sp.num)} ${esc(sp.title)}</a> <span>· ${sp.workflows.length} workflow${sp.workflows.length > 1 ? "s" : ""}, ${stepsIn(sp).length} steps</span></li>`).join("");
      return `<li><em>${esc(p.num)}</em><details class="rm-x"><summary><b>${esc(p.title)}</b><span class="sum">${esc(p.summary || "")} · gate: ${esc(p.gate)}</span></summary><ul class="rm-subs">${subs}</ul></details><span class="d">${d}</span></li>`;
    }).join("") + (open && s.continuous ? `<li><em>${esc(s.continuous.num)}</em><span><b><a href="${BOOK}u-${s.continuous.fid}">${esc(s.continuous.title)}</a></b><span class="sum">${esc(s.continuous.summary)}</span></span><span class="d">weekly</span></li>` : "");
    const card = `<div class="rm-card ${open ? "open" : "locked"}">
      <div class="rm-head"><span class="rn">${ROMAN[s.si]}</span><h3>${esc(s.key)}<small>${esc(s.tagline || "")}</small></h3>
        <div class="rm-tags"><span class="t">${esc(T.name)}</span><span>${daysOf(s.id)}</span><span>Gate: ${esc(s.gate)}</span>${open ? '<span class="o"><span class="ms">lock_open</span>Open</span>' : '<span class="l"><span class="ms">lock</span>Locked</span>'}</div></div>
      <p class="rm-purpose">${esc(s.purpose)}</p>
      <div class="rm-body"><div><h4>Processes · ${s.processes.length}</h4><ul class="rm-procs">${procs}</ul></div><div><h4>You'll come out with</h4><ul class="rm-outs">${(s.outcomes || []).map((o) => `<li><span class="ms">check_circle</span>${esc(o)}</li>`).join("")}</ul></div></div>
      <div class="rm-foot">${open
        ? `<span><b>${unitsOf(s).length} prompts · ${kit().length} kit files</b> — open now.</span><a href="${BOOK}act-${s.id}"><span class="ms">menu_book</span>Open in the book</a><a href="#preview" style="background:var(--pink)"><span class="ms">travel_explore</span>Explore below</a>`
        : `<span>Subprocesses, workflows, steps, prompts and the full agent kit unlock on enrollment.</span><a class="lk" href="/register"><span class="ms">lock</span>Enroll to unlock</a>`}</div></div>`;
    return stop(c, daysOf(s.id).replace("Days ", "D").replace("Day ", "D"), card);
  };
  const rmSpecial = (id) => {
    if (id === "kickoff") return stop("#0d1117", "D0", `<div class="rm-card open" style="--c:#0d1117"><div class="rm-head"><span class="rn"><span class="ms" style="font-size:30px">flag</span></span><h3>Kick-off<small>Set up how you'll work all month</small></h3><div class="rm-tags"><span>Day 0</span><span class="o"><span class="ms">lock_open</span>Open</span></div></div>
      <div class="rm-body"><div><h4>What you do</h4><ul class="rm-procs"><li><em>0.1</em><span><b><a href="#get">Get access to an AI model</a></b><span class="sum">Claude or another capable agent — free to start; Pro or Max for the flagship models and Claude Code.</span></span></li><li><em>0.2</em><span><b><a href="${BOOK}agents">Working with agents</a></b><span class="sum">Who decides, what agents do, the five prompt levels, ground rules.</span></span></li><li><em>0.3</em><span><b><a href="#project">Choose your project</a></b><span class="sum">The real project you'll take through every act.</span></span></li><li><em>0.4</em><span><b><a href="#scales">Pick your scale</a></b><span class="sum">Solo, product team, enterprise or platform.</span></span></li><li><em>0.5</em><span><b><a href="#toolkit">Install your agent kit</a></b><span class="sum">Context, skills, commands, workflows, subagents, guardrails, rubrics.</span></span></li></ul></div>
      <div><h4>You'll come out with</h4><ul class="rm-outs"><li><span class="ms">check_circle</span>Your project chosen</li><li><span class="ms">check_circle</span>Your AGENTS.md set up</li><li><span class="ms">check_circle</span>Your scale chosen</li><li><span class="ms">check_circle</span>Your agent ready to start DISCOVER</li></ul></div></div></div>`);
    return stop("#e91e63", "D28–30", `<div class="rm-card locked" style="--c:#e91e63"><div class="rm-head"><span class="rn"><span class="ms" style="font-size:30px">workspace_premium</span></span><h3>Capstone<small>Ship and present your project</small></h3><div class="rm-tags"><span>Days 28–30</span><span class="l"><span class="ms">lock</span>Locked</span></div></div>
      <div class="rm-body"><div><h4>What you do</h4><ul class="rm-procs"><li><em>C.1</em><span><b>Finish your project end to end with your kit</b></span></li><li><em>C.2</em><span><b>Present the decision, evidence and learning</b></span></li><li><em>C.3</em><span><b>Earn your certificate and publish your portfolio</b></span></li></ul></div>
      <div><h4>You'll come out with</h4><ul class="rm-outs"><li><span class="ms">check_circle</span>A shipped, evidenced project</li><li><span class="ms">check_circle</span>Your Node certificate</li><li><span class="ms">check_circle</span>Your own reusable agent kit</li></ul></div></div>
      <div class="rm-foot"><span>Unlocks on enrollment.</span><a class="lk" href="/register"><span class="ms">lock</span>Enroll to unlock</a></div></div>`);
  };
  $("#rm").innerHTML = WEEKS.map(([w, t, ids]) => `<li class="rm-week"><b data-n="${w.split(" ")[1]}">${w}</b><span>${t}</span></li>${ids.map((id) => (id === "kickoff" || id === "capstone" ? rmSpecial(id) : rmAct(STAGES.find((x) => x.id === id)))).join("")}`).join("");
  $("#rmToggle").addEventListener("click", (e) => {
    const ds = [...document.querySelectorAll("#rm details.rm-x")], open = !ds.every((d) => d.open);
    ds.forEach((d) => (d.open = open));
    e.currentTarget.innerHTML = `<span class="ms">${open ? "unfold_less" : "unfold_more"}</span><span>${open ? "Collapse Act I" : "Expand Act I"}</span>`;
  });

  /* ---- project-based, how it works, why agents, what you get, career (sdlc/offer.js) ---- */
  if (OFFER.pbl) {
    $("#pblBody").textContent = OFFER.pbl.body;
    $("#pbl").innerHTML = OFFER.pbl.steps.map(([ic, t, d]) => `<li><span class="ic"><span class="ms">${ic}</span></span><b>${esc(t)}</b><span class="d">${esc(d)}</span></li>`).join("");
  }
  $("#hiw").innerHTML = (OFFER.howItWorks || []).map(([ic, t, when, d]) => `<li><span class="ic"><span class="ms">${ic}</span></span><div><b>${esc(t)}</b><p>${esc(d)}</p></div><em>${esc(when)}</em></li>`).join("");
  if (OFFER.agents) {
    $("#agentsBody").textContent = OFFER.agents.body;
    $("#apoints").innerHTML = OFFER.agents.points.map(([ic, t, d]) => `<div><span class="ms">${ic}</span><b>${esc(t)}</b><span class="d">${esc(d)}</span></div>`).join("");
  }
  if (OFFER.devEng) $("#deveng").innerHTML = `<div class="intro"><b>${esc(OFFER.devEng.title)}</b><p>${esc(OFFER.devEng.intro)}</p></div><div class="row hd"><span></span><span>Developer</span><span>Engineer</span></div>${OFFER.devEng.rows.map(([k, d, e]) => `<div class="row"><span>${esc(k)}</span><span>${esc(d)}</span><span>${esc(e)}</span></div>`).join("")}`;
  $("#getGrid").innerHTML = (OFFER.get || []).map(([ic, t, d, plan]) => `<div><span class="ms">${ic}</span><b>${esc(t)}</b><p>${esc(d)}</p><em>${esc(plan)}</em></div>`).join("");
  $("#careerRows").innerHTML = (OFFER.career || []).map(([who, how, lead]) => `<div><span>${esc(who)}</span><span><small>How to use Node</small>${esc(how)}</span><span><span class="ms">trending_up</span><span><small>Where it leads</small>${esc(lead)}</span></span></div>`).join("");

  const CL = OFFER.claude;
  if (CL) $("#claudeBox").innerHTML = `<div><h3>Claude certifications</h3><p class="i">${esc(CL.intro)}</p><ul>${CL.certs.map(([ic, t, d, when, url]) => `<li><span class="ms">${ic}</span><span><b>${esc(t)}</b><span class="d">${esc(d)}</span><em>${esc(when)} · <a href="${url}" target="_blank" rel="noopener">details</a></em></span></li>`).join("")}</ul><small>Claude Academy and the Claude Certification Program are run by Anthropic. Node prepares you; Anthropic issues the certificates and certifications.</small></div>
    <div><h3>Access to the flagship models</h3><p class="i">You set this up on Day 0. Pick the path that fits you.</p><ul>${CL.access.map(([ic, t, d]) => `<li><span class="ms">${ic}</span><span><b>${esc(t)}</b><span class="d">${esc(d)}</span></span></li>`).join("")}</ul><small>${esc(CL.note)}</small></div>`;

  /* the fee */
  const FEE = OFFER.fee;
  if (FEE) {
    document.querySelectorAll("[data-fee]").forEach((el) => (el.textContent = FEE.amount));
    const fb = $("#feeBox"); if (fb) fb.innerHTML = `<span class="lbl">The fee</span><b>${esc(FEE.amount)}</b><span>${esc(FEE.note)}</span>`;
  }

  /* the one-liners under the hero headline */
  if (OFFER.headline) $("#hlines").innerHTML = OFFER.headline.lines.map(([ic, t, d]) => `<li><span class="ms">${ic}</span><span><b>${esc(t)}</b><span class="d">${esc(d)}</span></span></li>`).join("");

  /* ---- enroll ---- */
  $("#incl").innerHTML = [["map", `<b>All eight acts</b> — ${totalProcs} processes from DISCOVER to EVOLVE, each mapped to the step`], ["chat", "<b>Prompts at every level</b> — act, process, subprocess, workflow and step"], ["inventory_2", "<b>The complete agent kit per act</b> — context, skills, commands, workflows, subagents, tools, guardrails, rubrics"], ["view_stream", "<b>The dual-track delivery system</b> — discovery and delivery in parallel, three backlog levels"], ["straighten", "<b>Four scales</b> — solo, product team, enterprise and platform"], ["school", "<b>Learn by doing</b> — objectives, exercises, knowledge checks and a worked example per act"], ["construction", "<b>Project-based</b> — one real project through every act, ending in the capstone"], ["workspace_premium", "<b>Verified certificate and hiring-partner access</b> — included"], ["rate_review", "<b>Project vetting and weekly mentor syncs</b> — included"], ["military_tech", "<b>Claude certifications</b> — free Claude Academy certificates, and prep for the Claude Certification Program"], ["bolt", "<b>Flagship model access</b> — step-by-step help getting Claude's most capable models"]].map(([i, t]) => `<li><span class="ms">${i}</span><span>${t}</span></li>`).join("");

  /* ---- reveal on scroll ---- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); if (x.target.querySelector("[data-count]")) countUp(); io.unobserve(x.target); } }), { threshold: 0.12 }) : null;
  document.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
  countUp();
})();
