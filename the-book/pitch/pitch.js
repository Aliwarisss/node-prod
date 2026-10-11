/* Node pitch deck — full-screen slides that snap, with keyboard, rail and swipe navigation.
 * Content comes from the same model and offer data as the program, overview and course pages,
 * so numbers and claims stay in step. Each slide's elements animate in whenever it becomes active. */
(() => {
  "use strict";
  const API = window.NODE_API || {}, OFFER = window.NODE_OFFER || {}, M = window.NODE_MODEL || {}, SYS = M.system || {}, RM = window.NODE_ROADMAP || {};
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const HL = OFFER.headline || {}, FEE = OFFER.fee || { amount: "PKR 5,000", note: "", includes: [] }, P = OFFER.plain || {}, CL = OFFER.claude || {};
  const STAGES = API.STAGES || [], A1 = STAGES.find((s) => s.status && s.status !== "placeholder");
  const kit = A1 && API.actKit ? API.actKit(A1, "team") : [];
  const count = (layer) => kit.filter((f) => f.layer === layer).length;
  const nPrompts = A1 ? Object.values(API.UNITS).filter((u) => u.si === A1.si).length : 0;
  const a = (kind, d) => `data-a="${kind}" style="--d:${d}"`;

  const S = []; /* [label, tone, html] */

  /* 1 · title */
  const nodes = [[12, 22], [26, 64], [41, 30], [58, 72], [70, 18], [84, 52], [92, 82], [8, 80], [50, 50], [34, 88]];
  const links = [[0, 2], [2, 8], [8, 3], [3, 5], [5, 4], [4, 2], [1, 8], [1, 7], [3, 9], [5, 6], [9, 7]];
  S.push(["Node", "dark", `<svg class="net" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${links.map(([i, j]) => `<line x1="${nodes[i][0]}" y1="${nodes[i][1]}" x2="${nodes[j][0]}" y2="${nodes[j][1]}" vector-effect="non-scaling-stroke"/>`).join("")}${nodes.map(([x, y], i) => `<circle class="${i % 3 ? "" : "p"}" cx="${x}" cy="${y}" r=".45" style="animation-delay:${i * .3}s"/>`).join("")}</svg>
    <div class="glow a"></div><div class="glow b"></div>
    <div class="inner center">
      <div class="eyebrow" ${a("fade", 0)}><i></i>Node · a 30-day project-based program<i></i></div>
      <h1 ${a("up", 1)}>Develop apps end to end<br><span class="accent">with agentic AI.</span></h1>
      <p class="lead" ${a("up", 3)}>${esc(HL.sub || "From requirements to deployment, in 30 days. No experience needed.")}</p>
      <div class="tags" ${a("up", 5)}><span>Requirements → deployment</span><span>Copy, paste, go</span><span>Agents become your team</span></div>
    </div>
    <div class="hint" ${a("fade", 8)}><span class="ms">keyboard_double_arrow_down</span>Scroll or press ↓</div>`]);

  /* 2 · the gap */
  S.push(["The gap", "light dots", `<div class="inner">
    <div class="eyebrow" ${a("fade", 0)}><i></i>The gap</div>
    <h2 ${a("up", 1)}>Learning to build software<br><span class="accent">is broken into pieces.</span></h2>
    <div class="grid3">
      <div class="card" ${a("up", 3)}><span class="ms">extension</span><b>Slices, not products</b><p>Tutorials teach a language or a framework — never how a whole app goes from idea to production.</p></div>
      <div class="card" ${a("up", 4)}><span class="ms">smart_toy</span><b>Agents, but no method</b><p>AI agents are everywhere, yet few people know how to direct them through real work — or check what they produce.</p></div>
      <div class="card" ${a("up", 5)}><span class="ms">groups</span><b>"You need a team"</b><p>Shipping an app used to take product, design, engineering, testing and operations people.</p></div>
    </div></div>`]);

  /* 3 · the shift */
  const DE = (OFFER.devEng || {}).rows || [];
  S.push(["The shift", "dark dots", `<div class="inner">
    <div class="eyebrow" ${a("fade", 0)}><i></i>The shift</div>
    <h2 ${a("up", 1)}>Agents changed the job.</h2>
    <div class="shift">
      <div class="role" ${a("left", 3)}><h3>Developer</h3><ul>${DE.slice(0, 4).map(([k, d]) => `<li><span>${esc(k)}</span>${esc(d)}</li>`).join("")}</ul></div>
      <div class="arrow" ${a("scale", 5)}><span class="ms">arrow_forward</span></div>
      <div class="role eng" ${a("right", 6)}><h3>Engineer</h3><ul>${DE.slice(0, 4).map(([k, , e]) => `<li><span>${esc(k)}</span>${esc(e)}</li>`).join("")}</ul></div>
    </div>
    <p class="big-quote" ${a("up", 8)}>Writing code is getting cheap. <span>Engineering the whole product is what's valuable.</span></p></div>`]);

  /* 4 · meet node */
  S.push(["Meet Node", "light dots", `<div class="inner center">
    <div class="eyebrow" ${a("fade", 0)}><i></i>Meet<i></i></div>
    <h1 class="mega" ${a("scale", 1)}>Node<span class="accent">.</span></h1>
    <p class="lead" ${a("up", 3)}>A 30-day, project-based learning roadmap and ready-to-use agent toolkit.</p>
    <div class="grid3">${(HL.lines || []).map(([ic, t, d], i) => `<div class="card ${i === 1 ? "hot" : ""}" ${a("up", 4 + i)}><span class="ms">${ic}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join("")}</div></div>`]);

  /* 5 · project-based */
  const PB = (OFFER.pbl || {}).steps || [];
  S.push(["Project-based", "dark dots", `<div class="inner">
    <div class="eyebrow" ${a("fade", 0)}><i></i>Project-based learning</div>
    <h2 ${a("up", 1)}>One real app.<br><span class="accent">The whole lifecycle.</span></h2>
    <div class="track"><svg aria-hidden="true"><defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#4fd1c5"/><stop offset="1" stop-color="#e91e63"/></linearGradient></defs><line x1="3%" y1="2" x2="97%" y2="2"/></svg>
      ${PB.map(([ic, t, d], i) => `<div class="step" ${a("up", 3 + i)}><div class="n"><span class="ms">${ic}</span></div><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join("")}
    </div></div>`]);

  /* 6 · the model — eight acts in three tracks, each ending in a gate */
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const nice = (k) => String(k || "").charAt(0) + String(k || "").slice(1).toLowerCase();
  const TR = SYS.tracks || [];
  const trackOf = (id) => TR.find((t) => t.acts.includes(id)) || {};
  S.push(["The model", "light dots", `<div class="inner">
    <div class="eyebrow" ${a("fade", 0)}><i></i>The Node model</div>
    <h2 ${a("up", 1)}>Eight acts.<br><span class="accent">One lifecycle.</span></h2>
    <div class="life">
      ${TR.map((t, i) => `<div class="band" style="--c:${t.c};grid-column:span ${t.acts.length}" ${a("fade", 2 + i * .5)}><b><span class="ms">${t.icon}</span>${esc(t.name)}</b><em>${esc(t.q)}</em></div>`).join("")}
      ${STAGES.map((s, i) => { const open = A1 && s.id === A1.id; return `<div class="act ${open ? "open" : ""}" style="--c:${trackOf(s.id).c || "#008080"};--d:${3 + i * .45}" ${a("up", 3 + i * .45)}><div class="dot">${ROMAN[s.si]}</div><b>${esc(nice(s.key))}</b><p>${esc(s.tagline || "")}</p><span class="gate"><span class="ms">${open ? "lock_open" : "flag"}</span>${esc(s.gate)}</span></div>`; }).join("")}
    </div>
    <p class="life-note" ${a("up", 8)}><span class="ms">all_inclusive</span><span>Not a waterfall. Discovery keeps running ahead while delivery ships, every act ends in a gate decision, and what you learn in Evolve feeds the next Discover.</span></p></div>`]);

  /* 7 · zoom in — five levels, one contract */
  const p0 = A1 && A1.processes[0], sp0 = p0 && API.kids ? API.kids(p0)[0] : null, w0 = sp0 && sp0.workflows[0], st0 = w0 && (w0.steps || [])[0];
  const LADDER = [["Act", A1 ? `${ROMAN[A1.si]} · ${nice(A1.key)}` : "", "the whole stage"], ["Process", p0 ? `${p0.num} ${p0.title}` : "", "a major capability"], ["Subprocess", sp0 ? sp0.title : "", "a unit you can own"], ["Workflow", w0 ? w0.title : "", "steps and decisions"], ["Step", st0 ? st0.title : "", "one precise task"]];
  const CON = M.contract || [];
  S.push(["Zoom in", "dark dots", `<div class="inner split">
    <div>
      <div class="eyebrow" ${a("fade", 0)}><i></i>From act to step</div>
      <h2 ${a("up", 1)}>Zoom in.<br><span class="accent">Down to one step.</span></h2>
      <ol class="ladder">${LADDER.map(([l, v, d], i) => `<li style="--i:${i}" ${a("left", 3 + i * .6)}><span>${l} <em>· ${d}</em></span><b>${esc(v)}</b></li>`).join("")}</ol>
    </div>
    <div class="contract" ${a("right", 4)}>
      <span class="k">The NODE contract</span>
      <h3>Every unit answers the same ${CON.length} questions.</h3>
      <div class="chips" data-cycle>${CON.map((c) => `<button class="cy" data-q="${esc(c.q)}"><span class="ms">${c.icon}</span>${esc(c.name)}</button>`).join("")}</div>
      <p class="q" data-cycle-out>${esc(CON[0] ? CON[0].q : "")}</p>
    </div></div>`]);

  /* 8 · the 30-day journey */
  const WEEKS = [["Week 1", "Find the right problem", ["kickoff", "discover", "plan"]], ["Week 2", "Design it and build it", ["design", "build"]], ["Week 3", "Test it and launch it", ["verify", "release"]], ["Week 4", "Run it, improve it, graduate", ["operate", "evolve", "capstone"]]];
  const MOD = { kickoff: 0, discover: 1, plan: 2, design: 3, build: 4, verify: 5, release: 6, operate: 7, evolve: 8, capstone: 9 };
  const mName = (id) => (id === "kickoff" ? "Get set up" : id === "capstone" ? "Finish & get certified" : ((P.modules || {})[id] || [id])[0]);
  const isOpen = (id) => id === "kickoff" || (A1 && A1.id === id);
  S.push(["The journey", "light dots", `<div class="inner">
    <div class="eyebrow" ${a("fade", 0)}><i></i>The 30-day journey</div>
    <h2 ${a("up", 1)}>30 days. 4 weeks.<br><span class="accent">10 modules.</span></h2>
    <div class="weeks">${WEEKS.map(([w, t, ids], i) => `<div class="week" ${a("up", 3 + i)}><span class="wk">${w}</span><h3>${t}</h3><ul>${ids.map((id) => `<li class="${isOpen(id) ? "open" : ""}"><i>${MOD[id]}</i>${esc(mName(id))}</li>`).join("")}</ul></div>`).join("")}</div>
    <span class="open-note" ${a("fade", 8)}><span class="ms">lock_open</span>Modules 0 and 1 are open to try free</span></div>`]);

  /* 9 · copy, paste, go */
  const demo = API.UNITS && API.UNITS["discover.frame.hypothesise.write-hypotheses.s1"];
  S.push(["Copy, paste, go", "dark dots", `<div class="inner split">
    <div>
      <div class="eyebrow" ${a("fade", 0)}><i></i>Copy, paste, go</div>
      <h2 ${a("up", 1)}>Ready workflows<br><span class="accent">for every step.</span></h2>
      <p class="lead" ${a("up", 2)}>Paste them as they are, or configure them to your way of working.</p>
      <ul class="levels">${[["Act", "run a whole stage end to end"], ["Process", "one capability, start to finish"], ["Subprocess", "a focused unit of work"], ["Workflow", "step by step, with checkpoints"], ["Step", "one precise task"]].map(([l, d], i) => `<li ${a("left", 3 + i)}><b>${i + 1}</b><span><strong>${l}</strong> — ${d}</span></li>`).join("")}</ul>
    </div>
    <div class="term" ${a("right", 3)}><div class="term-bar"><i></i><i></i><i></i><span>your agent · a real Node prompt</span></div><pre id="typer"></pre></div>
  </div>`]);

  /* 10 · agents become your team */
  const AG = [["travel_explore", "Researcher"], ["hub", "Synthesiser"], ["code", "Coding agent"], ["shield", "Security reviewer"], ["lock", "Privacy reviewer"], ["bug_report", "Test agent"], ["psychology", "Challenger"], ["gavel", "Decision-brief writer"]];
  S.push(["Your team", "light dots", `<div class="inner center">
    <div class="eyebrow" ${a("fade", 0)}><i></i>Agents become your team<i></i></div>
    <h2 ${a("up", 1)}>No team needed.</h2>
    <p class="lead" ${a("up", 2)}>Your agents research, plan, code, test and review. You direct them, check their work and make every decision.</p>
    <div class="orbit" ${a("scale", 3)}><div class="ring">${AG.map(([ic, n], i) => { const ang = (i / AG.length) * Math.PI * 2 - Math.PI / 2, r = 50; return `<div class="ag" style="left:${50 + r * Math.cos(ang)}%;top:${50 + r * Math.sin(ang)}%"><div><p class="pill"><span class="ms">${ic}</span>${n}</p></div></div>`; }).join("")}</div>
      <div class="core"><div><span>The lead</span><b>You</b></div></div></div></div>`]);

  /* 11 · the toolkit */
  const LAYERS = [["chat", nPrompts, "Prompts", "five levels"], ["school", count("skills"), "Skills", "SKILL.md"], ["terminal", count("commands"), "Commands", "commands/"], ["account_tree", count("workflows"), "Workflows", "run specs"], ["groups_3", count("agents"), "Subagents", "agents/"], ["grading", count("rubrics"), "Rubrics", "rubrics/"], ["description", count("templates"), "Templates", "templates/"], ["article", 1, "Context file", "AGENTS.md"], ["shield", 1, "Guardrails", "GUARDRAILS.md"], ["cable", 1, "Tools map", "TOOLS.md"]];
  S.push(["The toolkit", "dark dots", `<div class="inner">
    <div class="eyebrow" ${a("fade", 0)}><i></i>The toolkit</div>
    <h2 ${a("up", 1)}>Not just prompts.<br><span class="accent">The whole agent kit.</span></h2>
    <p class="lead" ${a("up", 2)}>Module 1 alone ships ${kit.length} ready files — drop the folder into your project and your agent is set up.</p>
    <div class="kit">${LAYERS.map(([ic, n, t, f], i) => `<div class="layer" ${a("up", 3 + i * .5)}><span class="ms">${ic}</span><b data-count="${n}">${n}</b><span>${t}</span><code>${f}</code></div>`).join("")}</div></div>`]);

  /* 12 · the book */
  const wUnit = w0 && API.UNITS ? API.UNITS[w0.fid] : null;
  const wPrompt = (wUnit && API.promptText ? API.promptText(wUnit, "solo").split("\n").filter((l) => l.trim() && !/^#/.test(l)).slice(0, 2).join(" ") : "") || `Run the workflow "${w0 ? w0.title : ""}" for my project.`;
  const nKn = Object.keys(window.NODE_KNOWLEDGE || {}).length, nArt = Object.keys(window.NODE_ARTIFACTS || {}).length, nRoles = Object.keys(window.NODE_ROLES || {}).length;
  const BSTATS = [[nArt, "artifact templates"], [nKn, "knowledge entries"], [(M.lenses || []).length, "lenses"], [nRoles, "roles"], [CON.length, "contract sections"], [(M.chain || []).length, "reasoning questions"]];
  S.push(["The book", "light dots", `<div class="inner split">
    <div>
      <div class="eyebrow" ${a("fade", 0)}><i></i>The Node book</div>
      <h2 ${a("up", 1)}>All of it.<br><span class="accent">In one book.</span></h2>
      <p class="lead" ${a("up", 2)}>An interactive book that maps the whole lifecycle. Open any unit to read its contract, copy its prompt and grab its templates — with lessons, exercises and checks built in.</p>
      <div class="stats">${BSTATS.map(([n, t], i) => `<div ${a("up", 3 + i * .4)}><b data-count="${n}">${n}</b><span>${t}</span></div>`).join("")}</div>
    </div>
    <div class="book" ${a("right", 3)}>
      <div class="term-bar"><i></i><i></i><i></i><span>node · the book</span></div>
      <div class="book-body">
        <aside>${STAGES.map((s) => { const open = A1 && s.id === A1.id; return `<div class="${open ? "o" : "l"}"><i>${ROMAN[s.si]}</i>${esc(nice(s.key))}${open ? "" : '<span class="ms">lock</span>'}</div>` + (open ? s.processes.map((p, j) => `<div class="sub ${j === 0 ? "act" : ""}">${esc(p.num)} ${esc(p.title)}</div>`).join("") : ""); }).join("")}</aside>
        <div class="page">
          <div class="crumb">I Discover › ${esc(p0 ? p0.num : "")} › ${esc(sp0 ? sp0.title : "")}</div>
          <h4>${esc(w0 ? w0.title : "")}</h4>
          <div class="tabs" data-cycle>${CON.slice(0, 6).map((c) => `<span class="cy" data-q="${esc(c.q)}">${esc(c.name)}</span>`).join("")}</div>
          <p class="tab-q" data-cycle-out>${esc(CON[0] ? CON[0].q : "")}</p>
          <div class="prompt"><div><span>Prompt · workflow</span><em><span class="ms">content_copy</span>Copy</em></div><code>${esc(wPrompt.length > 150 ? wPrompt.slice(0, 147) + "…" : wPrompt)}</code></div>
          <div class="chips2"><span><span class="ms">description</span>Templates</span><span><span class="ms">school</span>Knowledge</span><span><span class="ms">visibility</span>Lenses</span><span><span class="ms">quiz</span>Check</span></div>
        </div>
      </div>
    </div></div>`]);

  /* 13 · what makes it different */
  const USP = OFFER.usps || [];
  S.push(["Different", "dark dots", `<div class="inner">
    <div class="eyebrow" ${a("fade", 0)}><i></i>What makes Node different</div>
    <h2 ${a("up", 1)}>${["Six", "Seven", "Eight", "Nine", "Ten"][USP.length - 6] || USP.length} things.<br><span class="accent">One program.</span></h2>
    <div class="grid4 usp">${USP.map(([ic, t, d], i) => `<div class="card" ${a("up", 3 + i * .4)}><span class="ms">${ic}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join("")}</div></div>`]);

  /* 14 · node vs a typical course */
  const CMP = [["Watching lessons and toy exercises", "One real app, built end to end"], ["Pieces of the stack, one at a time", "Requirements to deployment, in order"], ["Prompt lists you paste and hope", "Workflows for every step, plus a full agent kit"], ["\"You need a team\"", "Agents become your team"], ["Agents framed as replacing you", "You decide; agents draft, research and check"], ["No recognised AI credentials", "Claude Academy certificates and certification prep"]];
  S.push(["Vs a course", "light dots", `<div class="inner">
    <div class="eyebrow" ${a("fade", 0)}><i></i>Node vs a typical course</div>
    <h2 ${a("up", 1)}>Not another course.</h2>
    <div class="cmp"><div class="hd" ${a("fade", 2)}><span>Typical course</span><span>Node</span></div>${CMP.map(([t, n], i) => `<div ${a("up", 3 + i)}><span><span class="ms">close</span>${esc(t)}</span><span><span class="ms">check</span>${esc(n)}</span></div>`).join("")}</div></div>`]);

  /* 15 · subjects */
  const AGX = (RM.subjects || []).find((s) => s.name === "Agentic development");
  const HOT = ["JavaScript & TypeScript", "Rust", "MERN", "Next.js", "Agentic development"];
  const subj = (RM.subjects || []).map((s) => [s.icon, s.name]).concat([["code", "JavaScript & TypeScript"], ["memory", "Rust"], ["layers", "MERN"], ["bolt", "Next.js"]]);
  S.push(["Subjects", "dark dots", `<div class="inner center">
    <div class="eyebrow" ${a("fade", 0)}><i></i>Everything an app needs<i></i></div>
    <h2 ${a("up", 1)}>From product<br><span class="accent">to production.</span></h2>
    <p class="lead" ${a("up", 2)}>${(RM.subjects || []).length} subjects, learned on your own project, act by act.</p>
    <div class="cloud">${subj.map(([ic, n], i) => `<span class="${HOT.includes(n) ? "hot" : ""}" ${a("scale", 3 + i * .3)}><span class="ms">${ic}</span>${esc(n)}</span>`).join("")}</div>
    ${AGX ? `<div class="agx" ${a("up", 10)}><span class="ms">${AGX.icon}</span><div><b>${esc(AGX.name)}</b> runs through every act<p>${AGX.topics.map(esc).join(" · ")}</p></div></div>` : ""}</div>`]);

  /* 16–19 · subjects, area by area: topics, which acts teach them, and what's open now */
  const SUBJ_AREAS = [
    ["Product & planning", "Build the<br><span class=\"accent\">right thing.</span>", ["Product management", "Business analysis & requirements", "Agile delivery"]],
    ["Design & architecture", "Design it<br><span class=\"accent\">before you code it.</span>", ["UX & product design", "Software architecture", "System design", "Data & databases"]],
    ["Build & ship", "Code it.<br><span class=\"accent\">Ship it.</span>", ["Languages", "Stacks & frameworks", "DevOps & CI/CD", "Cloud & infrastructure"]],
    ["Quality & operations", "Prove it.<br><span class=\"accent\">Run it.</span>", ["QA & testing", "Security & privacy", "Operations & SRE"]],
  ];
  const actIdx = Object.fromEntries(STAGES.map((s) => [s.id, s]));
  SUBJ_AREAS.forEach(([area, head, names], ai) => {
    const list = names.map((n) => (RM.subjects || []).find((s) => s.name === n)).filter(Boolean);
    S.push([area, ai % 2 ? "dark dots" : "light dots", `<div class="inner">
      <div class="eyebrow" ${a("fade", 0)}><i></i>Subjects · ${ai + 1} of ${SUBJ_AREAS.length} · ${esc(area)}</div>
      <h2 ${a("up", 1)}>${head}</h2>
      <div class="sj" style="--n:${list.length}">${list.map((s, i) => {
        const open = (s.open || []).length, st = open === 0 ? ["lock", "Unlocks when you enroll", "lk"] : open === s.topics.length ? ["lock_open", "Open in Act I", "op"] : ["lock_open", `${open} of ${s.topics.length} open in Act I`, "op"];
        return `<div class="sj-card" ${a("up", 3 + i * .7)}>
          <div class="sj-hd"><span class="ms">${s.icon}</span><b>${esc(s.name)}</b></div>
          <p class="sj-what">${esc(s.what)}</p>
          <ul>${s.topics.map((t) => { const o = (s.open || []).includes(t); return `<li class="${o ? "o" : ""}"><span class="ms">${o ? "check_circle" : "radio_button_unchecked"}</span>${esc(t)}</li>`; }).join("")}</ul>
          <div class="sj-ft"><span class="sj-acts">${s.acts.map((id) => { const st2 = actIdx[id]; return st2 ? `<i class="${A1 && id === A1.id ? "o" : ""}" title="${esc(nice(st2.key))}">${ROMAN[st2.si]}</i>` : ""; }).join("")}</span><span class="sj-st ${st[2]}"><span class="ms">${st[0]}</span>${st[1]}</span></div>
        </div>`;
      }).join("")}</div></div>`]);
  });

  /* 20 · any scale */
  const SC = SYS.scales || [];
  S.push(["Any scale", "light dots", `<div class="inner">
    <div class="eyebrow" ${a("fade", 0)}><i></i>Any scale</div>
    <h2 ${a("up", 1)}>Solo to enterprise.<br><span class="accent">Same lifecycle.</span></h2>
    <div class="scales"><div class="scale-picks" ${a("left", 3)}>${SC.map((s, i) => `<button data-scale="${i}" aria-pressed="${i === 0}"><span class="ms">${s.icon}</span><span class="t"><b>${esc(s.name)}</b></span></button>`).join("")}</div>
      <div class="scale-view" id="scaleView" ${a("right", 4)}></div></div></div>`]);

  /* 21 · what you get */
  const GET = (OFFER.get || []).filter((g) => ["workspace_premium", "military_tech", "bolt", "work", "folder_special", "handshake"].includes(g[0]));
  S.push(["What you get", "dark dots", `<div class="inner">
    <div class="eyebrow" ${a("fade", 0)}><i></i>What you get</div>
    <h2 ${a("up", 1)}>Shipped. Certified.<br><span class="accent">Ready to be hired.</span></h2>
    <div class="grid3">${GET.map(([ic, t, d], i) => `<div class="card" ${a("up", 3 + i * .6)}><span class="ms">${ic}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join("")}</div></div>`]);

  /* 22 · the fee */
  S.push(["The fee", "pink", `<div class="inner center">
    <div class="eyebrow" ${a("fade", 0)}><i></i>One price · everything included<i></i></div>
    <div class="price" ${a("scale", 1)}>${esc(FEE.amount)}<br><small>one-time</small></div>
    <p class="lead" style="color:rgba(255,255,255,.85)" ${a("up", 3)}>${esc(FEE.note)}.</p>
    <div class="incl">${(FEE.includes || []).map((x, i) => `<span ${a("up", 4 + i * .4)}><span class="ms">check_circle</span>${esc(x)}</span>`).join("")}</div></div>`]);

  /* 23 · close */
  S.push(["Start", "dark", `<div class="glow a"></div><div class="glow b"></div>
    <div class="inner center">
      <div class="eyebrow" ${a("fade", 0)}><i></i>Start building<i></i></div>
      <h1 ${a("up", 1)}>Your app.<br><span class="accent">Your agents.</span><br>30 days.</h1>
      <div class="ctas" ${a("up", 3)}><a class="btn" href="/register">Enroll · ${esc(FEE.amount)}<span class="ms">arrow_forward</span></a><a class="btn line" href="../sdlc/index.html#/act-discover">Try Module 1 free</a></div>
      <div class="ctas" ${a("up", 4)} style="margin-top:14px"><a class="btn line" href="../sdlc/index.html">Open the book</a><a class="btn line" href="../course/index.html">Course outline</a><a class="btn line" href="../overview/index.html">Full overview</a><a class="btn line" href="../program/index.html">Interactive roadmap</a></div>
    </div>`]);

  /* render */
  const deck = $("#deck");
  deck.innerHTML = S.map(([label, tone, html], i) => `<section class="slide ${tone}" data-tone="${tone.split(" ")[0]}" data-i="${i}" aria-label="${esc(label)}">${html}</section>`).join("");
  const slides = [...deck.querySelectorAll(".slide")];
  $("#tot").textContent = String(slides.length).padStart(2, "0");
  $("#rail").innerHTML = S.map(([label], i) => `<button data-go="${i}" aria-label="${esc(label)}"><span>${esc(label)}</span></button>`).join("");
  document.querySelectorAll("[data-fee]").forEach((e) => (e.textContent = FEE.amount));

  /* fit: if a slide's content is taller or wider than the screen, scale it down to fit — never clip */
  const fit = () => {
    deck.classList.add("measuring"); // measure the settled layout, without entrance offsets
    slides.forEach((s) => {
      const inner = s.querySelector(".inner"); if (!inner) return;
      inner.style.transform = "";
      const cs = getComputedStyle(s);
      const availH = s.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const availW = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const needH = inner.scrollHeight, k = Math.max(0.5, Math.min(1, availH / needH, availW / inner.scrollWidth));
      if (k < 0.995 && needH <= availH) { inner.style.transformOrigin = "center center"; inner.style.transform = `scale(${k.toFixed(3)})`; } // only too wide: it's still centred, so scale in place
      else if (k < 0.995) {
        // oversized content is laid out from the top, so scale from the top edge and centre what's left
        inner.style.transformOrigin = "top center";
        inner.style.transform = `translateY(${Math.max(0, (availH - needH * k) / 2).toFixed(1)}px) scale(${k.toFixed(3)})`;
      } else inner.style.transformOrigin = "";
    });
    deck.classList.remove("measuring");
  };

  /* scale picker */
  const showScale = (i) => {
    const s = SC[i]; if (!s) return;
    document.querySelectorAll("[data-scale]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.scale === i)));
    $("#scaleView").innerHTML = `<div class="fade-in"><h3>${esc(s.name)}</h3><dl><div><dt>Who</dt><dd>${esc(s.who)}</dd></div><div><dt>How agents help</dt><dd>${esc(s.agents)}</dd></div><div><dt>Backlogs</dt><dd>${esc(s.backlogs)}</dd></div><div><dt>Checkpoints</dt><dd>${esc(s.gates)}</dd></div></dl></div>`;
  };
  showScale(0);
  deck.addEventListener("click", (e) => { const b = e.target.closest("[data-scale]"); if (b) showScale(+b.dataset.scale); });

  /* typing a real prompt */
  let typing = null;
  const startTyping = () => {
    const pre = $("#typer"); if (!pre) return;
    clearInterval(typing);
    const body = demo && API.promptText ? API.promptText(demo, "solo").split("\n").slice(0, 16).join("\n") : "Write and rank problem hypotheses for my app.";
    const lines = [{ t: 'you › /discover-1-2-3-1-s1-draft-hypotheses "my app"', c: "you" }, { t: "", c: "" }, ...body.split("\n").map((t) => ({ t, c: /^#/.test(t) ? "h" : "" }))];
    let li = 0, ci = 0, html = "";
    typing = setInterval(() => {
      if (li >= lines.length) { clearInterval(typing); pre.innerHTML = html + '\n<span class="ok">agent › Drafted. Waiting for your review.</span> <span class="cur"></span>'; return; }
      const L = lines[li]; ci += L.c === "you" ? 2 : 10;
      pre.innerHTML = html + (L.c ? `<span class="${L.c}">${esc(L.t.slice(0, ci))}</span>` : esc(L.t.slice(0, ci))) + '<span class="cur"></span>';
      if (ci >= L.t.length) { html += (L.c ? `<span class="${L.c}">${esc(L.t)}</span>` : esc(L.t)) + "\n"; li++; ci = 0; }
      pre.scrollTop = pre.scrollHeight;
    }, 18);
  };

  /* count-ups */
  const countUp = (root) => root.querySelectorAll("[data-count]").forEach((el) => {
    const n = +el.dataset.count, t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });

  /* cycling highlights (contract chips, book tabs) — hover or tap one to jump to it */
  let cyc = null, cyN = 0, cyS = null;
  const cyStep = () => cyS && cyS.querySelectorAll("[data-cycle]").forEach((box) => {
    const items = box.querySelectorAll(".cy"), it = items[cyN % items.length];
    items.forEach((x) => x.classList.toggle("act", x === it));
    const out = box.parentElement.querySelector("[data-cycle-out]");
    if (out && it && it.dataset.q && out.textContent !== it.dataset.q) { out.textContent = it.dataset.q; out.classList.remove("swap"); void out.offsetWidth; out.classList.add("swap"); }
  });
  const cyRun = () => { clearInterval(cyc); if (cyS && cyS.querySelector("[data-cycle]")) cyc = setInterval(() => { cyN++; cyStep(); }, 2400); };
  const startCycle = (s) => { cyS = s; cyN = 0; cyStep(); cyRun(); };
  const pick = (e) => { const c = e.target.closest && e.target.closest("[data-cycle] .cy"); if (!c) return; cyN = [...c.parentElement.querySelectorAll(".cy")].indexOf(c); cyStep(); cyRun(); };
  deck.addEventListener("mouseover", pick);
  deck.addEventListener("click", pick);

  /* which slide is active */
  let cur = 0;
  const activate = (i) => {
    cur = i;
    slides.forEach((s, j) => s.classList.toggle("on", j === i));
    document.body.dataset.tone = slides[i].dataset.tone;
    $("#cur").textContent = String(i + 1).padStart(2, "0");
    $("#bar").style.width = `${((i + 1) / slides.length) * 100}%`;
    document.querySelectorAll("#rail button").forEach((b, j) => b.classList.toggle("on", j === i));
    if (slides[i].querySelector("#typer")) startTyping(); else clearInterval(typing);
    countUp(slides[i]);
    startCycle(slides[i]);
    history.replaceState(null, "", `#${i + 1}`);
  };
  let lock = 0; // while a key/rail jump glides, ignore the slides it passes
  /* the active slide follows the scroll position (works with snap, wheel, touch and keys) */
  deck.addEventListener("scroll", () => {
    if (Date.now() < lock) return; // a key/rail jump is gliding past other slides
    const h = deck.clientHeight, i = Math.round(deck.scrollTop / h);
    if (i !== cur && Math.abs(deck.scrollTop - i * h) < h * 0.35) activate(Math.max(0, Math.min(slides.length - 1, i)));
  }, { passive: true });
  deck.addEventListener("scrollend", () => { if (Math.abs(deck.scrollTop - cur * deck.clientHeight) < 2) lock = 0; });

  /* navigation: keys, buttons, rail */
  const go = (i) => {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === cur && Date.now() < lock) return;
    lock = Date.now() + 900 + 120 * Math.abs(i - cur); // released early when the glide ends (scrollend)
    activate(i); // animate the destination in while it glides into place
    deck.scrollTo({ top: i * deck.clientHeight, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  addEventListener("keydown", (e) => {
    if (e.target && e.target.closest && e.target.closest("input, textarea")) return;
    const k = e.key;
    if (["ArrowDown", "PageDown", "ArrowRight", " "].includes(k)) { e.preventDefault(); go(cur + 1); }
    else if (["ArrowUp", "PageUp", "ArrowLeft"].includes(k)) { e.preventDefault(); go(cur - 1); }
    else if (k === "Home") { e.preventDefault(); go(0); }
    else if (k === "End") { e.preventDefault(); go(slides.length - 1); }
    else if (k === "f" || k === "F") toggleFs();
  });
  $("#next").addEventListener("click", () => go(cur + 1));
  $("#prev").addEventListener("click", () => go(cur - 1));
  $("#rail").addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) go(+b.dataset.go); });
  const toggleFs = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); else document.exitFullscreen?.(); };
  $("#fsBtn").addEventListener("click", toggleFs);
  document.addEventListener("fullscreenchange", () => ($("#fsBtn .ms").textContent = document.fullscreenElement ? "fullscreen_exit" : "fullscreen"));

  /* open on the slide in the address (#5), otherwise the first */
  const start = Math.max(0, Math.min(slides.length - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  if (start) { deck.style.scrollBehavior = "auto"; deck.scrollTop = start * deck.clientHeight; deck.style.scrollBehavior = ""; }
  activate(start);
  fit();
  document.fonts?.ready?.then(fit);
  addEventListener("resize", () => { fit(); deck.style.scrollBehavior = "auto"; deck.scrollTop = cur * deck.clientHeight; deck.style.scrollBehavior = ""; });
  deck.focus();
})();
