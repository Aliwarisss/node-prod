"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { KnowledgeEntry, LensEntry, Lookups, Refs } from "@/lib/program";
import { cn } from "@/lib/utils";

import { TemplateBody, templateMarkdown, templateTitle } from "./template-view";

export const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";

/* ---------- detail drawer: a template, a knowledge entry or a lens, opened from anywhere in the player ---------- */
export type Detail = { kind: "template" | "knowledge" | "lens"; id: string } | null;
type Ctx = { lookups: Lookups; open: (d: Detail) => void };
const DetailCtx = createContext<Ctx | null>(null);
export const useDetail = () => useContext(DetailCtx)!;

export function DetailProvider({ lookups, children }: { lookups: Lookups; children: ReactNode }) {
  const [detail, setDetail] = useState<Detail>(null);
  return (
    <DetailCtx.Provider value={{ lookups, open: setDetail }}>
      {children}
      {detail ? <DetailDrawer detail={detail} lookups={lookups} onClose={() => setDetail(null)} /> : null}
    </DetailCtx.Provider>
  );
}

/* ---------- chips that link a name to its template / knowledge entry / lens ---------- */
const chipBase = "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-0.5 text-left text-[12px] font-semibold leading-snug transition-colors";

export function ArtifactChip({ name, template }: { name: string; template: string | null | undefined }) {
  const { lookups, open } = useDetail();
  return template && lookups.templates[template] ? (
    <button type="button" onClick={() => open({ kind: "template", id: template })} className={cn(chipBase, "border-[#007373]/30 bg-[#f0f7f7] text-[#005a5a] hover:border-[#007373]")} title="Open the template">
      <MaterialSymbol className="text-[15px]" name="description" /><span className="truncate">{name}</span>
    </button>
  ) : (
    <span className={cn(chipBase, "border-black/10 text-[var(--primary)]")}><MaterialSymbol className="text-[15px]" name="description" /><span className="truncate">{name}</span></span>
  );
}

export function KnowledgeChip({ name, refId }: { name: string; refId: string | null | undefined }) {
  const { lookups, open } = useDetail();
  return refId && lookups.knowledge[refId] ? (
    <button type="button" onClick={() => open({ kind: "knowledge", id: refId })} className={cn(chipBase, "border-[#6d48d8]/25 bg-[#f5f2fd] text-[#4a2fa8] hover:border-[#6d48d8]")} title="What is this?">
      <MaterialSymbol className="text-[15px]" name="lightbulb" /><span className="truncate">{name}</span>
    </button>
  ) : (
    <span className={cn(chipBase, "border-black/10 text-[var(--primary)]")}>{name}</span>
  );
}

export function LensChip({ name, refId, required }: { name: string; refId: string | null | undefined; required?: boolean }) {
  const { lookups, open } = useDetail();
  const lens = refId ? lookups.lenses[refId] : null;
  return lens ? (
    <button type="button" onClick={() => open({ kind: "lens", id: refId! })} className={cn(chipBase, required ? "border-[#a87b00]/40 bg-[#fdf6e3] text-[#6b4f00] hover:border-[#a87b00]" : "border-black/10 bg-white text-[var(--primary)] hover:border-black/30")}>
      <MaterialSymbol className="text-[15px]" name={lens.icon || "visibility"} /><span className="truncate">{name}</span>{required ? <span className="text-[10px] font-bold uppercase">required</span> : null}
    </button>
  ) : (
    <span className={cn(chipBase, "border-black/10 text-[var(--primary)]")}>{name}</span>
  );
}

/* ---------- a contract value: text, a list, or a small table of sub-fields ---------- */
export function Value({ v, refs }: { v: unknown; refs?: Refs }) {
  if (v == null || v === "") return <span className="text-[13px] text-black/45">—</span>;
  if (Array.isArray(v)) {
    if (!v.length) return <span className="text-[13px] text-black/45">—</span>;
    return (
      <ul className="grid gap-1">
        {v.map((x, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-snug text-[var(--primary)]">
            <span className="mt-[7px] size-1.5 flex-none rounded-full bg-black/25" />
            <span className="min-w-0"><Linked text={String(Array.isArray(x) ? x.join(" — ") : x)} refs={refs} /></span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof v === "object") {
    return (
      <dl className="grid gap-2">
        {Object.entries(v as Record<string, unknown>).map(([k, x]) => (
          <div key={k} className="grid gap-0.5">
            <dt className="text-[11.5px] font-bold capitalize text-[var(--on-surface-variant)]">{k.replace(/([A-Z])/g, " $1")}</dt>
            <dd><Value v={x} refs={refs} /></dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span className="text-[13px] leading-snug text-[var(--primary)]"><Linked text={String(v)} refs={refs} /></span>;
}

/* a plain string that happens to name an artifact / knowledge entry / lens becomes a chip */
function Linked({ text, refs }: { text: string; refs?: Refs }) {
  if (refs) {
    if (text in refs.artifacts) return <ArtifactChip name={text} template={refs.artifacts[text]} />;
    if (text in refs.knowledge) return <KnowledgeChip name={text} refId={refs.knowledge[text]} />;
    if (text in refs.lenses) return <LensChip name={text} refId={refs.lenses[text]} />;
  }
  return <>{text}</>;
}

/* ---------- the drawer ---------- */
function DetailDrawer({ detail, lookups, onClose }: { detail: NonNullable<Detail>; lookups: Lookups; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  let head: ReactNode = null, body: ReactNode = null, label = "", copy: string | null = null;

  if (detail.kind === "template") {
    const t = lookups.templates[detail.id];
    if (!t) return null;
    label = `Template · ${t.type || "document"}`;
    head = <><h2 className="font-heading text-[22px] font-black uppercase leading-tight tracking-[-0.03em] text-[var(--primary)]">{templateTitle(t)}</h2>{t.purpose ? <p className="text-[14px] text-[var(--on-surface-variant)]">{t.purpose}</p> : null}{t.owner ? <p className="text-[12.5px] text-[var(--on-surface-variant)]">Owner: {t.owner}{t.users.length ? ` · Used by: ${t.users.join(", ")}` : ""}</p> : null}</>;
    body = <><TemplateBody t={t} />{t.good.length ? <Good items={t.good} /> : null}</>;
    copy = templateMarkdown(t);
  } else if (detail.kind === "knowledge") {
    const k = lookups.knowledge[detail.id];
    if (!k) return null;
    label = k.type || "Knowledge";
    head = <><h2 className="font-heading text-[22px] font-black uppercase leading-tight tracking-[-0.03em] text-[var(--primary)]">{k.name}</h2>{k.what ? <p className="text-[14px] leading-6 text-[var(--on-surface-variant)]">{k.what}</p> : null}</>;
    body = <KnowledgeBody k={k} />;
  } else {
    const l = lookups.lenses[detail.id];
    if (!l) return null;
    label = `Lens · ${l.group}`;
    head = <><h2 className="font-heading text-[22px] font-black uppercase leading-tight tracking-[-0.03em] text-[var(--primary)]">{l.name}</h2><p className="text-[14px] leading-6 text-[var(--on-surface-variant)]">{l.what || l.short}</p></>;
    body = <LensBody l={l} />;
  }

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div className="flex h-full w-full max-w-[660px] flex-col overflow-hidden bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] p-6">
          <div className="grid gap-1.5"><span className={cn(kicker, "text-[var(--bridge-teal)]")}>{label}</span>{head}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 flex-none items-center justify-center rounded-full hover:bg-black/5"><MaterialSymbol className="text-[20px]" name="close" /></button>
        </div>
        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-6">{body}</div>
        {copy ? (
          <div className="border-t border-black/[0.06] p-4">
            <button type="button" onClick={() => void navigator.clipboard.writeText(copy!).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); })} className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-3 text-[13.5px] font-bold text-white">
              <MaterialSymbol className="text-[18px]" name={copied ? "check" : "content_copy"} />{copied ? "Copied as Markdown" : "Copy outline as Markdown"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Good({ items }: { items: string[] }) {
  return (
    <div className="grid gap-1.5 rounded-2xl bg-[#e6f3f3] p-4">
      <b className="text-[13px] text-[#005a5a]">What good looks like</b>
      {items.map((g) => <span key={g} className="flex gap-2 text-[13.5px] text-[#0b4f4f]"><MaterialSymbol className="text-[16px]" name="check" />{g}</span>)}
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return <div className="grid gap-2"><span className={cn(kicker, "text-[var(--on-surface-variant)]")}>{title}</span>{children}</div>;
}

export type Structure = { kind?: string; items?: unknown[]; cols?: unknown; rows?: unknown[][]; x?: string; y?: string; q?: string[]; text?: string; dos?: string[]; donts?: string[]; cells?: unknown[][] };

/* the book draws each knowledge entry's shape: steps, cycles, chains, levels, fields, grids, tables, matrices, sentences, do/don't */
export function StructureView({ s }: { s: Structure }) {
  const cell = "grid gap-0.5 rounded-xl border border-black/[0.08] p-3";
  const pair = (it: unknown) => (Array.isArray(it) ? [String(it[0]), it.slice(1).map(String).join(" — ")] : [String(it), ""]);
  switch (s.kind) {
    case "table": {
      const cols = Array.isArray(s.cols) ? (s.cols as unknown[]).map(String) : [];
      return (
        <div className="overflow-x-auto rounded-xl border border-black/10">
          <table className="w-full text-left text-[12.5px]">
            {cols.length ? <thead className="bg-[#f1f3f4]"><tr>{cols.map((c) => <th key={c} className="px-3 py-2 font-bold text-[var(--primary)]">{c}</th>)}</tr></thead> : null}
            <tbody>{(s.rows ?? []).map((r, i) => <tr key={i} className="border-t border-black/[0.06]">{r.map((c, j) => <td key={j} className="px-3 py-2 align-top text-[var(--on-surface-variant)]">{String(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    }
    case "matrix":
      return (
        <div className="grid gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">{(s.q ?? []).map((q) => <div key={q} className="rounded-xl bg-[#f5f2fd] p-3 text-[12.5px] font-semibold text-[#4a2fa8]">{q}</div>)}</div>
          <span className="text-[12px] text-[var(--on-surface-variant)]">{s.y} · {s.x}</span>
        </div>
      );
    case "sentence":
      return <p className="rounded-xl bg-[#f5f2fd] p-4 text-[14px] italic leading-6 text-[#4a2fa8]">{s.text}</p>;
    case "dodont":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid content-start gap-1.5 rounded-xl bg-[#e6f3f3] p-3">{(s.dos ?? []).map((d) => <span key={d} className="flex gap-1.5 text-[13px] text-[#0b4f4f]"><MaterialSymbol className="text-[16px]" name="check" />{d}</span>)}</div>
          <div className="grid content-start gap-1.5 rounded-xl bg-[#fdecf2] p-3">{(s.donts ?? []).map((d) => <span key={d} className="flex gap-1.5 text-[13px] text-[#8a0f3f]"><MaterialSymbol className="text-[16px]" name="close" />{d}</span>)}</div>
        </div>
      );
    case "grid":
      return <div className="grid gap-2 sm:grid-cols-2">{(s.cells ?? []).map((c, i) => <div key={i} className={cell}><b className="text-[13px] text-[var(--primary)]">{String(c[0])}</b><span className="text-[12.5px] text-[var(--on-surface-variant)]">{String(c[1] ?? "")}</span></div>)}</div>;
    case "chain":
    case "steps":
    case "cycle":
    case "levels":
      return (
        <ol className="grid gap-1.5">
          {(s.items ?? []).map((it, i) => {
            const [h, d] = pair(it);
            return (
              <li key={i} className="grid grid-cols-[26px_minmax(0,1fr)] items-start gap-2" style={s.kind === "levels" ? { paddingLeft: i * 10 } : undefined}>
                <span className="flex size-6 items-center justify-center rounded-lg bg-[#f5f2fd] text-[11.5px] font-black text-[#4a2fa8]">{s.kind === "cycle" ? "↻" : i + 1}</span>
                <span className="grid text-[13px] leading-snug"><b className="text-[var(--primary)]">{h}</b>{d ? <span className="text-[var(--on-surface-variant)]">{d}</span> : null}</span>
              </li>
            );
          })}
        </ol>
      );
    default:
      return <div className="grid gap-2 sm:grid-cols-2">{(s.items ?? []).map((it, i) => { const [h, d] = pair(it); return <div key={i} className={cell}><b className="text-[13px] text-[var(--primary)]">{h}</b>{d ? <span className="text-[12.5px] text-[var(--on-surface-variant)]">{d}</span> : null}</div>; })}</div>;
  }
}

function KnowledgeBody({ k }: { k: KnowledgeEntry }) {
  return (
    <>
      {k.how?.length ? (
        <Block title="How to use it">
          <ol className="grid gap-2">{k.how.map((h, i) => <li key={h} className="grid grid-cols-[26px_minmax(0,1fr)] gap-2 text-[14px] leading-snug text-[var(--primary)]"><span className="flex size-6 items-center justify-center rounded-lg bg-[#f5f2fd] text-[12px] font-black text-[#4a2fa8]">{i + 1}</span>{h}</li>)}</ol>
        </Block>
      ) : null}
      {k.structure ? <Block title={`The shape of it${k.structure.kind ? ` · ${k.structure.kind}` : ""}`}><StructureView s={k.structure as Structure} /></Block> : null}
      {k.says?.length ? <Block title="What it says"><Value v={k.says} /></Block> : null}
      {k.applies ? <Block title="How it applies here"><Value v={k.applies} /></Block> : null}
      {k.use ? <Block title="When to use it"><Value v={k.use} /></Block> : null}
      {k.pitfalls?.length ? <Block title="Pitfalls"><Value v={k.pitfalls} /></Block> : null}
      {k.source ? <p className="text-[12.5px] text-[var(--on-surface-variant)]">Source: {k.source}</p> : null}
    </>
  );
}

function LensBody({ l }: { l: LensEntry }) {
  return (
    <>
      {l.asks?.length ? <Block title="Questions this lens asks"><Value v={l.asks} /></Block> : null}
      {l.concerns?.length ? <Block title="What it watches for"><Value v={l.concerns} /></Block> : null}
      {l.evidence?.length ? <Block title="Evidence it expects"><Value v={l.evidence} /></Block> : null}
      {l.decisions?.length ? <Block title="Decisions it informs"><Value v={l.decisions} /></Block> : null}
      {l.holder ? <Block title="Who holds this lens"><Value v={l.holder} /></Block> : null}
    </>
  );
}
