"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Reaction } from "@/lib/program/feed";
import { cn } from "@/lib/utils";

import { ago, Avatar, MentorTag, RichText } from "./social-ui";
import { useNow } from "./session-card";

export const EMOJI: Record<Reaction, { glyph: string; label: string }> = {
  like: { glyph: "👍", label: "Like" }, love: { glyph: "❤️", label: "Love" }, celebrate: { glyph: "🎉", label: "Celebrate" }, insight: { glyph: "💡", label: "Insightful" }, funny: { glyph: "😂", label: "Funny" },
};
export const ORDER: Reaction[] = ["like", "love", "celebrate", "insight", "funny"];

/* the five reactions in a row — pick one, or tap yours again to take it back */
export function ReactionPicker({ mine, onPick, onClose, className }: { mine: Reaction | null; onPick: (r: Reaction | null) => void; onClose: () => void; className?: string }) {
  return (
    <div className={cn("z-20 flex gap-0.5 rounded-full border border-black/[0.08] bg-white px-1.5 py-1 shadow-lg", className)} onMouseLeave={onClose} role="menu" aria-label="React">
      {ORDER.map((r) => <button key={r} type="button" role="menuitem" onClick={() => { onPick(mine === r ? null : r); onClose(); }} title={EMOJI[r].label} className={cn("flex size-8 items-center justify-center rounded-full text-[19px] transition-transform hover:scale-125", mine === r && "bg-[#fdecf2]")}>{EMOJI[r].glyph}</button>)}
    </div>
  );
}
/* who reacted how, in short: the top three emoji and the total */
export function ReactionSummary({ reactions, className }: { reactions: Record<Reaction, number>; className?: string }) {
  const total = ORDER.reduce((a, r) => a + reactions[r], 0);
  if (!total) return null;
  const top = ORDER.filter((r) => reactions[r] > 0).sort((a, b) => reactions[b] - reactions[a]).slice(0, 3);
  return <span className={cn("inline-flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[11.5px] text-black/55 shadow-sm ring-1 ring-black/[0.06]", className)} title={top.map((r) => `${EMOJI[r].label} ${reactions[r]}`).join(" · ")}>{top.map((r) => <span key={r}>{EMOJI[r].glyph}</span>)}<span className="ml-0.5">{total}</span></span>;
}

export type ThreadItem = { id: string; parentId: string; body: string; authorId: string; authorName: string; authorRole: string; createdAt: string; isMine: boolean; reactions: Record<Reaction, number>; mine: Reaction | null };

/* one comment: the bubble, its reactions, and the actions under it */
function Item({ c, isAdmin, small, onReply, onReact, onRemove, extra, highlight }: {
  c: ThreadItem; isAdmin: boolean; small?: boolean; onReply: () => void; onReact: (r: Reaction | null) => void; onRemove: () => void; extra?: ReactNode; highlight?: boolean;
}) {
  const now = useNow();
  const [picker, setPicker] = useState(false);
  return (
    <div className="flex items-start gap-2">
      <Link href={`/dashboard/u/${c.authorId}`} className="flex-none"><Avatar name={c.authorName} admin={c.authorRole === "admin"} size={small ? 26 : 32} /></Link>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <div className="relative justify-self-start">
          <div className={cn("rounded-2xl px-3 py-2", highlight ? "bg-[#e9f7f5] ring-1 ring-[var(--bridge-teal)]/40" : "bg-[#f3f4f6]")}>
            <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-bold text-[var(--primary)]"><Link href={`/dashboard/u/${c.authorId}`} className="hover:underline">{c.authorName}</Link>{c.authorRole === "admin" ? <MentorTag /> : null}{extra}</span>
            <RichText text={c.body} className={cn("leading-5 text-[var(--primary)]", small ? "text-[13px]" : "text-[13.5px]")} />
          </div>
          <ReactionSummary reactions={c.reactions} className="absolute -bottom-2.5 right-2" />
        </div>
        <span className="relative flex flex-wrap items-center gap-3 pl-3 pt-1 text-[11.5px] font-bold text-black/45">
          <span suppressHydrationWarning className="font-normal">{ago(c.createdAt, now)}</span>
          <button type="button" onClick={() => (c.mine ? onReact(null) : setPicker((v) => !v))} className={cn("hover:underline", c.mine && "text-[var(--electric-pink)]")}>{c.mine ? `${EMOJI[c.mine].glyph} ${EMOJI[c.mine].label}` : "React"}</button>
          <button type="button" onClick={onReply} className="hover:underline">Reply</button>
          {c.isMine || isAdmin ? <button type="button" onClick={onRemove} className="hover:text-[#a3104a] hover:underline">Remove</button> : null}
          {picker ? <ReactionPicker mine={c.mine} onPick={onReact} onClose={() => setPicker(false)} className="absolute -top-11 left-10" /> : null}
        </span>
      </div>
    </div>
  );
}

/* a reply box, opened under the comment being answered */
export function ReplyBox({ me, placeholder, initial = "", autoFocus, onSend, onCancel, small }: { me: string; placeholder: string; initial?: string; autoFocus?: boolean; onSend: (body: string) => Promise<boolean>; onCancel?: () => void; small?: boolean }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; setBusy(true); void onSend(text).then((ok) => { setBusy(false); if (ok) setText(""); }); }} className="flex items-center gap-2">
      <Avatar name={me} size={small ? 26 : 30} />
      <input value={text} onChange={(e) => setText(e.target.value)} autoFocus={autoFocus} placeholder={placeholder} maxLength={2000} className="min-w-0 flex-1 rounded-full bg-[#f3f4f6] px-4 py-2 text-[13.5px] outline-none focus:bg-white focus:ring-2 focus:ring-[var(--bridge-teal)]/30" onKeyDown={(e) => { if (e.key === "Escape") onCancel?.(); }} />
      <button type="submit" disabled={busy || !text.trim()} className="flex size-9 flex-none items-center justify-center rounded-full bg-[var(--primary)] text-white disabled:opacity-40" aria-label="Send"><MaterialSymbol className="text-[17px]" name="send" /></button>
    </form>
  );
}

/* ---------- comments with their replies: threads one level deep, reactions on each ---------- */
export function CommentThread({ items, me, isAdmin, onReply, onReact, onRemove, extra, highlight, order, collapseAfter = 2 }: {
  items: ThreadItem[]; me: string; isAdmin: boolean;
  onReply: (body: string, parentId: string) => Promise<boolean>; onReact: (id: string, r: Reaction | null) => void; onRemove: (id: string) => void;
  extra?: (c: ThreadItem) => ReactNode; highlight?: (c: ThreadItem) => boolean; order?: (a: ThreadItem, b: ThreadItem) => number; collapseAfter?: number;
}) {
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [open, setOpen] = useState<string[]>([]);
  const tops = items.filter((c) => !c.parentId || !items.some((x) => x.id === c.parentId)).sort(order ?? (() => 0));
  const repliesOf = (id: string) => items.filter((c) => c.parentId === id);

  return (
    <div className="grid gap-3">
      {tops.map((c) => {
        const replies = repliesOf(c.id);
        const showAll = open.includes(c.id) || replies.length <= collapseAfter;
        const shown = showAll ? replies : replies.slice(-collapseAfter);
        const start = (to: ThreadItem) => setReplyTo({ id: c.id, name: to.authorName });
        return (
          <div key={c.id} className="grid gap-2">
            <Item c={c} isAdmin={isAdmin} onReply={() => start(c)} onReact={(r) => onReact(c.id, r)} onRemove={() => onRemove(c.id)} extra={extra?.(c)} highlight={highlight?.(c)} />
            {replies.length || replyTo?.id === c.id ? (
              <div className="ml-10 grid gap-2 border-l-2 border-black/[0.06] pl-3">
                {!showAll ? <button type="button" onClick={() => setOpen((o) => [...o, c.id])} className="flex items-center gap-1 justify-self-start text-[12px] font-bold text-black/50 hover:text-[var(--primary)]"><MaterialSymbol className="text-[16px]" name="subdirectory_arrow_right" />View {replies.length - shown.length} more repl{replies.length - shown.length === 1 ? "y" : "ies"}</button> : null}
                {shown.map((r) => <Item key={r.id} c={r} isAdmin={isAdmin} small onReply={() => start(r)} onReact={(e) => onReact(r.id, e)} onRemove={() => onRemove(r.id)} extra={extra?.(r)} highlight={highlight?.(r)} />)}
                {replyTo?.id === c.id ? <ReplyBox key={replyTo.name} me={me} small autoFocus initial={replyTo.name !== me ? `@${replyTo.name.split(" ")[0]} ` : ""} placeholder={`Reply to ${replyTo.name}…`} onSend={async (b) => { const ok = await onReply(b, c.id); if (ok) setReplyTo(null); return ok; }} onCancel={() => setReplyTo(null)} /> : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
