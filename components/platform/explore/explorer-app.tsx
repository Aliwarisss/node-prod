"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import { domains, leadsTo, LEVELS, locate, roleById, roleFolders, rolesWithSkill, rolesWithSubject, skillById, subjectById } from "@/lib/explore";
import { coverageFor } from "@/lib/explore/programs";
import { closestRoles, HOURS_PER_WEEK, roleRoadmap, type Status, type Step } from "@/lib/explore/roadmap";
import { cn } from "@/lib/utils";

import { Mono } from "../skill-mono";
import { MyMapProvider, Ring, StatusPicker, useMyMap } from "./my-map";

const STAGE_COLOR = { 1: "#007373", 2: "#6d48d8", 3: "#e91e63" } as const;
const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";

/* Explorer, as an app in the dashboard: it asks your goal, then draws the way there — a roadmap like roadmap.sh, built
   from Explore's roles, subjects and skills. Every step can be marked known / learning / want, and it's saved. */
export function ExplorerApp() {
  return <MyMapProvider><App /></MyMapProvider>;
}

function App() {
  const map = useMyMap();
  const [picking, setPicking] = useState(false);
  if (!map?.ready) return <div className="h-[70vh] animate-pulse rounded-[26px] bg-black/[0.04]" />;
  const role = map.target ? roleById.get(map.target) : undefined;
  if (!role || picking) return <GoalPicker current={role?.id} onPick={(id) => { map.setTarget(id); setPicking(false); }} onCancel={role ? () => setPicking(false) : undefined} />;
  return <RoadmapScreen roleId={role.id} onChangeGoal={() => setPicking(true)} />;
}

/* ---------------- 1 · the goal ---------------- */
function GoalPicker({ current, onPick, onCancel }: { current?: string; onPick: (id: string) => void; onCancel?: () => void }) {
  const map = useMyMap();
  const [q, setQ] = useState("");
  const [field, setField] = useState("");
  const closest = map ? closestRoles(map.items, 3) : [];
  const dom = domains.find((d) => d.id === field);
  const match = (r: { id: string; name: string; line: string }) => (!q || `${r.name} ${r.line}`.toLowerCase().includes(q.toLowerCase())) && (!dom || dom.roles.includes(r.id));
  const folders = roleFolders.map((f) => ({ ...f, roles: f.roles.filter(match) })).filter((f) => f.roles.length);
  return (
    <div className="grid gap-6">
      <section className="relative grid gap-5 overflow-hidden rounded-[26px] bg-[#0b0e14] p-6 text-white sm:p-9" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
        <span className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-[#6d48d8] opacity-30 blur-[100px]" />
        <span className="pointer-events-none absolute -bottom-32 right-0 size-80 rounded-full bg-[var(--electric-pink)] opacity-20 blur-[100px]" />
        <span className={cn(kicker, "relative flex items-center gap-2 text-[#4fd1c5]")}><MaterialSymbol className="text-[16px]" name="travel_explore" />Explorer · your roadmap</span>
        <h1 className="relative max-w-3xl font-heading text-[30px] font-black leading-[1.05] tracking-[-0.03em] sm:text-[44px]">What do you want to become?</h1>
        <p className="relative max-w-2xl text-[15px] leading-7 text-white/65">Pick the role you’re aiming for. Explorer draws the way there — every subject and skill in the order to learn them, how long each takes, and where Node teaches it. You can change it any time.</p>
        <label className="relative flex max-w-xl items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 focus-within:border-[#4fd1c5]">
          <MaterialSymbol className="text-[22px] text-white/45" name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles — e.g. back-end, data, product…" className="h-13 w-full bg-transparent py-3.5 text-[15px] text-white outline-none placeholder:text-white/35" autoFocus />
        </label>
        <div className="relative flex flex-wrap gap-1.5">
          <span className="pr-1 text-[12px] text-white/45">or by field:</span>
          {domains.map((d) => (
            <button key={d.id} type="button" onClick={() => setField(field === d.id ? "" : d.id)} className={cn("flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors", field === d.id ? "border-white bg-white text-[#0d1117]" : "border-white/15 text-white/70 hover:border-white/40")}>
              <MaterialSymbol className="text-[15px]" name={d.icon} />{d.name}
            </button>
          ))}
        </div>
        {onCancel ? <button type="button" onClick={onCancel} className="relative w-fit text-[13px] font-semibold text-white/55 hover:text-white">← Back to my roadmap</button> : null}
      </section>

      {closest.length && !q && !field ? (
        <section className="grid gap-3">
          <span className={cn(kicker, "text-black/45")}>Closest to what you already know</span>
          <div className="grid gap-3 md:grid-cols-3">
            {closest.map(({ role, pct }) => <RoleCard key={role.id} id={role.id} current={current} onPick={onPick} extra={<span className="rounded-full bg-[#e6f3f3] px-2 py-0.5 text-[11px] font-bold text-[#005a5a]">{pct}% there</span>} />)}
          </div>
        </section>
      ) : null}

      {folders.map((f) => (
        <section key={f.id} className="grid gap-3">
          <span className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg text-white" style={{ background: f.color }}><MaterialSymbol className="text-[16px]" name={f.icon} /></span><b className="text-[15px] text-[var(--primary)]">{f.name}</b><span className="text-[12.5px] text-black/45">{f.line}</span></span>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{f.roles.map((r) => <RoleCard key={r.id} id={r.id} current={current} onPick={onPick} />)}</div>
        </section>
      ))}
      {!folders.length ? <p className="rounded-2xl bg-white p-6 text-center text-[14px] text-black/55">No roles match — try another word or field.</p> : null}
    </div>
  );
}

function RoleCard({ id, current, onPick, extra }: { id: string; current?: string; onPick: (id: string) => void; extra?: ReactNode }) {
  const r = roleById.get(id)!;
  const plan = roleRoadmap(id);
  const color = locate("role", id)?.folder.color ?? "#6d48d8";
  const on = current === id;
  return (
    <button type="button" onClick={() => onPick(id)} className={cn("group grid gap-2 rounded-[20px] border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(13,17,23,.45)]", on ? "border-[var(--bridge-teal)] shadow-[0_0_0_1px_var(--bridge-teal)]" : "border-black/[0.06]")}>
      <span className="flex items-start justify-between gap-2">
        <b className="text-[15px] leading-tight text-[var(--primary)]">{r.name}</b>
        {on ? <span className="flex items-center gap-1 rounded-full bg-[#e6f3f3] px-2 py-0.5 text-[11px] font-bold text-[#005a5a]"><MaterialSymbol className="text-[14px]" filled name="flag" />Your goal</span> : extra}
      </span>
      <span className="text-[12.5px] leading-5 text-black/55">{r.line}</span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11.5px] font-semibold text-black/45">
        {plan ? <><span>{plan.steps.length} steps</span><span>~{plan.months} months</span></> : null}
        <span style={{ color }}>{r.fresher ? "Open to freshers" : "Experienced role"}</span>
        <MaterialSymbol className="ml-auto text-[18px] text-black/25 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" name="arrow_forward" />
      </span>
    </button>
  );
}

/* ---------------- 2 · the roadmap ---------------- */
type Opened = { kind: "subject" | "skill"; id: string; step?: Step; topic?: string } | null;
type Plan = NonNullable<ReturnType<typeof roleRoadmap>>;
type Filter = "all" | "todo" | "done";
const HOURS = [5, 10, 15, 20] as const;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function RoadmapScreen({ roleId, onChangeGoal }: { roleId: string; onChangeGoal: () => void }) {
  const map = useMyMap()!;
  const { pushToast } = useToast();
  const role = roleById.get(roleId)!;
  const plan = roleRoadmap(roleId)!;
  const [pick, setPick] = useState<Opened>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [topics, setTopics] = useState(true);
  const [q, setQ] = useState("");
  const [zoom, setZoom] = useState(1);
  const [full, setFull] = useState(false);
  const [hours, setHours] = useState<number>(HOURS_PER_WEEK);
  const [copied, setCopied] = useState(false);
  const [now] = useState(() => Date.now());
  const scroller = useRef<HTMLDivElement>(null);

  const status = (kind: string, id: string, items = map.items) => items[`${kind}:${id}`] as Status | undefined;
  const stepStatus = (st: Step, items = map.items): Status | undefined => {
    const all = (st.options ?? [st.id]).map((o) => status(st.kind, o, items));
    return all.includes("know") ? "know" : all.includes("learning") ? "learning" : all.includes("want") ? "want" : undefined;
  };
  const done = plan.steps.filter((s) => stepStatus(s) === "know").length;
  const learning = plan.steps.filter((s) => stepStatus(s) === "learning").length;
  const here = plan.steps.find((s) => stepStatus(s) !== "know");
  const weeksLeft = plan.steps.filter((s) => stepStatus(s) !== "know").reduce((w, s) => w + s.weeks, 0) * (HOURS_PER_WEEK / hours);
  const finish = new Date(now + weeksLeft * WEEK_MS);

  /* search: a step matches by its name, its topics or its options */
  const needle = q.trim().toLowerCase();
  const matches = (st: Step) => !needle || [st.name, ...(st.kind === "subject" ? subjectById.get(st.id)?.topics ?? [] : []), ...(st.options ?? []).map((o) => skillById.get(o)?.name ?? o)].some((x) => x.toLowerCase().includes(needle));
  const hits = needle ? plan.steps.filter(matches).length : 0;
  const dim = (st: Step) => (needle && !matches(st)) || (filter === "todo" && stepStatus(st) === "know") || (filter === "done" && stepStatus(st) !== "know");

  /* marking: from the drawer or straight on the map — and a word when a stage is finished */
  const mark = (kind: string, id: string, s: Status | null, step?: Step) => {
    const key = `${kind}:${id}`;
    const next = { ...map.items };
    if (s) next[key] = s; else delete next[key];
    const stage = step ? plan.stages.find((x) => x.steps.some((y) => y.n === step.n)) : undefined;
    const wasDone = stage?.steps.every((y) => stepStatus(y) === "know");
    map.setStatus(key, s);
    if (stage && !wasDone && stage.steps.every((y) => stepStatus(y, next) === "know")) pushToast({ variant: "success", title: `Stage ${stage.level} · ${stage.name} complete`, description: stage.level < plan.stages.length ? "On to the next stage." : `You’ve covered the whole road to ${role.name}.` });
    else if (s === "know" && step && plan.steps.every((y) => y.n === step.n || stepStatus(y) === "know")) pushToast({ variant: "success", title: "Road complete", description: `Every step to ${role.name} is marked known.` });
  };
  const open = (st: Step) => setPick({ kind: st.kind, id: st.options ? (st.options.find((o) => status("skill", o) === "know") ?? st.options[0]) : st.id, step: st });

  /* zoom, fit and jumping to a stage */
  const { rows, stages, height } = layout(plan, topics);
  const fit = () => { const w = scroller.current?.clientWidth ?? W; setZoom(Math.max(0.5, Math.min(1.2, Math.floor(((w - 24) / W) * 100) / 100))); };
  const jump = (y: number) => scroller.current?.scrollTo({ top: Math.max(0, y * zoom - 16), behavior: "smooth" });
  const share = () => void navigator.clipboard.writeText(`${window.location.origin}/explore/roadmap/${roleId}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (pick) setPick(null); else setFull(false); }
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (typing || pick) return;
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)));
      if (e.key === "-") setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pick]);

  /* drag the canvas to move around */
  const drag = useRef<{ x: number; y: number; l: number; t: number } | null>(null);
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, input") || !scroller.current) return;
    drag.current = { x: e.clientX, y: e.clientY, l: scroller.current.scrollLeft, t: scroller.current.scrollTop };
    scroller.current.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current, el = scroller.current;
    if (!d || !el) return;
    el.scrollLeft = d.l - (e.clientX - d.x);
    el.scrollTop = d.t - (e.clientY - d.y);
  };
  const onUp = () => { drag.current = null; };

  const seg = (on: boolean) => cn("rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-colors", on ? "bg-[var(--deep-indigo)] text-white" : "text-black/55 hover:bg-black/[0.05] hover:text-[var(--primary)]");
  const iconBtn = "flex size-8 items-center justify-center rounded-lg text-black/55 transition-colors hover:bg-black/[0.06] hover:text-[var(--primary)] disabled:opacity-30";
  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] bg-white/95 px-3 py-2.5 backdrop-blur">
      <label className="flex min-w-[220px] flex-1 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-2.5 focus-within:border-[var(--bridge-teal)] sm:max-w-[300px]">
        <MaterialSymbol className="text-[18px] text-black/35" name="search" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find on the map — e.g. SQL, caching" className="w-full bg-transparent py-1.5 text-[13px] outline-none" />
        {needle ? <span className="flex-none rounded-full bg-black/[0.05] px-1.5 text-[11px] font-bold text-black/50">{hits}</span> : null}
        {q ? <button type="button" onClick={() => setQ("")} className="text-black/40 hover:text-black" aria-label="Clear"><MaterialSymbol className="text-[16px]" name="close" /></button> : null}
      </label>
      <span className="flex rounded-xl bg-[#f1f2f3] p-0.5" role="radiogroup" aria-label="Show">
        {([["all", "All"], ["todo", "To do"], ["done", "Done"]] as const).map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={filter === k} onClick={() => setFilter(k)} className={seg(filter === k)}>{l}</button>)}
      </span>
      <button type="button" onClick={() => setTopics((v) => !v)} aria-pressed={topics} className={cn("flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[12px] font-bold", topics ? "border-[#0d1117] bg-[#fff6c2]" : "border-black/10 text-black/55")}><MaterialSymbol className="text-[16px]" name={topics ? "visibility" : "visibility_off"} />Topics</button>
      <span className="hidden items-center gap-1 lg:flex">
        {stages.map((s) => <button key={s.level} type="button" onClick={() => jump(s.y)} className="rounded-full px-2.5 py-1 text-[11.5px] font-bold text-white" style={{ background: STAGE_COLOR[s.level] }} title={`Jump to ${s.name}`}>{s.level} · {s.name}</button>)}
      </span>
      <span className="ml-auto flex items-center gap-0.5 rounded-xl border border-black/10 bg-white px-1">
        <button type="button" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className={iconBtn} disabled={zoom <= 0.5} aria-label="Zoom out" title="Zoom out (−)"><MaterialSymbol className="text-[18px]" name="remove" /></button>
        <button type="button" onClick={() => setZoom(1)} className="w-11 text-center font-mono text-[11.5px] font-bold text-black/55" title="Reset zoom">{Math.round(zoom * 100)}%</button>
        <button type="button" onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))} className={iconBtn} disabled={zoom >= 1.4} aria-label="Zoom in" title="Zoom in (+)"><MaterialSymbol className="text-[18px]" name="add" /></button>
        <button type="button" onClick={fit} className={iconBtn} aria-label="Fit to width" title="Fit to width"><MaterialSymbol className="text-[18px]" name="fit_width" /></button>
      </span>
      <button type="button" onClick={share} className={iconBtn} title="Copy the shareable link" aria-label="Share"><MaterialSymbol className="text-[18px]" name={copied ? "check" : "share"} /></button>
      <button type="button" onClick={() => setFull((v) => !v)} className={iconBtn} title={full ? "Exit full screen (Esc)" : "Full screen"} aria-label="Full screen"><MaterialSymbol className="text-[19px]" name={full ? "close_fullscreen" : "open_in_full"} /></button>
    </div>
  );
  const canvas = (
    <div ref={scroller} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      className={cn("relative cursor-grab overflow-auto bg-[#fbfbfc] active:cursor-grabbing [scrollbar-width:thin]", full ? "flex-1" : "h-[76vh]")}
      style={{ backgroundImage: "radial-gradient(rgba(13,17,23,.07) 1px, transparent 1px)", backgroundSize: `${22 * zoom}px ${22 * zoom}px` }}>
      <div className="mx-auto" style={{ width: W * zoom, height: height * zoom }}>
        <div style={{ width: W, height, transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
          <Graph rows={rows} stages={stages} height={height} plan={plan} stepStatus={stepStatus} status={status} here={here} dim={dim} hit={(st) => !!needle && matches(st)} onOpen={open} onPick={setPick} onMark={mark} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-5">
      {/* the goal, how far along, and when you'll get there */}
      <section className="relative grid gap-5 overflow-hidden rounded-[26px] bg-[#0b0e14] p-6 text-white sm:p-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
        <span className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[#6d48d8] opacity-30 blur-[90px]" />
        <div className="relative grid gap-2">
          <span className={cn(kicker, "flex items-center gap-2 text-[#4fd1c5]")}><MaterialSymbol className="text-[16px]" filled name="flag" />Your goal</span>
          <h1 className="font-heading text-[28px] font-black leading-[1.05] tracking-[-0.03em] sm:text-[38px]">The road to {role.name}</h1>
          <p className="max-w-2xl text-[14px] leading-6 text-white/60">{role.line}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[12px] text-white/60"><b className="mr-1 font-heading text-[16px] text-white">{plan.steps.length}</b>steps</span>
            <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[12px] text-white/60"><b className="mr-1 font-heading text-[16px] text-white">{plan.stages.length}</b>stages</span>
            <span className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-2 py-1 text-[12px] text-white/60">
              <MaterialSymbol className="text-[16px]" name="schedule" />
              {HOURS.map((h) => <button key={h} type="button" onClick={() => setHours(h)} className={cn("rounded-lg px-1.5 py-0.5 font-bold", hours === h ? "bg-white text-[#0d1117]" : "hover:text-white")}>{h}h</button>)}
              <span className="pl-1">a week</span>
            </span>
            <button type="button" onClick={onChangeGoal} className="flex items-center gap-1 rounded-xl border border-white/15 px-3 py-1.5 text-[12px] font-bold text-white/80 hover:bg-white/10"><MaterialSymbol className="text-[16px]" name="swap_horiz" />Change goal</button>
          </div>
        </div>
        <div className="relative grid gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <span className="w-fit rounded-full bg-white p-1 text-[#0d1117]"><Ring pct={Math.round((done / plan.steps.length) * 100)} size={84} color="#007373" /></span>
          <span className="grid gap-1.5">
            <b className="text-[15px]">{done} of {plan.steps.length} done{learning ? <span className="font-normal text-white/55"> · {learning} learning</span> : null}</b>
            <span className="text-[12.5px] text-white/60">{here ? <>Finish around <b className="text-white">{finish.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</b> at {hours} h a week</> : "You’ve covered the whole road."}</span>
            {here ? <button type="button" onClick={() => open(here)} className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-3 py-1.5 text-[12px] font-bold text-white hover:brightness-110">Next: {here.name}<MaterialSymbol className="text-[16px]" name="arrow_forward" /></button> : null}
          </span>
        </div>
      </section>

      {/* stage progress */}
      <div className="grid gap-3 sm:grid-cols-3">
        {plan.stages.map((st) => {
          const d = st.steps.filter((x) => stepStatus(x) === "know").length;
          const sy = stages.find((x) => x.level === st.level)?.y ?? 0;
          return (
            <button key={st.level} type="button" onClick={() => jump(sy)} className="grid gap-2 rounded-2xl border border-black/[0.06] bg-white p-3.5 text-left transition-colors hover:border-black/20">
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg font-heading text-[13px] font-black text-white" style={{ background: STAGE_COLOR[st.level] }}>{d === st.steps.length ? <MaterialSymbol className="text-[16px]" name="check" /> : st.level}</span><b className="text-[14px] text-[var(--primary)]">{st.name}</b></span>
                <span className="font-mono text-[11.5px] font-bold text-black/45">{d}/{st.steps.length}</span>
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(d / st.steps.length) * 100}%`, background: STAGE_COLOR[st.level] }} /></span>
              <span className="text-[11.5px] text-black/45">{st.line} · ~{Math.round(st.weeks * (HOURS_PER_WEEK / hours))} weeks</span>
            </button>
          );
        })}
      </div>

      {/* the map */}
      <div className="hidden overflow-hidden rounded-[26px] border border-black/[0.06] bg-white md:block">
        {full ? <div className="flex h-[76vh] items-center justify-center text-[13px] text-black/45">The map is open in full screen.</div> : <>{toolbar}{canvas}</>}
        <Legend />
      </div>
      {full ? <div className="fixed inset-0 z-[135] flex flex-col bg-white">{toolbar}{canvas}<Legend /></div> : null}
      <div className="grid gap-3 md:hidden">
        <label className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3"><MaterialSymbol className="text-[18px] text-black/35" name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find on the map" className="w-full bg-transparent py-2.5 text-[14px] outline-none" /></label>
        <span className="flex w-fit rounded-xl bg-[#e9eaec] p-0.5">{([["all", "All"], ["todo", "To do"], ["done", "Done"]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setFilter(k)} className={seg(filter === k)}>{l}</button>)}</span>
        <Stacked plan={plan} stepStatus={stepStatus} here={here} dim={dim} onOpen={open} />
      </div>

      <p className="text-[12px] text-black/45">Built from Explorer’s map of roles, subjects and skills. Drag to move around, <b>+</b>/<b>−</b> to zoom, hover a step to mark it. Times are rough. <Link href={`/explore/roadmap/${roleId}`} className="font-semibold text-[var(--bridge-teal)]">Open the shareable page →</Link></p>

      {pick ? <Drawer pick={pick} plan={plan} onPick={setPick} onOpen={open} onMark={mark} onClose={() => setPick(null)} /> : null}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/[0.06] bg-white px-4 py-2.5 text-[11.5px] text-black/55">
      <span className="flex items-center gap-1.5"><span className="h-4 w-8 rounded-md border-2 border-[#0d1117] bg-[#ffe873]" />Step</span>
      <span className="flex items-center gap-1.5"><span className="h-4 w-8 rounded-md border-2 border-[#0d1117] bg-[#fff6c2]" />What it covers</span>
      <span className="flex items-center gap-1.5"><span className="h-4 w-8 rounded-md border-2 border-[#6d48d8] bg-[#efe9ff]" />Pick one — any is enough</span>
      <span className="flex items-center gap-1.5"><MaterialSymbol className="text-[16px] text-[#007373]" filled name="check_circle" />Know</span>
      <span className="flex items-center gap-1.5"><MaterialSymbol className="text-[16px] text-[#c49000]" name="autorenew" />Learning</span>
      <span className="flex items-center gap-1.5"><MaterialSymbol className="text-[16px] text-[#6d48d8]" filled name="bookmark" />Want</span>
      <span className="flex items-center gap-1.5"><span className="h-4 w-8 rounded-md border-2 border-[var(--electric-pink)] bg-white" />You’re here</span>
    </div>
  );
}

/* ---------- the drawing: a spine of steps, what each covers on the sides, choices in purple ---------- */
const W = 1080, CX = W / 2, CW = 290, BW = 230, BH = 34, GAP = 8, ROWGAP = 34, STAGEH = 96, TOP = 40;
type Box = { x: number; y: number; w: number; h: number };
type Branch = { label: string; box: Box; kind: "topic" | "option"; id: string };
type Row = { step: Step; center: Box; branches: Branch[] };
type StageMark = { level: 1 | 2 | 3; name: string; line: string; weeks: number; y: number; steps: Step[] };

function layout(plan: Plan, topics: boolean) {
  let y = TOP, flip = false;
  const stages: StageMark[] = [], rows: Row[] = [];
  for (const st of plan.stages) {
    stages.push({ level: st.level, name: st.name, line: st.line, weeks: st.weeks, y, steps: st.steps });
    y += STAGEH;
    for (const step of st.steps) {
      const list: Omit<Branch, "box">[] = step.options
        ? step.options.map((o) => ({ label: skillById.get(o)?.name ?? o, kind: "option" as const, id: o }))
        : topics && step.kind === "subject" ? (subjectById.get(step.id)?.topics ?? []).slice(0, 6).map((t) => ({ label: t, kind: "topic" as const, id: step.id })) : [];
      const half = Math.ceil(list.length / 2);
      const [a, b] = [list.slice(0, half), list.slice(half)];
      const [L, R] = flip ? [b, a] : [a, b];
      flip = !flip;
      const colH = (n: number) => (n ? n * BH + (n - 1) * GAP : 0);
      const ch = 54, h = Math.max(ch, colH(L.length), colH(R.length));
      const place = (items: typeof list, x: number) => { const top = y + (h - colH(items.length)) / 2; return items.map((it, i) => ({ ...it, box: { x, y: top + i * (BH + GAP), w: BW, h: BH } })); };
      rows.push({ step, center: { x: CX - CW / 2, y: y + (h - ch) / 2, w: CW, h: ch }, branches: [...place(L, 40), ...place(R, W - 40 - BW)] });
      y += h + ROWGAP;
    }
  }
  return { rows, stages, height: y + 30 };
}

const edge = (a: Box, b: Box) => {
  const toLeft = b.x < a.x;
  const x1 = toLeft ? a.x : a.x + a.w, y1 = a.y + a.h / 2, x2 = toLeft ? b.x + b.w : b.x, y2 = b.y + b.h / 2, mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
};

function StatusMark({ s, size = 18 }: { s?: Status; size?: number }) {
  if (!s) return null;
  return s === "know" ? <MaterialSymbol className="text-[#007373]" style={{ fontSize: size }} filled name="check_circle" /> : s === "learning" ? <MaterialSymbol className="text-[#c49000]" style={{ fontSize: size }} name="autorenew" /> : <MaterialSymbol className="text-[#6d48d8]" style={{ fontSize: size }} filled name="bookmark" />;
}

const QUICK: [Status, string, string][] = [["know", "check_circle", "I know it"], ["learning", "autorenew", "Learning"], ["want", "bookmark", "Want to learn"]];

function Graph({ rows, stages, height, plan, stepStatus, status, here, dim, hit, onOpen, onPick, onMark }: {
  rows: Row[]; stages: StageMark[]; height: number; plan: Plan;
  stepStatus: (s: Step) => Status | undefined; status: (k: string, id: string) => Status | undefined; here?: Step;
  dim: (s: Step) => boolean; hit: (s: Step) => boolean; onOpen: (s: Step) => void; onPick: (p: Opened) => void; onMark: (kind: string, id: string, s: Status | null, step?: Step) => void;
}) {
  /* the spine is drawn solid up to where you are, then lighter */
  const hereY = here ? rows.find((r) => r.step.n === here.n)?.center.y ?? height : height;
  return (
    <div className="relative" style={{ width: W, height }}>
      <svg className="pointer-events-none absolute inset-0" width={W} height={height} aria-hidden>
        <line x1={CX} y1={TOP + STAGEH - 12} x2={CX} y2={height - 30} stroke="#2563eb" strokeWidth="4" strokeLinecap="round" opacity=".25" />
        <line x1={CX} y1={TOP + STAGEH - 12} x2={CX} y2={Math.max(TOP + STAGEH - 12, Math.min(hereY + 27, height - 30))} stroke="#007373" strokeWidth="4" strokeLinecap="round" />
        {rows.map((r) => r.branches.map((b, i) => {
          const chosen = b.kind === "option" && status("skill", b.id) === "know";
          return <path key={`${r.step.n}-${i}`} d={edge(r.center, b.box)} fill="none" stroke={b.kind === "option" ? (chosen ? "#007373" : "#6d48d8") : "#2563eb"} strokeWidth={chosen ? 3 : 2} strokeDasharray={b.kind === "option" ? undefined : "5 5"} opacity={dim(r.step) ? 0.15 : stepStatus(r.step) === "know" && !chosen ? 0.3 : 0.75} />;
        }))}
      </svg>
      {stages.map((s) => {
        const d = s.steps.filter((x) => stepStatus(x) === "know").length;
        return (
          <div key={s.level} className="absolute left-0 right-0 z-[1] flex flex-col items-center gap-1.5" style={{ top: s.y + 4 }}>
            <span className="flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 font-heading text-[15px] font-black uppercase tracking-[-0.01em] text-white shadow-md" style={{ background: STAGE_COLOR[s.level] }}>
              Stage {s.level} · {s.name}
              <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[11px]">{d}/{s.steps.length}</span>
            </span>
            <span className="h-1 w-40 overflow-hidden rounded-full bg-black/[0.07]"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(d / s.steps.length) * 100}%`, background: STAGE_COLOR[s.level] }} /></span>
            <span className="rounded-full bg-white/90 px-2 text-[11.5px] text-black/50">{s.line} · about {s.weeks} weeks</span>
          </div>
        );
      })}
      {rows.map((r) => {
        const s = stepStatus(r.step), isHere = here?.n === r.step.n, faded = dim(r.step), found = hit(r.step);
        const k = r.step.kind === "skill" && !r.step.options ? skillById.get(r.step.id) : undefined;
        const chosen = r.step.options?.find((o) => status("skill", o) === "know");
        return (
          <div key={r.step.n} className={cn("transition-opacity duration-300", faded && "opacity-25")}>
            <div className="group absolute" style={{ left: r.center.x, top: r.center.y, width: r.center.w, height: r.center.h }}>
              <button type="button" onClick={() => onOpen(r.step)}
                className={cn("flex h-full w-full items-center gap-2 rounded-xl border-2 px-3 text-left text-[14px] font-bold shadow-[0_3px_0_rgba(13,17,23,.85)] transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_0_rgba(13,17,23,.85)]",
                  s === "know" ? "border-[#007373] bg-[#e6f3f3] text-[#005a5a] shadow-[0_3px_0_#007373]" : r.step.options ? "border-[#6d48d8] bg-[#efe9ff] text-[#3b2386] shadow-[0_3px_0_#6d48d8]" : "border-[#0d1117] bg-[#ffe873] text-[#0d1117]",
                  isHere && "outline outline-4 outline-offset-2 outline-[var(--electric-pink)]/40", found && "outline outline-4 outline-offset-2 outline-[#2563eb]/50")}>
                <span className="flex size-6 flex-none items-center justify-center rounded-full bg-black/10 text-[11px] font-black">{r.step.n}</span>
                {k ? <Mono k={k} size={20} /> : null}
                <span className="grid min-w-0 flex-1 leading-tight">
                  <span className={cn("truncate", s === "know" && !r.step.options && "line-through decoration-2 opacity-70")}>{r.step.name}</span>
                  {chosen ? <span className="truncate text-[11px] font-semibold text-[#007373]">Chosen: {skillById.get(chosen)?.name}</span> : <span className="text-[10.5px] font-semibold opacity-50">~{r.step.weeks} wk{r.step.prereqFor ? ` · for ${r.step.prereqFor}` : ""}</span>}
                </span>
                <StatusMark s={s} />
              </button>
              {isHere ? <span className="pointer-events-none absolute -top-3 left-3 rounded-full bg-[var(--electric-pink)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-white">You’re here</span> : null}
              {/* mark it without opening it */}
              {!r.step.options ? (
                <span className="absolute -top-4 right-2 hidden gap-0.5 rounded-full border border-black/10 bg-white p-0.5 shadow-md group-hover:flex">
                  {QUICK.map(([st, icon, label]) => (
                    <button key={st} type="button" onClick={() => onMark(r.step.kind, r.step.id, s === st ? null : st, r.step)} title={label} aria-label={label} aria-pressed={s === st}
                      className={cn("flex size-7 items-center justify-center rounded-full transition-colors", s === st ? (st === "know" ? "bg-[#007373] text-white" : st === "learning" ? "bg-[#f2b705] text-[#1c1b1b]" : "bg-[#6d48d8] text-white") : "text-black/45 hover:bg-black/[0.06]")}>
                      <MaterialSymbol className="text-[16px]" filled={s === st} name={icon} />
                    </button>
                  ))}
                </span>
              ) : null}
            </div>
            {r.branches.map((b, i) => {
              const bs = b.kind === "option" ? status("skill", b.id) : s;
              const sk = b.kind === "option" ? skillById.get(b.id) : undefined;
              const other = b.kind === "option" && !!chosen && chosen !== b.id;
              return (
                <button key={i} type="button" onClick={() => onPick(b.kind === "option" ? { kind: "skill", id: b.id, step: r.step } : { kind: "subject", id: r.step.id, step: r.step, topic: b.label })}
                  className={cn("absolute flex items-center gap-1.5 rounded-lg border-2 px-2.5 text-left text-[12.5px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md",
                    b.kind === "option" ? (bs === "know" ? "border-[#007373] bg-[#e6f3f3] text-[#005a5a]" : other ? "border-[#6d48d8]/40 bg-white text-[#3b2386]/50" : "border-[#6d48d8] bg-white text-[#3b2386]") : bs === "know" ? "border-[#007373]/50 bg-[#f4fbfa] text-[#005a5a]/70" : "border-[#0d1117] bg-[#fff6c2] text-[#0d1117]")}
                  style={{ left: b.box.x, top: b.box.y, width: b.box.w, height: b.box.h }}>
                  {sk ? <Mono k={sk} size={18} /> : null}
                  <span className={cn("min-w-0 flex-1 truncate", bs === "know" && b.kind === "topic" && "line-through")}>{b.label}</span>
                  {b.kind === "option" ? <StatusMark s={bs} size={16} /> : null}
                </button>
              );
            })}
          </div>
        );
      })}
      {/* the finish */}
      <div className="absolute flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0d1117] px-4 py-2 text-[13px] font-bold text-white shadow-lg" style={{ left: CX, top: height - 46 }}>
        <MaterialSymbol className="text-[18px] text-[#ffd666]" filled name="flag" />{plan.steps.every((x) => stepStatus(x) === "know") ? "You made it" : "Job-ready"}
      </div>
    </div>
  );
}

/* the same road, stacked, for small screens */
function Stacked({ plan, stepStatus, here, dim, onOpen }: { plan: Plan; stepStatus: (s: Step) => Status | undefined; here?: Step; dim: (s: Step) => boolean; onOpen: (s: Step) => void }) {
  return (
    <>
      {plan.stages.map((st) => {
        const d = st.steps.filter((x) => stepStatus(x) === "know").length;
        return (
          <section key={st.level} className="grid gap-2">
            <span className="flex items-center gap-2"><span className="w-fit rounded-full px-3 py-1 font-heading text-[13px] font-black uppercase text-white" style={{ background: STAGE_COLOR[st.level] }}>Stage {st.level} · {st.name}</span><span className="font-mono text-[11.5px] font-bold text-black/45">{d}/{st.steps.length}</span></span>
            <ol className="relative grid gap-2 border-l-4 border-[#2563eb]/40 pl-4">
              {st.steps.map((step) => {
                const s = stepStatus(step);
                const topics = step.options ? step.options.map((o) => skillById.get(o)?.name ?? o) : step.kind === "subject" ? subjectById.get(step.id)?.topics.slice(0, 6) ?? [] : [];
                return (
                  <li key={step.n} className={cn("transition-opacity", dim(step) && "opacity-30")}>
                    <button type="button" onClick={() => onOpen(step)} className={cn("grid w-full gap-1.5 rounded-xl border-2 p-3 text-left", s === "know" ? "border-[#007373] bg-[#e6f3f3]" : step.options ? "border-[#6d48d8] bg-[#efe9ff]" : "border-[#0d1117] bg-[#ffe873]", here?.n === step.n && "outline outline-4 outline-[var(--electric-pink)]/35")}>
                      <span className="flex items-center gap-2 text-[14px] font-bold"><span className="flex size-6 items-center justify-center rounded-full bg-black/10 text-[11px] font-black">{step.n}</span><span className={cn("flex-1", s === "know" && "line-through opacity-70")}>{step.name}</span><StatusMark s={s} /></span>
                      {topics.length ? <span className="flex flex-wrap gap-1">{topics.map((t) => <span key={t} className="rounded-md border border-black/15 bg-white/70 px-1.5 py-0.5 text-[11.5px]">{t}</span>)}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </>
  );
}

/* ---------- a box, opened: what it is, where it leads, where Node teaches it — mark it and move on ---------- */
function Drawer({ pick, plan, onPick, onOpen, onMark, onClose }: {
  pick: NonNullable<Opened>; plan: Plan;
  onPick: (p: Opened) => void; onOpen: (s: Step) => void; onMark: (kind: string, id: string, s: Status | null, step?: Step) => void; onClose: () => void;
}) {
  const map = useMyMap();
  const subject = pick.kind === "subject" ? subjectById.get(pick.id) : undefined;
  const skill = pick.kind === "skill" ? skillById.get(pick.id) : undefined;
  const step = pick.step;
  const cover = coverageFor(pick.kind, pick.id);
  const name = subject?.name ?? skill?.name ?? pick.id;
  const idx = step ? plan.steps.findIndex((s) => s.n === step.n) : -1;
  const prev = idx > 0 ? plan.steps[idx - 1] : undefined, next = idx >= 0 && idx < plan.steps.length - 1 ? plan.steps[idx + 1] : undefined;
  const roles = (pick.kind === "subject" ? rolesWithSubject(pick.id) : rolesWithSkill(pick.id)).slice(0, 6);
  const unlocks = subject ? leadsTo(subject.id).slice(0, 6) : [];
  const cur = map?.items[`${pick.kind}:${pick.id}`] as Status | undefined;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if ((e.key === "ArrowDown" || e.key === "ArrowRight") && next) onOpen(next);
      if ((e.key === "ArrowUp" || e.key === "ArrowLeft") && prev) onOpen(prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const section = "grid gap-2";
  const h = "text-[12.5px] font-bold uppercase tracking-[0.08em] text-black/45";
  return (
    <div className="fixed inset-0 z-[140] flex justify-end bg-[#0d1117]/35 backdrop-blur-[1px]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-label={name} className="flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl" style={{ animation: "cert-fade .3s ease both" }}>
        <header className="grid gap-3 border-b border-black/[0.06] p-5" style={{ background: step ? `linear-gradient(180deg, color-mix(in srgb, ${STAGE_COLOR[plan.stages.find((x) => x.steps.some((y) => y.n === step.n))?.level ?? 1]} 10%, white), white)` : undefined }}>
          <div className="flex items-center justify-between gap-2">
            <span className={cn(kicker, "text-black/45")}>{step ? `Step ${step.n} of ${plan.steps.length}` : ""}{subject ? ` · Subject · ${LEVELS.subject[subject.level]}` : skill ? ` · ${skill.type} · ${LEVELS.skill[skill.level]}` : ""}</span>
            <span className="flex items-center gap-0.5">
              <button type="button" disabled={!prev} onClick={() => prev && onOpen(prev)} className="flex size-8 items-center justify-center rounded-full text-black/55 hover:bg-black/[0.05] disabled:opacity-30" aria-label="Previous step" title="Previous (↑)"><MaterialSymbol className="text-[20px]" name="keyboard_arrow_up" /></button>
              <button type="button" disabled={!next} onClick={() => next && onOpen(next)} className="flex size-8 items-center justify-center rounded-full text-black/55 hover:bg-black/[0.05] disabled:opacity-30" aria-label="Next step" title="Next (↓)"><MaterialSymbol className="text-[20px]" name="keyboard_arrow_down" /></button>
              <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full hover:bg-black/[0.05]" aria-label="Close" title="Close (Esc)"><MaterialSymbol className="text-[20px]" name="close" /></button>
            </span>
          </div>
          <span className="flex items-center gap-2.5">{skill ? <Mono k={skill} size={34} /> : <span className="flex size-[34px] items-center justify-center rounded-xl bg-[#ffe873] ring-2 ring-[#0d1117]"><MaterialSymbol className="text-[19px]" name="menu_book" /></span>}<b className="text-[22px] leading-tight text-[var(--primary)]">{name}</b></span>
          <p className="text-[14px] leading-6 text-black/65">{subject?.line ?? skill?.line}</p>
          {step ? <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-black/50"><span className="flex items-center gap-1"><MaterialSymbol className="text-[16px]" name="schedule" />~{step.weeks} week{step.weeks === 1 ? "" : "s"} at {HOURS_PER_WEEK} h</span>{step.prereqFor ? <span className="flex items-center gap-1"><MaterialSymbol className="text-[16px]" name="link" />Needed for {step.prereqFor}</span> : null}</span> : null}
        </header>

        <div className="grid min-h-0 flex-1 content-start gap-5 overflow-y-auto p-5">
          {step?.options ? (
            <div className="grid gap-2 rounded-2xl bg-[#efe9ff] p-3">
              <b className="text-[13px] text-[#3b2386]">{step.name} — any one is enough to start</b>
              <div className="flex flex-wrap gap-1.5">{step.options.map((o) => { const k = skillById.get(o)!; const st = map?.items[`skill:${o}`] as Status | undefined; return <button key={o} type="button" onClick={() => onPick({ kind: "skill", id: o, step })} className={cn("flex items-center gap-1.5 rounded-full border bg-white py-0.5 pl-0.5 pr-2.5 text-[12px] font-semibold", o === pick.id ? "border-[#6d48d8] ring-2 ring-[#6d48d8]/25" : "border-black/10 hover:border-black/30")}><Mono k={k} size={20} />{k.name}<StatusMark s={st} size={14} /></button>; })}</div>
            </div>
          ) : null}
          {subject ? (
            <div className={section}>
              <span className={h}>What it covers</span>
              <div className="flex flex-wrap gap-1.5">{subject.topics.map((t) => <span key={t} className={cn("rounded-md border-2 px-2 py-0.5 text-[12.5px] font-semibold", t === pick.topic ? "border-[#0d1117] bg-[#ffe873]" : "border-black/10 bg-[#fffbe6]")}>{t}</span>)}</div>
              {subject.first?.length ? <span className="text-[12.5px] text-black/50">Learn first: {subject.first.map((f) => subjectById.get(f)?.name).filter(Boolean).join(", ")}</span> : null}
            </div>
          ) : null}
          {unlocks.length ? (
            <div className={section}>
              <span className={h}>It opens the way to</span>
              <div className="flex flex-wrap gap-1.5">{unlocks.map((u) => <button key={u.id} type="button" onClick={() => onPick({ kind: "subject", id: u.id })} className="flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-[12px] font-semibold hover:border-black/30"><MaterialSymbol className="text-[14px] text-black/40" name="arrow_outward" />{u.name}</button>)}</div>
            </div>
          ) : null}
          {cover.length ? (
            <div className={section}>
              <span className={h}>Where Node teaches it</span>
              {cover.map((c) => <Link key={c.label + c.where} href={c.href} className="flex items-center gap-2 rounded-xl border border-black/[0.08] px-3 py-2 text-[13px] font-semibold hover:border-black/25"><MaterialSymbol className="text-[18px]" style={{ color: c.color }} name="school" /><span className="flex-1">{c.label} · {c.where}</span>{c.status === "soon" ? <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10.5px] font-bold text-black/45">Soon</span> : <MaterialSymbol className="text-[16px] text-black/30" name="arrow_forward" />}</Link>)}
            </div>
          ) : null}
          {roles.length ? (
            <div className={section}>
              <span className={h}>Roles that use it</span>
              <div className="flex flex-wrap gap-1.5">{roles.map((r) => <span key={r.id} className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-[12px] font-semibold text-black/60">{r.name}</span>)}</div>
            </div>
          ) : null}
          <Link href={`/explore?open=${pick.kind}:${pick.id}`} className="w-fit text-[13px] font-bold text-[var(--bridge-teal)]">Everything about {name} in Explorer →</Link>
        </div>

        {/* mark it, and move on */}
        <footer className="grid gap-2.5 border-t border-black/[0.06] bg-[#fbfbfc] p-4">
          <StatusPicker kind={pick.kind} id={pick.id} />
          {map?.signedIn && step ? (
            <button type="button" onClick={() => { if (cur !== "know") onMark(pick.kind, pick.id, "know", step); if (next) onOpen(next); else onClose(); }}
              className="flex items-center justify-center gap-2 rounded-full bg-[var(--deep-indigo)] px-4 py-2.5 text-[13px] font-bold text-white hover:brightness-125">
              <MaterialSymbol className="text-[18px]" filled name="check_circle" />{cur === "know" ? (next ? "Next step" : "Done") : next ? "I know it — next step" : "I know it — finish"}<MaterialSymbol className="text-[18px]" name="arrow_forward" />
            </button>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}
