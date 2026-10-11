export type DashboardProfile = {
  bio?: string | null;
  email?: string | null;
  experienceLevel?: string | null;
  id: string;
  learningGoal?: string | null;
  name?: string | null;
  onboardingCompleted?: boolean | null;
  onboardingSkipped?: boolean | null;
  primaryTrack?: string | null;
  role?: string | null;
  timezone?: string | null;
  weeklyHours?: string | null;
  paymentStatus?: string | null;
  /* contact */
  phone?: string | null;
  linkedin?: string | null;
  /* for the program: the AI tools they have, the computer they'll build on, when live sessions suit them */
  aiTools?: string[] | null;
  device?: string | null;
  sessionTimes?: string[] | null;
  /* for Explore: the role they're aiming for (a role id) and the fields that interest them (domain ids) */
  targetRole?: string | null;
  interests?: string[] | null;
};

/* the choices the onboarding and the profile offer */
export const PROFILE_OPTIONS = {
  experienceLevels: ["New to tech", "Student", "Early career", "Mid-level", "Senior", "Lead / manager"],
  weeklyHours: ["3-5 Hours", "6-8 Hours", "9-12 Hours", "12+ Hours"],
  timezones: ["PKT (UTC+05)", "GST (UTC+04)", "GMT (UTC+00)", "CET (UTC+01)", "EST (UTC-05)", "PST (UTC-08)"],
  tracks: ["Discovery", "Delivery", "Run & learn", "Not sure yet"],
  aiTools: ["ChatGPT", "Claude", "Gemini", "GitHub Copilot", "Cursor", "Claude Code", "None yet"],
  devices: ["Windows", "macOS", "Linux", "Only a phone / tablet"],
  sessionTimes: ["Weekday mornings", "Weekday afternoons", "Weekday evenings", "Weekends"],
} as const;

/* the onboarding's steps — each checklist item says which one fills it in */
export const PROFILE_STEPS = [
  { id: "you", name: "About you", icon: "person" },
  { id: "background", name: "Background", icon: "work_history" },
  { id: "program", name: "The program", icon: "rocket_launch" },
  { id: "explore", name: "Your direction", icon: "explore" },
] as const;
export type ProfileStep = (typeof PROFILE_STEPS)[number]["id"];

type Lean = Record<string, unknown> & { _id: { toString(): string } };
const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/* a user document, as the dashboard needs it */
export function profileOf(u: Lean): DashboardProfile {
  return {
    id: u._id.toString(),
    bio: str(u.bio), email: str(u.email), experienceLevel: str(u.experienceLevel), learningGoal: str(u.learningGoal), name: str(u.name),
    onboardingCompleted: !!u.onboardingCompleted, onboardingSkipped: !!u.onboardingSkipped, primaryTrack: str(u.primaryTrack), role: str(u.role),
    timezone: str(u.timezone), weeklyHours: str(u.weeklyHours), paymentStatus: str(u.paymentStatus),
    phone: str(u.phone), linkedin: str(u.linkedin), aiTools: list(u.aiTools), device: str(u.device), sessionTimes: list(u.sessionTimes),
    targetRole: str(u.targetRole), interests: list(u.interests),
  };
}

export type ProfileChecklistItem = {
  completed: boolean;
  description: string;
  key: string;
  label: string;
  step?: ProfileStep;
};

const filled = (v: string | null | undefined, min = 1) => Boolean(v?.trim() && v.trim().length >= min);

export function buildProfileChecklist(profile: DashboardProfile) {
  const items: ProfileChecklistItem[] = [
    { key: "name", step: "you", label: "Your name", description: "The name mentors and the cohort see.", completed: filled(profile.name, 3) },
    { key: "contact", step: "you", label: "Phone & LinkedIn", description: "So mentors can reach you, and the cohort can connect.", completed: filled(profile.phone) && filled(profile.linkedin) },
    { key: "timezone", step: "you", label: "Timezone", description: "Live sessions are planned around it.", completed: filled(profile.timezone) },
    { key: "experienceLevel", step: "background", label: "Experience", description: "Paces the labs and the feedback.", completed: filled(profile.experienceLevel, 2) },
    { key: "bio", step: "background", label: "Your background", description: "A few lines so mentors skip generic advice.", completed: filled(profile.bio, 24) },
    { key: "primaryTrack", step: "background", label: "Focus", description: "The part of delivery that pulls you most.", completed: filled(profile.primaryTrack, 3) },
    { key: "weeklyHours", step: "program", label: "Weekly time", description: "Sets your pace through the 30 days.", completed: filled(profile.weeklyHours) },
    { key: "setup", step: "program", label: "Your setup", description: "Your AI tools and computer — the agent kit is set up for them.", completed: !!profile.aiTools?.length && filled(profile.device) },
    { key: "sessionTimes", step: "program", label: "Session times", description: "When live sessions suit you — polls use it.", completed: !!profile.sessionTimes?.length },
    { key: "learningGoal", step: "program", label: "Your goal", description: "What you want from Copy, Paste, Go.", completed: filled(profile.learningGoal, 12) },
    { key: "targetRole", step: "explore", label: "Career target", description: "The role you're aiming for — Explore maps the way.", completed: filled(profile.targetRole) },
    { key: "interests", step: "explore", label: "Interests", description: "The fields you'd like to build for.", completed: !!profile.interests?.length },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const remainingItems = items.filter((item) => !item.completed);
  const percentage = Math.round((completedCount / totalCount) * 100);

  return { completedCount, isComplete: remainingItems.length === 0, items, percentage, remainingItems, totalCount };
}
