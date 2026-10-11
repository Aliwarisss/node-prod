import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Stage } from "@/lib/program";

import { SeamJoin } from "./seam-join";
import { cn } from "@/lib/utils";

export type DayStatus = "done" | "current" | "open" | "locked";
type Props = {
  now: Stage;
  next: Stage | null;
  later: Stage | null;
  color: (track: string, id: string) => string;
  trackName: (track: string) => string;
  dayStatus: Record<number, DayStatus>;
  lessonDone: Record<string, boolean>;
  current: number;
};

const kicker = "font-mono text-[10px] font-bold uppercase tracking-[0.16em]";
const label = (s: Stage) => (s.id === "kickoff" || s.id === "capstone" ? s.name : `Act ${s.n}`);
const soft = (c: string) => (c === "#6d48d8" ? "#a78bfa" : c === "#a87b00" ? "#e0b84a" : c === "#d81b60" ? "#ff5c93" : "#4fd1c5");
const count = (s: Stage) => s.days.reduce((n, d) => n + d.processes.reduce((m, p) => m + p.lessons.length, 0), 0);
const DOT: Record<DayStatus, string> = { done: "#4fd1c5", current: "#ff5c93", open: "transparent", locked: "rgba(255,255,255,.12)" };

/* Two boxes joined at the stage gate: where you stand now → the transition → the stage you go on to */
export function StageFocus({ now, next, later, color, trackName, dayStatus, lessonDone, current }: Props) {
  const c = color(now.track, now.id);
  const cn2 = next ? color(next.track, next.id) : "#007373";
  const lessons = now.days.flatMap((d) => d.processes.flatMap((p) => p.lessons));
  const done = lessons.filter((l) => lessonDone[l.fid]).length;
  const pct = lessons.length ? done / lessons.length : 0;
  const today = now.days.find((d) => d.day === current) ?? now.days.find((d) => dayStatus[d.day] !== "done") ?? now.days[0];
  const todayLessons = today.processes.flatMap((p) => p.lessons);
  const here = todayLessons.find((l) => !lessonDone[l.fid]);
  const daysLeft = now.days.filter((d) => dayStatus[d.day] !== "done").length;
  const lessonsLeft = lessons.length - done;
  const stageDone = daysLeft === 0;
  const nextLessons = next ? next.days.reduce((n, d) => n + d.processes.reduce((m, p) => m + p.lessons.length, 0), 0) : 0;
  const nextStatus = !next ? null : stageDone ? (next.days.some((d) => dayStatus[d.day] === "done") ? "In progress" : "Ready to start") : "Locked";
  const ring = 2 * Math.PI * 22;
  const cn3 = later ? color(later.track, later.id) : "#007373";

  return (
    <div className={cn("grid overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-44px_rgba(13,17,23,0.5)]", next && later ? "lg:grid-cols-[minmax(0,1.3fr)_96px_minmax(0,1fr)_72px_minmax(0,0.8fr)]" : "lg:grid-cols-[minmax(0,1.3fr)_96px_minmax(0,1fr)]")}>
      {/* ---------- NOW ---------- */}
      <section className="relative grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 bg-[var(--deep-indigo)] p-5 text-white" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-0.5">
            <span className={cn(kicker, "flex flex-wrap items-center gap-x-1.5 gap-y-1 text-white/70")}>
              <span className="rounded-full bg-[#d81b60] px-1.5 py-px text-[9px] text-white">NOW</span><span className="whitespace-nowrap text-white">Day {today.day}</span><span className="whitespace-nowrap">· {label(now)} · {trackName(now.track)}</span>
            </span>
            <h2 className="font-heading text-[22px] font-black uppercase leading-tight tracking-[-0.03em]">{now.name}</h2>
            {now.tagline ? <p className="text-[12.5px] text-white/65">{now.tagline}</p> : null}
          </div>
          <div className="relative flex-none">
            <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90" aria-hidden="true">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="6" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={c === "#6d48d8" ? "#a78bfa" : "#4fd1c5"} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${ring * pct} ${ring}`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[12px] font-black">{Math.round(pct * 100)}%</span>
          </div>
        </div>

        {/* status + the stage's days */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", stageDone ? "bg-[#4fd1c5]/20 text-[#4fd1c5]" : "bg-[#ff5c93]/20 text-[#ff8fb3]")}>
            <MaterialSymbol className="text-[14px]" name={stageDone ? "check_circle" : "pending"} />{stageDone ? "Stage complete" : "In progress"}
          </span>
          <span className="text-[11.5px] text-white/60">{done}/{lessons.length} lessons · {now.days.length - daysLeft}/{now.days.length} days</span>
        </div>
        <ol className="flex gap-1.5" aria-label="Days of this stage">
          {now.days.map((d) => {
            const st = dayStatus[d.day];
            const n = d.processes.reduce((m, p) => m + p.lessons.filter((l) => lessonDone[l.fid]).length, 0), t = d.processes.reduce((m, p) => m + p.lessons.length, 0);
            const cell = (
              <span className={cn("grid flex-1 gap-1 rounded-lg px-2 py-1.5 text-left transition-colors", d.day === today.day ? "bg-white/[0.12] ring-1 ring-[#ff5c93]/60" : "bg-white/[0.04] hover:bg-white/[0.08]")}>
                <span className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] font-bold text-white/70">DAY {d.day}</span>
                  <span className="size-2 rounded-full" style={{ background: DOT[st], border: st === "open" ? "1.5px solid rgba(255,255,255,.5)" : undefined }} />
                </span>
                <span className="h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[#4fd1c5]" style={{ width: `${(n / Math.max(1, t)) * 100}%` }} /></span>
              </span>
            );
            return <li key={d.day} className="flex min-w-0 flex-1" title={`Day ${d.day} · ${d.title} — ${n}/${t}`}>{st === "locked" ? <span className="flex flex-1 opacity-60">{cell}</span> : <Link href={`/dashboard/roadmap/day/${d.day}`} className="flex flex-1">{cell}</Link>}</li>;
          })}
        </ol>

        {/* today, in depth */}
        <div className="grid gap-2 rounded-xl bg-white/[0.05] p-3 ring-1 ring-white/10">
          <span className="flex flex-wrap items-baseline justify-between gap-2">
            <b className="text-[13px]">Today · Day {today.day}: {today.title}</b>
            <span className="font-mono text-[10.5px] text-white/60">{todayLessons.filter((l) => lessonDone[l.fid]).length}/{todayLessons.length}</span>
          </span>
          {today.processes.map((p) => (
            <div key={p.code} className="grid gap-1">
              <span className="text-[11px] text-white/60"><span className="font-mono">Process {p.code}</span> · {p.title}</span>
              <ol className="grid grid-cols-[minmax(0,1fr)] gap-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                {p.lessons.map((l) => {
                  const ok = lessonDone[l.fid], isHere = l.fid === here?.fid;
                  return (
                    <li key={l.fid} className={cn("flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px]", isHere ? "bg-[#d81b60] text-white" : ok ? "bg-[#4fd1c5]/15 text-[#bdf1ec]" : "bg-white/[0.04] text-white/75")}>
                      <MaterialSymbol className="text-[14px]" name={ok ? "check_circle" : isHere ? "play_circle" : "radio_button_unchecked"} />
                      <span className="font-mono text-[9.5px] opacity-80">{l.code}</span>
                      <span className="min-w-0 truncate font-semibold">{l.title}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>

        <Link href={`/dashboard/roadmap/day/${today.day}`} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--electric-pink)] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-lg shadow-pink-500/25">
          <span className="min-w-0 truncate">{here ? <>Continue: {here.code} {here.title}</> : `Open day ${today.day}`}</span>
          <MaterialSymbol className="text-[18px]" name="arrow_forward" />
        </Link>
      </section>

      {/* ---------- the join: a diagonal seam, the gate written along it ---------- */}
      <SeamJoin
        from="#0d1117"
        to="#fafbfb"
        line={["#ff5c93", soft(cn2)]}
        ink={["rgba(255,255,255,.85)", "#3d4347"]}
        gate={now.gate || "Stage complete"}
        note={stageDone ? "PASSED — MOVE ON" : `${daysLeft} DAY${daysLeft === 1 ? "" : "S"} · ${lessonsLeft} LESSON${lessonsLeft === 1 ? "" : "S"} TO GO`}
        lock={stageDone ? "#007373" : "#d81b60"}
        open={stageDone}
      />

      {/* ---------- UP NEXT ---------- */}
      {next ? (
        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 bg-[#fafbfb] p-5" style={{ boxShadow: `inset 0 4px 0 ${cn2}` }}>
          <div className="grid min-w-0 gap-0.5">
            <span className={cn(kicker, "flex items-center gap-1.5 text-[var(--on-surface-variant)]")}>
              <span className="rounded-full bg-[var(--deep-indigo)] px-1.5 py-px text-[9px] text-white">UP NEXT</span>{label(next)} · {trackName(next.track)}
            </span>
            <h2 className="font-heading text-[20px] font-black uppercase leading-tight tracking-[-0.03em] text-[var(--primary)]">{next.name}</h2>
            {next.tagline ? <p className="text-[12.5px] text-[var(--on-surface-variant)]">{next.tagline}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", nextStatus === "Locked" ? "bg-[#eceef0] text-black/65" : "bg-[#e6f3f3] text-[#005a5a]")}>
              <MaterialSymbol className="text-[14px]" name={nextStatus === "Locked" ? "lock" : "lock_open"} />{nextStatus}
            </span>
            <span className="text-[11.5px] text-[var(--on-surface-variant)]">{next.days.length} days · {nextLessons} lessons{next.gate ? ` · ends at ${next.gate}` : ""}</span>
          </div>
          <ol className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
            {next.days.map((d, i) => (
              <li key={d.day} className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-start gap-2 rounded-xl border border-black/[0.07] bg-white p-2.5">
                <span className="flex size-[34px] flex-col items-center justify-center rounded-lg text-white" style={{ background: i === 0 ? cn2 : `color-mix(in srgb, ${cn2} 55%, white)` }}>
                  <span className="text-[8px] font-bold leading-none">DAY</span><span className="text-[13px] font-black leading-none">{d.day}</span>
                </span>
                <span className="grid min-w-0 gap-0.5">
                  <b className="truncate text-[12.5px] text-[var(--primary)]">{d.title}</b>
                  <span className="truncate text-[11px] text-[var(--on-surface-variant)]">{d.processes.map((p) => (d.processes.length === 1 && p.title === d.title ? p.code : `${p.code} ${p.title}`)).join(" · ")} · {d.processes.reduce((m, p) => m + p.lessons.length, 0)} lessons{d.processes.length === 1 && d.processes[0].gate ? ` · gate: ${d.processes[0].gate}` : ""}</span>
                </span>
              </li>
            ))}
          </ol>
          <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--on-surface-variant)]">
            <MaterialSymbol className="text-[15px]" name="info" />
            {nextStatus === "Locked" ? `Opens when you pass ${now.gate || "this stage"} (after day ${now.days[now.days.length - 1].day}).` : `Starts with day ${next.days[0].day}: ${next.days[0].title}.`}
          </span>
        </section>
      ) : null}

      {/* ---------- LATER ---------- */}
      {next && later ? (
        <>
          <SeamJoin
            small
            from="#fafbfb"
            to="#eef0f2"
            line={[cn2, cn3]}
            ink={["#3d4347", "#5b6064"]}
            gate={next.gate || next.name}
            note={`OPENS AFTER DAY ${next.days[next.days.length - 1].day}`}
            lock="#7b8085"
          />
          <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 bg-[#eef0f2] p-5" style={{ boxShadow: `inset 0 4px 0 color-mix(in srgb, ${cn3} 45%, white)` }}>
            <div className="grid min-w-0 gap-0.5">
              <span className={cn(kicker, "flex flex-wrap items-center gap-1.5 text-[var(--on-surface-variant)]")}>
                <span className="rounded-full border border-black/25 px-1.5 py-px text-[9px] text-black/65">LATER</span>{label(later)}
              </span>
              <h2 className="font-heading text-[18px] font-black uppercase leading-tight tracking-[-0.03em] text-[var(--primary)]">{later.name}</h2>
              {later.tagline ? <p className="text-[12px] text-[var(--on-surface-variant)]">{later.tagline}</p> : null}
            </div>
            <span className="flex items-center gap-1 text-[11.5px] font-semibold text-black/60">
              <MaterialSymbol className="text-[14px]" name="lock" />{later.days.length} days · {count(later)} lessons
            </span>
            <ol className="grid grid-cols-[minmax(0,1fr)] gap-1">
              {later.days.map((d) => (
                <li key={d.day} className="flex min-w-0 items-center gap-2 rounded-lg bg-white/70 px-2 py-1.5 text-[11.5px]">
                  <span className="font-mono text-[10px] font-bold" style={{ color: `color-mix(in srgb, ${cn3} 70%, black)` }}>D{d.day}</span>
                  <span className="min-w-0 truncate font-semibold text-[var(--primary)]">{d.title}</span>
                </li>
              ))}
            </ol>
            {later.gate ? <span className="text-[11px] text-[var(--on-surface-variant)]">Ends at {later.gate}.</span> : null}
          </section>
        </>
      ) : !next ? (
        <section className="grid content-center justify-items-center gap-2 bg-[#fafbfb] p-6 text-center">
          <MaterialSymbol className="text-[30px] text-[var(--bridge-teal)]" name="workspace_premium" />
          <b className="text-[14px] text-[var(--primary)]">The last stage</b>
          <span className="text-[12.5px] text-[var(--on-surface-variant)]">Pass this gate to complete the program and earn your certificate.</span>
        </section>
      ) : null}
    </div>
  );
}
