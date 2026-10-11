"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { PollView } from "@/lib/program/session-polls";
import { cn } from "@/lib/utils";

import { closesIn, fmtSlotDay, fmtSlotTime } from "./session-poll";
import { useNow } from "./session-card";

type Day = { day: number; title: string; act: string };
type Draft = { id?: string; day: number; title: string; host: string; durationMin: number; note: string; slots: string[]; closesAt: string; topic?: string };
/* topics people asked for a session on (from Explore) — the admin can open a poll for one in a click */
export type SessionRequestGroup = { topic: string; title: string; count: number; names: string[]; hasPoll: boolean };
const blank = (day: number): Draft => ({ day, title: day === 0 ? "Kick-off call" : "Live session", host: "", durationMin: 60, note: "", slots: ["", "", ""], closesAt: "" });
const toLocalInput = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/* slots from a date range × chosen weekdays × times, as datetime-local strings */
function buildSlots(from: string, to: string, days: number[], times: string[]) {
  if (!from || !to || !days.length || !times.length) return [];
  const out: string[] = [];
  const end = new Date(`${to}T00:00`);
  for (let d = new Date(`${from}T00:00`); d <= end && out.length < 60; d.setDate(d.getDate() + 1)) {
    if (!days.includes(d.getDay())) continue;
    for (const tm of [...times].sort()) out.push(`${localDate(d)}T${tm}`);
  }
  return out;
}
const field = "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[var(--bridge-teal)]";
const label = "grid gap-1 text-[12.5px] font-bold text-[var(--primary)]";

/* Admin: time polls — offer a few times, see who can make which, and book the winner as the day's session */
export function PollsAdmin({ days, initial, requests = [] }: { days: Day[]; initial: PollView[]; requests?: SessionRequestGroup[] }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const now = useNow();
  const [polls, setPolls] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pick, setPick] = useState<{ pollId: string; slotId: string; link: string } | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [gen, setGen] = useState<{ from: string; to: string; days: number[]; times: string[]; time: string }>({ from: "", to: "", days: [1, 2, 3, 4, 5], times: ["19:00"], time: "11:00" });
  const generated = buildSlots(gen.from, gen.to, gen.days, gen.times);
  const addGenerated = () => {
    if (!draft) return;
    const all = [...new Set([...draft.slots.filter(Boolean), ...generated])].sort().slice(0, 42);
    setDraft({ ...draft, slots: all.length >= 2 ? all : [...all, ...Array(2 - all.length).fill("")] });
  };
  const dayTitle = (n: number) => days.find((d) => d.day === n)?.title ?? "";
  const put = (p: PollView) => setPolls((all) => [p, ...all.filter((x) => x.id !== p.id)]);
  const active = polls.filter((p) => p.status !== "scheduled"), done = polls.filter((p) => p.status === "scheduled");

  async function call(key: string, url: string, method: string, body?: unknown) {
    setBusy(key);
    try {
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((d as { error?: string }).error ?? "Couldn’t save.");
      return d;
    } catch (e) {
      pushToast({ variant: "error", title: "Not saved", description: e instanceof Error ? e.message : "Try again." });
      return null;
    } finally { setBusy(null); }
  }

  async function save() {
    if (!draft) return;
    const slots = draft.slots.filter(Boolean);
    if (slots.length < 2) { pushToast({ variant: "error", title: "Add more times", description: "Offer at least two times to vote on." }); return; }
    const body = { day: draft.day, title: draft.title, host: draft.host, durationMin: Number(draft.durationMin), note: draft.note, slots: slots.map((s) => new Date(s).toISOString()), closesAt: draft.closesAt ? new Date(draft.closesAt).toISOString() : null, ...(draft.id ? {} : { topic: draft.topic ?? "" }) };
    const d = await call("draft", draft.id ? `/api/admin/session-polls/${draft.id}` : "/api/admin/session-polls", draft.id ? "PATCH" : "POST", body);
    if (!d) return;
    put(d as PollView);
    pushToast({ variant: "success", title: draft.id ? "Poll updated" : "Poll is open", description: draft.id ? "Votes for times you kept are kept." : `Trainees can vote on Day ${draft.day}, and on their home page.` });
    setDraft(null);
  }
  async function setOpen(p: PollView, open: boolean) {
    const d = await call(p.id, `/api/admin/session-polls/${p.id}`, "PATCH", { action: open ? "reopen" : "close" });
    if (d) put(d as PollView);
  }
  async function remove(p: PollView) {
    if (!window.confirm(`Remove the poll “${p.title}” and its ${p.voters} vote${p.voters === 1 ? "" : "s"}?`)) return;
    const d = await call(p.id, `/api/admin/session-polls/${p.id}`, "DELETE");
    if (d) setPolls((all) => all.filter((x) => x.id !== p.id));
  }
  async function book() {
    if (!pick) return;
    const d = await call(pick.pollId, `/api/admin/session-polls/${pick.pollId}/schedule`, "POST", { slotId: pick.slotId, link: pick.link.trim() });
    if (!d) return;
    put((d as { poll: PollView }).poll);
    setPick(null);
    pushToast({ variant: "success", title: "Session booked", description: "The poll is closed and the session is on the schedule below." });
    router.refresh();
  }
  const edit = (p: PollView) => setDraft({ id: p.id, day: p.day, title: p.title, host: p.host, durationMin: p.durationMin, note: p.note, slots: p.slots.map((s) => toLocalInput(s.startsAt)), closesAt: p.closesAt ? toLocalInput(p.closesAt) : "" });

  const card = (p: PollView) => {
    const score = (s: PollView["slots"][number]) => s.votes + s.maybes / 2;
    const top = Math.max(1, ...p.slots.map(score));
    return (
      <article key={p.id} className="grid gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="grid gap-0.5">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-black/40">Day {p.day} · {dayTitle(p.day)}</span>
            <b className="text-[15px] text-[var(--primary)]">{p.title}</b>
            <span className="text-[12.5px] text-black/50">{p.durationMin} min{p.host ? ` · mentor ${p.host}` : ""} · <b className="text-[var(--primary)]">{p.voters}</b> answered{p.none ? ` (${p.none} can’t make any)` : ""}{p.open && p.closesAt && now ? ` · ${closesIn(p.closesAt, now)}` : ""}</span>
          </span>
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", p.status === "scheduled" ? "bg-[#e6f3f3] text-[#005a5a]" : p.open ? "bg-[#e7f6ec] text-[#14632f]" : "bg-[#eef0f2] text-black/55")}>
            {p.status === "scheduled" ? "Booked" : p.open ? "Voting open" : "Voting closed"}
          </span>
        </div>
        <ul className="grid max-h-[460px] gap-1.5 overflow-y-auto pr-1">
          {p.slots.map((s) => {
            const chosen = p.chosenSlotId === s.id, best = score(s) === top && score(s) > 0 && p.status !== "scheduled";
            const picking = pick?.pollId === p.id && pick.slotId === s.id;
            return (
              <li key={s.id} className={cn("grid gap-2 rounded-xl border px-3 py-2.5", chosen ? "border-[var(--bridge-teal)] bg-[#f0f9f8]" : best ? "border-[#e9c46a] bg-[#fffbef]" : "border-black/[0.07]")}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid w-40 leading-tight"><b className="text-[13.5px] text-[var(--primary)]">{now ? fmtSlotDay(s.startsAt) : "…"}</b><span className="text-[12px] text-black/55">{now ? `${fmtSlotTime(s.startsAt)} – ${fmtSlotTime(s.startsAt, p.durationMin)}` : ""}</span></span>
                  <span className="relative h-2 min-w-[80px] flex-1 overflow-hidden rounded-full bg-black/[0.06]"><span className="absolute inset-y-0 left-0 rounded-full bg-[var(--bridge-teal)]" style={{ width: `${(s.votes / top) * 100}%` }} /><span className="absolute inset-y-0 rounded-full bg-[#e9b949]" style={{ left: `${(s.votes / top) * 100}%`, width: `${(s.maybes / 2 / top) * 100}%` }} /></span>
                  <b className="w-24 text-right text-[12.5px] text-[var(--primary)]">{s.votes} yes{s.maybes ? <span className="font-normal text-[#8a6500]"> · {s.maybes} maybe</span> : null}</b>
                  {chosen ? <span className="rounded-full bg-[var(--bridge-teal)] px-2.5 py-1 text-[11px] font-bold text-white">Booked</span>
                    : p.status !== "scheduled" ? <button type="button" onClick={() => setPick(picking ? null : { pollId: p.id, slotId: s.id, link: "" })} className={cn("rounded-full px-3 py-1 text-[12px] font-bold", best ? "bg-[var(--primary)] text-white" : "bg-[#f1f2f3] text-[var(--primary)] hover:bg-[#e8eaec]")}>Pick this time</button> : null}
                </div>
                {s.voters?.length || s.maybeVoters?.length ? <span className="text-[12px] leading-5 text-black/50">{s.voters?.length ? <><b className="text-[#14632f]">Yes:</b> {s.voters.join(", ")}</> : null}{s.voters?.length && s.maybeVoters?.length ? " · " : null}{s.maybeVoters?.length ? <><b className="text-[#8a6500]">If needed:</b> {s.maybeVoters.join(", ")}</> : null}</span> : null}
                {picking ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2 ring-1 ring-black/[0.06]">
                    <input value={pick.link} onChange={(e) => setPick({ ...pick, link: e.target.value })} placeholder="Join link (optional now) — https://meet.google.com/…" className={cn(field, "min-w-[240px] flex-1")} />
                    <button type="button" disabled={busy === p.id} onClick={() => void book()} className="rounded-full bg-[var(--bridge-teal)] px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60">{busy === p.id ? "Booking…" : "Book the session"}</button>
                    <button type="button" onClick={() => setPick(null)} className="text-[12.5px] font-bold text-black/50">Cancel</button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        {p.note ? <p className="whitespace-pre-line text-[12.5px] text-[var(--on-surface-variant)]">{p.note}</p> : null}
        <span className="flex flex-wrap gap-3 text-[12px]">
          {p.status !== "scheduled" ? <>
            <button type="button" onClick={() => edit(p)} className="font-bold text-[var(--bridge-teal)]">Edit</button>
            <button type="button" disabled={busy === p.id} onClick={() => void setOpen(p, !p.open)} className="font-bold text-[var(--primary)]">{p.open ? "Close voting" : "Reopen voting"}</button>
          </> : null}
          <button type="button" disabled={busy === p.id} onClick={() => void remove(p)} className="font-bold text-[#a3104a]">Remove</button>
        </span>
      </article>
    );
  };

  return (
    <section className="grid gap-3">
      {requests.length ? (
        <div className="grid gap-2 rounded-2xl border border-[#f2b705]/40 bg-[#fffbeb] p-4">
          <span className="flex items-center gap-2"><MaterialSymbol className="text-[19px] text-[#8a6500]" name="record_voice_over" /><b className="text-[14px] text-[var(--primary)]">Session requests from Explore</b><span className="text-[12.5px] text-black/50">People asked for a mentor session on these roles.</span></span>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {requests.map((r) => (
              <div key={r.topic} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-black/[0.05]">
                <span className="grid min-w-0 flex-1"><b className="truncate text-[13.5px] text-[var(--primary)]">{r.title}</b><span className="truncate text-[12px] text-black/50">{r.count} asked · {r.names.slice(0, 3).join(", ")}{r.count > 3 ? "…" : ""}</span></span>
                {r.hasPoll ? <span className="rounded-full bg-[#e6f3f3] px-2.5 py-1 text-[11px] font-bold text-[#005a5a]">Poll open</span> : (
                  <button type="button" onClick={() => setDraft({ ...blank(0), title: `Career talk: ${r.title}`, note: `Asked for from Explore by ${r.count} ${r.count === 1 ? "person" : "people"}. What the role is really like, how to get in, and your questions.`, topic: r.topic })} className="shrink-0 rounded-full bg-[var(--primary)] px-3 py-1.5 text-[12px] font-bold text-white">Open a time poll</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-0.5">
          <b className="text-[17px] text-[var(--primary)]">Time polls</b>
          <span className="text-[13px] text-[var(--on-surface-variant)]">Open slots across weekdays and the weekend; trainees mark each one Works / If needed / Doesn’t work — the window opens for them when they sign in. Pick the best slot and it’s booked on everyone’s calendar.</span>
        </div>
        <button type="button" onClick={() => setDraft(blank(days[0]?.day ?? 0))} className="flex items-center gap-1.5 rounded-full bg-[var(--bridge-teal)] px-4 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[17px]" name="how_to_vote" />New time poll</button>
      </header>

      {draft ? (
        <section className="grid gap-3 rounded-[22px] border-2 border-[var(--bridge-teal)]/25 bg-white p-5">
          <b className="text-[15px] text-[var(--primary)]">{draft.id ? "Edit the poll" : "New time poll"}</b>
          <div className="grid gap-3 md:grid-cols-2">
            <label className={label}>Day
              <select value={draft.day} onChange={(e) => setDraft({ ...draft, day: Number(e.target.value) })} className={field}>{days.map((d) => <option key={d.day} value={d.day}>Day {d.day} · {d.title}</option>)}</select>
            </label>
            <label className={label}>Session title
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={field} />
            </label>
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
              <label className={label}>Minutes
                <input type="number" min={10} max={480} step={5} value={draft.durationMin} onChange={(e) => setDraft({ ...draft, durationMin: Number(e.target.value) })} className={field} />
              </label>
              <label className={label}>Mentor
                <input value={draft.host} onChange={(e) => setDraft({ ...draft, host: e.target.value })} className={field} placeholder="Who runs it" />
              </label>
            </div>
            <label className={label}>Voting closes <span className="font-normal text-black/45">optional — or close it by hand</span>
              <input type="datetime-local" value={draft.closesAt} onChange={(e) => setDraft({ ...draft, closesAt: e.target.value })} className={field} />
            </label>
            <div className="grid gap-3 rounded-2xl border border-[#6d48d8]/20 bg-[#f8f6ff] p-4 md:col-span-2">
              <span className="flex items-center gap-2"><MaterialSymbol className="text-[19px] text-[#6d48d8]" name="event_repeat" /><b className="text-[13.5px] text-[var(--primary)]">Open slots in bulk</b><span className="text-[12px] text-black/50">pick dates, days and times — every combination becomes a slot</span></span>
              <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="grid grid-cols-2 gap-2">
                  <label className={label}>From<input type="date" value={gen.from} onChange={(e) => setGen({ ...gen, from: e.target.value, to: gen.to && gen.to >= e.target.value ? gen.to : e.target.value })} className={field} /></label>
                  <label className={label}>To<input type="date" value={gen.to} min={gen.from} onChange={(e) => setGen({ ...gen, to: e.target.value })} className={field} /></label>
                </div>
                <div className="grid content-start gap-1.5">
                  <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--primary)]">Days
                    {([["Weekdays", [1, 2, 3, 4, 5]], ["Weekend", [0, 6]], ["Every day", [0, 1, 2, 3, 4, 5, 6]]] as const).map(([l, d]) => <button key={l} type="button" onClick={() => setGen({ ...gen, days: [...d] })} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#6d48d8] ring-1 ring-[#6d48d8]/25 hover:ring-[#6d48d8]">{l}</button>)}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => { const on = gen.days.includes(d); return <button key={d} type="button" aria-pressed={on} onClick={() => setGen({ ...gen, days: on ? gen.days.filter((x) => x !== d) : [...gen.days, d] })} className={cn("w-11 rounded-lg py-1.5 text-[12px] font-bold", on ? (d === 0 || d === 6 ? "bg-[#6d48d8] text-white" : "bg-[var(--deep-indigo)] text-white") : "bg-white text-black/45 ring-1 ring-black/10")}>{WD[d]}</button>; })}
                  </span>
                </div>
                <div className="grid content-start gap-1.5">
                  <span className="text-[12.5px] font-bold text-[var(--primary)]">Times</span>
                  <span className="flex flex-wrap items-center gap-1">
                    {gen.times.map((tm) => <span key={tm} className="flex items-center gap-1 rounded-full bg-white py-1 pl-2.5 pr-1 text-[12px] font-bold text-[var(--primary)] ring-1 ring-black/10">{tm}<button type="button" onClick={() => setGen({ ...gen, times: gen.times.filter((x) => x !== tm) })} className="text-black/35 hover:text-[#a3104a]" aria-label={`Remove ${tm}`}><MaterialSymbol className="text-[15px]" name="close" /></button></span>)}
                    <input type="time" value={gen.time} onChange={(e) => setGen({ ...gen, time: e.target.value })} className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[12px]" aria-label="Time to add" />
                    <button type="button" onClick={() => gen.time && setGen({ ...gen, times: [...new Set([...gen.times, gen.time])] })} className="rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-[#6d48d8] ring-1 ring-[#6d48d8]/25">+ Add</button>
                  </span>
                </div>
              </div>
              <span className="flex flex-wrap items-center gap-3">
                <button type="button" disabled={!generated.length} onClick={addGenerated} className="flex items-center gap-1.5 rounded-full bg-[#6d48d8] px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-40"><MaterialSymbol className="text-[17px]" name="add" />Add {generated.length} slot{generated.length === 1 ? "" : "s"}</button>
                <span className="text-[12px] text-black/50">{generated.length ? `${generated.filter((g) => [0, 6].includes(new Date(g).getDay())).length} on the weekend · ${generated.filter((g) => ![0, 6].includes(new Date(g).getDay())).length} on weekdays` : "Pick a date range, days and at least one time."} Up to 42 slots per poll.</span>
              </span>
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <span className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] font-bold text-[var(--primary)]"><span>Slots to vote on · {draft.slots.filter(Boolean).length} <span className="font-normal text-black/45">your time zone · trainees see their own</span></span>{draft.slots.filter(Boolean).length ? <button type="button" onClick={() => setDraft({ ...draft, slots: ["", ""] })} className="text-[12px] font-bold text-[#a3104a]">Clear all</button> : null}</span>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {draft.slots.map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <input type="datetime-local" value={s} onChange={(e) => setDraft({ ...draft, slots: draft.slots.map((x, j) => (j === i ? e.target.value : x)) })} className={field} aria-label={`Time ${i + 1}`} />
                    {draft.slots.length > 2 ? <button type="button" onClick={() => setDraft({ ...draft, slots: draft.slots.filter((_, j) => j !== i) })} className="text-black/35 hover:text-[#a3104a]" aria-label="Remove this time"><MaterialSymbol className="text-[18px]" name="close" /></button> : null}
                  </span>
                ))}
                {draft.slots.length < 42 ? <button type="button" onClick={() => setDraft({ ...draft, slots: [...draft.slots, ""] })} className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-black/15 px-3 py-2 text-[12.5px] font-bold text-black/50 hover:border-black/30"><MaterialSymbol className="text-[16px]" name="add" />Add a time</button> : null}
              </div>
              {draft.id ? <span className="text-[12px] text-black/45">Votes for times you keep stay; votes for times you remove are dropped.</span> : null}
            </div>
            <label className={cn(label, "md:col-span-2")}>Note for trainees <span className="font-normal text-black/45">optional</span>
              <textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} rows={2} className={field} placeholder="What the session covers" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={busy === "draft"} onClick={() => void save()} className="rounded-full bg-[var(--bridge-teal)] px-5 py-2 text-[12.5px] font-bold text-white disabled:opacity-60">{busy === "draft" ? "Saving…" : draft.id ? "Save changes" : "Open the poll"}</button>
            <button type="button" onClick={() => setDraft(null)} className="rounded-full border border-black/10 px-5 py-2 text-[12.5px] font-bold text-[var(--primary)]">Cancel</button>
          </div>
        </section>
      ) : null}

      {active.length ? <div className="grid gap-3 lg:grid-cols-2">{active.map(card)}</div> : !draft ? <p className="rounded-2xl border border-dashed border-black/10 bg-white p-5 text-center text-[13px] text-black/45">No polls running. Start one when you’d like trainees to choose the time.</p> : null}
      {done.length ? (
        <div className="grid gap-2">
          <button type="button" onClick={() => setShowDone(!showDone)} className="flex items-center gap-1 self-start text-[12.5px] font-bold text-black/50"><MaterialSymbol className={cn("text-[18px] transition-transform", showDone && "rotate-180")} name="expand_more" />{done.length} booked poll{done.length === 1 ? "" : "s"}</button>
          {showDone ? <div className="grid gap-3 lg:grid-cols-2">{done.map(card)}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
