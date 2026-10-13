"use client";

import { Fragment, useRef, useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { KnowledgeEntry, Lesson, ModelMeta, Template } from "@/lib/program";
import type { Block, Book, BookChapter, Figure } from "@/lib/program/book/types";
import { cn } from "@/lib/utils";

import { Btn, COL, Controls, Inline, Paras, PlayControls, TONE, WIDE, hash, label, plain, usePlayer, useReader, useSeen } from "./book-context";
import { AnatomyFig, ContextFig, CycleFig, DecideFig, DeltaFig, FishboneFig, FunnelFig, HubFig, LanesFig, ScorecardFig, StackFig, TimelineFig, TreeFig } from "./book-diagrams";
import { FlowMap } from "./flow-map";
import { workflowGraph } from "./lesson-panels";
import { StructureView, type Structure } from "./program-ui";
import { TemplateBody, templateTitle } from "./template-view";

/* The book's interactive pieces: every figure can be played, stepped, dragged, sorted or probed, and the structured
   blocks (tables, steps, mistakes, contrasts, terms, checklists) can be sorted, ticked, revealed or quizzed. All of it
   is drawn from the book's own data — nothing here adds facts. */
export type BookFigures = {
  lessons: Record<string, Lesson>;
  knowledge: Record<string, KnowledgeEntry>;
  templates: Record<string, Template>;
  routes: ModelMeta["routes"];
  days: { day: number; title: string }[];
};

const TRACE: [string, string][] = [["REQ", "Request"], ["Q", "Question"], ["SYS", "System element"], ["DF", "Data flow"], ["INT", "Integration"], ["C/A", "Constraint / assumption"], ["H", "Hypothesis"], ["QA", "Quality attribute"], ["SPK", "Spike"], ["RC", "Root cause"], ["TPS", "Problem statement"], ["OPT", "Option"], ["ARO", "Architecture option"], ["EST", "Estimate"], ["RSK", "Risk"], ["ADR", "Decision"], ["LRN", "Learning"]];

/* ---------- figures ---------- */
export function FigureView({ f, figures, book }: { f: Figure; figures: BookFigures; book: Book }): ReactNode {
  switch (f.kind) {
    case "workflow": {
      const lesson = figures.lessons[f.fid];
      if (!lesson?.workflows.length) return null;
      const g = workflowGraph(lesson, 0);
      return <div className="overflow-x-auto"><div className="min-w-[720px]"><FlowMap nodes={g.nodes} edges={g.edges} branches={g.branches} authority={g.authority} routes={figures.routes} label={`${lesson.code} ${lesson.workflows[0].title}`} flow /></div></div>;
    }
    case "knowledge": {
      const k = figures.knowledge[f.name];
      if (!k) return null;
      return (
        <div className="grid gap-3">
          <span className="flex flex-wrap items-baseline gap-2"><b className="text-[15px] text-[#0d1117]">{k.name}</b>{k.type ? <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/40">{k.type}</span> : null}</span>
          {k.what ? <p className="max-w-[760px] text-[14px] leading-6 text-black/60">{k.what}</p> : null}
          {k.structure ? <StructureView s={k.structure as Structure} /> : null}
        </div>
      );
    }
    case "template": return <TemplateFig t={figures.templates[f.id]} />;
    case "days": return <DaysFig figures={figures} book={book} />;
    case "trace": return <TraceFig f={f} />;
    case "ladder": return <LadderFig f={f} />;
    case "split": return <SplitFig f={f} />;
    case "bars": return <BarsFig f={f} />;
    case "matrix": return <MatrixFig f={f} />;
    case "flow": return <FlowFig f={f} />;
    case "ranges": return <RangesFig f={f} />;
    case "cycle": return <CycleFig f={f} />;
    case "tree": return <TreeFig f={f} />;
    case "context": return <ContextFig f={f} />;
    case "lanes": return <LanesFig f={f} />;
    case "fishbone": return <FishboneFig f={f} />;
    case "scorecard": return <ScorecardFig f={f} />;
    case "timeline": return <TimelineFig f={f} />;
    case "funnel": return <FunnelFig f={f} />;
    case "hub": return <HubFig f={f} />;
    case "stack": return <StackFig f={f} />;
    case "delta": return <DeltaFig f={f} />;
    case "decide": return <DecideFig f={f} />;
    case "anatomy": return <AnatomyFig f={f} />;
  }
}

function TemplateFig({ t }: { t?: Template }) {
  const { ui } = useReader();
  const [open, setOpen] = useState(false);
  if (!t) return null;
  return (
    <div className="grid gap-3">
      <Controls>
        <span className="mr-auto flex items-center gap-2"><MaterialSymbol className="text-[18px] text-[#007373]" name="description" /><b className="text-[14.5px] text-[#0d1117]">{templateTitle(t)}</b></span>
        <Btn onClick={() => setOpen((o) => !o)}><MaterialSymbol className="text-[15px]" name={open ? "unfold_less" : "unfold_more"} />{open ? ui.collapse : ui.expand}</Btn>
      </Controls>
      <div className={cn("relative rounded-xl bg-white p-4 ring-1 ring-black/[0.05]", open ? "max-h-[720px] overflow-y-auto" : "max-h-[260px] overflow-hidden")}>
        <TemplateBody t={t} />
        {!open ? <button type="button" data-nohl onClick={() => setOpen(true)} aria-label={ui.expand} className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" /> : null}
      </div>
    </div>
  );
}

function DaysFig({ figures, book }: { figures: BookFigures; book: Book }) {
  const { ui, color, goTo } = useReader();
  const [on, setOn] = useState(0);
  const qs = new Map(book.chapters.filter((c) => c.day).map((c) => [c.day!, c]));
  const d = figures.days[on];
  const ch = d ? qs.get(d.day) : undefined;
  return (
    <div className="grid gap-4">
      <ol className="relative grid grid-cols-5 gap-2">
        <span className="absolute left-[10%] right-[10%] top-[18px] h-[2px] bg-black/10" aria-hidden />
        {figures.days.map((x, i) => (
          <li key={x.day} className="relative grid justify-items-center gap-2 text-center">
            <button type="button" data-nohl onClick={() => setOn(i)} aria-pressed={on === i} className={cn("relative z-[1] flex size-9 items-center justify-center rounded-full font-mono text-[13px] font-bold ring-4 ring-[#f7f8fa] transition-transform hover:scale-110", on === i ? "text-white" : "bg-white text-black/60 ring-offset-0")} style={on === i ? { background: color } : { boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,.15)" }}>{`${book.number ?? "1"}.${x.day}`}</button>
            <span className={cn("text-[12px] leading-tight", on === i ? "font-semibold text-[#0d1117]" : "text-black/50")}>{x.title}</span>
            {i === figures.days.length - 1 ? <span className="rounded-full bg-[#0d1117] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-white">{ui.decision}</span> : null}
          </li>
        ))}
      </ol>
      {d ? (
        <div className="grid gap-2 rounded-xl bg-white p-4 ring-1 ring-black/[0.05] @lg:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <span className="grid gap-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color }}>{ui.topic(`${book.number ?? "1"}.${d.day}`)} · {ch?.kicker.split("·").pop()?.trim()}</span>
            <b className="text-[15px] text-[#0d1117]">{ch?.question ?? d.title}</b>
            <span className="text-[13px] text-black/50">{ch?.sections.map((s) => s.code).join(" · ")}</span>
          </span>
          {ch ? <Btn onClick={() => goTo(`ch-${ch.id}`)} on color={color}>{ui.openChapter}<MaterialSymbol className="text-[15px]" name="arrow_forward" /></Btn> : null}
        </div>
      ) : null}
    </div>
  );
}

function TraceFig({ f }: { f: Extract<Figure, { kind: "trace" }> }) {
  const { ui, color } = useReader();
  const from = f.from ? TRACE.findIndex(([x]) => x === f.from) : 0, to = f.to ? TRACE.findIndex(([x]) => x === f.to) : TRACE.length - 1;
  const chain = TRACE.slice(Math.max(0, from), to + 1);
  const p = usePlayer(chain.length, 900);
  const cur = chain[p.at];
  return (
    <div>
      <PlayControls p={p} n={chain.length} hint={ui.traceHint} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {chain.map(([x, l], i) => {
          const lit = p.at >= 0 && i <= p.at, here = i === p.at;
          return (
            <li key={x} className="flex items-center gap-1.5">
              <button type="button" data-nohl onClick={() => p.setAt(i)} className={cn("grid rounded-lg px-2.5 py-1.5 text-left leading-tight transition-all", here ? "scale-110 shadow-md" : "", lit ? "text-white" : "bg-white ring-1 ring-black/[0.06] hover:ring-black/20")} style={lit ? { background: here ? color : `${color}cc` } : undefined}>
                <b className="font-mono text-[12px]" style={lit ? undefined : { color }}>{x}</b><span className={cn("text-[11px]", lit ? "text-white/85" : "text-black/55")}>{l}</span>
              </button>
              {i < chain.length - 1 ? <MaterialSymbol className={cn("text-[14px] transition-colors", p.at > i ? "" : "text-black/25")} name="arrow_forward" style={p.at > i ? { color } : undefined} /> : null}
            </li>
          );
        })}
      </ol>
      {cur ? (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[13px] text-black/65 ring-1 ring-black/[0.05]">
          <b className="font-mono" style={{ color }}>{cur[0]}</b> {cur[1]}
          {p.at > 0 ? <> · {ui.comesFrom} <b className="font-mono">{chain[p.at - 1][0]}</b></> : null}
          {p.at < chain.length - 1 ? <> · {ui.feeds} <b className="font-mono">{chain[p.at + 1][0]}</b></> : null}
        </p>
      ) : null}
    </div>
  );
}

function LadderFig({ f }: { f: Extract<Figure, { kind: "ladder" }> }) {
  const { ui, color } = useReader();
  const [shown, setShown] = useState(0);
  const all = f.rungs.length + 1;
  return (
    <div className="mx-auto grid max-w-[620px] gap-3">
      <Controls>
        <Btn onClick={() => setShown(all)} disabled={shown >= all}>{ui.showAll}</Btn>
        {shown ? <Btn onClick={() => setShown(0)}><MaterialSymbol className="text-[15px]" name="restart_alt" /></Btn> : null}
      </Controls>
      <div className="grid justify-items-center gap-1.5">
        <span className="w-full rounded-xl bg-white px-4 py-2.5 text-center text-[13.5px] text-black/55 ring-1 ring-black/10">{shown >= all ? <s>{f.top}</s> : f.top} <span className="ml-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#a86b00]">{ui.keptOption}</span></span>
        {f.rungs.slice(0, shown).map((r, ri) => (
          <Fragment key={ri}>
            <MaterialSymbol className="bk-in text-[18px] text-black/30" name="south" />
            <span className="bk-in w-full rounded-xl bg-white px-4 py-2.5 text-left text-[13.5px] text-[#24292f] ring-1 ring-black/[0.05]">{r}</span>
          </Fragment>
        ))}
        {shown < all ? (
          <button type="button" data-nohl onClick={() => setShown((s) => s + 1)} className="mt-1 flex items-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-white" style={{ borderColor: color + '55', color }}>
            <MaterialSymbol className="text-[17px]" name="south" />{ui.askWhy} <span className="font-mono text-[11px] text-black/40">{shown}/{all}</span>
          </button>
        ) : (
          <>
            <MaterialSymbol className="bk-in text-[18px] text-black/30" name="south" />
            <span className="bk-in grid w-full gap-0.5 rounded-xl px-4 py-3 text-center text-white" style={{ background: color }}>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">{ui.realCondition}</span>
              <b className="text-[14.5px]">{f.bottom}</b>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function SplitFig({ f }: { f: Extract<Figure, { kind: "split" }> }) {
  const { ui } = useReader();
  const cards = [...Array(Math.max(f.left.items.length, f.right.items.length))].flatMap((_, i) => [
    ...(i < f.left.items.length ? [{ id: `l${i}`, text: f.left.items[i], side: "l" as const }] : []),
    ...(i < f.right.items.length ? [{ id: `r${i}`, text: f.right.items[i], side: "r" as const }] : []),
  ]).sort((a, b) => hash(a.text) - hash(b.text));
  const [put, setPut] = useState<Record<string, "l" | "r">>({});
  const placed = Object.keys(put).length, right = cards.filter((c) => put[c.id] === c.side).length;
  const sides = [["l", f.left], ["r", f.right]] as const;
  return (
    <div className="grid gap-3">
      <Controls hint={placed < cards.length ? ui.sortIt : ui.score(right, cards.length)}>
        {placed < cards.length ? <Btn onClick={() => setPut(Object.fromEntries(cards.map((c) => [c.id, c.side])))}>{ui.showAnswer}</Btn> : null}
        {placed ? <Btn onClick={() => setPut({})}><MaterialSymbol className="text-[15px]" name="restart_alt" />{ui.tryAgain}</Btn> : null}
      </Controls>
      {placed < cards.length ? (
        <div data-nohl className="flex flex-wrap gap-2">
          {cards.filter((c) => !put[c.id]).map((c) => (
            <span key={c.id} className="flex items-center gap-1 rounded-full bg-white py-1 pl-1 pr-1 text-[13px] text-[#24292f] shadow-sm ring-1 ring-black/[0.08]">
              <button type="button" onClick={() => setPut((p) => ({ ...p, [c.id]: "l" }))} aria-label={`← ${f.left.title}`} className="flex size-6 items-center justify-center rounded-full hover:bg-black/[0.06]" style={{ color: TONE[f.left.tone ?? "neutral"] }}><MaterialSymbol className="text-[16px]" name="arrow_back" /></button>
              <span className="px-1">{c.text}</span>
              <button type="button" onClick={() => setPut((p) => ({ ...p, [c.id]: "r" }))} aria-label={`${f.right.title} →`} className="flex size-6 items-center justify-center rounded-full hover:bg-black/[0.06]" style={{ color: TONE[f.right.tone ?? "neutral"] }}><MaterialSymbol className="text-[16px]" name="arrow_forward" /></button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="grid gap-4 @md:grid-cols-2">
        {sides.map(([key, side]) => {
          const c = TONE[side.tone ?? "neutral"];
          return (
            <div key={key} className="grid min-h-[120px] content-start gap-2.5 rounded-xl bg-white p-4 ring-1 ring-black/[0.05]" style={{ borderTop: `3px solid ${c}` }}>
              <b className="text-[14.5px]" style={{ color: c }}>{side.title}</b>
              <ul className="grid gap-2">
                {cards.filter((x) => put[x.id] === key).map((x) => {
                  const ok = x.side === key;
                  return (
                    <li key={x.id} className={cn("flex items-start gap-2 rounded-lg px-2 py-1 text-[14px] leading-6 text-[#24292f] transition-colors", ok ? "" : "bg-[#fde8e8]")}>
                      <MaterialSymbol className="mt-1 shrink-0 text-[15px]" name={ok ? "check" : "close"} style={{ color: ok ? "#0f766e" : "#c2410c" }} />{x.text}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarsFig({ f }: { f: Extract<Figure, { kind: "bars" }> }) {
  const { ui, color } = useReader();
  const [ref, seen] = useSeen<HTMLDivElement>();
  const [sorted, setSorted] = useState(false);
  const [on, setOn] = useState<number | null>(null);
  const rows = f.rows.map((r, i) => ({ ...r, i }));
  const shown = sorted ? [...rows].sort((a, b) => b.value / b.max - a.value / a.max) : rows;
  const sel = on === null ? null : f.rows[on];
  return (
    <div ref={ref} className="grid gap-3">
      {f.rows.length > 2 ? <Controls>{f.unit ? <span className="mr-auto text-[12px] text-black/45">{f.unit}</span> : null}<Btn onClick={() => setSorted((s) => !s)} on={sorted} color={color}><MaterialSymbol className="text-[15px]" name="sort" />{sorted ? ui.bookOrder : ui.sortBy}</Btn></Controls> : f.unit ? <span className="text-[12px] text-black/45">{f.unit}</span> : null}
      <div className="grid gap-3.5">
        {shown.map((r) => {
          const pct = Math.min(100, (r.value / r.max) * 100), c = TONE[r.tone ?? "neutral"];
          return (
            <button key={r.i} type="button" data-nohl onClick={() => setOn(on === r.i ? null : r.i)} onMouseEnter={() => setOn(r.i)} className={cn("grid gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors", on === r.i ? "bg-white shadow-sm ring-1 ring-black/[0.05]" : "hover:bg-white/70")}>
              <span className="flex items-baseline justify-between gap-3 text-[13.5px]"><span className="text-[#24292f]">{r.label}</span><b className="shrink-0 font-mono" style={{ color: c }}>{r.value.toLocaleString("en-US")}</b></span>
              <span className="h-3 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full transition-[width] duration-1000 ease-out" style={{ width: seen ? `${pct}%` : "0%", background: c }} /></span>
            </button>
          );
        })}
      </div>
      <p className="min-h-[38px] rounded-lg bg-white px-3 py-2 text-[13px] leading-[1.5] text-black/60 ring-1 ring-black/[0.05]">
        {sel ? <><b className="text-[#0d1117]">{sel.label}</b> — {sel.value.toLocaleString("en-US")} ({ui.ofMax(Math.round((sel.value / sel.max) * 100))}){sel.note ? <> · {sel.note}</> : null}</> : <span className="text-black/40">{f.rows.map((r) => r.label).join(" · ")}</span>}
      </p>
    </div>
  );
}

function MatrixFig({ f }: { f: Extract<Figure, { kind: "matrix" }> }) {
  const { ui, color } = useReader();
  const [pts, setPts] = useState(() => f.points.map((p) => ({ ...p })));
  const [sel, setSel] = useState<number | null>(null);
  const drag = useRef<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const hot = f.hot ?? "tr";
  const isHot = (p: { x: number; y: number }) => p.y >= 0.5 && (hot === "tr" ? p.x >= 0.5 : p.x < 0.5);
  const at = (e: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: Math.max(0, Math.min(1, (pt.x - 50) / 360)), y: Math.max(0, Math.min(1, (250 - pt.y) / 240)) };
  };
  const axis = (s: string) => s.replace(/[→↑←↓]/g, "").trim();
  const reading = (p: { x: number; y: number }) => `${p.y >= 0.5 ? ui.high : ui.low} ${axis(f.y).toLowerCase()} · ${p.x >= 0.5 ? ui.high : ui.low} ${axis(f.x).toLowerCase()}`;
  const moved = pts.some((p, i) => p.x !== f.points[i].x || p.y !== f.points[i].y);
  return (
    <div className="grid gap-2">
      <Controls hint={ui.dragHint}>{moved ? <Btn onClick={() => { setPts(f.points.map((p) => ({ ...p }))); setSel(null); }}><MaterialSymbol className="text-[15px]" name="restart_alt" />{ui.reset}</Btn> : null}</Controls>
      <div className="grid items-center gap-4 @3xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <svg ref={svg} data-nohl viewBox="0 0 420 300" className="w-full touch-none select-none" role="img" aria-label={`${f.y} / ${f.x}`}
          onPointerMove={(e) => { if (drag.current === null) return; const p = at(e); if (p) setPts((ps) => ps.map((x, i) => (i === drag.current ? { ...x, ...p } : x))); }}
          onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }}>
          <rect x="50" y="10" width="360" height="240" rx="10" fill="#fff" stroke="rgba(0,0,0,.08)" />
          <rect x={hot === "tr" ? 230 : 50} y="10" width="180" height="120" fill={`${color}14`} />
          <line x1="230" y1="10" x2="230" y2="250" stroke="rgba(0,0,0,.1)" strokeDasharray="4 4" /><line x1="50" y1="130" x2="410" y2="130" stroke="rgba(0,0,0,.1)" strokeDasharray="4 4" />
          <text x={hot === "tr" ? 404 : 56} y="122" textAnchor={hot === "tr" ? "end" : "start"} fontSize="11" fontWeight="700" fill={color}>{f.hotLabel ?? ui.spikeFirst}</text>
          <text x="230" y="276" textAnchor="middle" fontSize="11.5" fill="rgba(0,0,0,.5)">{f.x}</text>
          <text x="20" y="130" textAnchor="middle" fontSize="11.5" fill="rgba(0,0,0,.5)" transform="rotate(-90 20 130)">{f.y}</text>
          {pts.map((p, i) => {
            const x = 50 + p.x * 360, y = 250 - p.y * 240, on = sel === i;
            return (
              <g key={i} className="cursor-grab outline-none active:cursor-grabbing" onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = i; setSel(i); }} tabIndex={0} role="button" aria-label={p.label} onKeyDown={(e) => {
                const d = 0.05, k = e.key;
                if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(k)) return;
                e.preventDefault(); e.stopPropagation(); setSel(i);
                setPts((ps) => ps.map((q, j) => (j === i ? { ...q, x: Math.max(0, Math.min(1, q.x + (k === "ArrowRight" ? d : k === "ArrowLeft" ? -d : 0))), y: Math.max(0, Math.min(1, q.y + (k === "ArrowUp" ? d : k === "ArrowDown" ? -d : 0))) } : q)));
              }}>
                <circle cx={x} cy={y} r={on ? 16 : 13} fill={color} opacity={0.14} />
                <circle cx={x} cy={y} r={on ? 9 : 7} fill={isHot(p) ? color : "#475569"} stroke="#fff" strokeWidth="2" />
                <text x={p.x > 0.5 ? x - 13 : x + 13} y={y - 11} textAnchor={p.x > 0.5 ? "end" : "start"} fontSize="11.5" fontWeight="700" fill="#0d1117" style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 4 }}>{p.label}</text>
              </g>
            );
          })}
        </svg>
        <div className="grid gap-2">
          {pts.map((p, i) => (
            <button key={i} type="button" data-nohl onClick={() => setSel(i)} className={cn("grid gap-0.5 rounded-xl px-3 py-2.5 text-left ring-1 transition-colors", sel === i ? "bg-white ring-black/15 shadow-sm" : "ring-transparent hover:bg-white/70")}>
              <b className="flex items-center gap-2 text-[13.5px] text-[#0d1117]"><span className="size-2.5 rounded-full" style={{ background: isHot(p) ? color : "#475569" }} />{p.label}</b>
              <span className="text-[12px] text-black/50">{reading(p)}{isHot(p) ? <> · <b style={{ color }}>{f.hotLabel ?? ui.spikeFirst}</b></> : null}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowFig({ f }: { f: Extract<Figure, { kind: "flow" }> }) {
  const { ui } = useReader();
  const p = usePlayer(f.steps.length);
  const cur = f.steps[p.at];
  const tones = [...new Set(f.steps.map((s) => s.tone ?? "system"))];
  return (
    <div>
      <PlayControls p={p} n={f.steps.length} />
      <ol className="flex flex-wrap items-stretch justify-center gap-2">
        {f.steps.map((s, i) => {
          const c = TONE[s.tone ?? "system"], here = p.at === i, past = p.at > i;
          return (
            <li key={i} className="flex items-center gap-2">
              <button type="button" data-nohl onClick={() => p.setAt(i)} className={cn("grid min-w-[120px] rounded-xl px-3.5 py-2.5 text-left leading-tight ring-1 transition-all duration-300", here ? "-translate-y-1 scale-105 shadow-lg ring-transparent" : "ring-black/[0.06] hover:-translate-y-0.5", p.at >= 0 && !here && !past ? "opacity-50" : "")} style={{ borderBottom: `3px solid ${c}`, background: here ? c : "#fff" }}>
                <b className={cn("text-[13.5px]", here ? "text-white" : "text-[#0d1117]")}>{s.label}</b>
                {s.sub ? <span className="text-[11.5px]" style={{ color: here ? "rgba(255,255,255,.85)" : c }}>{s.sub}</span> : null}
              </button>
              {i < f.steps.length - 1 ? <MaterialSymbol className="text-[16px] transition-colors" name="arrow_forward" style={{ color: past ? c : "rgba(0,0,0,.25)" }} /> : null}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] ring-1 ring-black/[0.05]">
        {cur ? <span className="mr-auto text-black/70"><b className="text-[#0d1117]">{ui.stepOf(p.at + 1, f.steps.length)}:</b> {cur.label}{cur.sub ? ` — ${cur.sub}` : ""}</span> : <span className="mr-auto" />}
        {tones.map((t) => <span key={t} className="flex items-center gap-1.5 text-black/50"><span className="h-[3px] w-4 rounded-full" style={{ background: TONE[t] }} />{ui.tone[t]}</span>)}
      </div>
    </div>
  );
}

function RangesFig({ f }: { f: Extract<Figure, { kind: "ranges" }> }) {
  const { ui, color } = useReader();
  const max = Math.ceil(Math.max(...f.rows.map((r) => r.high)) * 1.15);
  const [v, setV] = useState(() => Math.round(Math.max(...f.rows.map((r) => r.high)) / 2));
  const pos = (x: number) => `${(x / max) * 100}%`;
  const fit = (r: (typeof f.rows)[number]) => (v >= r.high ? "covered" : v >= r.low ? "maybe" : "short");
  const FIT = { covered: ["#0f766e", ui.covered], maybe: ["#a86b00", ui.maybe], short: ["#c2410c", ui.short] } as const;
  return (
    <div className="grid gap-4">
      <label data-nohl className="grid gap-1.5 rounded-xl bg-white px-4 py-3 ring-1 ring-black/[0.05]">
        <span className="flex items-baseline justify-between text-[13px]"><b className="text-[#0d1117]">{ui.budget(v, f.unit)}</b><span className="font-mono text-[12px] text-black/45">0 – {max}</span></span>
        <input type="range" min={0} max={max} value={v} onChange={(e) => setV(Number(e.target.value))} className="w-full" style={{ accentColor: color }} />
      </label>
      <div className="relative grid gap-5">
        <span className="pointer-events-none absolute inset-y-0 z-[1] w-[2px] bg-[#0d1117]/70" style={{ left: `calc(${pos(v)})` }} aria-hidden />
        {f.rows.map((r, ri) => {
          const [c, word] = FIT[fit(r)];
          return (
            <div key={ri} className="grid gap-1.5">
              <span className="flex items-baseline justify-between gap-3 text-[13.5px]"><span className="text-[#24292f]">{r.label}</span><span className="flex shrink-0 items-center gap-2"><b className="font-mono text-[#0d1117]">{r.low}–{r.high} {f.unit}</b><span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: c }}>{word}</span></span></span>
              <span className="relative h-8 rounded-lg bg-black/[0.05]">
                <span className="absolute inset-y-1.5 rounded-md transition-colors" style={{ left: pos(r.low), width: `calc(${pos(r.high)} - ${pos(r.low)})`, background: `${c}2e`, border: `1.5px solid ${c}` }} />
                {r.likely !== undefined ? <span className="absolute inset-y-0 w-[3px] rounded-full" style={{ left: pos(r.likely), background: c }} /> : null}
                {r.likely === undefined || (r.likely - r.low) / max > 0.09 ? <span className="absolute -bottom-5 -translate-x-1/2 font-mono text-[10.5px] text-black/50" style={{ left: pos(r.low) }}>{r.low}</span> : null}
                {r.likely !== undefined ? <span className="absolute -bottom-5 -translate-x-1/2 whitespace-nowrap font-mono text-[10.5px] font-bold" style={{ left: pos(r.likely), color: c }}>{ui.likely} {r.likely}</span> : null}
                {r.likely === undefined || (r.high - r.likely) / max > 0.09 ? <span className="absolute -bottom-5 -translate-x-1/2 font-mono text-[10.5px] text-black/50" style={{ left: pos(r.high) }}>{r.high}</span> : null}
              </span>
            </div>
          );
        })}
        <span className="h-2" />
      </div>
    </div>
  );
}

/* ---------- structured blocks ---------- */
type B<T extends Block["t"]> = Extract<Block, { t: T }>;

export function TableBlock({ b }: { b: B<"table"> }) {
  const { color } = useReader();
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const [on, setOn] = useState<number | null>(null);
  const num = (s: string) => { const m = plain(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
  const rows = b.rows.map((r, i) => ({ r, i }));
  if (sort) rows.sort((x, y) => {
    const a = x.r[sort.col] ?? "", c = y.r[sort.col] ?? "";
    const na = num(a), nc = num(c);
    return (!isNaN(na) && !isNaN(nc) ? na - nc : plain(a).localeCompare(plain(c))) * sort.dir;
  });
  const sortable = b.rows.length > 2;
  return (
    <figure className={cn(WIDE, "grid gap-2")}>
      <div className="overflow-x-auto rounded-2xl ring-1 ring-black/[0.07]">
        <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
          <thead className="bg-[#f6f7f9]">
            <tr>{b.head.map((h, hi) => (
              <th key={hi} className="border-b border-black/[0.08] px-3.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-black/55">
                {sortable ? (
                  <button type="button" data-nohl onClick={() => setSort((s) => (s?.col === hi ? (s.dir === 1 ? { col: hi, dir: -1 } : null) : { col: hi, dir: 1 }))} className="flex items-center gap-1 uppercase hover:text-black/80">
                    {h}<MaterialSymbol className={cn("text-[14px]", sort?.col === hi ? "" : "opacity-30")} name={sort?.col === hi ? (sort.dir === 1 ? "arrow_upward" : "arrow_downward") : "swap_vert"} style={sort?.col === hi ? { color } : undefined} />
                  </button>
                ) : h}
              </th>
            ))}</tr>
          </thead>
          <tbody>{rows.map(({ r, i }) => (
            <tr key={i} onClick={() => setOn(on === i ? null : i)} className={cn("cursor-pointer border-b border-black/[0.05] align-top transition-colors last:border-0", on === i ? "" : "hover:bg-black/[0.02]")} style={on === i ? { background: `${color}10` } : undefined}>
              {r.map((c, ci) => <td key={ci} className={cn("px-3.5 py-2.5 leading-[1.55]", ci === 0 ? "font-semibold text-[#0d1117]" : "text-[#3a4048]")} style={on === i && ci === 0 ? { boxShadow: `inset 3px 0 0 ${color}` } : undefined}><Inline text={c} /></td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {b.caption ? <figcaption className="px-1 text-[12.5px] text-black/45"><Inline text={b.caption} /></figcaption> : null}
    </figure>
  );
}

export function StepsBlock({ b, k }: { b: B<"steps">; k: string }) {
  const { ui, color, ticks, onTick } = useReader();
  const done = b.items.filter((_, i) => ticks[`${k}-s${i}`]).length;
  const next = b.items.findIndex((_, i) => !ticks[`${k}-s${i}`]);
  return (
    <section className={cn(WIDE, "grid gap-3")}>
      <div data-nohl className="flex items-center gap-3">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(done / b.items.length) * 100}%`, background: color }} /></span>
        <span className="shrink-0 text-[12px] text-black/45">{ui.stepsDone(done, b.items.length)}</span>
      </div>
      <ol className="grid gap-0">
        {b.items.map((s, i) => {
          const id = `${k}-s${i}`, ok = !!ticks[id], here = i === next;
          return (
            <li key={i} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4">
              <span className="flex flex-col items-center">
                <button type="button" data-nohl onClick={() => onTick(id)} aria-pressed={ok} aria-label={`${s.title}`} className={cn("flex size-8 items-center justify-center rounded-full font-mono text-[13px] font-bold transition-all hover:scale-110", ok || here ? "text-white" : "bg-white text-black/50 ring-1 ring-black/15")} style={ok ? { background: "#0f766e" } : here ? { background: color, boxShadow: `0 0 0 4px ${color}26` } : undefined}>
                  {ok ? <MaterialSymbol className="text-[17px]" name="check" /> : i + 1}
                </button>
                {i < b.items.length - 1 ? <span className="w-px flex-1 transition-colors" style={{ background: ok ? "#0f766e" : "rgba(0,0,0,.1)" }} /> : null}
              </span>
              <span className={cn("grid gap-1.5 pb-6 transition-opacity", ok && "opacity-60")}>
                <b className="pt-1 text-[16.5px] font-semibold text-[#0d1117]">{s.title}</b>
                <div className="grid max-w-[860px] gap-3"><Paras text={s.text} className="text-[15.5px] leading-[1.75] text-[#24292f]" /></div>
                {s.tip ? <span className="flex max-w-[860px] gap-2 text-[14px] leading-[1.6] text-black/55"><MaterialSymbol className="mt-0.5 shrink-0 text-[16px] text-[#0f766e]" name="lightbulb" /><span><Inline text={s.tip} /></span></span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function PitfallsBlock({ b }: { b: B<"pitfalls"> }) {
  const { ui } = useReader();
  const [open, setOpen] = useState<Set<number>>(new Set());
  const all = open.size === b.items.length;
  return (
    <div className={cn(WIDE, "grid gap-0 overflow-hidden rounded-2xl border border-black/[0.08]")}>
      <div data-nohl className="flex items-center gap-6 bg-[#f6f7f9] px-5 py-2">
        <span className={cn(label, "flex-1 text-[#c2410c]")}>{ui.trap}</span>
        <span className={cn(label, "hidden flex-1 text-[#0f766e] md:block")}>{ui.fix}</span>
        <button type="button" onClick={() => setOpen(all ? new Set() : new Set(b.items.map((_, i) => i)))} className="text-[11.5px] font-semibold text-black/50 hover:text-black/80">{all ? ui.hideAll : ui.revealAll}</button>
      </div>
      {b.items.map((x, xi) => {
        const shown = open.has(xi);
        return (
          <div key={xi} className="grid gap-2 border-t border-black/[0.06] px-5 py-3.5 md:grid-cols-2 md:gap-6">
            <span className="flex gap-2 text-[14.5px] leading-[1.6] text-[#24292f]"><MaterialSymbol className="mt-0.5 shrink-0 text-[16px] text-[#c2410c]" name="close" /><span><Inline text={x.trap} /></span></span>
            <span className="relative flex gap-2 text-[14.5px] leading-[1.6] text-[#24292f]">
              <MaterialSymbol className="mt-0.5 shrink-0 text-[16px] text-[#0f766e]" name="check" />
              <span className={cn("transition-[filter,opacity] duration-300", !shown && "select-none opacity-60 blur-[5px]")} aria-hidden={!shown}><Inline text={x.fix} /></span>
              {!shown ? <button type="button" data-nohl onClick={() => setOpen((o) => new Set(o).add(xi))} className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#0f766e] shadow-sm ring-1 ring-[#0f766e]/30">{ui.showFix}</span></button> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ContrastBlock({ b, k }: { b: B<"contrast">; k: string }) {
  const { ui, color } = useReader();
  const [pick, setPick] = useState<"bad" | "good" | null>(null);
  const flip = hash(k) % 2 === 1;
  const order = (flip ? [["good", b.good], ["bad", b.bad]] : [["bad", b.bad], ["good", b.good]]) as [("bad" | "good"), { title?: string; text: string }][];
  return (
    <figure className={cn(WIDE, "grid gap-3")}>
      <div data-nohl className="flex flex-wrap items-center gap-2">
        {b.label ? <span className={cn(label, "text-black/45")}>{b.label}</span> : null}
        <span className="mr-auto" />
        {!pick ? <><span className="text-[12.5px] font-semibold" style={{ color }}>{ui.whichStronger}</span><Btn onClick={() => setPick("good")}>{ui.showAnswer}</Btn></> : (
          <span className="flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: pick === "good" ? "#0f766e" : "#c2410c" }}>
            {pick === "good" ? ui.right : ui.notQuite} {b.good.title ?? ui.strong}
            <Btn onClick={() => setPick(null)}><MaterialSymbol className="text-[15px]" name="restart_alt" /></Btn>
          </span>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {order.map(([key, side], i) => {
          const c = key === "good" ? "#0f766e" : "#c2410c";
          return (
            <div key={key} className={cn("grid content-start gap-2 rounded-2xl border p-4 transition-all duration-300", pick && pick === key && "ring-2")} style={pick ? { borderColor: `${c}40`, background: `${c}08`, ["--tw-ring-color" as string]: c } : { borderColor: "rgba(0,0,0,.1)", background: "#fff" }}>
              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: pick ? c : "rgba(0,0,0,.5)" }}>
                {pick ? <><MaterialSymbol className="text-[16px]" name={key === "good" ? "check" : "close"} />{side.title ?? (key === "good" ? ui.strong : ui.weak)}</> : <span data-nohl>{i === 0 ? ui.versionA : ui.versionB}</span>}
              </span>
              <div className="grid gap-2"><Paras text={side.text} className="text-[14.5px] leading-[1.65] text-[#24292f]" /></div>
              {!pick ? <button type="button" data-nohl onClick={() => setPick(key)} className="mt-1 justify-self-start rounded-full px-3 py-1 text-[12px] font-semibold text-white" style={{ background: color }}>{ui.thisOne}</button> : null}
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export function TermsBlock({ b }: { b: B<"terms"> }) {
  const { ui, color } = useReader();
  const [quiz, setQuiz] = useState(false);
  const [open, setOpen] = useState<Set<number>>(new Set());
  return (
    <dl className={cn(COL, "grid gap-0 rounded-2xl border border-black/[0.08] px-5")}>
      <div data-nohl className="flex items-center justify-between gap-2 pb-1 pt-3.5">
        <span className={cn(label, "text-black/45")}>{ui.keyTerms}</span>
        <Btn onClick={() => { setQuiz((q) => !q); setOpen(new Set()); }} on={quiz} color={color}><MaterialSymbol className="text-[15px]" name={quiz ? "visibility" : "quiz"} />{quiz ? ui.showDefs : ui.quizMe}</Btn>
      </div>
      {b.items.map((x, xi) => {
        const hidden = quiz && !open.has(xi);
        return (
          <div key={xi} className="relative grid gap-1 border-t border-black/[0.05] py-2.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-5">
            <dt className="text-[14.5px] font-semibold text-[#0d1117]">{x.term}</dt>
            <dd className={cn("text-[14.5px] leading-[1.6] text-[#3a4048] transition-[filter] duration-300", hidden && "select-none blur-[5px]")} aria-hidden={hidden}><Inline text={x.def} /></dd>
            {hidden ? <button type="button" data-nohl onClick={() => setOpen((o) => new Set(o).add(xi))} className="absolute inset-0 flex items-center justify-end pr-2 sm:justify-center"><span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold shadow-sm ring-1 ring-black/10" style={{ color }}>{ui.tapToReveal}</span></button> : null}
          </div>
        );
      })}
    </dl>
  );
}

export function ChecklistBlock({ b, k }: { b: B<"checklist">; k: string }) {
  const { ui, color, ticks, onTick } = useReader();
  const done = b.items.filter((_, i) => ticks[`${k}-${i}`]).length;
  return (
    <section className={cn(COL, "grid gap-1.5 rounded-2xl border border-black/[0.08] p-5")}>
      <span className="flex items-center justify-between gap-2">
        <span className={cn(label, "text-black/45")}>{b.title ?? ui.beforeYouMoveOn}</span>
        <span data-nohl className="text-[12px] font-semibold" style={{ color: done === b.items.length ? "#0f766e" : "rgba(0,0,0,.4)" }}>{ui.ticked(done, b.items.length)}</span>
      </span>
      <span data-nohl className="mb-1 h-1 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(done / b.items.length) * 100}%`, background: done === b.items.length ? "#0f766e" : color }} /></span>
      {b.items.map((x, i) => {
        const id = `${k}-${i}`;
        return (
          <label key={i} className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1 text-[15px] leading-[1.6] text-[#24292f] hover:bg-black/[0.02]">
            <input type="checkbox" checked={!!ticks[id]} onChange={() => onTick(id)} className="mt-1.5 size-4 shrink-0" style={{ accentColor: color }} />
            <span className={cn(ticks[id] && "text-black/40 line-through decoration-black/20")}><Inline text={x} /></span>
          </label>
        );
      })}
    </section>
  );
}

/* a chapter's road: its sections as stops, read ones filled, ending at the day's gate — click a stop to open it */
export function ChapterMap({ chapter, read, here }: { chapter: BookChapter; read: string[]; here?: string }) {
  const { ui, color, goTo } = useReader();
  const [hover, setHover] = useState<number | null>(null);
  const gate = chapter.day ? chapter.kicker.split("·").pop()!.trim() : null;
  const stops = chapter.sections;
  const h = hover ?? stops.findIndex((s) => s.id === here);
  const cur = stops[h];
  const lead = cur?.blocks.find((x) => x.t === "lead") as { text: string } | undefined;
  if (!stops.length) return null;
  return (
    <figure className={cn(WIDE, "grid gap-3 rounded-2xl bg-[#f7f8fa] p-4 sm:p-5")} data-nohl>
      <span className={cn(label, "text-black/45")}>{ui.chapterMap}</span>
      <ol className="relative grid gap-3 md:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: stops.length + (gate ? 1 : 0) }}>
        <span className="absolute left-[18px] top-4 hidden h-[3px] rounded-full bg-black/10 md:left-[calc(50%/var(--n))] md:right-[calc(50%/var(--n))] md:block" aria-hidden />
        {stops.map((s, i) => {
          const ok = read.includes(s.id), on = s.id === here;
          return (
            <li key={s.id} className="relative flex items-center gap-3 md:grid md:justify-items-center md:text-center">
              <button type="button" onClick={() => goTo(s.id)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} className={cn("relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ring-4 ring-[#f7f8fa] transition-transform hover:scale-110", ok || on ? "text-white" : "bg-white text-black/55")} style={ok ? { background: "#0f766e" } : on ? { background: color } : { boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,.15)" }}>
                {ok ? <MaterialSymbol className="text-[17px]" name="check" /> : (s.code?.split(".").pop() ?? i + 1)}
              </button>
              <button type="button" onClick={() => goTo(s.id)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={cn("text-left text-[12.5px] leading-snug md:text-center", h === i ? "font-semibold text-[#0d1117]" : "text-black/55")}>{s.title}</button>
            </li>
          );
        })}
        {gate ? (
          <li className="relative flex items-center gap-3 md:grid md:justify-items-center md:text-center">
            <span className="relative z-[1] flex size-9 shrink-0 items-center justify-center"><span className="size-6 rotate-45 rounded-[4px] bg-[#0d1117] ring-4 ring-[#f7f8fa]" /></span>
            <span className="grid text-left text-[12.5px] leading-snug md:text-center"><b className="text-[#0d1117]">{gate}</b><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/40">{ui.gate}</span></span>
          </li>
        ) : null}
      </ol>
      <p className="min-h-[44px] rounded-lg bg-white px-3 py-2 text-[13px] leading-[1.5] text-black/60 ring-1 ring-black/[0.05]">
        {cur ? <><b className="text-[#0d1117]">{cur.code} {cur.title}</b> · {cur.minutes} min{lead ? <> — {plain(lead.text)}</> : null}</> : <span className="text-black/40">{chapter.question}</span>}
      </p>
    </figure>
  );
}
