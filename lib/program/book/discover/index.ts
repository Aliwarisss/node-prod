import type { Book } from "../types";

import { closing, opening } from "./ch0";
import { chapter1 } from "./day1";
import { chapter2 } from "./day2";
import { chapter3 } from "./day3";
import { chapter4 } from "./day4";
import { chapter5 } from "./day5";
import { essence } from "./essence";
import { discoverReading, readingChapter } from "./reading";
import { discoverTalks } from "./talks";
import { foundations, foundationsQuestions } from "./foundations";
import { discoverQuestions } from "./wh";

/* Chapter 1 of the book — Discover: its essence on one page, its prerequisites (what it is built on, generated from the program data), an introduction, five topics (1.1–1.5, each with its subtopics) and a closing.
 * One file per topic, so each can be written and reviewed on its own. (Inside the data a topic is a BookChapter.) */
export const discoverBook: Book = {
  id: "discover",
  number: "1",
  title: "Discover",
  subtitle: "What’s really there — and can we build it?",
  act: "discover",
  lang: "en",
  chapters: [essence, foundations, opening, chapter1, chapter2, chapter3, chapter4, chapter5, closing, readingChapter],
  questions: { foundations: foundationsQuestions, ...discoverQuestions },
  reading: discoverReading,
  talks: discoverTalks,
};
