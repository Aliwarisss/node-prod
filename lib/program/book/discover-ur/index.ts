import type { Book } from "../types";

import { closing, opening } from "./ch0";
import { chapter1 } from "./day1";
import { chapter2 } from "./day2";
import { chapter3 } from "./day3";
import { chapter4 } from "./day4";
import { chapter5 } from "./day5";
import { essence } from "./essence";
import { discoverReadingUr, readingChapterUr } from "./reading";
import { discoverTalksUr } from "./talks";
import { foundations, foundationsQuestions } from "./foundations";
import { discoverQuestionsUr } from "./wh";

/* Discover in Roman Urdu — the same chapters, sections and ids as the English book, so progress, ticks and
 * bookmarks carry across languages. */
export const discoverBookUr: Book = {
  id: "discover",
  number: "1",
  title: "Discover",
  subtitle: "Asal mein kya maujood hai — aur kya hum ise bana sakte hain?",
  act: "discover",
  lang: "ur",
  chapters: [essence, foundations, opening, chapter1, chapter2, chapter3, chapter4, chapter5, closing, readingChapterUr],
  questions: { foundations: foundationsQuestions, ...discoverQuestionsUr },
  reading: discoverReadingUr,
  talks: discoverTalksUr,
};
