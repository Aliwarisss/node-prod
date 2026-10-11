"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import { TIER_COLORS, TIER_NAMES, type Badge, type Frame, type Game } from "@/lib/program/gamification";
import { cn } from "@/lib/utils";

const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";

/* an avatar in its frame (a reward of your level), with the level on a pip */
export function GameAvatar({ initials, frame, level, size = 80, className }: { initials: string; frame: Pick<Frame, "ring" | "name" | "animated">; level?: number; size?: number; className?: string }) {
  const plain = frame.ring === "transparent";
  return (
    <span className={cn("relative inline-flex flex-none", className)} style={{ width: size, height: size }} title={`${frame.name} frame`}>
      <span className="absolute inset-0 overflow-hidden rounded-[28%]"><span className={cn("absolute -inset-1/4", frame.animated && "frame-spin")} style={{ background: plain ? "transparent" : frame.ring }} /></span>
      <span className="absolute flex items-center justify-center rounded-[26%] bg-[var(--electric-pink)] font-black tracking-[0.04em] text-white" style={{ inset: plain ? 0 : Math.max(3, size * 0.05), fontSize: size * 0.32 }}>{initials}</span>
      {level ? <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-[#0d1117] px-1.5 text-[10.5px] font-black leading-[16px] text-white">{level}</span> : null}
    </span>
  );
}

/* a badge as a medallion: its colour inside, its tier (bronze · silver · gold) as the ring */
export function Medal({ b, size = 44, dim }: { b: Pick<Badge, "icon" | "color" | "tier" | "name">; size?: number; dim?: boolean }) {
  const on = b.tier > 0 && !dim;
  return (
    <span className="relative inline-flex flex-none items-center justify-center rounded-full" style={{ width: size, height: size, background: on ? TIER_COLORS[b.tier] : "#eceef0" }} title={b.name}>
      <span className="flex items-center justify-center rounded-full" style={{ width: size - 6, height: size - 6, background: on ? b.color : "#f6f7f8" }}>
        <MaterialSymbol className={on ? "text-white" : "text-black/25"} name={on ? b.icon : "lock"} style={{ fontSize: size * 0.45 }} />
      </span>
    </span>
  );
}

export function LevelBar({ g, dark }: { g: Game; dark?: boolean }) {
  return (
    <span className="grid gap-1">
      <span className={cn("flex items-baseline justify-between text-[11.5px]", dark ? "text-white/60" : "text-black/50")}><span>Level {g.level.level} · {g.xp.toLocaleString("en-US")} XP</span><span>{(g.level.to - g.xp).toLocaleString("en-US")} XP to level {g.level.level + 1}</span></span>
      <span className={cn("block h-2 overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-black/[0.07]")}><span className="block h-full rounded-full bg-gradient-to-r from-[#4fd1c5] to-[var(--electric-pink)] transition-[width] duration-700" style={{ width: `${g.level.pct}%` }} /></span>
    </span>
  );
}

/* a title — last week's top three wear it shining */
export function TitleText({ title, fx, className }: { title: string; fx?: "shine" | null; className?: string }) {
  return <span className={cn(fx === "shine" && "title-shine font-black", className)} title={fx === "shine" ? "Top three last week" : undefined}>{title}</span>;
}

/* ---------- badges & rewards: everything earned, what's next, and how you show up (editable for yourself) ---------- */
export function GamePanel({ game: initial, rank, editable, showRecent = true }: { game: Game; rank?: { rank: number; of: number } | null; editable?: boolean; showRecent?: boolean }) {
  const { pushToast } = useToast();
  const router = useRouter();
  const [g, setG] = useState(initial);
  const [busy, setBusy] = useState(false);
  const earnedTitles = g.titles.filter((t) => t.earned);

  async function save(body: { title?: string; featured?: string[]; hideRank?: boolean; frame?: string }) {
    setBusy(true);
    try {
      const r = await fetch("/api/program/game", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = (await r.json().catch(() => ({}))) as { error?: string; title?: string; featured?: string[]; hideRank?: boolean; frame?: string };
      if (!r.ok) throw new Error(d.error ?? "Couldn’t save.");
      setG((cur) => ({ ...cur, title: d.title ?? cur.title, hideRank: d.hideRank ?? cur.hideRank, frame: cur.frames.find((f) => f.id === d.frame) ?? cur.frame, featured: (d.featured ?? []).map((id) => cur.badges.find((b) => b.id === id)!).filter(Boolean) }));
      pushToast({ variant: "success", title: "Saved", description: "That’s how you show up now." });
      window.dispatchEvent(new Event("node:badges"));
      router.refresh(); // the header, the sidebar and the leaderboard pick it up
    } catch (e) {
      pushToast({ variant: "error", title: "Not saved", description: e instanceof Error ? e.message : "Try again." });
    } finally { setBusy(false); }
  }
  const toggleFeatured = (id: string) => {
    const cur = g.featured.map((b) => b.id);
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-3);
    void save({ featured: next });
  };
  const groups: [string, Badge[]][] = [["Milestones & skills", g.badges.filter((b) => !b.stage)], ["Stages", g.badges.filter((b) => b.stage)]];

  return (
    <div className="grid gap-5">
      {/* level, title, rank, next reward */}
      <section className="grid gap-4 rounded-[22px] border border-black/[0.06] bg-white p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-3">
          <span className={cn(kicker, "text-[9.5px] text-black/45")}>Level & title</span>
          <div className="flex items-baseline gap-3"><b className="text-[40px] font-black leading-none text-[var(--primary)]">{g.level.level}</b><span className="grid leading-tight"><b className="text-[16px] text-[var(--primary)]"><TitleText title={g.title} fx={g.titleFx} /></b><span className="text-[12px] text-black/50">{g.xp.toLocaleString("en-US")} XP · {g.week.toLocaleString("en-US")} this week</span></span></div>
          <LevelBar g={g} />
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--primary)]">
            <span className="flex items-center gap-1.5"><MaterialSymbol className="text-[18px] text-[#ea580c]" name="local_fire_department" /><b>{g.streak}</b> day{g.streak === 1 ? "" : "s"} streak</span>
            <span className="flex items-center gap-1 text-black/55" title="One missed day a week doesn’t break your streak"><MaterialSymbol className={cn("text-[17px]", g.shield.usedThisWeek ? "text-black/30" : "text-[#0284c7]")} name="shield" />{g.shield.usedThisWeek ? "Shield used this week" : "Shield ready"}{g.shield.savedDays ? ` · saved ${g.shield.savedDays}×` : ""}</span>
          </span>
          {g.season && (g.season.wins || g.season.lastWeek) ? <span className="flex items-center gap-1.5 text-[13px] text-[var(--primary)]"><MaterialSymbol className="text-[18px] text-[#d4a017]" name="emoji_events" />{g.season.lastWeek ? <>#{g.season.lastWeek.rank} last week</> : null}{g.season.wins ? <>{g.season.lastWeek ? " · " : ""}{g.season.wins} week{g.season.wins === 1 ? "" : "s"} won</> : null}</span> : null}
          {rank ? <span className="flex items-center gap-1.5 text-[13px] text-[var(--primary)]"><MaterialSymbol className="text-[18px] text-[#d4a017]" name="leaderboard" /><b>#{rank.rank}</b> of {rank.of} on the leaderboard{g.hideRank ? <span className="text-black/45"> · hidden from others</span> : null}</span> : null}
        </div>
        <div className="grid content-start gap-2">
          <span className={cn(kicker, "text-[9.5px] text-black/45")}>Rewards · avatar frames{editable ? " · pick one" : ""}</span>
          <div className="flex flex-wrap gap-3">
            {g.frames.map((f) => {
              const on = g.frame.id === f.id;
              const inner = (
                <>
                  <span className={cn("rounded-[30%] p-0.5", on && "ring-2 ring-[var(--primary)] ring-offset-2")}><GameAvatar initials="" frame={f} size={40} /></span>
                  <span className="max-w-[64px] truncate text-[10.5px] font-semibold text-black/55">{f.unlocked ? f.name : f.level ? `Lv ${f.level}` : f.name}</span>
                </>
              );
              return editable && f.unlocked ? (
                <button key={f.id} type="button" disabled={busy || on} onClick={() => void save({ frame: f.id })} title={`${f.name} — ${f.how}`} className="grid justify-items-center gap-1 text-center">{inner}</button>
              ) : (
                <span key={f.id} className={cn("grid justify-items-center gap-1 text-center", !f.unlocked && "opacity-35")} title={f.unlocked ? `${f.name} — unlocked` : `${f.name} — ${f.how}`}>{inner}</span>
              );
            })}
          </div>
          {g.nextFrame ? <span className="text-[12px] text-black/50">Next: the <b className="text-[var(--primary)]">{g.nextFrame.name}</b> frame — {g.nextFrame.how.toLowerCase()}. Special frames come from streaks, perfect scores, stages and weekly wins.</span> : <span className="text-[12px] text-black/50">Every level frame unlocked.</span>}
        </div>
      </section>

      {/* how you show up */}
      {editable ? (
        <section className="grid gap-3 rounded-[22px] border border-black/[0.06] bg-white p-5">
          <span className={cn(kicker, "text-[9.5px] text-black/45")}>How you show up</span>
          <div className="grid gap-1.5">
            <span className="text-[12.5px] font-bold text-[var(--primary)]">Your title</span>
            <div className="flex flex-wrap gap-1.5">
              {g.titles.map((t) => (
                <button key={t.id} type="button" disabled={!t.earned || busy} title={t.how} onClick={() => void save({ title: t.id })} className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold", g.title === t.label && t.earned ? "bg-[var(--primary)] text-white" : t.earned ? "bg-[#f1f2f3] text-[var(--primary)] hover:bg-[#e8eaec]" : "bg-transparent text-black/35 ring-1 ring-dashed ring-black/10")}>
                  {!t.earned ? <MaterialSymbol className="text-[13px]" name="lock" /> : null}{t.label}
                </button>
              ))}
            </div>
            <span className="text-[11.5px] text-black/45">{earnedTitles.length} of {g.titles.length} earned — level titles come with XP, stage titles when you clear a stage.</span>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[var(--primary)]">
            <input type="checkbox" checked={!g.hideRank} disabled={busy} onChange={(e) => void save({ hideRank: !e.target.checked })} className="size-4 accent-[var(--bridge-teal)]" />
            Show me on the leaderboard
          </label>
        </section>
      ) : null}

      {/* badges */}
      {groups.map(([label, list]) => (
        <section key={label} className="grid gap-3 rounded-[22px] border border-black/[0.06] bg-white p-5">
          <span className="flex flex-wrap items-baseline justify-between gap-2"><span className={cn(kicker, "text-[9.5px] text-black/45")}>{label}</span><span className="text-[12px] text-black/45">{list.filter((b) => b.earned).length} of {list.length}{editable && label !== "Stages" ? " · pick up to 3 to show by your name" : ""}</span></span>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {list.map((b) => {
              const feat = g.featured.some((x) => x.id === b.id);
              return (
                <li key={b.id} className={cn("relative grid justify-items-center gap-1.5 rounded-2xl border p-3 text-center", b.earned ? "border-black/[0.06]" : "border-dashed border-black/10 bg-[#fafafa]")}>
                  {editable && b.earned ? (
                    <button type="button" disabled={busy} onClick={() => toggleFeatured(b.id)} title={feat ? "Shown by your name — click to remove" : "Show by your name"} className={cn("absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full", feat ? "bg-[#fff3c4] text-[#a16207]" : "text-black/20 hover:text-black/50")}><MaterialSymbol className="text-[15px]" name={feat ? "star" : "star_outline"} /></button>
                  ) : null}
                  <Medal b={b} size={48} />
                  <b className={cn("text-[12.5px] leading-tight", b.earned ? "text-[var(--primary)]" : "text-black/45")}>{b.name}</b>
                  {b.tier && b.tiers ? <span className="rounded-full px-1.5 text-[10px] font-black uppercase tracking-[0.06em] text-white" style={{ background: TIER_COLORS[b.tier] }}>{TIER_NAMES[b.tier]}</span> : null}
                  <span className="text-[10.5px] leading-4 text-black/45">{b.desc}</span>
                  {b.tiers ? (
                    b.next != null ? (
                      <span className="grid w-full gap-0.5">
                        <span className="block h-1 overflow-hidden rounded-full bg-black/[0.07]"><span className="block h-full rounded-full" style={{ width: `${Math.min(100, (b.value / b.next) * 100)}%`, background: b.color }} /></span>
                        <span className="text-[10px] text-black/40">{b.value}/{b.next} {b.unit} · {TIER_NAMES[b.tier + 1]} next</span>
                      </span>
                    ) : <span className="text-[10px] font-bold text-[#a16207]">Maxed · {b.value} {b.unit}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* where the XP came from — for yourself and admins */}
      {showRecent ? <section className="grid gap-2 rounded-[22px] border border-black/[0.06] bg-white p-5">
        <span className={cn(kicker, "text-[9.5px] text-black/45")}>Recent XP</span>
        {g.recent.length ? (
          <ul className="grid">
            {g.recent.map((e, i) => <li key={i} className="flex items-center gap-3 border-b border-black/[0.05] py-1.5 text-[13px] last:border-0"><b className="w-14 flex-none text-right font-mono text-[12px] text-[var(--bridge-teal)]">+{e.xp}</b><span className="min-w-0 flex-1 truncate text-[var(--primary)]">{e.label}</span><span suppressHydrationWarning className="text-[11px] text-black/40">{e.at ? new Date(e.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</span></li>)}
          </ul>
        ) : <p className="text-[13px] text-black/45">Finish a lesson or hand in a task to earn your first XP.</p>}
        <p className="text-[11.5px] text-black/40">XP: lesson 50 · day 100 · stage 300 · hand-in 10 · approved 20 + up to 10 for the grade · right first time 15 · perfect 25 · fixed and approved 10 · each active day 5 · an accepted answer on the board 15 · practice up to 20 a rep.</p>
      </section> : null}
    </div>
  );
}
