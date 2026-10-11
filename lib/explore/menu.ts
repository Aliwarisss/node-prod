/* The Explore mega menu's picks — kept small so the site header doesn't carry the whole map.
 * Ids must exist in lib/explore (scripts/check-explore.ts checks them, and the counts). */
export const exploreHref = "/explore";
export const exploreLink = (kind: string, id: string) => `${exploreHref}?open=${kind}:${id}`;

/* counts shown in the menu — the checker fails if these drift from the data */
export const menuCounts = { skills: 221, roles: 83, subjects: 107, domains: 16 };

type Pick = { id: string; name: string; mono?: string; color?: string; ink?: string };
export const menuSkills: { folder: string; name: string; icon: string; picks: Pick[] }[] = [
  { folder: "languages", name: "Languages", icon: "code", picks: [
    { id: "javascript", name: "JavaScript", mono: "JS", color: "#f7df1e", ink: "#1c1b1b" }, { id: "typescript", name: "TypeScript", mono: "TS", color: "#3178c6" },
    { id: "python", name: "Python", mono: "Py", color: "#3776ab" }, { id: "rust", name: "Rust", mono: "Rs", color: "#b7410e" }, { id: "go", name: "Go", mono: "Go", color: "#00add8" }] },
  { folder: "frontend", name: "Front end", icon: "web", picks: [
    { id: "react", name: "React", mono: "Re", color: "#61dafb", ink: "#0d1117" }, { id: "nextjs", name: "Next.js", mono: "N", color: "#0d1117" }, { id: "vue", name: "Vue", mono: "Vu", color: "#42b883" }, { id: "tailwind", name: "Tailwind", mono: "Tw", color: "#06b6d4" }] },
  { folder: "backend", name: "Back end & APIs", icon: "dns", picks: [
    { id: "nodejs", name: "Node.js", mono: "Nd", color: "#5fa04e" }, { id: "spring", name: "Spring", mono: "Sp", color: "#6db33f" }, { id: "fastapi", name: "FastAPI", mono: "FA", color: "#009688" }, { id: "graphql", name: "GraphQL", mono: "GQL", color: "#e10098" }] },
  { folder: "ai-ml", name: "AI & ML", icon: "neurology", picks: [
    { id: "pytorch", name: "PyTorch", mono: "Pt", color: "#ee4c2c" }, { id: "llm-apis", name: "LLM APIs", mono: "LLM", color: "#d97757" }, { id: "agents", name: "AI agents", mono: "Ag", color: "#e91e63" }, { id: "mcp", name: "MCP", mono: "MCP", color: "#0d1117" }] },
  { folder: "databases", name: "Databases", icon: "database", picks: [
    { id: "postgres", name: "PostgreSQL", mono: "Pg", color: "#4169e1" }, { id: "mongodb", name: "MongoDB", mono: "Mg", color: "#47a248" }, { id: "redis", name: "Redis", mono: "Rd", color: "#dc382d" }] },
  { folder: "devops", name: "DevOps & cloud", icon: "settings_suggest", picks: [
    { id: "docker", name: "Docker", mono: "Dk", color: "#2496ed" }, { id: "kubernetes", name: "Kubernetes", mono: "K8s", color: "#326ce5" }, { id: "aws", name: "AWS", mono: "AWS", color: "#ff9900", ink: "#1c1b1b" }, { id: "terraform", name: "Terraform", mono: "Tf", color: "#7b42bc" }] },
];
export const menuRoles: { folder: string; name: string; color: string; picks: Pick[] }[] = [
  { folder: "software", name: "Software engineering", color: "#007373", picks: [{ id: "frontend-engineer", name: "Front-end" }, { id: "backend-engineer", name: "Back-end" }, { id: "fullstack-engineer", name: "Full-stack" }, { id: "mobile-engineer", name: "Mobile" }] },
  { folder: "ai", name: "AI & machine learning", color: "#e91e63", picks: [{ id: "ai-engineer", name: "AI engineer" }, { id: "ml-engineer", name: "ML engineer" }, { id: "research-scientist", name: "Researcher" }] },
  { folder: "data", name: "Data", color: "#c49000", picks: [{ id: "data-analyst", name: "Data analyst" }, { id: "data-engineer", name: "Data engineer" }, { id: "data-scientist", name: "Data scientist" }] },
  { folder: "infra", name: "Cloud & infrastructure", color: "#0284c7", picks: [{ id: "devops-engineer", name: "DevOps" }, { id: "sre", name: "SRE" }, { id: "cloud-engineer", name: "Cloud" }] },
  { folder: "security", name: "Security", color: "#a3104a", picks: [{ id: "security-engineer", name: "Security engineer" }, { id: "pentester", name: "Pen tester" }, { id: "soc-analyst", name: "SOC analyst" }] },
  { folder: "product-design", name: "Product & design", color: "#f59e0b", picks: [{ id: "product-manager", name: "Product manager" }, { id: "ux-designer", name: "UX designer" }, { id: "business-analyst", name: "Business analyst" }] },
];
export const menuSubjects: { folder: string; name: string; icon: string; color: string; picks: Pick[] }[] = [
  { folder: "foundations", name: "Foundations", icon: "school", color: "#6d48d8", picks: [{ id: "dsa", name: "DSA" }, { id: "discrete-math", name: "Discrete maths" }, { id: "theory-computation", name: "Theory of computation" }] },
  { folder: "systems", name: "Computer systems", icon: "memory", color: "#455a64", picks: [{ id: "os", name: "Operating systems" }, { id: "networks", name: "Networks" }, { id: "distributed", name: "Distributed systems" }] },
  { folder: "software-engineering", name: "Software engineering", icon: "construction", color: "#007373", picks: [{ id: "system-design", name: "System design" }, { id: "software-architecture", name: "Architecture" }, { id: "design-patterns", name: "Design patterns" }] },
  { folder: "ai", name: "Artificial intelligence", icon: "neurology", color: "#e91e63", picks: [{ id: "ml", name: "Machine learning" }, { id: "genai", name: "Generative AI" }, { id: "agentic-ai", name: "Agentic AI" }] },
  { folder: "security", name: "Security", icon: "shield", color: "#a3104a", picks: [{ id: "cybersecurity", name: "Cybersecurity" }, { id: "cryptography", name: "Cryptography" }, { id: "ethical-hacking", name: "Ethical hacking" }] },
  { folder: "cloud-infra", name: "Cloud & infra", icon: "cloud", color: "#0284c7", picks: [{ id: "cloud-computing", name: "Cloud computing" }, { id: "containers", name: "Containers" }, { id: "sre", name: "SRE" }] },
];
export const menuDomains: Pick[] = [
  { id: "fintech", name: "Fintech" }, { id: "healthtech", name: "Health tech" }, { id: "gaming", name: "Games" }, { id: "ai-industry", name: "AI products" }, { id: "ecommerce", name: "E-commerce" }, { id: "edtech", name: "EdTech" },
];
export const menuPopular = [
  { label: "AI engineer", kind: "role", id: "ai-engineer" }, { label: "Full-stack engineer", kind: "role", id: "fullstack-engineer" },
  { label: "Agentic AI", kind: "subject", id: "agentic-ai" }, { label: "System design", kind: "subject", id: "system-design" },
  { label: "TypeScript", kind: "skill", id: "typescript" }, { label: "Rust", kind: "skill", id: "rust" },
];
