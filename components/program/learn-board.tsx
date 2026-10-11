"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Contract, DayProcess, KnowledgeEntry, LensEntry, LensUse, Lesson, ModelMeta, Step, Template } from "@/lib/program";
import { FIELD_GUIDE } from "@/lib/program/field-guide";
import { cn } from "@/lib/utils";

import { FlowMap, type MapSel } from "./flow-map";
import { workflowGraph } from "./lesson-panels";
import { StructureView, kicker, useDetail, type Structure } from "./program-ui";
import { LiveTemplate, draftParts } from "./live-template";
import { TemplateBody, templateTitle } from "./template-view";

import { BOARD_CHAPTERS } from "./overlay-meta";

/* The lesson's Learn board (after the book's Learn mode, the-book/sdlc/learn.js): a full-screen canvas that teaches the
 * subprocess one thing at a time. Narration runs as subtitles at the bottom; each line brings the next element onto the
 * board. It opens with the questions every unit answers (why, what, who, when, where, how), shows the workflow, then
 * zooms into each step and the paths out of it — the document it produces, the knowledge it uses (what it is, how to
 * use it), the decision it asks — and ends with what can go differently, the gate, the routes and what's handed on. */

type Line = { say: ReactNode; who?: string };
type MapCue = { wi: number; sel?: (li: number) => MapSel | null; zoom?: (li: number) => number | null; flow?: boolean; relevant?: string[] | null };
type Frame = { id: string; chapter: string; title?: string; icon?: string; group?: string; lines: Line[]; map?: MapCue; fields?: string[]; render: (li: number) => ReactNode };

export { BOARD_CHAPTERS };

const list = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : []);
const sec = (c: Contract | null, id: string) => ((c ?? {})[id] ?? {}) as Record<string, unknown>;
const first = (s: string) => String(s || "").split(/(?<=[.!?])\s/)[0];
const lc = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const B = ({ children }: { children: ReactNode }) => <b className="font-bold text-white">{children}</b>;
const ROUTE_WORD: Record<string, string> = { rework: "goes back", escalate: "goes up", stop: "stops", alternate: "takes another way", forward: "moves on" };

/* an element that appears when the narration reaches line k */
const show = (li: number, k: number) => cn(`lb-l${k} transition-all duration-500 ease-out`, li >= k ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0");

/* ---------- pieces on the board ---------- */
function Paper({ t, small }: { t: Template; small?: boolean }) {
  const { open } = useDetail();
  const fmt = String((t.tpl as { fmt?: string } | null)?.fmt ?? "doc");
  const icon = ({ doc: "article", form: "edit_note", sheet: "table", message: "mail", canvas: "dashboard", pack: "folder_open" } as Record<string, string>)[fmt] ?? "description";
  return (
    <div className="grid gap-2 rounded-2xl bg-white p-4 shadow-[0_18px_40px_-20px_rgba(13,17,23,.35)] ring-1 ring-black/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <span className="grid gap-0.5">
          <span className={cn(kicker, "flex items-center gap-1 text-[9.5px] text-[var(--bridge-teal)]")}><MaterialSymbol className="text-[14px]" name={icon} />{fmt} · {t.type}</span>
          <b className="text-[15px] leading-tight text-[var(--primary)]">{templateTitle(t)}</b>
        </span>
        <button type="button" onClick={() => open({ kind: "template", id: t.id })} className="flex flex-none items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-bold text-[var(--bridge-teal)] hover:bg-[#eef6f6]"><MaterialSymbol className="text-[15px]" name="open_in_new" />Template</button>
      </div>
      <p className="text-[13px] leading-5 text-[var(--on-surface-variant)]">{t.what}</p>
      {t.tpl ? (
        <div className={cn("relative overflow-hidden rounded-xl bg-[#fafaf8] p-3 text-[12px] ring-1 ring-black/[0.05]", small ? "max-h-[150px]" : "max-h-[230px]")}>
          <TemplateBody t={t} />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#fafaf8] to-transparent" />
        </div>
      ) : null}
      {t.good.length ? <div className="flex items-start gap-1.5 text-[12px] text-[#005a5a]"><MaterialSymbol className="mt-px text-[15px]" name="verified" /><span><b>Good looks like:</b> {t.good.slice(0, 2).join(" · ")}</span></div> : null}
    </div>
  );
}

function Tag({ field }: { field: string }) {
  const g = FIELD_GUIDE[field];
  const [s, k] = field.split(".");
  return <span title={g ? `${g.what} — ${g.why}` : undefined} className="inline-flex items-center gap-1 rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-black/50"><MaterialSymbol className="text-[11px]" name="assignment" />{s} › {k}</span>;
}

/* the workflow map that pans and zooms onto a step — the camera moves, the map stays the book's */
function ZoomMap({ lesson, model, cue, li, k = 1.9 }: { lesson: Lesson; model: ModelMeta; cue: MapCue; li: number; k?: number }) {
  const box = useRef<HTMLDivElement>(null), inner = useRef<HTMLDivElement>(null);
  const g = workflowGraph(lesson, cue.wi);
  const z = cue.zoom?.(li) ?? null;
  useEffect(() => {
    const b = box.current, el = inner.current;
    if (!b || !el) return;
    if (z === null) { el.style.transform = "translate(0px, 0px) scale(1)"; return; }
    const node = el.querySelector(`[data-i="${z}"]`) as SVGGraphicsElement | null;
    const svg = node?.ownerSVGElement;
    if (!node || !svg) return;
    const bb = node.getBBox(), f = svg.clientWidth / svg.viewBox.baseVal.width;
    const offX = (el.clientWidth - svg.clientWidth) / 2;
    const cx = offX + (bb.x + bb.width / 2) * f, cy = (bb.y + bb.height / 2) * f;
    el.style.transform = `translate(${b.clientWidth / 2 - el.offsetLeft - cx * k}px, ${b.clientHeight / 2 - el.offsetTop - cy * k}px) scale(${k})`;
  }, [z, cue.wi, li, k]);
  return (
    <div ref={box} className="relative grid h-full min-h-0 place-items-center overflow-hidden">
      <div ref={inner} className="w-full origin-top-left transition-transform duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)]">
        <FlowMap nodes={g.nodes} edges={g.edges} routes={model.routes} branches={g.branches} authority={g.authority} label={`Flow map of ${lesson.workflows[cue.wi]?.title ?? ""}`} sel={cue.sel?.(li) ?? null} relevant={cue.relevant ?? null} flow={!!cue.flow} layers={{ owners: false, checks: false, states: false, branches: true }} />
      </div>

    </div>
  );
}

/* what a lens looks at, as a sentence (some entries already start with "Looks at") */
const looksAt = (l: LensEntry) => { const w = String(l.what ?? l.short ?? ""); return /^looks\b/i.test(w) ? `It ${lc(w)}` : `It looks at ${lc(w)}`; };

function TemplateOpen({ id }: { id: string }) {
  const { open } = useDetail();
  return <button type="button" onClick={() => open({ kind: "template", id })} className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[12.5px] font-bold text-[var(--bridge-teal)] ring-1 ring-black/[0.06] hover:ring-[var(--bridge-teal)]"><MaterialSymbol className="text-[16px]" name="open_in_new" />Open the full template</button>;
}
function KnowMore({ refId }: { refId: string }) {
  const { open } = useDetail();
  return <button type="button" onClick={() => open({ kind: "knowledge", id: refId })} className="flex items-center gap-1 justify-self-start text-[12px] font-bold text-[#6d48d8] hover:underline"><MaterialSymbol className="text-[15px]" name="open_in_new" />Read the full entry</button>;
}

/* ---------- the frames, built from the lesson in the order the work flows ---------- */
function useFrames(lesson: Lesson, process: DayProcess | null, model: ModelMeta): Frame[] {
  const { lookups } = useDetail();
  return useMemo(() => {
    const c = lesson.contract;
    const D = sec(c, "definition"), F = sec(c, "flow"), K = sec(c, "cases"), R = sec(c, "routing"), CT = sec(c, "controls"), EX = sec(c, "execution"), A = sec(c, "artifacts"), CO = sec(c, "continuity"), LN = sec(c, "lenses");
    const sibs = process?.lessons ?? [];
    const at = sibs.findIndex((l) => l.fid === lesson.fid);
    const prev = at > 0 ? sibs[at - 1] : null, next = at >= 0 && at < sibs.length - 1 ? sibs[at + 1] : null;
    const tpl = (id: string | null | undefined) => (id ? lookups.templates[id] ?? null : null);
    const know = (ref: string | null | undefined) => (ref ? lookups.knowledge[ref] ?? null : null);
    const roles = list(EX.roles).map((r) => { const m = r.match(/^([ARCI])\s*[—-]\s*(.+)$/); return m ? { k: m[1], who: m[2] } : { k: "", who: r }; });
    const owner = roles.find((r) => r.k === "R")?.who ?? roles[0]?.who ?? "the team";
    const accountable = roles.find((r) => r.k === "A")?.who;
    const frames: Frame[] = [];

    /* 1 · title */
    frames.push({
      id: "title", chapter: "intro", title: "What this subprocess is", icon: "play_circle",
      lines: [
        { say: <>This is <B>{lesson.code} {lesson.title}</B>{process ? <> — a subprocess of <B>{process.title}</B></> : null}.</> },
        { say: <>{prev ? <>It picks up from <B>{prev.title}</B></> : "It opens its process"}{next ? <> and prepares <B>{next.title}</B>.</> : " and closes its process."}</> },
        { say: <>First, the questions every unit answers — why, what, who, when, where. Then we walk the workflow, step by step, the way the work really flows.</> },
      ],
      render: (li) => (
        <div className="grid place-items-center gap-6 text-center">
          <div className={cn("grid gap-2", show(li, 0))}>
            <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Subprocess · {process?.title}</span>
            <span className="font-mono text-[clamp(2.5rem,7vw,5rem)] font-black leading-none text-[var(--electric-pink)]">{lesson.code}</span>
            <h2 className="font-heading text-[clamp(1.8rem,4vw,3.2rem)] font-black uppercase leading-none tracking-[-0.04em] text-[var(--primary)]">{lesson.title}</h2>
            {lesson.summary ? <p className="mx-auto max-w-xl text-[15px] text-[var(--on-surface-variant)]">{lesson.summary}</p> : null}
          </div>
          <div className={cn("flex flex-wrap items-center justify-center gap-2", show(li, 1))}>
            {sibs.map((l, i) => (
              <span key={l.fid} className="flex items-center gap-2">
                <span className={cn("rounded-xl px-3 py-2 text-[12.5px] font-bold", l.fid === lesson.fid ? "bg-[var(--deep-indigo)] text-white shadow-lg" : "bg-white text-black/50 ring-1 ring-black/[0.08]")}><span className="mr-1 font-mono text-[10.5px] opacity-70">{l.code}</span>{l.title}</span>
                {i < sibs.length - 1 ? <MaterialSymbol className="text-[18px] text-black/25" name="arrow_forward" /> : null}
              </span>
            ))}
          </div>
        </div>
      ),
    });

    /* 2 · the questions: why · what · who · when · where · how */
    const Q = [
      { q: "Why", icon: "flag", c: "#6d48d8", field: "definition.purpose", head: String(D.purpose ?? ""), sub: D.jtbd ? `The job: ${D.jtbd}` : "", say: <>Why does it exist? <B>{String(D.purpose ?? "")}</B></> },
      { q: "What", icon: "emoji_events", c: "#007373", field: "definition.outcome", head: String(D.outcome ?? ""), sub: list(A.outputs).length ? `Produces: ${list(A.outputs).join(", ")}` : "", say: <>What changes when it’s done? {lc(String(D.outcome ?? ""))}</> },
      { q: "Who", icon: "groups", c: "#d81b60", field: "execution.roles", head: `${owner} does the work${accountable ? `; ${accountable} is accountable` : ""}.`, sub: list(EX.agents).length ? `Agents: ${list(EX.agents).join(", ")}` : "", say: <>Who? The <B>{owner}</B> does the work{accountable ? <>, and the <B>{accountable}</B> is accountable</> : null}.{list(EX.agents).length ? " Agents draft; people decide." : ""}</> },
      { q: "When", icon: "schedule", c: "#c49000", field: "definition.entry", head: `Starts when: ${list(D.entry).join("; ")}`, sub: CO.timebox ? `Takes about ${CO.timebox}` : "", say: <>When does it start? When {lc(list(D.entry).join(", and "))}.{CO.timebox ? <> In a real team it takes about <B>{String(CO.timebox)}</B>.</> : null}</> },
      { q: "Where", icon: "place", c: "#0284c7", field: "artifacts.inputs", head: `${list(A.inputs).length ? `Takes in ${list(A.inputs).join(", ")}` : "Starts from the request"}${CO.handoff ? ` → hands on ${CO.handoff}` : ""}`, sub: list(F.dependencies).length ? `Depends on: ${list(F.dependencies).join(", ")}` : "", say: <>Where does it sit? It takes in {list(A.inputs).length ? <B>{list(A.inputs).join(", ")}</B> : "the request"}{CO.handoff ? <>, and hands on <B>{String(CO.handoff)}</B></> : null}.</> },
      { q: "How", icon: "account_tree", c: "#040505", field: "flow.normal", head: `${lesson.workflows.length} workflow${lesson.workflows.length === 1 ? "" : "s"} · ${lesson.workflows.reduce((n, w) => n + w.steps.length, 0)} steps`, sub: list(F.normal).join(" → "), say: <>And how? Through {lesson.workflows.length === 1 ? "one workflow" : `${lesson.workflows.length} workflows`} — {lesson.workflows.map((w) => w.title).join(", ")}. Let’s open it.</> },
    ].filter((x) => x.head.trim());
    frames.push({
      id: "questions", chapter: "questions", title: "Why · what · who · when · where · how", icon: "help", fields: Q.map((x) => x.field),
      lines: Q.map((x) => ({ say: x.say, who: x.q })),
      render: (li) => (
        <div className="grid w-full max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Q.map((x, i) => (
            <div key={x.q} className={cn("grid content-start gap-2 rounded-2xl bg-white p-4 shadow-[0_18px_40px_-24px_rgba(13,17,23,.4)] ring-1 ring-black/[0.05]", show(li, i), li === i && "ring-2")} style={li === i ? { boxShadow: `0 0 0 2px ${x.c}, 0 18px 40px -24px rgba(13,17,23,.4)` } : undefined}>
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl text-white" style={{ background: x.c }}><MaterialSymbol className="text-[19px]" name={x.icon} /></span><b className="font-heading text-[20px] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">{x.q}?</b></span>
                <Tag field={x.field} />
              </span>
              <p className="text-[14px] font-semibold leading-6 text-[var(--primary)]">{x.head}</p>
              {x.sub ? <p className="text-[12.5px] leading-5 text-[var(--on-surface-variant)]">{x.sub}</p> : null}
            </div>
          ))}
        </div>
      ),
    });

    /* 3 · the lenses: who sees what from their end, and why it's needed */
    const lensOf = (n: string) => (lesson.refs.lenses[n] ? lookups.lenses[lesson.refs.lenses[n]!] ?? null : null);
    const reqL = list(LN.required).map((n) => ({ n, l: lensOf(n) })).filter((x): x is { n: string; l: LensEntry } => !!x.l);
    const appL = list(LN.applicable).filter((n) => !list(LN.required).includes(n)).map((n) => ({ n, l: lensOf(n) })).filter((x): x is { n: string; l: LensEntry } => !!x.l);
    if (reqL.length || appL.length) {
      frames.push({
        id: "lenses-intro", chapter: "lenses", title: "What lenses are", icon: "visibility", fields: ["lenses.required", "lenses.applicable"],
        lines: [
          { say: <>Every unit is seen by different people, each from their own end. The book calls these viewpoints <B>lenses</B>.</> },
          { say: <>A lens is a person or a function with something at stake — they look for different things, ask different questions and need different proof.</> },
          { say: <>{reqL.length ? <>Here <B>{reqL.length}</B> {reqL.length === 1 ? "lens is" : "lenses are"} required — their view must be engaged before the gate</> : "None are required here"}{appL.length ? <>, and <B>{appL.length}</B> more {appL.length === 1 ? "is" : "are"} listening</> : null}. You’ll meet each one where it looks in on the work — the step, the question it asks there, and why.</> },
        ],
        render: (li) => (
          <div className="grid w-full max-w-4xl justify-items-center gap-5">
            <div className={cn("flex items-center gap-3", show(li, 0))}><span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--deep-indigo)] text-white"><MaterialSymbol className="text-[28px] text-[#4fd1c5]" name="visibility" /></span><b className="font-heading text-[clamp(1.6rem,3vw,2.4rem)] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">Lenses</b></div>
            <div className={cn("flex flex-wrap justify-center gap-2", show(li, 2))}>
              {reqL.map((x) => <span key={x.n} className="flex items-center gap-1.5 rounded-full bg-[var(--deep-indigo)] px-3 py-1.5 text-[13px] font-bold text-white"><MaterialSymbol className="text-[16px] text-[#e0b84a]" name={x.l.icon} />{x.n}<em className="font-mono text-[9.5px] not-italic text-white/50">required</em></span>)}
              {appL.map((x) => <span key={x.n} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-[var(--primary)] ring-1 ring-black/[0.08]"><MaterialSymbol className="text-[16px] text-black/45" name={x.l.icon} />{x.n}</span>)}
            </div>
          </div>
        ),
      });
    }

    const reqIds = new Set(list(LN.required).map((n) => lesson.refs.lenses[n]).filter(Boolean) as string[]);
    const lensById = (id: string) => lookups.lenses[id] ?? null;
    const met = new Set<string>();

    /* a lens, met in full — at the point in the flow where it first looks in (or before the gate, if it must sign off) */
    function lensFrame(n: string, l: LensEntry, required: boolean, here?: { where: string; note: string; wi: number; node: number }): Frame {
      const holder = list(l.holder).join(", ");
      const parts = [
        { k: "asks", label: "They ask", icon: "help", v: list(l.asks).slice(0, 4), say: <>From their end, they ask: {list(l.asks).slice(0, 3).map((q, i) => <i key={i}>{i ? " · " : ""}“{q}”</i>)}</> },
        { k: "concerns", label: "They worry about", icon: "report", v: list(l.concerns), say: <>What worries them: <B>{list(l.concerns).join("; ")}</B>.</> },
        { k: "evidence", label: "They need to see", icon: "fact_check", v: list(l.evidence), say: <>To be satisfied, they need to see <B>{list(l.evidence).join(", ")}</B>.</> },
        { k: "decisions", label: "They decide", icon: "gavel", v: list(l.decisions), say: <>They have a say in: {list(l.decisions).join("; ")}</> },
        { k: "ignored", label: "If ignored", icon: "warning", v: list((l as LensEntry & { ignored?: string[] }).ignored), say: <>Why it’s needed: ignore this lens and you get <B>{lc(list((l as LensEntry & { ignored?: string[] }).ignored).join(" and "))}</B>.</> },
      ].filter((x) => x.v.length);
      return {
        id: `lens-${l.id}`, title: `${n} lens`, icon: l.icon, chapter: here ? (here.where === "the gate" ? "gate" : "workflow") : "lenses", fields: ["lenses.concerns", "lenses.evidence", "lenses.decisions"],
        lines: [
          { say: here ? <>Meet the <B>{n}</B> lens{holder ? <> — the <B>{holder}</B></> : null}. {looksAt(l)}</> : <>The <B>{n}</B> lens{holder ? <> — held by the <B>{holder}</B></> : null}. {looksAt(l)}</>, who: n },
          ...(here?.note ? [{ say: <>At {here.where}, they ask: <B>{here.note}</B></>, who: n }] : []),
          ...parts.map((x) => ({ say: x.say, who: n })),
        ],
        map: here ? { wi: here.wi, zoom: () => here.node, sel: () => ({ k: "n", i: here.node }) } : undefined,
        render: (li) => (
          <div className={cn("grid w-full max-w-5xl gap-5 lg:grid-cols-[300px_minmax(0,1fr)]", here ? "items-start" : "items-center")}>
            <div className={cn("grid justify-items-center gap-3 rounded-3xl bg-[var(--deep-indigo)] p-6 text-center text-white", show(li, 0))} style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
              <span className="flex size-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-[#e0b84a]/60"><MaterialSymbol className="text-[32px] text-[#e0b84a]" name={l.icon} /></span>
              <b className="font-heading text-[22px] font-black uppercase leading-tight tracking-[-0.02em]">{n}</b>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">{required ? "required" : "applicable"} · {l.group}</span>
              {holder ? <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12.5px]"><MaterialSymbol className="text-[16px]" name="person" />{holder}</span> : null}
              <p className="text-[13px] leading-5 text-white/75">{l.what ?? l.short}</p>
              {here?.note ? <p className={cn("rounded-xl bg-[#e0b84a] px-3 py-2 text-left text-[13px] font-semibold leading-5 text-[#2b2000]", show(li, 1))}><span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] opacity-70">At {here.where}</span>{here.note}</p> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {parts.map((x, i) => (
                <div key={x.k} className={cn("grid content-start gap-1.5 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]", show(li, i + 1 + (here?.note ? 1 : 0)), li === i + 1 + (here?.note ? 1 : 0) && "ring-2 ring-[#e0b84a]", x.k === "ignored" && "bg-[#fdecf2]")}>
                  <span className={cn("flex items-center gap-1.5 text-[12.5px] font-bold", x.k === "ignored" ? "text-[#8a0f3f]" : "text-[#8a6500]")}><MaterialSymbol className="text-[17px]" name={x.icon} />{x.label}</span>
                  <ul className="grid gap-1">{x.v.map((v) => <li key={v} className="text-[13px] leading-5 text-[var(--primary)]">{x.k === "asks" ? <i>“{v}”</i> : v}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        ),
      };
    }

    /* 4 · each workflow: the map, then each step zoomed in — followed by a lesson on each piece of knowledge it uses
       (the first time it's used) and a walk-through of drafting the document it produces */
    const taught = new Set<string>(), drafted = new Set<string>();
    lesson.workflows.forEach((w, wi) => {
      const wc = w.contract ?? {};
      const n = w.steps.length;
      frames.push({
        id: `wf-${wi}`, chapter: "workflow", title: `The workflow · ${w.title}`, icon: "account_tree", fields: ["flow.normal"],
        lines: [
          { say: <>The workflow: <B>{w.title}</B>. {String(wc.definition ?? w.summary ?? "")}</> },
          ...w.steps.map((s, i) => ({ say: <><B>{i + 1}. {s.title}</B> — {s.decision ? <>a decision, made by the {s.actor}.</> : <>done by the {s.actor}{s.out ? <>, producing the {s.out}</> : null}.</>}</>, who: s.actor })),
          { say: <>Then the gate: <B>{w.gate || lesson.gate}</B>. That’s the happy path. Now let’s zoom into each step.</> },
        ],
        map: { wi, flow: true, relevant: ["forward"], sel: (li) => (li >= 1 && li <= n ? { k: "n", i: li } : li > n ? { k: "n", i: n + 1 } : null) },
        render: () => null,
      });
      meetLenses(w.entryLenses ?? [], "the start", wi, 0);
      w.entryUses.forEach((u) => { const k = know(u.ref); if (k && !taught.has(k.name)) { taught.add(k.name); frames.push(knowFrame(u.name, u.ref ?? null, k, null, w)); } });
      w.steps.forEach((s, i) => {
        frames.push(stepFrame(w, wi, s, i));
        const wf = whatIfFrame(w, wi, s, i);
        if (wf) frames.push(wf);
        meetLenses(s.lenses ?? [], `“${s.title}”`, wi, i + 1);
        s.uses.forEach((u) => { const k = know(u.ref); if (k && !taught.has(k.name)) { taught.add(k.name); frames.push(knowFrame(u.name, u.ref ?? null, k, s, w, { wi, node: i + 1 })); } });
        const tt = tpl(s.template);
        if (tt && !drafted.has(tt.id)) { drafted.add(tt.id); frames.push(draftFrame(tt, s, w, { wi, node: i + 1 })); }
      });
      const wfCases = workflowCasesFrame(w, wi);
      if (wfCases) frames.push(wfCases);
    });

    /* what if — at a step: each path out of it that isn't the happy one, what triggers it, where the work goes, what you do */
    function whatIfFrame(w: Lesson["workflows"][number], wi: number, s: Step, i: number): Frame | null {
      const ids = new Set(["__in", ...w.steps.map((x) => x.id), "__out"]);
      const valid = w.loops.filter(([f]) => ids.has(f));
      const fwd = w.steps.length + 1; // forward edges come first in the map
      const mine = valid.map((lp, j) => ({ lp, e: fwd + j })).filter((x) => x.lp[0] === s.id);
      if (!mine.length) return null;
      const authority = String(EX.authority ?? "");
      const dest = (to: string) => (to === "authority" ? "the authority" : to === "stop" ? "stop / park" : w.steps.find((x) => x.id === to)?.title ?? to);
      const doNext = (ty: string, to: string) =>
        ty === "rework" ? <>The work goes back to <B>{dest(to)}</B>. Fix what’s wrong there, then come forward through the steps again.</>
        : ty === "escalate" ? <>It goes up to the authority{authority ? <> — {lc(authority)}</> : null}. They make the call; the work waits for it.</>
        : ty === "stop" ? <>The work stops or is parked. Record why and what was learned, so it can restart — or close — cleanly.</>
        : <>It takes another valid route, to <B>{dest(to)}</B>.</>;
      const lines: Line[] = [{ say: <>{s.decision ? <>What if the answer to <B>{s.title}</B> is no?</> : <>What if <B>{lc(s.title)}</B> doesn’t go to plan?</>} {mine.length === 1 ? "There’s one other path out of this step." : `There are ${mine.length} other paths out of this step.`}</>, who: s.actor }];
      mine.forEach(({ lp: [, to, ty, n] }) => {
        lines.push({ say: <>What if — <B>{n}</B>? That’s a <B>{model.routes[ty]?.label?.toLowerCase() ?? ty}</B> path.</>, who: s.actor });
        lines.push({ say: doNext(ty, to), who: s.actor });
      });
      return {
        id: `whatif-${wi}-${s.id}`, chapter: "workflow", title: "What if", icon: "call_split", fields: ["cases.exceptions", "routing.rework", "routing.escalation"],
        lines,
        map: { wi, zoom: () => i + 1, sel: (li) => (li >= 1 ? { k: "e", i: mine[Math.min(mine.length - 1, Math.floor((li - 1) / 2))].e } : { k: "n", i: i + 1 }) },
        render: (li) => (
          <div className="grid w-full max-w-4xl gap-3">
            <div className={cn("flex items-center gap-3", show(li, 0))}>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5722]"><MaterialSymbol className="text-[24px]" name="call_split" /></span>
              <span className="grid leading-tight"><span className={cn(kicker, "text-[9.5px] text-[#c2410c]")}>What if · step {i + 1}</span><b className="font-heading text-[22px] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">{s.title}</b></span>
            </div>
            {mine.map(({ lp: [, to, ty, n] }, j) => {
              const r = model.routes[ty], a = 1 + j * 2, on = li === a || li === a + 1;
              return (
                <div key={j} className={cn("grid gap-2 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]", show(li, a), on && "ring-2")} style={on ? { boxShadow: `0 0 0 2px ${r?.c}` } : undefined}>
                  <div className="grid content-start gap-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: r?.c }}><MaterialSymbol className="text-[17px]" name={r?.icon ?? "route"} />{r?.label ?? ty}</span>
                    <b className="text-[15px] leading-snug text-[var(--primary)]">What if — {n}?</b>
                    <span className="flex items-center gap-1 text-[12.5px] text-black/50">{s.title}<MaterialSymbol className="text-[15px]" name="arrow_forward" />{dest(to)}</span>
                  </div>
                  <p className={cn("rounded-xl px-3 py-2 text-[13.5px] leading-6 text-[var(--primary)]", show(li, a + 1))} style={{ background: `color-mix(in srgb, ${r?.c ?? "#888"} 9%, white)` }}>{doNext(ty, to)}</p>
                </div>
              );
            })}
          </div>
        ),
      };
    }

    /* what if — across the workflow: its own cases, failures, recovery and branches */
    function workflowCasesFrame(w: Lesson["workflows"][number], wi: number): Frame | null {
      const wc = (w.contract ?? {}) as Record<string, unknown>;
      const rows = [
        { k: "cases", label: "Other cases", icon: "alt_route", c: "#0284c7", v: list(wc.cases) },
        { k: "branches", label: "Branches", icon: "call_split", c: "#007373", v: list(wc.branches) },
        { k: "failures", label: "Failures", icon: "error", c: "#e91e63", v: list(wc.failures) },
        { k: "recovery", label: "Recovery", icon: "healing", c: "#c49000", v: list(wc.recovery) },
      ].filter((x) => x.v.length);
      if (!rows.length) return null;
      const say: Record<string, (v: string[]) => ReactNode> = {
        cases: (v) => <>Other cases this workflow must handle: <B>{v.join("; ")}</B>.</>,
        branches: (v) => <>Where its decisions branch: {v.join("; ")}.</>,
        failures: (v) => <>What can fail: <B>{v.join("; ")}</B>.</>,
        recovery: (v) => <>And how it recovers: {v.join("; ")}.</>,
      };
      return {
        id: `wf-cases-${wi}`, chapter: "workflow", title: `What else can happen in ${w.title}`, icon: "alt_route", fields: ["cases.alternates", "cases.failures"],
        lines: [{ say: <>Before the gate — what else can happen across <B>{w.title}</B>?</> }, ...rows.map((x) => ({ say: say[x.k](x.v) }))],
        map: { wi, relevant: ["alternate", "rework", "escalate", "stop"] },
        render: (li) => (
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((x, i) => (
              <div key={x.k} className={cn("grid content-start gap-1.5 rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]", show(li, i + 1))} style={{ boxShadow: `inset 0 3px 0 ${x.c}` }}>
                <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: x.c }}><MaterialSymbol className="text-[17px]" name={x.icon} />{x.label}</span>
                <ul className="grid gap-1 text-[12.5px] leading-5 text-[var(--primary)]">{x.v.map((v) => <li key={v}>{v}</li>)}</ul>
              </div>
            ))}
          </div>
        ),
      };
    }

    /* the first time a lens looks in, meet it in full right there */
    function meetLenses(uses: LensUse[], where: string, wi: number, node: number) {
      uses.forEach((u) => {
        const l = lensById(u.id);
        if (!l || met.has(l.id)) return;
        met.add(l.id);
        frames.push(lensFrame(l.name, l, reqIds.has(l.id), { where, note: u.note, wi, node }));
      });
    }

    function stepFrame(w: Lesson["workflows"][number], wi: number, s: Step, i: number): Frame {
      const wc = w.contract ?? {};
      const t = tpl(s.template);
      const ks = s.uses.slice(0, 3).map((u) => ({ name: u.name, k: know(u.ref), ref: u.ref ?? null }));
      const loops = w.loops.filter(([f]) => f === s.id);
      const nextStep = w.steps[i + 1];
      const dest = (to: string) => (to === "authority" ? "the authority" : to === "stop" ? "stop / park" : w.steps.find((x) => x.id === to)?.title ?? to);
      const lensHere = (s.lenses ?? []).map((u) => ({ u, l: lensById(u.id) })).filter((x): x is { u: LensUse; l: LensEntry } => !!x.l);
      /* each line brings one item onto the board, in the same order — so the board reads top to bottom like the narration */
      const lines: Line[] = [];
      const items: { at: number; node: ReactNode }[] = [];
      const add = (line: Line, node: ReactNode) => { items.push({ at: lines.length, node }); lines.push(line); };
      const row = (icon: string, tone: string, label: string, body: ReactNode, extra?: string) => (
        <div className={cn("flex items-start gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/[0.06]", extra)}>
          <span className="flex size-9 flex-none items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${tone} 12%, white)`, color: tone }}><MaterialSymbol className="text-[19px]" name={icon} /></span>
          <span className="grid min-w-0 gap-0.5"><span className={cn(kicker, "text-[9.5px]")} style={{ color: tone }}>{label}</span><span className="text-[14px] leading-6 text-[var(--primary)]">{body}</span></span>
        </div>
      );
      if (s.decision) {
        add({ say: <>A decision: <B>{s.title}</B> — asked by the {s.actor}. A person makes this call; the agent only prepares the brief.</>, who: s.actor },
          list(wc.decisions)[0] ? row("help", "#c2410c", "The question", list(wc.decisions)[0]) : null);
        add({ say: <>On the happy path the answer is <B>yes</B>, and the work moves on{nextStep ? <> to <B>{nextStep.title}</B></> : " to the gate"}.</> },
          row("check_circle", "#007373", "Yes", <>moves on to <b>{nextStep?.title ?? "the gate"}</b></>));
      } else {
        add({ say: <>Step {i + 1}: the <B>{s.actor}</B> — {lc(s.title)}.</>, who: s.actor }, null);
      }
      if (s.out) add({ say: <>This produces the <B>{s.out}</B>{t ? <> — {lc(first(t.what))} We’ll draft it in a moment.</> : "."}</>, who: s.actor },
        row("description", "#007373", "Produces", <><b>{s.out}</b>{t ? <span className="text-[var(--on-surface-variant)]"> — {first(t.what)}</span> : null}</>));
      ks.forEach((k) => add({ say: <>It uses <B>{k.name}</B>{k.k?.type ? <>, a {k.k.type.toLowerCase()}</> : null}{k.k?.what ? <>: {lc(first(k.k.what))}</> : "."}{k.k?.how?.length ? <> We’ll learn how to use it next.</> : null}</> },
        row("lightbulb", "#6d48d8", `Uses · ${k.k?.type ?? "knowledge"}`, <><b>{k.name}</b>{k.k?.what ? <span className="text-[var(--on-surface-variant)]"> — {first(k.k.what)}</span> : null}</>)));
      if (loops.length) add({ say: <>{s.decision ? "If not" : "If it doesn’t go to plan"}: {loops.map(([, to, ty, nn], k) => <span key={k}>{k ? "; " : ""}<B>{nn}</B> — the work {ROUTE_WORD[ty] ?? ty} to {dest(to)}</span>)}. We’ll walk each one.</> },
        <div className="grid gap-1.5">{loops.map(([, to, ty, nn], k) => { const r = model.routes[ty]; return <div key={k} className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13.5px] ring-1 ring-black/[0.06]" style={{ boxShadow: `inset 3px 0 0 ${r?.c}` }}><span className="flex items-center gap-1 font-bold" style={{ color: r?.c }}><MaterialSymbol className="text-[16px]" name={r?.icon ?? "route"} />{r?.label ?? ty}</span><span className="text-[var(--primary)]">{nn}</span><span className="text-black/45">→ {dest(to)}</span></div>; })}</div>);
      lensHere.forEach((x) => add({ say: <>The <B>{x.l.name}</B> lens looks in here{met.has(x.l.id) ? null : <> — we’ll meet it properly in a moment</>}: <i>“{x.u.note}”</i></>, who: x.l.name },
        row(x.l.icon, "#a87b00", `${x.l.name} lens${reqIds.has(x.l.id) ? " · required" : ""} checks`, <b>{x.u.note}</b>, "bg-[#fffaeb] ring-[#e0b84a]/50")));
      if (s.ask) add({ say: <>Your agent can help. Ask it: <i>“{s.ask}”</i></>, who: "Your agent" },
        row("smart_toy", "#007373", "Ask your agent", <i>{s.ask}</i>, "border border-dashed border-[var(--bridge-teal)]/40 ring-0"));
      return {
        id: `wf-${wi}-${s.id}`, chapter: "workflow", title: `${i + 1}. ${s.title}`, icon: s.decision ? "help" : "radio_button_checked", fields: s.decision ? ["cases.alternates", "routing.rework"] : ["artifacts.outputs", "knowledge.techniques"],
        lines,
        map: { wi, zoom: () => i + 1, sel: () => ({ k: "n", i: i + 1 }), relevant: loops.length ? null : ["forward"] },
        render: (li) => (
          <div className="grid w-full max-w-3xl content-start gap-2.5">
            <div className={cn("grid gap-2 rounded-2xl bg-[var(--deep-indigo)] p-5 text-white", show(li, 0))} style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
              <span className={cn(kicker, "flex items-center gap-1.5 text-[#4fd1c5]")}>{w.title} · step {i + 1} of {w.steps.length}{s.decision ? " · decision" : ""}</span>
              <b className="font-heading text-[24px] font-black uppercase leading-tight tracking-[-0.03em]">{s.title}</b>
              <span className="flex items-center gap-2 text-[13px] text-white/80"><span className="flex size-8 items-center justify-center rounded-full bg-[var(--electric-pink)] text-[11px] font-black">{s.actor.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase()}</span><span><b className="text-white">{s.actor}</b> does this step</span></span>
            </div>
            {items.filter((x) => x.node).map((x) => <div key={x.at} className={cn(show(li, x.at), li === x.at && "[&>div]:ring-2 [&>div]:ring-[var(--electric-pink)]/60")}>{x.node}</div>)}
          </div>
        ),
      };
    }

    function knowFrame(name: string, ref: string | null, k: KnowledgeEntry, s: Step | null, w: Lesson["workflows"][number], at0?: { wi: number; node: number }): Frame {
      const how = (k.how ?? []).slice(0, 7), says = (k.says ?? []).slice(0, 4), pit = (k.pitfalls ?? []).slice(0, 3);
      const lines: Line[] = [];
      const at: Record<string, number> = {};
      lines.push({ say: <>Let’s learn <B>{k.name}</B>{k.type ? <> — a {k.type.toLowerCase()}</> : null}. {k.what}</>, who: k.type ?? "Knowledge" });
      at.why = lines.length; lines.push({ say: <>Why here? {k.use ? <>It’s good for {lc(k.use)} </> : null}{s ? <>In this step the {s.actor} uses it to {lc(s.title)}{s.out ? <>, and it feeds the <B>{s.out}</B></> : null}.</> : <>It applies throughout <B>{w.title}</B>, from the start.</>}</> });
      if (k.structure) { at.shape = lines.length; lines.push({ say: <>How it works — here’s its shape{k.structure.kind ? <>: a <B>{k.structure.kind}</B></> : null}. Read it left to right, top to bottom.</> }); }
      at.how = lines.length;
      how.forEach((h, i) => lines.push({ say: <>{i === 0 ? "How to do it. " : ""}Step {i + 1}: {h}</>, who: k.name }));
      at.says = lines.length;
      says.forEach((x) => lines.push({ say: <>It says: <B>{x}</B></>, who: k.name }));
      if (k.applies) { at.applies = lines.length; lines.push({ say: <>Where it applies: {k.applies}</> }); }
      if (pit.length) { at.pit = lines.length; lines.push({ say: <>Watch out: {pit.map((x, i) => <span key={i}>{i ? "; " : ""}{lc(x)}</span>)}.</> }); }
      at.try = lines.length; lines.push({ say: s?.ask ? <>Try it with your agent: <i>“{s.ask}”</i></> : <>You’ll use it for real in the <B>Do it</B> step.</>, who: "Your turn" });
      return {
        id: `know-${ref ?? name}`, chapter: "workflow", title: k.name, icon: "lightbulb", map: at0 ? { wi: at0.wi, zoom: () => at0.node, sel: () => ({ k: "n", i: at0.node }) } : undefined, fields: [`knowledge.${(k.type ?? "technique").toLowerCase().replace(/y$/, "ie")}s`].filter((f) => FIELD_GUIDE[f]),
        lines,
        render: (li) => (
          <div className="grid w-full max-w-3xl content-start gap-3">
            <div className="contents">
              <div className={cn("grid gap-2 rounded-3xl bg-white p-5 shadow-[0_18px_40px_-24px_rgba(13,17,23,.35)] ring-1 ring-[#6d48d8]/20", show(li, 0))}>
                <span className={cn(kicker, "flex items-center gap-1.5 text-[#6d48d8]")}><MaterialSymbol className="text-[16px]" name="lightbulb" />{k.type ?? "Knowledge"}{s ? ` · used in step: ${s.title}` : ` · applies throughout ${w.title}`}</span>
                <b className="font-heading text-[clamp(1.3rem,2.2vw,1.8rem)] font-black uppercase leading-tight tracking-[-0.03em] text-[var(--primary)]">{k.name}</b>
                <p className="text-[14px] leading-6 text-[var(--on-surface-variant)]">{k.what}</p>
                {ref ? <KnowMore refId={ref} /> : null}
              </div>
              <div className={cn("grid gap-1 rounded-2xl bg-[#f1edfd] px-4 py-3 text-[13.5px] leading-6 text-[#3b2a7a]", show(li, at.why))}>
                <span className={cn(kicker, "text-[9.5px] text-[#6d48d8]")}>Why here</span>
                {k.use ? <span>Good for {lc(k.use)}</span> : null}
                {s ? <span>The {s.actor} uses it to {lc(s.title)}{s.out ? <> → feeds the <b>{s.out}</b></> : null}.</span> : null}
              </div>
              {k.structure && at.shape !== undefined ? (
                <div className={cn("grid gap-1.5 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]", show(li, at.shape))}>
                  <span className={cn(kicker, "text-[9.5px] text-black/45")}>How it works{k.structure.kind ? ` · ${k.structure.kind}` : ""}</span>
                  <div className="text-[13px]"><StructureView s={k.structure as Structure} /></div>
                </div>
              ) : null}
            </div>
            <div className="contents">
              {how.length ? (
                <div className="grid gap-2">
                  <span className={cn(kicker, "text-[#6d48d8]", show(li, at.how))}>How to do it</span>
                  <ol className="grid gap-2">
                    {how.map((h, i) => (
                      <li key={i} className={cn("flex items-start gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/[0.06]", show(li, at.how + i), li === at.how + i && "ring-2 ring-[#6d48d8]")}>
                        <span className={cn("flex size-7 flex-none items-center justify-center rounded-full font-mono text-[12px] font-bold transition-colors", li > at.how + i ? "bg-[#6d48d8] text-white" : "bg-[#f1edfd] text-[#6d48d8]")}>{li > at.how + i ? "✓" : i + 1}</span>
                        <span className="pt-0.5 text-[14px] leading-6 text-[var(--primary)]">{h}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {says.length ? <ul className="grid gap-1.5">{says.map((x, i) => <li key={i} className={cn("rounded-xl border-l-[3px] border-[#6d48d8] bg-white px-3 py-2 text-[13.5px] font-semibold text-[var(--primary)]", show(li, at.says + i))}>{x}</li>)}</ul> : null}
              {k.applies && at.applies !== undefined ? <p className={cn("rounded-xl bg-white px-3 py-2 text-[13px] text-[var(--on-surface-variant)] ring-1 ring-black/[0.06]", show(li, at.applies))}><b className="text-[var(--primary)]">Applies:</b> {k.applies}</p> : null}
              {pit.length && at.pit !== undefined ? (
                <div className={cn("grid gap-1 rounded-2xl bg-[#fdecf2] px-4 py-3", show(li, at.pit))}>
                  <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#8a0f3f]"><MaterialSymbol className="text-[16px]" name="warning" />Watch out</span>
                  <ul className="grid gap-0.5">{pit.map((x) => <li key={x} className="text-[13px] leading-5 text-[#5c0a2a]">{x}</li>)}</ul>
                </div>
              ) : null}
              <div className={cn("flex items-start gap-2 rounded-2xl border border-dashed border-[var(--bridge-teal)]/40 bg-white px-4 py-3 text-[13px] text-[var(--primary)]", show(li, at.try))}>
                <MaterialSymbol className="mt-px text-[18px] text-[var(--bridge-teal)]" name={s?.ask ? "smart_toy" : "edit_note"} />
                <span>{s?.ask ? <><b>Try it with your agent:</b> <i>“{s.ask}”</i></> : <>You’ll use it for real in the <b>Do it</b> step.</>}</span>
              </div>
            </div>
          </div>
        ),
      };
    }

    function draftFrame(tt: Template, s: Step, w: Lesson["workflows"][number], at0?: { wi: number; node: number }): Frame {
      const parts = draftParts(tt);
      const fmt = String((tt.tpl as { fmt?: string } | null)?.fmt ?? "doc");
      const lines: Line[] = [
        { say: <>Now let’s draft the <B>{templateTitle(tt)}</B> — {lc(first(tt.what))}</>, who: s.actor },
        { say: <>Why it exists: {lc(tt.purpose || tt.what)}{tt.owner ? <> It’s owned by the <B>{tt.owner}</B>{tt.users.length ? <> and used by {tt.users.join(", ")}</> : null}.</> : null}</> },
        ...parts.map((x, i) => ({ say: <>{i === 0 ? `Part by part. ` : ""}<B>{x.name}</B>{x.hint ? <> — {lc(x.hint.replace(/[.\s]+$/, ""))}</> : null}{x.example ? <>. For example: <i>{x.example}</i></> : "."}</>, who: s.actor })),
      ];
      const goodAt = lines.length;
      if (tt.good.length) lines.push({ say: <>Good looks like: {tt.good.map((g, i) => <span key={i}>{i ? "; " : ""}<B>{lc(g)}</B></span>)}.</> });
      const lastAt = lines.length;
      lines.push({ say: <>Draft it with your agent{s.ask ? <> — <i>“{s.ask}”</i></> : null} — then check it against those points before it moves on in {w.title}.</>, who: "Your turn" });
      const icon = ({ doc: "article", form: "edit_note", sheet: "table", message: "mail", canvas: "dashboard", pack: "folder_open" } as Record<string, string>)[fmt] ?? "description";
      return {
        id: `draft-${tt.id}`, chapter: "workflow", title: `Draft · ${templateTitle(tt).replace(/\s*[—-]\s*…\s*$/, "")}`, icon: "edit_document", map: at0 ? { wi: at0.wi, zoom: () => at0.node, sel: () => ({ k: "n", i: at0.node }) } : undefined, fields: ["artifacts.outputs", "artifacts.evidence"],
        lines,
        render: (li) => (
          <div className="grid w-full max-w-7xl items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.7fr)]">
            {/* the document in its real format — whole at first, then taught part by part */}
            <div className={cn("grid content-start gap-2", show(li, 0))}>
              <span className={cn(kicker, "flex items-center gap-1.5 text-[9.5px] text-[var(--bridge-teal)]")}><MaterialSymbol className="text-[15px]" name={icon} />{fmt}{fmt === "canvas" ? ` · ${String((tt.tpl as { structure?: { kind?: string } } | null)?.structure?.kind ?? "")}` : ""} · {tt.type}{li >= 2 && li - 2 < parts.length ? ` · part ${li - 1} of ${parts.length}` : ""}</span>
              <LiveTemplate t={tt} on={li >= 2 && li - 2 < parts.length ? li - 2 : -1} upto={li < 2 ? parts.length : Math.min(parts.length, li - 1)} />
            </div>
            {/* why it exists, who owns it, what good looks like */}
            <div className="grid content-start gap-3">
              <div className={cn("grid gap-2 rounded-2xl bg-[var(--deep-indigo)] p-4 text-white", show(li, 1))}>
                <span className={cn(kicker, "text-[9.5px] text-[#4fd1c5]")}>Why it exists</span>
                <p className="text-[13.5px] leading-6 text-white/85">{tt.purpose || tt.what}</p>
                {tt.owner ? <span className="flex items-center gap-1.5 text-[12.5px] text-white/70"><MaterialSymbol className="text-[16px]" name="person" />Owner: <b className="text-white">{tt.owner}</b></span> : null}
                {tt.users.length ? <span className="flex items-center gap-1.5 text-[12.5px] text-white/70"><MaterialSymbol className="text-[16px]" name="groups" />Used by: {tt.users.join(", ")}</span> : null}
              </div>
              {tt.good.length ? (
                <div className={cn("grid gap-1.5 rounded-2xl bg-[#e6f3f3] p-4", show(li, goodAt))}>
                  <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#005a5a]"><MaterialSymbol className="text-[17px]" name="verified" />Good looks like</span>
                  <ul className="grid gap-1">{tt.good.map((g) => <li key={g} className="flex gap-2 text-[13px] leading-5 text-[#003f3f]"><MaterialSymbol className="mt-px text-[15px]" name="check" />{g}</li>)}</ul>
                </div>
              ) : null}
              <div className={cn("flex items-start gap-2 rounded-2xl border border-dashed border-[var(--electric-pink)]/40 bg-white px-4 py-3 text-[13px] text-[var(--primary)]", show(li, lastAt))}>
                <MaterialSymbol className="mt-px text-[18px] text-[var(--electric-pink)]" name="smart_toy" />
                <span><b>Draft it with your agent</b>{s.ask ? <>: <i>“{s.ask}”</i></> : null}, then check it against “good looks like”.</span>
              </div>
              <TemplateOpen id={tt.id} />
            </div>
          </div>
        ),
      };
    }

    /* 5 · what if */
    const cases = [
      { k: "happyPath", label: "Happy path", icon: "sentiment_satisfied", c: "#008080", v: K.happyPath },
      { k: "alternates", label: "Alternates", icon: "alt_route", c: "#0284c7", v: K.alternates },
      { k: "edgeCases", label: "Edge cases", icon: "border_style", c: "#8b5cf6", v: K.edgeCases },
      { k: "exceptions", label: "Exceptions", icon: "report", c: "#c49000", v: K.exceptions },
      { k: "failures", label: "Failures", icon: "error", c: "#e91e63", v: K.failures },
    ].filter((x) => list(x.v).length);
    if (cases.length) {
      frames.push({
        id: "whatif", chapter: "whatif", title: "What else can happen — the whole subprocess", icon: "call_split", fields: cases.map((x) => `cases.${x.k}`),
        lines: [{ say: <>Stepping back to the whole subprocess: the contract names what else can happen — so it’s handled, not improvised.</> }, ...cases.map((x) => ({ say: <><B>{x.label}</B>: {lc(list(x.v).join("; "))}.</> }))],
        map: { wi: 0, relevant: ["alternate", "rework", "escalate", "stop"] },
        render: (li) => (
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {cases.map((x, i) => (
              <div key={x.k} className={cn("grid content-start gap-1.5 rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]", show(li, i + 1))} style={{ boxShadow: `inset 0 3px 0 ${x.c}` }}>
                <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: x.c }}><MaterialSymbol className="text-[17px]" name={x.icon} />{x.label}</span>
                <ul className="grid gap-1 text-[12.5px] leading-5 text-[var(--primary)]">{list(x.v).map((v) => <li key={v}>{v}</li>)}</ul>
              </div>
            ))}
          </div>
        ),
      });
    }

    /* required lenses that never looked in along the way: they sign off at the gate */
    const gateL = lesson.workflows.flatMap((w) => w.gateLenses ?? []);
    const gateNode0 = (lesson.workflows[0]?.steps.length ?? 0) + 1;
    gateL.forEach((u) => { const l = lensById(u.id); if (l && !met.has(l.id)) { met.add(l.id); frames.push(lensFrame(l.name, l, reqIds.has(l.id), { where: "the gate", note: u.note, wi: 0, node: gateNode0 })); } });
    [...reqIds].forEach((id) => { const l = lensById(id); if (l && !met.has(id)) { met.add(id); frames.push(lensFrame(l.name, l, true, { where: "the gate", note: list(l.decisions)[0] ?? "", wi: 0, node: gateNode0 })); } });

    /* 6 · the gate */
    const crit = [...list(CT.criteria), ...list(CT.checks)].slice(0, 6);
    const gateNode = (lesson.workflows[0]?.steps.length ?? 0) + 1;
    frames.push({
      id: "gate", chapter: "gate", title: `The gate · ${lesson.gate || "done"}`, icon: "verified", fields: ["controls.criteria", "controls.checks", "artifacts.evidence", "definition.exit"],
      lines: [
        { say: <>Before the work moves on, the <B>{lesson.gate || "gate"}</B> checks it against the criteria.</> },
        ...crit.map((x) => ({ say: <>✓ {x}</> })),
        ...gateL.map((u) => ({ say: <>The <B>{lensById(u.id)?.name ?? u.id}</B> lens checks: <i>“{u.note}”</i></>, who: lensById(u.id)?.name })),
        ...(list(A.evidence).length ? [{ say: <>The proof: <B>{list(A.evidence).join(", ")}</B>.</> }] : []),
        { say: <>All true? Then the exit conditions hold — {lc(list(D.exit).join("; "))}. The gate passes.</> },
      ],
      map: { wi: 0, zoom: () => gateNode, sel: () => ({ k: "n", i: gateNode }) },
      render: (li) => (
        <div className="grid w-full max-w-4xl items-start gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <ul className="grid gap-2">
            {crit.map((x, i) => <li key={x} className={cn("flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-[14px] text-[var(--primary)] ring-1 ring-black/[0.06]", show(li, i + 1))}><MaterialSymbol className={cn("text-[20px] transition-colors duration-500", li > i + 1 ? "text-[var(--bridge-teal)]" : "text-black/25")} name="check_circle" />{x}</li>)}
            {list(A.evidence).length ? <li className={cn("flex items-center gap-2.5 rounded-xl bg-[#f6f7f8] px-3.5 py-2.5 text-[13px] text-[var(--on-surface-variant)]", show(li, crit.length + gateL.length + 1))}><MaterialSymbol className="text-[18px]" name="attach_file" />Evidence: {list(A.evidence).join(", ")}</li> : null}
          </ul>
          <div className={cn("grid place-items-center gap-2 rounded-2xl border-[3px] border-[var(--bridge-teal)] p-5 text-center text-[var(--bridge-teal)]", show(li, lineCount(crit, A) + gateL.length - 1), li >= lineCount(crit, A) + gateL.length - 1 && "rotate-[-4deg]")}>
            <MaterialSymbol className="text-[36px]" name="verified" />
            <b className="font-heading text-[22px] font-black uppercase">Passed</b>
            <span className="text-[12px] font-semibold">{lesson.gate}</span>
          </div>
        </div>
      ),
    });

    /* 7 · routes out of the gate */
    const routes = ([["forward", R.forward], ["alternate", R.alternate], ["rework", R.rework], ["escalate", R.escalation], ["stop", R.stop]] as [string, unknown][]).filter(([, v]) => v);
    frames.push({
      id: "routes", chapter: "routes", title: "The routes out of the gate", icon: "alt_route", fields: routes.map(([k]) => `routing.${k === "escalate" ? "escalation" : k}`),
      lines: [{ say: <>From the gate, the work goes one of {routes.length} ways — each planned in advance, so going back, up or nowhere is a decision, not a failure.</> }, ...routes.map(([k, v]) => ({ say: <><B>{model.routes[k]?.label ?? k}</B>: {String(v)}.</> }))],
      map: { wi: 0, sel: (li) => (li >= 1 && routes[li - 1] ? { k: "b", key: routes[li - 1][0] } : null) },
      render: (li) => (
        <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {routes.map(([k, v], i) => { const r = model.routes[k]; return (
            <div key={k} className={cn("grid content-start gap-1 rounded-2xl p-3.5 ring-1", show(li, i + 1), li === i + 1 ? "text-white ring-transparent" : "bg-white ring-black/[0.06]")} style={li === i + 1 ? { background: r?.c } : { boxShadow: `inset 0 3px 0 ${r?.c}` }}>
              <span className="flex items-center gap-1.5 text-[13px] font-bold" style={li === i + 1 ? undefined : { color: r?.c }}><MaterialSymbol className="text-[17px]" name={r?.icon ?? "route"} />{r?.label ?? k}</span>
              <p className={cn("text-[12.5px] leading-5", li === i + 1 ? "text-white/90" : "text-[var(--primary)]")}>{String(v)}</p>
            </div>
          ); })}
        </div>
      ),
    });

    /* 8 · the shelf: what was produced, and what's handed on */
    const made = [...new Set(lesson.workflows.flatMap((w) => w.steps.filter((s) => s.out).map((s) => s.template ?? "")))].map((id) => tpl(id)).filter((x): x is Template => !!x);
    const cont = ([["handoff", "Handed on", "east"], ["traceability", "Traced by", "link"], ["measures", "Measured by", "monitoring"], ["learning", "Learned", "school"]] as const).filter(([k]) => list(CO[k]).length);
    frames.push({
      id: "shelf", chapter: "handoff", title: "What’s handed on", icon: "east", fields: ["artifacts.outputs", "continuity.handoff", "continuity.traceability"],
      lines: [
        { say: <>Along the way, the workflow produced <B>{made.length} document{made.length === 1 ? "" : "s"}</B>{made.length ? <> — {made.map((t) => templateTitle(t)).join(", ")}</> : null}.</> },
        ...cont.map(([k, label]) => ({ say: <><B>{label}</B>: {list(CO[k]).join("; ")}.</> })),
        { say: <>That’s {lesson.code} {lesson.title}. Next: the overview and the details — then you do it yourself.</> },
      ],
      render: (li) => (
        <div className="grid w-full gap-4">
          {made.length ? <div className={cn("grid gap-3", made.length > 1 ? "md:grid-cols-2 xl:grid-cols-3" : "max-w-xl")}>{made.map((t, i) => <div key={t.id} className={show(li, 0)} style={{ transitionDelay: `${i * 90}ms` }}><Paper t={t} small /></div>)}</div> : null}
          {cont.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{cont.map(([k, label, icon], i) => <div key={k} className={cn("grid content-start gap-1 rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06]", show(li, i + 1))}><span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--bridge-teal)]"><MaterialSymbol className="text-[16px]" name={icon} />{label}</span><p className="text-[12.5px] leading-5 text-[var(--primary)]">{list(CO[k]).join("; ")}</p></div>)}</div> : null}
        </div>
      ),
    });
    let cur: string | undefined;
    for (const f of frames) {
      if (/^wf-\d+-/.test(f.id) && !f.id.startsWith("wf-cases")) cur = f.id;
      else if (!(f.chapter === "workflow" && /^(whatif-|lens-|know-|draft-)/.test(f.id))) cur = undefined;
      f.group = cur;
    }
    return frames;
  }, [lesson, process, model, lookups]);
}
const lineCount = (crit: string[], A: Record<string, unknown>) => 1 + crit.length + (list(A.evidence).length ? 1 : 0) + 1;

/* ---------- the board ---------- */
export function LearnBoard({ lesson, process, model, onClose, onStory }: { lesson: Lesson; process: DayProcess | null; model: ModelMeta; onClose: (finished: boolean) => void; onStory?: () => void }) {
  const frames = useFrames(lesson, process, model);
  const [fi, setFi] = useState(0);
  const [li, setLi] = useState(0);
  const [playing, setPlaying] = useState(false);
  const fr = frames[fi];
  const total = frames.reduce((n, f) => n + f.lines.length, 0);
  const done = frames.slice(0, fi).reduce((n, f) => n + f.lines.length, 0) + li + 1;
  const chapterAt = BOARD_CHAPTERS.findIndex((c) => c.id === fr.chapter);
  const line = fr.lines[li];

  const next = () => {
    if (li < fr.lines.length - 1) setLi(li + 1);
    else if (fi < frames.length - 1) { setFi(fi + 1); setLi(0); }
    else { setPlaying(false); onClose(true); }
  };
  const prev = () => {
    if (li > 0) setLi(li - 1);
    else if (fi > 0) { setFi(fi - 1); setLi(frames[fi - 1].lines.length - 1); }
  };
  const jump = (f: number) => { setFi(f); setLi(0); };

  /* keys: → / space next, ← back, Esc close */
  const nav = useRef({ next, prev });
  const menuOpen = useRef(false);
  const setMenuClosed = useRef(() => {});
  useEffect(() => { nav.current = { next, prev }; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); if (menuOpen.current) setMenuClosed.current(); else onClose(false); }
      else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); e.stopPropagation(); nav.current.next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); nav.current.prev(); }
    };
    window.addEventListener("keydown", onKey, true);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey, true); document.documentElement.style.overflow = prevOverflow; };
  }, [onClose]);
  /* play: the narration advances on its own, a little longer for longer lines */
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => nav.current.next(), 3200 + Math.min(5000, String(lineText(line?.say)).length * 38));
    return () => clearTimeout(t);
  }, [playing, fi, li, line]);

  /* keep what the narration just brought on screen in view */
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stage.current?.querySelector(`.lb-l${li}`);
    if (el) setTimeout(() => el.scrollIntoView({ block: "nearest", behavior: "smooth" }), 120);
  }, [fi, li]);

  const content = fr.render(li);
  /* the step being taught, and everything taught for it, in order */
  const groupFrames = fr.group ? frames.map((f, i) => ({ f, i })).filter((x) => x.f.group === fr.group) : [];
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const away = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", away);
    menuRef.current?.querySelector("[aria-current=true]")?.scrollIntoView({ block: "center" });
    return () => document.removeEventListener("mousedown", away);
  }, [menu]);
  const pip = !!fr.map?.zoom; // a zoomed map sits in the corner; a whole-workflow map stays across the top
  useEffect(() => { menuOpen.current = menu; setMenuClosed.current = () => setMenu(false); });
  return createPortal(
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#f4f3ef] [animation:lb-in_.3s_ease-out]" role="dialog" aria-modal="true" aria-label={`Learn ${lesson.title}`} style={{ backgroundImage: "radial-gradient(rgba(13,17,23,.08) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <style>{`@keyframes lb-in { from { opacity: 0; transform: scale(.985); } } @keyframes lb-line { from { opacity: 0; transform: translateY(6px); } }`}</style>
      {/* top: the lesson, the chapters, close */}
      <header className="flex flex-none items-center gap-3 px-4 py-3 sm:px-6">
        <span className="grid min-w-0 leading-tight">
          <span className={cn(kicker, "text-[9.5px] text-[var(--bridge-teal)]")}>Learn · {lesson.code}</span>
          <b className="truncate text-[14px] text-[var(--primary)]">{lesson.title}</b>
        </span>
        <nav className="mx-auto hidden items-center gap-0.5 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-black/[0.05] md:flex" aria-label="Chapters">
          {BOARD_CHAPTERS.map((c, ci) => {
            const f = frames.findIndex((x) => x.chapter === c.id);
            if (f < 0) return null;
            return (
              <button key={c.id} type="button" onClick={() => jump(f)} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors", ci === chapterAt ? "bg-[var(--deep-indigo)] text-white" : ci < chapterAt ? "text-[var(--bridge-teal)]" : "text-black/45 hover:text-[var(--primary)]")}>
                <MaterialSymbol className="text-[14px]" name={ci < chapterAt ? "check_circle" : c.icon} /><span className={ci === chapterAt ? "" : "hidden lg:inline"}>{c.label}</span>
              </button>
            );
          })}
        </nav>
        <span className="ml-auto flex items-center gap-1.5 md:ml-0">
          {/* the same lesson, played out as an episode of the story */}
          {onStory ? <button type="button" onClick={onStory} title="Watch this lesson as a story" className="flex items-center gap-1 rounded-full bg-[var(--deep-indigo)] px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition-transform hover:-translate-y-px"><MaterialSymbol className="text-[16px] text-[#4fd1c5]" name="movie" /><span className="hidden sm:inline">Watch the story</span><span className="sm:hidden">Story</span></button> : null}
          <button type="button" onClick={() => onClose(false)} className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-black/60 shadow-sm ring-1 ring-black/[0.06] hover:text-[var(--primary)]"><MaterialSymbol className="text-[16px]" name="close" />Close</button>
        </span>
      </header>

      {/* the board */}
      <main className={cn("relative grid min-h-0 flex-1 gap-3 px-4 pb-3 sm:px-8", fr.map && !pip && content ? "grid-rows-[minmax(180px,42%)_minmax(0,1fr)]" : "grid-rows-[minmax(0,1fr)]")}>
        {fr.map && !pip ? (
          <div className="min-h-0 overflow-hidden rounded-3xl bg-white/70 p-2 shadow-[0_18px_50px_-30px_rgba(13,17,23,.35)] ring-1 ring-black/[0.05]">
            <ZoomMap lesson={lesson} model={model} cue={fr.map} li={li} />
          </div>
        ) : null}
        <div ref={stage} key={fr.id} className={cn("min-h-0 overflow-y-auto [animation:lb-in_.35s_ease-out]", !content && "hidden")}>
          <div className={cn("flex min-h-full justify-center py-2", fr.map && !pip ? "items-start" : "items-center", pip && "md:pb-[260px] xl:pb-6 xl:pr-[440px]", groupFrames.length > 1 && "lg:pl-[250px]")}>{content}</div>
        </div>
        {/* this step: what's been taught, what's being taught, what's about to come */}
        {groupFrames.length > 1 ? (
          <nav aria-label="This step" className="absolute left-4 top-2 z-10 hidden w-[230px] gap-1 rounded-2xl bg-white/90 p-3 shadow-[0_18px_40px_-24px_rgba(13,17,23,.4)] ring-1 ring-black/[0.06] backdrop-blur sm:left-8 lg:grid">
            <span className={cn(kicker, "px-1 text-[9px] text-black/45")}>This step</span>
            {groupFrames.map(({ f, i }, k) => {
              const now = i === fi, past = i < fi;
              return (
                <button key={f.id} type="button" onClick={() => jump(i)} className={cn("flex items-start gap-2 rounded-xl px-2 py-1.5 text-left text-[12.5px] leading-snug transition-colors", now ? "bg-[var(--deep-indigo)] text-white" : past ? "text-black/45 hover:bg-black/[0.04]" : "text-[var(--primary)] hover:bg-black/[0.04]")}>
                  <MaterialSymbol className={cn("mt-px text-[16px]", now ? "text-[#4fd1c5]" : past ? "text-[var(--bridge-teal)]" : "text-black/35")} name={past ? "check_circle" : f.icon ?? "circle"} />
                  <span className="grid min-w-0"><span className="truncate font-bold">{k === 0 ? "The step" : f.title}</span>{!past && !now && i === fi + 1 ? <span className="text-[10.5px] font-semibold text-[var(--electric-pink)]">up next</span> : null}</span>
                </button>
              );
            })}
          </nav>
        ) : null}
        {/* zoomed in: the map keeps you oriented from the corner */}
        {fr.map && pip ? (
          <div className="pointer-events-none absolute bottom-3 right-4 z-10 hidden h-[230px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-20px_rgba(13,17,23,.45)] ring-1 ring-black/10 [animation:lb-in_.3s_ease-out] sm:right-8 md:flex xl:h-[260px] xl:w-[420px]">
            <span className={cn(kicker, "flex flex-none items-center gap-1 border-b border-black/[0.06] px-3 py-1.5 text-[9px] text-black/45")}><MaterialSymbol className="text-[13px]" name="zoom_in" />Where we are · {lesson.workflows[fr.map.wi]?.title}</span>
            <div className="min-h-0 flex-1"><ZoomMap lesson={lesson} model={model} cue={fr.map} li={li} k={1.25} /></div>
          </div>
        ) : null}
      </main>

      {/* the narration */}
      <footer className="flex-none bg-[var(--deep-indigo)] px-4 pb-4 pt-3 text-white sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-3">
          <div key={`${fi}-${li}`} className="grid min-h-[56px] content-center gap-1 [animation:lb-line_.3s_ease-out]">
            <span className={cn(kicker, "text-[9.5px] text-[#4fd1c5]")}>{line?.who ?? "Narrator"}</span>
            <p className="text-[clamp(15px,1.5vw,18px)] leading-snug text-white/85">{line?.say}</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={prev} disabled={fi === 0 && li === 0} className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30" aria-label="Back"><MaterialSymbol className="text-[20px]" name="arrow_back" /></button>
            <div ref={menuRef} className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition-colors", menu ? "bg-white text-[var(--deep-indigo)]" : "bg-white/10 hover:bg-white/20")}>
                <MaterialSymbol className="text-[18px]" name="format_list_bulleted" /><span className="hidden sm:inline">Contents</span><MaterialSymbol className={cn("text-[16px] transition-transform", menu && "rotate-180")} name="expand_less" />
              </button>
              {menu ? (
                <div className="absolute bottom-[calc(100%+10px)] left-0 z-30 grid max-h-[min(70vh,560px)] w-[min(92vw,380px)] gap-0.5 overflow-y-auto rounded-2xl bg-white p-2 text-[var(--primary)] shadow-[0_24px_60px_-20px_rgba(0,0,0,.6)] [animation:lb-line_.18s_ease-out]">
                  {BOARD_CHAPTERS.map((c) => {
                    const list2 = frames.map((f, i) => ({ f, i })).filter((x) => x.f.chapter === c.id);
                    if (!list2.length) return null;
                    return (
                      <div key={c.id} className="grid gap-0.5 pb-1">
                        <span className={cn(kicker, "flex items-center gap-1 px-2 pb-0.5 pt-2 text-[9px] text-black/40")}><MaterialSymbol className="text-[13px]" name={c.icon} />{c.label}</span>
                        {list2.map(({ f, i }) => {
                          const nested = !!f.group && f.group !== f.id;
                          return (
                            <button key={f.id} type="button" aria-current={i === fi} onClick={() => { jump(i); setMenu(false); }} className={cn("flex items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-[12.5px] transition-colors", nested ? "pl-8" : "pl-2 font-semibold", i === fi ? "bg-[var(--deep-indigo)] text-white" : i < fi ? "text-black/45 hover:bg-black/[0.04]" : "hover:bg-black/[0.04]")}>
                              <MaterialSymbol className={cn("text-[15px]", i === fi ? "text-[#4fd1c5]" : i < fi ? "text-[var(--bridge-teal)]" : "text-black/35")} name={i < fi ? "check_circle" : f.icon ?? "circle"} />
                              <span className="min-w-0 truncate">{f.title ?? f.id}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <button type="button" onClick={() => setPlaying((p) => !p)} className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={playing ? "Pause" : "Play"}><MaterialSymbol className="text-[20px]" name={playing ? "pause" : "play_arrow"} /></button>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[var(--electric-pink)] transition-[width] duration-300" style={{ width: `${(done / total) * 100}%` }} /></div>
            {fr.fields?.length ? <span className="hidden items-center gap-1 lg:flex">{fr.fields.slice(0, 3).map((f) => <span key={f} title={FIELD_GUIDE[f]?.what} className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white/60">{f.replace(".", " › ")}</span>)}</span> : null}
            <button type="button" onClick={next} className="flex items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-4 py-2 text-[12.5px] font-bold text-white shadow-lg shadow-pink-500/25 hover:brightness-110">
              {fi === frames.length - 1 && li === fr.lines.length - 1 ? "Finish" : "Next"}<MaterialSymbol className="text-[18px]" name="arrow_forward" />
            </button>
          </div>
          <span className="hidden text-center text-[11px] text-white/40 sm:block">→ or space for the next line · ← back · Esc to close</span>
        </div>
      </footer>
    </div>,
    document.body,
  );
}

/* the plain text of a narration line (for timing) */
function lineText(n: ReactNode): string {
  if (n === null || n === undefined || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(lineText).join("");
  if (typeof n === "object" && "props" in n) return lineText((n as { props: { children?: ReactNode } }).props.children);
  return "";
}
