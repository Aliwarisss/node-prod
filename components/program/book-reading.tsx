"use client";

import { useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Book, ReadingItem, ReadingKind } from "@/lib/program/book/types";

import { useReader } from "./book-context";

/* Curated resources: a card per article, blog post, video, free course or book, or GitHub repository — who made it,
   where, why it's worth the time, and the subtopics it serves (click to open them). Links open the original in a new
   tab; YouTube talks can also play right in the card. Compact cards sit at the end of a subtopic. */
const KIND: Record<ReadingKind, { icon: string; tint: string }> = {
  article: { icon: "article", tint: "" },
  blog: { icon: "edit_note", tint: "#0f766e" },
  video: { icon: "play_circle", tint: "#d81b60" },
  learn: { icon: "school", tint: "#c2410c" },
  repo: { icon: "code", tint: "#0d1117" },
};
const youTubeId = (u: string) => { try { const x = new URL(u); return x.hostname.endsWith("youtube.com") ? x.searchParams.get("v") : x.hostname === "youtu.be" ? x.pathname.slice(1) : null; } catch { return null; } };
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

function Video({ id, title }: { id: string; title: string }) {
  const { ui } = useReader();
  const [on, setOn] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-[#0d1117]">
      {on ? (
        <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
      ) : (
        <button type="button" onClick={() => setOn(true)} aria-label={`${ui.watchHere}: ${title}`} className="group/v absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)` }}>
          <span className="absolute inset-0 bg-black/25 transition-colors group-hover/v:bg-black/10" />
          <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white/95 py-1.5 pl-2 pr-3.5 text-[12.5px] font-semibold text-[#0d1117] shadow-lg transition-transform group-hover/v:scale-105">
            <MaterialSymbol className="text-[22px] text-[#d81b60]" name="play_circle" filled />{ui.watchHere}
          </span>
        </button>
      )}
    </div>
  );
}

export function ReadingCards({ book, items, compact }: { book: Book; items: ReadingItem[]; compact?: boolean }) {
  const { ui, color, goTo } = useReader();
  const sections = new Map(book.chapters.flatMap((c) => c.sections.map((s) => [s.id, s] as const)));
  const label: Record<ReadingKind, string> = { article: ui.article, blog: ui.blog, video: ui.video, learn: ui.learn, repo: ui.repo };
  return (
    <div className="grid gap-3 @3xl:grid-cols-2" data-nohl>
      {items.map((r) => {
        const k = KIND[r.kind], tint = k.tint || color, yt = r.kind === "video" ? youTubeId(r.url) : null;
        return (
          <article key={r.url} className="group grid content-start gap-2 rounded-2xl border border-black/[0.08] bg-white p-4 transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,.08)]">
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em]" style={{ background: `${tint}14`, color: tint }}>
                <MaterialSymbol className="text-[13px]" name={k.icon} />{label[r.kind]}
              </span>
              <span className="truncate font-mono text-[10.5px] text-black/35">{r.meta ?? host(r.url)}</span>
            </span>
            {yt && !compact ? <Video id={yt} title={r.title} /> : null}
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-[16px] font-semibold leading-snug text-[#0d1117] hover:underline hover:underline-offset-4">
              {r.kind === "repo" ? <MaterialSymbol className="mt-0.5 shrink-0 text-[17px] text-black/50" name="folder_code" /> : null}
              {r.title}<MaterialSymbol className="mt-0.5 shrink-0 text-[15px] text-black/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" name="arrow_outward" />
            </a>
            <span className="text-[12.5px] text-black/50">{r.by} · {r.source}{r.year ? ` · ${r.year}` : ""}</span>
            <p className={compact ? "text-[13px] leading-[1.55] text-black/60" : "text-[14px] leading-[1.6] text-[#24292f]"}>{r.why}</p>
            {!compact ? (
              <span className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11.5px] text-black/40">{ui.usefulFor}:</span>
                {r.for.map((id) => {
                  const s = sections.get(id);
                  return s ? <button key={id} type="button" onClick={() => goTo(id)} className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11.5px] text-black/60 hover:bg-black/[0.08] hover:text-black">{s.code} {s.title}</button> : null;
                })}
              </span>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
