"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Contract, DayProcess, Lesson, LensEntry, ModelMeta, Step, Template } from "@/lib/program";
import { cn } from "@/lib/utils";

import { LiveTemplate, draftParts } from "./live-template";
import { kicker, useDetail } from "./program-ui";
import { templateTitle } from "./template-view";

import { PROJECT } from "./overlay-meta";

/* Story mode — the subprocess played out as an episode of a season: a real project (the book's own "Order intake" case),
 * a cast (the delivery team, the client, an AI agent), and a script generated from the lesson. Each step is a scene: who is
 * where, which tool is open, what they say, the agent drafting, the document filling in part by part, the lenses pushing
 * back, a challenge that really happens (the "what if") and how it's handled — then the decision, the gate, the handoff. */

/* ---------- the project and the cast ---------- */
export { PROJECT };
type Char = { id: string; name: string; role: string; side: "team" | "client" | "ai"; color: string };
const CAST: Char[] = [
  { id: "sara", name: "Sara Malik", role: "Discovery lead", side: "team", color: "#d81b60" },
  { id: "maya", name: "Maya Chen", role: "Product manager", side: "team", color: "#6d48d8" },
  { id: "jonas", name: "Jonas Weber", role: "UX researcher", side: "team", color: "#0284c7" },
  { id: "omar", name: "Omar Haddad", role: "Business analyst", side: "team", color: "#007373" },
  { id: "lina", name: "Lina Park", role: "Architect", side: "team", color: "#c2410c" },
  { id: "ravi", name: "Ravi Kumar", role: "Tech lead", side: "team", color: "#4f46e5" },
  { id: "leila", name: "Leila Farouk", role: "Market analyst", side: "team", color: "#0f766e" },
  { id: "ben", name: "Ben Carter", role: "Product ops", side: "team", color: "#64748b" },
  { id: "hana", name: "Hana Sato", role: "Data analyst", side: "team", color: "#0891b2" },
  { id: "victor", name: "Victor Adeyemi", role: "Peer reviewer", side: "team", color: "#57534e" },
  { id: "daniel", name: "Daniel Reyes", role: "COO · Sponsor", side: "client", color: "#a16207" },
  { id: "priya", name: "Priya Nair", role: "Portfolio owner", side: "client", color: "#9333ea" },
  { id: "grace", name: "Grace Liu", role: "Finance partner", side: "client", color: "#15803d" },
  { id: "tom", name: "Tom Becker", role: "Risk & compliance", side: "client", color: "#b91c1c" },
  { id: "ana", name: "Ana Costa", role: "Order-clerk lead", side: "client", color: "#be185d" },
  { id: "marco", name: "Marco Rossi", role: "Head of Sales", side: "client", color: "#78716c" },
  { id: "agent", name: "Node agent", role: "AI agent", side: "ai", color: "#4fd1c5" },
];
const byId = Object.fromEntries(CAST.map((c) => [c.id, c]));
const ROLE_MAP: [RegExp, string][] = [
  [/discovery lead/i, "sara"], [/product (manager|trio|leadership)/i, "maya"], [/ux|designer|research/i, "jonas"], [/business analyst/i, "omar"],
  [/architect/i, "lina"], [/engineer|tech lead/i, "ravi"], [/market/i, "leila"], [/product ops|note-taker|ops\b/i, "ben"], [/data/i, "hana"],
  [/review/i, "victor"], [/sponsor|leadership|coo|executive/i, "daniel"], [/portfolio|strategy|pmo|department/i, "priya"], [/financ|procure/i, "grace"],
  [/risk|legal|complian|privacy|security|governance/i, "tom"], [/requester|clerk|domain|operations|customer|user/i, "ana"],
];
export const charFor = (role: string): Char => byId[ROLE_MAP.find(([re]) => re.test(role))?.[1] ?? "sara"];

/* ---------- the script ---------- */
type Beat = { k: "act" | "say" | "agent" | "type" | "challenge" | "aside" | "check" | "decide"; who?: string; text: ReactNode; fill?: number; on?: number; route?: string; tick?: boolean };
type Scene = {
  id: string; kind: "title" | "cast" | "step" | "gate" | "end"; title: string; place: string; cast: string[]; beats: Beat[];
  t?: Template | null; tool?: { name: string; icon: string }; step?: { i: number; n: number; decision: boolean; question?: string }; wi?: number;
};

const list = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : []);
const sec = (c: Contract | null, id: string) => ((c ?? {})[id] ?? {}) as Record<string, unknown>;
const lc = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const first = (s: string) => String(s || "").split(/(?<=[.!?])\s/)[0];
const fillCase = (s: string) => s.replace(/\{initiative\}/gi, PROJECT.initiative).replace(/\{[^}]*\}/g, "…");
const TOOLS: Record<string, { name: string; icon: string }> = {
  sheet: { name: "Spreadsheet", icon: "table_view" }, doc: { name: "Docs", icon: "article" }, form: { name: "Intake form", icon: "edit_note" },
  canvas: { name: "Whiteboard", icon: "dashboard" }, message: { name: "Email", icon: "mail" }, pack: { name: "Shared drive", icon: "folder_open" },
};
const B = ({ children }: { children: ReactNode }) => <b className="font-bold">{children}</b>;
/* how the step's owner answers a lens — varied, so it doesn't read like a form letter */
const REPLIES = [
  (out: string) => (out ? <>Fair — I’ll make sure the {out} answers that before it goes anywhere.</> : <>Good question — I’ll check that before we move on.</>),
  (out: string) => <>Agreed. I’ll add it{out ? <> to the {out}</> : null} and flag it for the gate.</>,
  () => <>Noted — I’ll get you the evidence for that.</>,
];

function useScript(lesson: Lesson, process: DayProcess | null, model: ModelMeta): Scene[] {
  const { lookups } = useDetail();
  return useMemo(() => {
    const c = lesson.contract, D = sec(c, "definition"), CT = sec(c, "controls"), EX = sec(c, "execution"), CO = sec(c, "continuity");
    const sibs = process?.lessons ?? [];
    const at = sibs.findIndex((l) => l.fid === lesson.fid);
    const prev = at > 0 ? sibs[at - 1] : null, next = at >= 0 && at < sibs.length - 1 ? sibs[at + 1] : null;
    const authority = charFor(String(EX.authority ?? "Portfolio owner"));
    /* who an escalation goes to: whoever the path names ("Two declines → portfolio owner"), else the authority */
    const escalateTo = (label: string) => { const to = label.split("→")[1]?.trim(); return to && ROLE_MAP.some(([re]) => re.test(to)) ? charFor(to) : authority; };
    const scenes: Scene[] = [];
    const castOf = new Set<string>();

    /* title */
    scenes.push({
      id: "title", kind: "title", title: `Episode ${lesson.code}`, place: PROJECT.client, cast: [],
      beats: [
        { k: "act", text: <>{PROJECT.client}, {PROJECT.what}. {PROJECT.premise}</> },
        { k: "act", text: prev ? <>Previously: the team finished <B>{prev.title}</B>.</> : <>The opportunity has just landed on the team’s desk.</> },
        { k: "act", text: <>This episode — <B>{lesson.title}</B>. {String(D.purpose ?? lesson.summary ?? "")}</> },
      ],
    });

    /* each step becomes a scene */
    const stepScenes: Scene[] = [];
    lesson.workflows.forEach((w, wi) => {
      const wc = (w.contract ?? {}) as Record<string, unknown>;
      w.steps.forEach((s, i) => stepScenes.push(stepScene(w, wi, s, i, wc)));
    });

    /* the lenses push back — each through a different person where the book allows it */
    function lensBeats(s: Step, actor: Char, out: string): Beat[] {
      const used = new Set<string>([actor.id]);
      return (s.lenses ?? []).slice(0, 2).flatMap((u, k) => {
        const l: LensEntry | undefined = lookups.lenses[u.id];
        if (!l) return [];
        const who = list(l.holder).map(charFor).find((c) => !used.has(c.id)) ?? charFor(list(l.holder)[0] ?? l.name);
        used.add(who.id);
        castOf.add(who.id);
        return [
          { k: "say" as const, who: who.id, text: <><span className="opacity-60">({l.name} lens)</span> {u.note}</> },
          { k: "say" as const, who: actor.id, text: REPLIES[k % REPLIES.length](out) },
        ];
      });
    }

    function stepScene(w: Lesson["workflows"][number], wi: number, s: Step, i: number, wc: Record<string, unknown>): Scene {
      const actor = charFor(s.actor);
      castOf.add(actor.id);
      const t = s.template ? lookups.templates[s.template] ?? null : null;
      const fmt = String((t?.tpl as { fmt?: string } | null)?.fmt ?? "");
      const tool = t ? TOOLS[fmt] : undefined;
      const parts = t ? draftParts(t) : [];
      const loops = w.loops.filter(([f]) => f === s.id);
      const dest = (to: string) => (to === "authority" ? authority.name : to === "stop" ? "the parking lot" : w.steps.find((x) => x.id === to)?.title ?? to);
      const prevActor = i > 0 ? charFor(w.steps[i - 1].actor) : actor;
      const teammate = CAST.find((x) => x.side === "team" && x.id !== actor.id && (x.id === "omar" || x.id === "maya")) ?? byId.omar;
      const client = actor.side === "client";
      const place = s.decision ? `Meeting room · ${PROJECT.client}` : client ? `${PROJECT.client} office` : "Node team room";
      const beats: Beat[] = [];
      const out = s.out ?? "";

      if (s.decision) {
        castOf.add(prevActor.id);
        const question = list(wc.decisions)[0] ?? s.title;
        beats.push({ k: "act", text: <>{place}. {prevActor.name} has the {lc(w.steps[i - 1]?.out || "case")} on screen; {actor.name} listens.</> });
        beats.push({ k: "say", who: prevActor.id, text: <>So the question for you is simple: <B>{question}</B></> });
        /* the challenge happens: the first non-happy answer, played out */
        const real = loops.find(([, , ty]) => ty === "rework" || ty === "escalate");
        const extra: string[] = [];
        if (real) {
          const [, to, ty, n] = real, trigger = n.split("→")[0].trim();
          if (ty === "rework" && /declin/i.test(trigger)) {
            /* the first candidate turns it down; the team goes back, and comes to the right person */
            castOf.add("marco"); extra.push("marco");
            beats.push({ k: "act", text: <>First attempt: {byId.marco.name}, {byId.marco.role}.</> });
            beats.push({ k: "say", who: "marco", text: <>Honestly? Not right now — sales season is on and I can’t own this.</> });
            beats.push({ k: "challenge", route: ty, text: <><B>Challenge — {trigger}.</B> The rework path: back to <B>{dest(to)}</B>.</> });
            beats.push({ k: "act", text: <>{prevActor.name} goes back to {lc(dest(to))}. The one who really owns order-handling cost? {actor.name}.</> });
            beats.push({ k: "say", who: prevActor.id, text: <>{actor.name.split(" ")[0]} — same question. <B>{question}</B></> });
          } else if (ty === "rework") {
            beats.push({ k: "say", who: actor.id, text: <>Not yet — {lc(trigger)}. Fix that and come back to me.</> });
            beats.push({ k: "challenge", route: ty, text: <><B>Challenge — {trigger}.</B> The rework path: back to <B>{dest(to)}</B>.</> });
            beats.push({ k: "act", text: <>{prevActor.name} goes back to {lc(dest(to))}, sorts it out, and returns.</> });
          } else {
            const up = escalateTo(n);
            castOf.add(up.id); extra.push(up.id);
            beats.push({ k: "challenge", route: ty, text: <><B>Challenge — {trigger}.</B> This one goes up to {up.name}.</> });
            beats.push({ k: "say", who: up.id, text: <>Leave it with me — I’ll make the call so the team isn’t stuck.</> });
          }
        }
        beats.push({ k: "say", who: actor.id, text: <>Yes. I’m in — let’s do it.</> });
        beats.push({ k: "decide", route: "forward", text: <><B>Decision: yes</B> → {w.steps[i + 1]?.title ?? "the gate"}.</> });
        loops.filter((x) => x !== real).forEach(([, to, ty, n]) => beats.push({ k: "aside", route: ty, text: <>What if — <B>{n}</B>? That’s the {model.routes[ty]?.label.toLowerCase() ?? ty} path{to === "stop" ? " — the work would be parked, with the reason logged" : <> — to {ty === "escalate" ? escalateTo(n).name : dest(to)}</>}.</> }));
        return { id: `s-${wi}-${s.id}`, kind: "step", title: s.title, place, cast: [prevActor.id, ...extra, actor.id], beats, t: null, step: { i, n: w.steps.length, decision: true, question }, wi };
      }

      beats.push({ k: "act", text: <>{place}. {actor.name} {tool ? <>opens the {tool.name.toLowerCase()}{t ? <> — <i>{fillCase(templateTitle(t))}</i></> : null}</> : <>pulls the right people into a quick call</>}.</> });
      beats.push({ k: "say", who: actor.id, text: <>Next up: {lc(s.title)}.{out ? <> By the end we need the <B>{out}</B>.</> : null}</> });
      s.uses.slice(0, 2).forEach((u, k) => {
        const kn = u.ref ? lookups.knowledge[u.ref] : null;
        beats.push({ k: "say", who: k === 0 ? actor.id : teammate.id, text: <>{k === 0 ? "I’ll use" : "Let’s also bring in"} <B>{u.name}</B>{kn?.how?.[0] ? <> — {lc(kn.how[0])}</> : kn?.what ? <> — {lc(first(kn.what))}</> : null}.</> });
        if (k === 1) castOf.add(teammate.id);
      });
      if (s.ask) {
        castOf.add("agent");
        beats.push({ k: "say", who: actor.id, text: <><span className="font-bold text-[#007373]">@Node agent</span> {s.ask}</> });
        beats.push({ k: "agent", who: "agent", text: <>On it. {out ? <>Here’s a first draft of the {out}{t ? <> — {lc(first(t.what)).replace(/[.\s]+$/, "")}</> : null}</> : "Here’s what I found"}. Review it before it goes anywhere — you decide.</> });
      }
      /* the document fills in, part by part */
      parts.slice(0, 9).forEach((p, k) => /^Each (row|lane)$/.test(p.name) ? null : beats.push({ k: "type", who: s.ask && k % 2 === 0 ? "agent" : actor.id, fill: k + 1, on: k, text: <><B>{p.name}</B>{p.example ? <> — {fillCase(p.example)}</> : p.hint ? <> — <span className="opacity-70">{lc(p.hint)}</span></> : null}</> }));
      beats.push(...lensBeats(s, actor, out));
      /* a challenge really happens — the "what if" — and how the team handles it */
      const real = loops[0];
      if (real) {
        const [, to, ty, n] = real, trigger = n.split("→")[0].trim();
        beats.push({ k: "challenge", route: ty, text: <><B>Challenge — {trigger}.</B> {ty === "stop" ? <>If it can’t be solved, the work stops here.</> : ty === "escalate" ? <>It’s above the team’s pay grade.</> : <>Something has to be redone.</>}</> });
        if (ty === "rework") beats.push({ k: "say", who: actor.id, text: <>Okay — back to {lc(dest(to))}. Better now than at the gate.</> });
        else if (ty === "escalate") { const up = escalateTo(n); castOf.add(up.id); beats.push({ k: "say", who: actor.id, text: <>Let’s take it to {up.name}.</> }, { k: "say", who: up.id, text: <>Thanks for raising it early. I’ll decide — keep going.</> }); }
        else if (ty === "stop") beats.push({ k: "say", who: actor.id, text: <>Not this time — {PROJECT.client} has what we need. But if it hadn’t, we’d park it and log why.</> });
        else beats.push({ k: "say", who: actor.id, text: <>Then we take the other route — {lc(dest(to))}.</> });
      }
      loops.slice(1).forEach(([, to, ty, n]) => beats.push({ k: "aside", route: ty, text: <>What if — <B>{n}</B>? The {model.routes[ty]?.label.toLowerCase() ?? ty} path{to === "stop" ? " — parked, with the reason logged" : <> — to {ty === "escalate" ? escalateTo(n).name : dest(to)}</>}.</> }));
      if (out) beats.push({ k: "check", who: actor.id, fill: parts.length, on: -1, text: <><B>{out}</B> saved{tool ? <> to the {tool.name.toLowerCase()}</> : null} — and linked to the request.</> });
      return { id: `s-${wi}-${s.id}`, kind: "step", title: s.title, place, cast: [actor.id, ...(s.ask ? ["agent"] : []), ...((s.lenses ?? []).slice(0, 2).map((u) => (lookups.lenses[u.id] ? charFor(list(lookups.lenses[u.id].holder)[0] ?? lookups.lenses[u.id].name).id : "")).filter(Boolean))], beats, t, tool, step: { i, n: w.steps.length, decision: false }, wi };
    }

    /* the cast for this episode (after we know who appears) */
    castOf.add(authority.id);
    const cast = [...castOf].filter((id) => byId[id]);
    scenes.push({
      id: "cast", kind: "cast", title: "The cast", place: PROJECT.client, cast,
      beats: cast.map((id) => {
        const ch = byId[id];
        return { k: "say", who: id, text: ch.side === "ai" ? <>I’m the team’s agent. I draft, search and check — people decide.</> : ch.side === "client" ? <>I’m {ch.name.split(" ")[0]}, {ch.role} at {PROJECT.client}.</> : <>I’m {ch.name.split(" ")[0]}, {ch.role} on the Node team.</> } as Beat;
      }),
    });
    scenes.push(...stepScenes);

    /* the gate */
    const crit = [...list(CT.criteria), ...list(CT.checks)].slice(0, 5);
    scenes.push({
      id: "gate", kind: "gate", title: `Gate · ${lesson.gate || "Review"}`, place: `Review · ${PROJECT.client}`, cast: [authority.id, charFor(lesson.workflows[0]?.steps[0]?.actor ?? "Discovery lead").id],
      beats: [
        { k: "act", text: <>The gate review: <B>{lesson.gate || "the gate"}</B>. {authority.name} runs it.</> },
        { k: "say", who: authority.id, text: <>Let’s check it against the criteria — one at a time.</> },
        ...crit.map((x) => ({ k: "check" as const, tick: true, who: authority.id, text: <>{x}</> })),
        { k: "say", who: authority.id, text: <>All there. <B>Passed.</B> Hand it on.</> },
        { k: "decide", route: "forward", text: <>{String(CO.handoff ?? (next ? `→ ${next.title}` : "Process complete"))}</> },
      ],
    });
    scenes.push({
      id: "end", kind: "end", title: next ? "Next episode" : "End of the process", place: PROJECT.client, cast: [],
      beats: [{ k: "act", text: next ? <>Next episode: <B>{next.code} {next.title}</B>.</> : <>That’s the end of <B>{process?.title}</B>.</> }, { k: "act", text: <>Now it’s your turn — the lesson’s steps, then <B>Do it</B> on your own project.</> }],
    });
    return scenes;
  }, [lesson, process, model, lookups]);
}

/* ---------- pieces ---------- */
function Avatar({ c, size = 36, on }: { c: Char; size?: number; on?: boolean }) {
  return (
    <span className={cn("relative flex flex-none items-center justify-center rounded-full font-black text-white transition-all duration-300", on && "scale-110 ring-[3px] ring-white shadow-[0_0_0_6px_rgba(255,255,255,.15)]")} style={{ width: size, height: size, background: c.color, fontSize: size * 0.36 }} title={`${c.name} — ${c.role}`}>
      {c.side === "ai" ? <MaterialSymbol className="text-[0.95em]" name="auto_awesome" /> : c.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
    </span>
  );
}
const ROUTE_C: Record<string, string> = { forward: "#008080", alternate: "#0284c7", rework: "#ff5722", escalate: "#c49000", stop: "#e91e63" };

function BeatView({ b, now }: { b: Beat; now: boolean }) {
  const c = b.who ? byId[b.who] : null;
  if (b.k === "act") return <p className={cn("px-2 text-center text-[13px] italic leading-6 text-white/60", now && "text-white/85")}>{b.text}</p>;
  if (b.k === "challenge" || b.k === "aside" || b.k === "decide") {
    const col = ROUTE_C[b.route ?? "rework"] ?? "#ff5722";
    return (
      <div className={cn("flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[13px] leading-5", b.k === "aside" ? "bg-white/[0.04] text-white/70" : "text-white")} style={b.k === "aside" ? { boxShadow: `inset 2px 0 0 ${col}` } : { background: `color-mix(in srgb, ${col} 28%, #0d1117)`, boxShadow: `inset 0 0 0 1px ${col}` }}>
        <MaterialSymbol className="mt-px text-[18px]" style={{ color: col }} name={b.k === "decide" ? "check_circle" : b.k === "aside" ? "help" : "bolt"} />
        <span>{b.text}</span>
      </div>
    );
  }
  if (b.k === "check" || b.k === "type") {
    return (
      <div className="flex items-start gap-2 px-2 text-[12.5px] leading-5 text-white/75">
        <MaterialSymbol className={cn("mt-px text-[16px]", b.k === "check" ? "text-[#4fd1c5]" : "text-white/40")} name={b.k === "check" ? "task_alt" : "edit"} />
        <span>{c ? <span className="font-bold" style={{ color: c.side === "ai" ? "#4fd1c5" : undefined }}>{c.side === "ai" ? "Agent" : c.name.split(" ")[0]} </span> : null}{b.k === "type" ? (c?.side === "ai" ? "drafts " : "fills ") : ""}{b.text}</span>
      </div>
    );
  }
  if (!c) return null;
  const ai = c.side === "ai";
  return (
    <div className="flex items-start gap-2.5">
      <Avatar c={c} size={32} />
      <div className="grid min-w-0 gap-0.5">
        <span className="text-[11px] font-bold text-white/55"><span className="text-white/90">{c.name}</span> · {c.role}</span>
        <p className={cn("rounded-2xl rounded-tl-md px-3 py-2 text-[13.5px] leading-6", ai ? "bg-[#4fd1c5]/15 text-[#d7fffb] ring-1 ring-[#4fd1c5]/30" : c.side === "client" ? "bg-white/[0.08] text-white" : "bg-white text-[#0d1117]")}>{b.text}</p>
      </div>
    </div>
  );
}

/* ---------- the player ---------- */
export function StoryMode({ lesson, process, model, onClose }: { lesson: Lesson; process: DayProcess | null; model: ModelMeta; onClose: (finished: boolean) => void }) {
  const scenes = useScript(lesson, process, model);
  const [si, setSi] = useState(0);
  const [bi, setBi] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [menu, setMenu] = useState(false);
  const sc = scenes[si], beat = sc.beats[bi];
  const total = scenes.reduce((n, s) => n + s.beats.length, 0);
  const done = scenes.slice(0, si).reduce((n, s) => n + s.beats.length, 0) + bi + 1;
  const shown = sc.beats.slice(0, bi + 1);
  const lastFill = [...shown].reverse().find((b) => b.fill !== undefined);
  const fill = lastFill?.fill ?? 0, on = lastFill && lastFill === beat ? lastFill.on ?? -1 : -1;
  const speaker = beat?.who;
  const ticks = shown.filter((b) => b.tick).length;

  const next = () => { if (bi < sc.beats.length - 1) setBi(bi + 1); else if (si < scenes.length - 1) { setSi(si + 1); setBi(0); } else { setPlaying(false); onClose(true); } };
  const prev = () => { if (bi > 0) setBi(bi - 1); else if (si > 0) { setSi(si - 1); setBi(scenes[si - 1].beats.length - 1); } };
  const nav = useRef({ next, prev });
  useEffect(() => { nav.current = { next, prev }; });
  const menuOpen = useRef(false);
  useEffect(() => { menuOpen.current = menu; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); if (menuOpen.current) setMenu(false); else onClose(false); }
      else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); e.stopPropagation(); nav.current.next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); nav.current.prev(); }
    };
    window.addEventListener("keydown", onKey, true);
    const o = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey, true); document.documentElement.style.overflow = o; };
  }, [onClose]);
  useEffect(() => {
    if (!playing) return;
    const len = beat?.k === "type" ? 900 : 2600;
    const t = setTimeout(() => nav.current.next(), len + Math.min(4000, JSON.stringify(beat?.text ?? "").length * 6));
    return () => clearTimeout(t);
  }, [playing, si, bi, beat]);
  const thread = useRef<HTMLDivElement>(null);
  useEffect(() => { thread.current?.lastElementChild?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [si, bi]);

  /* the set: what we see on stage for this scene */
  let set: ReactNode;
  if (sc.kind === "title") {
    set = (
      <div className="grid h-full place-items-center p-6 text-center">
        <div className="grid max-w-2xl gap-4 [animation:st-in_.6s_ease-out]">
          <span className={cn(kicker, "text-[#4fd1c5]")}>Story mode · Season · Discover</span>
          <span className="font-mono text-[clamp(2rem,5vw,3.5rem)] font-black text-[var(--electric-pink)]">{lesson.code}</span>
          <h2 className="font-heading text-[clamp(1.8rem,4vw,3rem)] font-black uppercase leading-none tracking-[-0.04em] text-white">{lesson.title}</h2>
          <p className="text-[15px] leading-7 text-white/70"><b className="text-white">{PROJECT.client}</b> · {PROJECT.initiative}</p>
        </div>
      </div>
    );
  } else if (sc.kind === "cast") {
    set = (
      <div className="grid h-full content-center gap-4 p-6">
        <span className={cn(kicker, "text-center text-[#4fd1c5]")}>In this episode</span>
        <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
          {sc.cast.map((id, k) => { const c = byId[id]; return (
            <div key={id} className={cn("flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10 transition-all duration-500", k <= bi ? "opacity-100" : "translate-y-2 opacity-0", speaker === id && "bg-white/[0.12] ring-white/30")}>
              <Avatar c={c} size={44} on={speaker === id} />
              <span className="grid min-w-0 leading-tight"><b className="truncate text-[14px] text-white">{c.name}</b><span className="truncate text-[12px] text-white/55">{c.role}</span><span className={cn("mt-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]", c.side === "client" ? "text-[#e0b84a]" : c.side === "ai" ? "text-[#4fd1c5]" : "text-[#ff8fb3]")}>{c.side === "client" ? PROJECT.client : c.side === "ai" ? "AI" : "Node team"}</span></span>
            </div>
          ); })}
        </div>
      </div>
    );
  } else if (sc.kind === "gate") {
    const crit = sc.beats.filter((b) => b.tick);
    set = (
      <div className="grid h-full place-items-center p-6">
        <div className="grid w-full max-w-xl gap-3 rounded-3xl bg-white p-6 text-[var(--primary)] shadow-2xl">
          <span className={cn(kicker, "flex items-center gap-1.5 text-[var(--bridge-teal)]")}><MaterialSymbol className="text-[16px]" name="verified" />{sc.title}</span>
          <ul className="grid gap-2">{crit.map((b, k) => <li key={k} className="flex items-center gap-2.5 text-[14px]"><MaterialSymbol className={cn("text-[22px] transition-colors duration-500", k < ticks ? "text-[var(--bridge-teal)]" : "text-black/20")} name={k < ticks ? "check_circle" : "radio_button_unchecked"} />{b.text}</li>)}</ul>
          <div className={cn("justify-self-end rounded-xl border-[3px] border-[var(--bridge-teal)] px-4 py-1.5 font-heading text-[20px] font-black uppercase text-[var(--bridge-teal)] transition-all duration-500", bi >= sc.beats.length - 2 ? "rotate-[-6deg] opacity-100" : "scale-150 opacity-0")}>Passed</div>
        </div>
      </div>
    );
  } else if (sc.kind === "end") {
    set = <div className="grid h-full place-items-center p-6 text-center"><div className="grid gap-3 [animation:st-in_.6s_ease-out]"><MaterialSymbol className="text-[44px] text-[#4fd1c5]" name="movie" /><b className="font-heading text-[clamp(1.6rem,3.5vw,2.6rem)] font-black uppercase tracking-[-0.03em] text-white">{sc.title}</b></div></div>;
  } else {
    /* a step: the tool window with the document filling in — or the meeting room */
    const people = [...new Set(sc.cast)].map((id) => byId[id]).filter(Boolean);
    set = (
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="grid leading-tight"><span className={cn(kicker, "text-[9.5px] text-[#4fd1c5]")}>Scene · step {(sc.step?.i ?? 0) + 1} of {sc.step?.n}</span><b className="text-[16px] text-white">{sc.title}</b><span className="text-[11.5px] text-white/50"><MaterialSymbol className="mr-1 align-[-3px] text-[14px]" name="location_on" />{sc.place}</span></span>
          <span className="flex -space-x-1.5">{people.map((c) => <Avatar key={c.id} c={c} size={34} on={speaker === c.id} />)}</span>
        </div>
        {sc.t ? (
          <div className="min-h-0 overflow-auto rounded-2xl bg-[#e9eaec] p-1 shadow-2xl">
            <div className="flex items-center gap-2 rounded-t-xl bg-[#d7d9dc] px-3 py-1.5 text-[11.5px] font-semibold text-black/60">
              <span className="flex gap-1">{["#ff5f57", "#febc2e", "#28c840"].map((x) => <i key={x} className="size-2.5 rounded-full" style={{ background: x }} />)}</span>
              <MaterialSymbol className="text-[15px]" name={sc.tool?.icon ?? "description"} />{sc.tool?.name} — {fillCase(templateTitle(sc.t))}
              {beat?.k === "type" ? <span className="ml-auto flex items-center gap-1 text-[var(--electric-pink)]"><MaterialSymbol className="text-[14px]" name="edit" />{byId[beat.who ?? ""]?.name.split(" ")[0]} is typing…</span> : null}
            </div>
            <div className="bg-white p-3"><LiveTemplate t={sc.t} on={on} upto={fill} /></div>
          </div>
        ) : (
          <div className="grid min-h-0 place-items-center rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
            <div className="grid justify-items-center gap-5">
              {sc.step?.decision ? <div className="flex size-28 rotate-45 items-center justify-center rounded-2xl bg-[#fff7ed] shadow-xl ring-4 ring-[#c2410c]/40"><span className="-rotate-45 px-2 text-center text-[12px] font-bold leading-tight text-[#9a3412]">{sc.step.question}</span></div> : <MaterialSymbol className="text-[48px] text-white/30" name="groups" />}
              <div className="flex flex-wrap justify-center gap-4">{people.map((c) => <span key={c.id} className="grid justify-items-center gap-1.5"><Avatar c={c} size={56} on={speaker === c.id} /><span className="text-[11.5px] font-semibold text-white/70">{c.name.split(" ")[0]}</span></span>)}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#0b0e13] text-white [animation:st-in_.35s_ease-out]" role="dialog" aria-modal="true" aria-label={`Story · ${lesson.title}`}>
      <style>{`@keyframes st-in { from { opacity: 0; transform: scale(.985); } } @keyframes st-beat { from { opacity: 0; transform: translateY(8px); } }`}</style>
      <header className="flex flex-none items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-6">
        <MaterialSymbol className="text-[22px] text-[var(--electric-pink)]" name="movie" />
        <span className="grid min-w-0 leading-tight"><span className={cn(kicker, "text-[9.5px] text-[#4fd1c5]")}>Story mode · {PROJECT.client} · {PROJECT.initiative}</span><b className="truncate text-[14px]">{lesson.code} {lesson.title}</b></span>
        <span className="ml-auto hidden text-[12px] text-white/45 sm:block">Scene {si + 1} of {scenes.length} · {sc.title}</span>
        <button type="button" onClick={() => onClose(false)} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-bold hover:bg-white/20"><MaterialSymbol className="text-[16px]" name="close" />Close</button>
      </header>

      <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]">
        <section key={sc.id} className="min-h-0 overflow-hidden [animation:st-in_.45s_ease-out]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>{set}</section>
        <aside className="flex min-h-0 flex-col border-t border-white/[0.06] bg-[#11151c] lg:border-l lg:border-t-0">
          <span className={cn(kicker, "flex-none px-4 pb-1 pt-3 text-[9.5px] text-white/40")}>Script · {sc.title}</span>
          <div ref={thread} className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto px-4 pb-4 pt-1">
            {shown.map((b, k) => <div key={`${sc.id}-${k}`} className={cn("[animation:st-beat_.35s_ease-out]", k < shown.length - 1 && "opacity-70")}><BeatView b={b} now={k === shown.length - 1} /></div>)}
          </div>
        </aside>
      </main>

      <footer className="flex flex-none items-center gap-3 border-t border-white/[0.06] px-4 py-3 sm:px-6">
        <button type="button" onClick={() => nav.current.prev()} disabled={si === 0 && bi === 0} className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30" aria-label="Back"><MaterialSymbol className="text-[20px]" name="arrow_back" /></button>
        <div className="relative">
          <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold", menu ? "bg-white text-[#0b0e13]" : "bg-white/10 hover:bg-white/20")}><MaterialSymbol className="text-[18px]" name="theaters" /><span className="hidden sm:inline">Scenes</span></button>
          {menu ? (
            <div className="absolute bottom-[calc(100%+10px)] left-0 z-30 grid max-h-[60vh] w-[min(92vw,340px)] gap-0.5 overflow-y-auto rounded-2xl bg-white p-2 text-[var(--primary)] shadow-2xl">
              {scenes.map((x, k) => (
                <button key={x.id} type="button" onClick={() => { setSi(k); setBi(0); setMenu(false); }} className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px]", k === si ? "bg-[var(--deep-indigo)] text-white" : k < si ? "text-black/45 hover:bg-black/[0.04]" : "hover:bg-black/[0.04]")}>
                  <span className="w-6 font-mono text-[10px] opacity-60">{k + 1}</span>
                  <MaterialSymbol className="text-[15px]" name={x.kind === "step" ? (x.step?.decision ? "help" : x.t ? (x.tool?.icon ?? "description") : "groups") : x.kind === "gate" ? "verified" : x.kind === "cast" ? "groups" : "movie"} />
                  <span className="min-w-0 truncate font-semibold">{x.title}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button type="button" onClick={() => setPlaying((p) => !p)} className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={playing ? "Pause" : "Play"}><MaterialSymbol className="text-[20px]" name={playing ? "pause" : "play_arrow"} /></button>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[var(--electric-pink)] transition-[width] duration-300" style={{ width: `${(done / total) * 100}%` }} /></div>
        <button type="button" onClick={() => nav.current.next()} className="flex items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-4 py-2 text-[12.5px] font-bold text-white shadow-lg shadow-pink-500/25 hover:brightness-110">{si === scenes.length - 1 && bi === sc.beats.length - 1 ? "Finish" : "Next"}<MaterialSymbol className="text-[18px]" name="arrow_forward" /></button>
      </footer>
    </div>,
    document.body,
  );
}
