"use client";

import { useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { allRoles, nameOf, roleById, roleFolders, skillById, type Kind } from "@/lib/explore";
import { careerEdges, careerPath, pathGains } from "@/lib/explore/roadmap";
import { cn } from "@/lib/utils";

import { Mono } from "../skill-mono";

/* The career map: every role on a ring, grouped by family, linked to the roles most like it.
   Pick a start and a goal to trace the easiest path between them — and what to learn on each hop. */
const SIZE = 720, C = SIZE / 2, R = 270;
/* rounded, so the server and the browser draw exactly the same numbers */
const r1 = (n: number) => Math.round(n * 10) / 10;
const EDGES = careerEdges();
const ORDER = roleFolders.flatMap((f) => f.roles.map((r) => ({ id: r.id, folder: f.id, color: f.color })));
const GAP = 0.06; // radians between families
const POS = (() => {
  const step = (2 * Math.PI - GAP * roleFolders.length) / ORDER.length;
  const out = new Map<string, { x: number; y: number; a: number; color: string }>();
  let a = -Math.PI / 2, last = "";
  for (const r of ORDER) {
    if (last && r.folder !== last) a += GAP;
    out.set(r.id, { x: r1(C + R * Math.cos(a)), y: r1(C + R * Math.sin(a)), a, color: r.color });
    a += step; last = r.folder;
  }
  return out;
})();
const FAMILY_LABELS = roleFolders.map((f) => {
  const angles = f.roles.map((r) => POS.get(r.id)!.a);
  const a = (angles[0] + angles[angles.length - 1]) / 2;
  const deg = (a * 180) / Math.PI;
  const flip = deg > 0 && deg < 180; // bottom half: keep the text upright
  return { id: f.id, name: f.name, color: f.color, x: r1(C + (R + 26) * Math.cos(a)), y: r1(C + (R + 26) * Math.sin(a)), rot: r1(flip ? deg - 90 : deg + 90) };
});
const curve = (a: string, b: string) => {
  const p = POS.get(a)!, q = POS.get(b)!;
  const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
  return `M${p.x},${p.y} Q${r1(C + (mx - C) * 0.25)},${r1(C + (my - C) * 0.25)} ${q.x},${q.y}`;
};
const EXAMPLES: [string, string][] = [["qa-engineer", "devops-engineer"], ["data-analyst", "ml-engineer"], ["it-support", "security-engineer"], ["frontend-engineer", "ai-engineer"], ["technical-support", "software-engineer"]];

export function CareerMap({ onOpen }: { onOpen: (o: { kind: Kind; id: string }) => void }) {
  const [from, setFrom] = useState("qa-engineer");
  const [to, setTo] = useState("devops-engineer");
  const [hover, setHover] = useState<string | null>(null);
  const path = useMemo(() => careerPath(from, to, EDGES), [from, to]);
  const gains = useMemo(() => (path ? pathGains(path) : []), [path]);
  const onPath = new Set(path ?? []);
  const pathEdges = new Set((path ?? []).slice(1).map((id, i) => [path![i], id].sort().join("|")));
  const near = hover ? new Set(EDGES.filter((e) => e.a === hover || e.b === hover).flatMap((e) => [e.a, e.b])) : null;

  return (
    <div className="grid gap-5">
      <div className="grid gap-1"><b className="font-heading text-[22px] font-black uppercase tracking-[-0.03em]">Career map</b><p className="max-w-2xl text-[14px] text-black/60">Every role, linked to the roles that share the most skills and subjects with it. Pick where you are and where you want to be — the map traces the easiest way across.</p></div>

      {/* from → to */}
      <div className="flex flex-wrap items-end gap-2 rounded-[22px] border border-black/[0.06] bg-white p-4">
        <RolePick label="I am (or start as)" value={from} onChange={setFrom} />
        <button type="button" onClick={() => { setFrom(to); setTo(from); }} className="mb-0.5 flex size-10 items-center justify-center rounded-full border border-black/10 hover:border-black/30" aria-label="Swap start and goal"><MaterialSymbol className="text-[19px]" name="swap_horiz" /></button>
        <RolePick label="I want to become" value={to} onChange={setTo} />
        <span className="flex flex-wrap gap-1.5 pb-1 text-[12px]">
          <span className="self-center text-black/45">Try:</span>
          {EXAMPLES.map(([a, b]) => <button key={a + b} type="button" onClick={() => { setFrom(a); setTo(b); }} className={cn("rounded-full border px-2.5 py-1 font-semibold", from === a && to === b ? "border-[#0d1117] bg-[#0d1117] text-white" : "border-black/10 hover:border-black/30")}>{nameOf("role", a)} → {nameOf("role", b)}</button>)}
        </span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* the ring */}
        <div className="rounded-[26px] border border-black/[0.06] bg-white p-2">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-label="Map of roles, linked by shared skills">
            {EDGES.map((e) => {
              const key = [e.a, e.b].sort().join("|"), hot = pathEdges.has(key), lit = hover && (e.a === hover || e.b === hover);
              return <path key={key} d={curve(e.a, e.b)} fill="none" stroke={hot ? "#e91e63" : lit ? "#0d1117" : "#0d1117"} strokeOpacity={hot ? 1 : lit ? 0.5 : hover || path ? 0.05 : 0.1} strokeWidth={hot ? 3.5 : lit ? 1.6 : 1} />;
            })}
            {FAMILY_LABELS.map((f) => <text key={f.id} transform={`translate(${f.x},${f.y}) rotate(${f.rot})`} textAnchor="middle" dominantBaseline="middle" fontSize="12.5" fontWeight="800" fill={f.color} opacity={hover || path ? 0.45 : 1}>{f.name}</text>)}
            {ORDER.map(({ id }) => {
              const p = POS.get(id)!;
              const isPath = onPath.has(id), dim = (near && !near.has(id)) || (!near && path && !isPath);
              const step = path ? path.indexOf(id) : -1;
              return (
                <g key={id} className="cursor-pointer" onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover(null)} onClick={() => onOpen({ kind: "role", id })} opacity={dim ? 0.3 : 1}>
                  <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
                  <circle cx={p.x} cy={p.y} r={isPath ? 11 : hover === id ? 9 : 6.5} fill={isPath ? "#e91e63" : p.color} stroke="#fff" strokeWidth={2.5} />
                  {step >= 0 ? <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">{step + 1}</text> : null}
                </g>
              );
            })}
            {/* names: the hovered role and its neighbours, or the path */}
            {ORDER.filter(({ id }) => (near ? near.has(id) : onPath.has(id))).map(({ id }) => {
              const p = POS.get(id)!;
              const inward = { x: r1(C + (R - 22) * Math.cos(p.a)), y: r1(C + (R - 22) * Math.sin(p.a)) };
              const right = Math.cos(p.a) < 0; // labels sit inside the ring, pointing towards the centre
              const strong = id === hover || onPath.has(id);
              return (
                <text key={`l-${id}`} x={inward.x} y={inward.y} textAnchor={right ? "start" : "end"} dominantBaseline="middle" fontSize={strong ? 14 : 12.5} fontWeight={strong ? 800 : 600} fill={onPath.has(id) ? "#e91e63" : "#0d1117"} stroke="#fff" strokeWidth={4} paintOrder="stroke" className="pointer-events-none">{nameOf("role", id)}</text>
              );
            })}
            <text x={C} y={C - 8} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0d1117">{allRoles.length} roles</text>
            <text x={C} y={C + 12} textAnchor="middle" fontSize="11" fill="#6b7071">linked by shared skills</text>
          </svg>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-3 pb-3 text-[11.5px] text-black/60">{roleFolders.map((f) => <span key={f.id} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: f.color }} />{f.name}</span>)}</div>
        </div>

        {/* the path, step by step */}
        <section className="grid gap-3 rounded-[26px] border border-black/[0.06] bg-white p-5 lg:sticky lg:top-[150px]">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#e91e63]">Your path</span>
          {!path ? <p className="text-[14px] text-black/55">These two roles aren’t linked closely enough to trace a path — try a different start.</p> : path.length === 1 ? <p className="text-[14px] text-black/55">Pick a different goal.</p> : (
            <>
              <b className="text-[17px] leading-snug">{nameOf("role", from)} → {nameOf("role", to)} in {path.length - 1} step{path.length - 1 === 1 ? "" : "s"}</b>
              <ol className="grid gap-0">
                {gains.map((g, i) => {
                  const r = roleById.get(g.id)!;
                  return (
                    <li key={g.id} className="relative grid grid-cols-[28px_1fr] gap-3 pb-4 last:pb-0">
                      {i < gains.length - 1 ? <span className="absolute left-[13px] top-7 h-[calc(100%-24px)] w-0.5 bg-[#e91e63]/25" aria-hidden /> : null}
                      <span className="z-[1] flex size-7 items-center justify-center rounded-full bg-[#e91e63] font-mono text-[12px] font-bold text-white">{i + 1}</span>
                      <span className="grid gap-1.5">
                        <button type="button" onClick={() => onOpen({ kind: "role", id: g.id })} className="w-fit text-left text-[14.5px] font-bold hover:underline">{r.name}</button>
                        {i === 0 ? <span className="text-[12.5px] text-black/50">Where you start.</span> : g.add.length ? (
                          <span className="grid gap-1"><span className="text-[12px] text-black/50">Add:</span><span className="flex flex-wrap gap-1">{g.add.slice(0, 6).map((s) => { const k = skillById.get(s)!; return <button key={s} type="button" onClick={() => onOpen({ kind: "skill", id: s })} className="flex items-center gap-1 rounded-full border border-black/10 py-0.5 pl-0.5 pr-2 text-[11.5px] font-semibold hover:border-black/30"><Mono k={k} size={18} />{k.name}</button>; })}{g.add.length > 6 ? <span className="self-center text-[11.5px] text-black/40">+{g.add.length - 6}</span> : null}</span></span>
                        ) : <span className="text-[12.5px] text-black/50">Mostly the skills you already have.</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
          <p className="border-t border-black/[0.06] pt-3 text-[12px] text-black/45">Hover a dot to see the role and who it’s linked to; click it for details.</p>
        </section>
      </div>
    </div>
  );
}

function RolePick({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="grid min-w-[200px] flex-1 gap-1 text-[12px] font-bold text-black/55">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-xl border border-black/10 bg-white px-3 text-[14px] font-bold text-[#0d1117] outline-none focus:border-[#007373]">
        {roleFolders.map((f) => <optgroup key={f.id} label={f.name}>{f.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>)}
      </select>
    </label>
  );
}
