"use client";

import { useSyncExternalStore } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { SessionView } from "@/lib/program/sessions";
import { cn } from "@/lib/utils";

/* the time, ticking every 30 s — on the server it's 0, so times render in the viewer's own zone once on their screen */
const tick = (cb: () => void) => { const t = setInterval(cb, 30_000); return () => clearInterval(t); };
export const useNow = () => useSyncExternalStore(tick, () => Math.floor(Date.now() / 30_000) * 30_000, () => 0);

const JOIN_EARLY = 15 * 60_000; // the join button opens 15 minutes before
export function sessionState(s: SessionView, now: number) {
  const start = new Date(s.startsAt).getTime(), end = start + s.durationMin * 60_000;
  if (!now) return { phase: "unknown" as const, joinable: false, in: "" };
  if (now >= end) return { phase: "ended" as const, joinable: false, in: "" };
  if (now >= start) return { phase: "live" as const, joinable: true, in: "" };
  const mins = Math.round((start - now) / 60_000);
  const label = mins < 60 ? `in ${mins} min` : mins < 24 * 60 ? `in ${Math.round(mins / 60)} h` : `in ${Math.round(mins / 1440)} day${Math.round(mins / 1440) === 1 ? "" : "s"}`;
  return { phase: "upcoming" as const, joinable: start - now <= JOIN_EARLY, in: label };
}
const fmtWhen = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const fmtTime = (iso: string, plusMin = 0) => new Date(new Date(iso).getTime() + plusMin * 60_000).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/* a calendar file for the session, so it lands in their own calendar */
export function downloadIcs(s: SessionView) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(s.startsAt), end = new Date(start.getTime() + s.durationMin * 60_000);
  const esc = (t: string) => t.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Node//Program sessions//EN", "BEGIN:VEVENT", `UID:${s.id}@node`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${esc(`Day ${s.day} · ${s.title}`)}`, `DESCRIPTION:${esc([s.notes, s.link].filter(Boolean).join("\n\n"))}`, ...(s.link ? [`URL:${s.link}`, `LOCATION:${esc(s.link)}`] : []), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `node-day-${s.day}-session.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function SessionCard({ s, showDay, dark }: { s: SessionView; showDay?: boolean; dark?: boolean }) {
  const now = useNow();
  const st = sessionState(s, now);
  return (
    <div className={cn("grid gap-2 rounded-2xl border p-3.5", dark ? "border-white/10 bg-white/[0.05] text-white" : st.phase === "live" ? "border-[var(--electric-pink)]/40 bg-[#fff6fa]" : "border-black/[0.07] bg-white")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="grid min-w-0 gap-0.5">
          <span className={cn("flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]", dark ? "text-[#4fd1c5]" : "text-[var(--bridge-teal)]")}>
            {st.phase === "live" ? <span className="flex items-center gap-1 text-[var(--electric-pink)]"><span className="size-2 animate-pulse rounded-full bg-[var(--electric-pink)]" />Live now</span> : <><MaterialSymbol className="text-[15px]" name="videocam" />Live session</>}
            {showDay ? <span className={dark ? "text-white/50" : "text-black/40"}>· Day {s.day}</span> : null}
          </span>
          <b className={cn("text-[14.5px] leading-snug", dark ? "text-white" : "text-[var(--primary)]")}>{s.title}</b>
          <span className={cn("text-[12.5px]", dark ? "text-white/60" : "text-[var(--on-surface-variant)]")}>
            {now ? <>{fmtWhen(s.startsAt)}–{fmtTime(s.startsAt, s.durationMin)}{st.in ? <b className={dark ? "text-white" : "text-[var(--primary)]"}> · {st.in}</b> : null}{st.phase === "ended" ? " · ended" : ""}</> : "…"}
            {s.host ? <> · with {s.host}</> : null}
          </span>
        </span>
        <span className="flex flex-wrap gap-1.5">
          {st.phase === "ended" ? (
            s.recordingUrl ? <a href={s.recordingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-[var(--primary)] px-3 py-1.5 text-[12px] font-bold text-white"><MaterialSymbol className="text-[15px]" name="play_circle" />Recording</a> : <span className={cn("text-[12px]", dark ? "text-white/45" : "text-black/40")}>Recording soon</span>
          ) : (
            <>
              {s.link ? (
                st.joinable
                  ? <a href={s.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-[var(--electric-pink)] px-3.5 py-1.5 text-[12px] font-black uppercase tracking-[0.04em] text-white shadow-md shadow-pink-500/25"><MaterialSymbol className="text-[15px]" name="login" />Join</a>
                  : <span className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold", dark ? "bg-white/10 text-white/60" : "bg-[#f1f2f3] text-black/45")} title="Opens 15 minutes before the start"><MaterialSymbol className="text-[15px]" name="schedule" />Join opens 15 min before</span>
              ) : <span className={cn("text-[12px]", dark ? "text-white/45" : "text-black/40")}>Link coming soon</span>}
              <button type="button" onClick={() => downloadIcs(s)} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold", dark ? "bg-white/10 text-white hover:bg-white/15" : "border border-black/10 text-[var(--primary)] hover:border-black/25")}><MaterialSymbol className="text-[15px]" name="event" />Add to calendar</button>
            </>
          )}
        </span>
      </div>
      {s.notes ? <p className={cn("whitespace-pre-line text-[12.5px] leading-5", dark ? "text-white/70" : "text-[var(--on-surface-variant)]")}>{s.notes}</p> : null}
    </div>
  );
}
