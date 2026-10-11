"use client";

import { useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

/* "Now & next" (the current stage in depth) or the full map of the month */
export function MapSwitch({ focus, full, stats, startFull = false }: { focus: ReactNode; full: ReactNode; stats?: ReactNode; startFull?: boolean }) {
  const [view, setView] = useState<"focus" | "full">(startFull ? "full" : "focus");
  const tab = (id: "focus" | "full", icon: string, text: string) => (
    <button type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)} className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors", view === id ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/60 hover:text-[var(--primary)]")}>
      <MaterialSymbol className="text-[16px]" name={icon} />{text}
    </button>
  );
  return (
    <section className="grid w-full gap-2">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <h2 className="font-heading text-[15px] font-black uppercase tracking-[-0.02em] text-[var(--primary)]">{view === "focus" ? "Where you stand" : "The full map"}</h2>
        {stats ? <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">{stats}</div> : <span className="flex-1" />}
        <div className="flex gap-1 rounded-full bg-[#eceef0] p-1" role="tablist" aria-label="Map view">
          {tab("focus", "my_location", "Now & next")}
          {tab("full", "map", "See the full map")}
        </div>
      </div>
      {view === "focus" ? focus : full}
    </section>
  );
}
