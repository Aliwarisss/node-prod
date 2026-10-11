"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { BoardFilter, ReplyView, ThreadKind, ThreadView } from "@/lib/program/board";
import { cn } from "@/lib/utils";

import { CommentThread, type ThreadItem } from "./comments";
import { useNow } from "./session-card";
import { ago, Avatar, MentorTag, RichText } from "./social-ui";

export { ago, Avatar, MentorTag, RichText } from "./social-ui";

export type BoardDay = { day: number; title: string; lessons: { fid: string; code: string; title: string }[] };
export const KINDS: Record<ThreadKind, { label: string; icon: string; tone: string; hint: string }> = {
  question: { label: "Question", icon: "help", tone: "#0284c7", hint: "Stuck on something? Ask — a mentor or another trainee answers." },
  discussion: { label: "Discussion", icon: "forum", tone: "#6d48d8", hint: "Talk through an idea, a technique, how you approached a task." },
  share: { label: "Share", icon: "lightbulb", tone: "#c49000", hint: "A tip, a prompt that worked, a resource worth reading." },
};

/* ---------- a new thread — on the board, or in a modal from a day ("fixed": the day and lesson come from where you are,
   and posting keeps you there) ---------- */
export function NewThread({ days, preset, onDone, fixed = false }: { days: BoardDay[]; preset: { day: number | null; lesson: string; title?: string; body?: string }; onDone: () => void; fixed?: boolean }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [kind, setKind] = useState<ThreadKind>("question");
  const [title, setTitle] = useState(preset.title ?? "");
  const [body, setBody] = useState(preset.body ?? "");
  const [day, setDay] = useState<number | null>(preset.day);
  const [lesson, setLesson] = useState(preset.lesson);
  const [busy, setBusy] = useState(false);
  /* what happened, in the form itself — so a problem is never silent */
  const [status, setStatus] = useState<{ tone: "info" | "error" | "ok"; text: string; detail?: string } | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [posted, setPosted] = useState("");
  const short = title.trim().length < 5;
  const lessons = days.find((d) => d.day === day)?.lessons ?? [];
  const field = "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[var(--bridge-teal)]";

  async function post() {
    if (short) { setStatus({ tone: "error", text: `Give it a title of at least 5 characters (${title.trim().length}/5).` }); return; }
    setBusy(true);
    setStatus({ tone: "info", text: "Posting…" });
    let res: Response | null = null;
    try {
      res = await fetch("/api/board", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, title, body, day, lessonFid: lesson }) });
      const raw = await res.text();
      let d: (ThreadView & { error?: string }) | null = null;
      try { d = JSON.parse(raw); } catch { /* not JSON — a server error page */ }
      if (!res.ok || !d?.id) {
        const why = d?.error ?? (res.status === 401 ? "You’re signed out — sign in again." : res.status === 402 ? "Your program isn’t open yet." : res.status >= 500 ? "The server had a problem." : "The server didn’t accept it.");
        console.error("[board] post failed", res.status, raw.slice(0, 500));
        setStatus({ tone: "error", text: why, detail: `HTTP ${res.status} · ${raw.slice(0, 400) || "(empty response)"}` });
        return;
      }
      pushToast({ variant: "success", title: "Posted", description: kind === "question" ? "You’ll see answers there — a mentor checks the board daily." : "Thanks for starting it." });
      if (fixed) { setPosted(d.id); setStatus(null); return; }
      setStatus({ tone: "ok", text: "Posted — opening your thread…" });
      router.push(`/dashboard/board/${d.id}`);
      onDone();
    } catch (e) {
      console.error("[board] post failed", e);
      setStatus({ tone: "error", text: "Couldn’t reach the server — check your connection and try again.", detail: `${e instanceof Error ? e.message : String(e)}${res ? ` · HTTP ${res.status}` : ""}` });
    } finally { setBusy(false); }
  }

  const where = days.find((d) => d.day === day);
  const whereLesson = where?.lessons.find((l) => l.fid === lesson);
  if (posted) return (
    <section className="grid justify-items-center gap-3 px-2 py-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-[#e6f3f3] text-[var(--bridge-teal)]"><MaterialSymbol className="text-[26px]" name="check_circle" /></span>
      <b className="text-[17px] text-[var(--primary)]">Posted to the board</b>
      <p className="max-w-sm text-[13px] leading-5 text-black/55">{kind === "question" ? "A mentor checks the board daily — you’ll get a notification when someone answers. Carry on with your work." : "Thanks for starting it."}</p>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className="rounded-full bg-[var(--primary)] px-5 py-2 text-[12.5px] font-bold text-white">Back to work</button>
        <Link href={`/dashboard/board/${posted}`} className="rounded-full border border-black/10 px-5 py-2 text-[12.5px] font-bold text-[var(--primary)]">View the thread</Link>
      </div>
    </section>
  );
  return (
    <section className={cn("grid gap-3", !fixed && "rounded-[22px] border-2 border-[var(--primary)]/15 bg-white p-5")}>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(KINDS) as ThreadKind[]).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold", kind === k ? "text-white" : "bg-[#f1f2f3] text-black/60")} style={kind === k ? { background: KINDS[k].tone } : undefined}><MaterialSymbol className="text-[16px]" name={KINDS[k].icon} />{KINDS[k].label}</button>
        ))}
      </div>
      <p className="text-[12.5px] text-black/50">{KINDS[kind].hint}</p>
      <div className="grid gap-1">
        <input value={title} onChange={(e) => { setTitle(e.target.value); if (status?.tone === "error") setStatus(null); }} placeholder={kind === "question" ? "Your question, in one line" : "A title"} className={cn(field, "text-[15px] font-semibold", status?.tone === "error" && short && "border-[#e91e63]")} maxLength={160} />
        <span className={cn("text-[11.5px]", short && title ? "text-[#a3104a]" : "text-black/40")}>{short ? `At least 5 characters · ${title.trim().length}/5` : `${title.trim().length}/160`}</span>
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder={kind === "question" ? "What are you trying to do, what did you try, where are you stuck? Paste links if they help." : "Say more…"} className={field} />
      {fixed ? (
        <span className="flex flex-wrap items-center gap-1.5 text-[12px] text-black/55"><MaterialSymbol className="text-[15px]" name="location_on" />About <b className="text-[var(--primary)]">Day {day}{where?.title ? ` · ${where.title}` : ""}</b>{whereLesson ? <> · <b className="text-[var(--primary)]">{whereLesson.code} {whereLesson.title}</b></> : null}</span>
      ) : <div className="grid gap-2 sm:grid-cols-2">
        <select value={day ?? ""} onChange={(e) => { setDay(e.target.value === "" ? null : Number(e.target.value)); setLesson(""); }} className={field} aria-label="Day">
          <option value="">Not about a particular day</option>
          {days.map((d) => <option key={d.day} value={d.day}>Day {d.day} · {d.title}</option>)}
        </select>
        <select value={lesson} onChange={(e) => setLesson(e.target.value)} disabled={!lessons.length} className={field} aria-label="Lesson">
          <option value="">{lessons.length ? "Any lesson that day" : "Pick a day first"}</option>
          {lessons.map((l) => <option key={l.fid} value={l.fid}>{l.code} {l.title}</option>)}
        </select>
      </div>}
      {status ? (
        <div role={status.tone === "error" ? "alert" : "status"} className={cn("grid gap-1 rounded-xl px-3 py-2.5 text-[13px]", status.tone === "error" ? "bg-[#fdecf2] text-[#8a0f3f]" : status.tone === "ok" ? "bg-[#e6f3f3] text-[#005a5a]" : "bg-[#f1f2f3] text-black/60")}>
          <span className="flex items-center gap-1.5"><MaterialSymbol className="text-[17px]" name={status.tone === "error" ? "error" : status.tone === "ok" ? "check_circle" : "hourglass_top"} />{status.text}</span>
          {status.detail ? (
            <span className="grid gap-1">
              <button type="button" onClick={() => setShowDetail((v) => !v)} className="justify-self-start text-[11.5px] font-bold underline underline-offset-2">{showDetail ? "Hide details" : "Show details"}</button>
              {showDetail ? <code className="block whitespace-pre-wrap break-all rounded-lg bg-white/70 p-2 font-mono text-[11px] text-black/70">{status.detail}</code> : null}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => void post()} className="rounded-full bg-[var(--electric-pink)] px-5 py-2 text-[12.5px] font-black uppercase tracking-[0.05em] text-white disabled:opacity-60">{busy ? "Posting…" : "Post"}</button>
        <button type="button" onClick={onDone} className="rounded-full border border-black/10 px-5 py-2 text-[12.5px] font-bold text-[var(--primary)]">Cancel</button>
      </div>
    </section>
  );
}

/* ---------- the board: every thread ---------- */
export function BoardView({ initial, days, isAdmin, preset, counts }: { initial: ThreadView[]; days: BoardDay[]; isAdmin: boolean; preset: { open: boolean; day: number | null; lesson: string; filter: BoardFilter; title?: string; body?: string }; counts: { unanswered: number } }) {
  const now = useNow();
  const [threads, setThreads] = useState(initial);
  const [filter, setFilter] = useState<BoardFilter>(preset.filter);
  const [day, setDay] = useState<number | null>(preset.open ? null : preset.day);
  const [q, setQ] = useState("");
  const [composing, setComposing] = useState(preset.open);
  const [loading, setLoading] = useState(false);

  async function load(f = filter, d = day, text = q) {
    setLoading(true);
    try {
      const p = new URLSearchParams({ filter: f, ...(d !== null ? { day: String(d) } : {}), ...(text ? { q: text } : {}) });
      const r = await fetch(`/api/board?${p}`);
      if (r.ok) setThreads((await r.json()) as ThreadView[]);
    } finally { setLoading(false); }
  }
  const tabs: [BoardFilter, string, ReactNode?][] = [["all", "All"], ["unanswered", "Unanswered", counts.unanswered ? <span className="rounded-full bg-[var(--electric-pink)] px-1.5 text-[10px] text-white">{counts.unanswered}</span> : null], ["question", "Questions"], ["discussion", "Discussions"], ["share", "Shared"], ["mine", "Mine"]];

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/40">Board</span>
          <h1 className="text-[26px] font-black leading-none tracking-[-0.03em] text-[var(--primary)]">Ask, discuss, share</h1>
          <p className="text-[13.5px] text-[var(--on-surface-variant)]">{isAdmin ? "Answer questions as a mentor, pin what everyone should see, and keep it friendly." : "Questions get answered by mentors and the cohort. Help someone out — an accepted answer earns you XP."}</p>
        </div>
        {!composing ? <button type="button" onClick={() => setComposing(true)} className="flex items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-4 py-2 text-[12.5px] font-black uppercase tracking-[0.05em] text-white shadow-md shadow-pink-500/20"><MaterialSymbol className="text-[17px]" name="edit_square" />New thread</button> : null}
      </header>

      {composing ? <NewThread days={days} preset={{ day: preset.day, lesson: preset.lesson }} onDone={() => setComposing(false)} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-full bg-[#eceef0] p-1 text-[12.5px] font-bold">
          {tabs.map(([id, label, extra]) => <button key={id} type="button" onClick={() => { setFilter(id); void load(id); }} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5", filter === id ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/55")}>{label}{extra}</button>)}
        </div>
        <select value={day ?? ""} onChange={(e) => { const d = e.target.value === "" ? null : Number(e.target.value); setDay(d); void load(filter, d); }} className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12.5px] text-[var(--primary)] outline-none" aria-label="Day">
          <option value="">Every day</option>
          {days.map((d) => <option key={d.day} value={d.day}>Day {d.day} · {d.title}</option>)}
        </select>
        <form onSubmit={(e) => { e.preventDefault(); void load(); }} className="ml-auto flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5">
          <MaterialSymbol className="text-[16px] text-black/35" name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the board" className="w-44 bg-transparent text-[13px] outline-none" />
        </form>
      </div>

      <ol className={cn("grid gap-2 transition-opacity", loading && "opacity-50")}>
        {!threads.length ? <li className="rounded-2xl border border-dashed border-black/10 p-10 text-center text-[13.5px] text-black/45">Nothing here yet — start the conversation.</li> : null}
        {threads.map((t) => {
          const k = KINDS[t.kind];
          return (
            <li key={t.id}>
              <Link href={`/dashboard/board/${t.id}`} className={cn("grid grid-cols-[38px_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border bg-white p-4 transition-colors hover:border-black/20", t.pinned ? "border-[#d4a017]/40 bg-[#fffbeb]" : "border-black/[0.06]")}>
                <span className="flex size-9 items-center justify-center rounded-xl text-white" style={{ background: k.tone }}><MaterialSymbol className="text-[19px]" name={k.icon} /></span>
                <span className="grid min-w-0 gap-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {t.pinned ? <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#a16207]"><MaterialSymbol className="text-[14px]" name="push_pin" />Pinned</span> : null}
                    {t.kind === "question" ? (t.answered ? <span className="flex items-center gap-0.5 rounded-full bg-[#e6f3f3] px-1.5 py-px text-[10.5px] font-bold text-[#005a5a]"><MaterialSymbol className="text-[13px]" name="check_circle" />Answered</span> : <span className="rounded-full bg-[#fdecf2] px-1.5 py-px text-[10.5px] font-bold text-[#a3104a]">Open</span>) : null}
                    <b className="truncate text-[14.5px] text-[var(--primary)]">{t.title}</b>
                  </span>
                  {t.body ? <span className="line-clamp-1 text-[12.5px] text-[var(--on-surface-variant)]">{t.body}</span> : null}
                  <span suppressHydrationWarning className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-black/45">
                    <span className="flex items-center gap-1"><b className="text-black/60">{t.authorName}</b>{t.authorRole === "admin" ? <MentorTag /> : null}</span>
                    {t.day !== null ? <span className="rounded-md bg-[#f1f2f3] px-1.5 font-semibold text-black/55">Day {t.day}{t.lessonTitle ? ` · ${t.lessonTitle}` : ""}</span> : null}
                    <span>active {ago(t.lastActivityAt, now)}</span>
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1 text-[12px] text-black/45">
                  <span className="flex items-center gap-1"><MaterialSymbol className="text-[15px]" name="chat_bubble" />{t.replies}</span>
                  <span className={cn("flex items-center gap-1", t.voted && "text-[var(--electric-pink)]")}><MaterialSymbol className="text-[15px]" name="arrow_upward" />{t.votes}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- one thread ---------- */
export function ThreadPage({ initial, isAdmin, me = "You" }: { initial: { thread: ThreadView; replies: ReplyView[] }; isAdmin: boolean; me?: string }) {
  const router = useRouter();
  const now = useNow();
  const { pushToast } = useToast();
  const [data, setData] = useState(initial);
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState("");
  const [busy, setBusy] = useState(false);
  const t = data.thread, k = KINDS[t.kind];
  const canAccept = t.kind === "question" && (t.mine || isAdmin);
  /* replies as comment threads: the accepted answer first, each with its own replies and reactions */
  const items: (ThreadItem & { r: ReplyView })[] = data.replies.map((r) => ({ id: r.id, parentId: r.parentId, body: r.body, authorId: r.authorId, authorName: r.authorName, authorRole: r.authorRole, createdAt: r.createdAt, isMine: r.mine, reactions: r.reactions, mine: r.myReaction, r }));
  const byId = (id: string) => data.replies.find((x) => x.id === id);

  async function act(body: Record<string, unknown>) {
    const r = await fetch(`/api/board/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = (await r.json()) as { thread: ThreadView; replies: ReplyView[]; error?: string };
    if (!r.ok) { pushToast({ variant: "error", title: "Not done", description: d.error ?? "Try again." }); return; }
    setData(d);
  }
  /* a reply to the thread, or (with a parent) to one of its replies */
  async function post(body: string, parentId = ""): Promise<boolean> {
    try {
      const r = await fetch(`/api/board/${t.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, parentId }) });
      const raw = await r.text();
      let d: (ReplyView & { error?: string }) | null = null;
      try { d = JSON.parse(raw); } catch { /* not JSON */ }
      if (!r.ok || !d?.id) throw new Error(d?.error ?? `The server didn’t accept it (HTTP ${r.status}).`);
      setData((cur) => ({ thread: { ...cur.thread, replies: cur.thread.replies + 1 }, replies: [...cur.replies, d!] }));
      setReplyError("");
      return true;
    } catch (e) {
      const why = e instanceof Error ? e.message : "Try again.";
      console.error("[board] reply failed", e);
      setReplyError(why);
      pushToast({ variant: "error", title: "Not sent", description: why });
      return false;
    }
  }
  async function send() {
    setBusy(true);
    if (await post(reply)) setReply("");
    setBusy(false);
  }
  async function remove(replyId?: string) {
    if (!window.confirm(replyId ? "Remove this reply?" : "Remove this thread and its replies?")) return;
    const r = await fetch(`/api/board/${t.id}${replyId ? `?reply=${replyId}` : ""}`, { method: "DELETE" });
    if (!r.ok) { pushToast({ variant: "error", title: "Not removed", description: "Try again." }); return; }
    if (!replyId) { router.push("/dashboard/board"); return; }
    /* the reply goes, with any replies to it */
    setData((cur) => {
      const gone = new Set(cur.replies.filter((x) => x.id === replyId || x.parentId === replyId).map((x) => x.id));
      const lostAnswer = gone.has(cur.thread.answerId);
      return { thread: { ...cur.thread, replies: cur.thread.replies - gone.size, answerId: lostAnswer ? "" : cur.thread.answerId, answered: lostAnswer ? false : cur.thread.answered }, replies: cur.replies.filter((x) => !gone.has(x.id)) };
    });
  }

  return (
    <div className="grid max-w-3xl gap-5">
      <Link href="/dashboard/board" className="flex items-center gap-1 justify-self-start text-[13px] font-bold text-black/55 hover:text-[var(--primary)]"><MaterialSymbol className="text-[17px]" name="arrow_back" />Board</Link>

      <article className="grid gap-3 rounded-[22px] border border-black/[0.06] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 font-bold text-white" style={{ background: k.tone }}><MaterialSymbol className="text-[14px]" name={k.icon} />{k.label}</span>
          {t.kind === "question" ? (t.answered ? <span className="flex items-center gap-0.5 font-bold text-[#005a5a]"><MaterialSymbol className="text-[15px]" name="check_circle" />Answered</span> : <span className="font-bold text-[#a3104a]">Waiting for an answer</span>) : null}
          {t.pinned ? <span className="flex items-center gap-0.5 font-bold text-[#a16207]"><MaterialSymbol className="text-[14px]" name="push_pin" />Pinned</span> : null}
          {t.day !== null ? <Link href={`/dashboard/roadmap/day/${t.day}`} className="rounded-md bg-[#f1f2f3] px-1.5 py-0.5 font-semibold text-black/60 hover:bg-[#e8eaec]">Day {t.day}{t.lessonTitle ? ` · ${t.lessonTitle}` : ""}</Link> : null}
        </div>
        <h1 className="text-[22px] font-black leading-tight text-[var(--primary)]">{t.title}</h1>
        <span suppressHydrationWarning className="flex items-center gap-2 text-[12.5px] text-black/50"><Avatar name={t.authorName} admin={t.authorRole === "admin"} size={26} /><b className="text-black/70">{t.authorName}</b>{t.authorRole === "admin" ? <MentorTag /> : null}<span>· {ago(t.createdAt, now)}</span></span>
        {t.body ? <RichText text={t.body} className="text-[14.5px] leading-7 text-[var(--primary)]" /> : null}
        <div className="flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-3">
          <button type="button" onClick={() => void act({ action: "vote" })} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-bold", t.voted ? "bg-[#fdecf2] text-[var(--electric-pink)]" : "bg-[#f1f2f3] text-black/60")}><MaterialSymbol className="text-[16px]" name="arrow_upward" />{t.votes} {t.kind === "question" ? "Me too" : "Upvote"}</button>
          {isAdmin ? <button type="button" onClick={() => void act({ action: "pin", pinned: !t.pinned })} className="flex items-center gap-1 rounded-full bg-[#f1f2f3] px-3 py-1.5 text-[12.5px] font-bold text-black/60"><MaterialSymbol className="text-[16px]" name="push_pin" />{t.pinned ? "Unpin" : "Pin"}</button> : null}
          {t.mine || isAdmin ? <button type="button" onClick={() => void remove()} className="ml-auto text-[12px] font-bold text-[#a3104a]">Remove thread</button> : null}
        </div>
      </article>

      <section className="grid gap-3">
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/40">{t.replies} repl{t.replies === 1 ? "y" : "ies"}</span>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
          {items.length ? (
            <CommentThread
              items={items} me={me} isAdmin={isAdmin} collapseAfter={3}
              order={(a, b) => Number(!!byId(b.id)?.accepted) - Number(!!byId(a.id)?.accepted)}
              highlight={(c) => !!byId(c.id)?.accepted}
              onReply={(body, parentId) => post(body, parentId)}
              onReact={(id, emoji) => void act({ action: "react-reply", replyId: id, emoji })}
              onRemove={(id) => void remove(id)}
              extra={(c) => {
                const r = byId(c.id);
                if (!r) return null;
                return (
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {r.accepted ? <span className="flex items-center gap-0.5 text-[#005a5a]"><MaterialSymbol className="text-[15px]" name="verified" />Accepted answer</span> : null}
                    <button type="button" disabled={r.mine} onClick={() => void act({ action: "vote-reply", replyId: r.id })} title="Helpful" className={cn("flex items-center gap-0.5 text-[11.5px] disabled:opacity-40", r.voted ? "text-[var(--electric-pink)]" : "text-black/45")}><MaterialSymbol className="text-[14px]" name="arrow_upward" />{r.votes}</button>
                    {canAccept && !r.parentId ? <button type="button" onClick={() => void act({ action: "accept", replyId: r.accepted ? "" : r.id })} className="flex items-center gap-0.5 text-[11.5px] text-[var(--bridge-teal)]"><MaterialSymbol className="text-[14px]" name={r.accepted ? "undo" : "check_circle"} />{r.accepted ? "Un-accept" : "Accept"}</button> : null}
                  </span>
                );
              }}
            />
          ) : <p className="text-[13px] text-black/45">No replies yet — be the first to help.</p>}
        </div>
        <div className="grid gap-2 rounded-2xl border border-black/[0.06] bg-white p-4">
          {replyError ? <p role="alert" className="flex items-center gap-1.5 rounded-xl bg-[#fdecf2] px-3 py-2 text-[12.5px] text-[#8a0f3f]"><MaterialSymbol className="text-[16px]" name="error" />{replyError}</p> : null}
          <textarea value={reply} onChange={(e) => { setReply(e.target.value); setReplyError(""); }} rows={4} placeholder={t.kind === "question" ? "Help them out — what would you try?" : "Add to the discussion…"} className="w-full rounded-lg border border-black/10 px-3 py-2 text-[13.5px] outline-none focus:border-[var(--bridge-teal)]" />
          <button type="button" disabled={busy || reply.trim().length < 2} onClick={() => void send()} className="justify-self-end rounded-full bg-[var(--primary)] px-5 py-2 text-[12.5px] font-bold text-white disabled:opacity-50">{busy ? "Sending…" : "Reply"}</button>
        </div>
      </section>
    </div>
  );
}
