import type { KnowledgeEntry, Template } from "./index";

/* A knowledge item with a shape — a canvas (Business Model Canvas, value proposition canvas), a 2×2 (Power–Interest),
 * a chain (Five Whys), levels, steps, a table, a set of fields — as a board the trainee works in, kept in their
 * workspace under "knowledge:<id>". Returns a template-shaped description the editors understand. */

type Row = unknown[];
const s = (x: unknown): string => (Array.isArray(x) ? x.map(s).join(" — ") : x == null ? "" : String(x));
const BOARDABLE = ["grid", "matrix", "chain", "levels", "steps", "cycle", "table", "fields"];

export function boardTemplate(k: KnowledgeEntry, refId: string): Template | null {
  const st = (k.structure ?? {}) as { kind?: string; items?: unknown[]; cols?: unknown; rows?: Row[]; cells?: Row[]; x?: string; y?: string; q?: string[] };
  if (!st.kind || !BOARDABLE.includes(st.kind)) return null;
  const structure = st.kind === "steps" || st.kind === "cycle" ? { ...st, kind: "chain" } : st;
  const tpl = st.kind === "fields"
    ? { fmt: "form", title: k.name, fields: (st.items ?? []).map((it) => [Array.isArray(it) ? s(it[0]) : s(it), "long", Array.isArray(it) ? s(it[1]) : ""]) }
    : { fmt: "canvas", board: k.name, structure };
  return { id: `knowledge:${refId}`, type: k.type ?? "Knowledge", what: k.what ?? "", purpose: k.use ?? "", owner: "", users: [], good: [], tpl };
}
