"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { PROFILE_STEPS, type DashboardProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

import { QUESTIONS } from "./first-run";
import { INTRO } from "./onboarding-flow";

const FirstRun = dynamic(() => import("./first-run"), { ssr: false });

/* a filled-in trainee, to see the screens with answers in them */
const SAMPLE: Partial<DashboardProfile> = {
  name: "Ayesha Raza", phone: "+92 300 1234567", linkedin: "https://linkedin.com/in/ayesha-raza", timezone: "PKT (UTC+05)",
  experienceLevel: "Early career", primaryTrack: "Delivery", bio: "Junior developer at a small agency — I build React front ends and want to ship a full product end to end.",
  weeklyHours: "9-12 Hours", aiTools: ["ChatGPT", "Claude Code"], device: "Windows", sessionTimes: ["Weekday evenings", "Weekends"],
  learningGoal: "Ship a real product with AI agents and a portfolio to show for it.", targetRole: "", interests: ["fintech", "saas"],
};

/* Admins: walk through the first-sign-in onboarding exactly as a new trainee sees it — from the start, with sample
   answers, or from any question. Nothing is saved. */
export function OnboardingPreview() {
  const [run, setRun] = useState<{ sample: boolean; at: number } | null>(null);
  const card = "grid gap-3 rounded-[22px] border border-black/[0.06] bg-white p-5";
  return (
    <div className="grid gap-5">
      <section className="relative grid gap-4 overflow-hidden rounded-[24px] bg-[#0b0e14] p-6 text-white sm:p-8">
        <span className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[var(--electric-pink)] opacity-25 blur-[90px]" />
        <span className="pointer-events-none absolute -bottom-28 right-0 size-72 rounded-full bg-[#6d48d8] opacity-25 blur-[90px]" />
        <span className="relative flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4fd1c5]"><MaterialSymbol className="text-[16px]" name="visibility" />Admin preview</span>
        <h1 className="relative font-heading text-[30px] font-black leading-tight tracking-[-0.03em] sm:text-[38px]">The first sign-in</h1>
        <p className="relative max-w-2xl text-[14.5px] leading-7 text-white/65">A new trainee’s first visit opens a full-screen welcome: {QUESTIONS.length} questions, one at a time, in four sections. Every question but their name can be skipped — what’s skipped stays on “Complete your profile”. Each answer saves as they go. In the preview nothing is saved.</p>
        <div className="relative flex flex-wrap gap-2.5 pt-1">
          <button type="button" onClick={() => setRun({ sample: false, at: 0 })} className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13.5px] font-black text-[#0d1117] transition-transform hover:-translate-y-px"><MaterialSymbol className="text-[18px]" name="play_arrow" />Preview as a new trainee</button>
          <button type="button" onClick={() => setRun({ sample: true, at: 0 })} className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[13.5px] font-bold text-white hover:bg-white/10"><MaterialSymbol className="text-[18px]" name="person" />With sample answers</button>
          <button type="button" onClick={() => setRun({ sample: true, at: QUESTIONS.length + 1 })} className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[13.5px] font-bold text-white hover:bg-white/10"><MaterialSymbol className="text-[18px]" name="check_circle" />The last screen</button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {PROFILE_STEPS.map((s) => {
          const qs = QUESTIONS.map((q, k) => ({ q, n: k + 1 })).filter(({ q }) => q.step === s.id);
          return (
            <section key={s.id} className={card}>
              <span className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl text-white" style={{ background: INTRO[s.id].color }}><MaterialSymbol className="text-[19px]" name={s.icon} /></span>
                <span className="grid leading-tight"><b className="text-[15px] text-[var(--primary)]">{s.name}</b><span className="text-[12px] text-black/45">{qs.length} questions · {INTRO[s.id].sub}</span></span>
              </span>
              <ol className="grid gap-1">
                {qs.map(({ q, n }) => (
                  <li key={q.key}>
                    <button type="button" onClick={() => setRun({ sample: false, at: n })} className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-[#f6f7f8]" title="Preview from this question">
                      <span className="w-5 flex-none text-right font-mono text-[11px] font-bold text-black/35">{n}</span>
                      <MaterialSymbol className="flex-none text-[18px] text-black/40" name={q.icon} />
                      <span className="grid min-w-0 flex-1 leading-tight">
                        <span className="truncate text-[13.5px] font-semibold text-[var(--primary)]">{q.title}</span>
                        <span className="text-[11.5px] text-black/45">{q.kind === "one" ? `Pick one of ${q.options?.length}` : q.kind === "many" ? `Pick any of ${q.options?.length}` : q.kind === "long" ? "A few lines" : q.kind === "role" ? "A role from Explorer" : q.kind === "interests" ? "Up to 3 fields" : "Typed answer"}</span>
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-bold", q.required ? "bg-[#fdecf2] text-[#a3104a]" : "bg-[#f1f2f3] text-black/45")}>{q.required ? "Required" : "Optional"}</span>
                      <MaterialSymbol className="text-[18px] text-black/25 group-hover:text-[var(--primary)]" name="play_circle" />
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      {run ? <FirstRun key={`${run.sample}-${run.at}`} preview profile={run.sample ? SAMPLE : { name: "" }} startAt={run.at} onClose={() => setRun(null)} /> : null}
    </div>
  );
}
