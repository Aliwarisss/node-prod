"use client";

import { useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Template } from "@/lib/program";
import type { WorkspaceDocView } from "@/lib/program/submissions";
import { cn } from "@/lib/utils";

import { LivingDoc, formatOf } from "./living-doc";
import { kicker } from "./program-ui";

type Item = WorkspaceDocView & { template: Template | null; status: string; used: { day: number; lesson: string }[] };
const GROUPS: { id: string; label: string; icon: string; test: (i: Item) => boolean }[] = [
  { id: "logs", label: "Lists, logs & registers", icon: "checklist", test: (i) => i.fmt === "sheet" },
  { id: "boards", label: "Technique boards", icon: "sticky_note_2", test: (i) => i.ref.startsWith("knowledge:") },
  { id: "canvas", label: "Canvases & maps", icon: "dashboard", test: (i) => i.fmt === "canvas" && !i.ref.startsWith("knowledge:") },
  { id: "forms", label: "Forms & records", icon: "edit_note", test: (i) => i.fmt === "form" && !i.ref.startsWith("knowledge:") },
  { id: "docs", label: "Documents", icon: "article", test: (i) => i.fmt === "doc" && !i.ref.startsWith("lesson:") },
  { id: "mail", label: "Messages & packs", icon: "mail", test: (i) => i.fmt === "message" || i.fmt === "pack" },
  { id: "briefs", label: "Briefs & lesson work", icon: "gavel", test: (i) => i.ref.startsWith("lesson:") },
];
const STATUS: Record<string, [string, string]> = { submitted: ["In review", "bg-[#e8f1fb] text-[#075985]"], approved: ["Approved", "bg-[#e6f3f3] text-[#005a5a]"], changes: ["Fix", "bg-[#fdecf2] text-[#8a0f3f]"], draft: ["Draft", "bg-[#f1f2f3] text-black/60"] };

/* The trainee's workspace: every living document they keep through the month — logs and registers that grow row by
   row, canvases, forms, documents — always open, always the latest version. Each lesson's task adds to them. */
export function WorkspaceView({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [sel, setSel] = useState(initial[0]?.ref ?? null);
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<string>("all");
  const shown = useMemo(() => items.filter((i) => (only === "all" || i.status === only) && (!q || `${i.title} ${i.text}`.toLowerCase().includes(q.toLowerCase()))), [items, q, only]);
  /* how many stand where in review — work sent back first */
  const tally = (["changes", "submitted", "approved", "draft"] as const).map((s) => [s, items.filter((i) => i.status === s).length] as const).filter(([, n]) => n);
  const cur = items.find((i) => i.ref === sel) ?? null;

  if (!items.length) {
    return (
      <section className="grid justify-items-center gap-3 rounded-[24px] border border-black/[0.06] bg-white p-10 text-center">
        <MaterialSymbol className="text-[36px] text-black/25" name="inventory_2" />
        <h1 className="text-[20px] font-bold text-[var(--primary)]">No submissions yet</h1>
        <p className="max-w-md text-[14px] text-[var(--on-surface-variant)]">Every log, register, canvas and document you build in a lesson’s <b>Do it</b> step lands here with its review status — and stays here, so you can keep adding to it all month.</p>
      </section>
    );
  }
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Submissions</span>
          <h1 className="text-[22px] font-bold leading-tight text-[var(--primary)]">Everything you’re building and handing in</h1>
          <p className="max-w-2xl text-[13.5px] text-[var(--on-surface-variant)]">Living documents for your project, with where each stands in review. Lessons add to them; open and update them any time. What you submitted is kept as a snapshot.</p>
          {tally.length ? (
            <span className="flex flex-wrap gap-1.5 pt-1.5" role="group" aria-label="Filter by review status">
              <button type="button" onClick={() => setOnly("all")} aria-pressed={only === "all"} className={cn("rounded-full px-3 py-1 text-[12px] font-bold", only === "all" ? "bg-[var(--primary)] text-white" : "bg-white text-black/55 ring-1 ring-black/10")}>All · {items.length}</button>
              {tally.map(([s, n]) => (
                <button key={s} type="button" onClick={() => setOnly(only === s ? "all" : s)} aria-pressed={only === s} className={cn("rounded-full px-3 py-1 text-[12px] font-bold", only === s ? "ring-2 ring-[var(--primary)]" : "", STATUS[s][1])}>{STATUS[s][0]} · {n}</button>
              ))}
            </span>
          ) : null}
        </div>
        <label className="flex items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-black/10"><MaterialSymbol className="text-[18px] text-black/40" name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your documents" className="w-56 bg-transparent text-[13px] outline-none" /></label>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <nav className="grid content-start gap-3" aria-label="Documents">
          {GROUPS.map((g) => {
            const list = shown.filter(g.test);
            if (!list.length) return null;
            return (
              <div key={g.id} className="grid gap-1">
                <span className={cn(kicker, "flex items-center gap-1.5 px-1 text-[9.5px] text-black/45")}><MaterialSymbol className="text-[14px]" name={g.icon} />{g.label} · {list.length}</span>
                {list.map((i) => {
                  const f = formatOf(i.template);
                  const st = STATUS[i.status];
                  return (
                    <button key={i.ref} type="button" onClick={() => setSel(i.ref)} className={cn("grid gap-0.5 rounded-xl border bg-white px-3 py-2 text-left transition-colors", sel === i.ref ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/10" : "border-black/[0.07] hover:border-black/20")}>
                      <span className="flex items-center gap-1.5"><MaterialSymbol className="text-[16px] text-black/45" name={f.icon} /><b className="min-w-0 flex-1 truncate text-[13px] text-[var(--primary)]">{i.title || i.ref}</b>{st ? <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", st[1])}>{st[0]}</span> : null}</span>
                      <span suppressHydrationWarning className="truncate text-[11.5px] text-black/45">{`${i.used.length ? `Day ${i.used.map((u) => u.day).filter((v, k, a) => a.indexOf(v) === k).join(", ")} · ` : ""}updated ${i.updatedAt ? new Date(i.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}`}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        {cur ? (
          <section className="grid gap-3 rounded-2xl border border-black/[0.06] bg-white p-5">
            <div className="grid gap-0.5">
              <b className="text-[18px] text-[var(--primary)]">{cur.title || cur.ref}</b>
              {cur.template ? <span className="text-[12.5px] text-[var(--on-surface-variant)]">{cur.template.what}</span> : null}
              {cur.used.length ? <span className="text-[12px] text-black/45">Built in: {cur.used.map((u) => `Day ${u.day} · ${u.lesson}`).filter((v, k, a) => a.indexOf(v) === k).join(" · ")}</span> : null}
            </div>
            <LivingDoc key={cur.ref} docRef={cur.ref} t={cur.template} title={cur.title} initial={cur} onSaved={(d) => setItems((all) => all.map((x) => (x.ref === d.ref ? { ...x, ...d } : x)))} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
