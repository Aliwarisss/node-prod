"use client";

import { useId, useState } from "react";

/* The book's flow map (the-book/sdlc/app.js → flowMap/build), redrawn in React:
 * ENTRY → the units in order → GATE, with the gate's branches on the right; rework loops arc below, alternates
 * arc above, escalations rise to the AUTHORITY lane and stops drop to the STOP lane. Decisions are diamonds.
 * It is interactive like the book's: hover a step to trace its paths, click a step, a loop, a branch or a lane
 * to select it; routes and layers can be switched off; a scenario dims what doesn't belong to it. */

export type Route = { label: string; icon: string; c: string };
export type FlowNode = {
  id: string;
  label: string;
  kind: "entry" | "unit" | "gate" | "decision";
  num?: string;
  owner?: string;
  check?: string;
  note?: string;
  state?: "done" | "current" | "open" | "locked";
  href?: string;
};
export type FlowEdge = { f: number; t: number | "authority" | "stop"; ty: string; n?: string; cyc?: boolean };
export type MapSel = { k: "n"; i: number } | { k: "e"; i: number } | { k: "b"; key: string } | { k: "auth" } | { k: "stop" };
export type MapLayers = { owners: boolean; checks: boolean; states: boolean; branches: boolean };
type Props = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  routes: Record<string, Route>;
  branches?: { key: string; text: string }[];
  states?: string[];
  authority?: string;
  label: string;
  /* interaction (all optional — without them it is a plain map) */
  sel?: MapSel | null;
  onSelect?: (s: MapSel | null) => void;
  routesOn?: Record<string, boolean>;
  layers?: MapLayers;
  relevant?: string[] | null; // the scenario's route types (null = every path)
  flow?: boolean; // animate the forward path (the happy-path scenario)
  quiet?: boolean; // dim the working steps (the edge-cases scenario)
  /** legacy: click a node */
  onNode?: (i: number) => void;
  selected?: number | null;
};

/* drawn at a fixed scale — never stretched to fill the column, so it stays compact on wide screens */
const SCALE = 1.08;
const ALL_LAYERS: MapLayers = { owners: true, checks: true, states: true, branches: true };

const wrap = (s: string, max: number, keep = 2) => {
  const words = String(s).split(" "), lines = [""];
  for (const w of words) {
    const l = lines[lines.length - 1];
    if ((l + " " + w).trim().length > max && l) lines.push(w);
    else lines[lines.length - 1] = (l + " " + w).trim();
  }
  return lines.slice(0, keep).map((l, i) => (i === keep - 1 && lines.length > keep ? l.replace(/.$/, "…") : l));
};
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

type TextProps = { x: number; y: number; lines: string[]; size?: number; weight?: number; fill?: string; anchor?: "start" | "middle" | "end"; mono?: boolean; lh?: number; halo?: string };
/* map text with a halo, so it stays readable over lines */
function SvgText({ x, y, lines, size = 11, weight = 600, fill = "#444748", anchor = "middle", mono = false, lh = 13, halo = "#fff" }: TextProps) {
  return (
    <>
      {lines.map((l, k) => (
        <text key={k} x={x} y={y + k * lh} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={fill} paintOrder="stroke" stroke={halo} strokeWidth={3} strokeLinejoin="round" style={mono ? { fontFamily: "var(--font-geist-mono), monospace", letterSpacing: 1 } : undefined}>{l}</text>
      ))}
    </>
  );
}

const CSS = `
.fm-arc { transition: opacity .25s, stroke-width .2s; }
.fm-flow { stroke-dasharray: 7 6 !important; animation: fm-dash .9s linear infinite; }
@keyframes fm-dash { to { stroke-dashoffset: -13; } }
.fm-node { transition: opacity .25s; }
.fm-node .fm-lift { transition: transform .2s ease; transform-box: fill-box; transform-origin: center; }
.fm-node.go:hover .fm-lift, .fm-node.go:focus-visible .fm-lift { transform: translateY(-3px); }
.fm-node.go:hover .fm-shape, .fm-node.go:focus-visible .fm-shape { stroke: #007373; stroke-width: 2.5px; }
.fm-node:focus { outline: none; }
.fm-pulse { animation: fm-pulse 1.8s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes fm-pulse { from { opacity: .7; transform: scale(1); } to { opacity: 0; transform: scale(1.18); } }
.fm-hit { cursor: pointer; pointer-events: stroke; }
.fm-bar { cursor: pointer; }
.fm-bar:hover line { opacity: 1; stroke-width: 2; }
.fm-br { cursor: pointer; transition: opacity .25s; }
.fm-br:hover rect { stroke-width: 2.5px; }
@media (prefers-reduced-motion: reduce) { .fm-flow, .fm-pulse { animation: none; } .fm-node .fm-lift { transition: none; } }
`;

export function FlowMap({ nodes, edges, routes, branches = [], states = [], authority, label, sel = null, onSelect, routesOn, layers = ALL_LAYERS, relevant = null, flow = false, quiet = false, onNode, selected = null }: Props) {
  const uid = useId().replace(/:/g, "");
  const [hs, setHs] = useState<number | null>(null); // hovered step
  const [he, setHe] = useState<number | null>(null); // hovered edge
  const interactive = !!onSelect;
  const selN = sel?.k === "n" ? sel.i : selected, selE = sel?.k === "e" ? sel.i : null, selB = sel?.k === "b" ? sel.key : null;
  const on = (ty: string) => !routesOn || routesOn[ty] !== false;
  const rel = (ty: string) => !relevant || relevant.includes(ty);

  const shownBranches = layers.branches ? branches : [];
  const shownStates = layers.states ? states : [];
  const N = nodes.length;
  const BW = shownBranches.length ? 196 : 0;
  const W = Math.max(640, N * 116 + (BW ? BW + 56 : 0));
  const colR = W - 16 - (BW ? BW + 48 : 0);
  const NW = Math.min(132, (colR - 16) / N - 14), NH = 52, D = 30, DD = 25;
  const nx = (i: number) => 16 + NW / 2 + i * ((colR - 16 - NW) / Math.max(1, N - 1));
  const hasOwner = layers.owners && nodes.some((n) => n.owner), hasCheck = layers.checks && nodes.some((n) => n.check);
  const yAuth = 22, yState = shownStates.length ? 60 : null;
  const NY = (yState ? 86 : 46) + 82;
  const top = NY - NH / 2, bot = NY + NH / 2;
  let off = bot + 8;
  const yOwner = hasOwner ? off + 12 : 0; if (hasOwner) off += 16;
  const yCheck = hasCheck ? off + 12 : 0; if (hasCheck) off += 28;
  const depth = (e: FlowEdge) => off + 26 + Math.abs(e.f - (e.t as number)) * 20;
  const backs = edges.filter((e) => e.ty === "rework" && typeof e.t === "number");
  const yLow = backs.reduce((m, e) => Math.max(m, depth(e)), off + 8);
  const yStop = yLow + 30, H = yStop + 22;
  const gateIdx = nodes.findIndex((n) => n.kind === "gate");
  const gx = gateIdx >= 0 ? nx(gateIdx) : 0;
  const col = (ty: string) => routes[ty]?.c ?? "#5b5f60";
  const half = (i: number) => (nodes[i].kind === "gate" ? D : nodes[i].kind === "decision" ? DD : NW / 2);
  const mk = (ty: string) => `url(#${uid}-${routes[ty] ? ty : "forward"})`;

  /* what lights up: the selected / hovered path, or every path through the hovered / selected step */
  const touches = (e: FlowEdge, i: number) => e.f === i || e.t === i;
  const edgeState = (e: FlowEdge, i: number): "hide" | "hl" | "dim" | "" => {
    if (!on(e.ty)) return "hide";
    if (selE === i || he === i) return "hl";
    if (!rel(e.ty)) return "dim";
    if (he !== null || selE !== null) return "dim";
    if (sel?.k === "auth") return e.ty === "escalate" ? "hl" : "dim";
    if (sel?.k === "stop") return e.ty === "stop" ? "hl" : "dim";
    if (hs !== null) return touches(e, hs) ? "hl" : "dim";
    if (selN !== null && touches(e, selN)) return "hl";
    return "";
  };
  const focusEdge = selE ?? he;
  const nodeDim = (i: number) => {
    if (focusEdge !== null) { const e = edges[focusEdge]; return e && !touches(e, i) ? 0.35 : 1; }
    if (quiet && nodes[i].kind !== "entry" && nodes[i].kind !== "gate") return 0.55;
    return 1;
  };

  const path = (e: FlowEdge) => {
    const x1 = nx(e.f);
    const t1 = nodes[e.f].kind === "gate" ? NY - D : top, b1 = nodes[e.f].kind === "gate" ? NY + D : bot;
    if (e.t === "authority" || e.ty === "escalate") return { d: `M${x1},${t1} L${x1},${yAuth + 6}`, lx: x1 + 4, ly: (t1 + yAuth) / 2 };
    if (e.t === "stop" || e.ty === "stop") return { d: `M${x1},${b1} L${x1},${yStop - 6}`, lx: x1 + 4, ly: (b1 + yStop) / 2 + 8 };
    const x2 = nx(e.t as number), span = Math.abs(e.f - (e.t as number));
    if (e.ty === "forward" && !e.cyc) return { d: `M${x1 + half(e.f)},${NY} L${x2 - half(e.t as number)},${NY}`, lx: 0, ly: 0 };
    if (e.cyc) { const d = top - 120; return { d: `M${x1},${top} C${x1},${d} ${x2},${d} ${x2},${top}`, lx: (x1 + x2) / 2, ly: top - 90 + 4 }; }
    if (e.ty === "alternate") { const d = Math.max((yState ?? 34) + 24, top - 24 - span * 20); return { d: `M${x1 - 10},${top} C${x1 - 10},${d} ${x2 + 10},${d} ${x2 + 10},${top}`, lx: (x1 + x2) / 2, ly: top - (top - d) * 0.75 - 3 }; }
    const d = depth(e);
    return { d: `M${x1 - 10},${bot} C${x1 - 10},${d} ${x2 + 10},${d} ${x2 + 10},${bot}`, lx: (x1 + x2) / 2, ly: bot + (d - bot) * 0.75 + 11 };
  };

  const pick = (s: MapSel | null) => onSelect?.(s);
  const same = (a: MapSel | null, b: MapSel) => !!a && JSON.stringify(a) === JSON.stringify(b);
  const toggle = (s: MapSel) => pick(same(sel, s) ? null : s);

  const nodeEl = (n: FlowNode, i: number) => {
    const x = nx(i), y = NY, isOn = selN === i;
    const faded = n.state === "locked" ? 0.45 : 1;
    const clickable = interactive || !!onNode || !!n.href;
    let shape;
    if (n.kind === "gate") {
      shape = (
        <>
          <g className="fm-lift">
            <path className="fm-shape" d={`M${x},${y - D} L${x + D},${y} L${x},${y + D} L${x - D},${y} Z`} fill={isOn || n.state === "done" ? "#007373" : "#0d1117"} stroke={isOn ? "#ff5c93" : "#0d1117"} strokeWidth={isOn ? 3 : 2} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#fff" letterSpacing={1.5}>GATE</text>
          </g>
          <SvgText x={x} y={y + D + 15} lines={wrap(n.label, 17)} size={12} weight={800} fill="#040505" />
          {n.note && layers.checks ? <SvgText x={x} y={y + D + 43} lines={[n.note]} size={10} fill="#0b6b6b" /> : null}
        </>
      );
    } else if (n.kind === "decision") {
      shape = (
        <>
          <g className="fm-lift">
            <path className="fm-shape" d={`M${x},${y - DD} L${x + DD},${y} L${x},${y + DD} L${x - DD},${y} Z`} fill={isOn ? "#c2410c" : "#fff7ed"} stroke="#c2410c" strokeWidth={isOn ? 3 : 2} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={900} fill={isOn ? "#fff" : "#c2410c"}>?</text>
          </g>
          {n.num ? <text x={x} y={y - DD - 7} textAnchor="middle" fontSize={10} fontWeight={700} letterSpacing={1} fill="#007373">{n.num}</text> : null}
          <SvgText x={x} y={y + DD + 14} lines={wrap(n.label, 18)} size={11.5} weight={800} fill="#040505" lh={13} />
        </>
      );
    } else {
      const io = n.kind === "entry";
      const dark = io || isOn;
      const stroke = isOn ? "#ff5c93" : n.state === "current" ? "#d81b60" : n.state === "done" ? "#007373" : io ? "#0d1117" : "rgba(0,0,0,.2)";
      const lines = wrap(io ? n.label.toUpperCase() : n.label, Math.max(8, Math.floor(NW / 8)), 3);
      shape = (
        <>
          {n.state === "current" ? <rect className="fm-pulse" x={x - NW / 2} y={top} width={NW} height={NH} rx={12} fill="none" stroke="#d81b60" strokeWidth={2} /> : null}
          <g className="fm-lift">
            <rect className="fm-shape" x={x - NW / 2} y={top} width={NW} height={NH} rx={io ? 28 : 12} fill={dark ? "#0d1117" : n.state === "done" ? "#e6f3f3" : "#fff"} stroke={stroke} strokeWidth={isOn || n.state === "current" ? 3 : 1.5} style={{ filter: isOn ? "drop-shadow(0 6px 10px rgba(13,17,23,.25))" : undefined }} />
            {lines.map((l, k) => (
              <text key={k} x={x} y={NY + 5 + (k - (lines.length - 1) / 2) * 14} textAnchor="middle" fontSize={io ? 11 : 13} fontWeight={800} fill={dark ? "#fff" : "#040505"} letterSpacing={io ? 1 : 0}>{l}</text>
            ))}
          </g>
          {n.num ? <text x={x} y={top - 7} textAnchor="middle" fontSize={10} fontWeight={700} letterSpacing={1} fill={n.state === "current" ? "#a3104a" : "#007373"}>{n.num}{n.state === "current" ? " · NOW" : n.state === "done" ? " · ✓" : ""}</text> : null}
        </>
      );
    }
    const extras = (
      <>
        {n.owner && yOwner ? <SvgText x={x} y={yOwner} lines={[cut("● " + n.owner, 22)]} size={11} weight={700} fill="#5b5f60" /> : null}
        {n.check && yCheck ? <SvgText x={x} y={yCheck} lines={wrap(n.check, Math.floor(NW / 6.4))} size={10.5} fill="#0b6b6b" lh={12} /> : null}
      </>
    );
    const act = () => (interactive ? toggle({ k: "n", i }) : onNode?.(i));
    const g = (
      <g
        className={`fm-node${clickable ? " go" : ""}`}
        data-i={i}
        opacity={faded * nodeDim(i)}
        style={clickable ? { cursor: "pointer" } : undefined}
        onClick={interactive || onNode ? act : undefined}
        onMouseEnter={interactive ? () => setHs(i) : undefined}
        onMouseLeave={interactive ? () => setHs(null) : undefined}
        onFocus={interactive ? () => setHs(i) : undefined}
        onBlur={interactive ? () => setHs(null) : undefined}
        role={clickable ? "button" : undefined}
        aria-label={n.label}
        aria-pressed={interactive ? isOn : undefined}
        tabIndex={interactive || onNode ? 0 : undefined}
        onKeyDown={interactive || onNode ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } } : undefined}
      >
        <title>{n.label}</title>
        {shape}
        {extras}
      </g>
    );
    return n.href ? <a key={n.id} href={n.href}>{g}</a> : <g key={n.id}>{g}</g>;
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width={W * SCALE} height={H * SCALE} className="mx-auto block h-auto" style={{ maxWidth: "100%", minWidth: Math.min(W * SCALE, 640) }} role="img" aria-label={label} onClick={interactive ? (e) => { if (e.target === e.currentTarget) pick(null); } : undefined}>
        <defs>
          <style>{CSS}</style>
          {Object.entries(routes).map(([k, r]) => (
            <marker key={k} id={`${uid}-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={r.c} /></marker>
          ))}
        </defs>
        {/* lanes — click to see what they mean */}
        <g className={interactive ? "fm-bar" : undefined} onClick={interactive ? () => toggle({ k: "auth" }) : undefined} opacity={on("escalate") ? 1 : 0.35}>
          <rect x={0} y={yAuth - 12} width={W} height={22} fill="transparent" />
          <line x1={10} x2={W - 10} y1={yAuth} y2={yAuth} stroke={col("escalate")} strokeDasharray="4 6" opacity={sel?.k === "auth" ? 1 : 0.6} strokeWidth={sel?.k === "auth" ? 2 : 1} />
          <SvgText x={W - 10} y={yAuth - 6} lines={[cut(`AUTHORITY${authority ? " · " + authority : ""}`, 110)]} anchor="end" size={9.5} weight={700} fill={col("escalate")} mono />
        </g>
        <g className={interactive ? "fm-bar" : undefined} onClick={interactive ? () => toggle({ k: "stop" }) : undefined} opacity={on("stop") ? 1 : 0.35}>
          <rect x={0} y={yStop - 10} width={W} height={22} fill="transparent" />
          <line x1={10} x2={W - 10} y1={yStop} y2={yStop} stroke={col("stop")} strokeDasharray="4 6" opacity={sel?.k === "stop" ? 1 : 0.6} strokeWidth={sel?.k === "stop" ? 2 : 1} />
          <SvgText x={W - 10} y={yStop + 15} lines={["STOP / PARK"]} anchor="end" size={9.5} weight={700} fill={col("stop")} mono />
        </g>
        {/* state transitions */}
        {yState ? (
          <>
            <SvgText x={10} y={yState - 18} lines={["STATE"]} anchor="start" size={9} weight={700} fill="#6b7071" mono />
            {shownStates.map((s, i) => {
              const step = (colR - 20) / shownStates.length, cx = 20 + step * (i + 0.5), w = Math.min(step - 14, s.length * 6.4 + 20);
              return (
                <g key={i}>
                  <rect x={cx - w / 2} y={yState - 11} width={w} height={22} rx={11} fill="#fff" stroke="rgba(0,0,0,.14)" />
                  <SvgText x={cx} y={yState + 4} lines={[cut(s, Math.floor(w / 6.2))]} size={10.5} weight={700} fill="#040505" />
                  {i < shownStates.length - 1 ? <path d={`M${cx + w / 2 + 3},${yState} L${cx + step - w / 2 - 5},${yState}`} stroke="#c4c7c7" fill="none" markerEnd={mk("forward")} /> : null}
                </g>
              );
            })}
          </>
        ) : null}
        {/* edges */}
        {edges.map((e, i) => {
          const p = path(e), c = col(e.ty), st = edgeState(e, i);
          const dash = e.ty === "escalate" || e.ty === "alternate" ? "5 4" : e.ty === "stop" ? "1 4" : undefined;
          const flowing = flow && e.ty === "forward" && !e.cyc && st !== "hide";
          const loop = e.ty !== "forward" || e.cyc;
          return (
            <g key={i} opacity={st === "hide" ? 0 : st === "dim" ? 0.12 : 1} className="fm-arc" style={st === "hide" ? { pointerEvents: "none" } : undefined}>
              <path d={p.d} fill="none" stroke={c} strokeWidth={st === "hl" ? 3 : flowing ? 2.6 : 1.8} strokeDasharray={dash} strokeLinecap={e.ty === "stop" ? "round" : undefined} markerEnd={mk(e.ty)} className={`fm-arc${flowing ? " fm-flow" : ""}`}><title>{`${routes[e.ty]?.label ?? e.ty}${e.n ? ": " + e.n : ""}`}</title></path>
              {e.n && loop ? <SvgText x={p.lx} y={p.ly} lines={[cut(e.n, 24)]} size={10.5} weight={st === "hl" ? 800 : 700} fill={c} anchor={e.ty === "escalate" || e.ty === "stop" ? "start" : "middle"} /> : null}
              {interactive && loop ? (
                <path d={p.d} fill="none" stroke="transparent" strokeWidth={14} className="fm-hit" onMouseEnter={() => setHe(i)} onMouseLeave={() => setHe(null)} onClick={() => toggle({ k: "e", i })}><title>{`${routes[e.ty]?.label ?? e.ty}${e.n ? ": " + e.n : ""}`}</title></path>
              ) : null}
            </g>
          );
        })}
        {/* gate branches */}
        {shownBranches.length && gateIdx >= 0 ? (() => {
          const bx = W - BW - 14, sp = Math.min(58, (yStop - yAuth - 70) / shownBranches.length);
          return shownBranches.map((b, j) => {
            const y = NY + (j - (shownBranches.length - 1) / 2) * sp, r = routes[b.key] ?? { label: b.key, c: "#5b5f60" };
            const isOn = selB === b.key, dim = !on(b.key) || !rel(b.key) || (selB !== null && !isOn);
            const flowing = flow && b.key === "forward";
            return (
              <g key={b.key} className={interactive ? "fm-br" : undefined} opacity={dim ? 0.18 : 1} onClick={interactive ? () => toggle({ k: "b", key: b.key }) : undefined} role={interactive ? "button" : undefined} aria-label={`${r.label}: ${b.text}`}>
                <title>{`${r.label}: ${b.text}`}</title>
                <path d={`M${gx + D},${NY} C${gx + D + 44},${NY} ${bx - 44},${y} ${bx},${y}`} fill="none" stroke={r.c} strokeWidth={isOn ? 3 : flowing ? 2.6 : 1.8} strokeDasharray={b.key === "forward" ? undefined : "5 4"} markerEnd={mk(b.key)} className={flowing ? "fm-flow" : undefined} />
                <rect x={bx + 4} y={y - 21} width={BW} height={42} rx={10} fill={isOn ? r.c : "#fff"} stroke={r.c} strokeWidth={1.5} />
                <SvgText x={bx + 13} y={y - 6} lines={[r.label.toUpperCase()]} anchor="start" size={9.5} weight={700} fill={isOn ? "#fff" : r.c} mono halo={isOn ? r.c : "#fff"} />
                <SvgText x={bx + 13} y={y + 9} lines={[cut(b.text, 30)]} anchor="start" size={11} weight={600} fill={isOn ? "#fff" : "#1c1b1b"} halo={isOn ? r.c : "#fff"} />
              </g>
            );
          });
        })() : null}
        {/* nodes */}
        {nodes.map(nodeEl)}
      </svg>
    </div>
  );
}

/* the legend the book shows under its maps */
export function RouteLegend({ routes }: { routes: Record<string, Route> }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] font-semibold text-[var(--on-surface-variant)]">
      {Object.entries(routes).map(([k, r]) => (
        <span key={k} className="flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden="true"><line x1="0" x2="22" y1="4" y2="4" stroke={r.c} strokeWidth="2" strokeDasharray={k === "escalate" || k === "alternate" ? "5 4" : k === "stop" ? "1 4" : undefined} strokeLinecap="round" /></svg>
          {r.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5"><svg width="12" height="12" aria-hidden="true"><path d="M6,0 L12,6 L6,12 L0,6 Z" fill="#fff7ed" stroke="#c2410c" /></svg>Decision</span>
      <span className="flex items-center gap-1.5"><svg width="12" height="12" aria-hidden="true"><path d="M6,0 L12,6 L6,12 L0,6 Z" fill="#0d1117" /></svg>Gate</span>
    </div>
  );
}
