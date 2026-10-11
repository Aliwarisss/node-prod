"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { KitFileMeta, KitLayer, KitScale, KitStage } from "@/lib/program/kit";
import { cn } from "@/lib/utils";

const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";


const EXTRA_LAYERS: KitLayer[] = [{ id: "templates", name: "Templates", icon: "description", what: "The blank document for each artifact — the agent fills it, you check it.", tools: "" }, { id: "readme", name: "Read me", icon: "menu_book", what: "How to use the kit, and how each tool picks the layers up.", tools: "" }];
const folderOf = (p: string) => (p.includes("/") ? p.split("/")[0] + "/" : "Project root");
const nameIn = (p: string) => (p.includes("/") ? p.slice(p.indexOf("/") + 1) : p);

type FileView = { path: string; title: string; layer: string; body: string };

/* Light Markdown for reading: headings, lists, tables and code keep their shape; front matter shows as a header. */
function MdView({ body }: { body: string }) {
  const lines = body.split("\n");
  let i = 0;
  const out: React.ReactNode[] = [];
  const inline = (s: string) => s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((x, k) => (x.startsWith("`") && x.endsWith("`") ? <code key={k} className="rounded bg-black/[0.06] px-1 py-px font-mono text-[12px]">{x.slice(1, -1)}</code> : x.startsWith("**") && x.endsWith("**") ? <b key={k}>{x.slice(2, -2)}</b> : x));
  if (lines[0] === "---") {
    const end = lines.indexOf("---", 1);
    if (end > 0) {
      out.push(<dl key="fm" className="mb-3 grid gap-1 rounded-xl bg-[#f6f7f8] p-3 font-mono text-[11.5px]">{lines.slice(1, end).map((l, k) => { const [a, ...b] = l.split(":"); return <div key={k} className="flex gap-2"><dt className="flex-none text-black/45">{a}</dt><dd className="min-w-0 break-words text-[var(--primary)]">{b.join(":").trim().replace(/^"|"$/g, "")}</dd></div>; })}</dl>);
      i = end + 1;
    }
  }
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith("```")) {
      const end = lines.indexOf("```", i + 1);
      const stop = end < 0 ? lines.length : end;
      out.push(<pre key={i} className="my-2 overflow-x-auto rounded-xl bg-[#0d1117] p-3 font-mono text-[12px] leading-5 text-[#e6edf3]">{lines.slice(i + 1, stop).join("\n")}</pre>);
      i = stop + 1;
      continue;
    }
    if (l.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) { if (!/^\|\s*-/.test(lines[i])) rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim())); i++; }
      out.push(<div key={`t${i}`} className="my-2 overflow-x-auto"><table className="w-full border-collapse text-[12.5px]"><thead><tr>{rows[0]?.map((c, k) => <th key={k} className="border border-black/10 bg-[#f6f7f8] px-2 py-1 text-left font-bold">{inline(c)}</th>)}</tr></thead><tbody>{rows.slice(1).map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j} className="border border-black/10 px-2 py-1 align-top">{inline(c)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)/);
    if (h) out.push(h[1].length === 1 ? <h3 key={i} className="mb-1 mt-2 text-[19px] font-black text-[var(--primary)]">{inline(h[2])}</h3> : <h4 key={i} className="mb-0.5 mt-3 text-[14.5px] font-black text-[var(--primary)]">{inline(h[2])}</h4>);
    else if (/^\s*[-*]\s/.test(l)) out.push(<p key={i} className="flex gap-2 text-[13.5px] leading-6" style={{ paddingLeft: (l.match(/^\s*/)?.[0].length ?? 0) * 6 }}><span className="text-black/35">•</span><span>{inline(l.replace(/^\s*[-*]\s/, ""))}</span></p>);
    else if (/^\d+\.\s/.test(l)) out.push(<p key={i} className="flex gap-2 text-[13.5px] leading-6"><span className="w-5 flex-none text-right font-bold text-black/40">{l.match(/^\d+/)?.[0]}.</span><span>{inline(l.replace(/^\d+\.\s/, ""))}</span></p>);
    else if (l.startsWith(">")) out.push(<blockquote key={i} className="my-1 border-l-4 border-[var(--electric-pink)]/40 pl-3 text-[13.5px] italic text-[var(--on-surface-variant)]">{inline(l.replace(/^>\s?/, ""))}</blockquote>);
    else if (l.trim()) out.push(<p key={i} className="text-[13.5px] leading-6 text-[var(--primary)]">{inline(l)}</p>);
    else out.push(<div key={i} className="h-2" />);
    i++;
  }
  return <div className="min-w-0">{out}</div>;
}

export type KitDay = { day: number; title: string; lessons: { fid: string; code: string; title: string }[] };
type LessonRef = { fid: string; code: string; title: string; day: number };
const LAYER_ORDER = ["workflows", "commands", "skills", "agents", "rubrics", "templates", "context", "tools", "guardrails", "memory"];
const byLayer = (a: KitFileMeta, b: KitFileMeta) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer) || a.path.localeCompare(b.path);
const shortName = (p: string) => (p.endsWith("/SKILL.md") ? p.split("/").slice(-2)[0] : p.includes("/") ? (p.split("/").pop() ?? p).replace(/\.md$/, "") : p);

/* ---------- "How to use this kit" — the page the kit opens on ---------- */
function KitGuide({ stage, layers, counts, runCommand, onLayer, onOpen }: {
  stage: KitStage; layers: KitLayer[]; counts: Record<string, number>; runCommand: string; onLayer: (id: string) => void; onOpen: (path: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid max-w-3xl gap-7">
      <div className="grid gap-1">
        <h2 className="text-[22px] font-black tracking-[-0.02em] text-[var(--primary)]">How to use this kit</h2>
        <p className="text-[14px] leading-6 text-[var(--on-surface-variant)]">A ready project folder for running {stage.name} with your agent. You drive and decide; the agent helps. Every file comes from the same contracts as your lessons.</p>
      </div>

      <ol className="grid gap-3">
        {[
          <>Open a file here and copy it into the same path in your project folder — the kit stays on Copy, Paste, Go and is for your use only.</>,
          <>Start with the root files, then fill <code className="rounded bg-black/[0.05] px-1 font-mono text-[12.5px]">{"{{initiative}}"}</code> in <button type="button" onClick={() => onOpen("AGENTS.md")} className="font-mono font-semibold text-[var(--primary)] underline underline-offset-2">AGENTS.md</button>.</>,
          <>Point your agent at the folder — most read AGENTS.md and load skills, commands and subagents from their folders.</>,
          <>Run the command for the task you’re on (Do it shows it), or the whole stage:</>,
        ].map((s, i) => (
          <li key={i} className="flex items-baseline gap-3 text-[14px] leading-6 text-[var(--primary)]">
            <span className="w-5 flex-none text-right font-mono text-[12px] font-bold text-black/35">{i + 1}</span>
            <span className="grid gap-2"><span>{s}</span>{i === 3 ? (
              <span className="flex items-center gap-2 justify-self-start rounded-lg bg-[#0d1117] px-3 py-1.5 font-mono text-[12.5px] text-[#e6edf3]">
                /{runCommand}
                <button type="button" onClick={() => void navigator.clipboard.writeText(`/${runCommand}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })} className="text-white/50 hover:text-white" aria-label="Copy the command"><MaterialSymbol className="text-[15px]" name={copied ? "check" : "content_copy"} /></button>
              </span>
            ) : null}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-1">
        <span className={cn(kicker, "pb-1 text-[9.5px] text-black/40")}>What’s inside</span>
        {layers.filter((l) => counts[l.id]).map((l) => (
          <button key={l.id} type="button" onClick={() => onLayer(l.id)} title={l.tools || undefined} className="group grid grid-cols-[22px_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-black/[0.05] py-2.5 text-left">
            <MaterialSymbol className="translate-y-[3px] text-[17px] text-black/40" name={l.icon} />
            <span className="grid gap-0.5"><b className="text-[13.5px] text-[var(--primary)] group-hover:underline">{l.name}</b><span className="text-[12.5px] leading-5 text-[var(--on-surface-variant)]">{l.what}</span></span>
            <span className="font-mono text-[11.5px] text-black/40">{counts[l.id]}</span>
          </button>
        ))}
      </div>

      <p className="text-[13px] leading-6 text-[var(--on-surface-variant)]"><b className="text-[var(--primary)]">After every step:</b> check the output, score it on its rubric, save it in <code className="font-mono text-[12.5px]">docs/</code>, and add a line to PROGRESS.md — the same loop as Do it.</p>
    </div>
  );
}

/* ---------- a stage's kit before the trainee reaches it: sealed, with what's inside and when it opens ---------- */
function LockedKit({ stage, layers, days, currentDay }: { stage: KitStage; layers: KitLayer[]; days: KitDay[]; currentDay: number }) {
  const away = Math.max(1, stage.firstDay - currentDay);
  const reached = Math.max(4, Math.min(100, Math.round((currentDay / Math.max(1, stage.firstDay)) * 100)));
  const inside = layers.filter((l) => stage.layers[l.id]).sort((a, b) => (stage.layers[b.id] ?? 0) - (stage.layers[a.id] ?? 0));
  const ghost = [62, 48, 74, 40, 56]; // widths of the blurred file names
  return (
    <div className="grid gap-5">
      <section className="grid overflow-hidden rounded-[24px] border border-black/[0.06] bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* when it opens */}
        <div className="relative grid content-between gap-8 bg-[var(--deep-indigo)] p-6 text-white sm:p-8" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
          <div className="grid gap-3">
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/75"><MaterialSymbol className="text-[14px]" name="lock" />Sealed until Day {stage.firstDay}</span>
            <h2 className="text-[22px] font-bold leading-tight">The {stage.name} kit</h2>
            <p className="max-w-sm text-[13.5px] leading-6 text-white/65">{stage.files} files your agent uses for {stage.name}: prompts, commands, templates and checks. They open here and inside each lesson when you reach the stage.</p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <span className="flex items-baseline justify-between text-[12.5px]"><span className="text-white/60">You’re on Day {currentDay}</span><b>{away} day{away === 1 ? "" : "s"} away</b></span>
              <span className="h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full" style={{ width: `${reached}%`, background: `linear-gradient(90deg, #4fd1c5, ${stage.color})` }} /></span>
              <span className="text-[12px] text-white/50">Finish Day {stage.firstDay - 1} to open it.</span>
            </div>
            <Link href={`/dashboard/roadmap/day/${currentDay}`} className="flex w-fit items-center gap-2 rounded-full bg-[var(--electric-pink)] px-5 py-2.5 text-[12.5px] font-bold shadow-lg shadow-pink-500/25 transition-transform hover:-translate-y-0.5">Continue Day {currentDay}<MaterialSymbol className="text-[17px]" name="arrow_forward" /></Link>
          </div>
        </div>

        {/* what's inside, behind glass */}
        <div className="relative grid content-start gap-3 bg-[#f8f9fa] p-5 sm:p-6">
          <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_20px_50px_-36px_rgba(13,17,23,0.5)]">
            <div className="flex items-center gap-2 border-b border-black/[0.06] px-4 py-2.5">
              <span className="flex gap-1.5">{["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} className="size-2.5 rounded-full opacity-60" style={{ background: c }} />)}</span>
              <span className="font-mono text-[11.5px] text-black/45">kit / {stage.id}</span>
              <span className="ml-auto font-mono text-[11px] text-black/35">{stage.files} files</span>
            </div>
            <ul className="grid gap-0.5 p-2">
              {inside.slice(0, 6).map((l, i) => (
                <li key={l.id} className="grid gap-1 rounded-lg px-2 py-1.5">
                  <span className="flex items-center gap-2 text-[12.5px]"><MaterialSymbol className="text-[16px] text-black/40" name="folder" /><b className="text-[var(--primary)]">{l.name}</b><span className="ml-auto font-mono text-[11px] text-black/40">{stage.layers[l.id]}</span></span>
                  <span className="flex gap-2 pl-6 blur-[3px]" aria-hidden="true">
                    <span className="h-2 rounded-full bg-black/10" style={{ width: `${ghost[i % ghost.length]}%` }} />
                    <span className="h-2 w-[18%] rounded-full bg-black/[0.06]" />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f8f9fa] to-transparent" />
          <span className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12px] font-bold text-black/55 shadow-lg ring-1 ring-black/5"><MaterialSymbol className="text-[17px]" name="lock" />Opens on Day {stage.firstDay}</span>
        </div>
      </section>

      {/* what opens, day by day */}
      {days.length ? (
        <section className="grid gap-3">
          <span className={cn(kicker, "text-black/40")}>What opens with it · {days.length} day{days.length === 1 ? "" : "s"}</span>
          <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {days.map((d) => (
              <li key={d.day} className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
                <span className="grid size-10 flex-none place-items-center rounded-xl font-mono text-[11px] font-bold leading-none" style={{ background: `color-mix(in srgb, ${stage.color} 12%, white)`, color: stage.color }}><span className="text-[8.5px] opacity-70">DAY</span>{d.day}</span>
                <span className="grid min-w-0 leading-tight"><span className="truncate text-[13px] font-semibold text-[var(--primary)]">{d.title}</span><span className="text-[11.5px] text-black/45">{d.lessons.length} lesson{d.lessons.length === 1 ? "" : "s"}</span></span>
                <MaterialSymbol className="ml-auto flex-none text-[16px] text-black/25" name="lock" />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

/* ---------- the agent kit: one kit per stage, opened as the trainee reaches it, laid out by lesson ---------- */
export function KitBrowser({ stages, act, files: allFiles, layers, scales, initial, lesson, currentDay, days, runCommand }: {
  stages: KitStage[]; act: string; files: KitFileMeta[] | null; layers: KitLayer[]; scales: KitScale[]; initial: FileView | null;
  lesson: LessonRef | null; currentDay: number; days: KitDay[]; runCommand: string;
}) {
  const stage = stages.find((s) => s.id === act)!;
  const files = useMemo(() => allFiles?.filter((f) => f.path !== "README.md") ?? null, [allFiles]); // the guide replaces the README
  const lessons = useMemo(() => Object.fromEntries(days.flatMap((d) => d.lessons.map((l) => [l.fid, { ...l, day: d.day }]))) as Record<string, LessonRef>, [days]);
  const [scale, setScale] = useState(scales[0]?.id ?? "solo");
  const [layer, setLayer] = useState("all");
  const [q, setQ] = useState("");
  const [only, setOnly] = useState(!!lesson);
  const [mode, setMode] = useState<"lesson" | "folder">("lesson");
  const [view, setView] = useState<FileView | null>(initial);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openLessons, setOpenLessons] = useState<string[]>(lesson ? [lesson.fid] : []);
  const [wideOpen, setWideOpen] = useState(false);
  const allLayers = useMemo(() => [...layers.filter((l) => l.id !== "prompt"), ...EXTRA_LAYERS.filter((x) => x.id !== "readme" && !layers.some((l) => l.id === x.id))], [layers]);
  const layerOf = (id: string) => allLayers.find((l) => l.id === id);

  const inLesson = (f: KitFileMeta) => !only || !lesson || f.shared || f.uses.includes(lesson.fid);
  const shown = useMemo(() => (files ?? []).filter((f) => inLesson(f) && (layer === "all" || f.layer === layer) && (!q || `${f.path} ${f.title}`.toLowerCase().includes(q.toLowerCase()))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, layer, only, lesson, q]);
  const counts = useMemo(() => { const c: Record<string, number> = {}; for (const f of files ?? []) if (inLesson(f)) c[f.layer] = (c[f.layer] ?? 0) + 1; return c; },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, only, lesson]);
  const folders = useMemo(() => {
    const g = new Map<string, KitFileMeta[]>();
    for (const f of shown) g.set(folderOf(f.path), [...(g.get(folderOf(f.path)) ?? []), f]);
    return [...g.entries()].sort((a, b) => (a[0] === "Project root" ? -1 : b[0] === "Project root" ? 1 : a[0].localeCompare(b[0])));
  }, [shown]);
  const rootFiles = shown.filter((f) => !f.path.includes("/")).sort(byLayer);
  const stageWide = shown.filter((f) => f.shared && f.path.includes("/")).sort(byLayer);
  const perLesson = useMemo(() => {
    const m: Record<string, KitFileMeta[]> = {};
    for (const f of shown) if (!f.shared) for (const u of f.uses) (m[u] ??= []).push(f);
    for (const k of Object.keys(m)) m[k].sort(byLayer);
    return m;
  }, [shown]);
  const meta = files?.find((f) => f.path === view?.path);
  const filtering = layer !== "all" || !!q;

  async function open(p: string, sc = scale) {
    setLoading(true);
    try {
      const r = await fetch(`/api/program/kit?act=${act}&path=${encodeURIComponent(p)}&scale=${sc}`);
      if (r.ok) setView((await r.json()) as FileView);
    } finally { setLoading(false); }
  }
  useEffect(() => {
    const u = new URL(window.location.href);
    if (view) u.searchParams.set("file", view.path); else u.searchParams.delete("file");
    window.history.replaceState(null, "", u.toString());
  }, [view]);

  const row = (f: KitFileMeta, indent = false) => {
    const on = view?.path === f.path;
    return (
      <button key={f.path} type="button" onClick={() => void open(f.path)} title={f.title} className={cn("flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-left", indent && "pl-7", on ? "bg-[var(--primary)] text-white" : "text-[var(--primary)] hover:bg-black/[0.04]")}>
        <MaterialSymbol className={cn("flex-none text-[15px]", on ? "text-white/70" : "text-black/35")} name={layerOf(f.layer)?.icon ?? "description"} />
        <span className="truncate font-mono text-[12px]">{mode === "folder" ? nameIn(f.path) : shortName(f.path)}</span>
      </button>
    );
  };
  const toggle = (fid: string) => setOpenLessons((o) => (o.includes(fid) ? o.filter((x) => x !== fid) : [...o, fid]));

  return (
    <div className="grid gap-5">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <span className={cn(kicker, "text-black/40")}>Agent kit</span>
          <h1 className="text-[26px] font-black leading-none tracking-[-0.03em] text-[var(--primary)]">Stage {stage.n} · {stage.name}</h1>
          <p className="text-[13.5px] text-[var(--on-surface-variant)]">Your agent’s project folder for this stage. Each stage’s kit opens when you reach it.</p>
        </div>
        {stage.unlocked && files ? (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[12.5px] text-black/50">Scale
              <select value={scale} onChange={(e) => { setScale(e.target.value); if (view) void open(view.path, e.target.value); }} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[12.5px] font-semibold text-[var(--primary)] outline-none" title={scales.find((s) => s.id === scale)?.who}>
                {scales.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          </div>
        ) : null}
      </header>

      {/* stages, in order */}
      <nav className="-mx-1 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-black/[0.07] px-1 [scrollbar-width:none]" aria-label="Stages">
        {stages.map((s) => {
          const on = s.id === act;
          return (
            <Link key={s.id} href={`/dashboard/kit?act=${s.id}`} title={s.unlocked ? `${s.files} files` : `Unlocks on Day ${s.firstDay}`} className={cn("-mb-px flex flex-none items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors", on ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-black/45 hover:text-[var(--primary)]")}>
              <span className="font-mono text-[11px] text-black/35">{s.n}</span>{s.name}
              {!s.unlocked ? <span className="flex items-center gap-0.5 text-[11px] font-normal text-black/35"><MaterialSymbol className="text-[13px]" name="lock" />D{s.firstDay}</span> : s.days.includes(currentDay) ? <span className="size-1.5 rounded-full bg-[var(--electric-pink)]" title="You’re here" /> : null}
            </Link>
          );
        })}
      </nav>

      {!stage.unlocked || !files ? (
        <LockedKit stage={stage} layers={allLayers} days={days} currentDay={currentDay} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          {/* files */}
          <aside className="grid content-start gap-3 lg:sticky lg:top-4">
            <div className="flex items-center gap-2">
              <label className="flex flex-1 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1.5"><MaterialSymbol className="text-[16px] text-black/35" name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a file" className="w-full bg-transparent text-[13px] outline-none" /></label>
              <select value={layer} onChange={(e) => setLayer(e.target.value)} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[12.5px] text-[var(--primary)] outline-none" aria-label="File type">
                <option value="all">All</option>
                {allLayers.filter((l) => counts[l.id]).map((l) => <option key={l.id} value={l.id}>{l.name} · {counts[l.id]}</option>)}
              </select>
            </div>
            {lesson ? (
              <button type="button" onClick={() => setOnly((v) => !v)} className={cn("flex items-center gap-1.5 justify-self-start rounded-full px-2.5 py-1 text-[12px] font-semibold", only ? "bg-[var(--primary)] text-white" : "text-black/50 ring-1 ring-black/10")}>
                {only ? <>Lesson {lesson.code} only<MaterialSymbol className="text-[14px]" name="close" /></> : <>Show lesson {lesson.code} only</>}
              </button>
            ) : null}

            <nav className="grid max-h-[68vh] min-w-0 content-start gap-0.5 overflow-y-auto overflow-x-hidden pr-3" aria-label="Kit files">
              <button type="button" onClick={() => setView(null)} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-semibold", !view ? "bg-[var(--primary)] text-white" : "text-[var(--primary)] hover:bg-black/[0.04]")}><MaterialSymbol className="text-[16px]" name="menu_book" />How to use this kit</button>

              {mode === "folder" ? folders.map(([folder, list]) => (
                <div key={folder} className="grid gap-0.5 pt-3">
                  <span className="px-2 pb-1 text-[11px] font-semibold text-black/40">{folder}</span>
                  {list.map((f) => row(f))}
                </div>
              )) : (
                <>
                  {rootFiles.length ? <div className="grid gap-0.5 pt-3"><span className="px-2 pb-1 text-[11px] font-semibold text-black/40">Project root</span>{rootFiles.map((f) => row(f))}</div> : null}
                  {stageWide.length ? (
                    <div className="grid gap-0.5">
                      <button type="button" onClick={() => setWideOpen((v) => !v)} className="flex items-center gap-1 rounded-md px-2 py-1 text-left text-[12.5px] text-black/55 hover:bg-black/[0.04]">
                        <MaterialSymbol className={cn("text-[15px] transition-transform", (wideOpen || filtering) && "rotate-90")} name="chevron_right" />Whole stage<span className="ml-auto font-mono text-[11px] text-black/35">{stageWide.length}</span>
                      </button>
                      {wideOpen || filtering || stageWide.some((f) => f.path === view?.path) ? stageWide.map((f) => row(f, true)) : null}
                    </div>
                  ) : null}
                  {days.map((d) => {
                    const ls = d.lessons.filter((l) => perLesson[l.fid]?.length && (!only || !lesson || l.fid === lesson.fid));
                    if (!ls.length) return null;
                    return (
                      <div key={d.day} className="grid gap-0.5 pt-3">
                        <span className={cn("px-2 pb-1 text-[11px] font-semibold", d.day === currentDay ? "text-[var(--electric-pink)]" : "text-black/40")}>Day {d.day} · {d.title}</span>
                        {ls.map((l) => {
                          const list = perLesson[l.fid];
                          const isOpen = filtering || openLessons.includes(l.fid) || list.some((f) => f.path === view?.path);
                          return (
                            <div key={l.fid} className="grid gap-0.5">
                              <button type="button" onClick={() => toggle(l.fid)} className="flex items-center gap-1 rounded-md px-2 py-1 text-left text-[13px] text-[var(--primary)] hover:bg-black/[0.04]">
                                <MaterialSymbol className={cn("text-[15px] text-black/40 transition-transform", isOpen && "rotate-90")} name="chevron_right" />
                                <span className="truncate">{l.title}</span><span className="ml-auto pl-2 font-mono text-[11px] text-black/35">{list.length}</span>
                              </button>
                              {isOpen ? list.map((f) => row(f, true)) : null}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
              {!shown.length ? <p className="px-2 py-6 text-[13px] text-black/45">No files match.</p> : null}
            </nav>
            <button type="button" onClick={() => setMode(mode === "lesson" ? "folder" : "lesson")} className="justify-self-start px-2 text-[12px] text-black/45 hover:text-[var(--primary)]">{mode === "lesson" ? "View by folder" : "View by lesson"}</button>
          </aside>

          {/* the guide, or a file */}
          <section className="min-w-0 border-black/[0.06] lg:border-l lg:pl-8">
            {view ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid min-w-0 gap-0.5">
                    <span className="text-[12px] text-black/45">{layerOf(view.layer)?.name ?? view.layer} · {view.title}</span>
                    <b className="truncate font-mono text-[15px] text-[var(--primary)]">{view.path}</b>
                  </div>
                  <span className="flex gap-1">
                    <button type="button" onClick={() => void navigator.clipboard.writeText(view.body).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })} className="flex size-8 items-center justify-center rounded-lg text-black/50 hover:bg-black/[0.05] hover:text-[var(--primary)]" title="Copy" aria-label="Copy"><MaterialSymbol className="text-[17px]" name={copied ? "check" : "content_copy"} /></button>
                  </span>
                </div>
                {layerOf(view.layer)?.tools ? <p className="text-[12.5px] leading-5 text-[var(--on-surface-variant)]">{layerOf(view.layer)?.tools}</p> : null}
                {meta?.uses.length ? (
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-black/45">Used in
                    {meta.uses.slice(0, 6).map((fid) => lessons[fid]).filter(Boolean).map((l) => <Link key={l.fid} href={`/dashboard/roadmap/day/${l.day}`} className="text-[var(--primary)] underline-offset-2 hover:underline">Day {l.day} · {l.title}</Link>)}
                    {meta.uses.length > 6 ? <span>+{meta.uses.length - 6}</span> : null}
                  </p>
                ) : null}
                <div className={cn("border-t border-black/[0.06] pt-4 transition-opacity", loading && "opacity-50")}><MdView body={view.body} /></div>
              </div>
            ) : (
              <KitGuide stage={stage} layers={allLayers} counts={counts} runCommand={runCommand} onLayer={(id) => { setLayer(id); setMode("folder"); }} onOpen={(p) => void open(p)} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
