"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { ReelItem } from "@/lib/program/book/reel";
import { cn } from "@/lib/utils";

import { useReader } from "./book-context";

/* The vlog's clips for this part of the book, placed where the vlog plays them (after the key ideas). Each one opens in a
   modal that plays just that part — from its start to its end — with the way into the vlog at the same moment. */
export type VlogRef = ReelItem & { at: number }; // at: where the piece sits in the vlog's programme (seconds)
const clock = (s: number) => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`; };
const W = {
  en: { title: "From the vlog", watch: "Watch this part", inVlog: "Open in the vlog", community: "Community pick", close: "Close", prev: "Previous", next: "Next", of: (a: number, n: number) => `${a} of ${n}` },
  ur: { title: "Vlog se", watch: "Yeh hissa dekhein", inVlog: "Vlog mein kholein", community: "Community ka chuna", close: "Band karein", prev: "Pichhla", next: "Agla", of: (a: number, n: number) => `${n} mein se ${a}` },
};

export function VlogRefs({ refs, vlogPath }: { refs: VlogRef[]; vlogPath: string }) {
  const { ui, color } = useReader();
  const w = ui.prevPart === "Pichhla" ? W.ur : W.en;
  const [open, setOpen] = useState<number | null>(null);
  if (!refs.length) return null;
  return (
    <section className="mx-auto grid w-full max-w-[1160px] gap-2 rounded-2xl border border-black/[0.08] bg-[#fafafa] p-3" data-nohl>
      <span className="flex items-center gap-1.5 px-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/50"><MaterialSymbol className="text-[15px] text-[#ff0033]" name="smart_display" filled />{w.title}</span>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {refs.map((r, k) => (
          <button key={r.key} type="button" onClick={() => setOpen(k)} className="group grid w-[248px] shrink-0 gap-1.5 rounded-xl p-1.5 text-left transition-colors hover:bg-black/[0.04]">
            <span className="relative aspect-video overflow-hidden rounded-lg bg-black bg-cover bg-center" style={{ backgroundImage: `url(https://i.ytimg.com/vi/${r.video!.id}/mqdefault.jpg)` }}>
              <span className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover:bg-black/30"><span className="flex size-10 items-center justify-center rounded-full bg-[#ff0033] text-white opacity-90 shadow-lg transition-transform group-hover:scale-110"><MaterialSymbol className="text-[24px]" name="play_arrow" filled /></span></span>
              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 font-mono text-[10.5px] font-semibold text-white">{clock(r.dur)}</span>
              {r.community ? <span className="absolute left-1 top-1 rounded bg-[#3b82f6] px-1 text-[9.5px] font-bold uppercase text-white">community</span> : null}
            </span>
            <b className="line-clamp-2 text-[13px] leading-[1.3] text-[#0f0f0f]">{r.title}</b>
            <span className="truncate text-[11.5px] text-black/50">{r.by} · {clock(r.video!.start)}–{clock(r.video!.end)}</span>
          </button>
        ))}
      </div>
      {open !== null && typeof document !== "undefined" ? createPortal(<ClipModal refs={refs} at={open} onAt={setOpen} onClose={() => setOpen(null)} vlogPath={vlogPath} color={color} w={w} />, document.body) : null}
    </section>
  );
}

function ClipModal({ refs, at, onAt, onClose, vlogPath, color, w }: { refs: VlogRef[]; at: number; onAt: (n: number) => void; onClose: () => void; vlogPath: string; color: string; w: (typeof W)["en"] }) {
  const r = refs[at];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight" && at < refs.length - 1) onAt(at + 1); if (e.key === "ArrowLeft" && at > 0) onAt(at - 1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, refs.length, onAt, onClose]);
  const v = r.video!;
  return (
    <div className="fixed inset-0 z-[220] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={r.title} onClick={onClose}>
      <div className="grid w-[min(980px,100%)] gap-3 overflow-hidden rounded-2xl bg-[#0f0f0f] text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-video bg-black">
          <iframe key={r.key} className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${v.id}?start=${Math.floor(v.start)}&end=${Math.ceil(v.end)}&autoplay=1&rel=0&modestbranding=1`} title={r.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        </div>
        <div className="grid gap-2 px-5 pb-5">
          <span className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/55">
            {r.section ? <span>{r.section.code} · {r.section.title}</span> : null}
            <span>· {clock(v.start)}–{clock(v.end)}</span>
            {r.community ? <span className="rounded bg-[#3b82f6] px-1.5 text-white">{w.community}</span> : null}
          </span>
          <b className="text-[19px] leading-snug">{r.title}</b>
          <span className="text-[13px] text-white/60">{r.by}{r.source ? ` · ${r.source}` : ""}</span>
          {r.text ? <p className="text-[14px] leading-[1.6] text-white/80">{r.text}</p> : null}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {refs.length > 1 ? (
              <>
                <button type="button" disabled={at === 0} onClick={() => onAt(at - 1)} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold hover:bg-white/20 disabled:opacity-35"><MaterialSymbol className="text-[17px]" name="skip_previous" />{w.prev}</button>
                <button type="button" disabled={at === refs.length - 1} onClick={() => onAt(at + 1)} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold hover:bg-white/20 disabled:opacity-35">{w.next}<MaterialSymbol className="text-[17px]" name="skip_next" /></button>
                <span className="text-[12px] text-white/45">{w.of(at + 1, refs.length)}</span>
              </>
            ) : null}
            <Link href={`${vlogPath}#k=${encodeURIComponent(r.key)}`} className={cn("ml-auto flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold text-white")} style={{ background: color }}>
              <MaterialSymbol className="text-[17px]" name="smart_display" />{w.inVlog} · {clock(r.at)}
            </Link>
            <button type="button" onClick={onClose} aria-label={w.close} className="flex size-9 items-center justify-center rounded-full hover:bg-white/10"><MaterialSymbol className="text-[22px]" name="close" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
