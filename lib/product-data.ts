export const authHighlights = [
  "Precision roadmap tracking across workshops and labs.",
  "Mentor-guided checkpoints with structured weekly objectives.",
  "Enterprise-grade progress visibility for individuals and teams.",
];

export const authStats = [
  { label: "Active Cohorts", value: "18" },
  { label: "Live Mentors", value: "42" },
  { label: "Weekly Labs", value: "120+" },
];

export const dashboardNav = [
  { label: "Overview", icon: "space_dashboard", href: "/dashboard" },
  { label: "Projects", icon: "workspaces", href: "/dashboard/projects" },
  { label: "Roadmap", icon: "route", href: "/dashboard/roadmap" },
  { label: "Profile", icon: "person", href: "/dashboard/profile" },
  { label: "Mentors", icon: "groups", href: "#" },
  { label: "Labs", icon: "terminal", href: "#" },
  { label: "Reports", icon: "analytics", href: "#" },
  { label: "Settings", icon: "tune", href: "#" },
];

export const dashboardStats = [
  { label: "System Score", value: "94%" },
  { label: "Modules Closed", value: "27" },
  { label: "Mentor Sessions", value: "12" },
  { label: "Lab Velocity", value: "+18%" },
];

export const masterRoadmapPhases = [
  {
    phase: "Phase_01",
    duration: "Week 01-02",
    focus: "Scalability and event choreography",
    title: "Distributed Systems",
    accent: "var(--bridge-teal)",
    detail: "Replica coordination, queues, and event topology.",
    mentor: "Elena Vance",
    modules: ["Event topology", "Queue durability", "Retry semantics"],
    milestones: [
      "Map the event topology for the core service mesh",
      "Validate durable queue semantics under failure",
      "Complete the resilience simulation review",
    ],
    nextMilestone: "Pass the resilience simulation review",
    outcome: "Design resilient event-driven service flows under load.",
  },
  {
    phase: "Phase_02",
    duration: "Week 03-05",
    focus: "Service contracts and domain boundaries",
    title: "Core Architecture",
    accent: "var(--electric-pink)",
    detail: "Domain boundaries, APIs, and resilient service contracts.",
    mentor: "Marcus Thorne",
    modules: ["API seams", "Domain modeling", "Failure boundaries"],
    milestones: [
      "Define domain boundaries for the core platform",
      "Write the architecture decision record",
      "Review failure-boundary tradeoffs with mentors",
    ],
    nextMilestone: "Ship the architecture decision record",
    outcome: "Make reliable architectural tradeoffs with explicit boundaries.",
  },
  {
    phase: "Phase_03",
    duration: "Week 06-08",
    focus: "Deployment, observability, and runtime control",
    title: "Cloud Orchestration",
    accent: "var(--safety-orange)",
    detail: "Deploy pipelines, runtime observability, and infra audits.",
    mentor: "Sarah Jenkins",
    modules: ["Pipeline hardening", "Tracing", "Infrastructure audits"],
    milestones: [
      "Harden the deployment pipeline",
      "Add tracing across critical runtime paths",
      "Finish the production-readiness drill",
    ],
    nextMilestone: "Complete the production-readiness drill",
    outcome: "Operate production-grade systems with visibility and confidence.",
  },
  {
    phase: "Phase_04",
    duration: "Week 09-10",
    focus: "Applied execution in a mentor-reviewed build sprint",
    title: "Enterprise Capstone",
    accent: "var(--primary)",
    detail: "Combine system design, implementation, and review into one end-to-end capstone.",
    mentor: "Node Mentor Board",
    modules: ["Capstone proposal", "Architecture review", "Launch retrospective"],
    milestones: [
      "Draft the capstone proposal",
      "Pass architecture review with the mentor board",
      "Present the production-ready capstone system",
    ],
    nextMilestone: "Present a production-ready capstone system",
    outcome: "Translate the full roadmap into a credible portfolio outcome.",
  },
];

export const dashboardTimeline = [
  {
    label: "Today",
    title: "Simulation Review",
    detail: "Mentor feedback on load-balancer decision tree.",
    accent: "var(--bridge-teal)",
  },
  {
    label: "Tomorrow",
    title: "Logic Lab",
    detail: "High-pressure systems mapping in the sandbox room.",
    accent: "var(--electric-pink)",
  },
  {
    label: "Friday",
    title: "Capstone Sync",
    detail: "Architecture walk-through with enterprise advisors.",
    accent: "var(--safety-orange)",
  },
];

export const dashboardMentors = [
  {
    name: "Elena Vance",
    role: "Systems Architect",
    status: "Available for async review",
  },
  {
    name: "Marcus Thorne",
    role: "Infrastructure Lead",
    status: "1:1 session locked for 4:30 PM",
  },
  {
    name: "Sarah Jenkins",
    role: "CTO Advisor",
    status: "Capstone board feedback published",
  },
];
