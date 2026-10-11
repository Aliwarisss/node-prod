"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import { profilePatchSchema, type ProfilePatch } from "@/lib/auth/schemas";
import { domains } from "@/lib/explore/domains";
import { roleFolders } from "@/lib/explore/roles";
import { PROFILE_OPTIONS as O, PROFILE_STEPS, type DashboardProfile, type ProfileStep } from "@/lib/profile";
import { cn } from "@/lib/utils";

import type { ChecklistSummary } from "./dashboard-types";

type Values = Required<{ [K in keyof ProfilePatch]: NonNullable<ProfilePatch[K]> }>;
type Key = keyof Values;

/* which fields each step asks for */
const FIELDS: Record<ProfileStep, Key[]> = {
  you: ["name", "phone", "linkedin", "timezone"],
  background: ["experienceLevel", "primaryTrack", "bio"],
  program: ["weeklyHours", "aiTools", "device", "sessionTimes", "learningGoal"],
  explore: ["targetRole", "interests"],
};
export const INTRO: Record<ProfileStep, { title: string; line: string; sub: string; color: string }> = {
  you: { title: "Let’s get you set up", line: "How mentors and the cohort know you and reach you.", sub: "Name, contact, timezone", color: "#d81b60" },
  background: { title: "Where you’re coming from", line: "So feedback starts at the right depth — not too basic, not too much.", sub: "Experience and focus", color: "#6d48d8" },
  program: { title: "Copy, Paste, Go", line: "30 days of building a real product with AI agents. These set your pace, your kit and your live sessions.", sub: "Time, tools, sessions", color: "#007373" },
  explore: { title: "Where you’re heading", line: "Explore maps the skills and subjects between you and the role you want.", sub: "Target role, interests", color: "#c49000" },
};
/* an icon for every choice */
export const ICONS: Record<string, string> = {
  "New to tech": "eco", Student: "school", "Early career": "trending_up", "Mid-level": "construction", Senior: "workspace_premium", "Lead / manager": "groups",
  Discovery: "travel_explore", Delivery: "rocket_launch", "Run & learn": "monitoring", "Not sure yet": "help",
  "3-5 Hours": "hourglass_empty", "6-8 Hours": "hourglass_bottom", "9-12 Hours": "hourglass_top", "12+ Hours": "bolt",
  ChatGPT: "chat", Claude: "auto_awesome", Gemini: "diamond", "GitHub Copilot": "code", Cursor: "ads_click", "Claude Code": "terminal", "None yet": "do_not_disturb_on",
  Windows: "desktop_windows", macOS: "laptop_mac", Linux: "terminal", "Only a phone / tablet": "smartphone",
  "Weekday mornings": "wb_twilight", "Weekday afternoons": "light_mode", "Weekday evenings": "dark_mode", Weekends: "weekend",
};
export const TRACK_LINE: Record<string, string> = { Discovery: "Are we building the right thing?", Delivery: "Are we building the thing right?", "Run & learn": "Is it working, and what did we learn?", "Not sure yet": "The month will show you." };
const MAX_INTERESTS = 3;

const inputCls = "h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-3.5 text-[14.5px] text-[var(--primary)] shadow-[0_1px_0_rgba(0,0,0,.02)] outline-none transition placeholder:text-black/30 hover:border-black/20 focus:border-[var(--bridge-teal)] focus:ring-4 focus:ring-[color:color-mix(in_srgb,var(--bridge-teal)_14%,transparent)]";
const errCls = "border-[var(--electric-pink)] ring-4 ring-[color:color-mix(in_srgb,var(--electric-pink)_12%,transparent)]";

/* a group of questions, with a quiet heading */
function Group({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-[20px] border border-black/[0.06] bg-[#fbfbfc] p-4 sm:p-5">
      <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45"><MaterialSymbol className="text-[15px]" name={icon} />{title}</span>
      {children}
    </section>
  );
}

function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <span className="text-[13px] font-semibold text-[var(--primary)]">{label}</span>
      {children}
      {error ? <span className="flex items-center gap-1 text-[12px] font-semibold text-[var(--electric-pink)]"><MaterialSymbol className="text-[15px]" name="error" />{error}</span>
        : hint ? <span className="text-[12px] text-black/45">{hint}</span> : null}
    </div>
  );
}

/* a choice as a chip with its icon — one of many (radio) or several (checkbox) */
function Chips({ options, value, onChange, multi, lines, cols, icon = "radio_button_unchecked" }: { options: readonly string[]; value: string | string[]; onChange: (v: string | string[]) => void; multi?: boolean; lines?: Record<string, string>; cols?: boolean; icon?: string }) {
  const on = (o: string) => (multi ? (value as string[]).includes(o) : value === o);
  const pick = (o: string) => {
    if (!multi) return onChange(value === o ? "" : o);
    const v = value as string[];
    onChange(v.includes(o) ? v.filter((x) => x !== o) : [...v, o]);
  };
  return (
    <div className={cn(cols ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2")} role={multi ? "group" : "radiogroup"}>
      {options.map((o) => (
        <button key={o} type="button" role={multi ? "checkbox" : "radio"} aria-checked={on(o)} onClick={() => pick(o)}
          className={cn("group relative flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-[13.5px] font-semibold transition-all",
            on(o) ? "border-[var(--bridge-teal)] bg-[color:color-mix(in_srgb,var(--bridge-teal)_8%,white)] text-[var(--primary)] shadow-[0_0_0_1px_var(--bridge-teal)]" : "border-black/10 bg-white text-[var(--primary)] hover:-translate-y-px hover:border-black/25 hover:shadow-sm")}>
          <span className={cn("flex size-7 flex-none items-center justify-center rounded-lg transition-colors", on(o) ? "bg-[var(--bridge-teal)] text-white" : "bg-black/[0.04] text-black/50 group-hover:text-[var(--primary)]")}>
            <MaterialSymbol className="text-[16px]" name={ICONS[o] ?? icon} />
          </span>
          <span className="grid flex-1 leading-tight">{o}{lines?.[o] ? <span className="text-[11.5px] font-normal text-black/45">{lines[o]}</span> : null}</span>
          {on(o) ? <MaterialSymbol className="text-[17px] text-[var(--bridge-teal)]" filled name="check_circle" /> : null}
        </button>
      ))}
    </div>
  );
}

/* The onboarding — four short steps, each saved on its own and each skippable; what's skipped stays on
   "Complete your profile" until it's filled in. The same modal edits the profile later. */
export default function OnboardingFlow({ profile, checklist, startStep, onClose, onSaved }: {
  profile: DashboardProfile; checklist: ChecklistSummary; startStep?: ProfileStep;
  onClose: () => void; onSaved: (p: { profile: DashboardProfile; checklist: ChecklistSummary }) => void;
}) {
  const { pushToast } = useToast();
  const [pending, start] = useTransition();
  const [i, setI] = useState(Math.max(0, PROFILE_STEPS.findIndex((s) => s.id === startStep)));
  const [done, setDone] = useState(checklist);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [v, setV] = useState<Values>({
    name: profile.name ?? "", phone: profile.phone ?? "", linkedin: profile.linkedin ?? "", timezone: profile.timezone ?? "",
    experienceLevel: profile.experienceLevel ?? "", primaryTrack: profile.primaryTrack ?? "", bio: profile.bio ?? "",
    weeklyHours: profile.weeklyHours ?? "", aiTools: profile.aiTools ?? [], device: profile.device ?? "", sessionTimes: profile.sessionTimes ?? [], learningGoal: profile.learningGoal ?? "",
    targetRole: profile.targetRole ?? "", interests: profile.interests ?? [],
  });
  const step = PROFILE_STEPS[i];
  const intro = INTRO[step.id];
  const last = i === PROFILE_STEPS.length - 1;
  const set = <K extends Key>(k: K, val: Values[K]) => { setV((c) => ({ ...c, [k]: val })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const role = useMemo(() => roleFolders.flatMap((f) => f.roles).find((r) => r.id === v.targetRole), [v.targetRole]);
  const stepDone = (id: ProfileStep) => done.items.filter((x) => x.step === id).every((x) => x.completed);
  const initials = (v.name || "N").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

  /* skipping the last step still ends the onboarding — the skipped bits stay on "Complete your profile" */
  const next = () => {
    if (!last) return setI(i + 1);
    if (profile.onboardingCompleted) return onClose();
    start(async () => {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "patch", finish: true, fields: {} }) }).catch(() => null);
      const data = res?.ok ? ((await res.json()) as { checklist: ChecklistSummary; profile: DashboardProfile }) : null;
      if (data) onSaved(data);
      onClose();
    });
  };
  function save() {
    const fields = Object.fromEntries(FIELDS[step.id].map((k) => [k, typeof v[k] === "string" ? (v[k] as string).trim() : v[k]]));
    const parsed = profilePatchSchema.safeParse(fields);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((x) => [x.path[0], x.message])));
      return;
    }
    start(async () => {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "patch", finish: last, fields }) });
      const data = (await res.json().catch(() => ({}))) as { checklist?: ChecklistSummary; profile?: DashboardProfile; error?: string };
      if (!res.ok || !data.profile || !data.checklist) {
        pushToast({ variant: "error", title: "Not saved", description: data.error ?? "Try again in a moment." });
        return;
      }
      setDone(data.checklist);
      onSaved({ profile: data.profile, checklist: data.checklist });
      if (last) {
        pushToast({ variant: "success", title: data.checklist.isComplete ? "You’re all set" : "Saved", description: data.checklist.isComplete ? "Your profile is complete." : "Anything you skipped stays on “Complete your profile”." });
        onClose();
      } else setI(i + 1);
    });
  }
  function skipAll() {
    if (profile.onboardingCompleted) return onClose();
    start(async () => {
      await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "skip" }) }).catch(() => null);
      pushToast({ variant: "info", title: "Skipped for now", description: "Finish it any time from “Complete your profile”." });
      onClose();
    });
  }

  const text = (k: "name" | "phone" | "linkedin" | "learningGoal", icon: string, props: { placeholder: string; type?: string; autoComplete?: string }) => (
    <span className="relative block">
      <MaterialSymbol className={cn("pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px]", errors[k] ? "text-[var(--electric-pink)]" : v[k] ? "text-[var(--bridge-teal)]" : "text-black/30")} name={icon} />
      <input value={v[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} className={cn(inputCls, errors[k] && errCls)} {...props} />
    </span>
  );

  return (
    <div className="fixed inset-0 z-[170] flex items-end justify-center bg-[rgba(7,9,13,.62)] backdrop-blur-[6px] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Complete your profile">
      <div className="pop-in grid max-h-[100dvh] w-full max-w-[1040px] overflow-hidden rounded-t-[28px] bg-white shadow-[0_40px_120px_-30px_rgba(0,0,0,.6)] sm:max-h-[92vh] sm:rounded-[28px] md:grid-cols-[300px_minmax(0,1fr)]">
        {/* ---------- the rail: the steps, and the profile taking shape ---------- */}
        <aside className="relative hidden content-between gap-6 overflow-hidden bg-[var(--deep-indigo)] p-6 text-white md:grid" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
          <span className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full opacity-40 blur-3xl transition-colors duration-700" style={{ background: intro.color }} />
          <div className="relative grid gap-6">
            <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4fd1c5]"><MaterialSymbol className="text-[15px]" name="waving_hand" />Welcome to Node</span>
            <ol className="relative grid gap-1">
              <span className="absolute bottom-6 left-[27px] top-6 w-px bg-white/10" aria-hidden="true" />
              {PROFILE_STEPS.map((s, k) => {
                const here = k === i, ok = stepDone(s.id);
                return (
                  <li key={s.id} className="relative">
                    <button type="button" onClick={() => setI(k)} className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors", here ? "bg-white/[0.09]" : "hover:bg-white/[0.05]")}>
                      <span className={cn("relative flex size-8 flex-none items-center justify-center rounded-full ring-4 ring-[var(--deep-indigo)] transition-colors", here ? "text-white" : ok ? "bg-[#4fd1c5] text-[var(--deep-indigo)]" : "bg-[#1f2530] text-white/55")} style={here ? { background: INTRO[s.id].color } : undefined}>
                        <MaterialSymbol className="text-[17px]" name={ok && !here ? "check" : s.icon} />
                      </span>
                      <span className="grid leading-tight">
                        <span className={cn("text-[13.5px] font-semibold", here ? "text-white" : "text-white/70")}>{s.name}</span>
                        <span className="text-[11.5px] text-white/40">{INTRO[s.id].sub}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* the profile, as mentors will see it */}
          <div className="relative grid gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
            <span className="flex items-center gap-3">
              <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-[var(--electric-pink)] text-[15px] font-black">{initials}</span>
              <span className="grid min-w-0 leading-tight">
                <b className="truncate text-[14px]">{v.name || "Your name"}</b>
                <span className="truncate text-[11.5px] text-white/50">{role ? `Aiming for ${role.name}` : v.experienceLevel || "Trainee · Copy, Paste, Go"}</span>
              </span>
            </span>
            {[v.timezone, v.weeklyHours, v.device].some(Boolean) ? (
              <span className="flex flex-wrap gap-1">{[v.timezone, v.weeklyHours && `${v.weeklyHours} a week`, v.device].filter(Boolean).map((x) => <span key={x} className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] text-white/75">{x}</span>)}</span>
            ) : null}
            <span className="grid gap-1.5">
              <span className="flex items-baseline justify-between text-[11.5px] text-white/55">Profile complete<b className="text-[13px] text-white">{done.percentage}%</b></span>
              <span className="h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-[#4fd1c5] to-[var(--electric-pink)] transition-[width] duration-700" style={{ width: `${done.percentage}%` }} /></span>
            </span>
          </div>
        </aside>

        {/* ---------- the step ---------- */}
        <div className="grid max-h-[100dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] sm:max-h-[92vh]">
          <header className="relative grid gap-4 overflow-hidden border-b border-black/[0.06] px-5 pb-5 pt-5 sm:px-8 sm:pt-6">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-[.07] transition-colors duration-700" style={{ background: `linear-gradient(180deg, ${intro.color}, transparent)` }} />
            <div className="relative flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                {PROFILE_STEPS.map((s, k) => <span key={s.id} className={cn("h-1.5 rounded-full transition-all duration-500", k === i ? "w-8" : "w-3", k < i || stepDone(s.id) ? "bg-[var(--bridge-teal)]" : k === i ? "" : "bg-black/10")} style={k === i ? { background: intro.color } : undefined} />)}
                <span className="ml-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/40">{i + 1} / {PROFILE_STEPS.length}</span>
              </span>
              <button type="button" onClick={skipAll} disabled={pending} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold text-black/45 transition-colors hover:bg-black/[0.05] hover:text-[var(--primary)]">{profile.onboardingCompleted ? "Close" : "Skip for now"}<MaterialSymbol className="text-[17px]" name="close" /></button>
            </div>
            <div key={step.id} className="relative flex items-start gap-4 [animation:node-pop_.45s_cubic-bezier(.2,.8,.3,1)_both]">
              <span className="hidden size-12 flex-none items-center justify-center rounded-2xl text-white shadow-lg sm:flex" style={{ background: intro.color, boxShadow: `0 12px 28px -12px ${intro.color}` }}><MaterialSymbol className="text-[24px]" name={step.icon} /></span>
              <span className="grid gap-1">
                <h2 className="text-[22px] font-bold leading-tight tracking-[-0.01em] text-[var(--primary)]">{intro.title}</h2>
                <p className="max-w-xl text-[13.5px] leading-6 text-[var(--on-surface-variant)]">{intro.line}</p>
              </span>
            </div>
          </header>

          <div key={step.id} className="grid min-h-0 content-start gap-4 overflow-y-auto overscroll-contain px-5 py-5 [animation:node-pop_.45s_cubic-bezier(.2,.8,.3,1)_both] sm:px-8">
            {step.id === "you" ? (
              <>
                <Group icon="badge" title="Who you are">
                  <Field label="Full name" error={errors.name}>{text("name", "person", { placeholder: "Your name", autoComplete: "name" })}</Field>
                </Group>
                <Group icon="contact_phone" title="How to reach you">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Phone / WhatsApp" hint="For session reminders and your mentor." error={errors.phone}>{text("phone", "call", { placeholder: "+92 300 1234567", type: "tel", autoComplete: "tel" })}</Field>
                    <Field label="LinkedIn" hint="So the cohort can connect with you." error={errors.linkedin}>{text("linkedin", "link", { placeholder: "linkedin.com/in/your-name", autoComplete: "url" })}</Field>
                  </div>
                </Group>
                <Group icon="schedule" title="Your time">
                  <Field label="Timezone" hint="Live sessions are planned around it."><Chips icon="public" options={O.timezones} value={v.timezone} onChange={(x) => set("timezone", x as string)} /></Field>
                </Group>
              </>
            ) : step.id === "background" ? (
              <>
                <Group icon="work_history" title="Experience">
                  <Field label="Where are you today?"><Chips options={O.experienceLevels} value={v.experienceLevel} onChange={(x) => set("experienceLevel", x as string)} /></Field>
                </Group>
                <Group icon="explore" title="Focus">
                  <Field label="What pulls you most?" hint="The month covers all three — this is where we’ll stretch you."><Chips cols options={O.tracks} value={v.primaryTrack} onChange={(x) => set("primaryTrack", x as string)} lines={TRACK_LINE} /></Field>
                </Group>
                <Group icon="edit_note" title="In your words">
                  <Field label="Your background" hint={`What you study or do, and what you’ve built. ${v.bio.trim().length < 24 ? `${24 - v.bio.trim().length} more characters` : "Looks good."}`} error={errors.bio}>
                    <textarea value={v.bio} onChange={(e) => set("bio", e.target.value)} rows={4} placeholder="Final-year CS student; I’ve built a few React apps and want to ship something real end to end." className={cn(inputCls, "h-auto py-3 pl-3.5 leading-6", errors.bio && errCls)} />
                  </Field>
                </Group>
              </>
            ) : step.id === "program" ? (
              <>
                <Group icon="timer" title="Your pace">
                  <Field label="Time you can give each week" hint="Sets your pace through the 30 days."><Chips options={O.weeklyHours} value={v.weeklyHours} onChange={(x) => set("weeklyHours", x as string)} /></Field>
                </Group>
                <Group icon="smart_toy" title="Your setup">
                  <Field label="AI tools you have access to" hint="Pick all that apply — your agent kit is set up for them."><Chips multi options={O.aiTools} value={v.aiTools} onChange={(x) => set("aiTools", x as string[])} /></Field>
                  <Field label="The computer you’ll build on"><Chips options={O.devices} value={v.device} onChange={(x) => set("device", x as string)} /></Field>
                </Group>
                <Group icon="videocam" title="Live sessions">
                  <Field label="When do they suit you?" hint="Session polls start from these."><Chips multi options={O.sessionTimes} value={v.sessionTimes} onChange={(x) => set("sessionTimes", x as string[])} /></Field>
                </Group>
                <Group icon="flag" title="Your goal">
                  <Field label="What do you want from the program?" error={errors.learningGoal}>{text("learningGoal", "target", { placeholder: "Ship a real product with AI agents and a portfolio to show for it." })}</Field>
                </Group>
              </>
            ) : (
              <>
                <Group icon="work" title="The role">
                  <Field label="The role you’re aiming for" hint="Not sure? Pick the closest — you can change it in Explore." error={errors.targetRole}>
                    <span className="relative block">
                      <MaterialSymbol className={cn("pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px]", v.targetRole ? "text-[var(--bridge-teal)]" : "text-black/30")} name="work" />
                      <select value={v.targetRole} onChange={(e) => set("targetRole", e.target.value)} className={cn(inputCls, "appearance-none pr-10")}>
                        <option value="">Choose a role</option>
                        {roleFolders.map((f) => <optgroup key={f.id} label={f.name}>{f.roles.map((r) => <option key={r.id} value={r.id}>{r.name}{r.fresher ? "" : " (experienced)"}</option>)}</optgroup>)}
                      </select>
                      <MaterialSymbol className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[20px] text-black/40" name="expand_more" />
                    </span>
                    {role ? (
                      <span className="flex items-start gap-3 rounded-2xl border border-[var(--bridge-teal)]/25 bg-[color:color-mix(in_srgb,var(--bridge-teal)_6%,white)] px-4 py-3 text-[12.5px] leading-5 text-black/60">
                        <MaterialSymbol className="mt-0.5 text-[18px] text-[var(--bridge-teal)]" name="lightbulb" />
                        <span><b className="text-[var(--primary)]">{role.name}.</b> {role.line}<span className="mt-1 block text-black/45"><b className="font-semibold text-black/55">Way in:</b> {role.entry}</span></span>
                      </span>
                    ) : null}
                  </Field>
                </Group>
                <Group icon="interests" title={`Fields to build for · ${v.interests.length} of ${MAX_INTERESTS}`}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {domains.map((d) => {
                      const on = v.interests.includes(d.id);
                      const full = !on && v.interests.length >= MAX_INTERESTS;
                      return (
                        <button key={d.id} type="button" role="checkbox" aria-checked={on} disabled={full} onClick={() => set("interests", on ? v.interests.filter((x) => x !== d.id) : [...v.interests, d.id])}
                          className={cn("flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all disabled:opacity-35", on ? "border-[var(--bridge-teal)] bg-[color:color-mix(in_srgb,var(--bridge-teal)_8%,white)] shadow-[0_0_0_1px_var(--bridge-teal)]" : "border-black/10 bg-white hover:-translate-y-px hover:border-black/25 hover:shadow-sm")}>
                          <span className="flex size-8 flex-none items-center justify-center rounded-xl text-white" style={{ background: d.color }}><MaterialSymbol className="text-[17px]" name={d.icon} /></span>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--primary)]">{d.name}</span>
                          {on ? <MaterialSymbol className="text-[18px] text-[var(--bridge-teal)]" filled name="check_circle" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </Group>
              </>
            )}
          </div>

          <footer className="flex items-center gap-2 border-t border-black/[0.06] bg-white/90 px-5 py-3.5 backdrop-blur sm:px-8">
            {i > 0 ? <button type="button" onClick={() => setI(i - 1)} className="flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-bold text-black/55 transition-colors hover:bg-black/[0.04] hover:text-[var(--primary)]"><MaterialSymbol className="text-[17px]" name="arrow_back" />Back</button> : null}
            <span className="ml-auto hidden items-center gap-1 text-[11.5px] text-black/40 lg:flex"><MaterialSymbol className="text-[15px]" name="cloud_done" />Each step saves on its own</span>
            <button type="button" onClick={next} disabled={pending} className="ml-auto whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-bold text-black/50 transition-colors hover:text-[var(--primary)] sm:px-4 lg:ml-2">{last ? "Skip and finish" : <>Skip<span className="hidden sm:inline"> this step</span></>}</button>
            <button type="button" onClick={save} disabled={pending} className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(13,17,23,.8)] transition-transform hover:-translate-y-px disabled:opacity-60">
              {pending ? "Saving…" : last ? "Finish" : <><span className="hidden sm:inline">Save &amp; continue</span><span className="sm:hidden">Continue</span></>}<MaterialSymbol className="text-[17px]" name={last ? "check" : "arrow_forward"} />
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
