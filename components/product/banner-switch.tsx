"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

/* Admin: the "under development" strip across the top of every page — on or off, and its words */
export function BannerSwitch({ initial, fallback }: { initial: { enabled: boolean; message: string }; fallback: string }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [message, setMessage] = useState(initial.message === fallback ? "" : initial.message);
  const [saved, setSaved] = useState(initial.message === fallback ? "" : initial.message);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const save = async (patch: { enabled?: boolean; message?: string }) => {
    setBusy(true); setNote("");
    const r = await fetch("/api/admin/site-banner", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).catch(() => null);
    setBusy(false);
    if (!r?.ok) { setNote((await r?.json().catch(() => null))?.error ?? "Couldn’t save — try again."); return false; }
    router.refresh(); // the strip on this page follows straight away
    return true;
  };
  const flip = async () => { const next = !enabled; setEnabled(next); if (!(await save({ enabled: next }))) setEnabled(!next); else setNote(next ? "Banner on — every page shows it." : "Banner off."); };
  const saveWords = async () => { if (await save({ message })) { setSaved(message); setNote("Message saved."); } };

  return (
    <section className="grid gap-4 rounded-[20px] border border-black/[0.06] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <span className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f2b705] text-[#0d1117]"><MaterialSymbol className="text-[20px]" name="construction" /></span>
          <span className="grid gap-0.5">
            <b className="text-[15px] text-[var(--primary)]">Development banner</b>
            <span className="text-[12.5px] leading-5 text-black/55">The thin strip across the top of every page, telling visitors Node is still being built.</span>
          </span>
        </span>
        <button type="button" role="switch" aria-checked={enabled} aria-label="Show the development banner" disabled={busy} onClick={flip}
          className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60", enabled ? "bg-[#0f766e]" : "bg-black/15")}>
          <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-[left]", enabled ? "left-6" : "left-1")} />
        </button>
      </div>

      {/* what it looks like */}
      <div className={cn("flex items-center gap-2.5 overflow-hidden rounded-xl bg-[#0d1117] px-3 py-1.5 text-[11.5px] text-white/80 transition-opacity", enabled ? "opacity-100" : "opacity-40")}>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#f2b705]/15 px-2 py-px font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#f2b705]"><span className="size-1.5 rounded-full bg-[#f2b705]" />In development</span>
        <span className="min-w-0 truncate">{message.trim() || fallback}</span>
      </div>

      <label className="grid gap-1.5">
        <span className="text-[12px] font-semibold text-black/55">Message <span className="font-normal text-black/40">— leave empty for the standard one</span></span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={240} rows={2} placeholder={fallback}
          className="resize-none rounded-xl border border-black/10 bg-[#f6f7f8] px-3 py-2 text-[13px] leading-5 outline-none focus:border-[var(--bridge-teal)]" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={saveWords} disabled={busy || message === saved} className="rounded-full bg-[var(--primary)] px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-40">Save message</button>
        {note ? <span role="status" className="text-[12.5px] text-black/55">{note}</span> : null}
      </div>
    </section>
  );
}
