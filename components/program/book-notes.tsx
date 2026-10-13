"use client";

import Link from "next/link";
import { useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { HIGHLIGHT_HEX, type BookMark } from "@/lib/program/book/mark-types";
import type { BookLang } from "@/lib/program/book/types";
import { cn } from "@/lib/utils";

import { LANG_LABEL } from "./book-ui";

/* "My notes": everything a reader kept in a book — highlights, notes and bookmarks — in the book's order, grouped by
   chapter and page. Filter, search, edit a note, remove a mark, or open it in place. */
export type NotesPage = { key: string; title: string; chapter: string; code?: string };

const T = {
  en: { title: "My notes", all: "All", highlights: "Highlights", notes: "Notes", bookmarks: "Bookmarks", search: "Search your notes", empty: "Nothing kept yet. Select any text in the book to highlight it or add a note, or bookmark a page.", emptyFilter: "Nothing matches.", open: "Open", edit: "Edit note", save: "Save", cancel: "Cancel", remove: "Remove", page: "Bookmarked page", copyAll: "Copy all as text", copied: "Copied", back: "Back to the book", failed: "Couldn’t save that — try again." },
  ur: { title: "Mere notes", all: "Sab", highlights: "Highlights", notes: "Notes", bookmarks: "Bookmarks", search: "Apne notes mein dhoondein", empty: "Abhi kuch save nahi kiya. Book mein koi bhi text select kar ke highlight ya note karein, ya page bookmark karein.", emptyFilter: "Kuch nahi mila.", open: "Kholein", edit: "Note badlein", save: "Save", cancel: "Cancel", remove: "Hatayein", page: "Bookmark kiya hua page", copyAll: "Sab text ke taur par copy karein", copied: "Copy ho gaya", back: "Book par wapas", failed: "Save nahi ho saka — dobara koshish karein." },
} as const;

type Filter = "all" | "highlights" | "notes" | "bookmarks";

export function BookNotes({ bookId, bookTitle, marks: initial, pages, lang }: { bookId: string; bookTitle: string; marks: BookMark[]; pages: NotesPage[]; lang: BookLang }) {
  const t = T[lang];
  const [marks, setMarks] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ id: string; note: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const order = new Map(pages.map((p, i) => [p.key, i]));
  const pageOf = new Map(pages.map((p) => [p.key, p]));
  const count = { all: marks.length, highlights: marks.filter((m) => m.kind === "highlight" && !m.note).length, notes: marks.filter((m) => m.kind === "highlight" && !!m.note).length, bookmarks: marks.filter((m) => m.kind === "bookmark").length };
  const needle = q.trim().toLowerCase();
  const shown = marks
    .filter((m) => filter === "all" || (filter === "bookmarks" ? m.kind === "bookmark" : filter === "notes" ? m.kind === "highlight" && !!m.note : m.kind === "highlight" && !m.note))
    .filter((m) => !needle || `${m.quote} ${m.note} ${pageOf.get(m.page)?.title ?? ""}`.toLowerCase().includes(needle))
    .sort((a, b) => (order.get(a.page) ?? 999) - (order.get(b.page) ?? 999) || a.block - b.block || a.at.localeCompare(b.at));
  const groups: { chapter: string; pages: { page: NotesPage; marks: BookMark[] }[] }[] = [];
  for (const m of shown) {
    const p = pageOf.get(m.page) ?? { key: m.page, title: m.page, chapter: "" };
    let g = groups[groups.length - 1];
    if (!g || g.chapter !== p.chapter) groups.push((g = { chapter: p.chapter, pages: [] }));
    let pg = g.pages[g.pages.length - 1];
    if (!pg || pg.page.key !== p.key) g.pages.push((pg = { page: p, marks: [] }));
    pg.marks.push(m);
  }

  const call = async (url: string, init: RequestInit) => {
    const r = await fetch(url, { ...init, headers: { "content-type": "application/json" } });
    if (!r.ok) throw new Error("failed");
  };
  const save = async (id: string, note: string) => {
    setEditing(null);
    const before = marks;
    setMarks((ms) => ms.map((m) => (m.id === id ? { ...m, note } : m)));
    try { await call(`/api/book/marks/${id}`, { method: "PATCH", body: JSON.stringify({ note }) }); } catch { setMarks(before); setError(t.failed); }
  };
  const remove = async (id: string) => {
    const before = marks;
    setMarks((ms) => ms.filter((m) => m.id !== id));
    try { await call(`/api/book/marks/${id}`, { method: "DELETE" }); } catch { setMarks(before); setError(t.failed); }
  };
  const copyAll = () => {
    const text = groups.map((g) => [`# ${g.chapter}`, ...g.pages.map((p) => [`## ${p.page.title}`, ...p.marks.map((m) => (m.kind === "bookmark" ? `- ${t.page}` : `> ${m.quote}${m.note ? `\n\n${m.note}` : ""}`))].join("\n\n"))].join("\n\n")).join("\n\n");
    void navigator.clipboard.writeText(text).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); });
  };
  const href = (m: BookMark) => `/dashboard/book/${bookId}?lang=${m.lang}${m.kind === "highlight" ? `&mark=${m.id}` : ""}#${m.page}`;

  return (
    <div className="grid max-w-[980px] gap-6 rounded-[20px] bg-white px-5 py-7 ring-1 ring-black/[0.05] sm:px-8 lg:px-12">
      <header className="grid gap-3 border-b border-black/[0.07] pb-6">
        <Link href={`/dashboard/book/${bookId}`} className="flex w-fit items-center gap-1 text-[12.5px] font-semibold text-black/50 hover:text-black/80"><MaterialSymbol className="text-[16px]" name="arrow_back" />{t.back}</Link>
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-black/45">{bookTitle}</span>
        <h1 className="text-[clamp(26px,2.8vw,36px)] font-semibold leading-[1.12] tracking-[-0.022em] text-[#0d1117]">{t.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span role="tablist" className="flex flex-wrap gap-1 rounded-full bg-black/[0.05] p-0.5">
            {(["all", "highlights", "notes", "bookmarks"] as const).map((f) => (
              <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={cn("rounded-full px-3 py-1 text-[12.5px] font-semibold transition-colors", filter === f ? "bg-white text-[#0d1117] shadow-sm" : "text-black/50 hover:text-black/80")}>{t[f]} <span className="text-black/35">{count[f]}</span></button>
            ))}
          </span>
          <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-full border border-black/10 px-3 py-1.5">
            <MaterialSymbol className="text-[17px] text-black/40" name="search" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} className="w-full bg-transparent text-[13.5px] outline-none" />
          </label>
          {shown.length ? <button type="button" onClick={copyAll} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-black/55 hover:bg-black/[0.05]"><MaterialSymbol className="text-[16px]" name={copied ? "check" : "content_copy"} />{copied ? t.copied : t.copyAll}</button> : null}
        </div>
        {error ? <span role="alert" className="text-[13px] text-[#c2410c]">{error}</span> : null}
      </header>

      {!marks.length ? <p className="max-w-[640px] text-[15px] leading-[1.7] text-black/55">{t.empty}</p> : !shown.length ? <p className="text-[15px] text-black/55">{t.emptyFilter}</p> : null}

      {groups.map((g, gi) => (
        <section key={gi} className="grid gap-4">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/40">{g.chapter}</span>
          {g.pages.map((p) => (
            <div key={p.page.key} className="grid gap-3">
              <Link href={`/dashboard/book/${bookId}#${p.page.key}`} className="w-fit text-[17px] font-semibold text-[#0d1117] hover:underline hover:underline-offset-4">{p.page.code ? <span className="mr-2 font-mono text-[12px] font-normal text-black/40">{p.page.code}</span> : null}{p.page.title}</Link>
              <ul className="grid gap-3">
                {p.marks.map((m) => (
                  <li key={m.id} className="grid gap-2 rounded-2xl border border-black/[0.07] p-4">
                    {m.kind === "bookmark" ? (
                      <span className="flex items-center gap-2 text-[14px] text-black/60"><MaterialSymbol className="text-[18px] text-[#6d48d8]" name="bookmark" filled />{t.page}</span>
                    ) : (
                      <blockquote className="border-l-[3px] pl-3 text-[15px] leading-[1.65] text-[#24292f]" style={{ borderColor: HIGHLIGHT_HEX[m.color] }}><span style={{ background: `${HIGHLIGHT_HEX[m.color]}aa` }} className="box-decoration-clone px-0.5">{m.quote}</span></blockquote>
                    )}
                    {editing?.id === m.id ? (
                      <div className="grid gap-2">
                        <textarea autoFocus value={editing.note} onChange={(e) => setEditing({ id: m.id, note: e.target.value })} rows={3} maxLength={4000} className="w-full resize-y rounded-xl border border-black/10 px-3 py-2 text-[14px] leading-[1.5] outline-none focus:border-black/30" />
                        <span className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-black/55 hover:bg-black/5">{t.cancel}</button>
                          <button type="button" onClick={() => void save(m.id, editing.note)} className="rounded-lg bg-[#0d1117] px-3 py-1.5 text-[12.5px] font-semibold text-white">{t.save}</button>
                        </span>
                      </div>
                    ) : m.note ? <p className="flex gap-2 whitespace-pre-wrap text-[14.5px] leading-[1.6] text-black/70"><MaterialSymbol className="mt-0.5 shrink-0 text-[16px] text-black/35" name="sticky_note_2" />{m.note}</p> : null}
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-black/40">
                      <span>{new Date(m.at).toLocaleDateString(lang === "ur" ? "en-PK" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {m.kind === "highlight" ? <span>{LANG_LABEL[m.lang]}</span> : null}
                      <span className="ml-auto flex items-center gap-1">
                        <Link href={href(m)} className="flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-black/60 hover:bg-black/5"><MaterialSymbol className="text-[15px]" name="arrow_outward" />{t.open}</Link>
                        {m.kind === "highlight" ? <button type="button" onClick={() => setEditing({ id: m.id, note: m.note })} className="rounded-lg px-2 py-1 font-semibold text-black/60 hover:bg-black/5">{t.edit}</button> : null}
                        <button type="button" onClick={() => void remove(m.id)} className="rounded-lg px-2 py-1 font-semibold text-[#c2410c] hover:bg-[#c2410c]/10">{t.remove}</button>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
