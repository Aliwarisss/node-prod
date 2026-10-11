/* Why Node — the philosophy page (/why). The story is told in chapters; the scene beside it changes with each one.
 * Edit the words here; add to `moreToTell` as new chapters are written (flip `ready` and give it an href). */

export type WhyChapter = {
  stage: number;
  label: string;
  title: string;
  accent: string; // the part of the title in pink
  body: string[];
  chips?: string[];
};

export const whyHero = {
  label: "Our philosophy",
  title: "Every career begins",
  accent: "at the edge of a gap.",
  lead: "Why we’re building Node — and why we’re staying for the whole journey.",
};

export const whyChapters: WhyChapter[] = [
  {
    stage: 1,
    label: "01 · The edge",
    title: "You pass out.",
    accent: "The market doesn’t pause.",
    body: [
      "Years of lectures, labs and exams — and a degree to show for them. Institutes do their part: they build the foundations.",
      "Then you step out into the market, and it speaks a different language. Shipping, not syllabus. Evidence, not grades. Teams, deadlines, tools that weren’t in any course.",
    ],
  },
  {
    stage: 2,
    label: "02 · The gap",
    title: "Between the two,",
    accent: "people fall.",
    body: [
      "Not for lack of talent. The reasons are many — and most of them aren’t anyone’s fault.",
      "Some cross on luck. Many wait at the edge for years. Some never cross at all.",
    ],
    chips: [
      "Theory, never practice",
      "A syllabus behind the market",
      "No real project to show",
      "Never part of a real team",
      "Jobs that ask for experience first",
      "Tools that change every quarter",
      "No one to ask",
      "Confidence, lost on the way",
    ],
  },
  {
    stage: 3,
    label: "03 · The bridge",
    title: "So we built",
    accent: "a bridge.",
    body: [
      "Node is that bridge — aggressive, hands-on training that puts you in the market’s shoes from the first day.",
      "Not more theory. Real work, at the pace the market moves, until doing the job is something you’ve already done.",
    ],
    chips: ["Real projects of your own", "Daily, intensive, hands-on", "The lifecycle the industry runs on", "Experts who ship, beside you", "Agents as your team", "Work reviewed the way employers do"],
  },
  {
    stage: 4,
    label: "04 · Any point",
    title: "Step on",
    accent: "wherever you are.",
    body: [
      "A bridge you can only enter from one end isn’t enough — careers don’t all start in the same place.",
      "Join as a newcomer, a fresh graduate, or ten years in. To break in, to switch, to scale. Enter the market at any point — and stabilise there.",
    ],
    chips: ["Newcomers · kick-start", "Fresh graduates · get market-ready", "Professionals · scale, switch, adapt"],
  },
  {
    stage: 5,
    label: "05 · The partner",
    title: "And we don’t leave",
    accent: "at the other side.",
    body: [
      "Crossing once isn’t the goal — staying relevant is. The market keeps moving, so Node keeps walking with you.",
      "The first job. The first promotion. The new domain. The next shift in technology. A partner for the whole career — not a course you finish and forget.",
    ],
    chips: ["First job", "First promotion", "A new domain", "Leading", "Whatever’s next"],
  },
];

/* the bridge's labels in the scene (short — the full lines are in chapter 03), the ladders in 04, the road in 05 */
export const whyPlanks = ["Real projects", "Hands-on, daily", "Industry lifecycle", "Experts who ship", "Agents as a team", "Real reviews"];
export const whySky = ["", "The edge", "The gap", "The bridge", "Any point", "The partner"];
export const whyEntries = [
  { who: "Newcomer", color: "#e91e63" },
  { who: "Fresh graduate", color: "#4fd1c5" },
  { who: "Professional", color: "#a78bfa" },
];
export const whyMilestones = ["First job", "First promotion", "A new domain", "Leading", "What’s next"];

/* the narration, one script per part of the page (0 the opening … 5 the partner, 6 the beliefs, 7 the close) —
 * written to be heard, not read. Spoken by the browser's own voice; drop a recorded file's path into `whyAudio`
 * at the same index and that part plays the recording instead. */
export const whyNarration = [
  "Every career begins at the edge of a gap. This is why we’re building Node — and why we’re staying for the whole journey.",
  "You pass out. Years of lectures, labs and exams, and a degree to show for them. Institutes do their part. They build the foundations. Then you step into the market — and it speaks a different language. Shipping, not syllabus. Evidence, not grades.",
  "Between the two, people fall. Not for lack of talent. Theory, without practice. A syllabus behind the market. No real project to show. Jobs that ask for experience before they’ll give it. Tools that change every quarter. No one to ask. Some cross on luck. Many wait at the edge for years. Some never cross at all.",
  "So we built a bridge. Node is aggressive, hands-on training that puts you in the market’s shoes from the very first day. Real projects. Real tools. Experts who ship. Not more theory — real work, until doing the job is something you’ve already done.",
  "And a bridge you can only enter from one end isn’t enough. Careers don’t all start in the same place. Join as a newcomer, a fresh graduate, or ten years in. To break in, to switch, or to scale. Step on wherever you are — and stabilise there.",
  "And we don’t leave at the other side. Crossing once isn’t the goal. Staying relevant is. The first job. The first promotion. The new domain. The next shift in technology. Node walks with you. A partner, for the whole career.",
  "What we believe. Doing is learning. The market is the syllabus. Hard beats comfortable. Judgement is the job. Every point is a starting point. And — we stay.",
  "This is only chapter one. There’s much more to tell. Wherever you stand today — cross with us. See you soon.",
];
export const whyAudio: (string | null)[] = [null, null, null, null, null, null, null, null];

export const whyBeliefs = [
  { title: "Doing is learning.", body: "You learn the job by doing the job — real projects, real tools, real reviews." },
  { title: "The market is the syllabus.", body: "We teach what the industry runs on today, and we change when it does." },
  { title: "Hard beats comfortable.", body: "Aggressive, intensive training — because the market won’t go easy on you either." },
  { title: "Judgement is the job.", body: "Agents do the heavy lifting. We train the judgement the market actually pays for." },
  { title: "Every point is a starting point.", body: "No age, degree or past career locks you out. Step on where you stand." },
  { title: "We stay.", body: "A partner for the whole career — through every move, every shift, every next step." },
];

export const moreToTell = {
  title: "This is chapter one.",
  accent: "There’s much more to tell.",
  lead: "The story behind the bridge is still being written. Here’s what’s coming next.",
  items: [
    { icon: "edit_note", title: "The founders’ letter", body: "Why we started Node, and what we saw from both sides of the gap.", ready: false, href: null as string | null },
    { icon: "record_voice_over", title: "Voices from the gap", body: "The people who crossed — where they started, and where they stand now.", ready: false, href: null as string | null },
    { icon: "architecture", title: "Inside the bridge", body: "How a Node program is built — the model, the rubrics, the hands-on rhythm.", ready: false, href: null as string | null },
    { icon: "handshake", title: "Node and the market", body: "The companies, experts and partners we build the bridge with.", ready: false, href: null as string | null },
  ],
};
