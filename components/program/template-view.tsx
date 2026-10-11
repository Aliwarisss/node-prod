"use client";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Template } from "@/lib/program";

/* The book's templates come in six shapes: doc, sheet, form, canvas, message, pack */
type Row = (string | number | null)[];
type Tpl = {
  fmt?: string;
  title?: string;
  meta?: string[];
  sections?: [string, string, string?][];
  file?: string;
  tab?: string;
  cols?: [string, string?][];
  rows?: Row[];
  fields?: [string, string, string?][];
  board?: string;
  structure?: { kind?: string; items?: unknown[] };
  channel?: string;
  to?: string;
  subject?: string;
  body?: string[];
  parts?: [string, string][];
};

const blank = (s?: string) => (s ?? "").replace(/\{[^}]*\}/g, "…");
const asText = (x: unknown): string => (Array.isArray(x) ? x.map(asText).join(" — ") : x == null ? "" : String(x));

export function templateTitle(t: Template) {
  const tpl = (t.tpl ?? {}) as Tpl;
  return blank(tpl.title || tpl.board || tpl.subject || tpl.file || "") || t.id.replace(/-/g, " ");
}

/* the outline as Markdown, ready to paste into the trainee's own document */
export function templateMarkdown(t: Template) {
  const tpl = (t.tpl ?? {}) as Tpl;
  const out = [`# ${templateTitle(t)}`, "", t.purpose || t.what, ""];
  switch (tpl.fmt) {
    case "sheet": {
      const cols = (tpl.cols ?? []).map((c) => c[0]);
      if (cols.length) out.push(`| ${cols.join(" | ")} |`, `| ${cols.map(() => "---").join(" | ")} |`, `| ${cols.map(() => " ").join(" | ")} |`);
      break;
    }
    case "form":
      for (const f of tpl.fields ?? []) out.push(`- **${f[0]}:** ${f[2] ? `_(${f[2]})_` : ""}`);
      break;
    case "canvas":
      for (const it of tpl.structure?.items ?? []) out.push(`## ${asText(Array.isArray(it) ? it[0] : it)}`, Array.isArray(it) && it[1] ? `_${asText(it[1])}_` : "", "");
      break;
    case "message":
      out.push(`**To:** ${blank(tpl.to)}`, `**Subject:** ${blank(tpl.subject)}`, "", ...(tpl.body ?? []).map(blank));
      break;
    case "pack":
      for (const p of tpl.parts ?? []) out.push(`- [ ] **${p[0].replace(/-/g, " ")}** — ${p[1]}`);
      break;
    default:
      for (const m of tpl.meta ?? []) out.push(`- **${m}:** `);
      for (const s of tpl.sections ?? []) out.push("", `## ${s[0]}`, `_${s[1]}_`, "");
  }
  return out.join("\n");
}

const box = "grid gap-1 rounded-2xl border border-black/[0.06] p-4";
const example = "mt-1 rounded-xl bg-[#f6f7f8] px-3 py-2 text-[13px] text-[var(--primary)]";

export function TemplateBody({ t }: { t: Template }) {
  const tpl = (t.tpl ?? {}) as Tpl;

  if (tpl.fmt === "sheet") {
    const cols = tpl.cols ?? [];
    return (
      <div className="grid gap-2">
        {tpl.file ? <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--on-surface-variant)]"><MaterialSymbol className="text-[17px] text-[#1d6f42]" name="table_view" />{tpl.file}{tpl.tab ? ` · ${tpl.tab}` : ""}</span> : null}
        <div className="overflow-x-auto rounded-2xl border border-black/10">
          <table className="w-full min-w-[520px] text-left text-[12.5px]">
            <thead className="bg-[#f1f3f4]"><tr>{cols.map((c) => <th key={c[0]} className="whitespace-nowrap px-3 py-2 font-bold text-[var(--primary)]">{c[0]}</th>)}</tr></thead>
            <tbody>
              {(tpl.rows ?? []).slice(0, 4).map((r, i) => (
                <tr key={i} className="border-t border-black/[0.06]">{cols.map((_, ci) => <td key={ci} className="px-3 py-2 align-top text-[var(--on-surface-variant)]">{asText(r[ci])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <span className="text-[12px] text-[var(--on-surface-variant)]">Example rows from the book’s order-entry case.</span>
      </div>
    );
  }

  if (tpl.fmt === "form") {
    return (
      <div className="grid gap-2">
        {(tpl.fields ?? []).map((f) => (
          <div key={f[0]} className="grid gap-1 rounded-xl border border-black/[0.08] px-3.5 py-2.5">
            <span className="flex items-center justify-between gap-2 text-[13.5px] font-bold text-[var(--primary)]">{f[0]}<span className="font-mono text-[10.5px] font-semibold uppercase text-[var(--on-surface-variant)]">{f[1].split(":")[0]}</span></span>
            {f[2] ? <span className="text-[12.5px] text-[var(--on-surface-variant)]">{f[2]}</span> : null}
          </div>
        ))}
      </div>
    );
  }

  if (tpl.fmt === "canvas") {
    return (
      <div className="grid gap-2">
        {tpl.board ? <span className="text-[13px] font-semibold text-[var(--on-surface-variant)]">Board: {tpl.board}</span> : null}
        {(tpl.structure?.items ?? []).map((it, i) => (
          <div key={i} className={box}>
            <b className="text-[14.5px] text-[var(--primary)]">{asText(Array.isArray(it) ? it[0] : it)}</b>
            {Array.isArray(it) && it.length > 1 ? <span className="text-[13px] text-[var(--on-surface-variant)]">{asText(it.slice(1))}</span> : null}
          </div>
        ))}
      </div>
    );
  }

  if (tpl.fmt === "message") {
    return (
      <div className="grid gap-0 overflow-hidden rounded-2xl border border-black/10">
        <div className="grid gap-1 bg-[#f6f7f8] px-4 py-3 text-[13px]">
          <span><b className="text-[var(--primary)]">{tpl.channel ?? "Message"}</b></span>
          {tpl.to ? <span className="text-[var(--on-surface-variant)]">To: {blank(tpl.to)}</span> : null}
          {tpl.subject ? <span className="font-semibold text-[var(--primary)]">{blank(tpl.subject)}</span> : null}
        </div>
        <div className="grid gap-2 px-4 py-3 text-[13.5px] leading-6 text-[var(--primary)]">{(tpl.body ?? []).map((b, i) => <p key={i}>{blank(b)}</p>)}</div>
      </div>
    );
  }

  if (tpl.fmt === "pack") {
    return (
      <div className="grid gap-2">
        {(tpl.parts ?? []).map((p) => (
          <div key={p[0]} className="flex items-start gap-3 rounded-xl border border-black/[0.08] px-3.5 py-2.5">
            <MaterialSymbol className="text-[18px] text-[var(--bridge-teal)]" name="folder" />
            <span className="grid"><b className="text-[13.5px] capitalize text-[var(--primary)]">{p[0].replace(/-/g, " ")}</b><span className="text-[12.5px] text-[var(--on-surface-variant)]">{p[1]}</span></span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {tpl.meta?.length ? <div className="flex flex-wrap gap-1.5">{tpl.meta.map((m) => <span key={m} className="rounded-lg bg-[#f1f2f3] px-2.5 py-1 text-[12px] font-semibold text-[var(--primary)]">{m}</span>)}</div> : null}
      {tpl.sections?.length ? (
        tpl.sections.map((s) => (
          <div key={s[0]} className={box}>
            <b className="text-[15px] text-[var(--primary)]">{s[0]}</b>
            <span className="text-[13.5px] text-[var(--on-surface-variant)]">{s[1]}</span>
            {s[2] ? <span className={example}><b>Example: </b>{s[2]}</span> : null}
          </div>
        ))
      ) : (
        <p className="text-[14px] text-[var(--on-surface-variant)]">{t.what}</p>
      )}
    </div>
  );
}
