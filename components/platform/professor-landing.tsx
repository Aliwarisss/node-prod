"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

import { ProfessorIntro } from "./professor-intro";

/* The Professor — Node's coming advisor agent. A public teaser in heist colours: jumpsuit red, black and white.
   The scene: a dark room, a swinging lamp, the plan pinned to the wall with red string — and the Professor himself,
   drawn as a silhouette in fine ink lines: hair strands, a full beard, thin square glasses he's pushing up with one
   finger, a red tie and pocket square. */
const RED = "#e3051b", INK = "#070707", WHITE = "#f5f1ea";
const LINES = ["Coming to connect you soon…", "Studying your plan.", "Reading every lesson of the month.", "Preparing your first briefing.", "He never improvises. He prepares."];

function useTypewriter(lines: string[]) {
  const [s, setS] = useState({ i: 0, n: 0, del: false });
  useEffect(() => {
    const line = lines[s.i];
    const t = window.setTimeout(() => setS((c) => (!c.del && c.n < line.length ? { ...c, n: c.n + 1 } : !c.del ? { ...c, del: true } : c.n > 0 ? { ...c, n: c.n - 1 } : { i: (c.i + 1) % lines.length, n: 0, del: false })), !s.del && s.n === line.length ? 2200 : s.del ? 26 : 55);
    return () => window.clearTimeout(t);
  }, [s, lines]);
  return lines[s.i].slice(0, s.n);
}

/* ---------- the scene ---------- */
function Scene() {
  return (
    <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" role="img" aria-label="The Professor in silhouette, pushing up his glasses, under a swinging lamp in front of a plan pinned to the wall">
      <defs>
        <radialGradient id="pl-room" cx="50%" cy="22%" r="80%"><stop offset="0" stopColor="#6b0a14" /><stop offset=".42" stopColor="#2a0408" /><stop offset="1" stopColor={INK} /></radialGradient>
        <linearGradient id="pl-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff0cf" stopOpacity=".6" /><stop offset=".55" stopColor="#ffd98a" stopOpacity=".14" /><stop offset="1" stopColor="#ffd98a" stopOpacity="0" /></linearGradient>
        <radialGradient id="pl-bulb"><stop offset="0" stopColor="#fff8e4" /><stop offset=".4" stopColor="#ffd98a" stopOpacity=".7" /><stop offset="1" stopColor="#ffd98a" stopOpacity="0" /></radialGradient>
        <radialGradient id="pl-vig" cx="50%" cy="42%" r="72%"><stop offset=".5" stopColor={INK} stopOpacity="0" /><stop offset="1" stopColor={INK} stopOpacity=".96" /></radialGradient>
        <pattern id="pl-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke={RED} strokeOpacity=".1" strokeWidth="1" /></pattern>
        <linearGradient id="pl-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1e0b0d" /><stop offset="1" stopColor="#040404" /></linearGradient>
        <clipPath id="pl-lens"><rect x="568" y="306" width="27" height="14" /><rect x="605" y="306" width="27" height="14" /></clipPath>
        <radialGradient id="pl-halo"><stop offset="0" stopColor="#e3051b" stopOpacity=".32" /><stop offset=".55" stopColor="#e3051b" stopOpacity=".1" /><stop offset="1" stopColor="#e3051b" stopOpacity="0" /></radialGradient>
        <filter id="pl-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>
      <rect width="1200" height="640" fill="url(#pl-room)" />

      {/* the plan */}
      <g>
        <rect x="90" y="60" width="1020" height="390" rx="6" fill="#140608" stroke="#3a0c12" />
        <rect x="90" y="60" width="1020" height="390" rx="6" fill="url(#pl-grid)" />
        <g fill="none" stroke={RED} strokeOpacity=".3" strokeWidth="1.5">
          <path d="M760 100h300v150h-120v80h-180z" /><path d="M820 100v90h80M940 190v60M760 210h60" /><circle cx="1000" cy="290" r="22" /><path d="M780 290h70v40" />
          <path d="M140 300h180v120H140zM200 300v120M140 360h60" />
        </g>
        {[
          { x: 150, y: 100, w: 120, h: 86, r: -4, label: "DISCOVER" },
          { x: 320, y: 140, w: 110, h: 80, r: 3, label: "PLAN" },
          { x: 470, y: 92, w: 96, h: 120, r: -2, label: "" },
          { x: 640, y: 100, w: 92, h: 120, r: 4, label: "" },
          { x: 360, y: 296, w: 120, h: 84, r: -3, label: "BUILD" },
          { x: 820, y: 330, w: 118, h: 82, r: 2, label: "RELEASE" },
          { x: 960, y: 120, w: 100, h: 72, r: -5, label: "DAY 30" },
        ].map((p, i) => (
          <g key={i} transform={`rotate(${p.r} ${p.x + p.w / 2} ${p.y + p.h / 2})`}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={WHITE} opacity={p.label ? 0.15 : 0.08} />
            {p.label ? <><rect x={p.x + 10} y={p.y + p.h - 22} width={p.w - 20} height="2" fill={WHITE} opacity=".2" /><rect x={p.x + 10} y={p.y + p.h - 32} width={p.w - 40} height="2" fill={WHITE} opacity=".15" /><text x={p.x + 10} y={p.y + 24} fill={WHITE} opacity=".6" fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="700" letterSpacing="2">{p.label}</text></>
              : <><circle cx={p.x + p.w / 2} cy={p.y + p.h * 0.42} r={p.w * 0.22} fill={WHITE} opacity=".1" /><rect x={p.x + p.w * 0.2} y={p.y + p.h * 0.72} width={p.w * 0.6} height="12" rx="6" fill={WHITE} opacity=".08" /></>}
          </g>
        ))}
        <polyline className="pf-string" points="210,108 375,148 518,100 686,108 1010,128 879,338 420,304 210,108" fill="none" stroke={RED} strokeWidth="2.2" />
        <polyline className="pf-string" points="518,100 420,304" fill="none" stroke={RED} strokeWidth="2" strokeOpacity=".75" style={{ animationDelay: ".7s" }} />
        {[[210, 108], [375, 148], [518, 100], [686, 108], [1010, 128], [879, 338], [420, 304]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill={RED} stroke="#4a050b" strokeWidth="2" />)}
      </g>

      {/* the lamp */}
      <g className="pf-swing">
        <g className="pf-flicker">
          <polygon points="578,168 622,168 880,640 320,640" fill="url(#pl-cone)" />
          <circle cx="600" cy="172" r="62" fill="url(#pl-bulb)" />
        </g>
        <line x1="600" y1="0" x2="600" y2="132" stroke="#262626" strokeWidth="3" />
        <path d="M572 132h56l22 40h-100z" fill="#121212" stroke="#2b2b2b" />
        <path d="M572 132h56l22 40h-100z" fill={RED} opacity=".22" />
      </g>

      {/* a red halo behind him, so the silhouette lifts off the wall */}
      <circle cx="600" cy="380" r="270" fill="url(#pl-halo)" />

      {/* the Professor, as a silhouette — one solid figure with a traced outline, detailed in fine ink lines:
          side-parted hair, a full beard, the glasses lit by the lamp, a finger pushing them up at the bridge */}
      <g className="pf-breathe" strokeLinejoin="miter" strokeLinecap="round">
        <g fill="#070505">
          {/* jacket, neck and head (hair, ears, beard) — one silhouette */}
          <polygon points="396,640 412,552 440,486 452,470 494,446 556,420 582,404 618,404 644,420 706,446 748,470 760,486 788,552 804,640" />
          <polygon points="580,376 620,376 624,408 576,408" />
          <polygon points="558,322 552,320 550,310 552,302 558,300 557,290 555,278 556,266 560,258 566,252 574,248 580,248 584,243 592,238 600,235 604,230 609,234 616,233 628,236 638,242 645,250 649,258 653,262 649,265 650,272 652,277 648,280 648,288 645,296 642,300 648,302 650,310 648,320 642,322 642,336 640,348 643,351 638,354 635,360 628,370 630,374 624,375 620,378 611,384 600,386 589,384 587,388 583,383 580,378 572,370 565,360 560,348 558,336" />
        </g>

        {/* shirt collar, tie and pocket square */}
        <polygon points="583,403 596,425 600,410" fill="#4e483f" />
        <polygon points="617,403 604,425 600,410" fill="#6e665b" />
        <polygon points="595,414 605,414 609,432 600,492 591,432" fill="#3a060b" />
        <polygon points="600,432 609,432 600,492" fill="#55080f" />
        <polygon points="595,414 605,414 603,425 597,425" fill="#6e0a13" />
        <polygon points="656,488 674,478 679,490 666,495" fill="#e3051b" />

        {/* ink lines: the jacket */}
        <g fill="none" stroke="#c9b28a" strokeOpacity=".32" strokeWidth="1.2">
          <polyline points="582,404 548,474 566,482 556,502 600,562" />
          <polyline points="618,404 652,474 634,482 644,502 600,562" />
          <polyline points="600,562 600,640" />
          <polyline points="650,494 686,480" />
          <polyline points="494,446 502,474" /><polyline points="706,446 698,474" />
          <polyline points="748,470 756,520" />
          <polyline points="720,520 744,600" strokeOpacity=".18" />
        </g>
        <g fill="#c9b28a" fillOpacity=".4"><rect x="597" y="578" width="6" height="6" /><rect x="597" y="606" width="6" height="6" /></g>

        {/* ink lines: hair strands, brows, ears, nose, cheeks, beard */}
        <g fill="none" stroke="#d8c3a0" strokeWidth="1">
          <g strokeOpacity=".32">
            <polyline points="580,248 594,242 612,240 630,244 644,254" />
            <polyline points="584,254 600,248 618,248 636,254 646,264" />
            <polyline points="580,248 574,256 566,262" />
            <polyline points="566,262 561,276 560,290" />
            <polyline points="640,262 644,276 643,290" />
            <polyline points="592,238 604,236 618,237" strokeOpacity=".22" />
          </g>
          <g strokeOpacity=".5" strokeWidth="1.8"><polyline points="568,300 582,297 594,299" /><polyline points="606,299 618,297 632,300" /></g>
          <g strokeOpacity=".3"><polyline points="553,305 552,312 555,318" /><polyline points="647,305 648,312 645,318" /></g>
          <g strokeOpacity=".4"><polyline points="602,324 604,336 600,339" /><polyline points="594,339 600,339 607,337" /></g>
          <g strokeOpacity=".42" strokeWidth="1.3"><polyline points="610,340 620,346" /></g>
          <g strokeOpacity=".22"><polyline points="566,322 572,332" /><polyline points="634,322 628,332" /></g>
          <g strokeOpacity=".3">
            <path d="M563 340 l2 7M567 351 l3 7M574 361 l3 6M582 369 l2 6M591 374 l1 6M600 376 v6M609 374 l-1 6M618 369 l-2 6M626 361 l-3 6M633 351 l-3 7M637 340 l-2 7M614 356 l-2 6M622 348 l-2 6" />
          </g>
          <polyline points="558,336 560,348 565,360 572,370 580,378 589,384 600,386 611,384 620,378 628,370 635,360 640,348 642,336" strokeOpacity=".16" />
        </g>

        {/* the glasses — lit by the lamp, the eyes just catching the light behind them */}
        <polygon points="571,308 586,308 571,318" fill="#ffd98a" opacity=".22" />
        <polygon points="608,308 623,308 608,318" fill="#ffd98a" opacity=".3" />
        <rect x="582" y="312" width="2.5" height="2.5" fill="#f2e6cf" opacity=".8" />
        <rect x="618" y="312" width="2.5" height="2.5" fill="#f2e6cf" opacity=".8" />
        <g fill="none" stroke="#f2e6cf" strokeOpacity=".95" strokeWidth="1.8" strokeLinecap="square">
          <rect x="568" y="306" width="27" height="14" /><rect x="605" y="306" width="27" height="14" /><polyline points="595,311 600,309 605,311" /><polyline points="568,310 557,306" /><polyline points="632,310 643,306" />
        </g>
        <g clipPath="url(#pl-lens)"><rect className="pf-glint" x="578" y="298" width="9" height="30" fill="#fff" opacity=".75" transform="skewX(-20)" /></g>

        {/* the raised arm, a shade lighter than the jacket so it reads in front of it; the hand at the face */}
        <polygon points="456,480 512,456 550,566 504,592" fill="#0b0807" />
        <polygon points="502,596 552,570 606,368 568,350" fill="#0e0b0a" />
        <polygon points="560,352 604,368 601,376 556,360" fill="#151210" />
        <polygon points="566,352 570,334 582,322 598,318 612,326 612,348 596,362" fill="#0e0b0a" />
        <polygon points="597,324 600,309 606,310 605,326" fill="#0e0b0a" />
        <g fill="none" stroke="#d8c3a0" strokeWidth="1.1">
          <polyline points="552,570 606,368" strokeOpacity=".28" />
          <polyline points="560,352 604,368" strokeOpacity=".45" /><polyline points="556,360 601,376" strokeOpacity=".3" />
          <polygon points="566,352 570,334 582,322 598,318 612,326 612,348 596,362" strokeOpacity=".42" />
          <polyline points="582,332 597,329 610,333" strokeOpacity=".38" />
          <polyline points="586,334 584,350" strokeOpacity=".26" /><polyline points="595,333 593,352" strokeOpacity=".26" /><polyline points="604,334 603,352" strokeOpacity=".26" />
          <polyline points="566,352 560,342 564,336 572,344" strokeOpacity=".36" />
          <polyline points="597,324 600,309 606,310 605,326" strokeOpacity=".4" />
          <polyline points="530,522 550,514" strokeOpacity=".22" /><polyline points="540,488 558,482" strokeOpacity=".22" /><polyline points="520,552 540,544" strokeOpacity=".22" />
          <polyline points="512,456 550,566" strokeOpacity=".14" />
        </g>

        {/* light: the lamp's warm key along the top edges, a red rim from behind along the sides */}
        <g fill="none" strokeWidth="2.2">
          <polyline stroke="#ffe3a8" strokeOpacity=".65" points="556,266 560,258 566,252 574,248 580,248 584,243 592,238 600,235 604,230 609,234 616,233 628,236 638,242 645,250 649,258" />
          <polyline stroke="#ffd98a" strokeOpacity=".55" points="502,596 568,350" />
          <polyline stroke="#ffd98a" strokeOpacity=".6" strokeWidth="1.6" points="570,334 582,322 598,318 600,309 606,310" />
          <polyline stroke="#ffd98a" strokeOpacity=".32" points="440,486 452,470 494,446 556,420 582,404" />
          <polyline stroke="#ffd98a" strokeOpacity=".5" points="760,486 748,470 706,446 644,420 618,404" />
          <polyline stroke="#e3051b" strokeOpacity=".7" points="649,258 653,262 649,265 650,272 652,277 648,280 648,288 645,296 642,300 648,302 650,310 648,320 642,322 642,336 640,348 643,351 638,354 635,360 628,370 630,374 624,375 620,378 611,384 600,386" />
          <polyline stroke="#e3051b" strokeOpacity=".45" points="589,384 587,388 583,383 580,378 572,370 565,360 560,348 558,336 558,322 552,320 550,310 552,302 558,300 557,290 555,278 556,266" />
          <polyline stroke="#e3051b" strokeOpacity=".75" strokeWidth="3" points="396,640 412,552 440,486" />
          <polyline stroke="#e3051b" strokeOpacity=".75" strokeWidth="3" points="804,640 788,552 760,486" />
        </g>
      </g>

      {/* the desk */}
      <path d="M0 585 L1200 585 L1200 640 L0 640 Z" fill="url(#pl-desk)" />
      <line x1="0" y1="585" x2="1200" y2="585" stroke="#ffd98a" strokeOpacity=".2" />
      <g transform="translate(250 498)" fill="#070707" stroke="#ffd98a" strokeOpacity=".28"><path d="M8 87 h44 v-10 h-6 l-4 -22 c10 -6 14 -18 10 -30 c-4 -14 -16 -22 -30 -20 l-6 -6 l-4 10 c-8 4 -12 12 -12 20 l12 6 c4 -2 8 -2 10 2 l-12 18 l-4 22 h-8 z" /></g>
      <g transform="rotate(-6 860 570)"><rect x="800" y="556" width="130" height="24" fill={WHITE} opacity=".1" /><rect x="812" y="548" width="120" height="22" fill={WHITE} opacity=".08" /></g>
      <g transform="translate(960 528)"><rect x="0" y="30" width="96" height="30" rx="10" fill="#7c0912" /><path d="M6 30 C10 8 30 0 48 0 C66 0 86 8 90 30 Z" fill="#a10b17" /><rect x="-4" y="-4" width="104" height="16" rx="8" fill={RED} /><circle cx="48" cy="44" r="10" fill="#4a060d" stroke={WHITE} strokeOpacity=".25" /></g>
      <rect width="1200" height="640" filter="url(#pl-grain)" opacity=".07" />
      <rect width="1200" height="640" fill="url(#pl-vig)" />
    </svg>
  );
}

/* the title, stamped — white on a red slab, roughed up like an old print */
function Title({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-grid", className)}>
      <svg className="absolute h-0 w-0" aria-hidden><filter id="pl-stamp"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="4" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 2.15" /><feComposite in="SourceGraphic" operator="in" /></filter></svg>
      <span className="pf-title font-heading font-black uppercase leading-[0.82] tracking-[-0.02em]" style={{ color: WHITE, filter: "url(#pl-stamp)", textShadow: "0 6px 40px rgba(0,0,0,.6)" }}>The<br className="sm:hidden" /> Professor</span>
    </span>
  );
}

/* ---------- the page ---------- */
export function ProfessorLanding() {
  const typed = useTypewriter(LINES);
  const [wait, setWait] = useState<{ count: number; joined: boolean; signedIn: boolean } | null>(null);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  /* the opening plays as the page loads (never with reduced motion); it can be replayed */
  const [intro, setIntro] = useState<"play" | "done">("play");
  const [run, setRun] = useState(0);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setIntro("done");
    });
    return () => window.cancelAnimationFrame(id);
  }, []);
  const endIntro = () => setIntro("done");
  useEffect(() => {
    let live = true;
    fetch("/api/professor").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!live || !d) return;
      let local = false;
      try { local = localStorage.getItem("node:professor-joined") === "1"; } catch { /* no storage */ }
      setWait({ ...d, joined: d.joined || local });
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  async function join(e?: FormEvent) {
    e?.preventDefault();
    setErr(""); setBusy(true);
    const r = await fetch("/api/professor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(wait?.signedIn ? {} : { email }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok) { setWait(d); try { localStorage.setItem("node:professor-joined", "1"); } catch { /* no storage */ } } else setErr(d.error ?? "Couldn’t add you — try again.");
    setBusy(false);
  }

  const cta = (
    <div className="grid gap-2">
      {wait?.joined ? (
        <span className="flex w-fit items-center gap-2 rounded-full border px-5 py-3 text-[13px] font-black uppercase tracking-[0.1em]" style={{ borderColor: `${WHITE}55`, color: WHITE }}><MaterialSymbol className="text-[18px]" filled name="notifications_active" />You’re on the list</span>
      ) : wait?.signedIn ? (
        <button type="button" disabled={busy} onClick={() => void join()} className="pf-pulse flex w-fit items-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-black uppercase tracking-[0.12em] text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60" style={{ background: RED }}><MaterialSymbol className="text-[18px]" name="notifications" />Tell me when he arrives</button>
      ) : (
        <form onSubmit={(e) => void join(e)} className="flex w-full max-w-md flex-wrap gap-2 sm:flex-nowrap">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" aria-label="Your email" className="h-12 min-w-0 flex-1 rounded-full border bg-black/40 px-5 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-white" style={{ borderColor: `${WHITE}33` }} />
          <button type="submit" disabled={busy || !wait} className="pf-pulse h-12 rounded-full px-6 text-[12.5px] font-black uppercase tracking-[0.12em] text-white disabled:opacity-60" style={{ background: RED }}>{busy ? "…" : "Notify me"}</button>
        </form>
      )}
      {err ? <span className="text-[12.5px] font-semibold text-[#ff8a95]">{err}</span> : null}
      {wait ? <span className="text-[12.5px]" style={{ color: `${WHITE}80` }}>{wait.count > 0 ? `${wait.count.toLocaleString("en-US")} ${wait.count === 1 ? "person is" : "people are"} waiting for the briefing` : "Be the first to know"}</span> : null}
    </div>
  );

  return (
    <main style={{ background: INK, color: WHITE }} className="min-h-screen overflow-hidden">
      {intro === "play" ? <ProfessorIntro key={run} onDone={endIntro} /> : null}
      {/* ---------- hero: the scene, the title ---------- */}
      <section className="relative isolate min-h-[100svh]">
        <Scene />
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: 22 }, (_, i) => <span key={i} className="pf-dust absolute size-[3px] rounded-full bg-[#ffe9b8]" style={{ left: `${36 + ((i * 37) % 28)}%`, top: `${50 + ((i * 53) % 40)}%`, ["--d" as string]: `${7 + (i % 5) * 1.6}s`, ["--w" as string]: `${(i * 0.7) % 6}s`, ["--dx" as string]: `${(i % 2 ? 1 : -1) * (10 + (i % 4) * 8)}px` }} />)}
          <div className="pf-scan absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#070707] via-[#070707]/85 to-transparent" />
        <div className={cn("relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end gap-5 px-5 pb-10 pt-28 sm:px-8", intro === "done" ? "pf-reveal" : "opacity-0")}>
          <span className="flex w-fit items-center gap-2 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-white" style={{ background: RED }}>A Node original · Part one</span>
          <h1><Title className="text-[clamp(3.2rem,9.5vw,8.6rem)]" /></h1>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex min-h-[32px] items-center gap-1 font-mono text-[18px] sm:text-[22px]" aria-live="polite"><span>{typed}</span><span className="pf-caret inline-block h-[1.1em] w-[0.55em]" style={{ background: RED }} /></p>
            <button type="button" onClick={() => { setRun((r) => r + 1); setIntro("play"); }} className="flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-white/10" style={{ borderColor: `${WHITE}40`, color: `${WHITE}cc` }}><MaterialSymbol className="text-[17px]" name="replay" />Replay the briefing</button>
          </div>
        </div>
      </section>

      {/* ---------- the pitch and the sign-up ---------- */}
      <section className="border-t" style={{ borderColor: `${RED}40` }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <p className="max-w-xl text-[18px] leading-8" style={{ color: `${WHITE}c8` }}>Node’s advisor agent. <b style={{ color: WHITE }}>He advises, he teaches, he instructs</b> — and he knows your program, your project and your plan before you ask.</p>
          {cta}
        </div>
      </section>

      {/* ---------- the red band: what he does ---------- */}
      <section id="plan" className="relative" style={{ background: RED, color: INK }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8">
          <div className="grid gap-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: INK }}>The plan</span>
            <h2 className="max-w-4xl font-heading text-[clamp(2.2rem,6vw,4.6rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]">He advises. He teaches. <span style={{ color: WHITE }}>He instructs.</span></h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["01", "Advises", "Which option, which trade-off, what to do next on your project — with the reasons, not just the answer."],
              ["02", "Teaches", "Any lesson, any technique, explained at your level — with your own work as the material."],
              ["03", "Instructs", "Step by step through a task, checking your draft against the rubric before your reviewer ever sees it."],
            ].map(([n, t, line]) => (
              <article key={n} className="relative grid gap-3 overflow-hidden p-6" style={{ background: INK, color: WHITE }}>
                <span className="font-heading text-[64px] font-black leading-none" style={{ color: RED }}>{n}</span>
                <b className="font-heading text-[26px] font-black uppercase tracking-[-0.01em]">{t}</b>
                <p className="text-[14.5px] leading-6" style={{ color: `${WHITE}b0` }}>{line}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- the briefing: how he works ---------- */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid content-start gap-4">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: RED }}>The briefing</span>
          <h2 className="font-heading text-[clamp(2rem,4.5vw,3.4rem)] font-black uppercase leading-[0.92] tracking-[-0.03em]">Every move,<br />prepared.</h2>
          <p className="max-w-md text-[15px] leading-7" style={{ color: `${WHITE}a6` }}>He doesn’t guess. Everything he says comes from your own work on Node — and every decision stays yours.</p>
        </div>
        <ol className="grid gap-px" style={{ background: `${WHITE}14` }}>
          {[
            ["He reads the plan", "Your 30-day program, your practice project and where you are in it."],
            ["He studies your work", "Your drafts, your submissions, what the reviewers said and the rubric they used."],
            ["He briefs you", "What to do next, why, and the risks — in plain words, at your level."],
            ["You decide", "He prepares the options. You make the call."],
          ].map(([t, line], i) => (
            <li key={t} className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-4 p-5" style={{ background: INK }}>
              <span className="flex size-12 items-center justify-center font-mono text-[15px] font-bold" style={{ border: `1px solid ${RED}`, color: RED }}>{String(i + 1).padStart(2, "0")}</span>
              <span className="grid gap-1"><b className="text-[17px] uppercase tracking-[0.02em]">{t}</b><span className="text-[14px] leading-6" style={{ color: `${WHITE}99` }}>{line}</span></span>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- the call to action ---------- */}
      <section className="relative overflow-hidden border-t" style={{ borderColor: `${RED}55` }}>
        <span className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 select-none font-heading text-[22vw] font-black uppercase leading-none opacity-[.05]" style={{ color: RED }} aria-hidden>Soon</span>
        <div className="relative mx-auto grid max-w-6xl gap-6 px-5 py-20 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="grid gap-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: RED }}>Coming to connect you soon</span>
            <h2 className="font-heading text-[clamp(2rem,5vw,3.8rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]">Be first in the room.</h2>
            <p className="max-w-lg text-[15px] leading-7" style={{ color: `${WHITE}a6` }}>Leave your email and we’ll tell you the moment the Professor is ready. Already learning on Node? He’ll know you when he arrives.</p>
          </div>
          {cta}
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t px-5 py-6 text-[12.5px] sm:px-8" style={{ borderColor: `${WHITE}14`, color: `${WHITE}66` }}>
          <span>© Node · The Professor is an AI agent in development.</span>
          <span className="flex gap-4"><Link href="/" className="hover:text-white">Node home</Link><Link href="/programs" className="hover:text-white">Programs</Link><Link href="/explore" className="hover:text-white">Explore</Link></span>
        </div>
      </section>
    </main>
  );
}
