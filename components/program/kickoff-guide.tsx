import { Fragment } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Guide, GuideExample, GuideItem, GuideStage, GuideVisual } from "@/lib/program";
import { levelXp } from "@/lib/program/gamification";
import { cn } from "@/lib/utils";

const kicker = "font-mono text-[10px] font-bold uppercase tracking-[0.16em]";
const TRACK: Record<string, { name: string; color: string }> = {
  discovery: { name: "Discovery", color: "#6d48d8" },
  delivery: { name: "Delivery", color: "#007373" },
  run: { name: "Run & learn", color: "#a87b00" },
};
const colorOf = (s: Pick<GuideStage, "id" | "track">) => (s.id === "kickoff" || s.id === "capstone" ? "#d81b60" : TRACK[s.track]?.color ?? "#007373");
const LOOP: Record<string, { color: string; icon: string; name: string }> = {
  rework: { color: "#d81b60", icon: "replay", name: "Rework" },
  alternate: { color: "#0284c7", icon: "alt_route", name: "Alternate" },
  escalate: { color: "#c49000", icon: "north_east", name: "Escalate" },
  stop: { color: "#64748b", icon: "block", name: "Stop" },
};

/* ---------- the pictures ---------- */
function Stages({ stages }: { stages: GuideStage[] }) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {stages.map((s) => (
        <li key={s.id} className="relative grid content-start gap-1.5 overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-3" style={{ boxShadow: `inset 0 3px 0 ${colorOf(s)}` }}>
          <span className="flex items-center justify-between gap-1">
            <span className="flex size-7 items-center justify-center rounded-lg font-mono text-[11px] font-bold text-white" style={{ background: colorOf(s) }}>{s.n}</span>
            <span className="font-mono text-[10px] text-black/45">{s.days}</span>
          </span>
          <b className="text-[13.5px] leading-tight text-[var(--primary)]">{s.name}</b>
          <span className="line-clamp-2 text-[11.5px] leading-4 text-black/55">{s.line}</span>
          <span className="mt-auto flex items-center gap-1 pt-1 text-[10.5px] font-semibold" style={{ color: colorOf(s) }}><MaterialSymbol className="text-[13px]" name="flag" />{s.gate}</span>
        </li>
      ))}
    </ol>
  );
}

function Ladder({ rows }: { rows: { level: string; icon: string; what: string; example: string }[] }) {
  return (
    <ol className="grid gap-1.5">
      {rows.map((r, i) => (
        <li key={r.level} className="grid items-center gap-x-3 gap-y-1 rounded-2xl border border-black/[0.06] bg-white px-3 py-2.5 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)]" style={{ marginLeft: `min(${i * 14}px, 6vw)` }}>
          <span className="flex items-center gap-2">
            <span className="flex size-7 flex-none items-center justify-center rounded-lg bg-[var(--deep-indigo)] text-white"><MaterialSymbol className="text-[16px]" name={r.icon} /></span>
            <b className="text-[13.5px] text-[var(--primary)]">{r.level}</b>
          </span>
          <span className="text-[12.5px] leading-5 text-black/60">{r.what}</span>
          {r.example ? <span className="flex items-center gap-1.5 justify-self-start rounded-lg bg-[#f1f5f9] px-2 py-1 text-[12px] text-[var(--primary)]"><span className="font-mono text-[10px] text-black/40">e.g.</span>{r.example}</span> : <span />}
        </li>
      ))}
    </ol>
  );
}

function Tiles({ items, numbered }: { items: GuideItem[]; numbered?: boolean }) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      {items.map((s, i) => (
        <li key={s.name} className="grid content-start gap-1.5 rounded-2xl border border-black/[0.06] bg-white p-3">
          <span className="flex items-center gap-2">
            {numbered ? <span className="flex size-5 items-center justify-center rounded-full bg-[var(--electric-pink)] text-[10.5px] font-black text-white">{i + 1}</span> : null}
            <MaterialSymbol className="text-[18px] text-[var(--bridge-teal)]" name={s.icon} />
          </span>
          <b className="text-[13px] text-[var(--primary)]">{s.name}</b>
          <span className="text-[11.5px] leading-4 text-black/55">{s.what}</span>
        </li>
      ))}
    </ol>
  );
}

/* a real workflow, drawn the way the lessons draw them: entry → steps (◆ decisions) → gate, with its loops */
function Workflow({ example: e }: { example: GuideExample }) {
  const name = (id: string) => (id === "authority" ? "the authority" : id === "stop" ? "stop" : e.steps.find((s) => s.id === id)?.title ?? id);
  return (
    <div className="grid gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
      <span className={cn(kicker, "text-black/40")}>Day {e.day} · {e.chapter} · {e.code} {e.lesson}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-[var(--deep-indigo)] px-3 py-1.5 text-[11.5px] font-bold text-white">Entry</span>
        {e.steps.map((s) => (
          <Fragment key={s.id}>
            <MaterialSymbol className="text-[16px] text-black/30" name="arrow_forward" />
            {s.decision ? (
              <span className="flex items-center gap-1.5 rounded-lg border-2 border-[#c49000] bg-[#fff8e6] px-2.5 py-1.5 text-[12px] font-semibold text-[#6b4e00]"><span className="size-2.5 rotate-45 bg-[#c49000]" />{s.title}</span>
            ) : (
              <span className="rounded-lg border border-black/10 bg-[#f8fafc] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--primary)]">{s.title}</span>
            )}
          </Fragment>
        ))}
        <MaterialSymbol className="text-[16px] text-black/30" name="arrow_forward" />
        <span className="flex items-center gap-1 rounded-full bg-[var(--bridge-teal)] px-3 py-1.5 text-[11.5px] font-bold text-white"><MaterialSymbol className="text-[14px]" name="flag" />{e.gate}</span>
      </div>
      {e.loops.length ? (
        <ul className="grid gap-1.5 border-t border-black/[0.06] pt-3 sm:grid-cols-2">
          {e.loops.map((l, i) => {
            const k = LOOP[l.kind] ?? LOOP.alternate;
            return (
              <li key={i} className="flex items-start gap-2 text-[12px] leading-5 text-black/60">
                <span className="flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold text-white" style={{ background: k.color }}><MaterialSymbol className="text-[12px]" name={k.icon} />{k.name}</span>
                <span><b className="text-[var(--primary)]">{l.label}</b> — from “{name(l.from)}” to {l.to === "authority" || l.to === "stop" ? name(l.to) : `“${name(l.to)}”`}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function Cycle({ steps, back }: { steps: GuideItem[]; back: GuideItem }) {
  return (
    <div className="grid gap-2">
      <ol className="flex flex-wrap items-stretch gap-1.5">
        {steps.map((s, i) => (
          <Fragment key={s.name}>
            {i ? <li aria-hidden="true" className="flex items-center"><MaterialSymbol className="text-[18px] text-black/25" name="arrow_forward" /></li> : null}
            <li className={cn("grid min-w-[130px] flex-1 content-start gap-1 rounded-2xl border p-3", i === steps.length - 1 ? "border-[var(--bridge-teal)]/40 bg-[#e6f3f3]" : "border-black/[0.06] bg-white")}>
              <MaterialSymbol className={cn("text-[19px]", i === steps.length - 1 ? "text-[var(--bridge-teal)]" : "text-black/45")} name={s.icon} />
              <b className="text-[13px] text-[var(--primary)]">{s.name}</b>
              <span className="text-[11.5px] leading-4 text-black/55">{s.what}</span>
            </li>
          </Fragment>
        ))}
      </ol>
      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[#d81b60]/40 bg-[#fff6f9] px-3 py-2 text-[12px] text-[#7a0c38]">
        <MaterialSymbol className="text-[18px]" name={back.icon} /><b>{back.name}</b><span className="text-[#7a0c38]/80">{back.what}</span>
        <span className="ml-auto hidden items-center gap-1 font-mono text-[10px] sm:flex">Review <MaterialSymbol className="text-[14px]" name="arrow_back" /> Draft</span>
      </div>
    </div>
  );
}

function Kit({ layers }: { layers: GuideItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {layers.map((l) => (
        <li key={l.name} className="grid content-start gap-1 rounded-2xl border border-black/[0.06] bg-white p-3">
          <span className="flex items-center justify-between">
            <MaterialSymbol className="text-[19px] text-[var(--bridge-teal)]" name={l.icon} />
            {l.n ? <b className="font-mono text-[15px] text-[var(--primary)]">{l.n}</b> : null}
          </span>
          <b className="font-mono text-[12.5px] text-[var(--primary)]">{l.name}</b>
          <span className="text-[11.5px] leading-4 text-black/55">{l.what}</span>
        </li>
      ))}
    </ul>
  );
}

function Unlocks({ stages }: { stages: GuideStage[] }) {
  return (
    <ol className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {stages.map((s) => (
        <li key={s.id} className="flex items-center gap-2.5 rounded-xl border border-black/[0.06] bg-white px-3 py-2">
          <span className="grid size-10 flex-none place-items-center rounded-lg font-mono text-[11px] font-bold leading-none text-white" style={{ background: colorOf(s) }}><span className="text-[8px] opacity-75">DAY</span>{s.firstDay}</span>
          <span className="grid min-w-0 leading-tight">
            <b className="truncate text-[12.5px] text-[var(--primary)]">{s.name}</b>
            <span className="text-[11px] text-black/45">{s.files} files</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Xp({ rows }: { rows: [string, number][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <ul className="grid gap-1 rounded-2xl border border-black/[0.06] bg-white p-3">
        {rows.map(([what, xp]) => (
          <li key={what} className="flex items-center justify-between gap-2 border-b border-black/[0.04] py-1 text-[12.5px] last:border-0">
            <span className="text-black/65">{what}</span><b className="rounded-full bg-[#f3efff] px-2 py-0.5 font-mono text-[11.5px] text-[#5b3cc4]">+{xp} XP</b>
          </li>
        ))}
      </ul>
      <div className="grid content-start gap-2 rounded-2xl bg-[var(--deep-indigo)] p-4 text-white">
        <span className={cn(kicker, "text-[#4fd1c5]")}>Levels</span>
        {[2, 3, 4, 5, 6].map((lv) => (
          <span key={lv} className="flex items-center gap-2 text-[12.5px]">
            <span className="flex size-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-black">{lv}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-[#4fd1c5] to-[#ff5c93]" style={{ width: `${Math.min(100, (levelXp(lv) / levelXp(6)) * 100)}%` }} /></span>
            <span className="w-16 text-right font-mono text-[11px] text-white/60">{levelXp(lv).toLocaleString("en-US")} XP</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Visual({ v }: { v: GuideVisual }) {
  switch (v.kind) {
    case "stages": return <Stages stages={v.stages} />;
    case "ladder": return <Ladder rows={v.rows} />;
    case "steps": return <Tiles items={v.steps} numbered />;
    case "workflow": return <Workflow example={v.example} />;
    case "cycle": return <Cycle steps={v.steps} back={v.back} />;
    case "kit": return <Kit layers={v.layers} />;
    case "unlocks": return <Unlocks stages={v.stages} />;
    case "xp": return <Xp rows={v.rows} />;
  }
}

/* Day 0's orientation lessons: a short intro, then sections — each a picture of how the month works, drawn from the
   program's real data — before the lesson's exercise */
export function KickoffGuide({ guide, onBoard }: { guide: Guide; onBoard?: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-[var(--deep-indigo)] px-5 py-4" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <p className="min-w-[240px] flex-1 text-[14px] leading-7 text-white/85"><MaterialSymbol className="mr-1.5 align-[-4px] text-[19px] text-[#4fd1c5]" name="waving_hand" />{guide.intro}</p>
        {onBoard ? <button type="button" onClick={onBoard} className="flex flex-none items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-4 py-2 text-[12.5px] font-bold text-white shadow-lg shadow-pink-500/25 hover:brightness-110"><MaterialSymbol className="text-[18px]" name="co_present" />Watch on the board</button> : null}
      </div>
      {guide.sections.map((s) => (
        <section key={s.title} className="grid gap-3 rounded-[20px] border border-black/[0.06] bg-[#fbfbfc] p-4 sm:p-5">
          <span className="flex items-center gap-2.5">
            <span className="flex size-8 flex-none items-center justify-center rounded-xl bg-white text-[var(--electric-pink)] shadow-sm ring-1 ring-black/5"><MaterialSymbol className="text-[18px]" name={s.icon} /></span>
            <h3 className="text-[16px] font-bold text-[var(--primary)]">{s.title}</h3>
          </span>
          {s.body ? <p className="max-w-3xl text-[13.5px] leading-6 text-black/65">{s.body}</p> : null}
          {s.visual ? <Visual v={s.visual} /> : null}
          {s.points?.length ? (
            <dl className="grid gap-2 sm:grid-cols-2">
              {s.points.map(([k, v]) => (
                <div key={k} className="grid gap-0.5 rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-black/[0.05]">
                  <dt className="text-[13px] font-bold text-[var(--primary)]">{k}</dt>
                  <dd className="text-[12.5px] leading-5 text-black/60">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ))}
      <div className="flex items-center gap-2 px-1 pt-1 text-[12.5px] font-semibold text-black/45"><MaterialSymbol className="text-[17px]" name="south" />Now the task for this lesson</div>
    </div>
  );
}
