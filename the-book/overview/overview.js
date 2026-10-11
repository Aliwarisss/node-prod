/* Node program overview — a plain, one-page outline of what Node is, why it's built this way,
 * the 30-day roadmap, subjects, outcomes and Act I in detail. Reads the book's model headless,
 * so Act I is always described from its real content; other acts show their outline, locked. */
(() => {
  "use strict";
  const API = window.NODE_API, M = window.NODE_MODEL, SYS = M.system, RM = window.NODE_ROADMAP;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  if (!API) { $("#content").innerHTML = "<p>Could not load the program model.</p>"; return; }
  const { UNITS, STAGES, actKit, kids, stepsIn, outOf } = API;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const title = (k) => k.charAt(0) + k.slice(1).toLowerCase();
  const isOpen = (s) => s.status && s.status !== "placeholder";
  const A1 = STAGES.find(isOpen), BOOK = "../sdlc/index.html#/";
  const TRACK = Object.fromEntries(SYS.tracks.flatMap((t) => t.acts.map((a) => [a, t])));
  const DAYS = { discover: [1, 5], plan: [6, 8], design: [9, 11], build: [12, 15], verify: [16, 18], release: [19, 21], operate: [22, 24], evolve: [25, 27] };
  const days = (id) => { const [a, b] = DAYS[id]; return `Days ${a}–${b}`; };
  const weekOf = (id) => Math.ceil(DAYS[id][0] / 7);
  const unitsOf = (s) => Object.values(UNITS).filter((u) => u.si === s.si);
  const openPill = '<span class="pill open"><span class="ms">lock_open</span>Open</span>', lockPill = '<span class="pill lock"><span class="ms">lock</span>Locked</span>', partPill = '<span class="pill part"><span class="ms">lock_open</span>Partly open</span>';
  let secN = 0; // sections number themselves in page order
  const sec = (id, _n, h, body) => `<section id="${id}"><h2><small>${String(++secN).padStart(2, "0")}</small>${h}</h2>${body}</section>`;
  const OFFER = window.NODE_OFFER || {};
  const ticks = (items, locked) => `<ul class="ticks">${items.map((x) => `<li class="${locked ? "lk" : ""}"><span class="ms">${locked ? "lock" : "check_circle"}</span><span>${x}</span></li>`).join("")}</ul>`;

  const nUnits = unitsOf(A1).length, nKit = actKit(A1, "team").length, nKn = Object.keys(window.NODE_KNOWLEDGE || {}).length, nArt = Object.keys(window.NODE_ARTIFACTS || {}).length;
  const nSteps = stepsIn(A1).length, nSubs = A1.processes.reduce((a, p) => a + kids(p).length, 0), nProcs = STAGES.reduce((a, s) => a + s.processes.length, 0);
  const H = [];

  /* 1. What Node is */
  H.push(sec("what", 1, "What Node is", `
    <p class="lead">Most courses teach one slice — a language, a framework, a tool. Node is a project-based learning roadmap: you take one real project through the whole journey of a software product, in the order real teams work through it, using AI agents at every step.</p>
    <div class="grid2">
      <div class="box"><span class="ms">conversion_path</span><b>One lifecycle, eight acts</b><p>Discover → Plan → Design → Build → Verify → Release → Operate → Evolve. ${nProcs} processes in all.</p></div>
      <div class="box"><span class="ms">handshake</span><b>You decide, agents help</b><p>You stay in charge of every decision. Your agents draft, research, analyse and check the work for you.</p></div>
      <div class="box"><span class="ms">calendar_month</span><b>Thirty days, day by day</b><p>A kick-off, eight acts across four weeks, and a capstone where you run your own idea end to end.</p></div>
      <div class="box"><span class="ms">straighten</span><b>Any scale</b><p>The same lifecycle, tuned for a solo builder, a product team, an enterprise or a platform team.</p></div>
    </div>
    <h3>Who it's for</h3>
    <ul class="plain"><li><b>Newcomers</b> who want to understand how software is actually built, end to end.</li><li><b>Developers</b> who know how to code but want to see the whole product lifecycle.</li><li><b>Product managers, designers and founders</b> who want to build with agents and work with engineers confidently.</li><li><b>Teams</b> adopting AI agents who need a shared way of working.</li></ul>`));

  /* Project-based learning */
  if (OFFER.pbl) H.push(sec("project", 0, "Project-based learning", `
    <p class="lead">${esc(OFFER.pbl.body)}</p>
    <ol class="steps4">${OFFER.pbl.steps.map(([ic, t, d]) => `<li><span class="ms">${ic}</span><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("")}</ol>
    <div class="note"><b>What counts as a project?</b> Anything you could really ship: a product idea of your own, a tool your team needs, a client brief, or one of Node's starter projects if you don't have one yet. Pick a size that fits your scale — a solo builder's MVP is as valid as an enterprise feature.</div>`));

  /* What makes Node different */
  if (OFFER.usps) H.push(sec("usps", 0, "What makes Node different", `
    <div class="grid2">${OFFER.usps.map(([ic, t, d]) => `<div class="box"><span class="ms">${ic}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join("")}</div>`));

  /* 2. Why this roadmap */
  H.push(sec("why", 2, "Why it's built this way", `
    <p>Three ideas shape the whole program:</p>
    <h3>1. Start with the problem, not the code</h3>
    <p>Most failed software solves the wrong problem well. Node starts with DISCOVER — proving a problem is real and worth solving — before anything is planned, designed or built.</p>
    <h3>2. Follow the order real teams use — but not as a waterfall</h3>
    <p>${esc(SYS.orderNote)}</p>
    <p>In practice, <b>discovery</b> (deciding what's worth building) and <b>delivery</b> (building and shipping it) run side by side, joined by backlogs. <b>Run &amp; learn</b> feeds what happens in production back into both.</p>
    <h3>3. Agents are tools; people stay accountable</h3>
    <p>${esc(SYS.agentWork.principle)}</p>
    <h3>Why 30 days</h3>
    <p>Long enough to take one real idea through the whole lifecycle; short enough to keep momentum. Each act gets a few focused days, with discovery continuing every week alongside delivery.</p>`));

  /* Why agents, and developer vs engineer */
  if (OFFER.agents) H.push(sec("agents", 0, "Why agents — and developer vs engineer", `
    <p class="lead">${esc(OFFER.agents.body)}</p>
    <div class="grid2">${OFFER.agents.points.map(([ic, t, d]) => `<div class="box"><span class="ms">${ic}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join("")}</div>
    ${OFFER.devEng ? `<h3>${esc(OFFER.devEng.title)}</h3><p>${esc(OFFER.devEng.intro)}</p>
    <div class="tw"><table><tr><th></th><th>Developer</th><th>Engineer</th></tr>${OFFER.devEng.rows.map(([k, d, e]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(d)}</td><td><b>${esc(e)}</b></td></tr>`).join("")}</table></div>` : ""}`));

  /* How it works */
  if (OFFER.howItWorks) H.push(sec("how", 0, "How it works", `
    <p>Seven steps from enrollment to certificate — everything on your project, with your agent at your side.</p>
    ${OFFER.fee ? `<div class="note"><b>The fee: ${esc(OFFER.fee.amount)}</b> — ${esc(OFFER.fee.note.toLowerCase())}. It covers: ${OFFER.fee.includes.map(esc).join(" · ")}.</div>` : ""}
    <ol class="tl">${OFFER.howItWorks.map(([ic, t, when, d]) => `<li><span class="ms">${ic}</span><div><b>${esc(t)}</b> <em>${esc(when)}</em><p>${esc(d)}</p></div></li>`).join("")}</ol>
    <h3>Using a prompt or the agent kit, in five moves</h3>
    <ol class="plain">${(SYS.agentWork.howTo || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
    <h3>Pick your scale</h3>
    <div class="tw"><table><tr><th>Scale</th><th>Who</th><th>How you use agents</th></tr>${SYS.scales.map((s) => `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.who)}</td><td>${esc(s.agents)}</td></tr>`).join("")}</table></div>`));

  /* 3. The toolkit */
  const feats = [
    ["menu_book", "The Node book", "An interactive book with a map for every act, process, subprocess, workflow and step — drill in from the whole lifecycle to a single task."],
    ["contract", "The NODE contract", `Every unit is defined the same way, across ${M.contract.length} sections: purpose, flow, cases, routing, controls, knowledge, lenses, people, artifacts and continuity.`],
    ["chat", "Prompts at five levels", "Copy-paste prompts for the whole act, a process, a subprocess, a workflow or a single step — written for you to use with your agent."],
    ["inventory_2", "A complete agent kit", "A ready project folder per act: AGENTS.md, skills, commands, workflow specs, subagents, tools, guardrails, rubrics and templates."],
    ["view_stream", "A real delivery system", "Dual-track agile, three backlog levels (portfolio, product, iteration) and clear Definition of Ready and Done."],
    ["description", `${nArt} artifact templates`, "Real templates for every document, sheet, form and canvas the work produces — with what good looks like."],
    ["school", `${nKn} knowledge entries`, "Frameworks, standards, methods and techniques explained: what they are, how they work, and where they're used."],
    ["visibility", `${M.lenses.length} lenses`, "The perspectives that matter — business, users, security, privacy, finance and more — and when each must be heard."],
    ["quiz", "Learning built in", "Objectives, exercises and knowledge checks for every unit, plus a guided walkthrough of a worked example."],
    ["psychology_alt", "Mastery tools", `The Reasoning Chain (${M.chain.length} questions to ask on any piece of work) and the Initiative Canvas to plan your own initiative.`],
  ];
  H.push(sec("features", 3, "The toolkit", `<div class="grid2">${feats.map(([i, t, d]) => `<div class="box"><span class="ms">${i}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join("")}</div>`));

  /* 4. Roadmap at a glance */
  const rows = [["Week 1", "Day 0", "Kick-off", "Choose your project and set up how you'll work: agents, your scale, your agent kit.", openPill]];
  STAGES.forEach((s) => rows.push([`Week ${weekOf(s.id)}`, days(s.id), `${ROMAN[s.si]} · ${title(s.key)}`, s.tagline || s.purpose, isOpen(s) ? openPill : lockPill]));
  rows.push(["Week 4", "Days 28–30", "Capstone", "Ship and present your project end to end; earn your certificate.", lockPill]);
  H.push(sec("roadmap", 4, "The roadmap at a glance", `
    <p>Four weeks, eight acts, one project. Each act ends with a <b>gate</b> — a clear decision about whether your project's work is ready to move on.</p>
    <div class="tw"><table><tr><th>When</th><th>Days</th><th>What</th><th>In one line</th><th>Status</th></tr>${rows.map((r) => `<tr><td>${r[0]}</td><td style="white-space:nowrap">${r[1]}</td><td><b>${esc(r[2])}</b></td><td>${esc(r[3])}</td><td>${r[4]}</td></tr>`).join("")}</table></div>
    <p>Want to see it as a map? <a href="../program/index.html#month">Open the interactive roadmap</a>.</p>`));

  /* 5. Subjects covered */
  const actName = (id) => STAGES.find((s) => s.id === id);
  H.push(sec("subjects", 5, "Subjects covered", `
    <p>The acts are where you learn the work; these are the subjects you'll pick up along the way. Open each one to see its topics and which acts teach it.</p>
    <div class="subj">${(RM.subjects || []).map((sj) => {
      const open = (sj.open || []).length, all = sj.topics.length, pill = open === 0 ? lockPill : open === all ? openPill : partPill;
      return `<details><summary><span class="ms">${sj.icon}</span><span><b>${esc(sj.name)}</b><span class="w">${esc(sj.what)}</span></span>${pill}</summary><div class="body">
        <div class="acts-chips">${sj.acts.map((a) => { const s = actName(a); return `<span class="${isOpen(s) ? "o" : ""}">${ROMAN[s.si]} ${esc(title(s.key))}</span>`; }).join("")}</div>
        <ul class="ticks">${sj.topics.map((t) => { const o = (sj.open || []).includes(t); return `<li class="${o ? "" : "lk"}"><span class="ms">${o ? "check_circle" : "lock"}</span><span>${esc(t)}${o ? ' <span class="pill open">in Act I</span>' : ""}</span></li>`; }).join("")}</ul>
      </div></details>`;
    }).join("")}</div>
    <div class="note"><b>Open now:</b> the discovery side of product management, business analysis, agile delivery and research ethics, plus the whole agent workflow — all inside Act I. Architecture, system design, languages (JavaScript, TypeScript, Rust), stacks (MERN, Next.js), data, DevOps, cloud, QA and operations unlock with Acts II–VIII.</div>`));

  /* 6. Act I in detail */
  const EX = (A1.contract && A1.contract.execution) || {}, cont = (A1.contract && A1.contract.continuity) || {};
  const procDay = Object.fromEntries(A1.processes.map((p, i) => [p.id, DAYS[A1.id][0] + i]));
  const procHtml = A1.processes.map((p) => {
    const subs = kids(p), outs = outOf(p), T = p.teach || {}, tb = (p.contract && p.contract.continuity && p.contract.continuity.timebox) || "";
    return `<div class="proc"><h3><span>${esc(p.num)}</span>${esc(p.title)}</h3>
      <div class="meta">Day ${procDay[p.id]} · gate: ${esc(p.gate)}${tb ? ` · real-world timebox: ${esc(tb)}` : ""}</div>
      <p>${esc(p.summary || "")}</p>
      <ol>${subs.map((sp) => `<li><a href="${BOOK}u-${sp.fid}">${esc(sp.title)}</a> <small>· ${sp.workflows.map((w) => esc(w.title)).join(" · ")}</small></li>`).join("")}</ol>
      ${(T.objectives || []).length ? `<p class="outs"><b>You'll be able to:</b> ${T.objectives.map(esc).join("; ")}.</p>` : ""}
      <p class="outs"><b>You'll produce:</b> ${outs.map(esc).join(", ")}.</p></div>`;
  }).join("");
  const modes = (SYS.modes || []).filter((m) => m.act === A1.id);
  H.push(sec("discover", 6, `Act I · Discover ${openPill}`, `
    <p class="lead">${esc(A1.purpose)}</p>
    <p>DISCOVER is fully open. It ends with one clear decision — <b>${esc(A1.gate)}</b>: go ahead, change direction, park the idea, or stop. ${esc(EX.authority || "")}</p>
    <div class="grid2">
      <div class="box"><span class="ms">account_tree</span><b>${A1.processes.length} processes · ${nSubs} subprocesses</b><p>Every one mapped down to workflows and ${nSteps} individual steps.</p></div>
      <div class="box"><span class="ms">chat</span><b>${nUnits} prompts</b><p>One for every level of the act — from "run DISCOVER end to end" to a single step.</p></div>
      <div class="box"><span class="ms">inventory_2</span><b>${nKit} agent-kit files</b><p>AGENTS.md, skills, commands, workflow specs, subagents, guardrails, rubrics and templates.</p></div>
      <div class="box"><span class="ms">schedule</span><b>${esc(cont.timebox || "Days 1–5")}</b><p>How long discovery takes on a real initiative. In the program you practise it over days 1–5.</p></div>
    </div>
    <h3>Two ways to run it</h3>
    <ul class="plain">${modes.map((m) => `<li><b>${esc(m.name)}</b> — ${esc(m.when)} ${esc(m.runs)}</li>`).join("")}</ul>
    <h3>Day by day</h3>
    ${procHtml}
    ${A1.continuous ? `<div class="proc"><h3><span>${esc(A1.continuous.num)}</span>${esc(A1.continuous.title)}</h3><div class="meta">Every week, from here on</div><p>${esc(A1.continuous.summary)}</p><ol>${A1.continuous.steps.map((st) => `<li>${esc(st.title)}${st.decision ? " <small>· decision</small>" : ""}</li>`).join("")}</ol></div>` : ""}
    <h3>What you'll come out of Act I with</h3>
    ${ticks((A1.outcomes || []).map(esc), false)}
    ${A1.walkthrough && A1.walkthrough[0] ? `<div class="note"><b>The worked example:</b> ${esc(A1.walkthrough[0].text)} You follow it through all ${A1.walkthrough.length} walkthrough steps.</div>` : ""}
    <p><a class="btn dark" href="${BOOK}act-${A1.id}">Open Act I in the book</a></p>`));

  /* 7. Acts II–VIII */
  H.push(sec("acts", 7, "Acts II–VIII", `
    <p>These acts unlock when you enroll. Here's what each one covers.</p>
    ${STAGES.filter((s) => !isOpen(s)).map((s) => `<div class="locked"><div class="hd"><b>${ROMAN[s.si]} · ${esc(title(s.key))}</b><em>${days(s.id)} · ${esc(TRACK[s.id].name)} · gate: ${esc(s.gate)}</em>${lockPill}</div>
      <p>${esc(s.purpose)}</p><ul>${s.processes.map((p) => `<li>${esc(p.title)}</li>`).join("")}</ul>
      <p style="margin-top:10px"><b style="color:var(--ink)">Outcomes:</b> ${s.outcomes.map(esc).join(" · ")}</p></div>`).join("")}`));

  /* 8. Mastery */
  H.push(sec("mastery", 8, "Mastery", `
    <p>Beyond the acts, two tools help you think like a senior practitioner on any project.</p>
    <h3>The Reasoning Chain</h3>
    <p>${M.chain.length} questions to ask about any piece of work, in order:</p>
    <ol class="plain">${M.chain.map((c) => `<li><b>${esc(c[0])}</b> — ${esc(c[1])}</li>`).join("")}</ol>
    <h3>The Initiative Canvas</h3>
    <p>A one-page canvas where you plan your project — the one you take through every act and ship in the capstone.</p>`));

  /* 9. Outcomes */
  const ACT_OUT = { discover: "Prove a problem is real and worth solving — with evidence, not opinion", plan: "Turn a validated problem into a scoped, prioritised and funded plan", design: "Design the experience, architecture, data and safeguards before writing code", build: "Build in thin, tested slices with JavaScript/TypeScript or Rust, on MERN or Next.js, through a CI pipeline", verify: "Prove the software works and fits — functionally and non-functionally", release: "Ship safely and reversibly with progressive rollout", operate: "Keep it healthy in production with observability, SLOs and incident response", evolve: "Measure outcomes against the original goals and decide what's next" };
  H.push(sec("outcomes", 9, "Outcomes", `
    <h3>By the end of the program you'll be able to</h3>
    ${`<ul class="ticks">${STAGES.map((s) => `<li class="${isOpen(s) ? "" : "lk"}"><span class="ms">${isOpen(s) ? "check_circle" : "lock"}</span><span>${esc(ACT_OUT[s.id])} <span class="pill ${isOpen(s) ? "open" : "lock"}">${ROMAN[s.si]}</span></span></li>`).join("")}<li><span class="ms">check_circle</span><span>Do all of it with AI agents — briefing them well, checking their work, and keeping decisions with people</span></li></ul>`}
    <p>…and you'll have done it on your own project, not an exercise.</p>`));

  /* What you get: certificate, real project experience, opportunities */
  if (OFFER.get) H.push(sec("get", 0, "What you get", `
    <p class="lead">More than a course: a real project, the proof that you ran it, and the doors it opens.</p>
    <div class="grid2">${OFFER.get.map(([ic, t, d, plan]) => `<div class="box"><span class="ms">${ic}</span><b>${esc(t)}</b><p>${esc(d)}</p><em>${esc(plan)}</em></div>`).join("")}</div>`));

  /* Claude certifications and the flagship models */
  const CL = OFFER.claude;
  if (CL) H.push(sec("claude", 0, "Claude certifications & flagship models", `
    <p class="lead">${esc(CL.intro)}</p>
    <h3>Certificates and certifications</h3>
    <div class="grid2">${CL.certs.map(([ic, t, d, when, url]) => `<div class="box"><span class="ms">${ic}</span><b>${esc(t)}</b><p>${esc(d)}</p><em>${esc(when)} · <a href="${url}" target="_blank" rel="noopener">details</a></em></div>`).join("")}</div>
    <div class="tw"><table><tr><th>In the program</th><th>Claude Academy course</th></tr>${CL.academyMap.map(([a, b]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td></tr>`).join("")}</table></div>
    <h3>How to access the flagship models</h3>
    <ol class="tl">${CL.access.map(([ic, t, d]) => `<li><span class="ms">${ic}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join("")}</ol>
    <div class="note">${esc(CL.note)} Claude Academy and the Claude Certification Program are run by Anthropic: Node prepares you, and Anthropic issues the Claude certificates and certifications.</div>`));

  /* Grow your career */
  if (OFFER.career) H.push(sec("career", 0, "Grow your career with Node", `
    <p class="lead">Wherever you start, Node aligns you with how modern teams build — and moves you from writing code to engineering products.</p>
    <div class="tw"><table><tr><th>Where you are</th><th>How to use Node</th><th>Where it leads</th></tr>${OFFER.career.map(([who, how, lead]) => `<tr><td><b>${esc(who)}</b></td><td>${esc(how)}</td><td>${esc(lead)}</td></tr>`).join("")}</table></div>
    <div class="cta"><h2 style="margin-bottom:8px">Ready to start?</h2><p>Act I is open to explore now. Enroll to unlock the full project-based learning roadmap — all eight acts, every prompt and agent kit, the capstone and your certificate — for <b style="color:#fff">PKR 5,000</b>, one-time.</p>
      <div class="row"><a class="btn" href="/register">Enroll · PKR 5,000</a><a class="btn line" href="../program/index.html">See the interactive roadmap</a><a class="btn line" href="${BOOK}act-${A1.id}">Try Act I free</a></div></div>`));

  $("#content").innerHTML = H.join("");
  if (OFFER.headline) $("#hlines").innerHTML = OFFER.headline.lines.map(([ic, t, d]) => `<li><span class="ms">${ic}</span><b>${esc(t)}</b><span class="d">${esc(d)}</span></li>`).join("");

  /* contents list with the current section highlighted */
  const secs = [...document.querySelectorAll("#content section")];
  $("#toc").innerHTML += secs.map((s) => `<a href="#${s.id}">${s.querySelector("h2").childNodes[1].textContent.trim()}</a>`).join("");
  if ("IntersectionObserver" in window) {
    const links = Object.fromEntries([...document.querySelectorAll("#toc a")].map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { Object.values(links).forEach((a) => a.classList.remove("on")); links[e.target.id]?.classList.add("on"); } }), { rootMargin: "-30% 0px -60% 0px" });
    secs.forEach((s) => io.observe(s));
  }
})();
