# Node — Design

How Node looks, moves and speaks: the public site (landing, Programs, Explore, roadmaps), the trainee and admin dashboards, and the program player. This file describes **type, space, layout, components, motion and voice**. Colour is deliberately left out — see the code (`app/globals.css`, `lib/platform-data.ts`, `components/platform/program-posters.tsx`) for the palette.

---

## 1. Principles

1. **Editorial, not decorative.** Big type, hairline rules, mono labels and generous space do the work. No glows, gradients-as-decoration, grain, blur or 3D.
2. **One idea per block.** Every section answers one question. If a sentence repeats something said nearby, cut it.
3. **Show the structure.** Numbers, indexes, steps and timelines make the shape of things visible: `01 / 07`, `Step 3 of 5`, `Days 12–15`.
4. **Calm motion.** Things rise, fade, wipe and draw. Nothing scales, warps, spins fast or blurs in transitions.
5. **Breathable.** When in doubt, add space and remove a line.
6. **Real data, never invented.** Numbers come from the data (the book, the program, the map). Placeholders are marked as such in the code.

---

## 2. Typography

### Families

| Role | Family | Weights | Used for |
|---|---|---|---|
| Display | **Montserrat** (`--font-montserrat`, `font-heading`) | 700, 800, 900 | Titles, big numbers, program names, buttons |
| Text | **Geist Sans** (`--font-geist-sans`) | 400–800 | Body copy, UI text, form fields |
| Labels | **Geist Mono** (`--font-geist-mono`) | 700 | Kickers, indexes, lengths, status pills, table headers |

### Rules

- **Display type is uppercase, 900 weight, tight tracking** (`-0.03em` to `-0.055em`), line-height `.86–.95`.
- **Mono labels are uppercase, 700 weight, wide tracking** (`.12em–.18em`), 10–12px.
- Body text sits at **15–17px**, line-height **1.6–1.75**, and never runs wider than **~60ch**.
- Use `text-wrap: balance` on headings that wrap.

### Scale

| Token | Size | Where |
|---|---|---|
| Hero | `clamp(2.4rem, 6vw, 4.8rem)` | Page heroes (Explore, Programs, roadmaps) |
| Poster | `clamp(3.2rem, 8.6vw, 8.4rem)` | Slider titles |
| Section | `clamp(2.6rem, 5.6vw, 5.2rem)` | Section titles below the slider |
| Card title | 15–19px, 900 | Program names in cards, grids and columns |
| Big number | 34–46px, 900 | Stats (`30 days`, `8 acts`), prices, counters |
| Lead | 16–19px | Taglines, intros |
| Body | 14–16px | Everything else |
| Label | 10–12px mono | Kickers, table heads, chips |

---

## 3. Space and layout

### Containers

| Context | Max width | Side gutter |
|---|---|---|
| Programs page sections | `min(1180px, 100% − 64px)` | 20px on phones |
| Slider content | `min(1240px, 100% − 48px)` | — |
| Explore / roadmap pages | `max-w-6xl` / `max-w-5xl` | 16px |
| Dashboards | Fluid inside the dashboard chrome | — |

### Rhythm

- **Section padding:** `clamp(120px, 16vh, 184px)` top, `clamp(112px, 15vh, 168px)` bottom. Phones: ~100px.
- **Gap between a heading and its content:** `clamp(56px, 7vw, 88px)`.
- **Column gutter:** `clamp(48px, 7vw, 112px)`.
- **List rows:** 26–34px vertical padding.
- **Grids of items:** 40–72px between items; separate with space before reaching for a line.
- Components use a **4px base** (Tailwind spacing) internally.

### Grids

- **Two-column editorial:** `7fr / 5fr` — words left, artwork or a card right.
- **Comparisons:** a label column plus one column per item, rows aligned; scrolls sideways inside its own frame on small screens, never the page.
- **Card grids:** 1 → 2 → 3 columns (`sm`, `lg`).

### Breakpoints

- Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280) across the app.
- The poster system (`cinema.module.css`) switches to a single column at **900px**.
- Landing "deck" sections fit to one screen at `min-width: 900px` and `min-height: 600px`; they scale content down rather than overflow.

---

## 4. Shape and lines

- **Radius:** base `--radius: 1.375rem` (22px), with scaled steps (`--radius-sm` … `--radius-4xl`). Cards 16–28px, chips and buttons fully round, small badges 4–12px.
- **Hairlines:** 1px rules at low ink opacity. Use a **1.5px rule** only to start a block (a list, a facts row, a FAQ).
- **No drop shadows** on resting elements. A soft, long shadow may appear on **hover** to lift a card.
- **No borders on everything:** prefer a quiet tinted panel or plain space.

---

## 5. Components

### Text blocks
- **Kicker** — mono label above a title: `WHICH ONE?`, `THE PATH`, `01 / 07 · LIVE NOW`.
- **Title with mask** — each word sits in an `overflow: hidden` span and rises into place.
- **Lead** — one or two sentences, max ~54ch, slightly muted.

### Buttons
- **Pill buttons**, Montserrat 900, uppercase, `.06em` tracking, 12–13px, padding `15px 24px` (phones `12px 18px`).
- **Solid** (primary) and **line** (secondary) variants; the line variant fills on hover.
- At most **two** buttons per block. Arrow icon after the label on the primary one.

### Status pill
- Mono, uppercase, outlined; filled for the live/primary state. Labels: `Live now`, `Coming soon`, `In the making`.

### Facts row
- Two to three label/value pairs separated by thin vertical rules: `LENGTH 30 days | FOR No experience needed | PRICE PKR 5,000`.

### Stats
- Big number + short label, no dividers: `30 days · 8 acts · 1 real app`.

### Cards
- **Content card:** radius 16–24px, quiet border or tint, 14–20px padding, lifts 2–4px on hover.
- **Mini poster tile** (program overview): flat field, number + status dot, name, length.
- **Skill badge** (`Mono`): a short mark (`JS`, `Rs`, `K8s`) on a rounded square; sizes 18–60px.

### Lists
- **Sentence rows** (Start where you are): dot · sentence · target · arrow; the row shifts right on hover.
- **Numbered items** (inclusions): small mono number, then the item, separated by space and a thin top rule.
- **Class rows**: big hours + name.

### Comparison grid
- One column per program with a thin bar on top that draws in; rows for length, audience and status, softly banded instead of ruled.

### Accordion (questions)
- Question in Montserrat 800, `+` icon that rotates 45° when open, answer in muted body text. One short answer per question.

### Navigation
- **Site header** — a floating pill, centred, that switches between light and dark to contrast with the section under it.
- **Mega menus** (Programs, Explore) — wide panels following the header's theme; a featured block, a list, and a footer row.
- **Slider index** — numbered list of every slide; the line under the current one is the timer.
- **Dashboard chrome** — dark sidebar, quiet top bar, section groups (Admin / Learn).

### Overlays
- **Side panel** (Explore details): slides in from the right, 420–480px, scrolls internally, closes on backdrop click or Escape.
- **Drawers / sheets** on phones replace side columns.

---

## 6. Page patterns

### Program slider (`program-cinema.tsx`)
Full-screen posters, one per program plus an overview. Each poster: index and status, title, tagline, facts, two buttons, a drawn **motif** (a simple SVG that says what the program is), and the length set large. Autoplays (8s), pauses on hover, focus, off-screen and hidden tabs. Arrows, keyboard (← →) and swipe.

### Programs page (`programs-view.tsx`)
The slider introduces; the page **decides**: where to start → what's in the live program → the path side by side → masterclasses → questions → enroll. Nothing on the page repeats the slider.

### Explore (`explore-view.tsx`)
Hero with counts and popular picks → sticky tabs and search → folder chips → card grids → side panel that links to everything related. Extra tabs: **Career map** (a ring of roles linked by shared skills, with a path-finder) and **My map** (progress toward a goal role).

### Roadmap (`/explore/roadmap/[role]`)
Hero with steps, months and stages → progress (signed in) → three stages of numbered steps, each with time, where Node teaches it, and status → your path at Node → ask a mentor → similar roles.

### Dashboards
Cards on a quiet canvas inside the dashboard chrome; tables for admin lists; toasts for results; never a silent failure — errors are written in the form itself.

---

## 7. Motion

| Pattern | What moves | Duration | Easing |
|---|---|---|---|
| **Curtain wipe** (slide change) | `clip-path: inset()` from the side you're heading to | 950ms | `cubic-bezier(.86, 0, .07, 1)` |
| **Word rise** | `translateY(105% → 0)` inside a mask, 80ms stagger | 900ms | `cubic-bezier(.2, .8, .2, 1)` |
| **Fade up** | opacity + 14px rise | 700ms | `cubic-bezier(.2, .8, .2, 1)` |
| **Draw** | SVG `stroke-dashoffset → 0` | 1–1.4s | `cubic-bezier(.6, 0, .2, 1)` |
| **Pop / slide in** | small shapes into place (scale from .4, or a short translate) | 600–800ms | `cubic-bezier(.2, .8, .2, 1)` |
| **Bar fill** | `scaleX(0 → 1)` (timers, comparison bars) | per use | linear / ease |
| **Hover lift** | `translateY(-2px … -4px)` | 250ms | ease |

Rules:
- Sections play their entrance **once**, when they first scroll into view (`PosterBand`, `data-state="current"`).
- Slow ambient motion only where it means something (an orbit "in the making", a blinking cursor).
- No transition uses **blur, scale-up, rotation or skew**.
- Keyframes live in CSS modules; trigger them with **data attributes**, not CSS variables holding keyframe names (modules rename keyframes).
- Coordinates in generated SVGs are **rounded** so the server and browser render identical markup.

### Reduced motion
`prefers-reduced-motion: reduce` turns off wipes, rises, drawing, ambient loops and autoplay; content simply appears.

---

## 8. Iconography and illustration

- **Material Symbols, outlined** (`@material-symbols/font-400`), via `<MaterialSymbol name="…" />`. Filled variant only for an active/selected state.
- Icon size follows text: 15–22px inline, 24–38px in tiles.
- **Motifs** are hand-built SVG line drawings, one per program, made of a few primitives (rects, circles, lines, one word of mono text). They use the current text colour, so they work on any field.
- No stock photography in product surfaces.

---

## 9. Responsive behaviour

- Phones get **one column**; artwork moves above the words and shrinks; secondary facts and long taglines are trimmed (`line-clamp: 3`).
- Wide tables and grids **scroll inside their frame**; the page never scrolls sideways.
- Side columns become **drawers/sheets** that sit above the site header.
- Tap targets are at least **40px**.

---

## 10. Accessibility

- Semantic headings per section; decorative layers are `aria-hidden`.
- **Carousel:** `aria-roledescription="carousel"`, slides labelled `n of N: Title`, only the current slide is exposed and focusable, a polite live counter, pause control.
- **Animated titles** keep the full text in `aria-label` while the masked words are hidden from screen readers.
- Dialogs/side panels: `role="dialog"`, close on Escape.
- Keyboard: every interactive element is a real `button` or link; arrow keys only act when their widget is on screen and the focus isn't in a field.
- Never rely on colour alone — status is always written (`Live now`, `Coming soon`).

---

## 11. Voice and content

- **Short.** One line where one line works. Answers to questions fit in a sentence.
- **Plain words.** "Build an app", not "leverage agentic workflows". Explain jargon once, in place.
- **Direct and warm.** Address the reader ("you"). Say what happens next.
- **Honest.** Mark what's coming (`Coming soon`, `In the making`), never imply it's available.
- **Numbers with units:** `30 days`, `2–4 hours`, `PKR 5,000`. En dash for ranges, `→` for progressions.
- **Sentence case** for body and buttons in source; display type is uppercased by CSS, not in the text.
- Typographic apostrophes and quotes (`’ “ ”`).

### Names

| Name | What it is |
|---|---|
| **Node** | The platform |
| **The NODE model** | The lifecycle every program runs on (eight acts) |
| **Hello, World** | 15-day first look at computer science |
| **Copy, Paste, Go** | 30-day agentic delivery — the flagship, live |
| **Dots — My Team for ‘X’** | 1-month team program |
| **The NODE** | 3-month journey (in the making) |
| **Nano Degree** | 6-month specialisation |
| **A Day at NODE** | 2–4 hour masterclasses |
| **Explore** | The map of computer science (skills, roles, subjects, industries) |

---

## 12. Where things live

| Concern | File |
|---|---|
| Global tokens, fonts, radius | `app/globals.css`, `app/layout.tsx` |
| Poster system (slider + sections) | `components/platform/cinema.module.css` |
| Program motifs and fields | `components/platform/program-posters.tsx` |
| Slider | `components/platform/program-cinema.tsx` |
| Programs page | `components/platform/programs-view.tsx`, `poster-band.tsx` |
| Site header and mega menus | `components/platform/site-header.tsx` |
| Explore | `components/platform/explore-view.tsx`, `components/platform/explore/*` |
| Program and catalog data | `lib/platform-data.ts`, `lib/node-landing-data.ts` |
| Explore map data | `lib/explore/*` (check with `npx tsx scripts/check-explore.ts`) |
