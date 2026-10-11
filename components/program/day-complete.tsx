"use client";

import { useMemo } from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

export type GameSnap = { xp: number; level: number; pct: number; title: string; streak?: number; earned: { id: string; name: string; icon: string }[] };
const COLORS = ["#e91e63", "#4fd1c5", "#f5b400", "#6d48d8", "#0284c7", "#ff7aa8"];

/* the moment a day is done: confetti, the XP it brought, level and streak, anything new — and a look at tomorrow */
export function DayComplete({ day, title, before, after, next, onClose }: {
  day: number; title: string; before: GameSnap | null; after: GameSnap | null;
  next: { day: number; title: string; goal: string; act: string } | null; onClose: () => void;
}) {
  const bits = useMemo(() => Array.from({ length: 46 }, (_, i) => ({ left: `${(i * 37) % 100}%`, color: COLORS[i % COLORS.length], dx: `${((i * 53) % 40) - 20}vw`, rot: `${360 + ((i * 97) % 540)}deg`, dur: `${2.2 + ((i * 13) % 14) / 10}s`, delay: `${((i * 7) % 10) / 20}s` })), []);
  const gained = after && before ? after.xp - before.xp : null;
  const levelUp = after && before && after.level > before.level;
  const fresh = after && before ? after.earned.filter((b) => !before.earned.some((x) => x.id === b.id)) : [];

  return (
    <div className="fixed inset-0 z-[160] grid place-items-center overflow-hidden bg-[#0d1117]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Day ${day} complete`}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {bits.map((b, i) => <span key={i} className="confetti-bit" style={{ left: b.left, background: b.color, ["--dx" as string]: b.dx, ["--rot" as string]: b.rot, ["--dur" as string]: b.dur, ["--delay" as string]: b.delay }} />)}
      </div>
      <div className="pop-in relative grid w-full max-w-lg gap-5 rounded-[28px] bg-white p-6 text-center shadow-2xl sm:p-8">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[var(--electric-pink)] text-white shadow-lg shadow-pink-500/30"><MaterialSymbol className="text-[34px]" name="celebration" /></span>
        <div className="grid gap-1">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--bridge-teal)]">Day {day} complete</span>
          <h2 className="font-heading text-[26px] font-black uppercase leading-none tracking-[-0.03em] text-[var(--primary)]">{title}</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="grid gap-0.5 rounded-2xl bg-[#effaf9] p-3"><b className="text-[24px] font-black text-[var(--bridge-teal)]">{gained != null ? `+${gained.toLocaleString("en-US")}` : "+100"}</b><span className="text-[11px] font-semibold text-black/50">XP</span></div>
          <div className={cn("grid gap-0.5 rounded-2xl p-3", levelUp ? "bg-[#fff6d6]" : "bg-[#f6f7f8]")}><b className="text-[24px] font-black text-[var(--primary)]">{after?.level ?? "—"}</b><span className="text-[11px] font-semibold text-black/50">{levelUp ? "Level up!" : "Level"}</span></div>
          <div className="grid gap-0.5 rounded-2xl bg-[#fff1e6] p-3"><b className="text-[24px] font-black text-[#ea580c]">{after?.streak ?? 1}</b><span className="text-[11px] font-semibold text-black/50">day streak</span></div>
        </div>
        {after ? (
          <span className="grid gap-1 text-left">
            <span className="flex justify-between text-[11.5px] text-black/50"><span>{after.title}</span><span>{after.pct}% to level {after.level + 1}</span></span>
            <span className="block h-2 overflow-hidden rounded-full bg-black/[0.07]"><span className="block h-full rounded-full bg-gradient-to-r from-[#4fd1c5] to-[var(--electric-pink)] transition-[width] duration-1000" style={{ width: `${after.pct}%` }} /></span>
          </span>
        ) : null}
        {fresh.length ? (
          <div className="grid gap-2">
            <span className="text-[12px] font-bold text-black/50">New today</span>
            <div className="flex flex-wrap justify-center gap-2">{fresh.map((b) => <span key={b.id} className="flex items-center gap-1.5 rounded-full bg-[#fff6d6] px-3 py-1 text-[12.5px] font-bold text-[#6b4f00]"><MaterialSymbol className="text-[16px]" name={b.icon} />{b.name}</span>)}</div>
          </div>
        ) : null}

        {next ? (
          <div className="grid gap-1 rounded-2xl border border-black/[0.06] p-4 text-left">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/40">Tomorrow · Day {next.day} · {next.act}</span>
            <b className="text-[16px] text-[var(--primary)]">{next.title}</b>
            <span className="line-clamp-2 text-[13px] leading-5 text-[var(--on-surface-variant)]">{next.goal}</span>
          </div>
        ) : <p className="text-[14px] font-semibold text-[var(--primary)]">That was the last day — you’ve finished the program.</p>}
        <div className="flex flex-wrap justify-center gap-2">
          {next ? <Link href={`/dashboard/roadmap/day/${next.day}`} className="flex items-center gap-2 rounded-full bg-[var(--electric-pink)] px-6 py-3 text-[13px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25">Start Day {next.day}<MaterialSymbol className="text-[18px]" name="arrow_forward" /></Link> : null}
          <button type="button" onClick={onClose} className="rounded-full border border-black/10 px-5 py-3 text-[13px] font-bold text-[var(--primary)]">{next ? "Later" : "Close"}</button>
        </div>
      </div>
    </div>
  );
}
