"use client";

import { useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { PollView } from "@/lib/program/session-polls";
import { cn } from "@/lib/utils";

import { useNow } from "./session-card";

/* times in the viewer's own zone — only once on their screen (now > 0), so the server and browser agree */
export const fmtSlotDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
export const fmtSlotTime = (iso: string, plusMin = 0) => new Date(new Date(iso).getTime() + plusMin * 60_000).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
export function closesIn(iso: string | null, now: number) {
  if (!iso || !now) return "";
  const mins = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (mins <= 0) return "closed";
  return mins < 60 ? `closes in ${mins} min` : mins < 48 * 60 ? `closes in ${Math.round(mins / 60)} h` : `closes in ${Math.round(mins / 1440)} days`;
}

/* a trainee's time poll: tick every time that suits you, see how the others voted, change it while it's open */
export function SessionPollCard({ poll: initial, showDay }: { poll: PollView; showDay?: boolean }) {
  const { pushToast } = useToast();
  const now = useNow();
  const [poll, setPoll] = useState(initial);
  const [picks, setPicks] = useState<string[]>(initial.mine);
  const [busy, setBusy] = useState(false);
  const changed = picks.length !== poll.mine.length || picks.some((p) => !poll.mine.includes(p));
  const top = Math.max(1, ...poll.slots.map((s) => s.votes));
  const leading = poll.slots.filter((s) => s.votes === top && s.votes > 0).map((s) => s.id);
  const toggle = (id: string) => setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function vote() {
    setBusy(true);
    try {
      const r = await fetch(`/api/program/session-polls/${poll.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slotIds: picks }) });
      const d = (await r.json().catch(() => ({}))) as PollView & { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Couldn’t save your vote.");
      setPoll(d); setPicks(d.mine);
      pushToast({ variant: "success", title: d.mine.length ? "Vote saved" : "Vote cleared", description: d.mine.length ? `You’re free at ${d.mine.length} of ${d.slots.length} times — the mentor will pick the one that suits most.` : "You can vote again any time while it’s open." });
    } catch (e) {
      pushToast({ variant: "error", title: "Not saved", description: e instanceof Error ? e.message : "Try again." });
    } finally { setBusy(false); }
  }

  const status = poll.status === "scheduled" ? "Time chosen" : poll.open ? "Vote for a time" : "Voting closed";
  return (
    <div className={cn("grid gap-3 rounded-2xl border p-4", poll.open ? "border-[var(--bridge-teal)]/30 bg-[#f4fbfa]" : "border-black/[0.07] bg-white")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="grid min-w-0 gap-0.5">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--bridge-teal)]">
            <MaterialSymbol className="text-[15px]" name={poll.status === "scheduled" ? "event_available" : "how_to_vote"} />{status}
            {showDay ? <span className="text-black/40">· Day {poll.day}</span> : null}
          </span>
          <b className="text-[14.5px] leading-snug text-[var(--primary)]">{poll.title}</b>
          <span className="text-[12.5px] text-[var(--on-surface-variant)]">
            {poll.durationMin} min{poll.host ? <> · with {poll.host}</> : null}
            {poll.open && poll.closesAt ? <> · <b className="text-[var(--primary)]">{closesIn(poll.closesAt, now)}</b></> : null}
          </span>
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-black/50 ring-1 ring-black/[0.06]">{poll.voters} voted</span>
      </div>
      {poll.note ? <p className="whitespace-pre-line text-[12.5px] leading-5 text-[var(--on-surface-variant)]">{poll.note}</p> : null}
      {poll.open ? <span className="text-[12px] text-black/50">Tick every time you could make — the mentor picks the one that suits most people.</span> : null}

      <ul className="grid gap-1.5">
        {poll.slots.map((s) => {
          const mine = picks.includes(s.id), chosen = poll.chosenSlotId === s.id;
          const Row = poll.open ? "button" : "div";
          return (
            <li key={s.id}>
              <Row
                {...(poll.open ? { type: "button" as const, onClick: () => toggle(s.id), "aria-pressed": mine } : {})}
                className={cn("relative flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 text-left",
                  chosen ? "border-[var(--bridge-teal)] bg-[#e6f3f3]" : mine ? "border-[var(--primary)] bg-white" : "border-black/[0.08] bg-white",
                  poll.open && "hover:border-[var(--primary)]/50")}
              >
                <span className="absolute inset-y-0 left-0 bg-[var(--bridge-teal)]/[0.08] transition-[width]" style={{ width: `${(s.votes / top) * 100}%` }} aria-hidden />
                <span className={cn("relative flex size-5 shrink-0 items-center justify-center rounded-md border-2", mine ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-black/20")}>
                  {mine ? <MaterialSymbol className="text-[14px]" name="check" /> : null}
                </span>
                <span className="relative grid min-w-0 flex-1 leading-tight">
                  <b className="text-[13.5px] text-[var(--primary)]">{now ? fmtSlotDay(s.startsAt) : "…"}</b>
                  <span className="text-[12px] text-black/55">{now ? `${fmtSlotTime(s.startsAt)} – ${fmtSlotTime(s.startsAt, poll.durationMin)}` : ""}</span>
                </span>
                {chosen ? <span className="relative rounded-full bg-[var(--bridge-teal)] px-2 py-0.5 text-[11px] font-bold text-white">Chosen</span> : leading.includes(s.id) && poll.status !== "scheduled" ? <span className="relative rounded-full bg-[#fff6d6] px-2 py-0.5 text-[11px] font-bold text-[#6b4f00]">Leading</span> : null}
                <span className="relative w-16 text-right text-[12.5px] font-bold text-black/55">{s.votes} vote{s.votes === 1 ? "" : "s"}</span>
              </Row>
            </li>
          );
        })}
      </ul>

      {poll.open ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy || !changed} onClick={() => void vote()} className="rounded-full bg-[var(--primary)] px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-40">
            {busy ? "Saving…" : poll.mine.length ? (picks.length ? "Update my vote" : "Clear my vote") : "Save my vote"}
          </button>
          <span className="text-[12px] text-black/45">{changed ? `${picks.length} selected` : poll.mine.length ? `You picked ${poll.mine.length} time${poll.mine.length === 1 ? "" : "s"} — change it any time before it closes.` : "You haven’t voted yet."}</span>
        </div>
      ) : poll.status === "scheduled" ? (
        <span className="text-[12.5px] text-[var(--on-surface-variant)]">The session is booked at the chosen time — it’s in the live sessions, with the join link.</span>
      ) : (
        <span className="text-[12.5px] text-black/45">Voting has closed — the mentor will confirm the time soon.</span>
      )}
    </div>
  );
}
