"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { PollSlot, PollView } from "@/lib/program/session-polls";
import { cn } from "@/lib/utils";

import { closesIn, fmtSlotTime } from "./session-poll";
import { useNow } from "./session-card";

/* Live-session time polls, as availability: when a trainee opens the dashboard and there's a poll they haven't
 * answered, it opens in a window — every offered slot, grouped into weekdays and the weekend, each marked Yes / If
 * needed / No. Once they answer it doesn't come back; "Later" puts it off for this visit (a small pill stays). Until the
 * mentor books the time, the session shows in the live sessions with its time as TBD. Window events:
 *   "node:poll"       { id }   — open that poll (e.g. from a TBD session or the calendar), even if answered
 *   "node:poll-voted" PollView — an answer was saved (TBD cards and the calendar update) */

const LATER = "node:poll-later"; // polls put off with "Later", for this browser session
const later = (): string[] => { try { return JSON.parse(sessionStorage.getItem(LATER) ?? "[]") as string[]; } catch { return []; } };
const putOff = (id: string) => { try { sessionStorage.setItem(LATER, JSON.stringify([...new Set([...later(), id])])); } catch { /* no storage */ } };

type Answer = "yes" | "maybe";
const isWeekend = (iso: string) => { const d = new Date(iso).getDay(); return d === 0 || d === 6; };
const dateKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });

/* slots, by date, split into weekdays and the weekend */
export function groupSlots(slots: PollSlot[]) {
  const by = new Map<string, PollSlot[]>();
  for (const s of slots) by.set(dateKey(s.startsAt), [...(by.get(dateKey(s.startsAt)) ?? []), s]);
  const days = [...by.values()].map((list) => ({ iso: list[0].startsAt, weekend: isWeekend(list[0].startsAt), slots: list }));
  return { weekdays: days.filter((d) => !d.weekend), weekend: days.filter((d) => d.weekend) };
}

export function PollDock() {
  const pathname = usePathname();
  const { pushToast } = useToast();
  const now = useNow();
  const [polls, setPolls] = useState<PollView[]>([]);
  const [forced, setForced] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false); // put off: only the pill shows
  const [draft, setDraft] = useState<{ id: string; a: Record<string, Answer> }>({ id: "", a: {} });
  const [busy, setBusy] = useState(false);
  const [thanks, setThanks] = useState(false);

  /* the open polls — fresh on every page (after sign-in, and whenever the dashboard is opened) */
  useEffect(() => {
    let live = true;
    fetch("/api/program/session-polls", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).then((p: PollView[]) => { if (live) setPolls(Array.isArray(p) ? p : []); }).catch(() => {});
    return () => { live = false; };
  }, [pathname]);
  useEffect(() => {
    const open = (e: Event) => { setForced((e as CustomEvent<{ id: string }>).detail?.id ?? null); setHidden(false); setThanks(false); };
    window.addEventListener("node:poll", open);
    return () => window.removeEventListener("node:poll", open);
  }, []);

  const waiting = polls.filter((p) => p.open && !p.voted);
  const shown = (forced ? polls.find((p) => p.id === forced && p.open) : null) ?? (hidden ? null : waiting.find((p) => !later().includes(p.id))) ?? null;
  const position = shown ? waiting.findIndex((p) => p.id === shown.id) : -1;
  const answers: Record<string, Answer> = draft.id === shown?.id ? draft.a : shown ? Object.fromEntries([...shown.mine.map((x) => [x, "yes"]), ...shown.mineMaybe.map((x) => [x, "maybe"])]) : {};
  const set = (a: Record<string, Answer>) => shown && setDraft({ id: shown.id, a });
  const mark = (id: string, v: Answer | null) => { const a = { ...answers }; if (v) a[id] = v; else delete a[id]; set(a); };
  const markAll = (list: PollSlot[], v: Answer | null) => { const a = { ...answers }; for (const s of list) { if (v) a[s.id] = v; else delete a[s.id]; } set(a); };
  const yes = Object.values(answers).filter((x) => x === "yes").length, maybe = Object.values(answers).filter((x) => x === "maybe").length;

  async function save(none = false) {
    if (!shown) return;
    setBusy(true);
    try {
      const body = none ? { slotIds: [], maybeIds: [], none: true } : { slotIds: Object.keys(answers).filter((k) => answers[k] === "yes"), maybeIds: Object.keys(answers).filter((k) => answers[k] === "maybe"), none: false };
      const r = await fetch(`/api/program/session-polls/${shown.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = (await r.json().catch(() => ({}))) as PollView & { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Couldn’t save your availability.");
      window.dispatchEvent(new CustomEvent("node:poll-voted", { detail: d }));
      setThanks(true);
      setTimeout(() => { setPolls((all) => all.map((p) => (p.id === d.id ? d : p))); setForced(null); setThanks(false); }, 1600);
    } catch (e) {
      pushToast({ variant: "error", title: "Not saved", description: e instanceof Error ? e.message : "Try again." });
    } finally { setBusy(false); }
  }
  const later_ = () => { if (shown) putOff(shown.id); setForced(null); setHidden(true); };

  /* put off: a pill at the bottom right brings it back */
  if (!shown) {
    const n = waiting.length;
    if (!n) return null;
    return (
      <button type="button" onClick={() => { setHidden(false); setForced(waiting[0].id); }} className="fixed bottom-4 right-4 z-[115] flex items-center gap-2 rounded-full bg-[var(--deep-indigo)] py-2 pl-2 pr-4 text-[12.5px] font-bold text-white shadow-[0_18px_40px_-14px_rgba(13,17,23,.7)] transition-transform hover:-translate-y-0.5 print:hidden">
        <span className="relative flex size-8 items-center justify-center rounded-full bg-[#4fd1c5] text-[var(--deep-indigo)]"><MaterialSymbol className="text-[18px]" name="event_available" /><span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[var(--electric-pink)] text-[9.5px] text-white">{n}</span></span>
        Share your availability
      </button>
    );
  }

  const { weekdays, weekend } = groupSlots(shown.slots);
  const top = Math.max(1, ...shown.slots.map((s) => s.votes + s.maybes / 2));
  const group = (title: string, icon: string, days: typeof weekdays) => days.length ? (
    <section className="grid gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black/50"><MaterialSymbol className="text-[17px]" name={icon} />{title}</span>
        <span className="flex gap-1">
          <button type="button" onClick={() => markAll(days.flatMap((d) => d.slots), "yes")} className="rounded-full bg-[#e7f6ec] px-2.5 py-1 text-[11.5px] font-bold text-[#14632f] hover:bg-[#d4efdd]">All yes</button>
          <button type="button" onClick={() => markAll(days.flatMap((d) => d.slots), null)} className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-[11.5px] font-bold text-black/55 hover:bg-[#e6e8ea]">Clear</button>
        </span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((d) => (
          <div key={d.iso} className={cn("grid content-start gap-1.5 rounded-2xl border p-2.5", d.weekend ? "border-[#6d48d8]/15 bg-[#f8f6ff]" : "border-black/[0.07] bg-white")}>
            <b className="px-1 text-[13px] text-[var(--primary)]">{now ? fmtDate(d.iso) : "…"}</b>
            {d.slots.map((s) => {
              const a = answers[s.id];
              const btn = (v: Answer | null, label: string, icon: string, on: string) => (
                <button type="button" onClick={() => mark(s.id, v)} aria-pressed={(a ?? null) === v} title={label} className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", (a ?? null) === v ? on : "text-black/35 hover:bg-black/[0.05] hover:text-black/70")}>
                  <MaterialSymbol className="text-[18px]" filled={(a ?? null) === v} name={icon} />
                </button>
              );
              return (
                <div key={s.id} className={cn("relative flex items-center gap-2 overflow-hidden rounded-xl border px-2.5 py-1.5", a === "yes" ? "border-[#2e9e5b] bg-[#f0faf3]" : a === "maybe" ? "border-[#e9b949] bg-[#fffaeb]" : "border-black/[0.07] bg-white")}>
                  <span className="pointer-events-none absolute inset-y-0 left-0 bg-[var(--bridge-teal)]/[0.07]" style={{ width: `${((s.votes + s.maybes / 2) / top) * 100}%` }} aria-hidden />
                  <span className="relative grid min-w-0 flex-1 leading-tight">
                    <b className="text-[13px] text-[var(--primary)]">{now ? fmtSlotTime(s.startsAt) : "…"}<span className="font-normal text-black/40"> – {now ? fmtSlotTime(s.startsAt, shown.durationMin) : ""}</span></b>
                    <span className="text-[10.5px] text-black/45">{s.votes} can{s.maybes ? ` · ${s.maybes} if needed` : ""}</span>
                  </span>
                  <span className="relative flex rounded-lg bg-black/[0.03] p-0.5">
                    {btn("yes", "Works for me", "check_circle", "bg-[#2e9e5b] text-white")}
                    {btn("maybe", "If needed", "help", "bg-[#e9b949] text-[#3d2c00]")}
                    {btn(null, "Doesn't work", "cancel", "bg-[#eef0f2] text-black/60")}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  ) : null;

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center bg-[#0d1117]/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-6 print:hidden" role="dialog" aria-modal="true" aria-label={`Your availability: ${shown.title}`}>
      <div className="grid max-h-[94vh] w-full max-w-4xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-t-[26px] bg-[#fbfbfc] shadow-[0_40px_120px_-30px_rgba(0,0,0,.6)] [animation:node-pop_.4s_cubic-bezier(.2,.8,.3,1.1)_both] sm:rounded-[26px]">
        {thanks ? (
          <div className="row-span-3 grid justify-items-center gap-3 px-6 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#e6f3f3] text-[var(--bridge-teal)] [animation:node-pop_.4s_ease-out]"><MaterialSymbol className="text-[32px]" filled name="check_circle" /></span>
            <b className="text-[18px] text-[var(--primary)]">Thanks — your availability is in</b>
            <span className="max-w-sm text-[13px] text-black/55">The mentor books the slot that suits most people. It’ll appear on your calendar and in your live sessions.</span>
          </div>
        ) : (
          <>
            <header className="relative grid gap-2 overflow-hidden bg-[var(--deep-indigo)] px-5 pb-4 pt-4 text-white sm:px-6" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
              <span className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-[var(--electric-pink)] opacity-25 blur-3xl" />
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4fd1c5]"><MaterialSymbol className="text-[16px]" name="event_available" />Live session · Day {shown.day}{waiting.length > 1 && position >= 0 ? ` · ${position + 1} of ${waiting.length}` : ""}</span>
                <span className="flex items-center gap-1">
                  {!shown.voted ? <button type="button" onClick={later_} className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-white/65 hover:bg-white/10 hover:text-white">Remind me later</button> : null}
                  <button type="button" onClick={later_} className="flex size-8 items-center justify-center rounded-full text-white/65 hover:bg-white/10 hover:text-white" aria-label="Close"><MaterialSymbol className="text-[20px]" name="close" /></button>
                </span>
              </span>
              <b className="relative text-[20px] leading-tight sm:text-[22px]">When can you join “{shown.title}”?</b>
              <span className="relative flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-white/65">
                <span className="flex items-center gap-1"><MaterialSymbol className="text-[16px]" name="schedule" />{shown.durationMin} min</span>
                {shown.host ? <span className="flex items-center gap-1"><MaterialSymbol className="text-[16px]" name="person" />with {shown.host}</span> : null}
                <span className="flex items-center gap-1"><MaterialSymbol className="text-[16px]" name="group" />{shown.voters} answered</span>
                {shown.closesAt && now ? <span className="flex items-center gap-1 text-[#ffd666]"><MaterialSymbol className="text-[16px]" name="timer" />{closesIn(shown.closesAt, now)}</span> : null}
              </span>
              {shown.note ? <p className="relative max-w-2xl whitespace-pre-line text-[12.5px] leading-5 text-white/55">{shown.note}</p> : null}
            </header>
            <div className="grid content-start gap-5 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-black/55">
                <span>Mark every slot you could make — times are in your time zone.</span>
                <span className="flex items-center gap-1"><MaterialSymbol className="text-[16px] text-[#2e9e5b]" filled name="check_circle" />Works</span>
                <span className="flex items-center gap-1"><MaterialSymbol className="text-[16px] text-[#c49000]" filled name="help" />If needed</span>
                <span className="flex items-center gap-1"><MaterialSymbol className="text-[16px] text-black/40" name="cancel" />Doesn’t work</span>
              </div>
              {group("Weekdays", "work", weekdays)}
              {group("Weekend", "weekend", weekend)}
            </div>
            <footer className="flex flex-wrap items-center gap-2 border-t border-black/[0.06] bg-white px-4 py-3 sm:px-6">
              <span className="flex-1 text-[12.5px] text-black/50">{yes || maybe ? <><b className="text-[#14632f]">{yes}</b> work{maybe ? <> · <b className="text-[#8a6500]">{maybe}</b> if needed</> : null}</> : shown.mineNone ? "You said none of these work." : "Nothing marked yet."}</span>
              <button type="button" disabled={busy} onClick={() => void save(true)} className="rounded-full border border-black/10 px-4 py-2 text-[12.5px] font-bold text-black/60 hover:border-black/30 disabled:opacity-50">None of these work</button>
              <button type="button" disabled={busy || (!yes && !maybe)} onClick={() => void save()} className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-40">{busy ? "Saving…" : shown.voted ? "Update my availability" : "Save my availability"}<MaterialSymbol className="text-[17px]" name="send" /></button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

/* A session whose time is still being voted on: in the live sessions, with its time as TBD */
export function PendingSessionCard({ poll: initial, showDay, dark }: { poll: PollView; showDay?: boolean; dark?: boolean }) {
  const [poll, setPoll] = useState(initial);
  useEffect(() => {
    const voted = (e: Event) => { const d = (e as CustomEvent<PollView>).detail; if (d?.id === poll.id) setPoll(d); };
    window.addEventListener("node:poll-voted", voted);
    return () => window.removeEventListener("node:poll-voted", voted);
  }, [poll.id]);
  const voted = poll.voted;
  const line = poll.open ? (voted ? "You shared your availability — the mentor books the slot that suits most." : "Share when you’re free.") : "Voting has closed — the mentor will confirm the time soon.";
  return (
    <div className={cn("grid gap-2 rounded-2xl border p-3.5", dark ? "border-white/10 bg-white/[0.05] text-white" : "border-black/[0.07] bg-white")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="grid min-w-0 gap-0.5">
          <span className={cn("flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]", dark ? "text-[#4fd1c5]" : "text-[var(--bridge-teal)]")}>
            <MaterialSymbol className="text-[15px]" name="videocam" />Live session
            {showDay ? <span className={dark ? "text-white/50" : "text-black/40"}>· Day {poll.day}</span> : null}
          </span>
          <b className={cn("text-[14.5px] leading-snug", dark ? "text-white" : "text-[var(--primary)]")}>{poll.title}</b>
          <span className={cn("flex flex-wrap items-center gap-1.5 text-[12.5px]", dark ? "text-white/60" : "text-[var(--on-surface-variant)]")}>
            <span className={cn("rounded-md px-1.5 py-px font-mono text-[11px] font-bold", dark ? "bg-white/10 text-white" : "bg-[#fff6d6] text-[#6b4f00]")} title="To be decided">TBD</span>
            {poll.durationMin} min{poll.host ? <> · with {poll.host}</> : null}
          </span>
        </span>
        {poll.open ? (
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("node:poll", { detail: { id: poll.id } }))} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold", voted ? (dark ? "bg-white/10 text-white" : "border border-black/10 text-[var(--primary)] hover:border-black/25") : "bg-[var(--primary)] text-white")}>
            <MaterialSymbol className="text-[15px]" name={voted ? "edit" : "event_available"} />{voted ? "Change availability" : "Share availability"}
          </button>
        ) : null}
      </div>
      <span className={cn("flex items-center gap-1.5 text-[12px]", dark ? "text-white/50" : "text-black/45")}><MaterialSymbol className="text-[15px]" name={voted ? "check_circle" : "schedule"} />{line}</span>
    </div>
  );
}
