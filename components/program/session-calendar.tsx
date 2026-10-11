"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { PollView } from "@/lib/program/session-polls";
import type { SessionView } from "@/lib/program/sessions";
import { cn } from "@/lib/utils";

import { fmtSlotTime } from "./session-poll";
import { downloadIcs, sessionState, useNow } from "./session-card";

/* The schedule as a calendar: booked live sessions, and the slots still being voted on (with your own answer) —
   a month grid or an agenda, the next session up, and what still needs your availability. */

type Ev =
  | { kind: "session"; key: string; at: string; s: SessionView }
  | { kind: "slot"; key: string; at: string; p: PollView; slotId: string; mine: "yes" | "maybe" | "no" | null };

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const same = (a: Date, b: Date) => dayKey(a) === dayKey(b);
const fmtLong = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

export function SessionCalendar({ sessions, polls: initial, isAdmin }: { sessions: SessionView[]; polls: PollView[]; isAdmin: boolean }) {
  const now = useNow();
  const [polls, setPolls] = useState(initial);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [offset, setOffset] = useState(0); // months from this one
  const [open, setOpen] = useState<SessionView | null>(null);
  const [showSlots, setShowSlots] = useState(true);
  useEffect(() => {
    const voted = (e: Event) => { const d = (e as CustomEvent<PollView>).detail; if (d) setPolls((all) => all.map((p) => (p.id === d.id ? d : p))); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("node:poll-voted", voted);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("node:poll-voted", voted); window.removeEventListener("keydown", esc); };
  }, []);

  /* before the clock is known: the calendar's own frame, at its size, so nothing jumps when it fills in */
  if (!now) return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]" aria-busy="true">
      <div className="h-[750px] animate-pulse rounded-[24px] border border-black/[0.06] bg-black/[0.03]" />
      <div className="hidden h-[750px] animate-pulse rounded-[24px] bg-black/[0.03] xl:block" />
    </div>
  );
  const today = new Date(now);

  /* everything on the calendar */
  const events: Ev[] = [
    ...sessions.map((s) => ({ kind: "session" as const, key: `s-${s.id}`, at: s.startsAt, s })),
    ...(showSlots ? polls.filter((p) => p.open).flatMap((p) => p.slots.map((sl) => ({ kind: "slot" as const, key: `p-${p.id}-${sl.id}`, at: sl.startsAt, p, slotId: sl.id, mine: p.mine.includes(sl.id) ? "yes" as const : p.mineMaybe.includes(sl.id) ? "maybe" as const : p.voted ? "no" as const : null }))) : []),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const byDay = new Map<string, Ev[]>();
  for (const e of events) { const k = dayKey(new Date(e.at)); byDay.set(k, [...(byDay.get(k) ?? []), e]); }

  /* the month on show, Monday first */
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const start = new Date(month); start.setDate(1 - ((month.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const weeks = cells[35].getMonth() !== month.getMonth() ? 5 : 6;

  const upcoming = sessions.filter((s) => sessionState(s, now).phase !== "ended").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const next = upcoming[0];
  const waiting = polls.filter((p) => p.open && !p.voted);
  const tbd = polls.filter((p) => !p.open && p.status !== "scheduled");
  const ask = (id: string) => window.dispatchEvent(new CustomEvent("node:poll", { detail: { id } }));

  const chip = (e: Ev, compact = true) => e.kind === "session" ? (
    <button key={e.key} type="button" onClick={() => setOpen(e.s)} className={cn("flex w-full min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold transition-colors", sessionState(e.s, now).phase === "ended" ? "bg-black/[0.05] text-black/50" : "bg-[var(--bridge-teal)] text-white hover:brightness-110")} title={`${e.s.title} · Day ${e.s.day}`}>
      <MaterialSymbol className="flex-none text-[13px]" name={sessionState(e.s, now).phase === "live" ? "radio_button_checked" : "videocam"} />
      <span className="flex-none">{fmtSlotTime(e.s.startsAt)}</span>
      <span className="truncate">{compact ? e.s.title : `Day ${e.s.day} · ${e.s.title}`}</span>
    </button>
  ) : (
    <button key={e.key} type="button" onClick={() => (isAdmin ? undefined : ask(e.p.id))} className={cn("flex w-full min-w-0 items-center gap-1 rounded-md border border-dashed px-1.5 py-0.5 text-left text-[11px] font-semibold",
      e.mine === "yes" ? "border-[#2e9e5b] bg-[#f0faf3] text-[#14632f]" : e.mine === "maybe" ? "border-[#e9b949] bg-[#fffaeb] text-[#6b4f00]" : e.mine === "no" ? "border-black/15 text-black/35" : "border-[#6d48d8]/50 bg-[#f8f6ff] text-[#3b2386] hover:border-[#6d48d8]")}
      title={`${e.p.title} — slot being voted on`}>
      <MaterialSymbol className="flex-none text-[13px]" filled={!!e.mine && e.mine !== "no"} name={e.mine === "yes" ? "check_circle" : e.mine === "maybe" ? "help" : e.mine === "no" ? "cancel" : "how_to_vote"} />
      <span className="flex-none">{fmtSlotTime(e.at)}</span>
      <span className="truncate">{compact ? "Slot" : e.p.title}</span>
    </button>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="grid content-start gap-4 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white">
        {/* the bar */}
        <header className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] px-4 py-3">
          <span className="flex items-center gap-1">
            <button type="button" onClick={() => setOffset(offset - 1)} className="flex size-9 items-center justify-center rounded-full hover:bg-black/[0.05]" aria-label="Previous month"><MaterialSymbol className="text-[22px]" name="chevron_left" /></button>
            <button type="button" onClick={() => setOffset(offset + 1)} className="flex size-9 items-center justify-center rounded-full hover:bg-black/[0.05]" aria-label="Next month"><MaterialSymbol className="text-[22px]" name="chevron_right" /></button>
          </span>
          <b className="font-heading text-[22px] font-black tracking-[-0.02em] text-[var(--primary)]">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</b>
          {offset ? <button type="button" onClick={() => setOffset(0)} className="rounded-full border border-black/10 px-3 py-1 text-[12px] font-bold text-[var(--primary)] hover:border-black/30">Today</button> : null}
          <span className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setShowSlots((v) => !v)} aria-pressed={showSlots} className={cn("flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-bold", showSlots ? "border-[#6d48d8]/40 bg-[#f8f6ff] text-[#3b2386]" : "border-black/10 text-black/50")}><MaterialSymbol className="text-[16px]" name="how_to_vote" />Open slots</button>
            <span className="flex rounded-xl bg-[#f1f2f3] p-0.5">{(["month", "agenda"] as const).map((v) => <button key={v} type="button" onClick={() => setView(v)} className={cn("rounded-lg px-3 py-1.5 text-[12px] font-bold capitalize", view === v ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/50")}>{v}</button>)}</span>
          </span>
        </header>

        {view === "month" ? (
          <div className="overflow-x-auto px-3 pb-3">
            <div className="grid min-w-[680px] grid-cols-7 overflow-hidden rounded-2xl border border-black/[0.06]">
              {WEEK.map((w, i) => <span key={w} className={cn("border-b border-black/[0.06] px-2 py-2 text-center font-mono text-[10.5px] font-bold uppercase tracking-[0.12em]", i >= 5 ? "bg-[#f8f6ff] text-[#6d48d8]" : "bg-[#fbfbfc] text-black/45")}>{w}</span>)}
              {cells.slice(0, weeks * 7).map((d, i) => {
                const list = byDay.get(dayKey(d)) ?? [];
                const inMonth = d.getMonth() === month.getMonth(), isToday = same(d, today), weekend = i % 7 >= 5;
                return (
                  <div key={i} className={cn("grid min-h-[112px] content-start gap-1 border-b border-r border-black/[0.05] p-1.5", weekend && "bg-[#fcfbff]", !inMonth && "bg-[#fafafa]", i % 7 === 6 && "border-r-0")}>
                    <span className={cn("flex size-6 items-center justify-center rounded-full text-[12px] font-bold", isToday ? "bg-[var(--electric-pink)] text-white" : inMonth ? "text-[var(--primary)]" : "text-black/25")}>{d.getDate()}</span>
                    {list.slice(0, 3).map((e) => chip(e))}
                    {list.length > 3 ? <button type="button" onClick={() => setView("agenda")} className="px-1.5 text-left text-[10.5px] font-bold text-black/45 hover:text-[var(--primary)]">+{list.length - 3} more</button> : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 px-4 pb-4">
            {[...byDay.entries()].filter(([, l]) => l.some((e) => new Date(e.at).getTime() >= now - 24 * 3600_000)).map(([k, list]) => (
              <div key={k} className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)]">
                <span className={cn("text-[13px] font-bold", same(new Date(list[0].at), today) ? "text-[var(--electric-pink)]" : "text-[var(--primary)]")}>{fmtLong(list[0].at)}</span>
                <div className="grid gap-1.5">{list.map((e) => <div key={e.key} className="max-w-xl">{chip(e, false)}</div>)}</div>
              </div>
            ))}
            {!events.length ? <p className="py-10 text-center text-[13px] text-black/45">Nothing on the schedule yet.</p> : null}
          </div>
        )}
        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-black/[0.06] px-4 py-2.5 text-[11.5px] text-black/50">
          <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-[var(--bridge-teal)]" />Booked session</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded border border-dashed border-[#6d48d8] bg-[#f8f6ff]" />Slot being voted on</span>
          <span className="flex items-center gap-1"><MaterialSymbol className="text-[15px] text-[#2e9e5b]" filled name="check_circle" />You’re free</span>
          <span className="flex items-center gap-1"><MaterialSymbol className="text-[15px] text-[#c49000]" filled name="help" />If needed</span>
          <span className="flex items-center gap-1"><MaterialSymbol className="text-[15px] text-black/35" name="cancel" />Doesn’t work</span>
          <span className="ml-auto">Times are in your time zone.</span>
        </footer>
      </section>

      {/* the side: next up, what needs you, upcoming */}
      <aside className="grid content-start gap-4">
        <section className="relative grid gap-2 overflow-hidden rounded-[22px] bg-[var(--deep-indigo)] p-4 text-white" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#4fd1c5]">Next session</span>
          {next ? (
            <>
              <b className="text-[16px] leading-snug">{next.title}</b>
              <span className="text-[12.5px] text-white/60">Day {next.day} · {fmtLong(next.startsAt)} · {fmtSlotTime(next.startsAt)}–{fmtSlotTime(next.startsAt, next.durationMin)}</span>
              <span className="flex flex-wrap items-center gap-2 pt-1">
                {sessionState(next, now).phase === "live" ? <span className="flex items-center gap-1 rounded-full bg-[var(--electric-pink)] px-2.5 py-0.5 text-[11px] font-black uppercase">Live now</span> : <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] font-bold">{sessionState(next, now).in}</span>}
                {next.link && sessionState(next, now).joinable ? <a href={next.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-[#4fd1c5] px-3 py-1 text-[12px] font-bold text-[#0d1117]"><MaterialSymbol className="text-[16px]" name="videocam" />Join</a> : null}
                <button type="button" onClick={() => downloadIcs(next)} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold hover:bg-white/15"><MaterialSymbol className="text-[16px]" name="event" />Add to calendar</button>
              </span>
            </>
          ) : <span className="text-[13px] text-white/60">No session booked yet{waiting.length ? " — share your availability so the mentor can pick a time." : "."}</span>}
        </section>

        {!isAdmin && waiting.length ? (
          <section className="grid gap-2 rounded-[22px] border border-[#6d48d8]/25 bg-[#f8f6ff] p-4">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6d48d8]"><MaterialSymbol className="text-[15px]" name="event_available" />Needs your availability</span>
            {waiting.map((p) => (
              <button key={p.id} type="button" onClick={() => ask(p.id)} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-left ring-1 ring-black/[0.06] hover:ring-[#6d48d8]/40">
                <span className="grid min-w-0 flex-1 leading-tight"><b className="truncate text-[13px] text-[var(--primary)]">{p.title}</b><span className="text-[11.5px] text-black/50">Day {p.day} · {p.slots.length} slots · {p.voters} answered</span></span>
                <MaterialSymbol className="text-[18px] text-[#6d48d8]" name="arrow_forward" />
              </button>
            ))}
          </section>
        ) : null}

        <section className="grid gap-2 rounded-[22px] border border-black/[0.06] bg-white p-4">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/45">Coming up</span>
          {upcoming.slice(0, 6).map((s) => (
            <button key={s.id} type="button" onClick={() => setOpen(s)} className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-[#f6f7f8]">
              <span className="grid w-11 flex-none justify-items-center rounded-lg bg-[#e6f3f3] py-1 leading-none text-[#005a5a]"><span className="text-[10px] font-bold uppercase">{new Date(s.startsAt).toLocaleDateString(undefined, { month: "short" })}</span><b className="text-[17px]">{new Date(s.startsAt).getDate()}</b></span>
              <span className="grid min-w-0 flex-1 leading-tight"><b className="truncate text-[13px] text-[var(--primary)]">{s.title}</b><span className="text-[11.5px] text-black/50">Day {s.day} · {fmtSlotTime(s.startsAt)}{s.host ? ` · ${s.host}` : ""}</span></span>
            </button>
          ))}
          {tbd.map((p) => <span key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5"><span className="grid w-11 flex-none place-items-center rounded-lg bg-[#fff6d6] py-2 font-mono text-[11px] font-bold text-[#6b4f00]">TBD</span><span className="grid min-w-0 flex-1 leading-tight"><b className="truncate text-[13px] text-[var(--primary)]">{p.title}</b><span className="text-[11.5px] text-black/50">Day {p.day} · time being confirmed</span></span></span>)}
          {!upcoming.length && !tbd.length ? <span className="px-2 text-[12.5px] text-black/45">Nothing booked yet.</span> : null}
          {isAdmin ? <Link href="/dashboard/sessions" className="px-2 pt-1 text-[12.5px] font-bold text-[var(--bridge-teal)]">Manage sessions and polls →</Link> : null}
        </section>
      </aside>

      {/* a session, opened */}
      {open ? (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-[#0d1117]/45 sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div role="dialog" aria-label={open.title} className="grid w-full max-w-md gap-3 rounded-t-[24px] bg-white p-5 shadow-2xl sm:rounded-[24px]" style={{ animation: "cert-fade .25s ease both" }}>
            <div className="flex items-start justify-between gap-3">
              <span className="grid gap-0.5"><span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--bridge-teal)]">Live session · Day {open.day}</span><b className="text-[19px] leading-tight text-[var(--primary)]">{open.title}</b></span>
              <button type="button" onClick={() => setOpen(null)} className="flex size-8 items-center justify-center rounded-full hover:bg-black/[0.05]" aria-label="Close"><MaterialSymbol className="text-[20px]" name="close" /></button>
            </div>
            <span className="grid gap-1.5 text-[13px] text-black/65">
              <span className="flex items-center gap-2"><MaterialSymbol className="text-[18px] text-black/40" name="calendar_month" />{fmtLong(open.startsAt)}</span>
              <span className="flex items-center gap-2"><MaterialSymbol className="text-[18px] text-black/40" name="schedule" />{fmtSlotTime(open.startsAt)} – {fmtSlotTime(open.startsAt, open.durationMin)} · {open.durationMin} min{sessionState(open, now).in ? ` · ${sessionState(open, now).in}` : ""}</span>
              {open.host ? <span className="flex items-center gap-2"><MaterialSymbol className="text-[18px] text-black/40" name="person" />with {open.host}</span> : null}
            </span>
            {open.notes ? <p className="whitespace-pre-line rounded-xl bg-[#f6f7f8] p-3 text-[13px] leading-5 text-black/65">{open.notes}</p> : null}
            <div className="flex flex-wrap gap-2 pt-1">
              {open.link && sessionState(open, now).joinable ? <a href={open.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-[var(--bridge-teal)] px-4 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[17px]" name="videocam" />Join</a> : null}
              {open.recordingUrl && sessionState(open, now).phase === "ended" ? <a href={open.recordingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[17px]" name="play_circle" />Recording</a> : null}
              {sessionState(open, now).phase !== "ended" ? <button type="button" onClick={() => downloadIcs(open)} className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-[12.5px] font-bold text-[var(--primary)] hover:border-black/30"><MaterialSymbol className="text-[17px]" name="event" />Add to my calendar</button> : null}
              <Link href={`/dashboard/roadmap/day/${open.day}`} className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-[12.5px] font-bold text-[var(--primary)] hover:border-black/30">Open Day {open.day}<MaterialSymbol className="text-[16px]" name="arrow_forward" /></Link>
            </div>
            {open.link && !sessionState(open, now).joinable && sessionState(open, now).phase === "upcoming" ? <span className="text-[11.5px] text-black/45">The join button appears 15 minutes before it starts.</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
