"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { FeedCommentView, FeedFilter, FeedPostView, Reaction } from "@/lib/program/feed";
import type { RankRow } from "@/lib/program/gamification";
import type { SessionView } from "@/lib/program/sessions";
import { cn } from "@/lib/utils";

import { ago, Avatar, MentorTag, RichText } from "./board-view";
import { CommentThread, EMOJI, ORDER, ReplyBox } from "./comments";
import { GameAvatar, TitleText } from "./game-ui";
import { SessionCard, useNow } from "./session-card";


const initialsOf = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "N";
const card = "rounded-[22px] border border-black/[0.06] bg-white";

type Status = { tone: "info" | "error" | "ok"; text: string; detail?: string } | null;
/* a request whose failure is always visible — the reason, and the raw response on demand */
async function call<T>(url: string, init: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: Status }> {
  try {
    const res = await fetch(url, init);
    const raw = await res.text();
    let data: unknown = null;
    try { data = JSON.parse(raw); } catch { /* not JSON */ }
    if (!res.ok) {
      const why = (data as { error?: string } | null)?.error ?? (res.status === 401 ? "You’re signed out — sign in again." : res.status >= 500 ? "The server had a problem." : "That didn’t go through.");
      console.error("[feed]", url, res.status, raw.slice(0, 500));
      return { ok: false, status: { tone: "error", text: why, detail: `HTTP ${res.status} · ${raw.slice(0, 400) || "(empty response)"}` } };
    }
    return { ok: true, data: data as T };
  } catch (e) {
    console.error("[feed]", url, e);
    return { ok: false, status: { tone: "error", text: "Couldn’t reach the server — check your connection.", detail: e instanceof Error ? e.message : String(e) } };
  }
}
function StatusLine({ status }: { status: Status }) {
  const [open, setOpen] = useState(false);
  if (!status) return null;
  return (
    <div role={status.tone === "error" ? "alert" : "status"} className={cn("grid gap-1 rounded-xl px-3 py-2 text-[12.5px]", status.tone === "error" ? "bg-[#fdecf2] text-[#8a0f3f]" : status.tone === "ok" ? "bg-[#e6f3f3] text-[#005a5a]" : "bg-[#f1f2f3] text-black/60")}>
      <span className="flex items-center gap-1.5"><MaterialSymbol className="text-[16px]" name={status.tone === "error" ? "error" : status.tone === "ok" ? "check_circle" : "hourglass_top"} />{status.text}</span>
      {status.detail ? <><button type="button" onClick={() => setOpen((v) => !v)} className="justify-self-start text-[11px] font-bold underline underline-offset-2">{open ? "Hide details" : "Show details"}</button>{open ? <code className="block whitespace-pre-wrap break-all rounded-lg bg-white/70 p-2 font-mono text-[11px] text-black/70">{status.detail}</code> : null}</> : null}
    </div>
  );
}

/* ---------- the composer ---------- */
function Composer({ me, days, onPosted }: { me: { name: string; admin: boolean }; days: { day: number; title: string }[]; onPosted: (p: FeedPostView) => void }) {
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"post" | "collab">("post");
  const [day, setDay] = useState<number | null>(null);
  const [image, setImage] = useState<{ id: string; name: string; preview: string } | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  async function attach(f: File) {
    setStatus({ tone: "info", text: "Uploading the picture…" });
    const fd = new FormData(); fd.append("file", f);
    const r = await call<{ id: string; name: string }>("/api/feed/image", { method: "POST", body: fd });
    if (!r.ok) { setStatus(r.status); return; }
    setImage({ ...r.data, preview: URL.createObjectURL(f) });
    setStatus(null);
  }
  async function post() {
    if (!body.trim() && !image) { setStatus({ tone: "error", text: "Write something (or add a picture) first." }); return; }
    setBusy(true); setStatus({ tone: "info", text: "Posting…" });
    const r = await call<FeedPostView>("/api/feed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, body, imageId: image?.id ?? "", day }) });
    setBusy(false);
    if (!r.ok) { setStatus(r.status); return; }
    onPosted(r.data); setBody(""); setImage(null); setDay(null); setKind("post");
    setStatus({ tone: "ok", text: "Posted to the feed." });
    setTimeout(() => setStatus(null), 2500);
  }

  return (
    <section className={cn(card, "grid gap-3 p-4")}>
      <div className="flex items-start gap-3">
        <Avatar name={me.name} admin={me.admin} size={40} />
        <textarea value={body} onChange={(e) => { setBody(e.target.value); if (status?.tone === "error") setStatus(null); }} rows={body ? 4 : 2} maxLength={5000} placeholder={kind === "collab" ? "What are you looking for help with? Say what you’re working on and who you’d like to team up with…" : "Share a win, a question for the cohort, something you learned…"} className="min-w-0 flex-1 resize-y rounded-2xl bg-[#f6f7f8] px-4 py-3 text-[14px] outline-none focus:bg-white focus:ring-2 focus:ring-[var(--bridge-teal)]/30" />
      </div>
      {image ? (
        <div className="relative ml-[52px] justify-self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.preview} alt={image.name} className="max-h-56 rounded-xl border border-black/[0.06] object-cover" />
          <button type="button" onClick={() => setImage(null)} className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white" aria-label="Remove the picture"><MaterialSymbol className="text-[16px]" name="close" /></button>
        </div>
      ) : null}
      <StatusLine status={status} />
      <div className="flex flex-wrap items-center gap-2 pl-[52px]">
        <button type="button" onClick={() => file.current?.click()} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-bold text-black/60 hover:bg-black/[0.04]"><MaterialSymbol className="text-[18px] text-[#0f766e]" name="image" />Picture</button>
        <input ref={file} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void attach(f); e.target.value = ""; }} />
        <button type="button" onClick={() => setKind(kind === "collab" ? "post" : "collab")} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-bold", kind === "collab" ? "bg-[#ede9fe] text-[#5b21b6]" : "text-black/60 hover:bg-black/[0.04]")}><MaterialSymbol className="text-[18px] text-[#6d48d8]" name="handshake" />Looking for collaborators</button>
        <select value={day ?? ""} onChange={(e) => setDay(e.target.value === "" ? null : Number(e.target.value))} className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] text-black/60 outline-none" aria-label="About a day">
          <option value="">Not about a day</option>
          {days.map((d) => <option key={d.day} value={d.day}>Day {d.day} · {d.title}</option>)}
        </select>
        <button type="button" disabled={busy} onClick={() => void post()} className="ml-auto rounded-full bg-[var(--electric-pink)] px-5 py-2 text-[12.5px] font-black uppercase tracking-[0.05em] text-white disabled:opacity-60">{busy ? "Posting…" : "Post"}</button>
      </div>
    </section>
  );
}

/* ---------- a post ---------- */
function Post({ p: initial, isAdmin, me, onRemoved }: { p: FeedPostView; isAdmin: boolean; me: string; onRemoved: (id: string) => void }) {
  const now = useNow();
  const { pushToast } = useToast();
  const [p, setP] = useState(initial);
  const [picker, setPicker] = useState(false);
  const [comments, setComments] = useState<FeedCommentView[] | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const total = ORDER.reduce((a, r) => a + p.reactions[r], 0);
  const top = ORDER.filter((r) => p.reactions[r] > 0).sort((a, b) => p.reactions[b] - p.reactions[a]).slice(0, 3);

  async function patch(body: Record<string, unknown>) {
    const r = await call<FeedPostView>(`/api/feed/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) setP(r.data); else setStatus(r.status);
  }
  async function loadComments() {
    setShowComments((v) => !v);
    if (comments) return;
    const r = await call<FeedCommentView[]>(`/api/feed/${p.id}/comments`, { method: "GET" });
    if (r.ok) setComments(r.data); else setStatus(r.status);
  }
  /* a comment, or a reply to one */
  async function comment(body: string, parentId = ""): Promise<boolean> {
    const r = await call<FeedCommentView>(`/api/feed/${p.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, parentId }) });
    if (!r.ok) { setStatus(r.status); return false; }
    setComments((c) => [...(c ?? []), r.data]); setP((x) => ({ ...x, comments: x.comments + 1 })); setShowComments(true); setStatus(null);
    return true;
  }
  async function reactComment(commentId: string, emoji: Reaction | null) {
    const r = await call<FeedCommentView>(`/api/feed/${p.id}/comments`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId, emoji }) });
    if (r.ok) setComments((c) => (c ?? []).map((x) => (x.id === commentId ? r.data : x))); else setStatus(r.status);
  }
  async function removeComment(id: string) {
    if (!window.confirm("Remove this comment (and its replies)?")) return;
    const r = await call<{ removed: number }>(`/api/feed/${p.id}/comments?comment=${id}`, { method: "DELETE" });
    if (r.ok) { setComments((c) => (c ?? []).filter((x) => x.id !== id && x.parentId !== id)); setP((x) => ({ ...x, comments: x.comments - (r.data.removed ?? 1) })); } else setStatus(r.status);
  }
  async function remove() {
    if (!window.confirm("Remove this post?")) return;
    const r = await call(`/api/feed/${p.id}`, { method: "DELETE" });
    if (r.ok) { onRemoved(p.id); pushToast({ variant: "success", title: "Post removed", description: "It’s gone from the feed." }); } else setStatus(r.status);
  }
  const react = (r: Reaction) => { setPicker(false); void patch({ action: "react", emoji: p.mine === r ? null : r }); };

  return (
    <article className={cn(card, "grid gap-3 p-4", p.pinned && "border-[#d4a017]/40 bg-[#fffdf5]")}>
      <header className="flex items-start gap-3">
        <Link href={`/dashboard/u/${p.authorId}`}><Avatar name={p.authorName} admin={p.authorRole === "admin"} size={40} /></Link>
        <span className="grid min-w-0 flex-1 leading-tight">
          <span className="flex flex-wrap items-center gap-1.5"><Link href={`/dashboard/u/${p.authorId}`} className="text-[14px] font-bold text-[var(--primary)] hover:underline">{p.authorName}</Link>{p.authorRole === "admin" ? <MentorTag /> : null}{p.kind === "collab" ? <span className="rounded-full bg-[#ede9fe] px-1.5 py-px text-[10.5px] font-bold text-[#5b21b6]">Looking for collaborators</span> : null}{p.pinned ? <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#a16207]"><MaterialSymbol className="text-[14px]" name="push_pin" />Pinned</span> : null}</span>
          <span suppressHydrationWarning className="text-[12px] text-black/45">{ago(p.createdAt, now)}{p.day !== null ? <> · <Link href={`/dashboard/roadmap/day/${p.day}`} className="hover:underline">Day {p.day}</Link></> : null}{p.kind === "auto" ? " · shared by the program" : ""}</span>
        </span>
        {isAdmin || p.isMine ? (
          <span className="flex gap-0.5">
            {isAdmin ? <button type="button" onClick={() => void patch({ action: "pin", pinned: !p.pinned })} title={p.pinned ? "Unpin" : "Pin to the top"} className="flex size-8 items-center justify-center rounded-full text-black/40 hover:bg-black/[0.05]"><MaterialSymbol className="text-[17px]" name="push_pin" /></button> : null}
            <button type="button" onClick={() => void remove()} title="Remove" className="flex size-8 items-center justify-center rounded-full text-black/40 hover:bg-black/[0.05] hover:text-[#a3104a]"><MaterialSymbol className="text-[17px]" name="delete" /></button>
          </span>
        ) : null}
      </header>

      {p.auto ? (
        <Link href={p.auto.link || "#"} className="flex items-center gap-3 rounded-2xl p-3 transition-transform hover:-translate-y-0.5" style={{ background: `color-mix(in srgb, ${p.auto.color} 9%, white)` }}>
          <span className="flex size-12 flex-none items-center justify-center rounded-2xl text-white shadow-md" style={{ background: p.auto.color }}><MaterialSymbol className="text-[26px]" name={p.auto.icon} /></span>
          <span className="grid min-w-0 leading-tight"><b className="text-[15px] text-[var(--primary)]">{p.auto.title}</b>{p.auto.detail ? <span className="text-[12.5px] text-[var(--on-surface-variant)]">{p.auto.detail}</span> : null}</span>
        </Link>
      ) : null}
      {p.body ? <RichText text={p.body} className="text-[14.5px] leading-6 text-[var(--primary)]" /> : null}
      {p.image ? (
        <a href={`/api/program/uploads/${p.image.id}`} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/program/uploads/${p.image.id}?v=2`} alt={p.image.name} loading="lazy" className="max-h-[420px] w-full rounded-2xl border border-black/[0.06] object-cover" />
        </a>
      ) : null}
      {p.kind === "collab" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f5f3ff] px-3 py-2 text-[13px] text-[#4c1d95]">
          <MaterialSymbol className="text-[18px]" name="group" /><b>{p.joiners}</b> in so far
          {!p.isMine ? <button type="button" onClick={() => void patch({ action: "join" })} className={cn("ml-auto rounded-full px-3.5 py-1.5 text-[12px] font-bold", p.joined ? "bg-white text-[#5b21b6] ring-1 ring-[#5b21b6]/30" : "bg-[#6d48d8] text-white")}>{p.joined ? "You’re in · leave" : "I’m in"}</button> : <span className="ml-auto text-[12px]">Your collab — reply in the comments</span>}
        </div>
      ) : null}

      {/* reactions and comments */}
      {total || p.comments ? (
        <div className="flex items-center justify-between text-[12.5px] text-black/50">
          <span className="flex items-center gap-1">{top.map((r) => <span key={r} title={EMOJI[r].label}>{EMOJI[r].glyph}</span>)}{total ? <span className="ml-1">{total}</span> : null}</span>
          {p.comments ? <button type="button" onClick={() => void loadComments()} className="hover:underline">{p.comments} comment{p.comments === 1 ? "" : "s"}</button> : null}
        </div>
      ) : null}
      <div className="relative flex gap-1 border-t border-black/[0.06] pt-2">
        <button type="button" onClick={() => (p.mine ? react(p.mine) : setPicker((v) => !v))} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-bold hover:bg-black/[0.04]", p.mine ? "text-[var(--electric-pink)]" : "text-black/55")}>
          {p.mine ? <span>{EMOJI[p.mine].glyph}</span> : <MaterialSymbol className="text-[18px]" name="add_reaction" />}{p.mine ? EMOJI[p.mine].label : "React"}
        </button>
        <button type="button" onClick={() => void loadComments()} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-bold text-black/55 hover:bg-black/[0.04]"><MaterialSymbol className="text-[18px]" name="chat_bubble" />Comment</button>
        {picker ? (
          <div className="absolute -top-12 left-0 z-10 flex gap-1 rounded-full border border-black/[0.08] bg-white px-2 py-1.5 shadow-lg" onMouseLeave={() => setPicker(false)}>
            {ORDER.map((r) => <button key={r} type="button" onClick={() => react(r)} title={EMOJI[r].label} className="flex size-9 items-center justify-center rounded-full text-[22px] transition-transform hover:scale-125">{EMOJI[r].glyph}</button>)}
          </div>
        ) : null}
      </div>
      <StatusLine status={status} />

      {showComments ? (
        <div className="grid gap-3">
          {comments === null ? <span className="text-[12px] text-black/40">Loading…</span> : (
            <CommentThread items={comments} me={me} isAdmin={isAdmin} onReply={(body, parentId) => comment(body, parentId)} onReact={(id, r) => void reactComment(id, r)} onRemove={(id) => void removeComment(id)} />
          )}
          <ReplyBox me={me} placeholder="Write a comment…" onSend={(body) => comment(body)} />
        </div>
      ) : null}
    </article>
  );
}

/* ---------- the feed ---------- */
export function FeedView({ initial, more: initialMore, me, isAdmin, days, shareAuto: initialShare, week, session }: {
  initial: FeedPostView[]; more: boolean; me: { id: string; name: string }; isAdmin: boolean; days: { day: number; title: string }[];
  shareAuto: boolean; week: RankRow[]; session: SessionView | null;
}) {
  const [posts, setPosts] = useState(initial);
  const [more, setMore] = useState(initialMore);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [loading, setLoading] = useState(false);
  const [shareAuto, setShareAuto] = useState(initialShare);
  const [status, setStatus] = useState<Status>(null);

  async function load(f: FeedFilter, before?: string) {
    setLoading(true);
    const r = await call<{ posts: FeedPostView[]; more: boolean }>(`/api/feed?filter=${f}${before ? `&before=${encodeURIComponent(before)}` : ""}`, { method: "GET" });
    setLoading(false);
    if (!r.ok) { setStatus(r.status); return; }
    setPosts((cur) => (before ? [...cur, ...r.data.posts] : r.data.posts)); setMore(r.data.more); setStatus(null);
  }
  async function toggleShare(v: boolean) {
    setShareAuto(v);
    const r = await call("/api/feed/prefs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shareAuto: v }) });
    if (!r.ok) { setShareAuto(!v); setStatus(r.status); }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="mx-auto grid w-full max-w-[680px] gap-4">
        <header className="grid gap-1">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/40">Feed</span>
          <h1 className="text-[26px] font-black leading-none tracking-[-0.03em] text-[var(--primary)]">What the cohort is up to</h1>
        </header>
        <Composer me={{ name: me.name, admin: isAdmin }} days={days} onPosted={(p) => setPosts((cur) => [p, ...cur])} />
        <div className="flex flex-wrap gap-1 rounded-full bg-[#eceef0] p-1 text-[12.5px] font-bold">
          {([["all", "All"], ["posts", "Posts"], ["updates", "Milestones"], ["collab", "Collab"], ["mine", "Mine"]] as const).map(([id, label]) => <button key={id} type="button" onClick={() => { setFilter(id); void load(id); }} className={cn("flex-1 rounded-full px-3 py-1.5", filter === id ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/55")}>{label}</button>)}
        </div>
        <StatusLine status={status} />
        <div className={cn("grid gap-4 transition-opacity", loading && "opacity-50")}>
          {!posts.length ? <p className={cn(card, "p-10 text-center text-[13.5px] text-black/45")}>Nothing here yet — say hello to the cohort.</p> : null}
          {posts.map((p) => <Post key={p.id} p={p} isAdmin={isAdmin} me={me.name} onRemoved={(id) => setPosts((cur) => cur.filter((x) => x.id !== id))} />)}
        </div>
        {more ? <button type="button" disabled={loading} onClick={() => void load(filter, posts[posts.length - 1]?.createdAt)} className="justify-self-center rounded-full border border-black/10 bg-white px-5 py-2 text-[12.5px] font-bold text-[var(--primary)]">{loading ? "Loading…" : "Show more"}</button> : null}
      </div>

      {/* the side: this week, the next session, and how your milestones are shared */}
      <aside className="grid gap-4 xl:sticky xl:top-4">
        {week.length ? (
          <section className={cn(card, "grid gap-2 p-4")}>
            <span className="flex items-center justify-between"><b className="text-[13.5px] text-[var(--primary)]">This week’s leaders</b><Link href="/dashboard/leaderboard" className="text-[12px] font-bold text-[var(--bridge-teal)]">All →</Link></span>
            {week.slice(0, 3).map((r) => (
              <Link key={r.id} href={`/dashboard/u/${r.id}`} className="flex items-center gap-2.5 rounded-xl px-1 py-1 hover:bg-black/[0.03]">
                <b className="w-4 text-[13px] text-black/40">{r.rank}</b>
                <GameAvatar initials={initialsOf(r.name)} frame={r.frame} size={32} />
                <span className="grid min-w-0 flex-1 leading-tight"><b className="truncate text-[13px] text-[var(--primary)]">{r.name}</b><span className="truncate text-[11.5px] text-black/45"><TitleText title={r.title} fx={r.titleFx} /></span></span>
                <span className="font-mono text-[12px] font-bold text-[var(--primary)]">{r.week}</span>
              </Link>
            ))}
          </section>
        ) : null}
        {session ? <SessionCard s={session} showDay /> : null}
        {!isAdmin ? (
          <section className={cn(card, "grid gap-2 p-4")}>
            <b className="text-[13.5px] text-[var(--primary)]">Your milestones</b>
            <p className="text-[12.5px] leading-5 text-[var(--on-surface-variant)]">When you finish a day, clear a stage, earn a badge, level up, score 100% or help someone on the board, the program shares it here so the cohort can cheer you on.</p>
            <label className="flex items-center gap-2 text-[13px] font-semibold text-[var(--primary)]"><input type="checkbox" checked={shareAuto} onChange={(e) => void toggleShare(e.target.checked)} className="size-4 accent-[var(--bridge-teal)]" />Share my milestones automatically</label>
          </section>
        ) : null}
        <section className={cn(card, "grid gap-1.5 p-4 text-[13px]")}>
          <Link href="/dashboard/board?new=1" className="flex items-center gap-2 font-semibold text-[var(--primary)] hover:underline"><MaterialSymbol className="text-[18px] text-[#0284c7]" name="help" />Ask a question on the board</Link>
          <Link href="/dashboard/leaderboard" className="flex items-center gap-2 font-semibold text-[var(--primary)] hover:underline"><MaterialSymbol className="text-[18px] text-[#d4a017]" name="leaderboard" />See the leaderboard</Link>
        </section>
      </aside>
    </div>
  );
}
