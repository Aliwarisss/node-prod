"use client";

import { useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Book, Talk, TalkPart } from "@/lib/program/book/types";
import { cn } from "@/lib/utils";

import { useReader } from "./book-context";

/* Talks, cut into the parts that matter for Discover. Each part is a stretch of a YouTube video (start → end) with what's
   said in it and the subtopics it serves. The page has a player that plays a part as a clip, and a list you can read
   by topic or by talk; a subtopic shows its own parts in a small box. */
const ts = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const embed = (id: string, p: TalkPart, auto: boolean) => `https://www.youtube-nocookie.com/embed/${id}?start=${Math.floor(p.start)}&end=${Math.ceil(p.end)}&autoplay=${auto ? 1 : 0}&rel=0&modestbranding=1`;
type Ref = { talk: Talk; i: number };

function Player({ r, auto, onPlay }: { r: Ref; auto: boolean; onPlay: () => void }) {
  const { ui } = useReader();
  const p = r.talk.parts[r.i];
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#0d1117] shadow-[0_12px_40px_rgba(0,0,0,.18)]">
      {auto ? (
        <iframe key={`${r.talk.id}-${p.start}`} className="absolute inset-0 h-full w-full" src={embed(r.talk.id, p, true)} title={`${r.talk.title} — ${p.title}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
        <button type="button" onClick={onPlay} aria-label={`${ui.playPart}: ${p.title}`} className="group/v absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://i.ytimg.com/vi/${r.talk.id}/hqdefault.jpg)` }}>
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white/95 py-2 pl-2.5 pr-4 text-[13.5px] font-semibold text-[#0d1117] shadow-lg transition-transform group-hover/v:scale-105">
            <MaterialSymbol className="text-[26px] text-[#d81b60]" name="play_circle" filled />{ui.playPart} · {ts(p.start)}–{ts(p.end)}
          </span>
          <span className="absolute inset-x-4 bottom-3 truncate text-left text-[13px] font-semibold text-white">{p.title}</span>
        </button>
      )}
    </div>
  );
}

function PartRow({ r, on, onClick, showTalk }: { r: Ref; on: boolean; onClick: () => void; showTalk: boolean }) {
  const { color } = useReader();
  const p = r.talk.parts[r.i];
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn("grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors", on ? "bg-white shadow-sm ring-1 ring-black/10" : "hover:bg-white/70")}>
      <span className="mt-0.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold text-white" style={{ background: on ? color : "#0d1117" }}>
        <MaterialSymbol className="text-[13px]" name={on ? "graphic_eq" : "play_arrow"} />{ts(p.start)}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <b className="text-[14px] leading-snug text-[#0d1117]">{p.title}</b>
        {showTalk ? <span className="truncate text-[12px] text-black/50">{r.talk.title} · {r.talk.by}</span> : null}
        <span className="line-clamp-2 text-[12.5px] leading-[1.5] text-black/60">{p.what}</span>
      </span>
    </button>
  );
}

export function TalksView({ book }: { book: Book }) {
  const { ui, color, goTo } = useReader();
  const talks = book.talks ?? [];
  const sections = new Map(book.chapters.flatMap((c) => c.sections.map((s) => [s.id, { s, c }] as const)));
  const topics = book.chapters.filter((c) => c.day);
  const topicOf = (id: string) => sections.get(id)?.c.id;
  const all: Ref[] = talks.flatMap((talk) => talk.parts.map((_, i) => ({ talk, i })));
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<"topic" | "talk">("topic");
  const [cur, setCur] = useState<Ref | null>(all[0] ?? null);
  const [auto, setAuto] = useState(false);
  if (!cur) return null;
  const shown = all.filter((r) => filter === "all" || r.talk.parts[r.i].for.some((id) => topicOf(id) === filter));
  const idx = shown.findIndex((r) => r.talk.id === cur.talk.id && r.i === cur.i);
  const play = (r: Ref) => { setCur(r); setAuto(true); };
  const p = cur.talk.parts[cur.i];
  const totalMin = Math.round(all.reduce((a, r) => a + (r.talk.parts[r.i].end - r.talk.parts[r.i].start), 0) / 60);

  return (
    <div className="@container grid gap-5" data-nohl>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[12.5px] text-black/50">{ui.partsCount(all.length, talks.length, totalMin)}</span>
        {[["all", ui.allTopics] as const, ...topics.map((c) => [c.id, `${book.number ?? "1"}.${c.day}`] as const)].map(([id, l]) => {
          const n = id === "all" ? all.length : all.filter((r) => r.talk.parts[r.i].for.some((s) => topicOf(s) === id)).length;
          return <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={cn("rounded-full px-3 py-1 text-[12px] font-semibold transition-colors", filter === id ? "text-white" : "bg-black/[0.05] text-black/60 hover:bg-black/[0.08]")} style={filter === id ? { background: color } : undefined}>{l} <span className="opacity-60">{n}</span></button>;
        })}
        <span className="ml-auto flex rounded-full bg-black/[0.05] p-0.5">
          {(["topic", "talk"] as const).map((v) => <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={cn("rounded-full px-3 py-1 text-[12px] font-semibold", view === v ? "bg-white text-[#0d1117] shadow-sm" : "text-black/50")}>{v === "topic" ? ui.byTopic : ui.byTalk}</button>)}
        </span>
      </div>

      <div className="grid items-start gap-6 @4xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* the player */}
        <div className="grid gap-3 @4xl:sticky @4xl:top-[calc(var(--nb,0px)+96px)]">
          <Player r={cur} auto={auto} onPlay={() => setAuto(true)} />
          <div className="grid gap-1.5 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
            <span className="flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color }}><MaterialSymbol className="text-[15px]" name="smart_display" />{ui.nowPlaying} · {ts(p.start)}–{ts(p.end)}</span>
            <b className="text-[17px] leading-snug text-[#0d1117]">{p.title}</b>
            <span className="text-[12.5px] text-black/50">{cur.talk.title} · {cur.talk.by} · {cur.talk.source}{cur.talk.year ? ` · ${cur.talk.year}` : ""}</span>
            <p className="text-[14px] leading-[1.6] text-[#24292f]">{p.what}</p>
            <span className="flex flex-wrap items-center gap-1.5 pt-1">
              {p.for.map((id) => { const x = sections.get(id); return x ? <button key={id} type="button" onClick={() => goTo(id)} className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11.5px] text-black/60 hover:bg-black/[0.08] hover:text-black">{x.s.code} {x.s.title}</button> : null; })}
            </span>
            <span className="mt-1 flex items-center gap-2">
              <button type="button" disabled={idx <= 0} onClick={() => play(shown[idx - 1])} className="flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold text-black/60 ring-1 ring-black/10 hover:bg-black/[0.04] disabled:opacity-35"><MaterialSymbol className="text-[15px]" name="skip_previous" />{ui.prevPart}</button>
              <button type="button" disabled={idx < 0 || idx >= shown.length - 1} onClick={() => play(shown[idx + 1])} className="flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold text-white disabled:opacity-35" style={{ background: color }}>{ui.nextPart}<MaterialSymbol className="text-[15px]" name="skip_next" /></button>
              <a href={`https://www.youtube.com/watch?v=${cur.talk.id}&t=${Math.floor(p.start)}s`} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-black/50 hover:text-black/80">YouTube<MaterialSymbol className="text-[14px]" name="arrow_outward" /></a>
            </span>
          </div>
        </div>

        {/* the parts */}
        <div className="grid gap-5">
          {view === "topic"
            ? topics.filter((c) => filter === "all" || c.id === filter).map((c) => {
                const rows = shown.filter((r) => r.talk.parts[r.i].for.some((s) => topicOf(s) === c.id));
                if (!rows.length) return null;
                return (
                  <section key={c.id} className="grid gap-1.5">
                    <span className="flex items-baseline gap-2 px-1"><span className="font-mono text-[11px] font-bold" style={{ color }}>{book.number ?? "1"}.{c.day}</span><b className="text-[15px] text-[#0d1117]">{c.title}</b><span className="text-[11.5px] text-black/40">{rows.length}</span></span>
                    {rows.map((r) => <PartRow key={`${c.id}-${r.talk.id}-${r.i}`} r={r} showTalk on={r.talk.id === cur.talk.id && r.i === cur.i} onClick={() => play(r)} />)}
                  </section>
                );
              })
            : talks.map((t) => {
                const rows = shown.filter((r) => r.talk.id === t.id);
                if (!rows.length) return null;
                return (
                  <section key={t.id} className="grid gap-1.5">
                    <span className="grid px-1"><b className="text-[15px] leading-snug text-[#0d1117]">{t.title}</b><span className="text-[11.5px] text-black/45">{t.by} · {t.source}{t.year ? ` · ${t.year}` : ""} · {ts(t.length)}</span></span>
                    {rows.map((r) => <PartRow key={`${t.id}-${r.i}`} r={r} showTalk={false} on={r.talk.id === cur.talk.id && r.i === cur.i} onClick={() => play(r)} />)}
                  </section>
                );
              })}
        </div>
      </div>
    </div>
  );
}

/* a subtopic's own parts: a list, and a player that opens in place */
export function TalkClips({ book, sectionId }: { book: Book; sectionId: string }) {
  const rows: Ref[] = (book.talks ?? []).flatMap((talk) => talk.parts.map((p, i) => ({ talk, i, p })).filter((x) => x.p.for.includes(sectionId)).map(({ talk, i }) => ({ talk, i })));
  const [cur, setCur] = useState<Ref | null>(null);
  if (!rows.length) return null;
  return (
    <div className="@container grid gap-3 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-nohl>
      <div className="grid content-start gap-1">
        {rows.map((r) => <PartRow key={`${r.talk.id}-${r.i}`} r={r} showTalk on={!!cur && cur.talk.id === r.talk.id && cur.i === r.i} onClick={() => setCur(r)} />)}
      </div>
      {cur ? <Player r={cur} auto onPlay={() => {}} /> : <Player r={rows[0]} auto={false} onPlay={() => setCur(rows[0])} />}
    </div>
  );
}
