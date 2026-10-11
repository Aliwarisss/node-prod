"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Template } from "@/lib/program";
import type { WorkspaceDocView } from "@/lib/program/submissions";
import { cn } from "@/lib/utils";

import { templateMarkdown, templateTitle } from "./template-view";

/* A living document in the trainee's workspace, worked in the kind of tool a real team uses:
 * - logs, registers and lists as a task-tracker list (ClickUp-style): items with a title, status pills, people, dates;
 * - canvases and boards as a whiteboard with sticky notes, laid out like the real thing (a Business Model Canvas, a
 *   2×2, a chain, levels, a swimlane);
 * - forms as forms, emails as a compose window, packs as a checklist, docs as text to paste — with a file to attach.
 * It keeps the structured data and the same content as Markdown (what the reviewer reads), and saves as you type. */

type Row = unknown[];
type Tpl = { fmt?: string; title?: string; board?: string; file?: string; tab?: string; channel?: string; meta?: string[]; sections?: Row[]; cols?: Row[]; rows?: Row[]; fields?: Row[]; to?: string; subject?: string; body?: string[]; parts?: Row[]; structure?: { kind?: string; items?: unknown[]; cols?: unknown; rows?: Row[]; cells?: Row[]; x?: string; y?: string; q?: string[] } };
type Data = { rows?: string[][]; values?: Record<string, string>; cells?: string[]; items?: string[]; q?: string[]; to?: string; subject?: string; body?: string; done?: Record<string, boolean>; notes?: string } | null;

const s = (x: unknown): string => (Array.isArray(x) ? x.map(s).join(" — ") : x == null ? "" : String(x));
const blank = (x: unknown) => s(x).replace(/\{[^}]*\}/g, "…");
const cellText = (x: string) => x.replace(/\|/g, "/").replace(/\n/g, " ");
const notesOf = (v: string | undefined) => (v ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

export type DocFormat = { fmt: string; kind: string; label: string; icon: string; tool: string };
export function formatOf(t: Template | null): DocFormat {
  const tpl = (t?.tpl ?? {}) as Tpl;
  const fmt = tpl.fmt ?? "doc";
  const kind = fmt === "canvas" ? tpl.structure?.kind ?? "levels" : fmt;
  const map: Record<string, [string, string, string]> = {
    sheet: ["Add an item for each entry", "checklist", "List"], form: ["Fill each field", "edit_note", "Form"], doc: ["Write or paste it — attach the file if you have one", "article", "Doc"],
    message: ["Compose it", "mail", "Email"], pack: ["Tick each part as it’s ready", "folder_open", "Pack"], matrix: ["Add sticky notes to each quadrant", "grid_view", "Board"],
    grid: ["Add sticky notes to each box", "dashboard", "Board"], chain: ["Fill each link of the chain", "linear_scale", "Board"], levels: ["Fill each level", "account_tree", "Board"], table: ["Add an item for each lane", "view_week", "List"],
  };
  const [label, icon, tool] = map[kind] ?? map.doc;
  return { fmt, kind, label, icon, tool };
}

/* the structured data as Markdown — what the reviewer reads */
function toText(t: Template | null, d: Data, docText: string): string {
  const tpl = (t?.tpl ?? {}) as Tpl, st = tpl.structure ?? {};
  const title = t ? `# ${t.id.startsWith("knowledge:") ? tpl.board || tpl.title : templateTitle(t)}\n\n` : "";
  const fmt = tpl.fmt ?? "doc";
  if (fmt === "sheet" || (fmt === "canvas" && st.kind === "table")) {
    const cols = fmt === "sheet" ? (tpl.cols ?? []).map((c) => s(c[0])) : (Array.isArray(st.cols) ? st.cols : []).map(s);
    const rows = (d?.rows ?? []).filter((r) => r.some((c) => c?.trim()));
    return `${title}| ${cols.join(" | ")} |\n| ${cols.map(() => "---").join(" | ")} |\n${rows.map((r) => `| ${cols.map((_, i) => cellText(r[i] ?? "")).join(" | ")} |`).join("\n")}`;
  }
  if (fmt === "form") return title + (tpl.fields ?? []).map((f) => `**${s(f[0])}:** ${d?.values?.[s(f[0])] ?? ""}`).join("\n\n");
  if (fmt === "message") return `${title}**To:** ${d?.to ?? ""}\n**Subject:** ${d?.subject ?? ""}\n\n${d?.body ?? ""}`;
  if (fmt === "pack") return title + (tpl.parts ?? []).map((p) => `- [${d?.done?.[s(p[0])] ? "x" : " "}] ${s(p[0]).replace(/-/g, " ")} — ${s(p[1])}`).join("\n") + (d?.notes ? `\n\n${d.notes}` : "");
  if (fmt === "canvas") {
    const list = (v?: string) => notesOf(v).map((n) => `- ${n}`).join("\n");
    if (st.kind === "matrix") return `${title}Axes — ${s(st.y)} / ${s(st.x)}\n\n` + (st.q ?? []).map((q, i) => `## ${q}\n${list(d?.q?.[i])}`).join("\n\n");
    if (st.kind === "grid") return title + (st.cells ?? []).map((c, i) => `## ${s(c[0])}\n${list(d?.cells?.[i])}`).join("\n\n");
    return title + (st.items ?? []).map((it, i) => `## ${i + 1}. ${Array.isArray(it) ? s(it[0]) : s(it)}\n${list(d?.items?.[i])}`).join("\n\n");
  }
  return docText;
}

const input = "w-full rounded-md bg-transparent px-1.5 py-1 text-[13px] text-[var(--primary)] outline-none transition-colors hover:bg-black/[0.03] focus:bg-white focus:ring-1 focus:ring-[var(--bridge-teal)] disabled:hover:bg-transparent";
const STATUS_TONE = ["#64748b", "#0284c7", "#c49000", "#007373", "#e91e63", "#6d48d8"];

/* ---------- a list, like a task tracker ---------- */
function Cell({ type, value, onChange, placeholder, disabled }: { type: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  if (type.startsWith("select:")) {
    const opts = type.slice(7).split("/");
    const k = opts.indexOf(value), tone = k >= 0 ? STATUS_TONE[k % STATUS_TONE.length] : "";
    return (
      <span className="relative inline-flex">
        <span className={cn("pointer-events-none rounded-md px-2 py-0.5 text-[11.5px] font-bold uppercase tracking-[0.04em]", k >= 0 ? "text-white" : "bg-black/[0.05] text-black/40")} style={k >= 0 ? { background: tone } : undefined}>{value || "Set"}</span>
        <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Status"><option value="">—</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>
      </span>
    );
  }
  if (type === "person") {
    const ini = value.split(/\s+/).filter(Boolean).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
    return <span className="flex items-center gap-1.5">{value ? <span className="flex size-6 flex-none items-center justify-center rounded-full bg-[#6d48d8] text-[10px] font-black text-white">{ini}</span> : <MaterialSymbol className="text-[20px] text-black/25" name="account_circle" />}<input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "Assign"} className={input} /></span>;
  }
  if (type === "date") return <span className="flex items-center gap-1"><MaterialSymbol className="text-[16px] text-black/30" name="event" /><input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "Date"} className={input} /></span>;
  return <input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={type === "num" ? "decimal" : undefined} className={input} />;
}

function ListEditor({ name, cols, examples, rows, onRows, disabled }: { name: string; cols: { name: string; type: string }[]; examples: Row[]; rows: string[][]; onRows: (r: string[][]) => void; disabled?: boolean }) {
  const set = (ri: number, ci: number, v: string) => onRows(rows.map((r, i) => (i === ri ? cols.map((_, j) => (j === ci ? v : r[j] ?? "")) : r)));
  const filled = rows.filter((r) => r.some((c) => c?.trim())).length;
  const tmpl = `minmax(220px,2fr) ${cols.slice(1).map((c) => (c.type.startsWith("select:") ? "minmax(120px,0.8fr)" : "minmax(150px,1fr)")).join(" ")} 32px`;
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-black/10">
      <div className="flex items-center gap-2 border-b border-black/[0.06] px-3 py-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-[#7b68ee] text-white"><MaterialSymbol className="text-[15px]" name="checklist" /></span>
        <b className="text-[13.5px] text-[var(--primary)]">{name}</b>
        <span className="flex items-center gap-1 rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[11px] font-bold text-black/55"><MaterialSymbol className="text-[13px]" name="view_list" />List</span>
        <span className="ml-auto text-[11.5px] text-black/45">{filled} item{filled === 1 ? "" : "s"}</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid items-center gap-2 border-b border-black/[0.06] bg-[#fafafa] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-black/40" style={{ gridTemplateColumns: tmpl }}>
            {cols.map((c) => <span key={c.name} className="truncate">{c.name}</span>)}<span />
          </div>
          {rows.map((r, ri) => (
            <div key={ri} className="group grid items-center gap-2 border-b border-black/[0.04] px-3 py-1 hover:bg-[#f7f7fb]" style={{ gridTemplateColumns: tmpl }}>
              {cols.map((c, ci) => ci === 0 ? (
                <span key={ci} className="flex items-center gap-2"><MaterialSymbol className={cn("text-[17px]", r.some((x) => x?.trim()) ? "text-[#7b68ee]" : "text-black/20")} name="radio_button_unchecked" /><input value={r[0] ?? ""} disabled={disabled} onChange={(e) => set(ri, 0, e.target.value)} placeholder={ri === 0 ? blank(examples[0]?.[0]) || "Item" : "Item"} className={cn(input, "font-semibold")} /></span>
              ) : <span key={ci} className="min-w-0"><Cell type={c.type} value={r[ci] ?? ""} onChange={(v) => set(ri, ci, v)} placeholder={ri === 0 ? blank(examples[0]?.[ci]) : ""} disabled={disabled} /></span>)}
              {disabled ? <span /> : <button type="button" onClick={() => onRows(rows.filter((_, i) => i !== ri))} className="text-black/0 transition-colors group-hover:text-black/30 hover:!text-[#b91c1c]" aria-label={`Delete item ${ri + 1}`}><MaterialSymbol className="text-[16px]" name="delete" /></button>}
            </div>
          ))}
          {disabled ? null : <button type="button" onClick={() => onRows([...rows, cols.map(() => "")])} className="flex w-full items-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold text-black/45 hover:bg-[#f7f7fb] hover:text-[#7b68ee]"><MaterialSymbol className="text-[17px]" name="add" />New item</button>}
        </div>
      </div>
    </div>
  );
}

/* ---------- a whiteboard area with sticky notes ---------- */
const NOTE = ["#fff3a8", "#ffd6e7", "#c9f2e9", "#dfe7ff", "#ffe2c2", "#e8dcff"];
function NoteArea({ label, hint, value, onChange, disabled, tint = 0, big }: { label: string; hint?: string; value: string | undefined; onChange: (v: string) => void; disabled?: boolean; tint?: number; big?: boolean }) {
  const [draft, setDraft] = useState("");
  const notes = notesOf(value);
  const add = () => { const v = draft.trim(); if (!v) return; onChange([...notes, v].join("\n")); setDraft(""); };
  return (
    <div className={cn("grid h-full content-start gap-1.5 rounded-xl border border-black/[0.08] bg-white/80 p-2.5", big && "min-h-[150px]")}>
      <span className="grid"><b className="text-[12.5px] text-[var(--primary)]">{label}</b>{hint ? <span className="text-[11px] leading-4 text-black/40">{hint}</span> : null}</span>
      <div className="flex flex-wrap gap-1.5">
        {notes.map((n, i) => (
          <span key={`${n}-${i}`} className="group relative max-w-full rounded-sm px-2 py-1.5 text-[12px] leading-4 text-[#2b2000] shadow-[0_2px_4px_rgba(0,0,0,.12)]" style={{ background: NOTE[tint % NOTE.length], transform: `rotate(${((i * 7) % 5) - 2}deg)` }}>
            {n}
            {disabled ? null : <button type="button" onClick={() => onChange(notes.filter((_, j) => j !== i).join("\n"))} className="absolute -right-1.5 -top-1.5 hidden size-4 items-center justify-center rounded-full bg-black/70 text-white group-hover:flex" aria-label="Remove note"><MaterialSymbol className="text-[11px]" name="close" /></button>}
          </span>
        ))}
      </div>
      {disabled ? null : (
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} onBlur={add} placeholder="+ Add a note" className="rounded-md bg-transparent px-1 py-1 text-[12px] text-[var(--primary)] outline-none placeholder:text-black/35 focus:bg-white focus:ring-1 focus:ring-[var(--bridge-teal)]" />
      )}
    </div>
  );
}
function Board({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-black/10">
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-white px-3 py-2"><span className="flex size-6 items-center justify-center rounded-md bg-[#ffd02f] text-[#2b2000]"><MaterialSymbol className="text-[15px]" name="sticky_note_2" /></span><b className="text-[13.5px] text-[var(--primary)]">{name}</b><span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[11px] font-bold text-black/55">Board</span></div>
      <div className="bg-[#f4f4f6] p-3" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,.07) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>{children}</div>
    </div>
  );
}

const field = "w-full rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[13px] text-[var(--primary)] outline-none transition-colors focus:border-[var(--bridge-teal)] disabled:bg-[#f8f9fa] disabled:text-black/60";

/* ---------- the living document, saved as you type ---------- */
export function LivingDoc({ docRef, t, title, initial, disabled, onSaved, starter: given }: { docRef: string; t: Template | null; title: string; initial: WorkspaceDocView | undefined; disabled?: boolean; onSaved?: (d: WorkspaceDocView) => void; starter?: string }) {
  const tpl = (t?.tpl ?? {}) as Tpl, st = tpl.structure ?? {};
  const f = formatOf(t);
  const starter = given ?? (t && !t.id.startsWith("knowledge:") ? templateMarkdown(t) : "");
  const [data, setData] = useState<Data>((initial?.data as Data) ?? null);
  const [text, setText] = useState(initial?.text || (f.fmt === "doc" ? starter : ""));
  const [upload, setUpload] = useState(initial?.upload ?? null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploading, setUploading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const name = blank(tpl.board || tpl.title || tpl.file) || title;

  function persist(nd: Data, nt: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaving("saving");
      try {
        const res = await fetch("/api/program/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: docRef, title, fmt: f.fmt, data: nd, text: toText(t, nd, nt) }) });
        if (!res.ok) throw new Error();
        onSaved?.((await res.json()) as WorkspaceDocView);
        setSaving("saved");
      } catch { setSaving("error"); }
    }, 900);
  }
  const upd = (nd: Data) => { setData(nd); persist(nd, text); };
  const updText = (v: string) => { setText(v); persist(data, v); };

  async function attach(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file); fd.set("ref", docRef); fd.set("title", title);
      const res = await fetch("/api/program/uploads", { method: "POST", body: fd });
      const out = (await res.json()) as WorkspaceDocView & { error?: string };
      if (!res.ok) throw new Error(out.error ?? "Upload failed.");
      setUpload(out.upload);
      onSaved?.(out);
    } catch (e) { alert(e instanceof Error ? e.message : "Upload failed."); }
    finally { setUploading(false); }
  }

  let editor: ReactNode;
  if (f.fmt === "sheet" || (f.fmt === "canvas" && st.kind === "table")) {
    const cols = f.fmt === "sheet" ? (tpl.cols ?? []).map((c) => ({ name: s(c[0]), type: s(c[1]) || "text" })) : (Array.isArray(st.cols) ? (st.cols as unknown[]) : []).map((c) => ({ name: s(c), type: "text" }));
    const rows = data?.rows?.length ? data.rows : [cols.map(() => "")];
    editor = <ListEditor name={name} cols={cols} examples={f.fmt === "sheet" ? tpl.rows ?? [] : st.rows ?? []} rows={rows} onRows={(r) => upd({ ...data, rows: r })} disabled={disabled} />;
  } else if (f.fmt === "form") {
    editor = (
      <div className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-black/10">
        <b className="border-b border-black/[0.06] pb-2 text-[14px] text-[var(--primary)]">{name}</b>
        {(tpl.fields ?? []).map((fl) => {
          const k = s(fl[0]), type = s(fl[1]) || "text", v = data?.values?.[k] ?? "";
          const set = (x: string) => upd({ ...data, values: { ...(data?.values ?? {}), [k]: x } });
          return (
            <label key={k} className="grid gap-1">
              <span className="text-[12.5px] font-bold text-[var(--primary)]">{k}</span>
              {type.startsWith("select:") ? <span className="flex flex-wrap gap-1.5">{type.slice(7).split("/").map((o) => <button key={o} type="button" disabled={disabled} onClick={() => set(o)} className={cn("rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors", v === o ? "border-[var(--bridge-teal)] bg-[#e6f3f3] text-[#005a5a]" : "border-black/15 text-black/55 hover:border-black/30")}>{o}</button>)}</span>
                : type === "long" ? <textarea value={v} disabled={disabled} onChange={(e) => set(e.target.value)} placeholder={s(fl[2])} rows={3} className={cn(field, "resize-y")} />
                : <input value={v} disabled={disabled} onChange={(e) => set(e.target.value)} placeholder={s(fl[2]) || (type === "date" ? "dd/mm/yyyy" : type === "person" ? "Name, role" : "")} className={field} />}
            </label>
          );
        })}
      </div>
    );
  } else if (f.fmt === "message") {
    editor = (
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-black/10">
        <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 text-[12px] font-semibold text-white"><MaterialSymbol className="text-[16px]" name="mail" />{tpl.channel ?? "Email"} · New message</div>
        <div className="grid gap-2 p-3">
          <input value={data?.to ?? ""} disabled={disabled} onChange={(e) => upd({ ...data, to: e.target.value })} placeholder={`To: ${blank(tpl.to)}`} className={field} />
          <input value={data?.subject ?? ""} disabled={disabled} onChange={(e) => upd({ ...data, subject: e.target.value })} placeholder={`Subject: ${blank(tpl.subject)}`} className={cn(field, "font-bold")} />
          <textarea value={data?.body ?? ""} disabled={disabled} onChange={(e) => upd({ ...data, body: e.target.value })} rows={8} placeholder={(tpl.body ?? []).map(blank).join("\n")} className={cn(field, "resize-y leading-6")} />
        </div>
      </div>
    );
  } else if (f.fmt === "pack") {
    editor = (
      <div className="grid gap-2 rounded-xl bg-white p-4 ring-1 ring-black/10">
        <b className="text-[14px] text-[var(--primary)]">{name}</b>
        {(tpl.parts ?? []).map((p) => { const k = s(p[0]); const on = !!data?.done?.[k]; return <label key={k} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-black/[0.02]"><input type="checkbox" checked={on} disabled={disabled} onChange={(e) => upd({ ...data, done: { ...(data?.done ?? {}), [k]: e.target.checked } })} className="mt-1 size-4 accent-[var(--bridge-teal)]" /><span className="grid"><b className={cn("text-[13px] capitalize", on ? "text-black/45 line-through" : "text-[var(--primary)]")}>{k.replace(/-/g, " ")}</b><span className="text-[12px] text-[var(--on-surface-variant)]">{s(p[1])}</span></span></label>; })}
        <textarea value={data?.notes ?? ""} disabled={disabled} onChange={(e) => upd({ ...data, notes: e.target.value })} rows={3} placeholder="Notes — where each part lives, anything missing" className={cn(field, "resize-y")} />
      </div>
    );
  } else if (f.fmt === "canvas") {
    if (st.kind === "matrix") {
      const q = st.q ?? [];
      editor = (
        <Board name={name}>
          <div className="grid grid-cols-[26px_minmax(0,1fr)] gap-2">
            <div className="flex items-center justify-center"><span className="-rotate-90 whitespace-nowrap text-[11.5px] font-bold text-[var(--primary)]">{s(st.y)}</span></div>
            <div className="grid grid-cols-2 gap-2">{[0, 1, 2, 3].map((k) => <NoteArea key={k} big label={q[k] ?? `Quadrant ${k + 1}`} tint={k} value={data?.q?.[k]} disabled={disabled} onChange={(v) => { const nq = [...(data?.q ?? ["", "", "", ""])]; nq[k] = v; upd({ ...data, q: nq }); }} />)}</div>
            <span /><span className="text-center text-[11.5px] font-bold text-[var(--primary)]">{s(st.x)}</span>
          </div>
        </Board>
      );
    } else if (st.kind === "grid") {
      editor = (
        <Board name={name}>
          <div className="overflow-x-auto"><div className="grid min-w-[760px] gap-2" style={{ gridTemplateColumns: `repeat(${Number(st.cols) || 3}, minmax(0,1fr))` }}>{(st.cells ?? []).map((c, i) => <div key={i} style={{ gridArea: s(c[2]) || undefined }}><NoteArea big label={s(c[0])} hint={s(c[1])} tint={i} value={data?.cells?.[i]} disabled={disabled} onChange={(v) => { const nc = [...(data?.cells ?? [])]; nc[i] = v; upd({ ...data, cells: nc }); }} /></div>)}</div></div>
        </Board>
      );
    } else {
      const items = (st.items ?? []).map((it) => (Array.isArray(it) ? { name: s(it[0]), hint: s(it[1]) } : { name: s(it), hint: "" }));
      editor = (
        <Board name={name}>
          <div className={cn("grid gap-2", st.kind === "chain" ? "md:grid-flow-col md:auto-cols-fr" : "")}>
            {items.map((it, i) => (
              <div key={i} className="flex items-stretch gap-1.5" style={st.kind === "levels" ? { paddingLeft: i * 22 } : undefined}>
                <div className="flex-1"><NoteArea label={`${i + 1}. ${it.name}`} hint={it.hint} tint={i} value={data?.items?.[i]} disabled={disabled} onChange={(v) => { const ni = [...(data?.items ?? [])]; ni[i] = v; upd({ ...data, items: ni }); }} /></div>
                {st.kind === "chain" && i < items.length - 1 ? <MaterialSymbol className="hidden self-center text-[18px] text-black/30 md:block" name="arrow_forward" /> : null}
              </div>
            ))}
          </div>
        </Board>
      );
    }
  } else {
    editor = (
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-black/10">
        <div className="flex items-center gap-2 border-b border-black/[0.06] px-3 py-2"><span className="flex size-6 items-center justify-center rounded-md bg-[#2b579a] text-white"><MaterialSymbol className="text-[15px]" name="article" /></span><b className="text-[13.5px] text-[var(--primary)]">{name}</b><span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[11px] font-bold text-black/55">Doc</span></div>
        <textarea value={text} disabled={disabled} onChange={(e) => updText(e.target.value)} rows={16} placeholder={`Write or paste the ${title} here.`} className="block w-full resize-y border-0 bg-white p-4 font-mono text-[12.5px] leading-6 text-[var(--primary)] outline-none disabled:text-black/60" />
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {editor}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <span className="flex flex-wrap items-center gap-2">
          {f.fmt === "doc" || f.fmt === "pack" || f.fmt === "canvas" ? (
            <>
              {upload ? <a href={`/api/program/uploads/${upload.id}`} className="flex items-center gap-1.5 rounded-lg bg-[#f1f2f3] px-2.5 py-1 font-semibold text-[var(--primary)] hover:bg-[#e8eaec]"><MaterialSymbol className="text-[16px]" name="attach_file" />{upload.name}<span className="text-black/45">· {Math.max(1, Math.round(upload.size / 1024))} KB</span></a> : null}
              {disabled ? null : (
                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-black/50 hover:bg-black/[0.04] hover:text-[var(--bridge-teal)]">
                  <MaterialSymbol className="text-[16px]" name="upload_file" />{uploading ? "Uploading…" : upload ? "Replace the file" : "Attach a file (deck, PDF, Word · 5 MB)"}
                  <input type="file" className="sr-only" accept=".pdf,.ppt,.pptx,.key,.doc,.docx,.odt,.odp,.xls,.xlsx,.csv,.png,.jpg,.jpeg" onChange={(e) => { const file = e.target.files?.[0]; if (file) void attach(file); e.target.value = ""; }} />
                </label>
              )}
            </>
          ) : null}
        </span>
        <span className="text-black/40">{disabled ? "Locked while it’s with the reviewer" : saving === "saving" ? "Saving…" : saving === "saved" ? "Saved to your workspace" : saving === "error" ? "Not saved — check your connection" : "In your workspace · saves as you type"}</span>
      </div>
    </div>
  );
}
