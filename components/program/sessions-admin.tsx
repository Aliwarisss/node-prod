"use client";

import { useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { SessionView } from "@/lib/program/sessions";
import { cn } from "@/lib/utils";

import { SessionCard, useNow } from "./session-card";

type Day = { day: number; title: string; act: string };
type Draft = { id?: string; day: number; title: string; when: string; durationMin: number; link: string; host: string; notes: string; recordingUrl: string };
const blank = (day: number): Draft => ({ day, title: day === 0 ? "Kick-off call" : "Live session", when: "", durationMin: 60, link: "", host: "", notes: "", recordingUrl: "" });
/* an ISO time as the value of a datetime-local input, in the admin's own zone */
const toLocalInput = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };
const field = "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[var(--bridge-teal)]";

/* Admin: the live sessions, day by day — when, where to join, and the recording after */
export function SessionsAdmin({ days, initial }: { days: Day[]; initial: SessionView[] }) {
  const { pushToast } = useToast();
  const now = useNow();
  const [sessions, setSessions] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "none">("all");
  const byDay = (d: number) => sessions.filter((s) => s.day === d).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcoming = sessions.filter((s) => now && new Date(s.startsAt).getTime() + s.durationMin * 60_000 > now).length;
  const shownDays = days.filter((d) => filter === "all" || (filter === "none" ? !byDay(d.day).length : byDay(d.day).some((s) => now && new Date(s.startsAt).getTime() + s.durationMin * 60_000 > now)));

  async function save() {
    if (!draft) return;
    if (!draft.when) { pushToast({ variant: "error", title: "When is it?", description: "Pick a date and time." }); return; }
    setBusy(true);
    try {
      const body = { day: draft.day, title: draft.title, startsAt: new Date(draft.when).toISOString(), durationMin: Number(draft.durationMin), link: draft.link.trim(), host: draft.host, notes: draft.notes, recordingUrl: draft.recordingUrl.trim() };
      const r = await fetch(draft.id ? `/api/admin/sessions/${draft.id}` : "/api/admin/sessions", { method: draft.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = (await r.json()) as SessionView & { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Couldn’t save.");
      setSessions((all) => [...all.filter((s) => s.id !== d.id), d]);
      setDraft(null);
      pushToast({ variant: "success", title: draft.id ? "Session updated" : "Session scheduled", description: `Day ${d.day} · ${d.title}` });
    } catch (e) {
      pushToast({ variant: "error", title: "Not saved", description: e instanceof Error ? e.message : "Try again." });
    } finally { setBusy(false); }
  }
  async function remove(s: SessionView) {
    if (!window.confirm(`Remove “${s.title}” on Day ${s.day}?`)) return;
    const r = await fetch(`/api/admin/sessions/${s.id}`, { method: "DELETE" });
    if (r.ok) { setSessions((all) => all.filter((x) => x.id !== s.id)); pushToast({ variant: "success", title: "Session removed", description: s.title }); }
  }
  const edit = (s: SessionView) => setDraft({ id: s.id, day: s.day, title: s.title, when: toLocalInput(s.startsAt), durationMin: s.durationMin, link: s.link, host: s.host, notes: s.notes, recordingUrl: s.recordingUrl });

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/40">Live sessions</span>
          <h1 className="text-[26px] font-black leading-none tracking-[-0.03em] text-[var(--primary)]">Sessions, day by day</h1>
          <p className="text-[13.5px] text-[var(--on-surface-variant)]">Set the date, time and join link for each day’s live session. Trainees see it on the day, on their home page, and can add it to their calendar. Times show in each person’s own time zone.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-black/50">{sessions.length} scheduled{now ? ` · ${upcoming} to come` : ""}</span>
          <button type="button" onClick={() => setDraft(blank(days[0]?.day ?? 0))} className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[17px]" name="add" />New session</button>
        </div>
      </header>

      <div className="flex gap-1 self-start rounded-full bg-[#eceef0] p-1 text-[12.5px] font-bold">
        {([["all", "All days"], ["upcoming", "With upcoming"], ["none", "No session yet"]] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setFilter(id)} className={cn("rounded-full px-3.5 py-1.5", filter === id ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/55")}>{label}</button>)}
      </div>

      {/* the form */}
      {draft ? (
        <section className="grid gap-3 rounded-[22px] border-2 border-[var(--primary)]/15 bg-white p-5">
          <b className="text-[15px] text-[var(--primary)]">{draft.id ? "Edit the session" : "Schedule a session"}</b>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
            <label className="grid gap-1 text-[12.5px] font-bold text-[var(--primary)]">Day
              <select value={draft.day} onChange={(e) => setDraft({ ...draft, day: Number(e.target.value) })} className={field}>{days.map((d) => <option key={d.day} value={d.day}>Day {d.day} · {d.title}</option>)}</select>
            </label>
            <label className="grid gap-1 text-[12.5px] font-bold text-[var(--primary)]">Title
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={field} placeholder="e.g. Discovery kick-off" />
            </label>
            <label className="grid gap-1 text-[12.5px] font-bold text-[var(--primary)]">Date and time <span className="font-normal text-black/45">your time zone</span>
              <input type="datetime-local" value={draft.when} onChange={(e) => setDraft({ ...draft, when: e.target.value })} className={field} />
            </label>
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
              <label className="grid gap-1 text-[12.5px] font-bold text-[var(--primary)]">Minutes
                <input type="number" min={10} max={480} step={5} value={draft.durationMin} onChange={(e) => setDraft({ ...draft, durationMin: Number(e.target.value) })} className={field} />
              </label>
              <label className="grid gap-1 text-[12.5px] font-bold text-[var(--primary)]">Host
                <input value={draft.host} onChange={(e) => setDraft({ ...draft, host: e.target.value })} className={field} placeholder="Who runs it" />
              </label>
            </div>
            <label className="grid gap-1 text-[12.5px] font-bold text-[var(--primary)] md:col-span-2">Join link
              <input value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} className={field} placeholder="https://meet.google.com/… or https://zoom.us/j/…" />
            </label>
            <label className="grid gap-1 text-[12.5px] font-bold text-[var(--primary)] md:col-span-2">Agenda / what to prepare
              <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} className={field} placeholder="What you’ll cover, what to bring" />
            </label>
            <label className="grid gap-1 text-[12.5px] font-bold text-[var(--primary)] md:col-span-2">Recording link <span className="font-normal text-black/45">after the session</span>
              <input value={draft.recordingUrl} onChange={(e) => setDraft({ ...draft, recordingUrl: e.target.value })} className={field} placeholder="https://…" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => void save()} className="rounded-full bg-[var(--bridge-teal)] px-5 py-2 text-[12.5px] font-bold text-white disabled:opacity-60">{busy ? "Saving…" : draft.id ? "Save changes" : "Schedule"}</button>
            <button type="button" onClick={() => setDraft(null)} className="rounded-full border border-black/10 px-5 py-2 text-[12.5px] font-bold text-[var(--primary)]">Cancel</button>
          </div>
        </section>
      ) : null}

      {/* day by day */}
      <ol className="grid gap-2">
        {shownDays.map((d) => {
          const list = byDay(d.day);
          return (
            <li key={d.day} className="grid gap-2 rounded-2xl border border-black/[0.06] bg-white p-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex items-start justify-between gap-2 md:grid md:content-start md:justify-start">
                <span className="grid leading-tight"><span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-black/40">Day {d.day} · {d.act}</span><b className="text-[14px] text-[var(--primary)]">{d.title}</b></span>
                <button type="button" onClick={() => setDraft(blank(d.day))} className="flex items-center gap-1 justify-self-start rounded-full bg-[#f1f2f3] px-3 py-1 text-[12px] font-bold text-[var(--primary)] hover:bg-[#e8eaec] md:mt-2"><MaterialSymbol className="text-[15px]" name="add" />Add</button>
              </div>
              <div className="grid gap-2">
                {list.length ? list.map((s) => (
                  <div key={s.id} className="grid gap-1.5">
                    <SessionCard s={s} />
                    <span className="flex gap-3 pl-1 text-[12px]"><button type="button" onClick={() => edit(s)} className="font-bold text-[var(--bridge-teal)]">Edit</button><button type="button" onClick={() => void remove(s)} className="font-bold text-[#a3104a]">Remove</button></span>
                  </div>
                )) : <span className="self-center text-[13px] text-black/40">No session yet.</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
