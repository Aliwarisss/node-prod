import { MaterialSymbol } from "@/components/landing/material-symbol";
import { stageOf, type DaySummary, type ModelMeta } from "@/lib/program";
import type { Progress } from "@/lib/program/progress";

import { tracks } from "@/lib/platform-data";

import { JourneyMap, type JourneyAct } from "./journey-map";
import { MapSwitch } from "./map-switch";
import { StageFocus, type DayStatus } from "./stage-focus";

type Props = { days: DaySummary[]; progress: Progress; current: number; isAdmin: boolean; model: ModelMeta };

/* The month: where you stand, with the month's numbers, and the lifecycle map (as in the book) */
export function ProgramMap({ days, progress, current, isAdmin, model }: Props) {
  const totalLessons = days.reduce((n, d) => n + d.lessonCount, 0);
  const doneLessons = days.reduce((n, d) => n + d.lessonIds.filter((id) => progress.lessons[id]?.done).length, 0);
  const now = days.find((d) => d.day === current) ?? days[0];
  const pct = Math.round((doneLessons / Math.max(1, totalLessons)) * 100);
  const finished = progress.completedDays.includes(30);
  const isOpen = (day: number) => isAdmin || day === 0 || progress.completedDays.includes(day - 1);

  /* days grouped by act, in order */
  const groups: { id: string; n: string; name: string; days: DaySummary[] }[] = [];
  for (const d of days) {
    const g = groups[groups.length - 1];
    if (g && g.id === d.act.id) g.days.push(d);
    else groups.push({ id: d.act.id, n: d.act.n, name: d.act.name, days: [d] });
  }

  /* the journey map: every act with its days and where each day stands */
  const status = (day: number) => (progress.completedDays.includes(day) ? "done" : day === current && !finished ? "current" : isOpen(day) ? "open" : "locked") as "done" | "current" | "open" | "locked";
  const acts: JourneyAct[] = groups.map((g) => ({
    id: g.id, n: g.id === "kickoff" ? "0" : g.id === "capstone" ? "★" : g.n, name: g.id === "capstone" ? "Capstone" : g.name,
    track: g.days[0].act.track, gate: g.days[0].act.gate, tagline: g.days[0].act.tagline ?? "",
    days: g.days.map((d) => ({ day: d.day, title: d.title, status: status(d.day), done: d.lessonIds.filter((id) => progress.lessons[id]?.done).length, total: d.lessonCount })),
  }));
  /* now & next: the current stage in depth, and the one after it */
  const actOrder = groups.map((g) => g.id);
  const nowId = finished ? actOrder[actOrder.length - 1] : now.act.id;
  const nowStage = stageOf(nowId)!;
  const nextId = actOrder[actOrder.indexOf(nowId) + 1];
  const nextStage = !finished && nextId ? stageOf(nextId) : null;
  const laterId = actOrder[actOrder.indexOf(nowId) + 2];
  const laterStage = nextStage && laterId ? stageOf(laterId) : null;
  const dayStatus: Record<number, DayStatus> = Object.fromEntries(days.map((d) => [d.day, status(d.day)]));
  const lessonDone = Object.fromEntries(Object.entries(progress.lessons).map(([k, v]) => [k, v.done]));
  const trackList = tracks.map((t) => ({ id: t.id, name: t.name, q: t.q, color: t.id === "discovery" ? "#6d48d8" : t.id === "delivery" ? "#007373" : "#a87b00" }));

  return (
    <>
      {/* where you stand (the current stage in depth + the next) — or the whole month on the book's delivery system */}
      <MapSwitch
        startFull={finished}
        stats={
          <div role="group" aria-label="The month so far" className="flex w-fit items-center divide-x divide-black/[0.07] rounded-full border border-black/[0.07] bg-white py-1 pl-1 shadow-[0_6px_20px_-12px_rgba(13,17,23,0.35)]">
            {/* the month, as a small ring */}
            <div className="flex items-center gap-2 pr-3">
              <span className="relative grid size-8 place-items-center">
                <svg width="32" height="32" viewBox="0 0 32 32" className="-rotate-90" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="rgba(216,27,96,.14)" strokeWidth="4" /><circle cx="16" cy="16" r="13" fill="none" stroke="var(--electric-pink)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${Math.round(2 * Math.PI * 13 * pct) / 100} ${Math.round(2 * Math.PI * 13 * 100) / 100}`} /></svg>
              </span>
              <span className="grid leading-none"><span className="text-[14px] font-bold text-[var(--primary)]">{pct}%</span><span className="mt-0.5 text-[10.5px] text-black/45">Month</span></span>
            </div>
            {([["Days", progress.completedDays.length, days.length, "calendar_month", "#007373"], ["Lessons", doneLessons, totalLessons, "menu_book", "#6d48d8"]] as const).map(([k, v, of, icon, color]) => (
              <div key={k} className="flex items-center gap-2 px-3">
                <span className="grid size-8 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 12%, white)`, color }}><MaterialSymbol className="text-[17px]" name={icon} /></span>
                <span className="grid leading-none"><span className="text-[14px] font-bold text-[var(--primary)]">{v}<span className="text-[11px] font-semibold text-black/35">/{of}</span></span><span className="mt-0.5 text-[10.5px] text-black/45">{k}</span></span>
              </div>
            ))}
          </div>
        }
        focus={
          <StageFocus
            now={nowStage}
            next={nextStage}
            later={laterStage ?? null}
            color={(track, id) => (id === "kickoff" || id === "capstone" ? "#d81b60" : trackList.find((t) => t.id === track)?.color ?? "#007373")}
            trackName={(track) => trackList.find((t) => t.id === track)?.name ?? ""}
            dayStatus={dayStatus}
            lessonDone={lessonDone}
            current={current}
          />
        }
        full={<JourneyMap acts={acts} tracks={trackList} loops={model.lifecycleLoops} current={current} finished={finished} />}
      />
    </>
  );
}
