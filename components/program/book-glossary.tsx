"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { BookLang, GlossaryEntry } from "@/lib/program/book/types";
import { cn } from "@/lib/utils";

/* The book's glossary: every key term, A–Z, with its meaning and the page that explains it. Search, or jump by letter;
   #<term> opens on a term. */
const T = {
  en: { title: "Glossary", lead: (n: number) => `${n} terms used in this book, each with the page that explains it.`, search: "Find a term", none: "No term matches.", in: "Explained in", back: "Back to the book" },
  ur: { title: "Glossary", lead: (n: number) => `Is book mein ${n} terms, har ek us page ke saath jahan uski wazahat hai.`, search: "Term dhoondein", none: "Koi term nahi mila.", in: "Wazahat yahan", back: "Book par wapas" },
} as const;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const Bold = ({ text }: { text: string }) => <>{text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <strong key={i} className="font-semibold text-[#0d1117]">{p.slice(2, -2)}</strong> : <Fragment key={i}>{p.replace(/\*/g, "")}</Fragment>))}</>;

export function BookGlossary({ bookId, bookTitle, entries, titles, lang, color }: { bookId: string; bookTitle: string; entries: GlossaryEntry[]; titles: Record<string, string>; lang: BookLang; color: string }) {
  const t = T[lang];
  const [q, setQ] = useState("");
  const [on, setOn] = useState("");
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (!h) return;
      setOn(h);
      document.getElementById(h)?.scrollIntoView({ block: "center" });
    });
    return () => window.cancelAnimationFrame(id);
  }, []);
  const needle = q.trim().toLowerCase();
  const shown = entries.filter((e) => !needle || e.term.toLowerCase().includes(needle) || e.def.toLowerCase().includes(needle));
  const letter = (e: GlossaryEntry) => (/[a-z]/i.test(e.term[0]) ? e.term[0].toUpperCase() : "#");
  const letters = [...new Set(entries.map(letter))];
  const have = new Set(shown.map(letter));

  return (
    <div className="grid max-w-[980px] gap-6 rounded-[20px] bg-white px-5 py-7 ring-1 ring-black/[0.05] sm:px-8 lg:px-12">
      <header className="grid gap-3 border-b border-black/[0.07] pb-6">
        <Link href={`/dashboard/book/${bookId}`} className="flex w-fit items-center gap-1 text-[12.5px] font-semibold text-black/50 hover:text-black/80"><MaterialSymbol className="text-[16px]" name="arrow_back" />{t.back}</Link>
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-black/45">{bookTitle}</span>
        <h1 className="text-[clamp(26px,2.8vw,36px)] font-semibold leading-[1.12] tracking-[-0.022em] text-[#0d1117]">{t.title}</h1>
        <p className="text-[15px] text-black/55">{t.lead(entries.length)}</p>
        <label className="flex max-w-[420px] items-center gap-2 rounded-full border border-black/10 px-3 py-1.5">
          <MaterialSymbol className="text-[17px] text-black/40" name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} className="w-full bg-transparent text-[13.5px] outline-none" />
        </label>
        <nav aria-label="A–Z" className="flex flex-wrap gap-1">
          {letters.map((l) => <a key={l} href={`#letter-${l}`} aria-disabled={!have.has(l)} className={cn("flex size-7 items-center justify-center rounded-md font-mono text-[12px] font-bold", have.has(l) ? "text-black/60 hover:bg-black/[0.05]" : "pointer-events-none text-black/20")}>{l}</a>)}
        </nav>
      </header>

      {!shown.length ? <p className="text-[15px] text-black/55">{t.none}</p> : null}
      <dl className="grid">
        {shown.map((e, i) => {
          const first = i === 0 || letter(shown[i - 1]) !== letter(e);
          const id = slug(e.term);
          return (
            <Fragment key={e.term}>
              {first ? <span id={`letter-${letter(e)}`} className="scroll-mt-28 pb-1 pt-5 font-mono text-[13px] font-bold" style={{ color }}>{letter(e)}</span> : null}
              <div id={id} className={cn("grid scroll-mt-32 gap-1 border-b border-black/[0.06] py-3.5 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6", on === id && "-mx-3 rounded-xl bg-[#fff8db] px-3")}>
                <dt className="text-[15px] font-semibold text-[#0d1117]">{e.term}</dt>
                <dd className="grid gap-1.5">
                  <span className="text-[15px] leading-[1.65] text-[#24292f]"><Bold text={e.def} /></span>
                  <Link href={`/dashboard/book/${bookId}#${e.at}`} className="flex w-fit items-center gap-1 text-[12.5px] font-semibold text-black/45 hover:text-black/80"><MaterialSymbol className="text-[14px]" name="menu_book" />{t.in}: {titles[e.at] ?? e.chapter}</Link>
                </dd>
              </div>
            </Fragment>
          );
        })}
      </dl>
    </div>
  );
}
