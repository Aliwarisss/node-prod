export const navLinks = [
  { label: "Workshops", href: "#" },
  { label: "Roadmap", href: "#roadmap", icon: "expand_more", accent: true },
  { label: "Mentors", href: "#", icon: "expand_more", accent: true },
  { label: "Enterprise", href: "#" },
  { label: "Resources", href: "#" },
];

/* The book, roadmap and overview are static pages in /the-book, hosted outside this app.
 * Set bookBaseUrl to where they're hosted (e.g. "https://book.example.com") to show their links;
 * while it's empty, every link to them is hidden. */
export const bookBaseUrl: string = "";
const bookUrl = (path: string) => (bookBaseUrl ? `${bookBaseUrl.replace(/\/$/, "")}${path}` : null);

export const programLinks = {
  roadmap: bookUrl("/program/index.html"),
  syllabus: bookUrl("/program/index.html#syllabus"),
  preview: bookUrl("/sdlc/index.html#/act-discover"),
  overview: bookUrl("/overview/index.html"),
};

/* The headline and one-liners that say what Node is (same as the-book/sdlc/offer.js → headline) */
export const heroHeadline = {
  title: "Develop apps end to end with agentic AI.",
  sub: "From requirements to deployment, in 30 days. No experience needed.",
  lines: [
    { icon: "conversion_path", title: "Requirements to deployment", body: "Learn every step of building an app — not just the code." },
    { icon: "content_paste", title: "Copy, paste, go", body: "Use the ready agent workflows as they are, or configure them to your way of working." },
    { icon: "groups", title: "Agents become your team", body: "No team needed: your agents research, plan, code and test — you decide." },
  ],
};

export const curriculumTracks = [
  {
    title: "Week 1 · Find the problem",
    subtitle: "KICK-OFF // DISCOVER // PLAN",
    href: programLinks.syllabus,
  },
  {
    title: "Week 2 · Shape and build",
    subtitle: "DESIGN // BUILD",
    href: programLinks.syllabus,
  },
  {
    title: "Week 3 · Prove and ship",
    subtitle: "VERIFY // RELEASE",
    href: programLinks.syllabus,
  },
  {
    title: "Week 4 · Run, learn, graduate",
    subtitle: "OPERATE // EVOLVE // CAPSTONE",
    href: programLinks.syllabus,
  },
];

export const whyNodePoints = [
  {
    icon: "conversion_path",
    title: "The whole lifecycle",
    body: "Eight acts from first idea to running and evolving in production — one connected map, not isolated tutorials.",
    accent: "var(--bridge-teal)",
  },
  {
    icon: "handshake",
    title: "You decide, agents help",
    body: "Built for people who work with agents: you drive and sign off, your agents draft, research and check. You get step-by-step access to Claude's flagship models and a path to Claude certifications.",
    accent: "var(--electric-pink)",
  },
  {
    icon: "inventory_2",
    title: "A complete agent kit",
    body: "Not a prompt list. Context files, skills, commands, workflow specs, subagents, guardrails and rubrics — ready to drop into your repo.",
    accent: "#6d48d8",
  },
  {
    icon: "view_stream",
    title: "How real teams deliver",
    body: "Dual-track agile with discovery and delivery in parallel, three backlog levels, and clear Ready and Done gates.",
    accent: "var(--bridge-teal)",
  },
  {
    icon: "straighten",
    title: "Any scale",
    body: "The same lifecycle tuned for solo builders, product teams, enterprises and platform teams.",
    accent: "var(--electric-pink)",
  },
  {
    icon: "construction",
    title: "Project-based, in 30 days",
    body: "A project-based learning roadmap: you take one real project through every act and ship it in the capstone — with a certificate and a portfolio to show for it.",
    accent: "#6d48d8",
  },
];

export const whyNodeCompare = [
  { typical: "Watching lessons and toy exercises", node: "One real project, built end to end" },
  { typical: "Pieces of the stack, one tutorial at a time", node: "The whole lifecycle, idea to evolution" },
  { typical: "Prompt lists you paste and hope", node: "Prompts at five levels plus a full agent kit" },
  { typical: "Agents framed as replacing you", node: "You decide; agents draft, research and check" },
  { typical: "One way of working for everyone", node: "Solo, team, enterprise and platform scales" },
  { typical: "Theory you have to translate", node: "Templates, rubrics and artifacts you actually ship" },
  { typical: "No recognised AI credentials", node: "Free Claude Academy certificates, plus Claude certification prep" },
];

export const roadmapWeeks = [
  {
    week: "Week 1",
    title: "Find the problem",
    acts: [
      { name: "Kick-off", days: "Day 0", open: true, href: bookUrl("/sdlc/index.html#/agents") },
      { name: "Discover", days: "Days 1–5", open: true },
      { name: "Plan", days: "Days 6–8", open: false },
    ],
  },
  {
    week: "Week 2",
    title: "Shape and build",
    acts: [
      { name: "Design", days: "Days 9–11", open: false },
      { name: "Build", days: "Days 12–15", open: false },
    ],
  },
  {
    week: "Week 3",
    title: "Prove and ship",
    acts: [
      { name: "Verify", days: "Days 16–18", open: false },
      { name: "Release", days: "Days 19–21", open: false },
    ],
  },
  {
    week: "Week 4",
    title: "Run, learn, graduate",
    acts: [
      { name: "Operate", days: "Days 22–24", open: false },
      { name: "Evolve", days: "Days 25–27", open: false },
      { name: "Capstone", days: "Days 28–30", open: false },
    ],
  },
];

export const mentorCategories = [
  {
    title: "Principal Architects",
    subtitle: "Ex-FAANG Leadership",
    icon: "verified_user",
    accentClass: "text-[var(--bridge-teal)] bg-[color:color-mix(in_srgb,var(--bridge-teal)_10%,transparent)]",
  },
  {
    title: "Infrastructure Leads",
    subtitle: "System Reliability Experts",
    icon: "terminal",
    accentClass: "text-[var(--electric-pink)] bg-[color:color-mix(in_srgb,var(--electric-pink)_10%,transparent)]",
  },
  {
    title: "Product Engineers",
    subtitle: "Full-Stack Logic Masters",
    icon: "hub",
    accentClass: "text-[var(--safety-orange)] bg-[color:color-mix(in_srgb,var(--safety-orange)_10%,transparent)]",
  },
];

export const partnerMarks = [
  { label: "VS Code", icon: "terminal" },
  { label: "Vercel", icon: "cloud_done" },
  { label: "GitHub", icon: "code_blocks" },
];

export const stats = [
  { value: "12k+", label: "Graduates" },
  { value: "98%", label: "Placement" },
  { value: "250+", label: "Partners" },
  { value: "4.9/5", label: "Satisfaction" },
];

export const problemCards = [
  {
    icon: "terminal",
    title: "Fragmented Knowledge",
    body: "Most learning paths fail to address the complexity of modern orchestration.",
    accent: "var(--bridge-teal)",
  },
  {
    icon: "speed",
    title: "Static Learning",
    body: "Platforms lack the dynamic interaction required for mastering complex systems.",
    accent: "var(--electric-pink)",
  },
  {
    icon: "hub",
    title: "Zero Isolation",
    body: "Real work happens in teams. Node bridges the social gap with collaborative labs.",
    accent: "var(--safety-orange)",
  },
  {
    icon: "analytics",
    title: "No Feedback",
    body: "Get direct precision-level feedback on every architectural decision you make.",
    accent: "var(--primary)",
  },
];

export const audienceCards = [
  {
    index: "01",
    title: "Systems Architects",
    body: "Master the orchestration of complex distributed node networks.",
    accent: "var(--electric-pink)",
  },
  {
    index: "02",
    title: "Product Engineers",
    body: "Evolve from simple component thinkers to full-stack logic masters.",
    accent: "var(--bridge-teal)",
  },
  {
    index: "03",
    title: "Tech Leaders",
    body: "Scale your teams with standardized precision and unified logic.",
    accent: "var(--safety-orange)",
  },
];

export const methodologySteps = [
  {
    step: "STEP_01",
    icon: "school",
    title: "Deep Dive Workshops",
    body: "Master core fundamentals through intense, instructor-led sessions designed for precision.",
    accent: "var(--bridge-teal)",
  },
  {
    step: "STEP_02",
    icon: "psychology",
    title: "Logic Simulations",
    body: "Apply theories in high-pressure sandbox environments with real-time feedback loops.",
    accent: "var(--electric-pink)",
  },
  {
    step: "STEP_03",
    icon: "rocket_launch",
    title: "Enterprise Capstone",
    body: "Ship production-grade systems that are vetted by global industry mentors.",
    accent: "var(--safety-orange)",
  },
];

export const mentors = [
  {
    /* Placeholder name — replace with the real name and title */
    name: "Your Name",
    title: "Founder & Lead Instructor",
    accent: "#6d48d8",
    image: "/node/mentor-lead-illustrated.jpg",
  },
  {
    name: "Dr. Elena Vance",
    title: "Systems Architect, Ex-Google",
    accent: "var(--electric-pink)",
    image: "/node/mentor-elena.jpg",
  },
  {
    name: "Marcus Thorne",
    title: "Node Specialist, Stripe",
    accent: "var(--bridge-teal)",
    image: "/node/mentor-marcus.jpg",
  },
  {
    name: "Sarah Jenkins",
    title: "CTO, LogicBridge",
    accent: "var(--safety-orange)",
    image: "/node/mentor-sarah.jpg",
  },
];

/* The flagship program's name — one place, used everywhere */
export const flagship = { name: "Copy, Paste, Go", kind: "30-day agentic delivery", short: "Copy, Paste, Go" };

/* One price for everything (same as the-book/sdlc/offer.js → fee) */
/* the fee: PKR 5,000 is already 50% off the full PKR 10,000 */
export const programFee = { amount: "PKR 5,000", original: "PKR 10,000", off: "50% off", note: "One-time · 50% off the full PKR 10,000 · the whole 30-day program (Copy, Paste, Go), everything included" };

export const pricingPlans = [
  {
    label: "COPY, PASTE, GO // 30 DAYS",
    price: programFee.amount,
    was: programFee.original,
    off: programFee.off,
    suffix: "one-time",
    cta: "Enroll Now",
    featured: true,
    items: [
      { label: "All 10 modules and the full book", included: true, starred: true },
      { label: "Prompts and agent kits for every step", included: true, starred: true },
      { label: "Project vetting and weekly mentor syncs", included: true, starred: true },
      { label: "Node certificate and Claude certification prep", included: true, starred: true },
      { label: "Hiring-partner access and capstone showcase", included: true, starred: true },
      { label: "Community and lifetime access", included: true, starred: true },
    ],
  },
];

export const footerColumns = [
  {
    title: "Platform",
    accent: "var(--bridge-teal)",
    links: ["Workshops", "Roadmap", "Enterprise"],
  },
  {
    title: "Resources",
    accent: "var(--electric-pink)",
    links: ["API Docs", "Technical Blog", "Forum"],
  },
  {
    title: "Legal",
    accent: "var(--safety-orange)",
    links: ["Privacy", "Terms"],
  },
];

export const audienceImage = "/node/audience.jpg";
