"use client";

import { Fragment, useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Figure } from "@/lib/program/book/types";
import { cn } from "@/lib/utils";

import { Btn, Controls, PAL, PlayControls, TONE, usePlayer, useReader, useSeen } from "./book-context";

/* The book's drawn diagrams — cycles, trees, context maps, swimlanes, fishbones, scorecards, timelines, funnels,
   concept hubs, layer stacks, before/after, decision walks and sentence anatomies. Each one can be explored: played,
   stepped, clicked, scrubbed or walked. The data comes from the section's own text. */
type F<K extends Figure["kind"]> = Extract<Figure, { kind: K }>;

function Detail({ children, empty }: { children?: ReactNode; empty?: ReactNode }) {
  return <div className="mt-3 min-h-[42px] rounded-lg bg-white px-3.5 py-2.5 text-[13px] leading-[1.55] text-black/65 ring-1 ring-black/[0.05]">{children ?? <span className="text-black/40">{empty}</span>}</div>;
}
const ring = (on: boolean, color: string) => (on ? { boxShadow: `0 0 0 2px ${color}, 0 8px 24px ${color}33` } : undefined);

/* ---------- a loop ---------- */
export function CycleFig({ f }: { f: F<"cycle"> }) {
  const { ui, color } = useReader();
  const n = f.steps.length;
  const p = usePlayer(n, 1200);
  const cur = f.steps[p.at];
  const pos = (i: number) => { const a = -Math.PI / 2 + (i / n) * 2 * Math.PI; return { x: 50 + 38 * Math.cos(a), y: 50 + 39 * Math.sin(a), a }; };
  return (
    <div>
      <PlayControls p={p} n={n} hint={ui.clickNode} />
      <div className="relative mx-auto hidden aspect-[16/10] max-w-[700px] @lg:block">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <ellipse cx="50" cy="50" rx="38" ry="39" fill="none" stroke="rgba(0,0,0,.14)" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
        </svg>
        {f.steps.map((_, i) => {
          const m = pos(i + 0.5);
          return <MaterialSymbol key={`a${i}`} className="absolute -translate-x-1/2 -translate-y-1/2 text-[18px] transition-colors" name="arrow_forward" style={{ left: `${m.x}%`, top: `${m.y}%`, transform: `translate(-50%,-50%) rotate(${(m.a * 180) / Math.PI + 90}deg)`, color: p.at > i ? color : "rgba(0,0,0,.25)" }} />;
        })}
        {f.center ? <span className="absolute left-1/2 top-1/2 grid max-w-[34%] -translate-x-1/2 -translate-y-1/2 justify-items-center gap-1 text-center"><MaterialSymbol className="text-[26px]" name="sync" style={{ color }} /><b className="text-[14px] leading-tight text-[#0d1117]">{f.center}</b></span> : null}
        {p.at >= 0 ? <span className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-700" style={{ left: `${pos(p.at).x}%`, top: `${pos(p.at).y}%`, background: color, boxShadow: `0 0 0 6px ${color}33` }} /> : null}
        {f.steps.map((s, i) => {
          const q = pos(i), on = p.at === i;
          return (
            <button key={i} type="button" data-nohl onClick={() => p.setAt(i)} className={cn("absolute grid w-[27%] -translate-x-1/2 -translate-y-1/2 gap-0.5 rounded-xl bg-white px-3 py-2 text-left leading-tight ring-1 ring-black/[0.07] transition-all", on && "z-[1] scale-105")} style={{ left: `${q.x}%`, top: `${q.y}%`, ...ring(on, color) }}>
              <span className="font-mono text-[10px] font-bold" style={{ color }}>{String(i + 1).padStart(2, "0")}</span>
              <b className="text-[13px] text-[#0d1117]">{s.label}</b>
            </button>
          );
        })}
      </div>
      <ol className="grid gap-1.5 @lg:hidden">
        {f.steps.map((s, i) => (
          <li key={i}><button type="button" data-nohl onClick={() => p.setAt(i)} className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2 text-left ring-1 ring-black/[0.06]" style={ring(p.at === i, color)}><span className="flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-white" style={{ background: color }}>{i + 1}</span><b className="text-[13.5px] text-[#0d1117]">{s.label}</b></button></li>
        ))}
        <li className="flex items-center gap-2 pl-2 text-[12px] text-black/45"><MaterialSymbol className="text-[16px]" name="sync" />{ui.loopBack}</li>
      </ol>
      <Detail empty={f.steps.map((s) => s.label).join(" → ") + " ↻"}>{cur ? <><b className="text-[#0d1117]">{p.at + 1}. {cur.label}</b>{cur.text ? <> — {cur.text}</> : null}</> : undefined}</Detail>
    </div>
  );
}

/* ---------- a breakdown ---------- */
export function TreeFig({ f }: { f: F<"tree"> }) {
  const { ui, color } = useReader();
  const many = f.children.reduce((a, c) => a + (c.children?.length ?? 0), 0) > 14;
  const [open, setOpen] = useState<Set<number>>(() => new Set(many ? [] : f.children.map((_, i) => i)));
  const [sel, setSel] = useState<{ label: string; text?: string } | null>(null);
  const cols = Math.min(f.children.length, 4);
  return (
    <div>
      <Controls hint={ui.clickNode}>
        <Btn onClick={() => setOpen(open.size === f.children.length ? new Set() : new Set(f.children.map((_, i) => i)))}>{open.size === f.children.length ? ui.collapse : ui.expand}</Btn>
      </Controls>
      <div className="grid justify-items-center">
        <button type="button" data-nohl onClick={() => setSel({ label: f.root })} className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm" style={{ background: color }}>{f.root}</button>
        <span className="h-5 w-px bg-black/20" />
      </div>
      <div className="grid gap-3 border-t-2 border-black/10 pt-4 @xl:[grid-template-columns:repeat(var(--c),minmax(0,1fr))]" style={{ ["--c" as string]: cols }}>
        {f.children.map((c, i) => {
          const isOpen = open.has(i), k = PAL[i % PAL.length];
          return (
            <div key={i} className="relative grid content-start gap-2 rounded-xl bg-white p-3 ring-1 ring-black/[0.06]" style={{ borderTop: `3px solid ${k}` }}>
              <span className="absolute -top-[18px] left-1/2 h-4 w-px bg-black/20" aria-hidden />
              <button type="button" data-nohl onClick={() => { setSel(c); if (c.children?.length) setOpen((o) => { const n = new Set(o); if (n.has(i)) n.delete(i); else n.add(i); return n; }); }} className="flex items-start justify-between gap-2 text-left">
                <b className="text-[13.5px] leading-snug text-[#0d1117]">{c.label}</b>
                {c.children?.length ? <span className="flex shrink-0 items-center gap-0.5 font-mono text-[10.5px] text-black/40">{c.children.length}<MaterialSymbol className={cn("text-[16px] transition-transform", isOpen && "rotate-180")} name="expand_more" /></span> : null}
              </button>
              {isOpen && c.children?.length ? (
                <ul className="grid gap-1 border-l-2 pl-2.5" style={{ borderColor: `${k}40` }}>
                  {c.children.map((g, gi) => <li key={gi} className="bk-in"><button type="button" data-nohl onClick={() => setSel(g)} className="text-left text-[12.5px] leading-snug text-black/65 hover:text-black">{g.label}</button></li>)}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
      <Detail empty={`${f.root}: ${f.children.map((c) => c.label).join(" · ")}`}>{sel ? <><b className="text-[#0d1117]">{sel.label}</b>{sel.text ? <> — {sel.text}</> : null}</> : undefined}</Detail>
    </div>
  );
}

/* ---------- a system and what touches it ---------- */
const TYPE_ICON = { person: "person", system: "dns", external: "cloud", store: "database" } as const;
export function ContextFig({ f }: { f: F<"context"> }) {
  const { ui, color } = useReader();
  const [sel, setSel] = useState<number | null>(null);
  const n = f.around.length;
  const pos = (i: number) => { const a = -Math.PI / 2 + (i / n) * 2 * Math.PI; return { x: 50 + 39 * Math.cos(a), y: 50 + 38 * Math.sin(a), a }; };
  const s = sel === null ? null : f.around[sel];
  const arrow = (i: number) => {
    const x = f.around[i], q = pos(i);
    const deg = (Math.atan2((q.y - 50) * 9, (q.x - 50) * 16) * 180) / Math.PI;
    if (x.dir === "both") return { name: "sync_alt", deg };
    return { name: "arrow_forward", deg: x.dir === "in" ? deg + 180 : deg };
  };
  return (
    <div>
      <Controls hint={ui.clickNode} />
      <div className="relative mx-auto hidden aspect-[16/9] max-w-[860px] @2xl:block">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          {f.around.map((_, i) => { const q = pos(i), on = sel === i; return <line key={i} x1="50" y1="50" x2={q.x} y2={q.y} stroke={on ? color : "rgba(0,0,0,.18)"} strokeWidth={on ? 3 : 1.5} strokeDasharray={f.around[i].type === "external" ? "6 5" : undefined} vectorEffect="non-scaling-stroke" opacity={sel === null || on ? 1 : 0.35} />; })}
        </svg>
        {f.around.map((x, i) => {
          const q = pos(i), m = { x: (50 + q.x) / 2, y: (50 + q.y) / 2 }, a = arrow(i);
          return x.dir ? <span key={`d${i}`} className="absolute flex size-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10" style={{ left: `${m.x}%`, top: `${m.y}%`, transform: "translate(-50%,-50%)", opacity: sel === null || sel === i ? 1 : 0.35 }}><MaterialSymbol className="text-[14px]" name={a.name} style={{ transform: `rotate(${a.deg}deg)`, color: sel === i ? color : "rgba(0,0,0,.55)" }} /></span> : null;
        })}
        <span className="absolute left-1/2 top-1/2 grid w-[24%] -translate-x-1/2 -translate-y-1/2 gap-0.5 rounded-2xl px-4 py-3 text-center text-white shadow-lg" style={{ background: color }}>
          <b className="text-[14.5px] leading-tight">{f.center.label}</b>{f.center.sub ? <span className="text-[11.5px] text-white/80">{f.center.sub}</span> : null}
        </span>
        {f.around.map((x, i) => {
          const q = pos(i), on = sel === i;
          return (
            <button key={i} type="button" data-nohl onClick={() => setSel(on ? null : i)} className={cn("absolute grid w-[21%] -translate-x-1/2 -translate-y-1/2 gap-0.5 rounded-xl bg-white px-3 py-2 text-left leading-tight ring-1 ring-black/[0.08] transition-all", sel !== null && !on && "[&>*]:opacity-45")} style={{ left: `${q.x}%`, top: `${q.y}%`, ...ring(on, color) }}>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-black/45"><MaterialSymbol className="text-[15px]" name={TYPE_ICON[x.type]} />{ui.types[x.type]}</span>
              <b className="text-[13px] text-[#0d1117]">{x.label}</b>
              {x.link ? <span className="text-[11px] text-black/50">{x.link}</span> : null}
            </button>
          );
        })}
      </div>
      <ul className="grid gap-1.5 @2xl:hidden">
        <li className="rounded-xl px-3 py-2 text-center text-[14px] font-semibold text-white" style={{ background: color }}>{f.center.label}</li>
        {f.around.map((x, i) => <li key={i}><button type="button" data-nohl onClick={() => setSel(i)} className="flex w-full items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-left ring-1 ring-black/[0.06]" style={ring(sel === i, color)}><MaterialSymbol className="text-[18px] text-black/50" name={TYPE_ICON[x.type]} /><span className="grid"><b className="text-[13px] text-[#0d1117]">{x.label}</b>{x.link ? <span className="text-[11.5px] text-black/50">{x.dir === "in" ? "→ " : x.dir === "out" ? "← " : x.dir === "both" ? "⇄ " : ""}{x.link}</span> : null}</span></button></li>)}
      </ul>
      <Detail empty={`${f.center.label} · ${f.around.map((x) => x.label).join(" · ")}`}>{s ? <><b className="text-[#0d1117]">{s.label}</b> <span className="text-black/45">({ui.types[s.type]}{s.sub ? ` · ${s.sub}` : ""})</span>{s.link ? <> — {s.link}</> : null}{s.text ? <>. {s.text}</> : null}</> : undefined}</Detail>
    </div>
  );
}

/* ---------- who does what, in order ---------- */
const FLAG = { manual: ["front_hand", "#c2410c"], wait: ["hourglass_top", "#a86b00"], error: ["error", "#d81b60"], ok: ["check_circle", "#0f766e"] } as const;
export function LanesFig({ f }: { f: F<"lanes"> }) {
  const { ui, color } = useReader();
  const p = usePlayer(f.steps.length, 1100);
  const cur = f.steps[p.at];
  const flags = [...new Set(f.steps.flatMap((s) => (s.flag ? [s.flag] : [])))];
  return (
    <div>
      <PlayControls p={p} n={f.steps.length} hint={ui.clickNode} />
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] gap-y-1.5" style={{ gridTemplateColumns: `120px repeat(${f.steps.length}, minmax(110px, 1fr))` }}>
          {f.lanes.map((l, li) => (
            <Fragment key={li}>
              <span className="flex items-center rounded-l-xl bg-white px-3 py-3 text-[12px] font-semibold text-black/60 ring-1 ring-black/[0.05]" style={{ gridRow: li + 1, gridColumn: 1, borderLeft: `3px solid ${PAL[li % PAL.length]}` }}>{l}</span>
              <span className="rounded-r-xl bg-white/60" style={{ gridRow: li + 1, gridColumn: `2 / span ${f.steps.length}` }} />
            </Fragment>
          ))}
          {f.steps.map((s, i) => {
            const on = p.at === i, past = p.at > i, fl = s.flag ? FLAG[s.flag] : null;
            return (
              <div key={i} className="relative flex items-center px-1.5 py-1.5" style={{ gridRow: s.lane + 1, gridColumn: i + 2 }}>
                <button type="button" data-nohl onClick={() => p.setAt(i)} className={cn("grid w-full gap-0.5 rounded-lg bg-white px-2.5 py-2 text-left leading-tight ring-1 ring-black/[0.08] transition-all", on && "z-[1] scale-105", p.at >= 0 && !on && !past && "opacity-45")} style={{ borderBottom: `3px solid ${PAL[s.lane % PAL.length]}`, ...ring(on, color) }}>
                  <span className="flex items-center justify-between gap-1"><span className="font-mono text-[10px] font-bold text-black/40">{i + 1}</span>{fl ? <MaterialSymbol className="text-[14px]" name={fl[0]} style={{ color: fl[1] }} /> : null}</span>
                  <b className="text-[12.5px] text-[#0d1117]">{s.label}</b>
                  {s.sub ? <span className="text-[11px] text-black/50">{s.sub}</span> : null}
                </button>
                {i < f.steps.length - 1 ? <MaterialSymbol className="absolute -right-2 top-1/2 z-[2] -translate-y-1/2 text-[14px]" name={f.steps[i + 1].lane > s.lane ? "south_east" : f.steps[i + 1].lane < s.lane ? "north_east" : "arrow_forward"} style={{ color: past ? color : "rgba(0,0,0,.3)" }} /> : null}
              </div>
            );
          })}
        </div>
      </div>
      <Detail empty={<span className="flex flex-wrap gap-x-4 gap-y-1">{flags.map((x) => <span key={x} className="flex items-center gap-1"><MaterialSymbol className="text-[14px]" name={FLAG[x][0]} style={{ color: FLAG[x][1] }} />{ui.flags[x]}</span>)}{!flags.length ? f.lanes.join(" · ") : null}</span>}>
        {cur ? <><b className="text-[#0d1117]">{p.at + 1}. {cur.label}</b> <span className="text-black/45">({f.lanes[cur.lane]}{cur.flag ? ` · ${ui.flags[cur.flag]}` : ""})</span>{cur.sub ? <> — {cur.sub}</> : null}</> : undefined}
      </Detail>
    </div>
  );
}

/* ---------- causes behind one effect ---------- */
export function FishboneFig({ f }: { f: F<"fishbone"> }) {
  const { ui, color } = useReader();
  const [sel, setSel] = useState<number | null>(null);
  const k = Math.ceil(f.bones.length / 2);
  const cx = (i: number) => 4 + (i + 0.75) * (74 / k);
  const s = sel === null ? null : f.bones[sel];
  return (
    <div>
      <Controls hint={ui.clickNode} />
      <div className="relative hidden @2xl:block" style={{ height: f.bones.length > 4 ? 440 : 340 }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <line x1="2" y1="50" x2="80" y2="50" stroke="#0d1117" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          {f.bones.map((_, i) => { const col = Math.floor(i / 2), top = i % 2 === 0, x = cx(col), on = sel === i; return <line key={i} x1={x - 7} y1={top ? 38 : 62} x2={x} y2="50" stroke={on ? color : "rgba(0,0,0,.35)"} strokeWidth={on ? 3 : 2} vectorEffect="non-scaling-stroke" />; })}
        </svg>
        <span className="absolute right-0 top-1/2 grid w-[19%] -translate-y-1/2 rounded-2xl px-3.5 py-3 text-white shadow-lg" style={{ background: color }}><MaterialSymbol className="text-[18px]" name="report" /><b className="text-[13.5px] leading-snug">{f.effect}</b></span>
        {f.bones.map((b, i) => {
          const col = Math.floor(i / 2), top = i % 2 === 0, on = sel === i;
          return (
            <button key={i} type="button" data-nohl onClick={() => setSel(on ? null : i)} className={cn("absolute grid max-h-[37%] content-start gap-1 overflow-y-auto rounded-xl bg-white px-3 py-2 text-left ring-1 ring-black/[0.08] transition-all [scrollbar-width:thin]", sel !== null && !on && "[&>*]:opacity-45")} style={{ left: `${cx(col) - 7}%`, width: `${74 / k - 3}%`, transform: "translateX(-50%)", ...(top ? { bottom: "63%" } : { top: "63%" }), borderTop: `3px solid ${PAL[i % PAL.length]}`, ...ring(on, color) }}>
              <b className="text-[12.5px] uppercase tracking-[0.06em]" style={{ color: PAL[i % PAL.length] }}>{b.label}</b>
              <ul className="grid gap-0.5">{b.causes.map((c, ci) => <li key={ci} className="text-[12px] leading-snug text-black/65">· {c}</li>)}</ul>
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 @2xl:hidden">
        <span className="rounded-xl px-3 py-2 text-[13.5px] font-semibold text-white" style={{ background: color }}>{f.effect}</span>
        {f.bones.map((b, i) => <div key={i} className="rounded-xl bg-white p-3 ring-1 ring-black/[0.06]" style={{ borderLeft: `3px solid ${PAL[i % PAL.length]}` }}><b className="text-[12.5px]" style={{ color: PAL[i % PAL.length] }}>{b.label}</b><ul>{b.causes.map((c, ci) => <li key={ci} className="text-[12.5px] text-black/65">· {c}</li>)}</ul></div>)}
      </div>
      <Detail empty={`${f.effect} ← ${f.bones.map((b) => `${b.label} (${b.causes.length})`).join(" · ")}`}>{s ? <><b className="text-[#0d1117]">{s.label}</b> · {ui.causes(s.causes.length)}: {s.causes.join("; ")}</> : undefined}</Detail>
    </div>
  );
}

/* ---------- weighted scoring ---------- */
export function ScorecardFig({ f }: { f: F<"scorecard"> }) {
  const { ui, color } = useReader();
  const scale = f.scale ?? 5;
  const [w, setW] = useState(() => f.criteria.map((c) => c.weight));
  const wMax = Math.max(5, ...f.criteria.map((c) => c.weight * 2));
  const sumW = w.reduce((a, b) => a + b, 0) || 1;
  const totals = f.options.map((o) => o.scores.reduce((a, s, i) => a + s * w[i], 0) / sumW);
  const best = Math.max(...totals);
  const changed = w.some((x, i) => x !== f.criteria[i].weight);
  return (
    <div>
      <Controls hint={ui.weights}>{changed ? <Btn onClick={() => setW(f.criteria.map((c) => c.weight))}><MaterialSymbol className="text-[15px]" name="restart_alt" />{ui.resetWeights}</Btn> : null}</Controls>
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/[0.06]">
        <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-black/[0.08]">
              <th className="px-3 py-2" />
              {f.criteria.map((c, i) => (
                <th key={i} className="px-3 py-2 align-bottom font-normal">
                  <span className="grid gap-1">
                    <b className="text-[12px] leading-tight text-[#0d1117]">{c.label}</b>
                    <label data-nohl className="flex items-center gap-1.5 text-[11px] text-black/50">×<input type="range" min={0} max={wMax} step={1} value={w[i]} onChange={(e) => setW((x) => x.map((v, j) => (j === i ? Number(e.target.value) : v)))} className="w-[70px]" style={{ accentColor: color }} aria-label={`${c.label} weight`} /><b className="w-4 font-mono text-[#0d1117]">{w[i]}</b></label>
                  </span>
                </th>
              ))}
              <th className="px-3 py-2 align-bottom text-[11px] font-semibold uppercase tracking-[0.06em] text-black/50">{ui.total}</th>
            </tr>
          </thead>
          <tbody>
            {f.options.map((o, oi) => {
              const top = totals[oi] === best;
              return (
                <tr key={oi} className="border-b border-black/[0.05] last:border-0" style={top ? { background: `${color}0c` } : undefined}>
                  <td className="px-3 py-2.5 font-semibold text-[#0d1117]">{top ? <MaterialSymbol className="mr-1 align-[-3px] text-[16px]" name="emoji_events" style={{ color }} /> : null}{o.label}</td>
                  {o.scores.map((s, si) => (
                    <td key={si} className="px-3 py-2.5"><span className="flex gap-0.5" title={`${s} / ${scale}`}>{[...Array(scale)].map((_, d) => <span key={d} className="h-2.5 w-2.5 rounded-sm" style={{ background: d < s ? (w[si] ? color : "rgba(0,0,0,.25)") : "rgba(0,0,0,.08)" }} />)}</span></td>
                  ))}
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2"><span className="h-2 w-24 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(totals[oi] / scale) * 100}%`, background: top ? color : "#475569" }} /></span><b className="font-mono text-[12px]">{totals[oi].toFixed(2)}</b></span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {f.note ? <p className="mt-2 text-[12.5px] text-black/50">{f.note}</p> : null}
    </div>
  );
}

/* ---------- timeboxes on a scale ---------- */
export function TimelineFig({ f }: { f: F<"timeline"> }) {
  const { ui, color } = useReader();
  const max = Math.max(...f.items.map((i) => i.start + i.length), ...(f.marks ?? []).map((m) => m.at));
  const [t, setT] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const step = [0.25, 0.5, 1, 2, 5, 10, 20, 50, 100].find((s) => max / s <= 8) ?? Math.ceil(max / 8);
  const ticks = [...Array(Math.floor(max / step) + 1)].map((_, i) => i * step);
  const pct = (v: number) => `${(v / max) * 100}%`;
  const running = f.items.filter((i) => t >= i.start && t < i.start + i.length);
  const s = sel === null ? null : f.items[sel];
  return (
    <div>
      <label data-nohl className="mb-3 grid gap-1 rounded-xl bg-white px-4 py-2.5 ring-1 ring-black/[0.05]">
        <span className="flex justify-between text-[12.5px]"><b className="text-[#0d1117]">{ui.atTime(t, f.unit)}</b><span className="text-black/50">{running.length ? `${running.map((r) => r.label).join(", ")} — ${ui.running}` : "—"}</span></span>
        <input type="range" min={0} max={max} step={max > 20 ? 1 : max > 4 ? 0.5 : 0.25} value={t} onChange={(e) => setT(Number(e.target.value))} style={{ accentColor: color }} />
      </label>
      <div className="grid grid-cols-[minmax(110px,180px)_minmax(0,1fr)] gap-x-3 gap-y-2">
        <span />
        <span className="relative h-5 border-b border-black/10">{ticks.map((v) => <span key={v} className="absolute -translate-x-1/2 font-mono text-[10px] text-black/40" style={{ left: pct(v) }}>{v}</span>)}</span>
        {f.items.map((it, i) => {
          const on = running.includes(it) || sel === i, c = TONE[it.tone ?? "new"];
          return (
            <Fragment key={i}>
              <button type="button" data-nohl onClick={() => setSel(sel === i ? null : i)} className={cn("truncate text-left text-[12.5px]", on ? "font-semibold text-[#0d1117]" : "text-black/60")}>{it.label}</button>
              <span className="relative h-7 rounded-md bg-black/[0.04]">
                {(f.marks ?? []).map((m, mi) => <span key={mi} className="absolute inset-y-0 w-px border-l border-dashed border-black/25" style={{ left: pct(m.at) }} />)}
                <button type="button" data-nohl onClick={() => setSel(sel === i ? null : i)} className="absolute inset-y-1 rounded transition-all" style={{ left: pct(it.start), width: pct(it.length), background: on ? c : `${c}55`, boxShadow: on ? `0 0 0 2px ${c}40` : undefined }} aria-label={it.label} />
                <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-[#0d1117]" style={{ left: pct(t) }} />
              </span>
            </Fragment>
          );
        })}
        {f.marks?.length ? <><span /><span className="relative h-5">{f.marks.map((m, mi) => <span key={mi} className="absolute -translate-x-1/2 whitespace-nowrap text-[10.5px] font-semibold" style={{ left: pct(m.at), color }}>{m.label}</span>)}</span></> : null}
      </div>
      <Detail empty={f.items.map((i) => `${i.label} (${i.length} ${f.unit})`).join(" · ")}>{s ? <><b className="text-[#0d1117]">{s.label}</b> — {s.start}–{s.start + s.length} {f.unit} ({s.length} {f.unit})</> : undefined}</Detail>
    </div>
  );
}

/* ---------- narrowing down ---------- */
export function FunnelFig({ f }: { f: F<"funnel"> }) {
  const { ui, color } = useReader();
  const p = usePlayer(f.stages.length, 1100);
  const counts = f.stages.map((s) => s.count);
  const top = Math.max(...counts.map((c) => c ?? 0));
  const width = (i: number) => (counts[i] !== undefined && top ? 30 + 70 * (counts[i]! / top) : 100 - i * (60 / Math.max(1, f.stages.length - 1)));
  return (
    <div>
      <PlayControls p={p} n={f.stages.length} hint={ui.clickNode} />
      <ol className="grid justify-items-center gap-1.5">
        {f.stages.map((s, i) => {
          const on = p.at === i;
          return (
            <li key={i} className="grid w-full justify-items-center">
              <button type="button" data-nohl onClick={() => p.setAt(on ? -1 : i)} className={cn("flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-white transition-all duration-500", p.at >= 0 && !on && "opacity-55")} style={{ width: `${width(i)}%`, background: `color-mix(in srgb, ${color} ${100 - i * (50 / Math.max(1, f.stages.length - 1))}%, #0d1117)`, ...ring(on, color) }}>
                <b className="text-[13.5px]">{s.label}</b>
                <span className="flex items-center gap-1.5 font-mono text-[12px] text-white/85">{s.count !== undefined ? s.count : null}{s.items?.length ? <MaterialSymbol className={cn("text-[16px] transition-transform", on && "rotate-180")} name="expand_more" /> : null}</span>
              </button>
              {on && s.items?.length ? <ul className="bk-in mt-1.5 flex max-w-[90%] flex-wrap justify-center gap-1.5">{s.items.map((x, xi) => <li key={xi} className="rounded-full bg-white px-2.5 py-1 text-[12px] text-black/70 ring-1 ring-black/[0.08]">{x}</li>)}</ul> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- a concept and its parts ---------- */
export function HubFig({ f }: { f: F<"hub"> }) {
  const { ui, color } = useReader();
  const [sel, setSel] = useState<number | null>(null);
  const n = f.items.length;
  const pos = (i: number) => { const a = -Math.PI / 2 + (i / n) * 2 * Math.PI; return { x: 50 + 37 * Math.cos(a), y: 50 + 36 * Math.sin(a) }; };
  const s = sel === null ? null : f.items[sel];
  return (
    <div>
      <Controls hint={ui.clickNode} />
      <div className="relative mx-auto hidden aspect-[16/10] max-w-[720px] @lg:block">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <ellipse cx="50" cy="50" rx="37" ry="36" fill="none" stroke="rgba(0,0,0,.06)" strokeWidth="18" vectorEffect="non-scaling-stroke" />
          {f.items.map((_, i) => { const q = pos(i); return <line key={i} x1="50" y1="50" x2={q.x} y2={q.y} stroke={sel === i ? color : "rgba(0,0,0,.14)"} strokeWidth={sel === i ? 3 : 1.5} vectorEffect="non-scaling-stroke" />; })}
        </svg>
        <span className="absolute left-1/2 top-1/2 flex aspect-square w-[24%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full p-3 text-center text-[clamp(11px,2.2cqw,14px)] font-semibold leading-tight text-white shadow-xl" style={{ background: `radial-gradient(circle at 30% 30%, ${color}, #0d1117)` }}>{f.center}</span>
        {f.items.map((x, i) => {
          const q = pos(i), on = sel === i;
          return (
            <button key={i} type="button" data-nohl onClick={() => setSel(on ? null : i)} className={cn("absolute grid w-[18%] -translate-x-1/2 -translate-y-1/2 justify-items-center gap-1 text-center transition-all", sel !== null && !on && "grayscale [&_b]:text-black/40")} style={{ left: `${q.x}%`, top: `${q.y}%` }}>
              <span className={cn("flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.08] transition-transform", on && "scale-110")} style={ring(on, PAL[i % PAL.length])}><MaterialSymbol className="text-[24px]" name={x.icon} style={{ color: PAL[i % PAL.length] }} /></span>
              <b className="text-[12.5px] leading-tight text-[#0d1117]">{x.label}</b>
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 @sm:grid-cols-2 @lg:hidden">
        {f.items.map((x, i) => <button key={i} type="button" data-nohl onClick={() => setSel(i)} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 text-left ring-1 ring-black/[0.06]" style={ring(sel === i, PAL[i % PAL.length])}><MaterialSymbol className="text-[22px]" name={x.icon} style={{ color: PAL[i % PAL.length] }} /><b className="text-[13px] text-[#0d1117]">{x.label}</b></button>)}
      </div>
      <Detail empty={`${f.center}: ${f.items.map((x) => x.label).join(" · ")}`}>{s ? <span className="flex items-start gap-2"><MaterialSymbol className="mt-px text-[18px]" name={s.icon} style={{ color: PAL[(sel ?? 0) % PAL.length] }} /><span><b className="text-[#0d1117]">{s.label}</b> — {s.text}</span></span> : undefined}</Detail>
    </div>
  );
}

/* ---------- layers ---------- */
export function StackFig({ f }: { f: F<"stack"> }) {
  const { ui, color } = useReader();
  const p = usePlayer(f.layers.length, 1300);
  return (
    <div>
      <PlayControls p={p} n={f.layers.length} hint={ui.clickNode} />
      <ol className="mx-auto grid max-w-[820px] gap-2">
        {f.layers.map((l, i) => {
          const on = p.at === i, k = PAL[i % PAL.length];
          return (
            <li key={i} className="transition-all duration-500" style={{ marginInline: `${i * 2.5}%` }}>
              <button type="button" data-nohl onClick={() => p.setAt(on ? -1 : i)} className={cn("grid w-full gap-1 rounded-xl px-4 py-3 text-left transition-all", p.at >= 0 && !on && "opacity-55")} style={{ background: on ? k : `${k}14`, boxShadow: on ? `0 10px 30px ${k}55` : `inset 0 0 0 1px ${k}40, 0 4px 0 ${k}30` }}>
                <span className="flex items-baseline justify-between gap-3"><b className={cn("text-[14px]", on ? "text-white" : "text-[#0d1117]")}>{l.label}</b>{l.sub ? <span className={cn("text-[12px]", on ? "text-white/80" : "text-black/50")}>{l.sub}</span> : null}</span>
                {on && l.items?.length ? <span className="bk-in flex flex-wrap gap-1.5 pt-1">{l.items.map((x, xi) => <span key={xi} className="rounded-full bg-white/20 px-2.5 py-0.5 text-[12px] text-white">{x}</span>)}</span> : null}
              </button>
            </li>
          );
        })}
      </ol>
      <span className="sr-only" style={{ color }} />
    </div>
  );
}

/* ---------- today → target ---------- */
export function DeltaFig({ f }: { f: F<"delta"> }) {
  const { ui, color } = useReader();
  const [ref, seen] = useSeen<HTMLDivElement>();
  const [t, setT] = useState(0);
  const at = seen ? t : 0;
  const bl = f.beforeLabel ?? ui.today, al = f.afterLabel ?? ui.target;
  return (
    <div ref={ref}>
      <Controls>
        <span role="group" className="flex rounded-full bg-black/[0.05] p-0.5" data-nohl>
          {([[0, bl], [1, al]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => setT(v)} aria-pressed={t === v} className={cn("rounded-full px-3 py-1 text-[12px] font-semibold transition-colors", t === v ? "bg-white text-[#0d1117] shadow-sm" : "text-black/50")}>{l}</button>)}
        </span>
        <input data-nohl type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} className="w-36" style={{ accentColor: color }} aria-label={`${bl} → ${al}`} />
      </Controls>
      <div className="grid gap-4">
        {f.rows.map((r, i) => {
          const v = r.before + (r.after - r.before) * at, top = Math.max(r.before, r.after) || 1;
          const improving = r.better === "lower" ? r.after < r.before : r.after > r.before;
          const change = r.before ? Math.round(((r.after - r.before) / r.before) * 100) : 0;
          const c = at < 0.5 ? "#c2410c" : improving ? "#0f766e" : "#c2410c";
          return (
            <div key={i} className="grid gap-1.5">
              <span className="flex items-baseline justify-between gap-3 text-[13.5px]"><span className="text-[#24292f]">{r.label}</span><span className="flex shrink-0 items-baseline gap-2"><b className="font-mono text-[15px]" style={{ color: c }}>{Number.isInteger(r.before) && Number.isInteger(r.after) ? Math.round(v) : v.toFixed(1)}</b><span className="text-[12px] text-black/45">{r.unit}</span></span></span>
              <span className="relative h-3 overflow-hidden rounded-full bg-black/[0.06]">
                <span className="absolute inset-y-0 left-0 rounded-full border-r-2 border-dashed border-black/30" style={{ width: `${(r.after / top) * 100}%` }} />
                <span className="absolute inset-y-0 left-0 rounded-full transition-[width,background] duration-700" style={{ width: `${(v / top) * 100}%`, background: c }} />
              </span>
              <span className="flex justify-between text-[11px] text-black/45"><span>{bl}: {r.before} {r.unit}</span><span>{al}: {r.after} {r.unit} · {change > 0 ? "+" : ""}{change}% ({improving ? ui.better : ui.worse})</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- a decision to walk ---------- */
export function DecideFig({ f }: { f: F<"decide"> }) {
  const { ui, color } = useReader();
  const byId = new Map(f.nodes.map((n) => [n.id, n]));
  const [path, setPath] = useState<{ id: string; ans?: "yes" | "no" }[]>([{ id: f.start }]);
  const [map, setMap] = useState(false);
  const cur = byId.get(path[path.length - 1].id);
  const onPath = new Set(path.map((x) => x.id));
  const answer = (a: "yes" | "no") => { const nx = cur?.[a]; if (nx) setPath((p) => [...p.slice(0, -1), { ...p[p.length - 1], ans: a }, { id: nx }]); };
  const toneC = (t?: string) => (t === "good" ? "#0f766e" : t === "bad" ? "#c2410c" : "#475569");
  const Tree = ({ id, depth, seen }: { id: string; depth: number; seen: Set<string> }): ReactNode => {
    const n = byId.get(id);
    if (!n || depth > 10 || seen.has(id)) return null;
    const next = new Set(seen).add(id);
    const lit = onPath.has(id);
    if (!n.q) return <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12.5px] font-semibold text-white", !lit && "opacity-70")} style={{ background: toneC(n.tone) }}><MaterialSymbol className="text-[15px]" name={n.tone === "bad" ? "block" : n.tone === "good" ? "check_circle" : "arrow_forward"} />{n.result}</span>;
    return (
      <div className="grid gap-1.5">
        <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[12.5px] font-semibold text-[#0d1117] ring-1", lit ? "ring-2" : "ring-black/10")} style={lit ? { ["--tw-ring-color" as string]: color } : undefined}><MaterialSymbol className="text-[15px]" name="help" style={{ color }} />{n.q}</span>
        <div className="grid gap-1.5 border-l-2 border-black/10 pl-4">
          {(["yes", "no"] as const).map((a) => <div key={a} className="flex items-start gap-2"><span className="mt-1 shrink-0 font-mono text-[10.5px] font-bold uppercase" style={{ color: a === "yes" ? "#0f766e" : "#c2410c" }}>{a === "yes" ? ui.yes : ui.no}</span><Tree id={n[a]!} depth={depth + 1} seen={next} /></div>)}
        </div>
      </div>
    );
  };
  return (
    <div>
      <Controls>
        <Btn onClick={() => setMap((m) => !m)} on={map} color={color}><MaterialSymbol className="text-[15px]" name={map ? "directions_walk" : "account_tree"} />{map ? ui.walkIt : ui.showMap}</Btn>
        {path.length > 1 ? <Btn onClick={() => setPath([{ id: f.start }])}><MaterialSymbol className="text-[15px]" name="restart_alt" />{ui.startOver}</Btn> : null}
      </Controls>
      {map ? <div className="overflow-x-auto rounded-xl bg-white p-4 ring-1 ring-black/[0.05]"><Tree id={f.start} depth={0} seen={new Set()} /></div> : (
        <div className="grid gap-2">
          {path.slice(0, -1).map((x, i) => (
            <button key={i} type="button" data-nohl onClick={() => setPath(path.slice(0, i + 1).map((y, j) => (j === i ? { id: y.id } : y)))} className="flex items-center gap-2 text-left text-[12.5px] text-black/50 hover:text-black/80">
              <MaterialSymbol className="text-[15px]" name="subdirectory_arrow_right" />{byId.get(x.id)?.q} <b style={{ color: x.ans === "yes" ? "#0f766e" : "#c2410c" }}>{x.ans === "yes" ? ui.yes : ui.no}</b>
            </button>
          ))}
          {cur?.q ? (
            <div key={cur.id} className="bk-in grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
              <b className="flex items-start gap-2 text-[16px] leading-snug text-[#0d1117]"><MaterialSymbol className="mt-0.5 text-[20px]" name="help" style={{ color }} />{cur.q}</b>
              <span className="flex gap-2" data-nohl>
                <button type="button" onClick={() => answer("yes")} className="rounded-full bg-[#0f766e] px-5 py-1.5 text-[13px] font-semibold text-white hover:opacity-90">{ui.yes}</button>
                <button type="button" onClick={() => answer("no")} className="rounded-full bg-[#c2410c] px-5 py-1.5 text-[13px] font-semibold text-white hover:opacity-90">{ui.no}</button>
              </span>
            </div>
          ) : cur ? (
            <div key={cur.id} className="bk-in flex items-start gap-3 rounded-2xl p-5 text-white" style={{ background: toneC(cur.tone) }}>
              <MaterialSymbol className="text-[24px]" name={cur.tone === "bad" ? "block" : cur.tone === "good" ? "check_circle" : "arrow_forward"} />
              <b className="text-[15.5px] leading-snug">{cur.result}</b>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ---------- a sentence and its parts ---------- */
export function AnatomyFig({ f }: { f: F<"anatomy"> }) {
  const { ui } = useReader();
  const named = f.parts.map((x, i) => ({ ...x, i })).filter((x) => x.label);
  const p = usePlayer(named.length, 1500);
  const cur = named[p.at];
  const colorOf = (i: number) => PAL[named.findIndex((x) => x.i === i) % PAL.length];
  return (
    <div>
      <PlayControls p={p} n={named.length} hint={ui.clickPart} />
      <p className="rounded-2xl bg-white px-5 py-6 text-[18px] leading-[2.3] text-[#24292f] ring-1 ring-black/[0.05]">
        {f.parts.map((x, i) => {
          if (!x.label) return <span key={i} className={cn("transition-opacity", cur && "opacity-40")}>{x.text}</span>;
          const k = colorOf(i), on = cur?.i === i, ni = named.findIndex((y) => y.i === i);
          /* the spaces around a part sit outside its highlight */
          const lead = x.text.match(/^\s*/)![0], trail = x.text.match(/\s*$/)![0];
          return (
            <Fragment key={i}>{lead}<span role="button" tabIndex={0} data-nohl onClick={() => p.setAt(on ? -1 : ni)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); p.setAt(on ? -1 : ni); } }} className={cn("relative cursor-pointer rounded-md px-1 py-0.5 transition-all", cur && !on && "opacity-50")} style={{ background: on ? k : `${k}1f`, color: on ? "#fff" : undefined, boxShadow: `inset 0 -3px 0 ${k}` }}>
              <span className="absolute -top-[18px] left-1 whitespace-nowrap font-mono text-[9.5px] font-bold uppercase tracking-[0.08em]" style={{ color: k }}>{x.label}</span>
              {x.text.trim()}
            </span>{trail}</Fragment>
          );
        })}
      </p>
      <Detail empty={<span className="flex flex-wrap gap-1.5">{named.map((x) => <span key={x.i} className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold text-white" style={{ background: colorOf(x.i) }}>{x.label}</span>)}</span>}>
        {cur ? <><b style={{ color: colorOf(cur.i) }}>{cur.label}</b> — “{cur.text.trim()}”{cur.note ? <>. {cur.note}</> : null}</> : undefined}
      </Detail>
    </div>
  );
}
