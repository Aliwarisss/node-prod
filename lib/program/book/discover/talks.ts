import type { BookChapter, Talk } from "../types";

/* Discover in talks: nine YouTube talks cut into the parts that matter here. Part boundaries come from each video's own
 * chapter marks (and, for the SLI video, which has none, from its transcript), checked on 12 October 2026. Titles and
 * notes are ours; "for" lists the subtopics each part serves. Times are in seconds. */
export const discoverTalks: Talk[] = [
  { id: "x2-rSnhpw0g", title: "Visualising software architecture with the C4 model", by: "Simon Brown", source: "Agile on the Beach", year: "2019", length: 2133, parts: [
    { start: 575, end: 690, title: "The C4 model in brief", what: "Four levels of zoom — context, containers, components, code — and why you settle the abstractions before the notation.", for: ["discover.context.system", "discover.validate.architecture"] },
    { start: 690, end: 828, title: "Level 1: the system context", what: "The system, the people who use it and the systems it talks to — the first diagram of the audit.", for: ["discover.context.system", "discover.context.integrations"] },
    { start: 828, end: 1020, title: "Level 2: containers", what: "The pieces you deploy and run, and how they talk — the level architecture options are sketched at.", for: ["discover.validate.architecture", "discover.context.system"] },
    { start: 1020, end: 1219, title: "Level 3: components", what: "Zooming inside one container — only where it helps someone understand.", for: ["discover.context.system"] },
    { start: 1703, end: 1979, title: "Legends, shapes, colour — diagrams that stand alone", what: "A key on every diagram and a consistent notation, so two option sketches can be compared without a narrator.", for: ["discover.validate.architecture"] },
  ] },
  { id: "P_6eDL1aqtA", title: "Working Effectively with Legacy Code", by: "Michael Feathers & Christian Clausen", source: "GOTO Conferences", year: "2023", length: 2742, parts: [
    { start: 411, end: 855, title: "What makes code legacy?", what: "Less its age than how well you understand what it does. Surprise is the warning sign; tests, the compiler and deliberately introduced errors are ways to learn its behaviour.", for: ["discover.context.system"] },
    { start: 2032, end: 2498, title: "Fixing legacy code — or avoiding it", what: "How much time to put into improving old code versus working around it: the question behind \"improve what's there\" as an option.", for: ["discover.validate.scan"] },
    { start: 2498, end: 2702, title: "Scratch refactoring", what: "Refactor freely to understand the code, then throw the changes away — learning without changing anything.", for: ["discover.context.system"] },
  ] },
  { id: "f84n5oFoZBc", title: "Hammock Driven Development", by: "Rich Hickey", source: "ClojureTV", year: "2010", length: 2389, parts: [
    { start: 638, end: 705, title: "State the problem", what: "Say what the problem is — out loud, on paper — before any solution is in the room.", for: ["discover.frame.separate", "discover.problem.statement"] },
    { start: 705, end: 858, title: "Understand the problem", what: "What do you know, what don't you know, what are the constraints? The questions of the brief and the unknowns.", for: ["discover.context.brief", "discover.frame.unknowns"] },
    { start: 972, end: 1087, title: "More input, better output", what: "Read around the problem: related problems and the solutions others have already found.", for: ["discover.validate.scan"] },
    { start: 1087, end: 1136, title: "Trade-offs", what: "Have more than one solution, and know what each one gives up.", for: ["discover.validate.evaluate", "discover.decide.compare"] },
    { start: 2284, end: 2368, title: "You will be wrong", what: "Being wrong is part of the process — the point is to find out, and move on.", for: ["discover.frame.unknowns"] },
  ] },
  { id: "9MKY4KypBzg", title: "Understanding Latency", by: "Gil Tene", source: "React Conference", year: "2014", length: 4106, parts: [
    { start: 192, end: 562, title: "What latency behaviour is", what: "Latency is a distribution, not a number — describe the whole shape, not one point on it.", for: ["discover.problem.baseline"] },
    { start: 562, end: 966, title: "Seeing the shape of latency", what: "Percentile plots that show the tail an average hides.", for: ["discover.problem.baseline"] },
    { start: 1535, end: 2158, title: "Requirements as latency under load", what: "Stating what's acceptable as percentiles at a given load — the shape of a good quality target.", for: ["discover.frame.quality"] },
    { start: 2158, end: 2607, title: "Sustainable throughput", what: "The load a system can carry while still meeting its latency requirement — what a prototype should be measured against.", for: ["discover.frame.quality", "discover.validate.prototype"] },
    { start: 2607, end: 3304, title: "Coordinated omission", what: "How load tools can quietly leave the worst latencies out — and make a baseline look better than it is.", for: ["discover.problem.baseline", "discover.validate.prototype"] },
    { start: 3304, end: 4106, title: "Tools for better measurement", what: "Measuring latency in ways that keep the tail honest.", for: ["discover.problem.baseline"] },
  ] },
  { id: "tEylFyxbDLE", title: "SLIs, SLOs, SLAs, oh my!", by: "Liz Fong-Jones & Seth Vargo", source: "Google Cloud Tech", length: 485, parts: [
    { start: 64, end: 126, title: "Agree on reliability first", what: "Define what availability means, how much is enough, and what happens if you miss it — agreed with the product owners in advance.", for: ["discover.frame.quality"] },
    { start: 126, end: 187, title: "Why not 100%?", what: "Cost and complexity climb steeply near 100%; every service has its own point where users stop noticing.", for: ["discover.frame.quality"] },
    { start: 187, end: 250, title: "Service level indicators", what: "Metrics over time, summarised with a percentile or median and compared to a threshold — say, 99th-percentile latency under 300 ms over five minutes.", for: ["discover.frame.quality", "discover.problem.baseline"] },
    { start: 250, end: 347, title: "From indicator to objective", what: "An SLO adds the indicator up over a long period — and it's a lower bound as well as an upper one.", for: ["discover.frame.quality"] },
    { start: 347, end: 409, title: "Agreements", what: "An SLA is the commercial promise built on top, set looser than the SLO so there's warning before it's broken.", for: ["discover.frame.quality"] },
  ] },
  { id: "abLan0aXJkw", title: "Performance Analysis Methodology", by: "Brendan Gregg", source: "USENIX LISA '12", year: "2012", length: 5219, parts: [
    { start: 838, end: 1318, title: "Why use a methodology", what: "Methods instead of guesses: a way in that finds the problem rather than the familiar suspects.", for: ["discover.problem.baseline", "discover.problem.causes"] },
    { start: 1318, end: 1493, title: "The streetlight anti-method", what: "Looking where it's easy to look instead of where the problem is — the trap behind answering the pleasant questions first.", for: ["discover.problem.causes", "discover.frame.unknowns"] },
    { start: 1714, end: 2074, title: "The problem statement method", what: "The questions to ask before analysing anything — what makes you think there's a problem, and what changed?", for: ["discover.problem.statement", "discover.problem.reproduce"] },
    { start: 2074, end: 2596, title: "The scientific method", what: "Question, hypothesis, prediction, test, analysis — the shape of a falsifiable hypothesis and a spike.", for: ["discover.frame.unknowns", "discover.frame.spikes"] },
    { start: 2596, end: 2844, title: "Workload characterization", what: "Who is causing the load, why, what it is, and how it changes over time — before you judge a number.", for: ["discover.problem.baseline"] },
    { start: 2844, end: 3108, title: "Drill-down analysis", what: "Starting at the top and descending level by level until you reach the cause.", for: ["discover.problem.causes"] },
    { start: 3544, end: 5219, title: "The USE method", what: "Utilization, saturation and errors for every resource — a checklist for measuring a system before changing it.", for: ["discover.problem.baseline"] },
  ] },
  { id: "Q6RfMmMwhvM", title: "Software Architecture: The Hard Parts", by: "Neal Ford", source: "Developer Summit", length: 3425, parts: [
    { start: 0, end: 96, title: "Everything is a trade-off", what: "Architecture decisions have no best practices — only trade-offs to find and weigh.", for: ["discover.validate.evaluate"] },
    { start: 1888, end: 2032, title: "Apples-to-apples comparison", what: "Comparing options on the same terms, so the comparison is fair.", for: ["discover.validate.evaluate", "discover.decide.compare"] },
    { start: 2398, end: 2693, title: "Communicating with stakeholders", what: "Explaining a trade-off in terms the people who decide can weigh.", for: ["discover.decide.compare"] },
    { start: 2693, end: 3425, title: "From qualitative to quantitative", what: "Turning a qualitative comparison into something measured.", for: ["discover.validate.evaluate", "discover.frame.quality"] },
  ] },
  { id: "LMBqGPLvonU", title: "Lesson 55 — Architecture Decision Records", by: "Mark Richards", source: "Software Architecture Monday", length: 628, parts: [
    { start: 69, end: 170, title: "The structure of an ADR", what: "The sections an ADR has, and what each is for.", for: ["discover.decide.record"] },
    { start: 211, end: 470, title: "Writing an ADR for a real scenario", what: "A worked example, from the situation to the written record.", for: ["discover.decide.record"] },
    { start: 470, end: 574, title: "Tools for ADRs", what: "Tools that keep ADRs with the code and easy to write.", for: ["discover.decide.record"] },
  ] },
  { id: "DngAZyWMGR0", title: "Making Architecture Matter", by: "Martin Fowler", source: "O'Reilly (OSCON keynote)", year: "2015", length: 844, parts: [
    { start: 140, end: 270, title: "Architecture as shared understanding", what: "Architecture as what the experienced people on a project share about how it works — what an audit sets out to recover.", for: ["discover.context.system"] },
    { start: 270, end: 395, title: "Architecture as the decisions that are hard to change", what: "The decisions worth the most care are the hard-to-reverse ones — the ones a decision record is for.", for: ["discover.decide.compare", "discover.decide.record"] },
    { start: 571, end: 844, title: "The design stamina hypothesis", what: "Good internal quality lets a team keep going fast over time — why code health matters when weighing options.", for: ["discover.context.system", "discover.validate.architecture"] },
  ] },
];

/* the page */
export const talksChapter: BookChapter = {
  id: "watch", n: "W", title: "Discover in talks", kicker: "Watch", question: "The parts of nine talks that matter for Discover — each one a clip, played from its own timestamp.",
  intro: [
    { t: "lead", text: "You don't have to watch nine talks end to end. These are the parts that matter here, each cut to its own start and end, and tied to the subtopics it serves." },
    { t: "p", text: "Pick a topic to see only its parts, or read them talk by talk. A part plays as a clip — from its first second to its last — right here; **Next** moves to the following part. The same parts appear at the end of each subtopic they serve." },
    { t: "talks" },
    { t: "note", text: "Timestamps follow each video's own chapter marks (the SLI video, which has none, was cut from its transcript). Titles and notes are ours; the talks belong to their speakers and publishers." },
  ],
  sections: [],
};
