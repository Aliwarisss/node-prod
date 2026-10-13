/* A reader's highlights, notes and bookmarks, as the client sees them (no server imports — safe in the reader) */
export const HIGHLIGHT_COLORS = ["yellow", "green", "blue", "pink"] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];
export const HIGHLIGHT_HEX: Record<HighlightColor, string> = { yellow: "#fde68a", green: "#bbf7d0", blue: "#bfdbfe", pink: "#fbcfe8" };
export type BookMark = {
  id: string;
  book: string;
  lang: "en" | "ur";
  page: string;
  kind: "highlight" | "bookmark";
  color: HighlightColor;
  quote: string;
  note: string;
  block: number;
  occ: number;
  at: string; // ISO date, last changed
};
