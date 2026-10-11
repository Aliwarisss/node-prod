"use client";

import { useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Contract, DayProcess, Lesson, Loop, ModelMeta, Refs } from "@/lib/program";
import { cn } from "@/lib/utils";

import { type FlowEdge, type FlowNode } from "./flow-map";
import { DetailHead, DetailRow, MapExplorer } from "./map-explorer";
import { ArtifactChip, KnowledgeChip, LensChip, Value, kicker } from "./program-ui";

const list = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : []);
const sec = (c: Contract | null, id: string) => ((c ?? {})[id] ?? {}) as Record<string, unknown>;

/* the book's helpers for its maps: who owns a unit (its R), its first exit check, its routes, its states */
const ownerOf = (c: Contract | null) => {
  const roles = list(sec(c, "execution").roles);
  const r = roles.find((x) => /^R\s*[—-]/.test(x)) ?? roles[0];
  return r ? r.replace(/^[ARCI]\s*[—-]\s*/, "") : undefined;
};
const firstExit = (c: Contract | null) => { const e = list(sec(c, "definition").exit)[0]; return e ? "✓ " + e : undefined; };
const branchesOf = (c: Contract | null) => {
  const r = sec(c, "routing"), handoff = sec(c, "continuity").handoff;
  return ([["forward", handoff || r.forward], ["alternate", r.alternate], ["rework", r.rework], ["escalate", r.escalation], ["stop", r.stop]] as [string, unknown][])
    .filter(([, v]) => v).map(([key, v]) => ({ key, text: String(v) }));
};
/* what the scenarios say: the contract's cases, and its stop route for "failures" */
const casesOf = (c: Contract | null) => { const k = sec(c, "cases"); return { happyPath: k.happyPath, alternates: k.alternates, edgeCases: k.edgeCases, exceptions: k.exceptions, failures: sec(c, "routing").stop }; };
const statesOf = (c: Contract | null) => { const s = sec(c, "flow").stateTransitions; return s ? String(s).split(/\s*→\s*/).filter(Boolean) : []; };
function loopEdges(loops: Loop[], idx: Record<string, number>): FlowEdge[] {
  const out: FlowEdge[] = [];
  for (const [f, to, ty, n] of loops) {
    if (idx[f] === undefined) continue;
    out.push({ f: idx[f], t: to in idx ? idx[to] : to === "authority" ? "authority" : "stop", ty, n });
  }
  return out;
}

export function Card({ title, icon, children, className, tone }: { title: string; icon?: string; children: ReactNode; className?: string; tone?: "teal" | "pink" | "violet" | "amber" }) {
  const tones = { teal: "bg-[#f0f7f7]", pink: "bg-[#fff5f8]", violet: "bg-[#f7f5fe]", amber: "bg-[#fdf8ea]" };
  return (
    <section className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-1.5 rounded-xl border border-black/[0.06] p-3", tone ? tones[tone] : "bg-white", className)}>
      <span className={cn(kicker, "flex min-w-0 flex-wrap items-center gap-1.5 text-[var(--on-surface-variant)]")}>{icon ? <MaterialSymbol className="text-[15px]" name={icon} /> : null}{title}</span>
      {children}
    </section>
  );
}

const LOOP_STYLE: Record<string, { label: string; icon: string; cls: string }> = {
  rework: { label: "Rework", icon: "replay", cls: "bg-[#fdf3d7] text-[#6b4f00]" },
  alternate: { label: "Alternate", icon: "alt_route", cls: "bg-[#eef0fd] text-[#3a3fa3]" },
  escalate: { label: "Escalate", icon: "north_east", cls: "bg-[#fdecf2] text-[#8a0f3f]" },
  stop: { label: "Stop", icon: "block", cls: "bg-[#f1f2f3] text-black/70" },
};
function Loops({ loops, name, quiet }: { loops: Loop[]; name: (id: string) => string; quiet?: boolean }) {
  if (!loops.length) return quiet ? null : <p className="text-[13px] text-[var(--on-surface-variant)]">No loops — it runs straight through.</p>;
  return (
    <ul className="grid gap-1.5">
      {loops.map(([from, to, kind, label], i) => {
        const st = LOOP_STYLE[kind] ?? LOOP_STYLE.alternate;
        return (
          <li key={i} className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", st.cls)}><MaterialSymbol className="text-[14px]" name={st.icon} />{st.label}</span>
            <span className="font-semibold text-[var(--primary)]">{label}</span>
            <span className="text-[var(--on-surface-variant)]">{name(from)} → {to === "authority" ? "the authority" : to === "stop" ? "stop / park" : name(to)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- 1 · Overview: why it exists, how it flows, what can happen, where it goes next ---------- */
export function OverviewPanel({ lesson }: { lesson: Lesson }) {
  const c = lesson.contract;
  const def = sec(c, "definition"), flow = sec(c, "flow"), cases = sec(c, "cases"), routing = sec(c, "routing");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="grid gap-3 md:grid-cols-3">
        <Card title="Purpose" icon="flag" tone="violet"><Value v={def.purpose} /></Card>
        <Card title="Outcome" icon="emoji_events" tone="teal"><Value v={def.outcome} /></Card>
        <Card title="The job to be done" icon="person_search" tone="amber"><Value v={def.jtbd} /></Card>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Starts when" icon="login"><Value v={def.entry} /></Card>
        <Card title="Finishes when" icon="logout"><Value v={def.exit} /></Card>
      </div>
      <Card title="How the work flows" icon="conversion_path">
        <ol className="flex flex-wrap items-center gap-1.5">
          {list(flow.normal).map((s, i, a) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className="rounded-xl bg-[var(--deep-indigo)] px-3 py-1.5 text-[12.5px] font-semibold text-white">{i + 1}. {s}</span>
              {i < a.length - 1 ? <MaterialSymbol className="text-[16px] text-black/35" name="arrow_forward" /> : null}
            </li>
          ))}
        </ol>
        <div className="mt-1 grid gap-3 md:grid-cols-3">
          {list(flow.parallel).length ? <div><span className="text-[11.5px] font-bold text-[var(--on-surface-variant)]">In parallel</span><Value v={flow.parallel} /></div> : null}
          {list(flow.dependencies).length ? <div><span className="text-[11.5px] font-bold text-[var(--on-surface-variant)]">Depends on</span><Value v={flow.dependencies} /></div> : null}
          {flow.stateTransitions ? <div><span className="text-[11.5px] font-bold text-[var(--on-surface-variant)]">States</span><Value v={flow.stateTransitions} /></div> : null}
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="What can happen" icon="call_split">
          <dl className="grid gap-2">
            <div><dt className="text-[11.5px] font-bold text-[#005a5a]">Happy path</dt><dd><Value v={cases.happyPath} /></dd></div>
            {list(cases.alternates).length ? <div><dt className="text-[11.5px] font-bold text-[var(--on-surface-variant)]">Alternates</dt><dd><Value v={cases.alternates} /></dd></div> : null}
            {list(cases.edgeCases).length ? <div><dt className="text-[11.5px] font-bold text-[var(--on-surface-variant)]">Edge cases</dt><dd><Value v={cases.edgeCases} /></dd></div> : null}
            {list(cases.exceptions).length ? <div><dt className="text-[11.5px] font-bold text-[#8a0f3f]">Exceptions</dt><dd><Value v={cases.exceptions} /></dd></div> : null}
          </dl>
        </Card>
        <Card title="Where it goes next" icon="alt_route">
          <dl className="grid gap-2">
            {(["forward", "alternate", "rework", "escalation"] as const).map((k) => routing[k] ? <div key={k}><dt className="text-[11.5px] font-bold capitalize text-[var(--on-surface-variant)]">{k}</dt><dd><Value v={routing[k]} /></dd></div> : null)}
          </dl>
        </Card>
      </div>
    </div>
  );
}

/* ---------- 2 · Workflow: the steps, the decisions, the loops, and the workflow contract ---------- */
export function WorkflowPanel({ lesson, model }: { lesson: Lesson; model: ModelMeta }) {
  const [wi, setWi] = useState(0);
  const [showContract, setShowContract] = useState(false);
  const w = lesson.workflows[wi];
  if (!w) return <p className="text-[14px] text-[var(--on-surface-variant)]">This lesson has no workflow.</p>;
  const labels = Object.fromEntries(model.workflow);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      {lesson.workflows.length > 1 ? (
        <div className="flex flex-wrap gap-1 border-b border-black/[0.06]">
          {lesson.workflows.map((x, i) => (
            <button key={x.id} type="button" onClick={() => setWi(i)} className={cn("-mb-px border-b-2 px-2.5 py-1.5 text-[12.5px] font-bold transition-colors", i === wi ? "border-[var(--electric-pink)] text-[var(--primary)]" : "border-transparent text-black/50 hover:text-[var(--primary)]")}>{x.title}</button>
          ))}
        </div>
      ) : null}
      {w.contract.definition ? <p className="text-[13px] text-[var(--on-surface-variant)]"><Value v={w.contract.definition} /></p> : null}
      <WorkflowMap key={wi} lesson={lesson} wi={wi} model={model} />

      {/* the steps, one line each */}
      <ol className="grid divide-y divide-black/[0.05] rounded-xl border border-black/[0.06]">
        {w.steps.map((s, i) => (
          <li key={s.id} className="grid grid-cols-[22px_minmax(0,1fr)] items-start gap-2.5 px-3 py-2">
            <span className={cn("mt-px flex size-[22px] items-center justify-center font-mono text-[10.5px] font-bold", s.decision ? "rotate-45 rounded-[5px] bg-[#fdf3d7] text-[#6b4f00]" : "rounded-md bg-[#f1f2f3] text-black/60")}>
              <span className={s.decision ? "-rotate-45" : ""}>{s.decision ? "?" : i + 1}</span>
            </span>
            <div className="grid min-w-0 gap-1">
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <b className="text-[13.5px] text-[var(--primary)]">{s.title}</b>
                <span className="text-[12px] text-black/50">{s.actor}</span>
                {s.decision ? <span className="text-[11px] font-bold text-[#8a6500]">you decide</span> : null}
              </span>
              {s.out || s.uses.length ? (
                <span className="flex flex-wrap items-center gap-1">
                  {s.out ? <ArtifactChip name={s.out} template={s.template} /> : null}
                  {s.uses.map((u) => <KnowledgeChip key={u.name} name={u.name} refId={u.ref} />)}
                </span>
              ) : null}
              {s.ask ? (
                <details className="group text-[12.5px]">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-[12px] font-semibold text-[var(--bridge-teal)] [&::-webkit-details-marker]:hidden">
                    <MaterialSymbol className="text-[15px]" name="smart_toy" />Ask your agent<MaterialSymbol className="text-[16px] transition-transform group-open:rotate-180" name="expand_more" />
                  </summary>
                  <p className="mt-1 border-l-2 border-[var(--bridge-teal)]/30 pl-2.5 italic leading-5 text-[var(--on-surface-variant)]">{s.ask}</p>
                </details>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {w.entryUses.length ? <div className="flex flex-wrap items-center gap-1.5"><span className="text-[12px] text-black/50">Applies throughout:</span>{w.entryUses.map((u) => <KnowledgeChip key={u.name} name={u.name} refId={u.ref} />)}</div> : null}

      <button type="button" onClick={() => setShowContract((v) => !v)} className="flex items-center justify-between gap-2 justify-self-start text-left text-[12.5px] font-bold text-black/55 hover:text-[var(--primary)]" aria-expanded={showContract}>
        <span className="flex items-center gap-1.5"><MaterialSymbol className="text-[16px]" name="assignment" />Workflow contract · {Object.keys(w.contract).length} fields</span>
        <MaterialSymbol className={cn("text-[18px] transition-transform", showContract && "rotate-180")} name="expand_more" />
      </button>
      {showContract ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {model.workflow.filter(([k]) => k !== "steps" && k !== "definition" && w.contract[k] != null).map(([k]) => (
            <Card key={k} title={labels[k] ?? k}><Value v={w.contract[k]} refs={lesson.refs} /></Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* a workflow as the book draws it: Entry → its steps (decisions as diamonds) → the gate, with its loops; the gate's branches from the lesson's routing */
export function workflowGraph(lesson: Lesson, wi: number) {
  const w = lesson.workflows[wi];
  const nodes: FlowNode[] = [
    { id: "__in", label: "Entry", kind: "entry" },
    ...w.steps.map((s, i) => ({ id: s.id, label: s.title, num: `${i + 1}`, kind: (s.decision ? "decision" : "unit") as FlowNode["kind"], owner: s.actor, check: s.out ? "▤ " + s.out : undefined })),
    { id: "__out", label: w.gate || lesson.gate || "Exit", kind: "gate" },
  ];
  const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
  const edges: FlowEdge[] = [...nodes.slice(1).map((_, i) => ({ f: i, t: i + 1, ty: "forward" })), ...loopEdges(w.loops, idx)];
  return { nodes, edges, branches: branchesOf(lesson.contract), authority: String(sec(lesson.contract, "execution").authority ?? "") };
}

function WorkflowMap({ lesson, wi, model }: { lesson: Lesson; wi: number; model: ModelMeta }) {
  const w = lesson.workflows[wi];
  const def = sec(lesson.contract, "definition");
  const { nodes, edges } = workflowGraph(lesson, wi);
  const nodeDetail = (i: number) => {
    if (i === 0) return (
      <DetailHead kick="Entry" icon="login" title="Starts when">
        <Value v={def.entry} />
        {w.entryUses.length ? <DetailRow label="Applies from the start" icon="lightbulb"><span className="flex flex-wrap gap-1.5">{w.entryUses.map((u) => <KnowledgeChip key={u.name} name={u.name} refId={u.ref} />)}</span></DetailRow> : null}
      </DetailHead>
    );
    if (i === nodes.length - 1) return (
      <DetailHead kick="Gate" icon="verified_user" title={nodes[i].label}>
        <DetailRow label="Finishes when" icon="logout"><Value v={def.exit} /></DetailRow>
        {lesson.criteria?.length ? <DetailRow label="Passes when" icon="checklist"><Value v={lesson.criteria} /></DetailRow> : null}
      </DetailHead>
    );
    const s = w.steps[i - 1];
    return (
      <DetailHead kick={s.decision ? `Step ${i} · decision` : `Step ${i} of ${w.steps.length}`} icon={s.decision ? "help" : "radio_button_checked"} color={s.decision ? "#c2410c" : "#007373"} title={s.title}>
        {s.decision ? <span className="justify-self-start rounded-full bg-[#fdf3d7] px-2 py-0.5 text-[11.5px] font-bold text-[#6b4f00]">You make the call — the agent only prepares a brief</span> : null}
        <DetailRow label="Who" icon="person">{s.actor}</DetailRow>
        {s.out ? <DetailRow label="Produces" icon="description"><ArtifactChip name={s.out} template={s.template} /></DetailRow> : null}
        {s.uses.length ? <DetailRow label="Uses" icon="lightbulb"><span className="flex flex-wrap gap-1.5">{s.uses.map((u) => <KnowledgeChip key={u.name} name={u.name} refId={u.ref} />)}</span></DetailRow> : null}
        {s.ask ? <DetailRow label="Ask your agent" icon="smart_toy"><span className="block rounded-lg bg-white px-2.5 py-2 text-[12.5px] italic leading-5 text-[var(--on-surface-variant)] ring-1 ring-black/[0.06]">{s.ask}</span></DetailRow> : null}
        <Loops loops={w.loops.filter(([f]) => f === s.id)} name={(id) => w.steps.find((x) => x.id === id)?.title ?? id} quiet />
      </DetailHead>
    );
  };
  return (
    <MapExplorer
      eyebrow={`${lesson.code} · Workflow map`}
      title={w.title}
      trail={[lesson.code, lesson.title, w.title]}
      gate={w.gate || lesson.gate}
      authority={String(sec(lesson.contract, "execution").authority ?? "")}
      nodes={nodes}
      edges={edges}
      routes={model.routes}
      branches={branchesOf(lesson.contract)}
      cases={casesOf(lesson.contract)}
      nodeDetail={nodeDetail}
    />
  );
}

/* ---------- 3 · Contract: the 10-section NODE contract, section by section ---------- */
export function ContractPanel({ contract, refs, model }: { contract: Contract | null; refs?: Refs; model: ModelMeta }) {
  const [si, setSi] = useState(0);
  if (!contract) return <p className="text-[14px] text-[var(--on-surface-variant)]">No contract for this lesson.</p>;
  const sections = model.contract.filter((s) => contract[s.id]);
  const s = sections[si] ?? sections[0];
  const data = (contract[s.id] ?? {}) as Record<string, unknown>;
  return (
    <div className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Contract sections">
        {sections.map((x, i) => (
          <button key={x.id} type="button" onClick={() => setSi(i)} className={cn("flex flex-none items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold transition-colors", i === si ? "bg-[var(--deep-indigo)] text-white" : "text-[var(--primary)] hover:bg-[#f1f3f4]")}>
            <MaterialSymbol className={cn("text-[17px]", i === si ? "text-[#4fd1c5]" : "text-black/45")} name={x.icon} /><span className="font-mono text-[10.5px] opacity-60">{String(i + 1).padStart(2, "0")}</span>{x.name}
          </button>
        ))}
      </nav>
      <div className="grid content-start gap-3">
        <div className="rounded-2xl bg-[#f6f7f8] px-4 py-3">
          <b className="text-[15px] text-[var(--primary)]">{s.name}</b>
          <p className="text-[13px] text-[var(--on-surface-variant)]">{s.q}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {s.fields.map(([key, label, hint]) => (
            <Card key={key} title={label}>
              <span className="-mt-1 text-[11.5px] text-[var(--on-surface-variant)]">{hint}</span>
              <Value v={data[key]} refs={refs} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 4 · Artifacts: what comes in, what goes out, what proves it, where it goes ---------- */
export function ArtifactsPanel({ lesson }: { lesson: Lesson }) {
  const art = sec(lesson.contract, "artifacts");
  const cont = sec(lesson.contract, "continuity");
  const t = lesson.refs.artifacts;
  const stepOuts = lesson.workflows.flatMap((w) => w.steps.filter((s) => s.out).map((s) => ({ step: s.title, out: s.out, template: s.template })));
  const col = (title: string, icon: string, names: string[], tone: "violet" | "teal" | "amber") => (
    <Card title={title} icon={icon} tone={tone}>
      {names.length ? <div className="flex flex-wrap gap-1.5">{names.map((n) => <ArtifactChip key={n} name={n} template={t[n]} />)}</div> : <span className="text-[13px] text-black/45">—</span>}
    </Card>
  );
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {col("Inputs", "input", list(art.inputs), "violet")}
        <MaterialSymbol className="hidden self-center text-[22px] text-black/30 md:block" name="arrow_forward" />
        <section className="grid content-center gap-1 rounded-2xl bg-[var(--deep-indigo)] p-4 text-white">
          <span className={cn(kicker, "text-[#4fd1c5]")}>{lesson.code}</span>
          <b className="text-[14.5px] leading-snug">{lesson.title}</b>
          {lesson.gate ? <span className="text-[12px] text-white/70">Gate: {lesson.gate}</span> : null}
        </section>
        <MaterialSymbol className="hidden self-center text-[22px] text-black/30 md:block" name="arrow_forward" />
        {col("Outputs", "output", list(art.outputs), "teal")}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {col("Evidence that it’s done", "verified", list(art.evidence), "amber")}
        <Card title="Handed on to" icon="east"><Value v={cont.handoff} /></Card>
      </div>
      {stepOuts.length ? (
        <Card title="Made along the way — step by step" icon="format_list_numbered">
          <ol className="grid gap-1.5">
            {stepOuts.map((s, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--on-surface-variant)]">
                <span className="w-5 text-right font-mono text-[11px]">{i + 1}</span><span className="text-[var(--primary)]">{s.step}</span><MaterialSymbol className="text-[15px] text-black/30" name="arrow_right_alt" /><ArtifactChip name={s.out} template={s.template} />
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        <Card title="Traceability" icon="link"><Value v={cont.traceability} /></Card>
        <Card title="Measures" icon="monitoring"><Value v={cont.measures} /></Card>
        <Card title="Learning" icon="school"><Value v={cont.learning} /></Card>
      </div>
    </div>
  );
}

/* ---------- 5 · Knowledge & lenses: the methods behind it, the viewpoints that check it, who does what ---------- */
const KNOW_GROUPS: [string, string][] = [["frameworks", "Frameworks"], ["standards", "Standards"], ["methods", "Methods"], ["techniques", "Techniques"], ["practices", "Practices"], ["patterns", "Patterns"], ["principles", "Principles"], ["tools", "Tools"]];
export function KnowledgePanel({ lesson }: { lesson: Lesson }) {
  const kn = sec(lesson.contract, "knowledge"), ln = sec(lesson.contract, "lenses"), ex = sec(lesson.contract, "execution");
  const roles = list(ex.roles).map((r) => { const m = r.match(/^([ARCI])\s*[—-]\s*(.+)$/); return m ? { k: m[1], who: m[2] } : { k: "", who: r }; });
  const RACI: Record<string, string> = { A: "Accountable", R: "Responsible", C: "Consulted", I: "Informed" };
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <Card title="Knowledge it draws on" icon="lightbulb" tone="violet">
        <span className="-mt-1 text-[12px] text-[var(--on-surface-variant)]">Click any item to learn what it is and how to use it.</span>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-2">
          {KNOW_GROUPS.filter(([k]) => list(kn[k]).length).map(([k, label]) => (
            <div key={k} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1">
              <span className="text-[11.5px] font-bold text-[var(--on-surface-variant)]">{label}</span>
              <div className="flex flex-wrap gap-1.5">{list(kn[k]).map((n) => <KnowledgeChip key={n} name={n} refId={lesson.refs.knowledge[n]} />)}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Lenses" icon="visibility" tone="amber">
        <span className="-mt-1 text-[12px] text-[var(--on-surface-variant)]">The viewpoints that check this work. Required ones are marked.</span>
        <div className="flex flex-wrap gap-1.5">
          {list(ln.required).map((n) => <LensChip key={n} name={n} refId={lesson.refs.lenses[n]} required />)}
          {list(ln.applicable).map((n) => <LensChip key={n} name={n} refId={lesson.refs.lenses[n]} />)}
        </div>
        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          {(["concerns", "constraints", "evidence", "decisions"] as const).map((k) => list(ln[k]).length ? <div key={k}><span className="text-[11.5px] font-bold capitalize text-[var(--on-surface-variant)]">{k}</span><Value v={ln[k]} /></div> : null)}
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Who does what (RACI)" icon="groups">
          <ul className="grid gap-1.5">{roles.map((r) => <li key={r.who + r.k} className="flex items-center gap-2 text-[13.5px] text-[var(--primary)]">{r.k ? <span className="flex size-6 flex-none items-center justify-center rounded-lg bg-[var(--deep-indigo)] text-[11px] font-black text-white" title={RACI[r.k]}>{r.k}</span> : null}{r.who}{r.k ? <span className="text-[11.5px] text-[var(--on-surface-variant)]">{RACI[r.k]}</span> : null}</li>)}</ul>
        </Card>
        <Card title="Agents, tools and authority" icon="smart_toy">
          <dl className="grid gap-2">
            {list(ex.agents).length ? <div><dt className="text-[11.5px] font-bold text-[var(--on-surface-variant)]">Agents</dt><dd><Value v={ex.agents} /></dd></div> : null}
            {list(ex.tools).length ? <div><dt className="text-[11.5px] font-bold text-[var(--on-surface-variant)]">Tools</dt><dd><Value v={ex.tools} /></dd></div> : null}
            {ex.authority ? <div><dt className="text-[11.5px] font-bold text-[var(--on-surface-variant)]">Authority</dt><dd><Value v={ex.authority} /></dd></div> : null}
          </dl>
        </Card>
      </div>
    </div>
  );
}

/* ---------- process overview: how the day's lessons fit together ---------- */
/* ---------- the process: its title, a way in (the board, or the story), its map — details on demand ---------- */
export function ProcessPanel({ process, model, onOpenLesson, onStart, onStory, startLabel = "Start" }: { process: DayProcess; model: ModelMeta; onOpenLesson: (fid: string) => void; onStart?: () => void; onStory?: () => void; startLabel?: string }) {
  const c = process.contract;
  const def = sec(c, "definition"), ctl = sec(c, "controls"), cont = sec(c, "continuity");
  const subName = (id: string) => process.lessons.find((l) => l.fid.endsWith(`.${id}`))?.title ?? id;
  const [showDetails, setShowDetails] = useState(false);
  const [showContract, setShowContract] = useState(false);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
        <div className="grid max-w-3xl gap-1.5">
          <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Process {process.code} · {process.lessons.length} lessons</span>
          <h2 className="font-heading text-[clamp(1.6rem,3vw,2.4rem)] font-black uppercase leading-none tracking-[-0.04em] text-[var(--primary)]">{process.title}</h2>
          {process.summary ? <p className="text-[15px] leading-7 text-[var(--on-surface-variant)]">{process.summary}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {onStory ? (
            <button type="button" onClick={onStory} title="Watch it as a story" aria-label="Watch it as a story" className="flex size-12 items-center justify-center rounded-full bg-[var(--deep-indigo)] text-[#4fd1c5] shadow-lg transition-transform hover:-translate-y-0.5">
              <MaterialSymbol className="text-[24px]" name="movie" />
            </button>
          ) : null}
          {onStart ? (
            <button type="button" onClick={onStart} className="flex h-12 items-center gap-2 rounded-full bg-[var(--electric-pink)] px-6 text-[13px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25 transition-transform hover:-translate-y-0.5">
              <MaterialSymbol className="text-[20px]" name="play_arrow" />{startLabel}
            </button>
          ) : null}
        </div>
      </div>

      <ProcessMap process={process} model={model} onOpenLesson={onOpenLesson} />

      <button type="button" onClick={() => setShowDetails((v) => !v)} className="flex items-center gap-1.5 justify-self-start text-[12.5px] font-bold text-black/55 hover:text-[var(--primary)]" aria-expanded={showDetails}>
        <MaterialSymbol className="text-[17px]" name="info" />Process details<MaterialSymbol className={cn("text-[18px] transition-transform", showDetails && "rotate-180")} name="expand_more" />
      </button>
      {showDetails ? (
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Card title="Purpose" icon="flag" tone="violet"><Value v={def.purpose ?? process.summary} /></Card>
            <Card title="Outcome" icon="emoji_events" tone="teal"><Value v={def.outcome} /></Card>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Card title="Loops between them" icon="sync_alt"><Loops loops={process.loops} name={subName} /></Card>
            <Card title={`Gate: ${process.gate || "—"}`} icon="verified" tone="amber">
              <Value v={ctl.criteria} />
              {list(ctl.checks).length ? <><span className="mt-1 text-[11.5px] font-bold text-[var(--on-surface-variant)]">Checks</span><Value v={ctl.checks} /></> : null}
            </Card>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Card title="Handed on to" icon="east"><Value v={cont.handoff} /></Card>
            <Card title="Timebox in a real team" icon="schedule"><Value v={cont.timebox} /></Card>
            <Card title="Measures" icon="monitoring"><Value v={cont.measures} /></Card>
          </div>
          {c ? (
            <>
              <button type="button" onClick={() => setShowContract((v) => !v)} className="flex items-center justify-between rounded-2xl border border-black/[0.08] px-4 py-3 text-left text-[13.5px] font-bold text-[var(--primary)] hover:bg-[#fafbfb]" aria-expanded={showContract}>
                <span className="flex items-center gap-2"><MaterialSymbol className="text-[18px] text-[var(--bridge-teal)]" name="assignment" />The process’s full NODE contract</span>
                <MaterialSymbol className={cn("text-[20px] transition-transform", showContract && "rotate-180")} name="expand_more" />
              </button>
              {showContract ? <ContractPanel contract={c} refs={process.refs} model={model} /> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ProcessMap({ process, model, onOpenLesson }: { process: DayProcess; model: ModelMeta; onOpenLesson: (fid: string) => void }) {
  const ctl = sec(process.contract, "controls"), def = sec(process.contract, "definition");
  const nodes: FlowNode[] = [
    { id: "__in", label: "Entry", kind: "entry" },
    ...process.lessons.map((l) => ({ id: l.fid.split(".").pop()!, label: l.title, num: l.code, kind: "unit" as const, owner: ownerOf(l.contract), check: firstExit(l.contract) })),
    { id: "__out", label: process.gate || "Exit", kind: "gate", note: list(ctl.criteria).length ? `✓ ${list(ctl.criteria).length} criteria` : undefined },
  ];
  const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
  const edges: FlowEdge[] = [...nodes.slice(1).map((_, i) => ({ f: i, t: i + 1, ty: "forward" })), ...loopEdges(process.loops, idx)];
  const nodeDetail = (i: number) => {
    if (i === 0) return <DetailHead kick="Entry" icon="login" title="Starts when"><Value v={def.entry} /></DetailHead>;
    if (i === nodes.length - 1) return (
      <DetailHead kick="Gate" icon="verified_user" title={nodes[i].label}>
        <DetailRow label="Passes when" icon="checklist"><Value v={ctl.criteria} /></DetailRow>
        {list(ctl.checks).length ? <DetailRow label="Checks" icon="fact_check"><Value v={ctl.checks} /></DetailRow> : null}
        {sec(process.contract, "execution").authority ? <DetailRow label="Decided by" icon="gavel"><Value v={sec(process.contract, "execution").authority} /></DetailRow> : null}
      </DetailHead>
    );
    const l = process.lessons[i - 1], ld = sec(l.contract, "definition"), art = sec(l.contract, "artifacts");
    const steps = l.workflows.flatMap((w) => w.steps);
    return (
      <DetailHead kick={`Subprocess ${l.code}`} icon="account_tree" title={l.title}>
        {ownerOf(l.contract) ? <DetailRow label="Owner" icon="person">{ownerOf(l.contract)}</DetailRow> : null}
        {ld.purpose ? <DetailRow label="Purpose" icon="flag"><Value v={ld.purpose} /></DetailRow> : null}
        {list(ld.exit).length ? <DetailRow label="Done when" icon="check_circle"><Value v={ld.exit} /></DetailRow> : null}
        {list(art.outputs).length ? <DetailRow label="Produces" icon="description"><span className="flex flex-wrap gap-1.5">{list(art.outputs).map((n) => <ArtifactChip key={n} name={n} template={l.refs.artifacts[n]} />)}</span></DetailRow> : null}
        {steps.length ? <DetailRow label={`${l.workflows.length} workflow${l.workflows.length === 1 ? "" : "s"} · ${steps.length} steps`} icon="conversion_path"><ol className="grid gap-0.5 text-[12.5px] text-[var(--on-surface-variant)]">{steps.slice(0, 6).map((s, k) => <li key={s.id}><span className="font-mono text-[10.5px] text-black/40">{k + 1}</span> {s.title}{s.decision ? " ◆" : ""}</li>)}{steps.length > 6 ? <li className="text-black/40">+ {steps.length - 6} more</li> : null}</ol></DetailRow> : null}
        <button type="button" onClick={() => onOpenLesson(l.fid)} className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--electric-pink)] px-3 py-2 text-[12.5px] font-bold text-white shadow-md shadow-pink-500/20 transition-transform hover:-translate-y-0.5">Open this lesson<MaterialSymbol className="text-[17px]" name="arrow_forward" /></button>
      </DetailHead>
    );
  };
  return (
    <MapExplorer
      eyebrow={`Process ${process.code} · Process map`}
      title={process.title}
      gate={process.gate}
      authority={String(sec(process.contract, "execution").authority ?? "")}
      nodes={nodes}
      edges={edges}
      routes={model.routes}
      branches={branchesOf(process.contract)}
      states={statesOf(process.contract)}
      cases={casesOf(process.contract)}
      nodeDetail={nodeDetail}
    />
  );
}
