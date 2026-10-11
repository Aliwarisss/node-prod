import type { CSSProperties, ReactNode } from "react";

import { masterclasses } from "@/lib/platform-data";

import s from "./cinema.module.css";

/* The program posters' pieces — each program's colour field, ink and drawn motif — shared by the slider at the top of
   the Programs page and the poster bands below it. The motifs animate when an ancestor has data-state="current". */

export const DARK = "#0b0d12";
const r1 = (n: number) => Math.round(n * 10) / 10; // rounded so the server and the browser draw the same numbers
const at = (cx: number, cy: number, r: number, deg: number) => ({ x: r1(cx + r * Math.cos((deg * Math.PI) / 180)), y: r1(cy + r * Math.sin((deg * Math.PI) / 180)) });
export const d = (sec: number) => ({ "--d": `${sec}s` }) as CSSProperties;

/* ---------- the motifs ---------- */
export function CopyPasteGo() {
  return (
    <svg viewBox="0 0 420 400" fill="none" aria-hidden>
      <rect className={s.slideIn} style={{ ...d(0.65), "--fx": "-34px" } as CSSProperties} x="30" y="60" width="220" height="150" rx="24" stroke="currentColor" strokeWidth="3" strokeDasharray="10 10" />
      <rect className={s.slideIn} style={{ ...d(0.8), "--fx": "-34px" } as CSSProperties} x="75" y="115" width="220" height="150" rx="24" stroke="currentColor" strokeWidth="3" fill="var(--bg)" />
      <g className={s.slideIn} style={{ ...d(0.95), "--fx": "-34px" } as CSSProperties}>
        <rect x="120" y="170" width="220" height="150" rx="24" fill="currentColor" />
        <rect x="148" y="204" width="110" height="12" rx="6" fill="var(--bg)" />
        <rect x="148" y="232" width="150" height="12" rx="6" fill="var(--bg)" opacity=".55" />
        <rect x="148" y="260" width="80" height="12" rx="6" fill="var(--bg)" opacity=".55" />
      </g>
      <path className={s.draw} style={{ ...d(1.35), "--len": 140 } as CSSProperties} d="M350 245 H405 M385 225 L405 245 L385 265" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <text className={s.slideIn} style={d(1.1)} x="30" y="40" fontFamily="var(--font-geist-mono), monospace" fontSize="14" fontWeight="700" letterSpacing="3" fill="currentColor">COPY · PASTE · GO</text>
    </svg>
  );
}
export function HelloWorld() {
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden>
      <rect className={s.draw} style={{ ...d(0.6), "--len": 1100 } as CSSProperties} x="30" y="80" width="340" height="240" rx="22" stroke="currentColor" strokeWidth="3" />
      <path className={s.draw} style={{ ...d(0.9), "--len": 340 } as CSSProperties} d="M30 124 H370" stroke="currentColor" strokeWidth="2" />
      {[56, 78, 100].map((x, i) => <circle key={x} className={s.pop} style={d(1 + i * 0.08)} cx={x} cy="102" r="7" fill="currentColor" />)}
      <g fontFamily="var(--font-geist-mono), monospace" fill="currentColor">
        <text className={s.type} x="58" y="190" fontSize="26" fontWeight="700">&gt; hello, world</text>
        <rect className={s.blink} x="294" y="168" width="14" height="28" fill="currentColor" />
        <text className={s.fade} style={d(2.4)} x="58" y="240" fontSize="16" opacity=".6">every career starts here</text>
        <text className={s.fade} style={d(2.6)} x="58" y="272" fontSize="16" opacity=".6">_</text>
      </g>
    </svg>
  );
}
export function Dots() {
  const a = [[70, 70], [130, 130], [190, 190], [250, 250], [310, 310]], b = [[310, 70], [250, 130], [130, 250], [70, 310]];
  const loose = [[340, 190], [40, 190], [190, 40], [190, 345], [362, 120], [30, 260]];
  return (
    <svg viewBox="0 0 380 380" fill="none" aria-hidden>
      {loose.map(([x, y], i) => <circle key={`l${i}`} className={s.pop} style={d(0.6 + i * 0.06)} cx={x} cy={y} r="6" fill="currentColor" opacity=".3" />)}
      <path className={s.draw} style={{ ...d(1.2), "--len": 360 } as CSSProperties} d="M70 70 L310 310" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path className={s.draw} style={{ ...d(1.45), "--len": 360 } as CSSProperties} d="M310 70 L70 310" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {[...a, ...b].map(([x, y], i) => <circle key={i} className={s.pop} style={d(0.7 + i * 0.07)} cx={x} cy={y} r={x === 190 ? 22 : 14} fill={x === 190 ? "currentColor" : "var(--bg)"} stroke="currentColor" strokeWidth="4" />)}
      <text className={s.pop} style={d(1.9)} x="190" y="197" textAnchor="middle" fontFamily="var(--font-montserrat), sans-serif" fontSize="18" fontWeight="900" fill="var(--bg)">X</text>
    </svg>
  );
}
export function TheNode() {
  const sats = [0, 60, 120, 180, 240, 300].map((deg) => at(200, 200, 150, deg - 90));
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden>
      <circle className={s.spin} cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="2" strokeDasharray="4 10" opacity=".7" />
      <circle cx="200" cy="200" r="95" stroke="currentColor" strokeWidth="1.5" opacity=".35" />
      {sats.map((p, i) => <path key={`e${i}`} className={s.draw} style={{ ...d(0.9 + i * 0.1), "--len": 160 } as CSSProperties} d={`M200 200 L${p.x} ${p.y}`} stroke="currentColor" strokeWidth="2.5" />)}
      {sats.map((p, i) => <circle key={`n${i}`} className={s.pop} style={d(1.2 + i * 0.1)} cx={p.x} cy={p.y} r="17" fill="var(--bg)" stroke="currentColor" strokeWidth="3.5" />)}
      <circle className={s.pop} style={d(0.7)} cx="200" cy="200" r="40" fill="currentColor" />
      <text className={s.pop} style={d(0.9)} x="200" y="206" textAnchor="middle" fontFamily="var(--font-montserrat), sans-serif" fontSize="15" fontWeight="900" fill="var(--bg)">NODE</text>
    </svg>
  );
}
export function NanoDial() {
  const ticks = Array.from({ length: 72 }, (_, i) => { const long = i % 6 === 0; const p = at(200, 200, 168, i * 5), q = at(200, 200, long ? 148 : 158, i * 5); return { p, q, long }; });
  const needle = at(200, 200, 132, -52);
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden>
      <g className={s.spin}>{ticks.map((t, i) => <line key={i} x1={t.p.x} y1={t.p.y} x2={t.q.x} y2={t.q.y} stroke="currentColor" strokeWidth={t.long ? 3 : 1.5} opacity={t.long ? 1 : 0.55} />)}</g>
      <circle className={s.draw} style={{ ...d(0.6), "--len": 760 } as CSSProperties} cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="2.5" />
      <circle className={s.draw} style={{ ...d(0.8), "--len": 520 } as CSSProperties} cx="200" cy="200" r="82" stroke="currentColor" strokeWidth="1.5" opacity=".6" />
      <path className={s.draw} style={{ ...d(1.3), "--len": 140 } as CSSProperties} d={`M200 200 L${needle.x} ${needle.y}`} stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle className={s.pop} style={d(1.1)} cx="200" cy="200" r="46" fill="currentColor" />
      <text className={s.pop} style={d(1.25)} x="200" y="210" textAnchor="middle" fontFamily="var(--font-montserrat), sans-serif" fontSize="28" fontWeight="900" fill="var(--bg)">6M</text>
    </svg>
  );
}
export function DayArc() {
  const rays = Array.from({ length: 9 }, (_, i) => { const deg = 180 + i * 22.5; return { p: at(200, 280, 112, deg), q: at(200, 280, 146, deg) }; });
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden>
      <path className={s.draw} style={{ ...d(0.6), "--len": 360 } as CSSProperties} d="M20 280 H380" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path className={s.slideIn} style={{ ...d(0.85), "--fx": "0px", "--fy": "40px" } as CSSProperties} d="M110 280 A90 90 0 0 1 290 280 Z" fill="currentColor" />
      {rays.map((r, i) => <path key={i} className={s.draw} style={{ ...d(1.2 + i * 0.07), "--len": 40 } as CSSProperties} d={`M${r.p.x} ${r.p.y} L${r.q.x} ${r.q.y}`} stroke="currentColor" strokeWidth="4" strokeLinecap="round" />)}
      {[60, 110, 160, 240, 290, 340].map((x, i) => <path key={x} className={s.pop} style={d(1.5 + i * 0.05)} d={`M${x} 300 V312`} stroke="currentColor" strokeWidth="2" opacity=".6" />)}
      <rect className={s.pop} style={d(1.9)} x="160" y="322" width="80" height="6" rx="3" fill="currentColor" />
      <text className={s.fade} style={d(2)} x="200" y="356" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace" fontSize="14" fontWeight="700" letterSpacing="2" fill="currentColor">2–4 HOURS</text>
    </svg>
  );
}

export const LOOK: Record<string, { bg: string; ink: string; art: ReactNode }> = {
  "copy-paste-go": { bg: "#e91e63", ink: "#ffffff", art: <CopyPasteGo /> },
  "hello-world": { bg: "#4fd1c5", ink: DARK, art: <HelloWorld /> },
  dots: { bg: "#a78bfa", ink: DARK, art: <Dots /> },
  "the-node": { bg: "#f4a261", ink: DARK, art: <TheNode /> },
  "nano-degree": { bg: "#3b2a8f", ink: "#ffffff", art: <NanoDial /> },
  [masterclasses.id]: { bg: "#f2b705", ink: DARK, art: <DayArc /> },
};

export const STATUS_LABEL = { live: "Live now", soon: "Coming soon", building: "In the making" } as const;
export const pad = (n: number) => String(n).padStart(2, "0");
