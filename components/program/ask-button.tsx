"use client";

import { useEffect, useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";

import { NewThread, type BoardDay } from "./board-view";

/* Ask from where you are: a button that opens the board's composer in a modal, with the day and lesson filled in —
   posting keeps you on the page. */
export function AskButton({ day, dayTitle, lesson, className, children }: { day: number; dayTitle: string; lesson?: { fid: string; code: string; title: string }; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const days: BoardDay[] = [{ day, title: dayTitle, lessons: lesson ? [lesson] : [] }];
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} title="Ask on the board — a mentor or the cohort will help">{children}</button>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#0d1117]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label="Ask a question" className="grid max-h-[92vh] w-full max-w-xl gap-3 overflow-y-auto rounded-t-[22px] bg-white p-5 shadow-2xl sm:rounded-[22px]">
            <header className="flex items-start justify-between gap-3">
              <span className="grid gap-0.5">
                <b className="flex items-center gap-2 text-[18px] text-[var(--primary)]"><MaterialSymbol className="text-[22px] text-[#0284c7]" name="help" />Ask the board</b>
                <span className="text-[12.5px] text-black/50">A mentor or someone in your cohort will answer. You stay right here.</span>
              </span>
              <button type="button" onClick={() => setOpen(false)} className="flex size-8 flex-none items-center justify-center rounded-full text-black/50 hover:bg-black/[0.05]" aria-label="Close"><MaterialSymbol className="text-[20px]" name="close" /></button>
            </header>
            <NewThread fixed days={days} preset={{ day, lesson: lesson?.fid ?? "" }} onDone={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
