"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { masterRoadmapPhases } from "@/lib/product-data";
import type { DashboardProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

import { Eyebrow, Panel } from "./section-primitives";
import type { ChecklistSummary } from "./dashboard-types";

function ProgressRail({ accent, value }: { accent: string; value: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-container)]">
      <div
        className="h-full rounded-full"
        style={{ width: value, backgroundColor: accent }}
      />
    </div>
  );
}

export function getRoadmapStatus(checklist: ChecklistSummary) {
  if (checklist.percentage < 35) {
    return {
      actionLabel: "Let's Get Started",
      actionTone: "var(--bridge-teal)",
      body: "Start your shared Node roadmap by completing your setup signal and entering the first systems phase.",
      currentLabel: "Not Started",
      currentPhaseIndex: 0,
      progressLabel: "0%",
      title: "Master Roadmap",
    };
  }

  if (checklist.percentage < 100) {
    return {
      actionLabel: "Continue Roadmap",
      actionTone: "var(--electric-pink)",
      body: "You have entered the shared roadmap. Finish your remaining profile signals and keep moving through the active systems phase.",
      currentLabel: `You are in ${masterRoadmapPhases[0].title}`,
      currentPhaseIndex: 0,
      progressLabel: `${Math.max(22, checklist.percentage - 8)}%`,
      title: "Master Roadmap",
    };
  }

  return {
    actionLabel: "Continue From Your Current Phase",
    actionTone: "var(--safety-orange)",
    body: "Your operator profile is calibrated. Continue deeper into the master roadmap and push the next mentor-reviewed milestone forward.",
    currentLabel: `Currently in ${masterRoadmapPhases[1].title}`,
    currentPhaseIndex: 1,
    progressLabel: "42%",
    title: "Master Roadmap",
  };
}

export function RoadmapOverviewCard({
  checklist,
}: {
  checklist: ChecklistSummary;
}) {
  const status = getRoadmapStatus(checklist);
  const currentPhase = masterRoadmapPhases[status.currentPhaseIndex];

  return (
    <Panel className="p-8">
      <Eyebrow className="mb-4 text-[var(--bridge-teal)]">Roadmap_Overview</Eyebrow>
      <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div>
          <h2 className="section-title text-[2.35rem] leading-none text-[var(--primary)]">
            {status.title}
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--on-surface-variant)]">
            {status.body}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {masterRoadmapPhases.map((phase, index) => (
              <div
                key={phase.phase}
                className={cn(
                  "rounded-full border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em]",
                  index === status.currentPhaseIndex
                    ? "border-transparent text-white"
                    : "border-black/6 bg-white text-[var(--primary)]",
                )}
                style={
                  index === status.currentPhaseIndex
                    ? { backgroundColor: phase.accent }
                    : undefined
                }
              >
                {phase.phase}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-black/6 bg-[var(--surface-container-low)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                Current Position
              </div>
              <div className="mt-2 text-[1.1rem] font-black text-[var(--primary)]">
                {status.currentLabel}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                Shared Progress
              </div>
              <div className="mt-2 text-[1.9rem] font-black text-[var(--primary)]">
                {status.progressLabel}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <ProgressRail accent={currentPhase.accent} value={status.progressLabel} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-[28rem] text-[14px] leading-6 text-[var(--on-surface-variant)]">
              {currentPhase.nextMilestone}
            </div>
            <Link
              href="/dashboard/roadmap"
              className={cn(
                buttonVariants(),
                "rounded-gem h-auto px-5 py-4 text-[13px] font-black uppercase tracking-[0.16em] text-white",
              )}
              style={{ backgroundColor: status.actionTone }}
            >
              {status.actionLabel}
            </Link>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function ProfileCompletionCard({
  checklist,
  onOpenOnboarding,
}: {
  checklist: ChecklistSummary;
  onOpenOnboarding: () => void;
}) {
  const itemsToShow =
    checklist.remainingItems.length > 0
      ? checklist.remainingItems.slice(0, 2)
      : checklist.items.slice(0, 2);

  return (
    <Panel className="flex h-fit flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow className="mb-3 text-[var(--electric-pink)]">Profile_Signal</Eyebrow>
          <h2 className="section-title text-[1.45rem] leading-none text-[var(--primary)]">
            Profile checklist.
          </h2>
          <p className="mt-3 text-[13px] leading-6 text-[var(--on-surface-variant)]">
            {checklist.isComplete
              ? "Your setup signal is complete and ready."
              : `${checklist.remainingItems.length} setup items still affect roadmap pacing.`}
          </p>
        </div>
        <div className="rounded-[1.1rem] border border-black/6 bg-[var(--surface-container-low)] px-4 py-3 text-right">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--bridge-teal)]">
            Completion
          </div>
          <div className="mt-1 text-[1.55rem] font-black text-[var(--primary)]">
            {checklist.percentage}%
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ProgressRail accent="var(--bridge-teal)" value={`${checklist.percentage}%`} />
      </div>

      <div className="mt-4 space-y-2.5">
        {itemsToShow.map((item) => (
          <div
            key={item.key}
            className="rounded-[1rem] border border-black/6 bg-[var(--surface-container-low)] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="text-[14px] font-black text-[var(--primary)]">{item.label}</div>
              <div
                className={cn(
                  "font-mono text-[10px] font-bold uppercase tracking-[0.18em]",
                  item.completed ? "text-[var(--bridge-teal)]" : "text-[var(--electric-pink)]",
                )}
              >
                {item.completed ? "Ready" : "Pending"}
              </div>
            </div>
            <p className="mt-1.5 text-[12px] leading-5 text-[var(--on-surface-variant)]">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onOpenOnboarding}
          className={cn(
            buttonVariants(),
            "rounded-gem h-auto w-full bg-[var(--bridge-teal)] px-5 py-3.5 text-center text-[12px] font-black uppercase tracking-[0.16em] text-white",
          )}
        >
          {checklist.isComplete ? "Review Profile" : "Complete Profile"}
        </button>
      </div>
    </Panel>
  );
}

export function RoadmapDetails({
  checklist,
  profile,
}: {
  checklist: ChecklistSummary;
  profile: DashboardProfile;
}) {
  const status = getRoadmapStatus(checklist);
  const [expandedPhase, setExpandedPhase] = useState(status.currentPhaseIndex);
  const [milestoneState, setMilestoneState] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};

    masterRoadmapPhases.forEach((phase, phaseIndex) => {
      phase.milestones.forEach((_, milestoneIndex) => {
        initialState[`${phase.phase}-${milestoneIndex}`] =
          phaseIndex < status.currentPhaseIndex;
      });
    });

    return initialState;
  });

  const roadmapCompletion = useMemo(() => {
    const total = Object.keys(milestoneState).length;
    const completed = Object.values(milestoneState).filter(Boolean).length;

    return {
      completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      total,
    };
  }, [milestoneState]);

  const currentPhase = masterRoadmapPhases[status.currentPhaseIndex];

  return (
    <div className="space-y-8">
      <FadeHeader checklist={checklist} profile={profile} status={status} />

      <div className="grid gap-8 xl:grid-cols-[1.18fr_0.82fr]">
        <Panel className="p-8">
          <Eyebrow className="mb-5 text-[var(--electric-pink)]">Master_Roadmap</Eyebrow>
          <div className="space-y-5">
            {masterRoadmapPhases.map((phase, index) => {
              const isCurrent = index === status.currentPhaseIndex;
              const isComplete = index < status.currentPhaseIndex;
              const isExpanded = expandedPhase === index;
              const completedMilestones = phase.milestones.filter(
                (_, milestoneIndex) => milestoneState[`${phase.phase}-${milestoneIndex}`],
              ).length;
              const completionPercent = Math.round(
                (completedMilestones / phase.milestones.length) * 100,
              );

              return (
                <div
                  key={phase.phase}
                  className={cn(
                    "overflow-hidden rounded-[1.7rem] border border-black/6 bg-white shadow-sm transition-all",
                    isCurrent && "shadow-[0_30px_80px_-28px_rgba(233,30,99,0.24)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPhase((current) => (current === index ? -1 : index))
                    }
                    className="w-full px-6 py-5 text-left"
                  >
                    <div className="grid gap-5 lg:grid-cols-[0.14fr_0.56fr_0.3fr] lg:items-start">
                      <div className="flex items-start justify-center lg:pt-1">
                        <div className="relative flex flex-col items-center">
                          <span
                            className={cn(
                              "size-4 rounded-full border-4 border-white shadow-sm",
                              isComplete
                                ? "bg-[var(--bridge-teal)]"
                                : isCurrent
                                  ? "bg-[var(--electric-pink)]"
                                  : "bg-[var(--outline-variant)]",
                            )}
                          />
                          {index < masterRoadmapPhases.length - 1 ? (
                            <span className="mt-2 h-14 w-px bg-[var(--outline-variant)]/60" />
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--outline)]">
                            {phase.phase}
                          </span>
                          <span
                            className="rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${phase.accent} 12%, transparent)`,
                              color: phase.accent,
                            }}
                          >
                            {isComplete ? "Completed" : isCurrent ? "Current" : "Upcoming"}
                          </span>
                          {isCurrent ? (
                            <span className="rounded-full bg-[color:color-mix(in_srgb,var(--electric-pink)_12%,white)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]">
                              You Are Here
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 text-[1.55rem] font-black text-[var(--primary)]">
                          {phase.title}
                        </div>
                        <div className="mt-2 text-[14px] font-black uppercase tracking-[0.06em] text-[var(--primary)]">
                          {phase.focus}
                        </div>
                        <p className="mt-3 text-[15px] leading-7 text-[var(--on-surface-variant)]">
                          {phase.detail}
                        </p>
                      </div>

                      <div className="rounded-[1.3rem] border border-black/6 bg-[var(--surface-container-low)] px-4 py-4">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                          Milestone State
                        </div>
                        <div className="mt-2 text-[1.6rem] font-black text-[var(--primary)]">
                          {completedMilestones}/{phase.milestones.length}
                        </div>
                        <div className="mt-2 text-[13px] text-[var(--on-surface-variant)]">
                          {phase.duration}
                        </div>
                        <div className="mt-4">
                          <ProgressRail accent={phase.accent} value={`${completionPercent}%`} />
                        </div>
                        <div className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--bridge-teal)]">
                          {isExpanded ? "Collapse Phase" : "Expand Phase"}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-black/6 bg-[var(--surface-container-low)] px-6 py-6">
                      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                        <div>
                          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                            Milestone Checks
                          </div>
                          <div className="mt-4 space-y-3">
                            {phase.milestones.map((milestone, milestoneIndex) => {
                              const milestoneKey = `${phase.phase}-${milestoneIndex}`;
                              const checked = milestoneState[milestoneKey];

                              return (
                                <button
                                  key={milestoneKey}
                                  type="button"
                                  onClick={() =>
                                    setMilestoneState((current) => ({
                                      ...current,
                                      [milestoneKey]: !current[milestoneKey],
                                    }))
                                  }
                                  className="flex w-full items-start gap-3 rounded-[1rem] border border-black/6 bg-white px-4 py-3 text-left transition-colors hover:bg-[var(--surface)]"
                                >
                                  <span
                                    className={cn(
                                      "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black",
                                      checked
                                        ? "border-[var(--bridge-teal)] bg-[var(--bridge-teal)] text-white"
                                        : "border-[var(--outline-variant)] text-[var(--outline)]",
                                    )}
                                  >
                                    {checked ? "OK" : ""}
                                  </span>
                                  <span className="text-[14px] leading-6 text-[var(--primary)]">
                                    {milestone}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-[1.2rem] border border-black/6 bg-white p-4">
                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--bridge-teal)]">
                              Mentor Owner
                            </div>
                            <div className="mt-2 text-[1.05rem] font-black text-[var(--primary)]">
                              {phase.mentor}
                            </div>
                          </div>
                          <div className="rounded-[1.2rem] border border-black/6 bg-white p-4">
                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                              Next Milestone
                            </div>
                            <div className="mt-2 text-[14px] leading-6 text-[var(--on-surface-variant)]">
                              {phase.nextMilestone}
                            </div>
                          </div>
                          <div className="rounded-[1.2rem] border border-black/6 bg-white p-4">
                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--electric-pink)]">
                              Expected Outcome
                            </div>
                            <div className="mt-2 text-[14px] leading-6 text-[var(--on-surface-variant)]">
                              {phase.outcome}
                            </div>
                          </div>
                          <div className="rounded-[1.2rem] border border-black/6 bg-white p-4">
                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                              Module Stack
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {phase.modules.map((module) => (
                                <div
                                  key={module}
                                  className="rounded-full border border-black/6 bg-[var(--surface-container-low)] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]"
                                >
                                  {module}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="sticky top-28 p-6">
            <Eyebrow className="mb-4 text-[var(--bridge-teal)]">Current_Position</Eyebrow>
            <div
              className="rounded-[1.4rem] px-5 py-5 text-white"
              style={{ backgroundColor: currentPhase.accent }}
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                Active Phase
              </div>
              <div className="mt-3 text-[1.7rem] font-black">{currentPhase.title}</div>
              <div className="mt-2 text-[14px] leading-6 text-white/78">
                {currentPhase.nextMilestone}
              </div>
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-black/6 bg-[var(--surface-container-low)] p-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                Shared Progress
              </div>
              <div className="mt-2 text-[1.9rem] font-black text-[var(--primary)]">
                {status.progressLabel}
              </div>
              <div className="mt-4">
                <ProgressRail accent={currentPhase.accent} value={status.progressLabel} />
              </div>
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-black/6 bg-[var(--surface-container-low)] p-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                Roadmap Completion
              </div>
              <div className="mt-2 text-[1.9rem] font-black text-[var(--primary)]">
                {roadmapCompletion.percent}%
              </div>
              <div className="mt-2 text-[14px] leading-6 text-[var(--on-surface-variant)]">
                {roadmapCompletion.completed}/{roadmapCompletion.total} milestones checked.
              </div>
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-black/6 bg-[var(--surface-container-low)] p-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                Profile Signal
              </div>
              <div className="mt-2 text-[1.9rem] font-black text-[var(--primary)]">
                {checklist.percentage}%
              </div>
              <div className="mt-2 text-[14px] leading-6 text-[var(--on-surface-variant)]">
                Roadmap pacing improves as your operator profile gets more complete.
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function FadeHeader({
  checklist,
  profile,
  status,
}: {
  checklist: ChecklistSummary;
  profile: DashboardProfile;
  status: ReturnType<typeof getRoadmapStatus>;
}) {
  return (
    <Panel className="node-link-pattern overflow-hidden p-8 md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <Eyebrow className="mb-5 text-[var(--bridge-teal)]">Roadmap_Hub</Eyebrow>
          <h1 className="section-title text-[3rem] leading-[0.95] text-[var(--primary)] md:text-[4.2rem]">
            The shared master roadmap.
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-8 text-[var(--on-surface-variant)]">
            Everyone moves through the same precision path. Your profile and readiness
            state determine how quickly you can push the next phase forward.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-full border border-black/6 bg-white px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
              {profile.primaryTrack ?? "General Systems"}
            </div>
            <div className="rounded-full border border-black/6 bg-white px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
              {status.currentLabel}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[1.4rem] border border-black/6 bg-white/85 p-5 shadow-sm backdrop-blur-sm">
            <div className="text-[2rem] font-black leading-none text-[var(--primary)]">
              {status.progressLabel}
            </div>
            <div className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--bridge-teal)]">
              Roadmap Position
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-black/6 bg-white/85 p-5 shadow-sm backdrop-blur-sm">
            <div className="text-[2rem] font-black leading-none text-[var(--primary)]">
              {checklist.percentage}%
            </div>
            <div className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--electric-pink)]">
              Profile Signal
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
