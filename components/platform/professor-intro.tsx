"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

/* The Professor's opening — a short film before the landing page:
 *   01 The dark    — a sliver of light under a door, a voice in the dark
 *   02 The advisor — his profile in silhouette, speaking
 *   03 The plan    — the plan board, read and navigated card by card while he explains what he does at each stage
 *   04 The room    — the landing's room in the dark; then the lights come on
 * Subtitles carry the dialogue. Skippable (button, Esc), letterboxed, with a progress line. */
const RED = "#e3051b", WHITE = "#f5f1ea";

const PHASES = [
  { id: "dark", at: 0, label: "01 · The dark" },
  { id: "profile", at: 5.1, label: "02 · The advisor" },
  { id: "board", at: 10.6, label: "03 · The plan" },
  { id: "room", at: 24.4, label: "04 · The room" },
  { id: "light", at: 27.0, label: "04 · The room" },
] as const;
type Phase = (typeof PHASES)[number]["id"];
const END = 28.4;

const SUBS: { from: number; to: number; text: string }[] = [
  { from: 0.3, to: 2.3, text: "Every plan looks perfect on paper." },
  { from: 2.5, to: 4.9, text: "Until a decision lands at 3 a.m. — and there’s no one to ask." },
  { from: 5.4, to: 7.8, text: "That’s where I come in. I’ve read your program, your project, every rubric." },
  { from: 8.0, to: 10.4, text: "I don’t do the work. I advise, I teach, I instruct — and you decide." },
  { from: 11.0, to: 13.3, text: "Discover: what your system really is, before you design around a guess." },
  { from: 13.8, to: 16.1, text: "Plan: three options, their trade-offs, the one I’d pick. Your call." },
  { from: 16.6, to: 18.9, text: "Build: your draft checked against the rubric before review." },
  { from: 19.4, to: 21.7, text: "Release: every risk named, the way back ready." },
  { from: 22.2, to: 24.2, text: "Thirty days. One plan. Every move prepared." },
  { from: 24.7, to: 27.0, text: "I’m the Professor. Coming to connect you soon." },
];
/* which card of the board the camera is on (-1: the whole board) */
const FOCUS = [{ at: 0, card: -1 }, { at: 10.7, card: 0 }, { at: 13.5, card: 1 }, { at: 16.3, card: 2 }, { at: 19.1, card: 3 }, { at: 21.9, card: 4 }];

export function ProfessorIntro({ onDone }: { onDone: () => void }) {
  const [t, setT] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const finish = useEffectEvent(() => onDone());
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const set = () => setNarrow(mq.matches);
    const id = window.requestAnimationFrame(set);
    mq.addEventListener("change", set);
    return () => { window.cancelAnimationFrame(id); mq.removeEventListener("change", set); };
  }, []);
  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => {
      const s = (performance.now() - start) / 1000;
      setT(s);
      if (s >= END) { window.clearInterval(id); finish(); }
    }, 80);
    const key = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter") finish(); };
    window.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => { window.clearInterval(id); window.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, []);

  const phase: Phase = [...PHASES].reverse().find((p) => t >= p.at)?.id ?? "dark";
  const chapter = PHASES.find((p) => p.id === phase)!;
  const sub = SUBS.find((s) => t >= s.from && t < s.to);
  const card = [...FOCUS].reverse().find((f) => t >= f.at)?.card ?? -1;
  const subOpacity = sub ? Math.min(1, (t - sub.from) / 0.3, (sub.to - t) / 0.3) : 0;

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden text-white" role="dialog" aria-modal="true" aria-label="The Professor — opening">
      {/* the picture: black; then the room shows through, dark; then the lights come on and it lifts away */}
      <div className={cn("absolute inset-0 bg-[#030303] transition-opacity duration-1000", phase === "light" && "pf-lights")} style={{ opacity: phase === "room" ? 0.9 : undefined }}>
        {phase === "dark" ? <DarkScene key="dark" t={t} /> : phase === "profile" ? <ProfileScene key="profile" speaking={!!sub} narrow={narrow} /> : phase === "board" ? <BoardScene key="board" card={card} narrow={narrow} /> : null}
        <div className="pointer-events-none absolute inset-0 opacity-[.08] mix-blend-screen" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")" }} />
      </div>

      {/* letterbox: the chapter and Skip on top; the progress line below */}
      <div className={cn("absolute inset-x-0 top-0 flex items-center justify-between bg-black px-5 transition-[height] duration-1000 sm:px-8", phase === "light" ? "h-0" : "h-[9vh]")}>
        <span key={chapter.id} className="pf-in font-mono text-[10.5px] font-bold uppercase tracking-[0.3em] text-white/55">{chapter.label}</span>
        <button type="button" onClick={onDone} className="flex items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/75 transition-colors hover:border-white/50 hover:text-white">Skip intro<MaterialSymbol className="text-[16px]" name="skip_next" /></button>
      </div>
      <div className={cn("absolute inset-x-0 bottom-0 bg-black transition-[height] duration-1000", phase === "light" ? "h-0" : "h-[9vh]")}>
        <span className="absolute left-0 top-0 h-[2px] transition-[width] duration-100" style={{ width: `${Math.min(100, (t / END) * 100)}%`, background: RED }} />
      </div>

      {/* subtitles */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(9vh+28px)] flex justify-center px-6" aria-live="polite">
        {sub ? (
          <p className="grid max-w-3xl justify-items-center gap-1.5 text-center" style={{ opacity: subOpacity }}>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.32em]" style={{ color: RED }}>The Professor</span>
            <span className="rounded-md bg-black/55 px-3 py-1.5 text-[clamp(16px,2.1vw,25px)] font-medium leading-snug" style={{ color: WHITE, textShadow: "0 2px 10px rgba(0,0,0,.9)" }}>{sub.text}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- 01 · the dark: a door left ajar, light under it, dust ---------- */
function DarkScene({ t }: { t: number }) {
  return (
    <div className="pf-in absolute inset-0">
      <div className="absolute left-1/2 top-[22%] h-[56%] w-[3px] -translate-x-1/2 origin-bottom" style={{ background: "linear-gradient(180deg, transparent, #ffe2a3 30%, #ffd98a 70%, transparent)", boxShadow: "0 0 30px 6px rgba(255,217,138,.35)", animation: "pf-slit 2.6s cubic-bezier(.2,.8,.3,1) both" }} />
      <div className="absolute bottom-[18%] left-1/2 h-[40%] w-[60%] -translate-x-1/2" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,217,138,.16), transparent 60%)", opacity: Math.min(1, t / 3) }} />
      <div className="absolute inset-x-0 bottom-[18%] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(227,5,27,.55), transparent)" }} />
      {Array.from({ length: 14 }, (_, i) => <span key={i} className="pf-dust absolute size-[2px] rounded-full bg-[#ffe9b8]" style={{ left: `${46 + ((i * 29) % 9)}%`, top: `${48 + ((i * 41) % 30)}%`, ["--d" as string]: `${6 + (i % 4)}s`, ["--w" as string]: `${(i * 0.5) % 4}s`, ["--dx" as string]: `${(i % 2 ? 1 : -1) * 12}px` }} />)}
    </div>
  );
}

/* ---------- 02 · the advisor: his profile in silhouette, lit from the front, speaking ---------- */
function ProfileScene({ speaking, narrow }: { speaking: boolean; narrow: boolean }) {
  return (
    <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" className="pf-in absolute inset-0 h-full w-full" aria-label="The Professor in profile, speaking">
      <defs>
        <radialGradient id="pi-haze" cx="62%" cy="46%" r="55%"><stop offset="0" stopColor="#5a0a12" stopOpacity=".55" /><stop offset="1" stopColor="#030303" stopOpacity="0" /></radialGradient>
        <linearGradient id="pi-key" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#ffd98a" stopOpacity=".22" /><stop offset="1" stopColor="#ffd98a" stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="1200" height="640" fill="#040303" />
      <rect width="1200" height="640" fill="url(#pi-haze)" />
      {/* light through blinds, across the wall */}
      <g opacity=".9">{[0, 1, 2, 3, 4, 5, 6].map((i) => <polygon key={i} points={`${760 + i * 4},${80 + i * 58} 1200,${20 + i * 58} 1200,${44 + i * 58} ${770 + i * 4},${104 + i * 58}`} fill="url(#pi-key)" />)}</g>

      <g transform={narrow ? "translate(232 78) scale(.62)" : "translate(40 10) scale(.9)"}>
      <g className="pf-breathe">
        <g fill="#060404">
          {/* body and neck */}
          <polygon points="470,420 600,430 660,470 650,500 652,540 660,566 670,600 700,640 760,900 240,900 300,640 340,580 400,530 450,500 470,470" />
          {/* head, to the lips */}
          <polygon points="470,430 452,362 446,300 456,240 480,196 516,166 560,150 604,148 640,158 668,176 684,196 690,214 694,236 698,262 706,282 700,292 708,300 722,322 734,344 740,352 728,360 724,366 730,374 726,384 720,402 660,432 560,442" />
        </g>
        {/* the jaw and beard — it moves when he speaks */}
        <g className={cn("pf-speak", !speaking && "[animation-play-state:paused]")} style={{ transformOrigin: "590px 380px", transformBox: "view-box" }}>
          <polygon points="724,384 732,390 726,396 734,404 736,424 730,446 716,466 700,476 676,482 656,486 600,470 590,400 700,392" fill="#060404" />
          <g fill="none" stroke="#d8c3a0" strokeOpacity=".3" strokeWidth="1.1"><path d="M700 410 l6 6M712 424 l6 5M706 440 l6 5M690 452 l5 6M672 462 l4 7M716 404 l5 5M694 432 l6 4" /></g>
          <polyline points="726,384 732,390 726,396 734,404 736,424 730,446 716,466 700,476 676,482 656,486" fill="none" stroke="#ffd98a" strokeOpacity=".6" strokeWidth="2" />
        </g>
        {/* shirt collar, a glint of the tie */}
        <polygon points="650,540 676,560 668,600 648,568" fill="#4e483f" />
        <polygon points="668,600 682,612 676,640 662,640" fill="#5a0a12" />
        {/* the ear and its lines */}
        <polygon points="560,296 584,292 594,312 588,342 572,350 562,332" fill="#0d0a09" />
        <g fill="none" stroke="#d8c3a0" strokeWidth="1.1">
          <polyline points="566,304 582,300 588,316 582,336" strokeOpacity=".3" />
          {/* hair strands, brow, moustache */}
          <g strokeOpacity=".28"><polyline points="476,250 520,206 572,188 632,190" /><polyline points="466,300 500,250 548,224 610,218 660,226" /><polyline points="470,352 486,300 520,270" /><polyline points="520,180 566,168 620,170" strokeOpacity=".2" /></g>
          <polyline points="672,276 700,272" strokeOpacity=".5" strokeWidth="2" />
          <polyline points="724,370 732,376 726,384" strokeOpacity=".4" />
          <polyline points="652,540 664,580" strokeOpacity=".25" /><polyline points="560,470 640,520" strokeOpacity=".18" />
        </g>
        {/* glasses, side on: the arm to the ear, the lens catching the light */}
        <polyline points="588,302 700,290" fill="none" stroke="#f2e6cf" strokeOpacity=".85" strokeWidth="2.4" />
        <polygon points="694,276 706,276 710,304 698,304" fill="#ffd98a" fillOpacity=".28" stroke="#f2e6cf" strokeWidth="1.8" />
        <rect x="688" y="289" width="3" height="3" fill="#f2e6cf" opacity=".85" />
        {/* the key light on his profile; a red rim behind */}
        <polyline points="684,196 690,214 694,236 698,262 706,282 700,292 708,300 722,322 734,344 740,352 728,360 724,366 730,374 726,384" fill="none" stroke="#ffd98a" strokeOpacity=".7" strokeWidth="2.2" />
        <polyline points="516,166 560,150 604,148 640,158 668,176 684,196" fill="none" stroke="#ffe3a8" strokeOpacity=".45" strokeWidth="2" />
        <polyline points="470,430 452,362 446,300 456,240 480,196 516,166" fill="none" stroke={RED} strokeOpacity=".65" strokeWidth="2.4" />
        <polyline points="240,900 300,640 340,580 400,530 450,500 470,470 470,430" fill="none" stroke={RED} strokeOpacity=".6" strokeWidth="2.6" />
      </g>
      </g>
    </svg>
  );
}

/* ---------- 03 · the plan: the board, read card by card ---------- */
const CARDS = [
  { id: "discover", n: "01", x: 140, y: 110, w: 240, h: 170, r: -3, title: "DISCOVER", note: "your system, mapped" },
  { id: "plan", n: "02", x: 470, y: 86, w: 230, h: 160, r: 2, title: "PLAN", note: "3 options · 1 pick" },
  { id: "build", n: "03", x: 800, y: 130, w: 240, h: 170, r: -2, title: "BUILD", note: "checked vs. the rubric" },
  { id: "release", n: "04", x: 300, y: 372, w: 240, h: 160, r: 3, title: "RELEASE", note: "risks named · way back ready" },
  { id: "day30", n: "05", x: 720, y: 392, w: 220, h: 150, r: -3, title: "DAY 30", note: "you, prepared" },
];
const INK = "#2b1d1a";

function CardArt({ id, w, h }: { id: string; w: number; h: number }) {
  const s = { fill: "none", stroke: INK, strokeWidth: 2 } as const;
  if (id === "discover") return <g {...s}><rect x="22" y="70" width="54" height="30" /><rect x={w - 90} y="52" width="62" height="30" /><rect x={w - 90} y="104" width="62" height="30" /><polyline points={`76,85 ${w - 90},67`} /><polyline points={`76,85 ${w - 90},119`} /><text x="28" y="90" fontSize="11" fill={INK} stroke="none" fontFamily="ui-monospace, monospace">SYS-01</text></g>;
  if (id === "plan") return <g>{[[58, 0.9], [92, 0.55], [126, 0.72]].map(([y, f], i) => <g key={i}><text x="20" y={y + 9} fontSize="12" fontWeight="700" fill={INK} fontFamily="ui-monospace, monospace">{"ABC"[i]}</text><rect x="40" y={y - 4} width={(w - 90) * f} height="14" fill={i === 2 ? RED : INK} opacity={i === 2 ? 0.85 : 0.55} /></g>)}<circle cx={w - 34} cy="129" r="12" fill="none" stroke={RED} strokeWidth="2.5" /><polyline points={`${w - 40},129 ${w - 35},134 ${w - 27},123`} fill="none" stroke={RED} strokeWidth="2.5" /></g>;
  if (id === "build") return <g>{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={20 + (i % 2) * 12} y={56 + i * 18} width={[90, 70, 100, 60, 84][i]} height="6" fill={INK} opacity=".55" />)}{[0, 1, 2].map((i) => <g key={i}><rect x={w - 84} y={58 + i * 30} width="14" height="14" fill="none" stroke={INK} strokeWidth="2" /><polyline points={`${w - 81},${66 + i * 30} ${w - 77},${70 + i * 30} ${w - 71},${61 + i * 30}`} fill="none" stroke={RED} strokeWidth="2.4" /><rect x={w - 64} y={62 + i * 30} width="40" height="5" fill={INK} opacity=".45" /></g>)}</g>;
  if (id === "release") return <g>{[[1, 0.15], [10, 0.32], [50, 0.62], [100, 1]].map(([p, f], i) => <g key={i}><rect x={24 + i * 44} y={130 - 70 * f} width="30" height={70 * f} fill={i === 3 ? RED : INK} opacity={i === 3 ? 0.85 : 0.5} /><text x={24 + i * 44} y="146" fontSize="10" fill={INK} fontFamily="ui-monospace, monospace">{p}%</text></g>)}<polygon points={`${w - 44},52 ${w - 22},60 ${w - 22},82 ${w - 44},96 ${w - 66},82 ${w - 66},60`} fill="none" stroke={INK} strokeWidth="2" /></g>;
  return <g><rect x="20" y="48" width={w - 40} height={h - 72} fill="none" stroke={INK} strokeWidth="2" /><rect x="28" y="56" width={w - 56} height={h - 88} fill="none" stroke={INK} strokeWidth="1" opacity=".5" /><circle cx={w / 2} cy={h - 40} r="16" fill={RED} /><polygon points={`${w / 2 - 10},${h - 28} ${w / 2 - 16},${h - 8} ${w / 2 - 4},${h - 18}`} fill={RED} /><polygon points={`${w / 2 + 10},${h - 28} ${w / 2 + 16},${h - 8} ${w / 2 + 4},${h - 18}`} fill={RED} /><rect x={w / 2 - 50} y="70" width="100" height="6" fill={INK} opacity=".5" /></g>;
}

function BoardScene({ card, narrow }: { card: number; narrow: boolean }) {
  const c = card >= 0 ? CARDS[card] : null;
  /* the card in focus sits a little above centre, so its note clears the subtitles */
  const s = c ? (narrow ? 1 : 1.7) : 1, ty = c ? (narrow ? 290 : 280) : 320;
  const fw = c ? (c.w * s) / 2 + 22 : 0, fh = c ? (c.h * s) / 2 + 22 : 0;
  const cx = c ? c.x + c.w / 2 : 600, cy = c ? c.y + c.h / 2 : 320;
  const pins = CARDS.map((k) => [k.x + k.w / 2, k.y + 12] as const);
  return (
    <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" className="pf-in absolute inset-0 h-full w-full" aria-label="The plan board, read card by card">
      <defs>
        <pattern id="pb-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke={RED} strokeOpacity=".08" /></pattern>
        <radialGradient id="pb-spot" cx="50%" cy={`${(ty / 640) * 100}%`} r="50%"><stop offset="0" stopColor="#000" /><stop offset=".42" stopColor="#000" /><stop offset="1" stopColor="#fff" /></radialGradient>
        <mask id="pb-mask"><rect width="1200" height="640" fill="url(#pb-spot)" /></mask>
      </defs>
      <rect width="1200" height="640" fill="#0b0506" />
      {/* the camera */}
      <g style={{ transform: `translate(${600 - cx * s}px, ${ty - cy * s}px) scale(${s})`, transformOrigin: "0 0", transition: "transform 1.05s cubic-bezier(.65,0,.35,1)" }}>
        <rect x="40" y="30" width="1120" height="580" fill="#160a0b" stroke="#3a0c12" strokeWidth="2" />
        <rect x="40" y="30" width="1120" height="580" fill="url(#pb-grid)" />
        {/* clutter: blueprint lines, polaroids, sticky notes, a coffee ring */}
        <g fill="none" stroke={RED} strokeOpacity=".22" strokeWidth="1.5"><path d="M1040 70h90v120h-60v60h-30z" /><path d="M70 330h120v100H70zM110 330v100" /><circle cx="1080" cy="520" r="34" /><circle cx="1080" cy="520" r="28" strokeOpacity=".12" /></g>
        {[[600, 270, -6], [1010, 300, 5], [80, 470, 4], [560, 470, -4]].map(([x, y, r], i) => (
          <g key={i} transform={`rotate(${r} ${x + 40} ${y + 46})`} opacity=".55"><rect x={x} y={y} width="80" height="92" fill="#cfc6b6" /><rect x={x + 7} y={y + 7} width="66" height="60" fill="#2a2321" /><circle cx={x + 40} cy={y + 30} r="12" fill="#0f0c0b" /><rect x={x + 22} y={y + 44} width="36" height="23" fill="#0f0c0b" /></g>
        ))}
        {[[400, 300, "WHY?"], [1000, 440, "RISK"], [200, 320, "ADR"]].map(([x, y, w], i) => <g key={i} transform={`rotate(${i % 2 ? 4 : -5} ${x} ${y})`}><rect x={x as number} y={y as number} width="66" height="56" fill="#e2b93b" opacity=".75" /><text x={(x as number) + 10} y={(y as number) + 32} fontSize="13" fontWeight="700" fill={INK} fontFamily="ui-monospace, monospace">{w}</text></g>)}
        {/* the cards */}
        {CARDS.map((k, i) => {
          const on = card === i, seen = card > i || card === -1;
          return (
            <g key={k.id} transform={`rotate(${k.r} ${k.x + k.w / 2} ${k.y + k.h / 2})`}>
              <rect x={k.x + 5} y={k.y + 7} width={k.w} height={k.h} fill="#000" opacity=".45" />
              <rect x={k.x} y={k.y} width={k.w} height={k.h} fill="#e8dfcf" />
              <g transform={`translate(${k.x} ${k.y})`}>
                <text x="18" y="34" fontSize="20" fontWeight="800" letterSpacing="2" fill={INK} fontFamily="ui-monospace, monospace">{k.title}</text>
                <text x={k.w - 18} y="34" textAnchor="end" fontSize="12" fill={RED} fontWeight="700" fontFamily="ui-monospace, monospace">{k.n}</text>
                <CardArt id={k.id} w={k.w} h={k.h} />
              </g>
              {/* the note, scribbled in red under the card */}
              <g style={{ opacity: on || seen ? 1 : 0, transition: "opacity .8s .6s" }}>
                <polyline points={`${k.x + 20},${k.y + k.h + 14} ${k.x + k.w - 30},${k.y + k.h + 14}`} stroke={RED} strokeWidth="2" className={on ? "pf-string" : undefined} />
                <text x={k.x + 20} y={k.y + k.h + 34} fontSize="15" fontStyle="italic" fontWeight="700" fill={RED} fontFamily="ui-monospace, monospace">{k.note}</text>
              </g>
            </g>
          );
        })}
        {/* the red string, drawn pin to pin as he goes */}
        {pins.slice(1).map(([x, y], i) => (card > i || card === -1 ? <polyline key={i} className="pf-string" points={`${pins[i][0]},${pins[i][1]} ${x},${y}`} fill="none" stroke={RED} strokeWidth="2.4" /> : null))}
        {pins.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill={RED} stroke="#4a050b" strokeWidth="2.5" className={card === i ? "pf-pulse-dot" : undefined} />)}
      </g>
      {/* the reading light: dark around the card in focus */}
      <rect width="1200" height="640" fill="#000" mask="url(#pb-mask)" style={{ opacity: c ? 0.78 : 0.4, transition: "opacity 1.2s" }} />
      {/* the frame that tracks the card, and its file label */}
      {/* it locks on once the camera has arrived */}
      {c ? (
        <g key={c.id} className="pf-in" style={{ animationDelay: ".8s" }}>
          <g fill="none" stroke={WHITE} strokeOpacity=".7" strokeWidth="2">
            <polyline points={`${600 - fw},${ty - fh + 24} ${600 - fw},${ty - fh} ${600 - fw + 30},${ty - fh}`} /><polyline points={`${600 + fw - 30},${ty - fh} ${600 + fw},${ty - fh} ${600 + fw},${ty - fh + 24}`} />
            <polyline points={`${600 - fw},${ty + fh - 24} ${600 - fw},${ty + fh} ${600 - fw + 30},${ty + fh}`} /><polyline points={`${600 + fw - 30},${ty + fh} ${600 + fw},${ty + fh} ${600 + fw},${ty + fh - 24}`} />
          </g>
          <text x={600 - fw} y={ty - fh - 12} fontSize="13" fill={WHITE} fillOpacity=".75" letterSpacing="3" fontFamily="ui-monospace, monospace">FILE {c.n} / 05 — {c.title}</text>
        </g>
      ) : null}
    </svg>
  );
}
