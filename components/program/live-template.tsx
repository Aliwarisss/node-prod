"use client";

import type { ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Template } from "@/lib/program";
import { cn } from "@/lib/utils";

/* A template drawn in its real format — a spreadsheet, a form, a document, an email, a pack, or a canvas (levels, grid,
 * 2×2 matrix, chain, swimlane table) — and taught part by part: `on` lights up the part being explained, parts after
 * `upto` are still to come. `draftParts` names the parts in the same order, so narration and drawing stay in step. */

type Row = unknown[];
type Tpl = {
  fmt?: string; title?: string; meta?: string[]; sections?: Row[]; file?: string; tab?: string; cols?: Row[]; rows?: Row[]; blank?: number;
  fields?: Row[]; board?: string; channel?: string; to?: string; subject?: string; body?: string[]; parts?: Row[];
  structure?: { kind?: string; items?: unknown[]; cols?: unknown; rows?: Row[]; cells?: Row[]; x?: string; y?: string; q?: string[] };
};
export type DraftPart = { name: string; hint?: string; example?: string };

const asStr = (x: unknown): string => (Array.isArray(x) ? x.map(asStr).join(" — ") : x == null ? "" : String(x));
const blankOut = (s?: unknown) => asStr(s).replace(/\{[^}]*\}/g, "…");
const tplOf = (t: Template) => (t.tpl ?? {}) as Tpl;

/* a field's type, said in words: "select:Yes/No" → "Pick one: Yes, No" */
const TYPE_WORDS: Record<string, string> = { text: "A short answer", long: "A few sentences", person: "A person’s name and role", people: "The people involved", date: "A date", num: "A number", number: "A number", money: "An amount", pct: "A percentage", percent: "A percentage", url: "A link", link: "A link", email: "An email address", bool: "Yes or no", list: "A short list", rating: "A rating", score: "A score" };
export function typeHint(x: unknown): string {
  const s = asStr(x).trim();
  if (!s) return "";
  if (s.startsWith("select:")) return `Pick one: ${s.slice(7).split("/").join(", ")}`;
  return TYPE_WORDS[s] ?? (/^[a-z:/_-]+$/.test(s) ? `A ${s} value` : s);
}
const pair = (it: unknown): DraftPart => (Array.isArray(it) ? { name: asStr(it[0]), hint: asStr(it[1]) } : { name: asStr(it) });

export function draftParts(t: Template): DraftPart[] {
  const tpl = tplOf(t), st = tpl.structure ?? {};
  switch (tpl.fmt) {
    case "form": return (tpl.fields ?? []).map((f) => ({ name: asStr(f[0]), hint: [typeHint(f[1]), asStr(f[2])].filter(Boolean).join(" — ") }));
    case "sheet": return [
      ...(tpl.cols ?? []).map((c, i) => ({ name: asStr(c[0]), hint: typeHint(c[1]), example: blankOut(tpl.rows?.[0]?.[i]) || undefined })),
      { name: "Each row", hint: "one row per record — fill a row for every item, the examples show what a finished row looks like" },
    ];
    case "message": return [{ name: "To", example: blankOut(tpl.to) }, { name: "Subject", example: blankOut(tpl.subject) }, ...(tpl.body ?? []).slice(0, 6).map((l, i) => ({ name: i === 0 ? "Greeting" : i === (tpl.body ?? []).length - 1 ? "Sign-off" : `Line ${i + 1}`, example: blankOut(l) }))];
    case "pack": return (tpl.parts ?? []).map((pp) => ({ name: asStr(pp[0]).replace(/-/g, " "), hint: asStr(pp[1]) }));
    case "canvas":
      if (st.kind === "matrix") return [{ name: "The vertical axis", hint: asStr(st.y) }, { name: "The horizontal axis", hint: asStr(st.x) }, ...(st.q ?? []).map((q, i) => ({ name: `Quadrant ${i + 1}`, hint: q }))];
      if (st.kind === "grid") return (st.cells ?? []).map((c) => ({ name: asStr(c[0]), hint: asStr(c[1]) }));
      if (st.kind === "table") return [...(Array.isArray(st.cols) ? (st.cols as unknown[]) : []).map((c) => ({ name: asStr(c) })), { name: "Each lane", hint: "one row per actor or system — follow it left to right" }];
      return (st.items ?? []).map(pair);
    default: return [
      ...((tpl.meta ?? []).length ? [{ name: "Header", hint: `fill in ${(tpl.meta ?? []).map((m) => String(m).split(":")[0].toLowerCase()).join(", ")}` }] : []),
      ...(tpl.sections ?? []).map((sc) => ({ name: asStr(sc[0]), hint: asStr(sc[1]), example: blankOut(sc[2]) || undefined })),
    ];
  }
}

/* a part's look: the one being explained, the ones explained, the ones still to come */
const part = (i: number, on: number, upto: number) => (i === on ? "bg-[#fff1f6] ring-2 ring-[var(--electric-pink)] shadow-[0_8px_24px_-12px_rgba(216,27,96,.5)]" : i < upto ? "" : "opacity-30");
const Pin = ({ show, children }: { show: boolean; children: ReactNode }) => (show ? <span className="absolute -top-2.5 right-2 z-10 rounded-full bg-[var(--electric-pink)] px-2 py-0.5 text-[10px] font-bold text-white shadow">{children}</span> : null);

export function LiveTemplate({ t, on, upto }: { t: Template; on: number; upto: number }) {
  const tpl = tplOf(t), st = tpl.structure ?? {};
  const title = blankOut(tpl.title || tpl.board || tpl.subject || tpl.file || t.id);

  /* ---------- spreadsheet ---------- */
  if (tpl.fmt === "sheet") {
    const cols = tpl.cols ?? [], rows = (tpl.rows ?? []).slice(0, 4), blanks = Math.min(3, tpl.blank ?? 2), rowPart = cols.length;
    const colCls = (i: number) => (i === on ? "bg-[#fff1f6]" : i >= upto ? "opacity-30" : "");
    return (
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-black/10">
        <div className="flex items-center gap-2 bg-[#1d6f42] px-3 py-1.5 text-[12px] font-semibold text-white"><MaterialSymbol className="text-[16px]" name="table_view" />{blankOut(tpl.file) || title}</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="bg-[#f3f3f3] text-center font-mono text-[10px] text-black/40"><th className="w-8 border border-black/10" />{cols.map((_, i) => <th key={i} className={cn("border border-black/10 py-0.5 font-normal", colCls(i))}>{String.fromCharCode(65 + i)}</th>)}</tr>
              <tr><td className="border border-black/10 bg-[#f3f3f3] text-center font-mono text-[10px] text-black/40">1</td>{cols.map((c, i) => <th key={i} className={cn("border border-black/10 px-2 py-1.5 font-bold text-[var(--primary)] transition-all duration-500", colCls(i), i === on && "ring-2 ring-inset ring-[var(--electric-pink)]")}>{asStr(c[0])}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className={cn("transition-all duration-500", on === rowPart && "bg-[#fff1f6]")}>
                  <td className="border border-black/10 bg-[#f3f3f3] text-center font-mono text-[10px] text-black/40">{ri + 2}</td>
                  {cols.map((_, ci) => <td key={ci} className={cn("border border-black/10 px-2 py-1.5 text-[var(--on-surface-variant)] transition-all duration-500", colCls(ci))}>{blankOut(r[ci])}</td>)}
                </tr>
              ))}
              {Array.from({ length: blanks }).map((_, bi) => (
                <tr key={`b${bi}`}>
                  <td className="border border-black/10 bg-[#f3f3f3] text-center font-mono text-[10px] text-black/40">{rows.length + bi + 2}</td>
                  {cols.map((c, ci) => <td key={ci} className={cn("border border-black/10 px-2 py-1.5 text-[11px] italic text-black/25 transition-all duration-500", colCls(ci))}>{ci === on ? typeHint(c[1]).toLowerCase() : ""}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-1 border-t border-black/10 bg-[#f3f3f3] px-2 py-1 text-[11px]"><span className="rounded-t bg-white px-2 py-0.5 font-semibold text-[#1d6f42] shadow-sm">{blankOut(tpl.tab) || "Sheet1"}</span><span className="text-black/30">+</span></div>
      </div>
    );
  }

  /* ---------- form ---------- */
  if (tpl.fmt === "form") {
    return (
      <div className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-black/10">
        <b className="border-b border-black/[0.06] pb-2 text-[15px] text-[var(--primary)]">{title}</b>
        {(tpl.fields ?? []).map((f, i) => {
          const type = asStr(f[1]), ph = asStr(f[2]);
          let control: ReactNode;
          if (type.startsWith("select:")) control = <span className="flex flex-wrap gap-1.5">{type.slice(7).split("/").map((o, k) => <span key={o} className={cn("rounded-full border px-2.5 py-1 text-[12px]", k === 0 && i < upto ? "border-[var(--bridge-teal)] bg-[#e6f3f3] text-[#005a5a]" : "border-black/15 text-black/55")}>{o}</span>)}</span>;
          else if (type === "long") control = <span className="block h-16 rounded-lg border border-black/15 bg-[#fcfcfc] px-3 py-2 text-[12.5px] text-black/35">{ph || "…"}</span>;
          else control = <span className="flex h-9 items-center gap-2 rounded-lg border border-black/15 bg-[#fcfcfc] px-3 text-[12.5px] text-black/35">{type === "date" ? <MaterialSymbol className="text-[16px]" name="calendar_month" /> : type === "person" ? <MaterialSymbol className="text-[16px]" name="person" /> : type === "num" ? <MaterialSymbol className="text-[16px]" name="tag" /> : null}{ph || (type === "date" ? "dd / mm / yyyy" : type === "person" ? "Name, role" : "")}</span>;
          return (
            <label key={i} className={cn("relative grid gap-1 rounded-xl p-2 transition-all duration-500", part(i, on, upto))}>
              <Pin show={i === on}>{i + 1}</Pin>
              <span className="text-[12.5px] font-bold text-[var(--primary)]">{asStr(f[0])}</span>
              {control}
            </label>
          );
        })}
        <span className={cn("justify-self-end rounded-full bg-[var(--deep-indigo)] px-4 py-1.5 text-[12px] font-bold text-white", upto < (tpl.fields ?? []).length && "opacity-30")}>Submit</span>
      </div>
    );
  }

  /* ---------- email ---------- */
  if (tpl.fmt === "message") {
    const body = (tpl.body ?? []).slice(0, 6);
    return (
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-black/10">
        <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 text-[12px] font-semibold text-white"><MaterialSymbol className="text-[16px]" name="mail" />{tpl.channel || "Message"} · New</div>
        <div className="grid gap-0 px-4 pt-2 text-[13px]">
          {[["To", tpl.to], ["Subject", tpl.subject]].map(([k, v], i) => (
            <div key={String(k)} className={cn("relative flex gap-3 rounded-lg border-b border-black/[0.06] px-2 py-2 transition-all duration-500", part(i, on, upto))}>
              <Pin show={i === on}>{i + 1}</Pin>
              <span className="w-16 text-black/45">{k}</span><span className={cn("text-[var(--primary)]", k === "Subject" && "font-bold")}>{blankOut(v)}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-1 px-4 py-3 text-[13.5px] leading-6 text-[var(--primary)]">
          {body.map((l, i) => <p key={i} className={cn("relative rounded-lg px-2 transition-all duration-500", part(i + 2, on, upto))}><Pin show={i + 2 === on}>{i + 3}</Pin>{blankOut(l)}</p>)}
        </div>
        <div className="flex justify-end border-t border-black/[0.06] px-4 py-2"><span className={cn("flex items-center gap-1 rounded-full bg-[#0284c7] px-4 py-1.5 text-[12px] font-bold text-white", upto < body.length + 2 && "opacity-30")}><MaterialSymbol className="text-[15px]" name="send" />Send</span></div>
      </div>
    );
  }

  /* ---------- pack ---------- */
  if (tpl.fmt === "pack") {
    return (
      <div className="grid gap-2 rounded-xl bg-[#fffaf0] p-4 ring-1 ring-[#e0b84a]/40">
        <span className="flex items-center gap-2 text-[14px] font-bold text-[var(--primary)]"><MaterialSymbol className="text-[22px] text-[#c49000]" name="folder_open" />{title}</span>
        {(tpl.parts ?? []).map((pp, i) => (
          <div key={i} className={cn("relative ml-4 flex items-start gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-black/[0.06] transition-all duration-500", part(i, on, upto))}>
            <Pin show={i === on}>{i + 1}</Pin>
            <MaterialSymbol className={cn("mt-0.5 text-[18px]", i < upto ? "text-[var(--bridge-teal)]" : "text-black/30")} name={i < upto && i !== on ? "check_box" : "description"} />
            <span className="grid"><b className="text-[13px] capitalize text-[var(--primary)]">{asStr(pp[0]).replace(/-/g, " ")}</b><span className="text-[12px] text-[var(--on-surface-variant)]">{asStr(pp[1])}</span></span>
          </div>
        ))}
      </div>
    );
  }

  /* ---------- canvases ---------- */
  if (tpl.fmt === "canvas") {
    const frame = (body: ReactNode) => (
      <div className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-black/10" style={{ backgroundImage: "radial-gradient(rgba(13,17,23,.06) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
        <span className="flex items-center gap-2 text-[14px] font-bold text-[var(--primary)]"><MaterialSymbol className="text-[19px] text-[var(--bridge-teal)]" name="dashboard" />{title}</span>
        {body}
      </div>
    );
    if (st.kind === "matrix") {
      const q = st.q ?? [];
      const tone = ["#e6f3f3", "#fff1f6", "#f4f5f6", "#fffaf0"];
      return frame(
        <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-2">
          <div className={cn("relative flex items-center justify-center rounded-lg transition-all duration-500", part(0, on, upto))}><span className="-rotate-90 whitespace-nowrap text-[11.5px] font-bold text-[var(--primary)]">{asStr(st.y)}</span></div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className={cn("relative grid min-h-[130px] content-center rounded-xl p-3 text-center text-[12.5px] font-semibold leading-5 text-[var(--primary)] ring-1 ring-black/[0.06] transition-all duration-500", part(k + 2, on, upto))} style={{ background: k + 2 === on ? undefined : tone[k] }}>
                <Pin show={k + 2 === on}>Q{k + 1}</Pin>{q[k] ?? ""}
              </div>
            ))}
          </div>
          <span />
          <div className={cn("relative rounded-lg py-1 text-center text-[11.5px] font-bold text-[var(--primary)] transition-all duration-500", part(1, on, upto))}>{asStr(st.x)}</div>
        </div>,
      );
    }
    if (st.kind === "grid") {
      return frame(
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Number(st.cols) || 3}, minmax(0, 1fr))` }}>
          {(st.cells ?? []).map((c, i) => (
            <div key={i} className={cn("relative grid content-start gap-0.5 rounded-xl bg-[#f6f7f8] p-2.5 ring-1 ring-black/[0.06] transition-all duration-500", part(i, on, upto))} style={{ gridArea: asStr(c[2]) || undefined }}>
              <Pin show={i === on}>{i + 1}</Pin>
              <b className="text-[12.5px] text-[var(--primary)]">{asStr(c[0])}</b><span className="text-[11.5px] leading-4 text-[var(--on-surface-variant)]">{asStr(c[1])}</span>
            </div>
          ))}
        </div>,
      );
    }
    if (st.kind === "chain") {
      const items = (st.items ?? []).map(pair);
      return frame(
        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((x, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className={cn("relative max-w-[200px] rounded-xl bg-[#f6f7f8] px-3 py-2 text-[12.5px] font-semibold leading-5 text-[var(--primary)] ring-1 ring-black/[0.06] transition-all duration-500", i === items.length - 1 && "bg-[var(--deep-indigo)] text-white", part(i, on, upto))}><Pin show={i === on}>{i + 1}</Pin>{x.name}{x.hint ? <span className="block text-[11px] font-normal opacity-70">{x.hint}</span> : null}</span>
              {i < items.length - 1 ? <MaterialSymbol className={cn("text-[18px] text-black/30", i + 1 >= upto && "opacity-30")} name="arrow_forward" /> : null}
            </span>
          ))}
        </div>,
      );
    }
    if (st.kind === "table") {
      const cols = Array.isArray(st.cols) ? (st.cols as unknown[]) : [], rows = st.rows ?? [], lanePart = cols.length;
      return frame(
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-1 text-left text-[12px]">
            <thead><tr>{cols.map((c, i) => <th key={i} className={cn("relative rounded-lg bg-[var(--deep-indigo)] px-2 py-1.5 font-bold text-white transition-all duration-500", i === on && "ring-2 ring-[var(--electric-pink)]", i >= upto && "opacity-30")}>{asStr(c)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri} className={cn("transition-all duration-500", on === lanePart && "outline outline-2 outline-[var(--electric-pink)]")}>{cols.map((_, ci) => <td key={ci} className={cn("rounded-lg px-2 py-1.5 text-[var(--primary)]", ci === 0 ? "bg-[#eef0f2] font-bold" : asStr(r[ci]) ? "bg-[#f6f7f8]" : "", ci >= upto && "opacity-30", ci === on && "bg-[#fff1f6]")}>{asStr(r[ci])}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
    }
    /* levels (and anything else with items): a cascading tree */
    const items = (st.items ?? []).map(pair);
    return frame(
      <div className="grid gap-1.5">
        {items.map((x, i) => (
          <div key={i} className="flex items-stretch gap-2" style={{ paddingLeft: `${i * 22}px` }}>
            {i ? <span className="w-3 border-b-2 border-l-2 border-black/15" style={{ height: 22 }} /> : null}
            <div className={cn("relative flex-1 rounded-xl px-3 py-2 ring-1 ring-black/[0.06] transition-all duration-500", i === items.length - 1 ? "bg-[var(--deep-indigo)] text-white" : "bg-[#f6f7f8] text-[var(--primary)]", part(i, on, upto))}>
              <Pin show={i === on}>{i + 1}</Pin>
              <b className="text-[12.5px]">{x.name}</b>{x.hint ? <span className="ml-2 text-[12px] opacity-70">{x.hint}</span> : null}
            </div>
          </div>
        ))}
      </div>,
    );
  }

  /* ---------- document ---------- */
  const meta = tpl.meta ?? [], secs = tpl.sections ?? [], off = meta.length ? 1 : 0;
  return (
    <div className="grid gap-3 rounded-xl bg-white px-6 py-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]">
      <b className="font-heading text-[18px] font-black text-[var(--primary)]">{title}</b>
      {meta.length ? (
        <div className={cn("relative grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-black/[0.08] p-2.5 text-[12px] transition-all duration-500 sm:grid-cols-3", part(0, on, upto))}>
          <Pin show={on === 0}>Header</Pin>
          {meta.map((m) => { const [k, v] = String(m).split(":"); return <span key={m} className="flex gap-1.5"><span className="text-black/45">{k.trim()}:</span><span className="text-[var(--primary)]">{v ? v.trim() : "______"}</span></span>; })}
        </div>
      ) : null}
      {secs.map((s, i) => (
        <section key={i} className={cn("relative grid gap-1 rounded-xl p-2.5 transition-all duration-500", part(i + off, on, upto))}>
          <Pin show={i + off === on}>{i + 1}</Pin>
          <b className="text-[14px] text-[var(--primary)]">{asStr(s[0])}</b>
          <span className="text-[12.5px] italic text-black/45">{asStr(s[1])}</span>
          {s[2] && i + off < upto ? <span className="rounded-lg bg-[#f6f7f8] px-2.5 py-1.5 text-[12.5px] text-[var(--primary)]"><span className="mr-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-black/35">Sample</span>{blankOut(s[2])}</span> : null}
        </section>
      ))}
    </div>
  );
}
