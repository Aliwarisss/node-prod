import { cookies } from "next/headers";

import { discoverBook } from "./discover";
import { discoverBookUr } from "./discover-ur";
import type { Book, BookLang } from "./types";

/* Every book, in each language it's written in. English is always there; other editions share its ids. */
export const BOOKS: Record<string, Partial<Record<BookLang, Book>> & { en: Book }> = {
  discover: { en: discoverBook, ur: discoverBookUr },
};

/* the language to show: ?lang= wins, then the reader's last choice (a cookie), then English */
export async function bookFor(id: string, langParam?: string | string[]) {
  const editions = BOOKS[id];
  if (!editions) return null;
  const asked = typeof langParam === "string" ? langParam : undefined;
  const saved = (await cookies()).get("node_book_lang")?.value;
  const lang = ([asked, saved].find((l) => l && l in editions) ?? "en") as BookLang;
  return { book: editions[lang] ?? editions.en, lang, langs: Object.keys(editions) as BookLang[] };
}
