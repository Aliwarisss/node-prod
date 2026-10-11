/* Node course outline — short and simple. The headline and one-liners say what Node is; the ten
 * modules sit in one collapsible list so the page reads in about a screen and a half. Module 1
 * (DISCOVER) comes from the real act; the other modules are locked. */
(() => {
  "use strict";
  const API = window.NODE_API, OFFER = window.NODE_OFFER || {}, FEE = OFFER.fee || { amount: "PKR 5,000", note: "", includes: [] }, C = OFFER.course || {}, P = OFFER.plain || {}, CL = OFFER.claude || {}, HL = OFFER.headline || {};
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  if (!API) { $("#course").innerHTML = "<p>Could not load the course.</p>"; return; }
  const { STAGES } = API;
  const BOOK = "../sdlc/index.html#/";
  const isOpen = (s) => s.status && s.status !== "placeholder";
  const title = (k) => k.charAt(0) + k.slice(1).toLowerCase();
  const DAYS = { kickoff: [0, 0], discover: [1, 5], plan: [6, 8], design: [9, 11], build: [12, 15], verify: [16, 18], release: [19, 21], operate: [22, 24], evolve: [25, 27], capstone: [28, 30] };
  const dayLbl = (id) => { const [a, b] = DAYS[id]; return a === b ? `Day ${a}` : `Days ${a}–${b}`; };
  const WEEKS = [["Week 1", "Find the right problem", ["kickoff", "discover", "plan"]], ["Week 2", "Design it and build it", ["design", "build"]], ["Week 3", "Test it and launch it", ["verify", "release"]], ["Week 4", "Run it, improve it, graduate", ["operate", "evolve", "capstone"]]];
  const MOD = { kickoff: 0, discover: 1, plan: 2, design: 3, build: 4, verify: 5, release: 6, operate: 7, evolve: 8, capstone: 9 };
  const stageOf = (id) => STAGES.find((s) => s.id === id);
  const plainName = (id) => (id === "kickoff" ? "Get set up" : id === "capstone" ? "Finish, present and get certified" : (P.modules[id] || [])[0] || title(stageOf(id).key));
  const plainQ = (id) => (id === "kickoff" ? "What will I build, and how will I work with my AI?" : id === "capstone" ? "Can I take a real app all the way?" : (P.modules[id] || [])[1] || "");
  const lessonDay = (id, i, n) => { const [a, b] = DAYS[id], span = b - a + 1; return a + Math.min(span - 1, Math.floor((i * span) / n)); };
  const plainStory = (w) => (C.discoverStory || {})[w.at] || w.text;

  /* module content */
  const KICKOFF = [["Get access to an AI model", `Claude or another capable agent — <a href="#tools">here's how</a>.`], ["Learn to work with your AI", "Who decides, what it does, how to instruct it."], ["Choose your app", "Your idea, a brief from work, or a starter project."], ["Pick your size", "Solo, team, company or platform — the course adapts."], ["Set up your agent kit", "Copy in the ready workflows — or configure them your way."], ["Start your first Claude Academy course", `Free, with a certificate — <a href="#certs">see certificates</a>.`]];
  const CAPSTONE = [["Finish your app", "Close any gaps with your agents."], ["Present it", "The problem, what you built, the evidence, what you learned."], ["Get certified", "Your Node certificate, your Claude Academy certificates, and a plan for your Claude certification exam."]];
  const lessonsOf = (id) => {
    if (id === "kickoff") return KICKOFF.map(([t, d]) => ({ t, d }));
    if (id === "capstone") return CAPSTONE.map(([t, d]) => ({ t, d }));
    const s = stageOf(id), open = isOpen(s), walk = s.walkthrough || [];
    const ls = s.processes.map((p, i) => { const [t, d] = P.lessons[p.id] || [p.title, p.summary]; return { t, d, day: `Day ${lessonDay(id, i, s.processes.length)}`, ex: open ? walk.filter((w) => w.at.startsWith(p.fid + ".")).map(plainStory) : [] }; });
    if (open && s.continuous) ls.push({ t: "Keep talking to users every week", d: "A small habit that keeps running while you build.", day: "Every week", ex: walk.filter((w) => w.at === s.continuous.fid).map(plainStory) });
    return ls;
  };
  const makesOf = (id) => (id === "kickoff" ? ["Your AI, ready", "Your app idea", "Your agent kit"] : id === "capstone" ? ["A finished app", "Your portfolio", "Your certificates"] : (P.makes || {})[id] || []);
  const storyOf = (id) => { if (id === "kickoff" || id === "capstone") return C.stories[id]; const s = stageOf(id); return isOpen(s) ? plainStory((s.walkthrough || [])[0] || { text: s.purpose }) : C.stories[id]; };
  const openMod = (id) => id === "kickoff" || (stageOf(id) && isOpen(stageOf(id)));

  const modRow = (id) => {
    const open = openMod(id), n = MOD[id], ls = lessonsOf(id);
    const link = id === "kickoff" ? `<a class="btn dark" href="${BOOK}agents">Open in the book</a>` : open ? `<a class="btn dark" href="${BOOK}act-${id}">Open Module ${n} in the book</a>` : `<a class="btn" href="/register">Enroll to unlock</a>`;
    return `<details class="mod ${open ? "open" : "locked"}" id="m-${id}">
      <summary><span class="n">${n}</span><span class="t"><b>${esc(plainName(id))}</b><small>${dayLbl(id)} · ${esc(plainQ(id))}</small></span><span class="st"><span class="ms">${open ? "lock_open" : "lock"}</span>${open ? "Open" : "Locked"}</span><span class="ms chev">expand_more</span></summary>
      <div class="body">
        <p class="story"><b>The story:</b> ${esc(storyOf(id))}</p>
        <ol class="ls">${ls.map((l, i) => `<li><span class="ln">${n}.${l.day === "Every week" ? "+" : i + 1}</span><div><b>${esc(l.t)}</b>${l.day ? ` <em>${l.day}</em>` : ""}<p>${l.d}</p>${(l.ex || []).length ? `<details class="ex"><summary>In the example</summary><ul>${l.ex.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></details>` : ""}</div></li>`).join("")}</ol>
        <div class="foot"><div class="chips"><span class="lbl">You'll make</span>${makesOf(id).map((m) => `<span>${esc(m)}</span>`).join("")}</div>${link}</div>
      </div></details>`;
  };

  const H = [];
  /* hero: the headline and the one-liners */
  H.push(`<section class="hero">
    <span class="kicker">Node · 30-day course · project-based</span>
    <h1>${esc(HL.title || "Develop apps end to end with agentic AI")}.</h1>
    <p class="sub">${esc(HL.sub || "")}</p>
    <div class="lines">${(HL.lines || []).map(([ic, t, d]) => `<div><span class="ms">${ic}</span><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div>
    <div class="cta"><a class="btn" href="/register">Enroll · ${esc(FEE.amount)}</a><a class="btn line" href="#modules">See the 10 modules</a><a class="btn line" href="${BOOK}act-discover">Try Module 1 free</a></div>
  </section>`);

  /* the fee */
  H.push(`<section class="sec fee" id="fee"><div><span class="kicker">The fee</span><h2>${esc(FEE.amount)} <small>one-time</small></h2><p class="lead2">${esc(FEE.note)}.</p></div><ul>${(FEE.includes || []).map((x) => `<li><span class="ms">check_circle</span>${esc(x)}</li>`).join("")}</ul><a class="btn" href="/register">Enroll · ${esc(FEE.amount)}</a></section>`);

  /* how it works, in one strip */
  H.push(`<section class="sec"><h2>How it works</h2>
    <ol class="how">
      <li><span class="ms">apps</span><b>Pick your app</b><span>One real app — you build it all month.</span></li>
      <li><span class="ms">content_paste</span><b>Copy the workflow</b><span>Paste the ready prompt into your AI — or tune it your way.</span></li>
      <li><span class="ms">groups</span><b>Let agents work</b><span>They research, plan, code and test. You check and decide.</span></li>
      <li><span class="ms">rocket_launch</span><b>Ship and get certified</b><span>Deploy your app and earn your certificates.</span></li>
    </ol></section>`);

  /* the modules, one collapsible list */
  H.push(`<section class="sec" id="modules"><div class="hd"><h2>The 10 modules</h2><button class="btn line sm" id="toggleAll">Open all</button></div><p class="lead2">Tap a module to see its lessons. Modules 0 and 1 are open now.</p>
    <div class="weeks">${WEEKS.map(([w, t, ids]) => `<div><div class="week"><b>${w}</b><span>${t}</span></div>${ids.map(modRow).join("")}</div>`).join("")}</div></section>`);

  /* tools and certificates, side by side */
  if (CL.access) H.push(`<section class="sec duo">
    <div id="tools"><h2>Your AI tools</h2><p class="lead2">Get Claude's flagship models — pick one path.</p>
      <ol class="mini">${CL.access.map(([ic, t, d]) => `<li><span class="ms">${ic}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join("")}</ol><p class="small">${esc(CL.note)}</p></div>
    <div id="certs"><h2>Your certificates</h2><p class="lead2">Proof of what you can do.</p>
      <ol class="mini"><li><span class="ms">workspace_premium</span><div><b>Node certificate</b><span>Pass every checkpoint and present your app.</span></div></li>${CL.certs.map(([ic, t, d, when, url]) => `<li><span class="ms">${ic}</span><div><b>${esc(t)}</b><span>${esc(d)} <a href="${url}" target="_blank" rel="noopener">Details</a></span></div></li>`).join("")}</ol>
      <p class="small">Claude Academy and the Claude Certification Program are run by Anthropic. Node prepares you; Anthropic issues the Claude certificates and certifications.</p></div>
  </section>`);

  /* the extras, folded away */
  H.push(`<section class="sec"><h2>Good to know</h2>
    <details class="fold"><summary>New to all this? Four quick answers</summary><div class="qa">
      <div><b>What does "end to end" mean?</b><p>Everything from working out what to build (requirements) to putting it live for users (deployment) — and keeping it running.</p></div>
      <div><b>What's an AI agent?</b><p>An AI assistant (like Claude) that does real work when you give it clear instructions. Node gives you those instructions, ready to copy.</p></div>
      <div><b>Do I need to code, or a team?</b><p>No. Your agents write much of the code and act as your team; you learn to direct them and check their work.</p></div>
      <div><b>What do I need?</b><p>A computer, internet, an AI account (free to start), an app idea, and a little time each day.</p></div></div></details>
    ${C.example ? `<details class="fold"><summary>The example app we follow</summary><p>${esc(C.example)} Each module shows what happens to it — then you do the same with your own app.</p></details>` : ""}
    <details class="fold"><summary>Words you'll hear</summary><div class="gloss">${(C.glossary || []).map(([t, d]) => `<div><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div></details>
  </section>`);

  /* finish */
  H.push(`<section class="finish"><h2>In 30 days, you'll have shipped an app.</h2><p>End to end, with agents as your team — plus a portfolio and certificates to prove it. ${esc(FEE.amount)} one-time, everything included.</p>
    <div class="cta"><a class="btn" href="/register">Enroll · ${esc(FEE.amount)}</a><a class="btn line light" href="${BOOK}act-discover">Try Module 1 free</a><a class="btn line light" href="../overview/index.html">Full overview</a></div></section>`);

  $("#course").innerHTML = H.join("");
  $("#toggleAll").addEventListener("click", (e) => {
    const ds = [...document.querySelectorAll("details.mod")], open = !ds.every((d) => d.open);
    ds.forEach((d) => (d.open = open)); e.currentTarget.textContent = open ? "Close all" : "Open all";
  });
  /* links to a module or section open it */
  const openHash = () => { const el = location.hash && document.querySelector(location.hash); if (el && el.tagName === "DETAILS") el.open = true; };
  addEventListener("hashchange", openHash); openHash();
})();
