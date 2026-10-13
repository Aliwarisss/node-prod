"use client";

import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Book, BookChapter } from "@/lib/program/book/types";
import { cn } from "@/lib/utils";

import type { BookUI } from "./book-ui";

/* The book's index — where it opens. The chapter (Discover) with its question, how far you've read and a way back
   in; then its introduction, the numbered topics (each with its question, its gate and its subtopics) and the
   closing. Every line opens its page. */
export function BookIndex({ book, ui, color, read, bookmarked, lastAt, titleOf, onGo }: {
  book: Book; ui: BookUI; color: string; read: string[]; bookmarked: Set<string>;
  lastAt: string; titleOf: (key: string) => string | null; onGo: (key: string) => void;
}) {
  const num = book.number ?? "1";
  const subs = book.chapters.flatMap((c) => c.sections);
  const done = subs.filter((s) => read.includes(s.id)).length;
  const minutes = subs.reduce((a, s) => a + s.minutes, 0);
  const topics = book.chapters.filter((c) => c.day);
  /* the hero counts the chapter itself; its prerequisites are listed but not counted as reading */
  const intro = book.chapters.find((c) => c.id === "opening");
  const pre = book.chapters.find((c) => c.id === "foundations");
  const ess = book.chapters.find((c) => c.id === "essence");
  const closing = book.chapters.find((c) => c.id === "closing");
  const further = book.chapters.find((c) => c.id === "reading");
  const watch = book.chapters.find((c) => c.id === "watch");
  const resume = lastAt && lastAt !== "index" ? titleOf(lastAt) : null;
  const first = book.chapters[0] ? `ch-${book.chapters[0].id}` : "";

  const subList = (c: BookChapter) => (
    <ol className="grid">
      {c.sections.map((s) => {
        const ok = read.includes(s.id);
        return (
          <li key={s.id}>
            <button type="button" onClick={() => onGo(s.id)} className="group flex w-full items-baseline gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-black/[0.03]">
              <span className="w-12 shrink-0 font-mono text-[11.5px] text-black/40">{s.code ?? ""}</span>
              <span className={cn("min-w-0 text-[14.5px] leading-snug", ok ? "text-black/45" : "text-[#0d1117] group-hover:underline group-hover:underline-offset-4")}>{s.title}</span>
              <span className="mx-1 min-w-[16px] flex-1 translate-y-[-3px] border-b border-dotted border-black/20" aria-hidden />
              {bookmarked.has(s.id) ? <MaterialSymbol className="shrink-0 text-[14px]" name="bookmark" filled style={{ color }} /> : null}
              <span className="shrink-0 font-mono text-[11px] text-black/40">{s.minutes}′</span>
              <MaterialSymbol className="w-4 shrink-0 text-[15px]" name={ok ? "check_circle" : "radio_button_unchecked"} filled={ok} style={{ color: ok ? "#0f766e" : "rgba(0,0,0,.18)" }} />
            </button>
          </li>
        );
      })}
    </ol>
  );

  const frame = (c: BookChapter, label: string, wide?: boolean) => {
    const got = c.sections.filter((s) => read.includes(s.id)).length;
    const gate = c.day ? c.kicker.split("·").pop()!.trim() : null;
    return (
      <section key={c.id} id={`idx-${c.id}`} className={cn("grid scroll-mt-28 content-start gap-3 rounded-2xl border border-black/[0.07] bg-white p-5", wide && "@4xl:col-span-2")}>
        <button type="button" onClick={() => onGo(`ch-${c.id}`)} className="group grid gap-1.5 text-left">
          <span className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color }}>{label}</span>
            {c.sections.length ? (
              <span className="flex items-center gap-2 text-[11.5px] text-black/45">
                {got}/{c.sections.length}
                <svg viewBox="0 0 36 36" className="size-6 -rotate-90" aria-hidden><circle cx="18" cy="18" r="14" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="4" /><circle cx="18" cy="18" r="14" fill="none" stroke={got === c.sections.length ? "#0f766e" : color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(got / c.sections.length) * 88} 88`} /></svg>
              </span>
            ) : null}
          </span>
          <b className="text-[21px] font-semibold leading-tight tracking-[-0.01em] text-[#0d1117] group-hover:underline group-hover:underline-offset-4">{c.title}</b>
          {c.question ? <span className="text-[14.5px] leading-[1.5] text-black/55">{c.question}</span> : null}
          {gate ? <span className="mt-0.5 flex w-fit items-center gap-1.5 rounded-full bg-[#0d1117]/[0.05] px-2.5 py-0.5 text-[11.5px] font-semibold text-black/60"><span className="size-2 rotate-45 rounded-[1px] bg-[#0d1117]" />{ui.gate}: {gate}</span> : null}
        </button>
        {c.sections.length ? <div className="border-t border-black/[0.06] pt-2">{subList(c)}</div> : null}
      </section>
    );
  };

  return (
    <div className="grid gap-8">
      {/* the chapter */}
      <div className="relative overflow-hidden rounded-[22px] px-6 py-8 text-white sm:px-10 sm:py-10" style={{ background: `radial-gradient(120% 140% at 100% 0%, ${color} 0%, #1b1530 55%, #0d1117 100%)` }}>
        <span className="pointer-events-none absolute -right-6 -top-10 select-none font-mono text-[200px] font-bold leading-none text-white/[0.06]" aria-hidden>{num}</span>
        <div className="relative grid max-w-[760px] gap-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">{ui.theBook} · {ui.chapter(num)}</span>
          <h1 className="text-[clamp(38px,5vw,64px)] font-semibold leading-[1.02] tracking-[-0.03em]">{book.title}</h1>
          <p className="text-[19px] leading-[1.5] text-white/75">{book.subtitle}</p>
          <span className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white/60">
            <span>{ui.topicsCount(topics.length)}</span><span>{ui.subtopics(subs.length)}</span><span>≈ {Math.round(minutes / 60)} h</span><span>{ui.readOf(done, subs.length)}</span>
          </span>
          <span className="mt-1 h-1.5 max-w-[420px] overflow-hidden rounded-full bg-white/15"><span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${(done / Math.max(1, subs.length)) * 100}%`, background: "#fff" }} /></span>
          <span className="mt-3 flex flex-wrap gap-2">
            {resume ? (
              <button type="button" onClick={() => onGo(lastAt)} className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0d1117] hover:bg-white/90">
                <MaterialSymbol className="text-[18px]" name="play_arrow" />{ui.continueReading}<span className="max-w-[260px] truncate font-normal text-black/55">· {resume}</span>
              </button>
            ) : null}
            <button type="button" onClick={() => onGo(first)} className={cn("flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold", resume ? "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/15" : "bg-white text-[#0d1117] hover:bg-white/90")}>
              <MaterialSymbol className="text-[18px]" name="menu_book" />{ui.startReading}
            </button>
            {ess && first !== `ch-${ess.id}` ? (
              <button type="button" onClick={() => onGo(`ch-${ess.id}`)} className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white ring-1 ring-white/25 hover:bg-white/15">
                <MaterialSymbol className="text-[18px]" name="auto_awesome" />{ui.readEssence}
              </button>
            ) : null}
            {book.talks?.length ? (
              <Link href={`/dashboard/vlog/${book.id}`} className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white ring-1 ring-white/25 hover:bg-white/15">
                <MaterialSymbol className="text-[18px]" name="smart_display" />{ui.watchVlog}
              </Link>
            ) : null}
          </span>
        </div>
      </div>

      {/* the index */}
      <div className="@container grid gap-4">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-black/40">{ui.index}</span>
        <div className="grid gap-4 @4xl:grid-cols-2">
          {ess ? frame(ess, ui.essence, true) : null}
          {pre ? frame(pre, ui.prerequisites, true) : null}
          {intro ? frame(intro, ui.introduction, true) : null}
          {topics.map((c) => frame(c, ui.topic(`${num}.${c.day}`)))}
          {closing ? frame(closing, ui.closing, topics.length % 2 === 0) : null}
          {watch ? frame(watch, ui.watch, false) : null}
          {further ? frame(further, ui.furtherReading, !watch) : null}
        </div>
      </div>
    </div>
  );
}
