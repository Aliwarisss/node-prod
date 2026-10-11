"use client";

import { cn } from "@/lib/utils";

/* the small pieces the board, the feed and comments share: a person's avatar, the mentor tag, "5 min ago", and text
   as people wrote it (line breaks kept, links clickable, never HTML) */
const initialsOf = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "N";
export function ago(iso: string, now: number) {
  if (!iso || !now) return "";
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
}

/* text as written: line breaks kept, links clickable — never HTML */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return <p className={cn("whitespace-pre-wrap break-words", className)}>{parts.map((p, i) => (/^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer nofollow" className="font-semibold text-[var(--bridge-teal)] underline underline-offset-2">{p}</a> : p))}</p>;
}
export function Avatar({ name, admin, size = 34 }: { name: string; admin?: boolean; size?: number }) {
  return <span className={cn("flex flex-none items-center justify-center rounded-full font-black text-white", admin ? "bg-[var(--deep-indigo)]" : "bg-[var(--electric-pink)]")} style={{ width: size, height: size, fontSize: size * 0.36 }}>{initialsOf(name)}</span>;
}
export const MentorTag = () => <span className="rounded-full bg-[var(--deep-indigo)] px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.06em] text-white">Mentor</span>;
