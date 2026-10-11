"use client";

import { useState, type ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  Approval,
  Prd,
  Product,
  RequirementItem,
} from "@/lib/bos-roadmap/types";
import { cn } from "@/lib/utils";

import { Eyebrow, Panel, StatChip } from "./section-primitives";

type PrdAction =
  | "submit_review"
  | "generate_requirement_model"
  | "generate_roadmap"
  | "approve_role";

type ApprovalRoleKey = keyof Approval;

type PrdDetailViewProps = {
  error: string;
  isPending: boolean;
  message: string;
  onAction: (action: PrdAction, payload?: Record<string, string>) => void;
  onChange: (nextPrd: Prd) => void;
  onSave: () => void;
  prd: Prd;
  product: Product;
};

const sectionNav = [
  ["summary", "Summary"],
  ["problem", "Problem"],
  ["vision", "Vision"],
  ["goals", "Goals"],
  ["users", "Users"],
  ["scope", "Scope"],
  ["capabilities", "Capabilities"],
  ["use-cases", "Use Cases"],
  ["requirements", "Requirement Model"],
  ["rules-data", "Rules & Data"],
  ["risks", "Risks"],
  ["release", "Release Expectation"],
  ["questions", "Open Questions"],
  ["approval", "Approval"],
] as const;

const requirementTypeOptions = [
  "business",
  "user",
  "functional",
  "non_functional",
  "domain",
  "data",
  "permission",
  "integration",
  "reporting",
  "operational",
  "compliance",
] as const;

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function createRequirement(type: RequirementItem["type"]): RequirementItem {
  return {
    id: `requirement-${crypto.randomUUID().slice(0, 8)}`,
    type,
    title: "",
    statement: "",
    reason: "",
    priority: "medium",
    source: "",
    relatedCapabilityIds: [],
    relatedUseCaseIds: [],
    acceptanceHint: "",
    status: "draft",
  };
}

export function PrdDetailView({
  error,
  isPending,
  message,
  onAction,
  onChange,
  onSave,
  prd,
  product,
}: PrdDetailViewProps) {
  const requirementCount = prd.requirementItems.length;
  const openQuestionCount = prd.openQuestions.filter(
    (question) => question.status === "open",
  ).length;
  const approvalCount = Object.values(prd.approval).filter(
    (item) => item.state === "approved",
  ).length;
  const capabilityCount = prd.capabilities.length;
  const useCaseCount = prd.highLevelUseCases.length;

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <Eyebrow className="mb-4 text-[var(--electric-pink)]">Structured_PRD</Eyebrow>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_190px]">
              <Input
                value={prd.title}
                onChange={(event) => onChange({ ...prd, title: event.target.value })}
              />
              <select
                value={prd.status}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    status: event.target.value as Prd["status"],
                  })
                }
                className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px] text-[var(--primary)] outline-none"
              >
                <option value="draft">Draft</option>
                <option value="in_review">In review</option>
                <option value="approved">Approved</option>
                <option value="in_execution">In execution</option>
                <option value="released">Released</option>
                <option value="deprecated">Deprecated</option>
              </select>
              <Input
                value={prd.version}
                onChange={(event) => onChange({ ...prd, version: event.target.value })}
              />
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
              <Input
                placeholder="Module"
                value={prd.module}
                onChange={(event) => onChange({ ...prd, module: event.target.value })}
              />
              <Input
                placeholder="Owner"
                value={prd.owner}
                onChange={(event) => onChange({ ...prd, owner: event.target.value })}
              />
              <Input
                placeholder="Target release"
                value={prd.targetRelease}
                onChange={(event) =>
                  onChange({ ...prd, targetRelease: event.target.value })
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton
              label={isPending ? "Saving..." : "Save"}
              onClick={onSave}
              primary
            />
            <ActionButton
              label="Generate Requirement Model"
              onClick={() => onAction("generate_requirement_model")}
            />
            <ActionButton
              label="Generate Roadmap"
              onClick={() => onAction("generate_roadmap")}
            />
            <ActionButton
              label="Export"
              onClick={() => downloadJson(`${prd.id}.json`, prd)}
            />
            <ActionButton
              label="Submit for Review"
              onClick={() => onAction("submit_review")}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-4">
          <StatChip label="Requirements" value={String(requirementCount)} />
          <StatChip label="Capabilities" value={String(capabilityCount)} />
          <StatChip label="Use Cases" value={String(useCaseCount)} />
          <StatChip label="Open Questions" value={String(openQuestionCount)} />
          <StatChip label="Approved Roles" value={`${approvalCount}/5`} />
        </div>

        {message ? (
          <p className="mt-4 rounded-[1rem] border border-[var(--bridge-teal)]/20 bg-[color:color-mix(in_srgb,var(--bridge-teal)_10%,white)] px-4 py-3 text-[14px] text-[var(--primary)]">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-[1rem] border border-[var(--electric-pink)]/20 bg-[color:color-mix(in_srgb,var(--electric-pink)_8%,white)] px-4 py-3 text-[14px] text-[var(--electric-pink)]">
            {error}
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <Panel className="h-fit p-4 xl:sticky xl:top-30">
          <Eyebrow className="mb-4 text-[var(--bridge-teal)]">Sections</Eyebrow>
          <div className="space-y-2">
            {sectionNav.map(([sectionId, label]) => (
              <button
                key={sectionId}
                type="button"
                onClick={() => scrollToSection(sectionId)}
                className="w-full rounded-[1rem] border border-black/6 px-3 py-3 text-left text-[14px] font-semibold text-[var(--primary)] transition hover:bg-[var(--surface-container-low)]"
              >
                {label}
              </button>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <SectionCard
            id="summary"
            title="Executive Summary"
            description="Capture the one-paragraph version of the PRD so reviewers can orient quickly."
          >
            <div className="grid gap-3">
              <Input
                placeholder="One-liner"
                value={prd.summary.oneLiner}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    summary: { ...prd.summary, oneLiner: event.target.value },
                  })
                }
              />
              <Textarea
                className="min-h-[120px]"
                placeholder="Description"
                value={prd.summary.description}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    summary: { ...prd.summary, description: event.target.value },
                  })
                }
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Textarea
                  className="min-h-[110px]"
                  placeholder="Why now"
                  value={prd.summary.whyNow}
                  onChange={(event) =>
                    onChange({
                      ...prd,
                      summary: { ...prd.summary, whyNow: event.target.value },
                    })
                  }
                />
                <Textarea
                  className="min-h-[110px]"
                  placeholder="Expected outcome"
                  value={prd.summary.expectedOutcome}
                  onChange={(event) =>
                    onChange({
                      ...prd,
                      summary: {
                        ...prd.summary,
                        expectedOutcome: event.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="problem"
            title="Problem & Opportunity"
            description="Make the problem concrete enough that a roadmap later has a defensible anchor."
          >
            <div className="grid gap-3">
              <Textarea
                className="min-h-[110px]"
                placeholder="Problem statement"
                value={prd.problem.statement}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    problem: { ...prd.problem, statement: event.target.value },
                  })
                }
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Textarea
                  className="min-h-[110px]"
                  placeholder="Current pain"
                  value={prd.problem.currentPain}
                  onChange={(event) =>
                    onChange({
                      ...prd,
                      problem: { ...prd.problem, currentPain: event.target.value },
                    })
                  }
                />
                <Textarea
                  className="min-h-[110px]"
                  placeholder="Opportunity"
                  value={prd.problem.opportunity}
                  onChange={(event) =>
                    onChange({
                      ...prd,
                      problem: { ...prd.problem, opportunity: event.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Textarea
                  className="min-h-[110px]"
                  placeholder="Business impact"
                  value={prd.problem.businessImpact}
                  onChange={(event) =>
                    onChange({
                      ...prd,
                      problem: { ...prd.problem, businessImpact: event.target.value },
                    })
                  }
                />
                <Textarea
                  className="min-h-[110px]"
                  placeholder="User impact"
                  value={prd.problem.userImpact}
                  onChange={(event) =>
                    onChange({
                      ...prd,
                      problem: { ...prd.problem, userImpact: event.target.value },
                    })
                  }
                />
              </div>
              <Textarea
                className="min-h-[110px]"
                placeholder="Current workarounds"
                value={prd.problem.currentWorkarounds}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    problem: {
                      ...prd.problem,
                      currentWorkarounds: event.target.value,
                    },
                  })
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            id="vision"
            title="Vision"
            description="Describe the future-state product and the principles that should shape tradeoffs."
          >
            <div className="grid gap-3">
              <Textarea
                className="min-h-[110px]"
                placeholder="Vision statement"
                value={prd.vision.statement}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    vision: { ...prd.vision, statement: event.target.value },
                  })
                }
              />
              <Textarea
                className="min-h-[110px]"
                placeholder="Future state"
                value={prd.vision.futureState}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    vision: { ...prd.vision, futureState: event.target.value },
                  })
                }
              />
              <StringListEditor
                items={prd.vision.principles}
                label="Principles"
                placeholder="Add one principle"
                onChange={(items) =>
                  onChange({
                    ...prd,
                    vision: { ...prd.vision, principles: items },
                  })
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            id="goals"
            title="Goals & Success Metrics"
            description="Use repeatable structured items instead of prose so PM and review workflows stay crisp."
          >
            <div className="space-y-6">
              <EditableListHeader
                title="Goals"
                actionLabel="Add Goal"
                onAdd={() =>
                  onChange({
                    ...prd,
                    goals: [
                      ...prd.goals,
                      {
                        id: `goal-${crypto.randomUUID().slice(0, 8)}`,
                        title: "",
                        description: "",
                        type: "business",
                        priority: "medium",
                      },
                    ],
                  })
                }
              />
              {prd.goals.length > 0 ? (
                <div className="space-y-3">
                  {prd.goals.map((goal) => (
                    <div key={goal.id} className="rounded-[1.2rem] border border-black/6 p-4">
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_140px_auto]">
                        <Input
                          placeholder="Goal title"
                          value={goal.title}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              goals: prd.goals.map((item) =>
                                item.id === goal.id
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <select
                          value={goal.type}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              goals: prd.goals.map((item) =>
                                item.id === goal.id
                                  ? {
                                      ...item,
                                      type: event.target.value as typeof item.type,
                                    }
                                  : item,
                              ),
                            })
                          }
                          className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                        >
                          <option value="business">Business</option>
                          <option value="user">User</option>
                          <option value="operational">Operational</option>
                          <option value="technical">Technical</option>
                        </select>
                        <select
                          value={goal.priority}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              goals: prd.goals.map((item) =>
                                item.id === goal.id
                                  ? {
                                      ...item,
                                      priority: event.target.value as typeof item.priority,
                                    }
                                  : item,
                              ),
                            })
                          }
                          className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...prd,
                              goals: prd.goals.filter((item) => item.id !== goal.id),
                            })
                          }
                          className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                        >
                          Remove
                        </button>
                      </div>
                      <Textarea
                        className="mt-3 min-h-[96px]"
                        placeholder="Goal description"
                        value={goal.description}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            goals: prd.goals.map((item) =>
                              item.id === goal.id
                                ? { ...item, description: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No goals yet. Add at least one before review." />
              )}

              <EditableListHeader
                title="Success Metrics"
                actionLabel="Add Metric"
                onAdd={() =>
                  onChange({
                    ...prd,
                    successMetrics: [
                      ...prd.successMetrics,
                      {
                        id: `metric-${crypto.randomUUID().slice(0, 8)}`,
                        metric: "",
                        target: "",
                        measurementMethod: "",
                        priority: "medium",
                      },
                    ],
                  })
                }
              />
              {prd.successMetrics.length > 0 ? (
                <div className="space-y-3">
                  {prd.successMetrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="rounded-[1.2rem] border border-black/6 p-4"
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_auto]">
                        <Input
                          placeholder="Metric"
                          value={metric.metric}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              successMetrics: prd.successMetrics.map((item) =>
                                item.id === metric.id
                                  ? { ...item, metric: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <select
                          value={metric.priority}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              successMetrics: prd.successMetrics.map((item) =>
                                item.id === metric.id
                                  ? {
                                      ...item,
                                      priority: event.target.value as typeof item.priority,
                                    }
                                  : item,
                              ),
                            })
                          }
                          className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...prd,
                              successMetrics: prd.successMetrics.filter(
                                (item) => item.id !== metric.id,
                              ),
                            })
                          }
                          className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <Input
                          placeholder="Target"
                          value={metric.target}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              successMetrics: prd.successMetrics.map((item) =>
                                item.id === metric.id
                                  ? { ...item, target: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <Input
                          placeholder="Measurement method"
                          value={metric.measurementMethod}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              successMetrics: prd.successMetrics.map((item) =>
                                item.id === metric.id
                                  ? {
                                      ...item,
                                      measurementMethod: event.target.value,
                                    }
                                  : item,
                              ),
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No success metrics yet." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            id="users"
            title="Target Users / Personas"
            description="Capture who the PRD serves, what they need, and what permissions are implied."
          >
            <EditableListHeader
              title="Personas"
              actionLabel="Add Persona"
              onAdd={() =>
                onChange({
                  ...prd,
                  targetUsers: [
                    ...prd.targetUsers,
                    {
                      id: `persona-${crypto.randomUUID().slice(0, 8)}`,
                      role: "",
                      description: "",
                      goals: [],
                      painPoints: [],
                      mainActions: [],
                      permissionsNeeded: [],
                    },
                  ],
                })
              }
            />
            {prd.targetUsers.length > 0 ? (
              <div className="mt-4 space-y-4">
                {prd.targetUsers.map((user) => (
                  <div key={user.id} className="rounded-[1.2rem] border border-black/6 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        className="flex-1"
                        placeholder="Role"
                        value={user.role}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            targetUsers: prd.targetUsers.map((item) =>
                              item.id === user.id
                                ? { ...item, role: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...prd,
                            targetUsers: prd.targetUsers.filter((item) => item.id !== user.id),
                          })
                        }
                        className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                      >
                        Remove
                      </button>
                    </div>
                    <Textarea
                      className="mt-3 min-h-[96px]"
                      placeholder="Persona description"
                      value={user.description}
                      onChange={(event) =>
                        onChange({
                          ...prd,
                          targetUsers: prd.targetUsers.map((item) =>
                            item.id === user.id
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                    <div className="mt-3 grid gap-3 xl:grid-cols-2">
                      <StringListEditor
                        items={user.goals}
                        label="Goals"
                        placeholder="Add a user goal"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            targetUsers: prd.targetUsers.map((item) =>
                              item.id === user.id ? { ...item, goals: items } : item,
                            ),
                          })
                        }
                      />
                      <StringListEditor
                        items={user.painPoints}
                        label="Pain points"
                        placeholder="Add a pain point"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            targetUsers: prd.targetUsers.map((item) =>
                              item.id === user.id ? { ...item, painPoints: items } : item,
                            ),
                          })
                        }
                      />
                      <StringListEditor
                        items={user.mainActions}
                        label="Main actions"
                        placeholder="Add a main action"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            targetUsers: prd.targetUsers.map((item) =>
                              item.id === user.id ? { ...item, mainActions: items } : item,
                            ),
                          })
                        }
                      />
                      <StringListEditor
                        items={user.permissionsNeeded}
                        label="Permissions needed"
                        placeholder="Add a permission need"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            targetUsers: prd.targetUsers.map((item) =>
                              item.id === user.id
                                ? { ...item, permissionsNeeded: items }
                                : item,
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No target users yet." />
            )}
          </SectionCard>

          <SectionCard
            id="scope"
            title="Scope / Non-Scope"
            description="Separate immediate intended delivery from deliberate exclusions."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <StringListEditor
                items={prd.scope.inScope}
                label="In scope"
                placeholder="Add an in-scope item"
                onChange={(items) =>
                  onChange({ ...prd, scope: { ...prd.scope, inScope: items } })
                }
              />
              <StringListEditor
                items={prd.scope.outOfScope}
                label="Out of scope"
                placeholder="Add an out-of-scope item"
                onChange={(items) =>
                  onChange({ ...prd, scope: { ...prd.scope, outOfScope: items } })
                }
              />
              <StringListEditor
                items={prd.scope.mvpScope}
                label="MVP scope"
                placeholder="Add an MVP slice"
                onChange={(items) =>
                  onChange({ ...prd, scope: { ...prd.scope, mvpScope: items } })
                }
              />
              <StringListEditor
                items={prd.scope.futureScope}
                label="Future scope"
                placeholder="Add a future-scope item"
                onChange={(items) =>
                  onChange({ ...prd, scope: { ...prd.scope, futureScope: items } })
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            id="capabilities"
            title="Capabilities"
            description="Capabilities are the major product outcomes this PRD intends to define."
          >
            <EditableListHeader
              title="Capability list"
              actionLabel="Add Capability"
              onAdd={() =>
                onChange({
                  ...prd,
                  capabilities: [
                    ...prd.capabilities,
                    {
                      id: `capability-${crypto.randomUUID().slice(0, 8)}`,
                      title: "",
                      description: "",
                      outcome: "",
                      priority: "medium",
                      relatedUsers: [],
                      relatedRequirementIds: [],
                    },
                  ],
                })
              }
            />
            {prd.capabilities.length > 0 ? (
              <div className="mt-4 space-y-4">
                {prd.capabilities.map((capability) => (
                  <div
                    key={capability.id}
                    className="rounded-[1.2rem] border border-black/6 p-4"
                  >
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_auto]">
                      <Input
                        placeholder="Capability title"
                        value={capability.title}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            capabilities: prd.capabilities.map((item) =>
                              item.id === capability.id
                                ? { ...item, title: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <select
                        value={capability.priority}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            capabilities: prd.capabilities.map((item) =>
                              item.id === capability.id
                                ? {
                                    ...item,
                                    priority: event.target.value as typeof item.priority,
                                  }
                                : item,
                            ),
                          })
                        }
                        className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...prd,
                            capabilities: prd.capabilities.filter(
                              (item) => item.id !== capability.id,
                            ),
                          })
                        }
                        className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                      >
                        Remove
                      </button>
                    </div>
                    <Textarea
                      className="mt-3 min-h-[96px]"
                      placeholder="Description"
                      value={capability.description}
                      onChange={(event) =>
                        onChange({
                          ...prd,
                          capabilities: prd.capabilities.map((item) =>
                            item.id === capability.id
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                    <Textarea
                      className="mt-3 min-h-[86px]"
                      placeholder="Outcome"
                      value={capability.outcome}
                      onChange={(event) =>
                        onChange({
                          ...prd,
                          capabilities: prd.capabilities.map((item) =>
                            item.id === capability.id
                              ? { ...item, outcome: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                    <div className="mt-3 grid gap-3 xl:grid-cols-2">
                      <StringListEditor
                        items={capability.relatedUsers}
                        label="Related users"
                        placeholder="Add a persona id or role"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            capabilities: prd.capabilities.map((item) =>
                              item.id === capability.id
                                ? { ...item, relatedUsers: items }
                                : item,
                            ),
                          })
                        }
                      />
                      <StringListEditor
                        items={capability.relatedRequirementIds}
                        label="Related requirement IDs"
                        placeholder="Add a requirement id"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            capabilities: prd.capabilities.map((item) =>
                              item.id === capability.id
                                ? { ...item, relatedRequirementIds: items }
                                : item,
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No capabilities yet." />
            )}
          </SectionCard>

          <SectionCard
            id="use-cases"
            title="High-Level Use Cases"
            description="Frame end-to-end behavior before detailed specifications exist."
          >
            <EditableListHeader
              title="Use case list"
              actionLabel="Add Use Case"
              onAdd={() =>
                onChange({
                  ...prd,
                  highLevelUseCases: [
                    ...prd.highLevelUseCases,
                    {
                      id: `use-case-${crypto.randomUUID().slice(0, 8)}`,
                      title: "",
                      actor: "",
                      goal: "",
                      preconditions: [],
                      flow: [],
                      outcome: "",
                      relatedCapabilityIds: [],
                      relatedRequirementIds: [],
                    },
                  ],
                })
              }
            />
            {prd.highLevelUseCases.length > 0 ? (
              <div className="mt-4 space-y-4">
                {prd.highLevelUseCases.map((useCase) => (
                  <div key={useCase.id} className="rounded-[1.2rem] border border-black/6 p-4">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
                      <Input
                        placeholder="Use case title"
                        value={useCase.title}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            highLevelUseCases: prd.highLevelUseCases.map((item) =>
                              item.id === useCase.id
                                ? { ...item, title: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <Input
                        placeholder="Actor"
                        value={useCase.actor}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            highLevelUseCases: prd.highLevelUseCases.map((item) =>
                              item.id === useCase.id
                                ? { ...item, actor: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...prd,
                            highLevelUseCases: prd.highLevelUseCases.filter(
                              (item) => item.id !== useCase.id,
                            ),
                          })
                        }
                        className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                      >
                        Remove
                      </button>
                    </div>
                    <Input
                      className="mt-3"
                      placeholder="Goal"
                      value={useCase.goal}
                      onChange={(event) =>
                        onChange({
                          ...prd,
                          highLevelUseCases: prd.highLevelUseCases.map((item) =>
                            item.id === useCase.id
                              ? { ...item, goal: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                    <div className="mt-3 grid gap-3 xl:grid-cols-2">
                      <StringListEditor
                        items={useCase.preconditions}
                        label="Preconditions"
                        placeholder="Add a precondition"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            highLevelUseCases: prd.highLevelUseCases.map((item) =>
                              item.id === useCase.id
                                ? { ...item, preconditions: items }
                                : item,
                            ),
                          })
                        }
                      />
                      <StringListEditor
                        items={useCase.flow}
                        label="Flow"
                        placeholder="Add a step"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            highLevelUseCases: prd.highLevelUseCases.map((item) =>
                              item.id === useCase.id ? { ...item, flow: items } : item,
                            ),
                          })
                        }
                      />
                      <StringListEditor
                        items={useCase.relatedCapabilityIds}
                        label="Related capability IDs"
                        placeholder="Add a capability id"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            highLevelUseCases: prd.highLevelUseCases.map((item) =>
                              item.id === useCase.id
                                ? { ...item, relatedCapabilityIds: items }
                                : item,
                            ),
                          })
                        }
                      />
                      <StringListEditor
                        items={useCase.relatedRequirementIds}
                        label="Related requirement IDs"
                        placeholder="Add a requirement id"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            highLevelUseCases: prd.highLevelUseCases.map((item) =>
                              item.id === useCase.id
                                ? { ...item, relatedRequirementIds: items }
                                : item,
                            ),
                          })
                        }
                      />
                    </div>
                    <Textarea
                      className="mt-3 min-h-[92px]"
                      placeholder="Outcome"
                      value={useCase.outcome}
                      onChange={(event) =>
                        onChange({
                          ...prd,
                          highLevelUseCases: prd.highLevelUseCases.map((item) =>
                            item.id === useCase.id
                              ? { ...item, outcome: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No use cases yet." />
            )}
          </SectionCard>

          <SectionCard
            id="requirements"
            title="Requirement Model"
            description="Keep requirements separately identifiable for traceability and future execution mapping."
          >
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatChip
                label="Business"
                value={String(prd.requirementModel.businessRequirements.length)}
              />
              <StatChip
                label="User"
                value={String(prd.requirementModel.userRequirements.length)}
              />
              <StatChip
                label="Functional"
                value={String(prd.requirementModel.functionalRequirements.length)}
              />
              <StatChip
                label="Non Functional"
                value={String(prd.requirementModel.nonFunctionalRequirements.length)}
              />
            </div>
            <Textarea
              className="min-h-[92px]"
              placeholder="Requirement model notes"
              value={prd.requirementModel.notes}
              onChange={(event) =>
                onChange({
                  ...prd,
                  requirementModel: {
                    ...prd.requirementModel,
                    notes: event.target.value,
                  },
                })
              }
            />
            <div className="mt-4 space-y-4">
              {requirementTypeOptions.map((type) => {
                const items = prd.requirementItems.filter((item) => item.type === type);
                return (
                  <div key={type} className="rounded-[1.2rem] border border-black/6 p-4">
                    <EditableListHeader
                      title={type.replaceAll("_", " ")}
                      actionLabel="Add Requirement"
                      onAdd={() =>
                        onChange({
                          ...prd,
                          requirementItems: [...prd.requirementItems, createRequirement(type)],
                        })
                      }
                    />
                    {items.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {items.map((requirement) => (
                          <div
                            key={requirement.id}
                            className="rounded-[1rem] border border-black/6 p-4"
                          >
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_180px_auto]">
                              <Input
                                placeholder="Requirement title"
                                value={requirement.title}
                                onChange={(event) =>
                                  onChange({
                                    ...prd,
                                    requirementItems: prd.requirementItems.map((item) =>
                                      item.id === requirement.id
                                        ? { ...item, title: event.target.value }
                                        : item,
                                    ),
                                  })
                                }
                              />
                              <select
                                value={requirement.priority}
                                onChange={(event) =>
                                  onChange({
                                    ...prd,
                                    requirementItems: prd.requirementItems.map((item) =>
                                      item.id === requirement.id
                                        ? {
                                            ...item,
                                            priority:
                                              event.target.value as typeof item.priority,
                                          }
                                        : item,
                                    ),
                                  })
                                }
                                className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                              </select>
                              <Input
                                placeholder="Source"
                                value={requirement.source}
                                onChange={(event) =>
                                  onChange({
                                    ...prd,
                                    requirementItems: prd.requirementItems.map((item) =>
                                      item.id === requirement.id
                                        ? { ...item, source: event.target.value }
                                        : item,
                                    ),
                                  })
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...prd,
                                    requirementItems: prd.requirementItems.filter(
                                      (item) => item.id !== requirement.id,
                                    ),
                                  })
                                }
                                className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                              >
                                Remove
                              </button>
                            </div>
                            <Textarea
                              className="mt-3 min-h-[92px]"
                              placeholder="Requirement statement"
                              value={requirement.statement}
                              onChange={(event) =>
                                onChange({
                                  ...prd,
                                  requirementItems: prd.requirementItems.map((item) =>
                                    item.id === requirement.id
                                      ? { ...item, statement: event.target.value }
                                      : item,
                                  ),
                                })
                              }
                            />
                            <div className="mt-3 grid gap-3 xl:grid-cols-2">
                              <Textarea
                                className="min-h-[92px]"
                                placeholder="Reason"
                                value={requirement.reason}
                                onChange={(event) =>
                                  onChange({
                                    ...prd,
                                    requirementItems: prd.requirementItems.map((item) =>
                                      item.id === requirement.id
                                        ? { ...item, reason: event.target.value }
                                        : item,
                                    ),
                                  })
                                }
                              />
                              <Textarea
                                className="min-h-[92px]"
                                placeholder="Acceptance hint"
                                value={requirement.acceptanceHint}
                                onChange={(event) =>
                                  onChange({
                                    ...prd,
                                    requirementItems: prd.requirementItems.map((item) =>
                                      item.id === requirement.id
                                        ? { ...item, acceptanceHint: event.target.value }
                                        : item,
                                    ),
                                  })
                                }
                              />
                            </div>
                            <div className="mt-3 grid gap-3 xl:grid-cols-2">
                              <StringListEditor
                                items={requirement.relatedCapabilityIds}
                                label="Related capability IDs"
                                placeholder="Add a capability id"
                                onChange={(items) =>
                                  onChange({
                                    ...prd,
                                    requirementItems: prd.requirementItems.map((item) =>
                                      item.id === requirement.id
                                        ? { ...item, relatedCapabilityIds: items }
                                        : item,
                                    ),
                                  })
                                }
                              />
                              <StringListEditor
                                items={requirement.relatedUseCaseIds}
                                label="Related use case IDs"
                                placeholder="Add a use case id"
                                onChange={(items) =>
                                  onChange({
                                    ...prd,
                                    requirementItems: prd.requirementItems.map((item) =>
                                      item.id === requirement.id
                                        ? { ...item, relatedUseCaseIds: items }
                                        : item,
                                    ),
                                  })
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text={`No ${type.replaceAll("_", " ")} requirements yet.`} />
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            id="rules-data"
            title="Rules, Data, UX, Constraints, and Dependencies"
            description="Keep the PRD grounded in domain rules, entity context, design principles, and non-negotiables."
          >
            <div className="space-y-6">
              <EditableListHeader
                title="Domain rules"
                actionLabel="Add Rule"
                onAdd={() =>
                  onChange({
                    ...prd,
                    domainRules: [
                      ...prd.domainRules,
                      {
                        id: `rule-${crypto.randomUUID().slice(0, 8)}`,
                        title: "",
                        rule: "",
                        reason: "",
                        priority: "medium",
                        relatedRequirementIds: [],
                      },
                    ],
                  })
                }
              />
              {prd.domainRules.length > 0 ? (
                <div className="space-y-3">
                  {prd.domainRules.map((rule) => (
                    <div key={rule.id} className="rounded-[1.2rem] border border-black/6 p-4">
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_auto]">
                        <Input
                          placeholder="Rule title"
                          value={rule.title}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              domainRules: prd.domainRules.map((item) =>
                                item.id === rule.id
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <select
                          value={rule.priority}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              domainRules: prd.domainRules.map((item) =>
                                item.id === rule.id
                                  ? {
                                      ...item,
                                      priority: event.target.value as typeof item.priority,
                                    }
                                  : item,
                              ),
                            })
                          }
                          className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...prd,
                              domainRules: prd.domainRules.filter((item) => item.id !== rule.id),
                            })
                          }
                          className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                        >
                          Remove
                        </button>
                      </div>
                      <Textarea
                        className="mt-3 min-h-[90px]"
                        placeholder="Rule"
                        value={rule.rule}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            domainRules: prd.domainRules.map((item) =>
                              item.id === rule.id
                                ? { ...item, rule: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <Textarea
                        className="mt-3 min-h-[90px]"
                        placeholder="Reason"
                        value={rule.reason}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            domainRules: prd.domainRules.map((item) =>
                              item.id === rule.id
                                ? { ...item, reason: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <StringListEditor
                        items={rule.relatedRequirementIds}
                        label="Related requirement IDs"
                        placeholder="Add a requirement id"
                        onChange={(items) =>
                          onChange({
                            ...prd,
                            domainRules: prd.domainRules.map((item) =>
                              item.id === rule.id
                                ? { ...item, relatedRequirementIds: items }
                                : item,
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No domain rules yet." />
              )}

              <EditableListHeader
                title="Core entities"
                actionLabel="Add Entity"
                onAdd={() =>
                  onChange({
                    ...prd,
                    dataContext: {
                      ...prd.dataContext,
                      coreEntities: [
                        ...prd.dataContext.coreEntities,
                        {
                          id: `entity-${crypto.randomUUID().slice(0, 8)}`,
                          name: "",
                          description: "",
                          keyFields: [],
                          relationships: [],
                        },
                      ],
                    },
                  })
                }
              />
              {prd.dataContext.coreEntities.length > 0 ? (
                <div className="space-y-3">
                  {prd.dataContext.coreEntities.map((entity) => (
                    <div
                      key={entity.id}
                      className="rounded-[1.2rem] border border-black/6 p-4"
                    >
                      <div className="flex flex-wrap gap-3">
                        <Input
                          className="flex-1"
                          placeholder="Entity name"
                          value={entity.name}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              dataContext: {
                                ...prd.dataContext,
                                coreEntities: prd.dataContext.coreEntities.map((item) =>
                                  item.id === entity.id
                                    ? { ...item, name: event.target.value }
                                    : item,
                                ),
                              },
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...prd,
                              dataContext: {
                                ...prd.dataContext,
                                coreEntities: prd.dataContext.coreEntities.filter(
                                  (item) => item.id !== entity.id,
                                ),
                              },
                            })
                          }
                          className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                        >
                          Remove
                        </button>
                      </div>
                      <Textarea
                        className="mt-3 min-h-[90px]"
                        placeholder="Entity description"
                        value={entity.description}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            dataContext: {
                              ...prd.dataContext,
                              coreEntities: prd.dataContext.coreEntities.map((item) =>
                                item.id === entity.id
                                  ? { ...item, description: event.target.value }
                                  : item,
                              ),
                            },
                          })
                        }
                      />
                      <div className="mt-3 grid gap-3 xl:grid-cols-2">
                        <StringListEditor
                          items={entity.keyFields}
                          label="Key fields"
                          placeholder="Add a key field"
                          onChange={(items) =>
                            onChange({
                              ...prd,
                              dataContext: {
                                ...prd.dataContext,
                                coreEntities: prd.dataContext.coreEntities.map((item) =>
                                  item.id === entity.id
                                    ? { ...item, keyFields: items }
                                    : item,
                                ),
                              },
                            })
                          }
                        />
                        <StringListEditor
                          items={entity.relationships}
                          label="Relationships"
                          placeholder="Add a relationship"
                          onChange={(items) =>
                            onChange({
                              ...prd,
                              dataContext: {
                                ...prd.dataContext,
                                coreEntities: prd.dataContext.coreEntities.map((item) =>
                                  item.id === entity.id
                                    ? { ...item, relationships: items }
                                    : item,
                                ),
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No core entities yet." />
              )}

              <div className="grid gap-3 xl:grid-cols-3">
                <Textarea
                  className="min-h-[100px]"
                  placeholder="Data ownership"
                  value={prd.dataContext.dataOwnership}
                  onChange={(event) =>
                    onChange({
                      ...prd,
                      dataContext: {
                        ...prd.dataContext,
                        dataOwnership: event.target.value,
                      },
                    })
                  }
                />
                <Textarea
                  className="min-h-[100px]"
                  placeholder="Data retention notes"
                  value={prd.dataContext.dataRetentionNotes}
                  onChange={(event) =>
                    onChange({
                      ...prd,
                      dataContext: {
                        ...prd.dataContext,
                        dataRetentionNotes: event.target.value,
                      },
                    })
                  }
                />
                <Textarea
                  className="min-h-[100px]"
                  placeholder="Audit needs"
                  value={prd.dataContext.auditNeeds}
                  onChange={(event) =>
                    onChange({
                      ...prd,
                      dataContext: {
                        ...prd.dataContext,
                        auditNeeds: event.target.value,
                      },
                    })
                  }
                />
              </div>

              <StringListEditor
                items={prd.uxPrinciples}
                label="UX principles"
                placeholder="Add a UX principle"
                onChange={(items) => onChange({ ...prd, uxPrinciples: items })}
              />

              <EditableListHeader
                title="Constraints"
                actionLabel="Add Constraint"
                onAdd={() =>
                  onChange({
                    ...prd,
                    constraints: [
                      ...prd.constraints,
                      {
                        id: `constraint-${crypto.randomUUID().slice(0, 8)}`,
                        type: "technical",
                        description: "",
                        impact: "",
                        priority: "medium",
                      },
                    ],
                  })
                }
              />
              {prd.constraints.length > 0 ? (
                <div className="space-y-3">
                  {prd.constraints.map((constraint) => (
                    <div
                      key={constraint.id}
                      className="rounded-[1rem] border border-black/6 p-4"
                    >
                      <div className="grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)_140px_auto]">
                        <select
                          value={constraint.type}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              constraints: prd.constraints.map((item) =>
                                item.id === constraint.id
                                  ? {
                                      ...item,
                                      type: event.target.value as typeof item.type,
                                    }
                                  : item,
                              ),
                            })
                          }
                          className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                        >
                          <option value="technical">Technical</option>
                          <option value="design">Design</option>
                          <option value="data">Data</option>
                          <option value="security">Security</option>
                          <option value="legal">Legal</option>
                          <option value="operational">Operational</option>
                          <option value="resourcing">Resourcing</option>
                        </select>
                        <Input
                          placeholder="Constraint description"
                          value={constraint.description}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              constraints: prd.constraints.map((item) =>
                                item.id === constraint.id
                                  ? { ...item, description: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <select
                          value={constraint.priority}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              constraints: prd.constraints.map((item) =>
                                item.id === constraint.id
                                  ? {
                                      ...item,
                                      priority: event.target.value as typeof item.priority,
                                    }
                                  : item,
                              ),
                            })
                          }
                          className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...prd,
                              constraints: prd.constraints.filter(
                                (item) => item.id !== constraint.id,
                              ),
                            })
                          }
                          className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                        >
                          Remove
                        </button>
                      </div>
                      <Textarea
                        className="mt-3 min-h-[90px]"
                        placeholder="Impact"
                        value={constraint.impact}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            constraints: prd.constraints.map((item) =>
                              item.id === constraint.id
                                ? { ...item, impact: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No constraints yet." />
              )}

              <EditableListHeader
                title="Dependencies"
                actionLabel="Add Dependency"
                onAdd={() =>
                  onChange({
                    ...prd,
                    dependencies: [
                      ...prd.dependencies,
                      {
                        id: `dependency-${crypto.randomUUID().slice(0, 8)}`,
                        title: "",
                        type: "internal",
                        description: "",
                        owner: "",
                        riskIfMissing: "",
                      },
                    ],
                  })
                }
              />
              {prd.dependencies.length > 0 ? (
                <div className="space-y-3">
                  {prd.dependencies.map((dependency) => (
                    <div
                      key={dependency.id}
                      className="rounded-[1rem] border border-black/6 p-4"
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_180px_auto]">
                        <Input
                          placeholder="Dependency title"
                          value={dependency.title}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              dependencies: prd.dependencies.map((item) =>
                                item.id === dependency.id
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <select
                          value={dependency.type}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              dependencies: prd.dependencies.map((item) =>
                                item.id === dependency.id
                                  ? {
                                      ...item,
                                      type: event.target.value as typeof item.type,
                                    }
                                  : item,
                              ),
                            })
                          }
                          className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                        >
                          <option value="internal">Internal</option>
                          <option value="external">External</option>
                          <option value="integration">Integration</option>
                          <option value="data">Data</option>
                          <option value="compliance">Compliance</option>
                        </select>
                        <Input
                          placeholder="Owner"
                          value={dependency.owner}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              dependencies: prd.dependencies.map((item) =>
                                item.id === dependency.id
                                  ? { ...item, owner: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...prd,
                              dependencies: prd.dependencies.filter(
                                (item) => item.id !== dependency.id,
                              ),
                            })
                          }
                          className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                        >
                          Remove
                        </button>
                      </div>
                      <Textarea
                        className="mt-3 min-h-[90px]"
                        placeholder="Description"
                        value={dependency.description}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            dependencies: prd.dependencies.map((item) =>
                              item.id === dependency.id
                                ? { ...item, description: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <Textarea
                        className="mt-3 min-h-[90px]"
                        placeholder="Risk if missing"
                        value={dependency.riskIfMissing}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            dependencies: prd.dependencies.map((item) =>
                              item.id === dependency.id
                                ? { ...item, riskIfMissing: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No dependencies yet." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            id="risks"
            title="Risks"
            description="Track concrete risks with impact, likelihood, and mitigation."
          >
            <EditableListHeader
              title="Risk register"
              actionLabel="Add Risk"
              onAdd={() =>
                onChange({
                  ...prd,
                  risks: [
                    ...prd.risks,
                    {
                      id: `risk-${crypto.randomUUID().slice(0, 8)}`,
                      title: "",
                      description: "",
                      impact: "medium",
                      likelihood: "medium",
                      mitigation: "",
                      owner: "",
                    },
                  ],
                })
              }
            />
            {prd.risks.length > 0 ? (
              <div className="mt-4 space-y-4">
                {prd.risks.map((risk) => (
                  <div key={risk.id} className="rounded-[1.2rem] border border-black/6 p-4">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_140px_auto]">
                      <Input
                        placeholder="Risk title"
                        value={risk.title}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            risks: prd.risks.map((item) =>
                              item.id === risk.id
                                ? { ...item, title: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <select
                        value={risk.impact}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            risks: prd.risks.map((item) =>
                              item.id === risk.id
                                ? {
                                    ...item,
                                    impact: event.target.value as typeof item.impact,
                                  }
                                : item,
                            ),
                          })
                        }
                        className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <select
                        value={risk.likelihood}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            risks: prd.risks.map((item) =>
                              item.id === risk.id
                                ? {
                                    ...item,
                                    likelihood:
                                      event.target.value as typeof item.likelihood,
                                  }
                                : item,
                            ),
                          })
                        }
                        className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...prd,
                            risks: prd.risks.filter((item) => item.id !== risk.id),
                          })
                        }
                        className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                      >
                        Remove
                      </button>
                    </div>
                    <Textarea
                      className="mt-3 min-h-[92px]"
                      placeholder="Description"
                      value={risk.description}
                      onChange={(event) =>
                        onChange({
                          ...prd,
                          risks: prd.risks.map((item) =>
                            item.id === risk.id
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                    <div className="mt-3 grid gap-3 xl:grid-cols-2">
                      <Textarea
                        className="min-h-[92px]"
                        placeholder="Mitigation"
                        value={risk.mitigation}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            risks: prd.risks.map((item) =>
                              item.id === risk.id
                                ? { ...item, mitigation: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <Input
                        placeholder="Owner"
                        value={risk.owner}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            risks: prd.risks.map((item) =>
                              item.id === risk.id
                                ? { ...item, owner: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No risks yet." />
            )}
          </SectionCard>

          <SectionCard
            id="release"
            title="Release Expectation"
            description="Set expectations for MVP, alpha, beta, and future expansion without collapsing into a full roadmap."
          >
            <div className="grid gap-3 xl:grid-cols-2">
              <Textarea
                className="min-h-[100px]"
                placeholder="MVP expectation"
                value={prd.releaseExpectation.mvp}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    releaseExpectation: {
                      ...prd.releaseExpectation,
                      mvp: event.target.value,
                    },
                  })
                }
              />
              <Textarea
                className="min-h-[100px]"
                placeholder="Alpha expectation"
                value={prd.releaseExpectation.alpha}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    releaseExpectation: {
                      ...prd.releaseExpectation,
                      alpha: event.target.value,
                    },
                  })
                }
              />
              <Textarea
                className="min-h-[100px]"
                placeholder="Beta expectation"
                value={prd.releaseExpectation.beta}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    releaseExpectation: {
                      ...prd.releaseExpectation,
                      beta: event.target.value,
                    },
                  })
                }
              />
              <Textarea
                className="min-h-[100px]"
                placeholder="Future expectation"
                value={prd.releaseExpectation.future}
                onChange={(event) =>
                  onChange({
                    ...prd,
                    releaseExpectation: {
                      ...prd.releaseExpectation,
                      future: event.target.value,
                    },
                  })
                }
              />
            </div>
            <Textarea
              className="mt-3 min-h-[100px]"
              placeholder="Release notes"
              value={prd.releaseExpectation.releaseNotes}
              onChange={(event) =>
                onChange({
                  ...prd,
                  releaseExpectation: {
                    ...prd.releaseExpectation,
                    releaseNotes: event.target.value,
                  },
                })
              }
            />
          </SectionCard>

          <SectionCard
            id="questions"
            title="Open Questions"
            description="Questions should either be resolved or explicitly accepted before approval."
          >
            <EditableListHeader
              title="Decision register"
              actionLabel="Add Question"
              onAdd={() =>
                onChange({
                  ...prd,
                  openQuestions: [
                    ...prd.openQuestions,
                    {
                      id: `question-${crypto.randomUUID().slice(0, 8)}`,
                      question: "",
                      context: "",
                      owner: "",
                      status: "open",
                      decisionNeededBy: "",
                    },
                  ],
                })
              }
            />
            {prd.openQuestions.length > 0 ? (
              <div className="mt-4 space-y-4">
                {prd.openQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-[1.2rem] border border-black/6 p-4"
                  >
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_180px_auto]">
                      <Input
                        placeholder="Question"
                        value={question.question}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            openQuestions: prd.openQuestions.map((item) =>
                              item.id === question.id
                                ? { ...item, question: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <select
                        value={question.status}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            openQuestions: prd.openQuestions.map((item) =>
                              item.id === question.id
                                ? {
                                    ...item,
                                    status: event.target.value as typeof item.status,
                                  }
                                : item,
                            ),
                          })
                        }
                        className="h-13 rounded-[1.1rem] border border-black/10 bg-white px-4 text-[14px]"
                      >
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                        <option value="accepted">Accepted</option>
                      </select>
                      <Input
                        placeholder="Owner"
                        value={question.owner}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            openQuestions: prd.openQuestions.map((item) =>
                              item.id === question.id
                                ? { ...item, owner: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...prd,
                            openQuestions: prd.openQuestions.filter(
                              (item) => item.id !== question.id,
                            ),
                          })
                        }
                        className="rounded-full border border-black/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                      >
                        Remove
                      </button>
                    </div>
                    <Textarea
                      className="mt-3 min-h-[90px]"
                      placeholder="Context"
                      value={question.context}
                      onChange={(event) =>
                        onChange({
                          ...prd,
                          openQuestions: prd.openQuestions.map((item) =>
                            item.id === question.id
                              ? { ...item, context: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                    <Input
                      className="mt-3"
                      placeholder="Decision needed by"
                      value={question.decisionNeededBy}
                      onChange={(event) =>
                        onChange({
                          ...prd,
                          openQuestions: prd.openQuestions.map((item) =>
                            item.id === question.id
                              ? { ...item, decisionNeededBy: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No open questions yet." />
            )}
          </SectionCard>

          <SectionCard
            id="approval"
            title="Approval & Change Log"
            description="Record role-based approvals and keep a concise change history."
          >
            <div className="space-y-6">
              <ApprovalRoleEditor
                prd={prd}
                role="productOwner"
                label="Product Owner"
                onAction={onAction}
                onChange={onChange}
              />
              <ApprovalRoleEditor
                prd={prd}
                role="domainOwner"
                label="Domain Owner"
                onAction={onAction}
                onChange={onChange}
              />
              <ApprovalRoleEditor
                prd={prd}
                role="engineeringLead"
                label="Engineering Lead"
                onAction={onAction}
                onChange={onChange}
              />
              <ApprovalRoleEditor
                prd={prd}
                role="designLead"
                label="Design Lead"
                onAction={onAction}
                onChange={onChange}
              />
              <ApprovalRoleEditor
                prd={prd}
                role="qaLead"
                label="QA Lead"
                onAction={onAction}
                onChange={onChange}
              />

              <EditableListHeader
                title="Change log"
                actionLabel="Add Change"
                onAdd={() =>
                  onChange({
                    ...prd,
                    changeLog: [
                      {
                        version: prd.version,
                        date: new Date().toISOString().slice(0, 10),
                        author: prd.owner,
                        change: "",
                      },
                      ...prd.changeLog,
                    ],
                  })
                }
              />
              {prd.changeLog.length > 0 ? (
                <div className="space-y-3">
                  {prd.changeLog.map((entry, index) => (
                    <div
                      key={`${entry.date}-${index}`}
                      className="rounded-[1rem] border border-black/6 p-4"
                    >
                      <div className="grid gap-3 lg:grid-cols-[160px_180px_180px]">
                        <Input
                          placeholder="Version"
                          value={entry.version}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              changeLog: prd.changeLog.map((item, entryIndex) =>
                                entryIndex === index
                                  ? { ...item, version: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <Input
                          placeholder="Date"
                          value={entry.date}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              changeLog: prd.changeLog.map((item, entryIndex) =>
                                entryIndex === index
                                  ? { ...item, date: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <Input
                          placeholder="Author"
                          value={entry.author}
                          onChange={(event) =>
                            onChange({
                              ...prd,
                              changeLog: prd.changeLog.map((item, entryIndex) =>
                                entryIndex === index
                                  ? { ...item, author: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                      </div>
                      <Textarea
                        className="mt-3 min-h-[92px]"
                        placeholder="Change summary"
                        value={entry.change}
                        onChange={(event) =>
                          onChange({
                            ...prd,
                            changeLog: prd.changeLog.map((item, entryIndex) =>
                              entryIndex === index
                                ? { ...item, change: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No change log entries yet." />
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <Panel className="p-5 xl:sticky xl:top-30">
            <Eyebrow className="mb-4 text-[var(--bridge-teal)]">Metadata</Eyebrow>
            <div className="space-y-4 text-[14px] text-[var(--on-surface-variant)]">
              <MetaRow label="Product" value={product.title} />
              <MetaRow label="Module" value={prd.module || "Unassigned"} />
              <MetaRow label="Status" value={prd.status.replaceAll("_", " ")} />
              <MetaRow label="Owner" value={prd.owner || "TBD"} />
              <MetaRow
                label="Last updated"
                value={new Date(prd.updatedAt).toLocaleString()}
              />
              <MetaRow
                label="Linked roadmap"
                value={capabilityCount > 0 ? "Ready to generate" : "Blocked by capabilities"}
              />
              <MetaRow label="Linked initiatives" value="0" />
              <MetaRow label="Requirement count" value={String(requirementCount)} />
              <MetaRow label="Open question count" value={String(openQuestionCount)} />
              <MetaRow label="Approval state" value={`${approvalCount}/5 approved`} />
              <MetaRow
                label="Change summary"
                value={prd.changeLog[0]?.change || "No logged change yet."}
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        buttonVariants(),
        primary
          ? "h-auto rounded-full bg-[var(--primary)] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white"
          : "h-auto rounded-full border border-black/10 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]",
      )}
    >
      {label}
    </button>
  );
}

function SectionCard({
  children,
  description,
  id,
  title,
}: {
  children: ReactNode;
  description: string;
  id: string;
  title: string;
}) {
  return (
    <Panel className="p-0">
      <section id={id}>
        <details open className="group">
          <summary className="cursor-pointer list-none border-b border-black/6 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Eyebrow className="mb-3 text-[var(--bridge-teal)]">{title}</Eyebrow>
                <div className="text-[1.35rem] font-black text-[var(--primary)]">{title}</div>
                <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--on-surface-variant)]">
                  {description}
                </p>
              </div>
              <div className="rounded-full border border-black/8 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--outline)]">
                Collapsible
              </div>
            </div>
          </summary>
          <div className="px-5 py-5">{children}</div>
        </details>
      </section>
    </Panel>
  );
}

function EditableListHeader({
  actionLabel,
  onAdd,
  title,
}: {
  actionLabel: string;
  onAdd: () => void;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-[1rem] font-black text-[var(--primary)]">{title}</div>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-full border border-black/10 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.1rem] border border-dashed border-black/12 bg-[var(--surface-container-low)] px-4 py-4 text-[14px] leading-6 text-[var(--on-surface-variant)]">
      {text}
    </div>
  );
}

function StringListEditor({
  items,
  label,
  onChange,
  placeholder,
}: {
  items: string[];
  label: string;
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="rounded-[1.1rem] border border-black/6 p-4">
      <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--outline)]">
        {label}
      </div>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={`${label}-${item}`}
              className="flex items-center justify-between gap-3 rounded-[0.9rem] border border-black/6 px-3 py-2"
            >
              <span className="text-[14px] text-[var(--primary)]">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((value) => value !== item))}
                className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <div className="text-[14px] text-[var(--on-surface-variant)]">Nothing added yet.</div>
        )}
      </div>
      <div className="mt-3 flex gap-3">
        <Input
          className="h-11"
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            const next = draft.trim();
            if (!next) {
              return;
            }

            onChange([...items, next]);
            setDraft("");
          }}
          className="rounded-full border border-black/10 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-black/6 px-4 py-3">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--outline)]">
        {label}
      </div>
      <div className="mt-2 text-[14px] font-semibold text-[var(--primary)]">{value}</div>
    </div>
  );
}

function ApprovalRoleEditor({
  label,
  onAction,
  onChange,
  prd,
  role,
}: {
  label: string;
  onAction: (action: PrdAction, payload?: Record<string, string>) => void;
  onChange: (nextPrd: Prd) => void;
  prd: Prd;
  role: ApprovalRoleKey;
}) {
  const roleState = prd.approval[role];

  return (
    <div className="rounded-[1.2rem] border border-black/6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[1rem] font-black text-[var(--primary)]">{label}</div>
          <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--outline)]">
            {roleState.state.replaceAll("_", " ")}
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onAction("approve_role", {
              role,
              reviewer: roleState.reviewer,
              notes: roleState.notes,
            })
          }
          className="rounded-full border border-black/10 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]"
        >
          Approve
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Input
          placeholder="Reviewer"
          value={roleState.reviewer}
          onChange={(event) =>
            onChange({
              ...prd,
              approval: {
                ...prd.approval,
                [role]: {
                  ...roleState,
                  reviewer: event.target.value,
                },
              },
            })
          }
        />
        <Input
          placeholder="Last updated"
          value={roleState.updatedAt}
          readOnly
        />
      </div>
      <Textarea
        className="mt-3 min-h-[92px]"
        placeholder="Approval notes"
        value={roleState.notes}
        onChange={(event) =>
          onChange({
            ...prd,
            approval: {
              ...prd.approval,
              [role]: {
                ...roleState,
                notes: event.target.value,
              },
            },
          })
        }
      />
    </div>
  );
}
