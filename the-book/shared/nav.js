/* Node pages, in sequence — one shared navigation for every page in the-book.
 * The interactive roadmap is the start; each page knows its place, links to the previous and next one,
 * and shows the whole sequence. Include with: <script src="../shared/nav.js" defer></script>
 * Links are built from this script's own address, so they work from disk (file://) and on any host. */
(() => {
  "use strict";
  const BASE = new URL("../", (document.currentScript && document.currentScript.src) || location.href).href; // the-book/
  const PAGES = [
    { id: "program", title: "Interactive roadmap", icon: "map", blurb: "Start here: the 30-day journey, act by act, and what you get." },
    { id: "course", title: "Course outline", icon: "list_alt", blurb: "The same journey in plain words, module by module." },
    { id: "overview", title: "Program overview", icon: "article", blurb: "Everything Node covers: features, subjects and outcomes." },
    { id: "sdlc", title: "The book", icon: "menu_book", blurb: "Act I, open in full: maps, contracts, prompts and agent kits." },
    { id: "pitch", title: "Pitch deck", icon: "slideshow", blurb: "Node in one deck: present it to anyone." },
  ].map((p) => ({ ...p, path: `${BASE}${p.id}/index.html` }));
  /* the page's folder: …/program/index.html, …/program/ → "program" */
  const dir = location.pathname.replace(/\/index\.html$/, "/").split("/").filter(Boolean).pop() || "program";
  const here = PAGES.findIndex((p) => p.id === dir);
  if (here < 0) return;
  const cur = PAGES[here], prev = PAGES[here - 1], next = PAGES[here + 1], N = PAGES.length;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const isDeck = cur.id === "pitch";

  const css = `
  .nsq-ms { font-family: "Material Symbols Outlined"; font-weight: normal; font-style: normal; font-size: 20px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; -webkit-font-feature-settings: "liga"; font-feature-settings: "liga"; }
  .nsq-foot { position: relative; background: #0d1117; color: #fff; padding: clamp(48px, 7vw, 88px) 20px; font-family: "Geist", ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
  .nsq-foot::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }
  .nsq-in { position: relative; max-width: 1180px; margin: 0 auto; }
  .nsq-eb { display: inline-flex; align-items: center; gap: 10px; font: 700 12px "Geist Mono", ui-monospace, monospace; letter-spacing: .2em; text-transform: uppercase; color: #4fd1c5; }
  .nsq-eb::before { content: ""; width: 26px; height: 2px; background: currentColor; }
  .nsq-foot h2 { margin: 14px 0 28px; font: 900 clamp(2rem, 4.4vw, 3.6rem)/.95 "Montserrat", sans-serif; text-transform: uppercase; letter-spacing: -.045em; color: #fff; }
  .nsq-foot h2 span { color: #e91e63; }
  .nsq-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(${N}, 1fr); gap: 12px; counter-reset: nsq; }
  .nsq-steps a { position: relative; display: grid; gap: 8px; height: 100%; padding: 18px; border-radius: 20px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); color: #fff; text-decoration: none; transition: transform .3s cubic-bezier(.22,1,.36,1), border-color .3s, background .3s; }
  .nsq-steps a:hover { transform: translateY(-4px); border-color: #e91e63; background: rgba(233,30,99,.08); }
  .nsq-steps a::after { content: ""; position: absolute; top: 37px; right: -13px; width: 14px; height: 2px; background: rgba(255,255,255,.18); }
  .nsq-steps li:last-child a::after { display: none; }
  .nsq-n { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; font: 900 15px "Montserrat", sans-serif; background: rgba(255,255,255,.08); color: #4fd1c5; }
  .nsq-steps .cur a { background: #e91e63; border-color: #e91e63; }
  .nsq-steps .cur .nsq-n { background: #fff; color: #e91e63; }
  .nsq-steps .done .nsq-n { background: rgba(79,209,197,.16); }
  .nsq-steps b { font: 900 15px/1.15 "Montserrat", sans-serif; text-transform: uppercase; letter-spacing: -.01em; }
  .nsq-steps p { margin: 0; font-size: 13.5px; line-height: 1.45; color: rgba(255,255,255,.62); }
  .nsq-steps .cur p { color: rgba(255,255,255,.85); }
  .nsq-tag { font: 700 10px "Geist Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.45); }
  .nsq-steps .cur .nsq-tag { color: #fff; }
  .nsq-pn { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; margin-top: 28px; }
  .nsq-btn { display: inline-flex; align-items: center; gap: 10px; padding: 16px 26px; border-radius: 999px; font: 900 13px "Geist", sans-serif; letter-spacing: .12em; text-transform: uppercase; text-decoration: none; background: #e91e63; color: #fff; box-shadow: 0 18px 40px -14px rgba(233,30,99,.6); transition: transform .25s; }
  .nsq-btn:hover { transform: translateX(4px); }
  .nsq-btn.ghost { background: transparent; box-shadow: inset 0 0 0 2px rgba(255,255,255,.3); }
  .nsq-btn.ghost:hover { transform: translateX(-4px); }
  @media (max-width: 900px) { .nsq-steps { grid-template-columns: 1fr; gap: 8px; } .nsq-steps a { grid-template-columns: 38px 1fr; align-items: center; column-gap: 14px; padding: 12px 14px; } .nsq-steps a > :not(.nsq-n) { grid-column: 2; } .nsq-n { grid-row: span 3; } .nsq-steps a::after { display: none; } .nsq-steps p { display: none; } .nsq-btn { padding: 14px 20px; } }

  .nsq-pill { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 400; display: flex; align-items: center; gap: 2px; padding: 5px; border-radius: 999px; background: rgba(13,17,23,.92); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.1); box-shadow: 0 18px 40px -16px rgba(0,0,0,.6); font-family: "Geist", ui-sans-serif, system-ui, sans-serif; color: #fff; }
  .nsq-pill a, .nsq-pill button { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px; border: 0; border-radius: 999px; background: none; color: #fff; font: 700 12.5px "Geist", sans-serif; text-decoration: none; cursor: pointer; white-space: nowrap; }
  .nsq-pill a:hover, .nsq-pill button:hover { background: rgba(255,255,255,.1); }
  .nsq-pill .dis { opacity: .3; pointer-events: none; }
  .nsq-pill .mid i { font: 800 11px "Geist Mono", monospace; font-style: normal; color: #4fd1c5; }
  .nsq-menu { position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); width: 280px; padding: 8px; border-radius: 18px; background: #0d1117; border: 1px solid rgba(255,255,255,.12); box-shadow: 0 30px 60px -20px rgba(0,0,0,.7); display: none; }
  .nsq-pill.open .nsq-menu { display: grid; gap: 2px; }
  .nsq-menu a { height: auto; padding: 10px 12px; border-radius: 12px; justify-content: flex-start; gap: 10px; font-size: 13.5px; }
  .nsq-menu a i { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font: 800 11px "Geist Mono", monospace; font-style: normal; background: rgba(255,255,255,.08); color: #4fd1c5; flex: none; }
  .nsq-menu a.cur { background: #e91e63; } .nsq-menu a.cur i { background: #fff; color: #e91e63; }
  .nsq-menu span.hd { padding: 8px 12px 6px; font: 700 10px "Geist Mono", monospace; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.45); }
  @media (max-width: 640px) { .nsq-pill .lbl { display: none; } ${isDeck ? ".nsq-pill { display: none; }" : ""} }
  ${isDeck ? "" : "body { padding-bottom: 72px; }"}
  @media print { .nsq-pill, .nsq-foot { display: none; } }`;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* the sequence block: on the roadmap it sits right under the roadmap outline; elsewhere at the end of the page */
  if (!isDeck && cur.id !== "sdlc") {
    const sec = document.createElement("section");
    sec.className = "nsq-foot";
    sec.setAttribute("aria-label", "Node pages, in order");
    sec.innerHTML = `<div class="nsq-in">
      <span class="nsq-eb">Explore Node · page ${here + 1} of ${N}</span>
      <h2>${here === 0 ? 'Everything, <span>in order.</span>' : next ? `Up next: <span>${esc(next.title)}.</span>` : 'You\'ve seen <span>it all.</span>'}</h2>
      <ol class="nsq-steps">${PAGES.map((p, i) => `<li class="${i === here ? "cur" : i < here ? "done" : ""}"><a href="${p.path}"${i === here ? ' aria-current="page"' : ""}><span class="nsq-n">${i < here ? '<span class="nsq-ms" style="font-size:18px">check</span>' : i + 1}</span><span class="nsq-tag">${i === here ? "You are here" : i === 0 ? "Start" : "Page " + (i + 1)}</span><b>${esc(p.title)}</b><p>${esc(p.blurb)}</p></a></li>`).join("")}</ol>
      <div class="nsq-pn">${prev ? `<a class="nsq-btn ghost" href="${prev.path}"><span class="nsq-ms">arrow_back</span>${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a class="nsq-btn" href="${next.path}">Next: ${esc(next.title)}<span class="nsq-ms">arrow_forward</span></a>` : `<a class="nsq-btn" href="${PAGES[0].path}">Back to the start<span class="nsq-ms">restart_alt</span></a>`}</div>
    </div>`;
    const anchor = cur.id === "program" ? document.getElementById("roadmap") : null;
    if (anchor) anchor.after(sec);
    else { const foot = document.querySelector("body > footer"); foot ? foot.before(sec) : document.body.appendChild(sec); }
  }

  /* the floating pill: previous · where you are (opens the full list) · next */
  const pill = document.createElement("nav");
  pill.className = "nsq-pill";
  pill.setAttribute("aria-label", "Node pages");
  pill.innerHTML = `<a class="${prev ? "" : "dis"}" href="${prev ? prev.path : "#"}" title="${prev ? "Previous: " + esc(prev.title) : ""}"><span class="nsq-ms">chevron_left</span></a>
    <button class="mid" type="button" aria-expanded="false"><i>${here + 1}/${N}</i><span class="lbl">${esc(cur.title)}</span><span class="nsq-ms" style="font-size:18px">expand_less</span></button>
    <a class="${next ? "" : "dis"}" href="${next ? next.path : "#"}" title="${next ? "Next: " + esc(next.title) : ""}"><span class="lbl">${next ? esc(next.title) : ""}</span><span class="nsq-ms">chevron_right</span></a>
    <div class="nsq-menu"><span class="hd">Node, in order</span>${PAGES.map((p, i) => `<a class="${i === here ? "cur" : ""}" href="${p.path}"><i>${i + 1}</i>${esc(p.title)}</a>`).join("")}</div>`;
  document.body.appendChild(pill);
  const mid = pill.querySelector(".mid");
  mid.addEventListener("click", (e) => { e.stopPropagation(); const o = pill.classList.toggle("open"); mid.setAttribute("aria-expanded", String(o)); });
  document.addEventListener("click", (e) => { if (!pill.contains(e.target)) { pill.classList.remove("open"); mid.setAttribute("aria-expanded", "false"); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") pill.classList.remove("open"); });
})();
