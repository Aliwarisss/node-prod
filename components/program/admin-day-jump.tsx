"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

/* Admins aren't held to the one-day-after-another order: they can open any day of the program, to check it, test it
   or help a trainee with it. */

export type DayLink = { day: number; title: string; stageId: string; stage: string; lessons: number };
const STAGE_COLOR: Record<string, string> = { kickoff: "#d81b60", capstone: "#d81b60", discover: "#6d48d8", plan: "#6d48d8", design: "#6d48d8", build: "#007373", verify: "#007373", release: "#007373", operate: "#a87b00", evolve: "#a87b00" };

const byStage = (days: DayLink[]) => {
  const out: { id: string; name: string; days: DayLink[] }[] = [];
  for (const d of days) {
    const g = out[out.length - 1];
    if (g && g.id === d.stageId) g.days.push(d); else out.push({ id: d.stageId, name: d.stage, days: [d] });
  }
  return out;
};

/* on My program: every day, by stage — one click to any of them */
export function AdminDayGrid({ days, current }: { days: DayLink[]; current?: number }) {
  return (
    <section className="grid gap-3 rounded-[22px] border border-dashed border-[#c49000]/50 bg-[#fffbef] p-4 sm:p-5" aria-label="Open any day">
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-[#c49000] text-white"><MaterialSymbol className="text-[18px]" name="admin_panel_settings" /></span>
          <span className="grid leading-tight"><b className="text-[14.5px] text-[var(--primary)]">Open any day</b><span className="text-[12px] text-black/50">Admin · every day is open to you, in any order</span></span>
        </span>
        <span className="text-[11.5px] text-black/45">{days.length} days</span>
      </span>
      <div className="grid gap-2">
        {byStage(days).map((g) => (
          <div key={g.id} className="grid items-center gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
            <span className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: STAGE_COLOR[g.id] ?? "#007373" }}><span className="size-2 rounded-full" style={{ background: STAGE_COLOR[g.id] ?? "#007373" }} />{g.name}</span>
            <div className="flex flex-wrap gap-1.5">
              {g.days.map((d) => (
                <Link key={d.day} href={`/dashboard/roadmap/day/${d.day}`} title={`Day ${d.day} · ${d.title} · ${d.lessons} lessons`}
                  className={cn("flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 font-mono text-[12.5px] font-bold transition-all hover:-translate-y-px hover:shadow-md",
                    d.day === current ? "bg-[var(--primary)] text-white" : "bg-white text-[var(--primary)] ring-1 ring-black/10 hover:ring-black/30")}>
                  {d.day}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* in the day player: any day, from a list grouped by stage */
export function AdminDaySelect({ days, current }: { days: DayLink[]; current: number }) {
  const router = useRouter();
  return (
    <label className="relative flex items-center gap-1.5 rounded-xl bg-[#c49000]/20 px-2 py-1 text-[11.5px] font-bold text-[#ffd666]" title="Admin · open any day">
      <MaterialSymbol className="text-[15px]" name="admin_panel_settings" />
      <span className="sr-only">Open any day</span>
      <select value={current} onChange={(e) => router.push(`/dashboard/roadmap/day/${e.target.value}`)} className="w-full cursor-pointer appearance-none bg-transparent pr-5 text-[11.5px] font-bold text-[#ffd666] outline-none [&>optgroup]:text-[var(--primary)] [&>optgroup>option]:text-[var(--primary)]">
        {byStage(days).map((g) => (
          <optgroup key={g.id} label={g.name}>
            {g.days.map((d) => <option key={d.day} value={d.day}>Day {d.day} · {d.title.length > 46 ? `${d.title.slice(0, 45)}…` : d.title}</option>)}
          </optgroup>
        ))}
      </select>
      <MaterialSymbol className="pointer-events-none absolute right-1.5 text-[15px]" name="expand_more" />
    </label>
  );
}
