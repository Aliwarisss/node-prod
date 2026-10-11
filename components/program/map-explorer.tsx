"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

import { FlowMap, RouteLegend, type FlowEdge, type FlowNode, type MapLayers, type MapSel, type Route } from "./flow-map";
import { Value, kicker } from "./program-ui";

/* The book's map box (app.js → flowMap): a heading, scenarios, Routes and Layers checklists, full screen,
   a banner for the chosen scenario, and a detail panel for whatever you click on the map. */

const SCEN: { id: string; name: string; icon: string; c: string; routes: string[] | null }[] = [
  { id: "all", name: "All paths", icon: "route", c: "#040505", routes: null },
  { id: "happyPath", name: "Happy path", icon: "sentiment_satisfied", c: "#008080", routes: ["forward"] },
  { id: "alternates", name: "Alternates", icon: "alt_route", c: "#0284c7", routes: ["alternate"] },
  { id: "edgeCases", name: "Edge cases", icon: "border_style", c: "#8b5cf6", routes: [] },
  { id: "exceptions", name: "Exceptions", icon: "report", c: "#c49000", routes: ["escalate", "rework"] },
  { id: "failures", name: "Failures", icon: "error", c: "#e91e63", routes: ["stop", "rework"] },
];
const LAYERS: [keyof MapLayers, string, string][] = [["owners", "Owners", "person"], ["checks", "Checks & outputs", "check_circle"], ["states", "States", "timeline"], ["branches", "Gate branches", "call_split"]];
const ROUTE_MEANS: Record<string, string> = {
  forward: "The normal way on — the work moves to the next step.",
  alternate: "Another valid way through, taken when the situation calls for it.",
  rework: "Back to an earlier step to fix or redo the work.",
  escalate: "Up to the authority — a call this level can’t make.",
  stop: "The work stops or is parked — on purpose, with a reason.",
};

type Props = {
  eyebrow: string;
  title: string;
  trail?: string[];
  gate?: string;
  authority?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  routes: Record<string, Route>;
  branches?: { key: string; text: string }[];
  states?: string[];
  /** what the scenarios say (the contract's cases) */
  cases?: Partial<Record<string, unknown>>;
  /** the detail panel for a node */
  nodeDetail: (i: number) => ReactNode;
  /** the panel before anything is picked */
  intro?: ReactNode;
};

export function MapExplorer({ eyebrow, title, trail = [], gate, authority, nodes, edges, routes, branches = [], states = [], cases = {}, nodeDetail, intro }: Props) {
  const [sel, setSel] = useState<MapSel | null>(null);
  const [scen, setScen] = useState("all");
  const [routesOn, setRoutesOn] = useState<Record<string, boolean>>(() => Object.fromEntries(Object.keys(routes).map((k) => [k, true])));
  const [layers, setLayers] = useState<MapLayers>({ owners: false, checks: false, states: false, branches: true });
  const [fs, setFs] = useState(false);
  const [dd, setDd] = useState<string | null>(null);
  const tools = useRef<HTMLDivElement>(null);

  /* Esc: close a menu, then the selection, then full screen */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (dd) setDd(null);
      else if (sel) setSel(null);
      else if (fs) setFs(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dd, sel, fs]);
  useEffect(() => {
    if (!dd) return;
    const away = (e: MouseEvent) => { if (!tools.current?.contains(e.target as Node)) setDd(null); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [dd]);
  useEffect(() => {
    if (!fs) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [fs]);

  /* only the scenarios this map has something for */
  const types = new Set([...edges.map((e) => e.ty), ...branches.map((b) => b.key)]);
  const scens = SCEN.filter((s) => s.id === "all" || s.id === "happyPath" || (s.id === "edgeCases" ? !!cases.edgeCases : s.routes!.some((r) => types.has(r)) || !!cases[s.id]));
  const S = scens.find((s) => s.id === scen) ?? scens[0];
  const nRoutes = Object.values(routesOn).filter(Boolean).length, nLayers = Object.values(layers).filter(Boolean).length;
  const count = (ty: string) => edges.filter((e) => e.ty === ty).length + (branches.some((b) => b.key === ty) ? 1 : 0);

  const stepName = (t: FlowEdge["t"]) => (t === "authority" ? "the authority" : t === "stop" ? "stop / park" : nodes[t]?.label ?? "");
  const detail = (() => {
    if (!sel) return intro ?? <Hint />;
    if (sel.k === "n") return nodeDetail(sel.i);
    if (sel.k === "e") {
      const e = edges[sel.i], r = routes[e.ty];
      return (
        <DetailHead color={r?.c} kick={`${r?.label ?? e.ty} path`} icon={r?.icon} title={e.n || r?.label || e.ty}>
          <p className="text-[13px] text-[var(--on-surface-variant)]">{ROUTE_MEANS[e.ty]}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-[var(--primary)]">
            <span className="rounded-lg bg-white px-2 py-1 ring-1 ring-black/[0.08]">{nodes[e.f]?.label}</span>
            <MaterialSymbol className="text-[18px]" name="arrow_forward" style={{ color: r?.c }} />
            <span className="rounded-lg bg-white px-2 py-1 ring-1 ring-black/[0.08]">{stepName(e.t)}</span>
          </div>
          <button type="button" onClick={() => setSel({ k: "n", i: e.f })} className="justify-self-start text-[12.5px] font-bold text-[var(--bridge-teal)] hover:underline">Open “{nodes[e.f]?.label}” →</button>
        </DetailHead>
      );
    }
    if (sel.k === "b") {
      const b = branches.find((x) => x.key === sel.key), r = routes[sel.key];
      return (
        <DetailHead color={r?.c} kick={`Gate branch · ${r?.label ?? sel.key}`} icon={r?.icon} title={gate || "The gate"}>
          <p className="text-[13px] text-[var(--on-surface-variant)]">{ROUTE_MEANS[sel.key]}</p>
          <div className="rounded-xl bg-white p-3 text-[13.5px] text-[var(--primary)] ring-1 ring-black/[0.06]">{b?.text}</div>
        </DetailHead>
      );
    }
    if (sel.k === "auth") {
      const n = edges.filter((e) => e.ty === "escalate");
      return (
        <DetailHead color={routes.escalate?.c} kick="Authority lane" icon="gavel" title={authority || "The authority"}>
          <p className="text-[13px] text-[var(--on-surface-variant)]">Who makes the calls this level can’t. Escalations rise to this lane.</p>
          <EdgeList edges={n} nodes={nodes} onPick={(i) => setSel({ k: "e", i: edges.indexOf(n[i]) })} />
        </DetailHead>
      );
    }
    const n = edges.filter((e) => e.ty === "stop");
    return (
      <DetailHead color={routes.stop?.c} kick="Stop lane" icon="block" title="Stop / park">
        <p className="text-[13px] text-[var(--on-surface-variant)]">{ROUTE_MEANS.stop}</p>
        {branches.find((b) => b.key === "stop") ? <div className="rounded-xl bg-white p-3 text-[13px] text-[var(--primary)] ring-1 ring-black/[0.06]">{branches.find((b) => b.key === "stop")!.text}</div> : null}
        <EdgeList edges={n} nodes={nodes} onPick={(i) => setSel({ k: "e", i: edges.indexOf(n[i]) })} />
      </DetailHead>
    );
  })();

  const menu = (id: string, icon: string, name: string, badge: string, active: boolean, body: ReactNode) => (
    <div className="relative">
      <button type="button" onClick={() => setDd(dd === id ? null : id)} aria-expanded={dd === id} title={name} className={cn("flex h-7 items-center gap-1 rounded-lg px-2 text-[11.5px] font-bold transition-colors hover:bg-[#f1f2f3]", dd === id ? "bg-[#f1f2f3] text-[var(--primary)]" : active ? "text-[var(--primary)]" : "text-black/55")}>
        <MaterialSymbol className="text-[16px]" name={icon} /><span className="hidden sm:inline">{name}</span>
        {active ? <em className="font-mono text-[10px] not-italic text-black/45">{badge}</em> : null}
      </button>
      {dd === id ? (
        <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-30 grid w-64 gap-0.5 rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-[0_18px_40px_-16px_rgba(13,17,23,.45)] [animation:fm-in_.15s_ease-out]">
          {body}
        </div>
      ) : null}
    </div>
  );
  const item = (checked: boolean, onClick: () => void, label: string, left: ReactNode, right?: ReactNode) => (
    <button key={label} type="button" role="menuitemcheckbox" aria-checked={checked} onClick={onClick} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] font-semibold text-[var(--primary)] hover:bg-[#f4f5f6]">
      <span className={cn("flex size-4 flex-none items-center justify-center rounded border-[1.5px] transition-colors", checked ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-black/25")}>{checked ? <MaterialSymbol className="text-[13px]" name="check" /> : null}</span>
      {left}<span className="min-w-0 flex-1 truncate">{label}</span>{right}
    </button>
  );
  const foot = (all: () => void, none: () => void) => (
    <div className="mt-1 flex gap-1 border-t border-black/[0.06] pt-1.5">
      <button type="button" onClick={all} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[11.5px] font-bold text-black/65 hover:bg-[#f4f5f6]"><MaterialSymbol className="text-[15px]" name="done_all" />All</button>
      <button type="button" onClick={none} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[11.5px] font-bold text-black/65 hover:bg-[#f4f5f6]"><MaterialSymbol className="text-[15px]" name="remove_done" />None</button>
    </div>
  );

  const body = (
    <div className={cn("grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl border border-black/[0.08] bg-white", fs && "h-full grid-rows-[auto_auto_minmax(0,1fr)] rounded-none border-0")}>
      <style>{`@keyframes fm-in { from { opacity: 0; transform: translateY(-4px); } } @keyframes fm-fade { from { opacity: 0; transform: translateY(4px); } } @keyframes fm-slide { from { opacity: 0; transform: translateX(14px); } }`}</style>
      {/* full screen only: the name of the map */}
      {fs ? (
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-2.5">
          <div className="grid min-w-0 leading-tight">
            <span className={cn(kicker, "text-[9.5px] text-[var(--bridge-teal)]")}>{trail.length ? trail.join(" › ") : eyebrow}</span>
            <b className="truncate font-heading text-[16px] font-black uppercase tracking-[-0.02em] text-[var(--primary)]">{title}</b>
          </div>
          {gate ? <span className="flex flex-none items-center gap-1 text-[12px] font-bold text-[#005a5a]"><MaterialSymbol className="text-[15px]" name="verified_user" />{gate}</span> : null}
        </div>
      ) : null}

      {/* one slim toolbar: scenarios · routes · layers · full screen */}
      <div ref={tools} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-black/[0.06] px-2 py-1.5">
        <div className="flex flex-wrap gap-0.5" role="radiogroup" aria-label="Scenario">
          {scens.map((s) => {
            const on = S.id === s.id;
            return (
              <button key={s.id} type="button" role="radio" aria-checked={on} title={s.name} onClick={() => { setScen(s.id); setSel(null); }} className={cn("flex h-7 items-center gap-1 rounded-lg px-2 text-[11.5px] font-bold transition-colors", on ? "text-[var(--primary)]" : "text-black/50 hover:bg-[#f4f5f6] hover:text-[var(--primary)]")} style={on ? { background: `color-mix(in srgb, ${s.c} 10%, white)` } : undefined}>
                <MaterialSymbol className="text-[15px]" name={s.icon} style={{ color: on ? s.c : undefined }} />
                <span className={on ? "" : "hidden md:inline"}>{s.name}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-0.5">
          {menu("routes", "fork_right", "Routes", `${nRoutes}/${Object.keys(routes).length}`, nRoutes < Object.keys(routes).length, (
            <>
              <span className={cn(kicker, "px-2 pb-1 pt-0.5 text-black/45")}>Paths drawn between steps</span>
              {Object.entries(routes).map(([k, r]) => item(routesOn[k], () => setRoutesOn((o) => ({ ...o, [k]: !o[k] })), r.label,
                <svg width="20" height="8" aria-hidden="true"><line x1="0" x2="20" y1="4" y2="4" stroke={r.c} strokeWidth="2.5" strokeDasharray={k === "escalate" || k === "alternate" ? "5 4" : k === "stop" ? "1 4" : undefined} strokeLinecap="round" /></svg>,
                <em className="font-mono text-[10.5px] not-italic text-black/45">{count(k)}</em>))}
              {foot(() => setRoutesOn(Object.fromEntries(Object.keys(routes).map((k) => [k, true]))), () => setRoutesOn(Object.fromEntries(Object.keys(routes).map((k) => [k, false]))))}
            </>
          ))}
          {menu("layers", "layers", "Layers", `${nLayers}/${LAYERS.length}`, nLayers > 1, (
            <>
              <span className={cn(kicker, "px-2 pb-1 pt-0.5 text-black/45")}>What the map shows</span>
              {LAYERS.map(([k, n, ic]) => item(layers[k], () => setLayers((o) => ({ ...o, [k]: !o[k] })), n, <MaterialSymbol className="text-[16px] text-black/50" name={ic} />))}
              {foot(() => setLayers({ owners: true, checks: true, states: true, branches: true }), () => setLayers({ owners: false, checks: false, states: false, branches: false }))}
            </>
          ))}
          <span className="mx-1 h-4 w-px bg-black/10" />
          <button type="button" onClick={() => setFs((v) => !v)} title={fs ? "Exit full screen" : "Full screen"} aria-label={fs ? "Exit full screen" : "Full screen"} className="flex size-7 items-center justify-center rounded-lg text-black/55 transition-colors hover:bg-[var(--deep-indigo)] hover:text-white">
            <MaterialSymbol className="text-[17px]" name={fs ? "close_fullscreen" : "open_in_full"} />
          </button>
        </div>
      </div>

      {/* the map + what you picked (full screen: a side panel; inline: a card that slides over the map) */}
      <div className={cn("grid grid-cols-[minmax(0,1fr)]", fs && "min-h-0 lg:grid-cols-[minmax(0,1fr)_360px]")}>
        <div className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-1.5 p-2", fs && "min-h-0 overflow-auto p-3")}>
          {S.id !== "all" ? (
            <div key={S.id} className="px-2 text-[12.5px] leading-5 text-[var(--on-surface-variant)] [animation:fm-fade_.2s_ease-out]" style={{ boxShadow: `inset 2px 0 0 ${S.c}` }}>
              {cases[S.id] ? <Value v={cases[S.id]} /> : S.id === "happyPath" ? "Straight through, step by step, to the gate." : "Highlighted on the map."}
            </div>
          ) : null}
          <div className="flex flex-wrap items-start justify-center gap-3 md:flex-nowrap">
            <div className="min-w-0 max-w-full flex-[0_1_auto]">
            <FlowMap nodes={nodes} edges={edges} routes={routes} branches={branches} states={states} authority={authority} label={`Flow map of ${title}`} sel={sel} onSelect={setSel} routesOn={routesOn} layers={layers} relevant={S.routes} flow={S.id === "happyPath"} quiet={S.id === "edgeCases"} />
            </div>
            {!fs && sel ? (
              <aside aria-live="polite" key={JSON.stringify(sel)} className="grid w-full flex-none gap-3 rounded-2xl bg-[#fafbfb] p-4 ring-1 ring-black/[0.07] [animation:fm-slide_.22s_ease-out] md:w-72">
                <button type="button" onClick={() => setSel(null)} className="flex items-center gap-1 justify-self-end text-[11.5px] font-bold text-black/50 hover:text-[var(--primary)]"><MaterialSymbol className="text-[15px]" name="close" />Close</button>
                {detail}
              </aside>
            ) : null}
          </div>
          <div className="px-1 opacity-80"><RouteLegend routes={routes} /></div>
        </div>
        {fs ? (
          <aside aria-live="polite" className="min-w-0 overflow-auto border-t border-black/[0.06] bg-[#fafbfb] p-4 lg:border-l lg:border-t-0">
            <div key={JSON.stringify(sel)} className="grid gap-3 [animation:fm-fade_.2s_ease-out]">
              {sel ? (
                <button type="button" onClick={() => setSel(null)} className="flex items-center gap-1 justify-self-end text-[11.5px] font-bold text-black/50 hover:text-[var(--primary)]"><MaterialSymbol className="text-[15px]" name="close" />Clear</button>
              ) : null}
              {detail}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );

  return fs ? (
    <>
      <div className="h-24 rounded-2xl border border-dashed border-black/10" aria-hidden="true" />
      {/* above the dashboard chrome (z-110…130), below the detail drawer (z-200) */}
      {createPortal(<div className="fixed inset-0 z-[150] bg-white [animation:fm-fade_.2s_ease-out]" role="dialog" aria-modal="true" aria-label={`${title} — full screen`}>{body}</div>, document.body)}
    </>
  ) : body;
}

function Hint() {
  return (
    <div className="grid gap-2 text-[13px] text-[var(--on-surface-variant)]">
      <span className="flex items-center gap-1.5 font-bold text-[var(--primary)]"><MaterialSymbol className="text-[18px] text-[var(--bridge-teal)]" name="ads_click" />Explore the map</span>
      <p>Hover a step to trace every path through it. Click a step, a loop, a gate branch or a lane to see what it means.</p>
      <p>Pick a scenario to see one way the work can go, or switch routes and layers off to cut the noise.</p>
    </div>
  );
}

export function DetailHead({ kick, title, icon, color = "#007373", children }: { kick: string; title: string; icon?: string; color?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2.5">
      <div className="grid gap-0.5">
        <span className={cn(kicker, "flex items-center gap-1")} style={{ color: `color-mix(in srgb, ${color} 85%, black)` }}>{icon ? <MaterialSymbol className="text-[15px]" name={icon} /> : null}{kick}</span>
        <b className="font-heading text-[17px] font-black leading-tight tracking-[-0.02em] text-[var(--primary)]">{title}</b>
      </div>
      {children}
    </div>
  );
}

export function DetailRow({ label, icon, children }: { label: string; icon: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className={cn(kicker, "flex items-center gap-1 text-[9.5px] text-black/45")}><MaterialSymbol className="text-[14px]" name={icon} />{label}</span>
      <div className="text-[13px] text-[var(--primary)]">{children}</div>
    </div>
  );
}

function EdgeList({ edges, nodes, onPick }: { edges: FlowEdge[]; nodes: FlowNode[]; onPick: (i: number) => void }) {
  if (!edges.length) return <span className="text-[12.5px] italic text-black/45">No paths lead here on this map.</span>;
  return (
    <ul className="grid gap-1">
      {edges.map((e, i) => (
        <li key={i}><button type="button" onClick={() => onPick(i)} className="w-full rounded-lg bg-white px-2.5 py-1.5 text-left text-[12.5px] ring-1 ring-black/[0.06] hover:ring-black/20"><b className="text-[var(--primary)]">{nodes[e.f]?.label}</b>{e.n ? <span className="text-[var(--on-surface-variant)]"> — {e.n}</span> : null}</button></li>
      ))}
    </ul>
  );
}
