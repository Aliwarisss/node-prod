"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

export type JourneyDay = { day: number; title: string; status: "done" | "current" | "open" | "locked"; done: number; total: number };
export type JourneyAct = { id: string; n: string; name: string; track: string; gate: string; tagline: string; days: JourneyDay[] };
type Props = {
  acts: JourneyAct[];
  tracks: { id: string; name: string; color: string; q: string }[];
  loops: [string, string, string, string][];
  current: number;
  finished: boolean;
};

/* ---------- geometry: one winding road through three lanes, left→right, right→left, left→right ---------- */
const W = 1000, H = 318;
const LANE = [62, 160, 258];
const XL = 214, XR = 930, R = (LANE[1] - LANE[0]) / 2; // the left gutter holds the track names
const SEG = [XR - XL, Math.PI * R, XR - XL, Math.PI * R, XR - XL];
const TOTAL = SEG.reduce((a, b) => a + b, 0);
const ROAD = `M${XL},${LANE[0]} L${XR},${LANE[0]} A${R},${R} 0 0 1 ${XR},${LANE[1]} L${XL},${LANE[1]} A${R},${R} 0 0 0 ${XL},${LANE[2]} L${XR},${LANE[2]}`;

/* the point at distance s along the road */
function at(s: number): [number, number] {
  let d = Math.max(0, Math.min(TOTAL, s));
  if (d <= SEG[0]) return [XL + d, LANE[0]];
  d -= SEG[0];
  if (d <= SEG[1]) { const a = -Math.PI / 2 + d / R; return [XR + R * Math.cos(a), LANE[0] + R + R * Math.sin(a)]; }
  d -= SEG[1];
  if (d <= SEG[2]) return [XR - d, LANE[1]];
  d -= SEG[2];
  if (d <= SEG[3]) { const a = -Math.PI / 2 - d / R; return [XL + R * Math.cos(a), LANE[1] + R + R * Math.sin(a)]; }
  d -= SEG[3];
  return [XL + d, LANE[2]];
}
const dayS = (day: number) => (day / 30) * TOTAL;

/* a track's question on two short lines for the gutter */
const wrapQ = (q: string) => {
  const words = q.split(" "), lines = [""];
  for (const w of words) { const l = lines[lines.length - 1]; if ((l + " " + w).trim().length > 21 && l) lines.push(w); else lines[lines.length - 1] = (l + " " + w).trim(); }
  return lines.slice(0, 2);
};

const STATUS_FILL: Record<JourneyDay["status"], string> = { done: "#007373", current: "#d81b60", open: "#ffffff", locked: "#e3e5e6" };

/* The month as the book's delivery system: three tracks, one road, every day a stop */
export function JourneyMap({ acts, tracks, loops, current, finished }: Props) {
  const nowAct = acts.find((a) => a.days.some((d) => d.status === "current")) ?? acts[0];
  const [focus, setFocus] = useState<string>(nowAct.id);
  const [showLoops, setShowLoops] = useState(false);
  const act = acts.find((a) => a.id === focus) ?? nowAct;
  const color = (track: string) => tracks.find((t) => t.id === track)?.color ?? "#007373";

  const doneDays = acts.flatMap((a) => a.days).filter((d) => d.status === "done").length;
  const progressS = finished ? TOTAL : dayS(current);
  const allDays = useMemo(() => acts.flatMap((a) => a.days.map((d) => ({ ...d, act: a }))), [acts]);
  const node = (a: JourneyAct) => at(dayS(a.days[0].day));
  const gateAt = (a: JourneyAct) => at(dayS(a.days[a.days.length - 1].day) + TOTAL / 60);

  /* tag where you are and where you go next */
  const nextAct = finished ? null : acts[acts.indexOf(nowAct) + 1] ?? null;
  const tagOf = (a: JourneyAct) => (finished ? "" : a === nowAct ? "NOW" : a === nextAct ? "UP NEXT" : "");

  /* the book's rework loops between acts, as arcs over the road */
  const loopArcs = loops
    .filter(([f, t, ty]) => ty === "rework" && acts.some((a) => a.id === f) && acts.some((a) => a.id === t))
    .map(([f, t, , label]) => {
      const [x1, y1] = node(acts.find((a) => a.id === f)!), [x2, y2] = node(acts.find((a) => a.id === t)!);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 34 - Math.abs(x1 - x2) * 0.05;
      return { d: `M${x1},${y1 - 12} Q${mx},${my} ${x2},${y2 - 12}`, label, lx: mx, ly: my + 10 };
    });

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-[#fbfbfc]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--on-surface-variant)]">The delivery system · your whole month</span>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-[var(--on-surface-variant)]">
            <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-[#007373]" />Done</span>
            <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-[#d81b60]" />Today</span>
            <span className="flex items-center gap-1"><i className="size-2.5 rounded-full border border-black/30 bg-white" />Open</span>
            <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-[#e3e5e6]" />Locked</span>
            <button type="button" onClick={() => setShowLoops((v) => !v)} aria-pressed={showLoops} className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors", showLoops ? "border-[#ff5722] bg-[#ff5722] text-white" : "border-black/15 text-[var(--primary)] hover:border-black/40")}>
              {showLoops ? "Hide" : "Show"} the book’s loops
            </button>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full min-w-[620px]" role="img" aria-label="Your month on the book's delivery system">
          <defs>
            <linearGradient id="jm-done" x1="0" x2="1">
              <stop offset="0" stopColor="#6d48d8" />
              <stop offset=".5" stopColor="#007373" />
              <stop offset="1" stopColor="#a87b00" />
            </linearGradient>
            <filter id="jm-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" /></filter>
            <style>{`
              @keyframes jm-draw { from { stroke-dashoffset: ${progressS}; } to { stroke-dashoffset: 0; } }
              @keyframes jm-flow { to { stroke-dashoffset: -28; } }
              .jm-done { stroke-dasharray: ${progressS} ${TOTAL}; animation: jm-draw 1.6s cubic-bezier(.22,1,.36,1) both; }
              .jm-ahead { stroke-dasharray: 2 12; animation: jm-flow 1.4s linear infinite; }
              .jm-act { transition: transform .25s cubic-bezier(.22,1,.36,1); transform-box: fill-box; transform-origin: center; }
              .jm-act:hover, .jm-act.on { transform: scale(1.12); }
              @media (prefers-reduced-motion: reduce) { .jm-done, .jm-ahead { animation: none; } }
            `}</style>
          </defs>

          {/* lanes */}
          {tracks.map((t, i) => (
            <g key={t.id}>
              <rect x={6} y={LANE[i] - 40} width={W - 12} height={80} rx={18} fill={t.color} fillOpacity={0.045} stroke={t.color} strokeOpacity={0.14} />
              <text x={18} y={LANE[i] - 8} fontSize={10.5} fontWeight={800} fill={t.color} style={{ fontFamily: "var(--font-geist-mono), monospace", letterSpacing: 1 }}>{t.name.toUpperCase()}</text>
              {wrapQ(t.q).map((line, k) => (
                <text key={k} x={18} y={LANE[i] + 8 + k * 13} fontSize={10.5} fontWeight={600} fill="#5b5f60">{line}</text>
              ))}
            </g>
          ))}

          {/* the road: ahead (flowing), done (draws in, glows), a light travelling the done stretch */}
          <path d={ROAD} fill="none" stroke="#dfe2e4" strokeWidth={10} strokeLinecap="round" />
          <path d={ROAD} fill="none" stroke="#9aa0a3" strokeWidth={2} strokeLinecap="round" className="jm-ahead" />
          <path d={ROAD} fill="none" stroke="url(#jm-done)" strokeWidth={10} strokeLinecap="round" className="jm-done" opacity={0.35} filter="url(#jm-glow)" />
          <path d={ROAD} fill="none" stroke="url(#jm-done)" strokeWidth={6} strokeLinecap="round" className="jm-done" />
          {progressS > 20 ? (
            <circle r={5} fill="#fff" stroke="#007373" strokeWidth={2}>
              <animateMotion dur="3.2s" repeatCount="indefinite" path={ROAD} keyPoints={`0;${(progressS / TOTAL).toFixed(4)}`} keyTimes="0;1" calcMode="linear" />
            </circle>
          ) : null}
          {/* next cycle: Evolve feeds Discover again */}

          <path d={`M${at(dayS(27))[0]},${LANE[2] + 18} C${W + 40},${LANE[2] + 70} ${W + 40},${LANE[0] - 70} ${at(dayS(1))[0]},${LANE[0] - 16}`} fill="none" stroke="#007373" strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="5 5" />
          <text x={W - 24} y={H - 8} textAnchor="end" fontSize={9.5} fontWeight={700} fill="#0b6b6b">↺ Evolve feeds the next Discover</text>

          {/* the book's rework loops */}
          {showLoops ? loopArcs.map((l, i) => (
            <g key={i}>
              <path d={l.d} fill="none" stroke="#ff5722" strokeWidth={1.6} strokeDasharray="4 3" opacity={0.85} />
              <text x={l.lx} y={l.ly} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#c2410c" paintOrder="stroke" stroke="#fbfbfc" strokeWidth={3}>{l.label}</text>
            </g>
          )) : null}

          {/* every day a stop */}
          {allDays.map((d) => {
            const [x, y] = at(dayS(d.day));
            const href = d.status === "locked" ? undefined : `/dashboard/roadmap/day/${d.day}`;
            const dot = (
              <g>
                <title>{`Day ${d.day} · ${d.title} — ${d.status === "done" ? "done" : d.status === "current" ? "today" : d.status === "open" ? "open" : "locked"} · ${d.done}/${d.total} lessons`}</title>
                {d.status === "current" ? (
                  <circle cx={x} cy={y} r={7} fill="none" stroke="#d81b60" strokeWidth={2}>
                    <animate attributeName="r" values="7;15;7" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0;1" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                ) : null}
                <circle cx={x} cy={y} r={d.status === "current" ? 6.5 : 4.2} fill={STATUS_FILL[d.status]} stroke={d.status === "open" ? "#5b5f60" : "#fff"} strokeWidth={1.4} />
              </g>
            );
            return href ? <a key={d.day} href={href}>{dot}</a> : <g key={d.day}>{dot}</g>;
          })}

          {/* act gates: a diamond after each act's last day */}
          {acts.filter((a) => a.id !== "kickoff" && a.id !== "capstone").map((a) => {
            const [x, y] = gateAt(a);
            const passed = a.days.every((d) => d.status === "done");
            return (
              <g key={a.id + "-gate"}>
                <title>{`Gate: ${a.gate}`}</title>
                <path d={`M${x},${y - 7} L${x + 7},${y} L${x},${y + 7} L${x - 7},${y} Z`} fill={passed ? "#007373" : "#0d1117"} stroke="#fff" strokeWidth={1.2} />
              </g>
            );
          })}

          {/* acts */}
          {acts.map((a) => {
            const [x, y] = node(a);
            const c = a.id === "kickoff" || a.id === "capstone" ? "#d81b60" : color(a.track);
            const done = a.days.every((d) => d.status === "done");
            const isNow = a.days.some((d) => d.status === "current");
            const locked = a.days.every((d) => d.status === "locked");
            const on = a.id === act.id;
            const ld = a.days.reduce((n, d) => n + d.done, 0), lt = a.days.reduce((n, d) => n + d.total, 0);
            return (
              <g key={a.id} className={cn("jm-act", on && "on")} style={{ cursor: "pointer" }} onMouseEnter={() => setFocus(a.id)} onFocus={() => setFocus(a.id)} onClick={() => setFocus(a.id)} tabIndex={0} role="button" aria-label={`${a.name}: ${a.days.length} days`} opacity={locked && !on ? 0.55 : 1}>
                <circle cx={x} cy={y} r={17} fill={done ? c : "#fff"} stroke={isNow ? "#d81b60" : c} strokeWidth={on ? 3.5 : 2.5} />
                {lt ? <circle cx={x} cy={y} r={21} fill="none" stroke={c} strokeOpacity={0.9} strokeWidth={2.5} strokeDasharray={`${(ld / lt) * 2 * Math.PI * 21} ${2 * Math.PI * 21}`} transform={`rotate(-90 ${x} ${y})`} /> : null}
                <text x={x} y={y + 4} textAnchor="middle" fontSize={a.n.length > 2 ? 9.5 : 11.5} fontWeight={900} fill={done ? "#fff" : c}>{done ? "✓" : a.n}</text>
                <text x={x} y={y - 27} textAnchor="middle" fontSize={11.5} fontWeight={800} fill="#040505" paintOrder="stroke" stroke="#fbfbfc" strokeWidth={4}>{a.name}</text>
                {tagOf(a) ? (
                  <g>
                    <rect x={x - (tagOf(a).length * 3.6 + 9)} y={y + 24} width={tagOf(a).length * 7.2 + 18} height={15} rx={7.5} fill={tagOf(a) === "NOW" ? "#d81b60" : "#0d1117"} />
                    <text x={x} y={y + 34.5} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#fff" letterSpacing={1}>{tagOf(a)}</text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {/* the act in focus */}
      <aside className="grid content-start gap-3 rounded-2xl border border-black/[0.06] bg-white p-4" aria-live="polite">
        <div className="grid gap-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: `color-mix(in srgb, ${color(act.track)} 70%, black)` }}>
            {act.id === "kickoff" || act.id === "capstone" ? act.name : `Act ${act.n} · ${tracks.find((t) => t.id === act.track)?.name ?? ""}`}
          </span>
          <b className="font-heading text-[18px] font-black uppercase leading-tight tracking-[-0.02em] text-[var(--primary)]">{act.name}</b>
          {act.tagline ? <p className="text-[12.5px] leading-snug text-[var(--on-surface-variant)]">{act.tagline}</p> : null}
          {act.gate ? <span className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-[var(--primary)]"><MaterialSymbol className="text-[15px] text-[var(--bridge-teal)]" name="verified" />Gate: {act.gate}</span> : null}
        </div>
        <ol className="grid gap-1.5">
          {act.days.map((d) => {
            const row = (
              <>
                <span className="size-2.5 flex-none rounded-full" style={{ background: STATUS_FILL[d.status], border: d.status === "open" ? "1px solid #5b5f60" : undefined }} />
                <span className="grid min-w-0 flex-1 leading-tight">
                  <span className="font-mono text-[10px] font-bold text-[var(--on-surface-variant)]">DAY {d.day}{d.status === "current" ? " · TODAY" : ""}</span>
                  <span className="truncate text-[12.5px] font-semibold text-[var(--primary)]">{d.title}</span>
                </span>
                <span className="font-mono text-[10.5px] text-[var(--on-surface-variant)]">{d.done}/{d.total}</span>
              </>
            );
            return (
              <li key={d.day}>
                {d.status === "locked" ? (
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 opacity-60" title="Finish the day before to open this one">{row}<MaterialSymbol className="text-[14px] text-black/40" name="lock" /></div>
                ) : (
                  <Link href={`/dashboard/roadmap/day/${d.day}`} className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#f1f3f4]", d.status === "current" && "bg-[#fff5f8]")}>{row}</Link>
                )}
              </li>
            );
          })}
        </ol>
        <span className="text-[11.5px] text-[var(--on-surface-variant)]">{doneDays} of 31 days done · hover an act on the map to see it here</span>
      </aside>
    </div>
  );
}
