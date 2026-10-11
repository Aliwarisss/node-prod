"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import { profilePatchSchema, type ProfilePatch } from "@/lib/auth/schemas";
import { domains } from "@/lib/explore/domains";
import { roleFolders } from "@/lib/explore/roles";
import { PROFILE_OPTIONS as O, PROFILE_STEPS, type DashboardProfile, type ProfileStep } from "@/lib/profile";
import { cn } from "@/lib/utils";

import type { ChecklistSummary } from "./dashboard-types";
import { ICONS, INTRO, TRACK_LINE } from "./onboarding-flow";
import { WelcomeTour } from "./welcome-tour";

type Values = Required<{ [K in keyof ProfilePatch]: NonNullable<ProfilePatch[K]> }>;
type Key = keyof Values;
type Kind = "text" | "long" | "one" | "many" | "role" | "interests";
export type Question = { key: Key; step: ProfileStep; kind: Kind; title: string; line: string; icon: string; required?: boolean; placeholder?: string; type?: string; autoComplete?: string; options?: readonly string[]; lines?: Record<string, string> };

const MAX_INTERESTS = 3;
/* the first-run onboarding, one question at a time */
export const QUESTIONS: Question[] = [
  { key: "name", step: "you", kind: "text", icon: "person", required: true, title: "First, what’s your full name?", line: "It’s how mentors and your cohort will see you.", placeholder: "Type your name", autoComplete: "name" },
  { key: "phone", step: "you", kind: "text", icon: "call", type: "tel", title: "What’s your phone or WhatsApp number?", line: "For live-session reminders and your mentor. Never shared outside Node.", placeholder: "+92 300 1234567", autoComplete: "tel" },
  { key: "linkedin", step: "you", kind: "text", icon: "link", title: "Your LinkedIn profile?", line: "So the cohort can connect — and so your certificate can link to it.", placeholder: "linkedin.com/in/your-name", autoComplete: "url" },
  { key: "timezone", step: "you", kind: "one", icon: "public", title: "Which timezone are you in?", line: "Live sessions are planned around the cohort’s timezones.", options: O.timezones },
  { key: "experienceLevel", step: "background", kind: "one", icon: "work_history", title: "Where are you today?", line: "So feedback starts at the right depth — not too basic, not too much.", options: O.experienceLevels },
  { key: "primaryTrack", step: "background", kind: "one", icon: "explore", title: "What pulls you most?", line: "The month covers all three — this is where we’ll stretch you.", options: O.tracks, lines: TRACK_LINE },
  { key: "bio", step: "background", kind: "long", icon: "edit_note", title: "Tell us a little about your background.", line: "What you study or do, and anything you’ve built.", placeholder: "Final-year CS student; I’ve built a few React apps and want to ship something real end to end." },
  { key: "weeklyHours", step: "program", kind: "one", icon: "timer", title: "How much time can you give each week?", line: "Copy, Paste, Go is 30 days of building a real product with AI agents. This sets your pace.", options: O.weeklyHours },
  { key: "aiTools", step: "program", kind: "many", icon: "smart_toy", title: "Which AI tools do you have access to?", line: "Pick all that apply — your agent kit is set up for them.", options: O.aiTools },
  { key: "device", step: "program", kind: "one", icon: "computer", title: "What will you build on?", line: "Some steps differ by system — we’ll show you yours.", options: O.devices },
  { key: "sessionTimes", step: "program", kind: "many", icon: "videocam", title: "When do live sessions suit you?", line: "Pick all that work — session polls start from these.", options: O.sessionTimes },
  { key: "learningGoal", step: "program", kind: "text", icon: "flag", title: "What do you want from the program?", line: "One line is enough — your mentor reads it.", placeholder: "Ship a real product with AI agents and a portfolio to show for it." },
  { key: "targetRole", step: "explore", kind: "role", icon: "work", title: "Which role are you aiming for?", line: "Not sure? Pick the closest — Explorer maps the skills between you and it, and you can change it any time." },
  { key: "interests", step: "explore", kind: "interests", icon: "interests", title: "Which fields would you like to build for?", line: `Pick up to ${MAX_INTERESTS}.` },
];
const LETTERS = "ABCDEFGHIJKLMNOP";

const empty = (x: unknown) => (Array.isArray(x) ? x.length === 0 : !String(x ?? "").trim());
const valuesOf = (p: Partial<DashboardProfile>): Values => ({
  name: p.name ?? "", phone: p.phone ?? "", linkedin: p.linkedin ?? "", timezone: p.timezone ?? "",
  experienceLevel: p.experienceLevel ?? "", primaryTrack: p.primaryTrack ?? "", bio: p.bio ?? "",
  weeklyHours: p.weeklyHours ?? "", aiTools: p.aiTools ?? [], device: p.device ?? "", sessionTimes: p.sessionTimes ?? [], learningGoal: p.learningGoal ?? "",
  targetRole: p.targetRole ?? "", interests: p.interests ?? [],
});

/* The first time a trainee signs in: full screen, one question at a time — Enter to go on, letters to pick, any
   question skippable (what's skipped stays on "Complete your profile"). Each answer saves as you go.
   preview: an admin walk-through — the same screens, nothing saved. */
export default function FirstRun({ profile, preview = false, startAt = 0, onClose, onSaved }: {
  profile: Partial<DashboardProfile>; preview?: boolean; startAt?: number;
  onClose: () => void; onSaved?: (p: { profile: DashboardProfile; checklist: ChecklistSummary }) => void;
}) {
  const { pushToast } = useToast();
  const total = QUESTIONS.length;
  /* 0 = the welcome tour · 1..total = questions · total + 1 = done */
  const [i, setI] = useState(startAt);
  const [v, setV] = useState<Values>(() => valuesOf(profile));
  const [saved, setSaved] = useState<Values>(() => valuesOf(profile));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  /* focus moves into the welcome when it opens, so Enter and the letter keys work at once */
  useEffect(() => { shell.current?.focus(); }, []);
  const q = i >= 1 && i <= total ? QUESTIONS[i - 1] : null;
  const intro = INTRO[q?.step ?? "you"];
  const answered = QUESTIONS.filter((x) => !empty(v[x.key])).length;
  const first = (v.name || profile.name || "").trim().split(/\s+/)[0];
  const role = useMemo(() => roleFolders.flatMap((f) => f.roles).find((r) => r.id === v.targetRole), [v.targetRole]);

  useEffect(() => { if (q && (q.kind === "text" || q.kind === "long")) field.current?.focus(); }, [q]);

  const go = (n: number) => { setError(""); setI(Math.max(0, Math.min(total + 1, n))); };

  /* save this answer (if it changed), then move on; an empty answer just moves on, unless it's required */
  async function answer(over?: Partial<Values>) {
    if (!q) return go(i + 1);
    const next = { ...v, ...over };
    const raw = next[q.key];
    const val = typeof raw === "string" ? raw.trim() : raw;
    if (empty(val)) {
      if (q.required) { setError("This one’s needed — it’s how people will know you."); return; }
      return go(i + 1);
    }
    const parsed = profilePatchSchema.safeParse({ [q.key]: val });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "That doesn’t look right."); return; }
    if (!preview && JSON.stringify(val) !== JSON.stringify(saved[q.key])) {
      setBusy(true);
      try {
        const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "patch", fields: { [q.key]: val } }) });
        const data = (await res.json().catch(() => ({}))) as { checklist?: ChecklistSummary; profile?: DashboardProfile; error?: string };
        if (!res.ok || !data.profile) { setError(data.error ?? "Couldn’t save that — try again."); return; }
        setSaved((s) => ({ ...s, [q.key]: val }));
        if (data.checklist) onSaved?.({ profile: data.profile, checklist: data.checklist });
      } catch {
        setError("Couldn’t reach the server — check your connection.");
        return;
      } finally { setBusy(false); }
    }
    go(i + 1);
  }
  async function finish() {
    if (!preview && !profile.onboardingCompleted) {
      setBusy(true);
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "patch", finish: true, fields: {} }) }).catch(() => null);
      const data = res?.ok ? ((await res.json()) as { checklist: ChecklistSummary; profile: DashboardProfile }) : null;
      if (data) onSaved?.(data);
      setBusy(false);
    }
    onClose();
  }
  async function skipAll() {
    if (!preview && !profile.onboardingCompleted) {
      await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "skip" }) }).catch(() => null);
      pushToast({ variant: "info", title: "Skipped for now", description: "Finish it any time from “Complete your profile”." });
    }
    onClose();
  }

  const set = <K extends Key>(k: K, val: Values[K]) => { setV((c) => ({ ...c, [k]: val })); setError(""); };
  const pick = (o: string) => {
    if (!q) return;
    if (q.kind === "one") {
      const val = v[q.key] === o ? "" : o;
      set(q.key, val as never);
      if (val) window.setTimeout(() => void answer({ [q.key]: val } as Partial<Values>), 260);
    } else if (q.kind === "many") {
      const cur = v[q.key] as string[];
      set(q.key, (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]) as never);
    }
  };

  /* keys: Enter goes on (Ctrl/⌘+Enter in a long answer), letters pick a choice */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy || i === 0) return;
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      if (e.key === "Enter") {
        if (e.target instanceof HTMLTextAreaElement && !(e.ctrlKey || e.metaKey)) return;
        if (e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        if (i === 0) go(1); else if (q) void answer(); else void finish();
        return;
      }
      if (!typing && q?.options && /^[a-z]$/i.test(e.key)) {
        const o = q.options[LETTERS.indexOf(e.key.toUpperCase())];
        if (o) pick(o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const progress = Math.round((Math.min(i, total) / total) * 100);
  const choice = (o: string, k: number, on: boolean, extra?: string) => (
    <button key={o} type="button" role={q?.kind === "many" ? "checkbox" : "radio"} aria-checked={on} onClick={() => pick(o)}
      className={cn("group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-[15px] font-semibold transition-all",
        on ? "border-[#4fd1c5] bg-[#4fd1c5]/15 text-white shadow-[0_0_0_1px_#4fd1c5]" : "border-white/15 bg-white/[0.04] text-white/85 hover:-translate-y-px hover:border-white/35 hover:bg-white/[0.07]")}>
      <span className={cn("flex size-7 flex-none items-center justify-center rounded-lg border font-mono text-[12px] font-bold", on ? "border-[#4fd1c5] bg-[#4fd1c5] text-[#0d1117]" : "border-white/25 text-white/60")}>{LETTERS[k]}</span>
      <MaterialSymbol className={cn("text-[19px]", on ? "text-[#4fd1c5]" : "text-white/45")} name={ICONS[o] ?? "radio_button_unchecked"} />
      <span className="grid flex-1 leading-tight">{o}{extra ? <span className="text-[12px] font-normal text-white/50">{extra}</span> : null}</span>
      {on ? <MaterialSymbol className="text-[19px] text-[#4fd1c5]" filled name="check_circle" /> : null}
    </button>
  );
  const textCls = "w-full border-b-2 border-white/20 bg-transparent pb-2 text-[22px] font-medium text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#4fd1c5] sm:text-[26px]";

  return (
    <div ref={shell} tabIndex={-1} className="fixed inset-0 z-[170] flex flex-col overflow-hidden bg-[#0b0e14] text-white outline-none" role="dialog" aria-modal="true" aria-label="Welcome to Node">
      {/* light behind the question, in the colour of its section */}
      <span className="pointer-events-none absolute -left-40 -top-40 size-[560px] rounded-full opacity-30 blur-[120px] transition-colors duration-700" style={{ background: i > total ? "#4fd1c5" : intro.color }} />
      <span className="pointer-events-none absolute -bottom-48 -right-40 size-[520px] rounded-full bg-[#6d48d8] opacity-20 blur-[120px]" />
      <span className="pointer-events-none absolute inset-0 opacity-[.35]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

      {/* top: progress by section, preview flag, skip */}
      <header className="relative flex items-center gap-4 px-5 pt-4 sm:px-8 sm:pt-6">
        <span className="font-heading text-[18px] font-black tracking-[-0.03em]">Node<span className="text-[var(--electric-pink)]">.</span></span>
        {preview ? <span className="flex items-center gap-1 rounded-full bg-[#ffd666] px-2.5 py-0.5 text-[11px] font-bold text-[#0d1117]"><MaterialSymbol className="text-[14px]" name="visibility" />Preview<span className="hidden sm:inline">&nbsp;· nothing is saved</span></span> : null}
        <div className={cn("ml-auto hidden items-center gap-1.5", i > 0 && "sm:flex")}>
          {PROFILE_STEPS.map((s) => {
            const qs = QUESTIONS.map((x, k) => ({ x, k: k + 1 })).filter(({ x }) => x.step === s.id);
            const from = qs[0].k, to = qs[qs.length - 1].k;
            const fill = i > to ? 100 : i < from ? 0 : ((i - from + 1) / qs.length) * 100;
            const here = q?.step === s.id;
            return (
              <button key={s.id} type="button" onClick={() => go(from)} className="grid gap-1 text-left" title={`Jump to ${s.name}`}>
                <span className={cn("font-mono text-[9.5px] font-bold uppercase tracking-[0.14em]", here ? "text-white" : "text-white/40")}>{s.name}</span>
                <span className="h-1 w-24 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${fill}%`, background: INTRO[s.id].color }} /></span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => void skipAll()} className="ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white/55 transition-colors hover:bg-white/10 hover:text-white sm:ml-2"><span className="whitespace-nowrap">{preview ? "Close" : profile.onboardingCompleted ? "Close" : "Skip for now"}</span><MaterialSymbol className="text-[18px]" name="close" /></button>
      </header>
      <span className="relative mx-5 mt-3 h-0.5 overflow-hidden rounded-full bg-white/10 sm:hidden"><span className="block h-full bg-[#4fd1c5] transition-[width] duration-500" style={{ width: `${progress}%` }} /></span>

      {/* the screen */}
      <main className="relative flex min-h-0 flex-1 overflow-y-auto">
        <div key={i} className={cn("m-auto w-full px-5 py-10 sm:px-8", i === 0 ? "max-w-[1080px]" : "max-w-[680px]")} style={{ animation: `cert-fade .45s cubic-bezier(.2,.8,.3,1) both` }}>
          {i === 0 ? (
            <WelcomeTour first={first} questions={total} onDone={() => go(1)} onSkipAll={() => void skipAll()} skipLabel={preview ? "Close the preview" : profile.onboardingCompleted ? "Close" : "Skip for now"} />
          ) : q ? (
            <div className="grid gap-6">
              <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: intro.color }}>
                <span className="flex size-7 items-center justify-center rounded-lg text-white" style={{ background: intro.color }}><MaterialSymbol className="text-[16px]" name={q.icon} /></span>
                {i} <MaterialSymbol className="text-[14px]" name="arrow_forward" /> {PROFILE_STEPS.find((s) => s.id === q.step)?.name}
                {q.required ? <span className="text-white/40">· required</span> : <span className="text-white/30">· optional</span>}
              </span>
              <div className="grid gap-2">
                <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[36px]">{q.title}</h1>
                <p className="text-[15px] leading-6 text-white/55">{q.line}</p>
              </div>

              {q.kind === "text" ? (
                <input ref={field} value={v[q.key] as string} onChange={(e) => set(q.key, e.target.value as never)} placeholder={q.placeholder} type={q.type ?? "text"} autoComplete={q.autoComplete} className={textCls} aria-invalid={!!error} />
              ) : q.kind === "long" ? (
                <div className="grid gap-1.5">
                  <textarea ref={field} value={v.bio} onChange={(e) => set("bio", e.target.value)} rows={4} placeholder={q.placeholder} className="w-full resize-none rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-[16px] leading-7 text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#4fd1c5]" aria-invalid={!!error} />
                  <span className="text-[12px] text-white/40">{v.bio.trim().length < 24 ? `${24 - v.bio.trim().length} more characters` : "Looks good."} · <b className="text-white/60">Ctrl + Enter</b> to go on</span>
                </div>
              ) : q.kind === "one" || q.kind === "many" ? (
                <div className={cn("grid gap-2", (q.options?.length ?? 0) > 4 && "sm:grid-cols-2")} role={q.kind === "many" ? "group" : "radiogroup"}>
                  {q.options!.map((o, k) => choice(o, k, q.kind === "many" ? (v[q.key] as string[]).includes(o) : v[q.key] === o, q.lines?.[o]))}
                </div>
              ) : q.kind === "role" ? (
                <div className="grid gap-3">
                  <span className="relative block">
                    <select value={v.targetRole} onChange={(e) => set("targetRole", e.target.value)} className="h-14 w-full appearance-none rounded-2xl border border-white/15 bg-[#151a23] pl-4 pr-10 text-[16px] font-semibold text-white outline-none focus:border-[#4fd1c5]">
                      <option value="">Choose a role</option>
                      {roleFolders.map((f) => <optgroup key={f.id} label={f.name}>{f.roles.map((r) => <option key={r.id} value={r.id}>{r.name}{r.fresher ? "" : " (experienced)"}</option>)}</optgroup>)}
                    </select>
                    <MaterialSymbol className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[22px] text-white/50" name="expand_more" />
                  </span>
                  {role ? (
                    <span className="flex items-start gap-3 rounded-2xl border border-[#4fd1c5]/30 bg-[#4fd1c5]/10 px-4 py-3 text-[13.5px] leading-6 text-white/70">
                      <MaterialSymbol className="mt-0.5 text-[20px] text-[#4fd1c5]" name="lightbulb" />
                      <span><b className="text-white">{role.name}.</b> {role.line}<span className="mt-1 block text-white/50"><b className="font-semibold text-white/65">Way in:</b> {role.entry}</span></span>
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {domains.map((d) => {
                    const on = v.interests.includes(d.id), full = !on && v.interests.length >= MAX_INTERESTS;
                    return (
                      <button key={d.id} type="button" role="checkbox" aria-checked={on} disabled={full} onClick={() => set("interests", on ? v.interests.filter((x) => x !== d.id) : [...v.interests, d.id])}
                        className={cn("flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all disabled:opacity-30", on ? "border-[#4fd1c5] bg-[#4fd1c5]/15 shadow-[0_0_0_1px_#4fd1c5]" : "border-white/15 bg-white/[0.04] hover:border-white/35")}>
                        <span className="flex size-8 flex-none items-center justify-center rounded-xl text-white" style={{ background: d.color }}><MaterialSymbol className="text-[17px]" name={d.icon} /></span>
                        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{d.name}</span>
                        {on ? <MaterialSymbol className="text-[19px] text-[#4fd1c5]" filled name="check_circle" /> : null}
                      </button>
                    );
                  })}
                  <span className="text-[12px] text-white/45 sm:col-span-2">{v.interests.length} of {MAX_INTERESTS} picked</span>
                </div>
              )}

              {error ? <span role="alert" className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#ff7aa8]"><MaterialSymbol className="text-[18px]" name="error" />{error}</span> : null}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {q.kind !== "one" || v[q.key] ? (
                  <button type="button" disabled={busy} onClick={() => void answer()} className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-black text-[#0d1117] transition-transform hover:-translate-y-px disabled:opacity-60">
                    {busy ? "Saving…" : i === total ? "Finish" : "OK"}<MaterialSymbol className="text-[18px]" name={i === total ? "check" : "arrow_forward"} />
                  </button>
                ) : null}
                {!q.required ? <button type="button" disabled={busy} onClick={() => go(i + 1)} className="rounded-full px-3 py-2 text-[13px] font-semibold text-white/50 transition-colors hover:text-white">Skip this one</button> : null}
                <span className="hidden text-[12px] text-white/35 sm:inline">{q.options ? <>press a letter to pick{q.kind === "many" ? <>, <b className="text-white/60">Enter ↵</b> to go on</> : null}</> : q.kind === "long" ? null : <>press <b className="text-white/60">Enter ↵</b></>}</span>
              </div>
            </div>
          ) : (
            /* done */
            <div className="grid gap-6">
              <span className="flex size-16 items-center justify-center rounded-[20px] bg-[#4fd1c5] text-[#0d1117] shadow-[0_18px_40px_-14px_#4fd1c5]"><MaterialSymbol className="text-[32px]" filled name="check_circle" /></span>
              <h1 className="font-heading text-[34px] font-black leading-[1.05] tracking-[-0.03em] sm:text-[46px]">You’re all set{first ? `, ${first}` : ""}.</h1>
              <p className="max-w-lg text-[16px] leading-7 text-white/65">{answered === total ? "Your profile is complete — your mentor has everything they need." : `You answered ${answered} of ${total}. Anything you skipped waits on “Complete your profile” — fill it in whenever you like.`}</p>
              <div className="flex flex-wrap gap-2">
                {[v.timezone, v.experienceLevel, v.weeklyHours && `${v.weeklyHours} a week`, v.device, role?.name].filter(Boolean).map((x) => <span key={x as string} className="rounded-full bg-white/10 px-3 py-1 text-[12.5px] text-white/80">{x}</span>)}
              </div>
              <div className="grid max-w-sm gap-1.5">
                <span className="flex items-baseline justify-between text-[12px] text-white/55">Profile<b className="text-[14px] text-white">{Math.round((answered / total) * 100)}%</b></span>
                <span className="h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-[#4fd1c5] to-[var(--electric-pink)] transition-[width] duration-700" style={{ width: `${(answered / total) * 100}%` }} /></span>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <button type="button" disabled={busy} onClick={() => void finish()} className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-black text-[#0d1117] transition-transform hover:-translate-y-px disabled:opacity-60">{preview ? "Close preview" : "Start the program"}<MaterialSymbol className="text-[18px]" name="arrow_forward" /></button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* bottom: back / forward */}
      {i > 0 && i <= total ? (
        <footer className="relative flex items-center justify-between px-5 pb-5 sm:px-8 sm:pb-6">
          <span className="text-[12px] text-white/35">{i} of {total}</span>
          <span className="flex overflow-hidden rounded-full border border-white/15">
            <button type="button" onClick={() => go(i - 1)} className="flex size-10 items-center justify-center text-white/70 hover:bg-white/10" aria-label="Previous question"><MaterialSymbol className="text-[20px]" name="keyboard_arrow_up" /></button>
            <button type="button" disabled={busy} onClick={() => void answer()} className="flex size-10 items-center justify-center border-l border-white/15 text-white/70 hover:bg-white/10" aria-label="Next question"><MaterialSymbol className="text-[20px]" name="keyboard_arrow_down" /></button>
          </span>
        </footer>
      ) : null}
    </div>
  );
}
