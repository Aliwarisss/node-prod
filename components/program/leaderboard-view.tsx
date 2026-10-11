"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { TIER_COLORS, type RankRow, type Seasons } from "@/lib/program/gamification";
import { cn } from "@/lib/utils";

import { GameAvatar, Medal, TitleText } from "./game-ui";

const initialsOf = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "N";
const PODIUM = ["#d4a017", "#94a3b8", "#b0723d"];
/* the steps' metal: a lit top face, then the colour falling into shadow */
const METAL = [
  "linear-gradient(180deg, #ffe08a 0%, #d4a017 18%, #8a6608 100%)",
  "linear-gradient(180deg, #f1f5f9 0%, #94a3b8 18%, #4b5563 100%)",
  "linear-gradient(180deg, #f3c08f 0%, #b0723d 18%, #6b4020 100%)",
];
/* dust in the spotlight — fixed spots, so the server and the browser draw the same */
const DUST = [[18, 70, 0], [27, 58, 2.1], [36, 80, 4.4], [44, 64, 1.2], [52, 76, 3.3], [58, 60, 5.2], [64, 72, 0.6], [71, 66, 2.8], [80, 78, 4.9], [48, 88, 6.1]];

/* The leaderboard: a podium on a lit stage for the top three, the season beside it, then everyone — by XP this season or all time */
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export function LeaderboardView({ all, week, me, isAdmin, seasons }: { all: RankRow[]; week: RankRow[]; me: string; isAdmin: boolean; seasons: Seasons }) {
  const [tab, setTab] = useState<"all" | "week">("week");
  const left = seasons.current.daysLeft;
  const nameOf = (id: string) => [...all, ...week].find((r) => r.id === id);
  const rows = tab === "all" ? all : week;
  const mine = rows.find((r) => r.id === me);
  const score = (r: RankRow) => (tab === "all" ? r.xp : r.week);
  const top = rows.slice(0, 3);
  const lead = Math.max(1, rows[0] ? score(rows[0]) : 1);

  return (
    <div className="grid">
      {/* ---------- the stage: full width, from the sidebar to the edge ---------- */}
      <section className="relative -mx-4 -mt-5 overflow-hidden bg-[#07090d] text-white sm:-mx-6">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(212,160,23,.22), transparent 70%), radial-gradient(ellipse 40% 50% at 15% 100%, rgba(233,30,99,.16), transparent 70%), radial-gradient(ellipse 40% 50% at 90% 90%, rgba(79,209,197,.12), transparent 70%)" }} />
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          {[-22, 0, 22].map((a, i) => <span key={a} className="lb-beam" style={{ "--a": `${a}deg`, animationDelay: `${i * -3}s`, opacity: a ? 0.6 : 1 } as CSSProperties} />)}
          {DUST.map(([x, y, w], i) => <span key={i} className="lb-dust" style={{ left: `${x}%`, top: `${y}%`, "--w": `${w}s`, "--d": `${6 + (i % 3)}s` } as CSSProperties} />)}
          {/* the floor's glow */}
          <div className="absolute inset-x-0 bottom-0 h-56" style={{ background: "radial-gradient(ellipse 45% 70% at 50% 100%, rgba(255,214,102,.28), transparent 70%)" }} />
        </div>

        <div className="relative grid gap-6 px-4 pt-7 sm:px-8 sm:pt-9">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid gap-1.5">
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#ffd666]">Leaderboard · Copy, Paste, Go</span>
              <h1 className="font-heading text-[clamp(1.6rem,3vw,2.4rem)] font-black uppercase leading-none tracking-[-0.04em]">Who’s leading the cohort</h1>
              <p className="max-w-xl text-[13px] text-white/55">Ranked by XP — lessons, days, stages, approved work, grades and practice. {isAdmin ? "You see everyone, including trainees who’ve hidden themselves." : "You can hide yourself from others in your profile."}</p>
            </div>
            <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1 backdrop-blur">
              {([["week", "This season"], ["all", "All time"]] as const).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={cn("rounded-full px-4 py-1.5 text-[12.5px] font-bold transition-colors", tab === id ? "bg-white text-[#07090d]" : "text-white/60 hover:text-white")}>{label}</button>
              ))}
            </div>
          </header>

          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* the podium: second, first, third — on steps that run to the floor */}
            <ol className="mx-auto grid w-full max-w-[700px] grid-cols-3 items-end gap-2 pt-4 sm:gap-4">
              {[1, 0, 2].map((i) => {
                const r = top[i];
                const place = i + 1;
                const step = ["h-[150px] sm:h-[200px]", "h-[115px] sm:h-[155px]", "h-[100px] sm:h-[135px]"][i];
                const size = place === 1 ? 84 : 64;
                return (
                  <li key={place} className="grid justify-items-center gap-2 text-center">
                    {r ? (
                      <>
                        {place === 1 ? <MaterialSymbol className="-mb-1 text-[30px] text-[#ffd666] drop-shadow-[0_0_14px_rgba(255,214,102,.7)]" filled name="emoji_events" /> : null}
                        <Link href={`/dashboard/u/${r.id}`} className="pop-in rounded-[28%]" style={{ boxShadow: `0 0 0 3px ${PODIUM[i]}, 0 0 36px ${PODIUM[i]}88` }}><GameAvatar initials={initialsOf(r.name)} frame={r.frame} level={r.level} size={size} /></Link>
                        <Link href={`/dashboard/u/${r.id}`} className="grid min-w-0 max-w-full leading-tight">
                          <span className="truncate text-[13.5px] font-bold hover:underline">{r.name}{r.id === me ? <span className="ml-1 text-[11px] text-[#ff7aa8]">you</span> : null}</span>
                          <span className="truncate text-[11.5px] text-white/50"><TitleText title={r.title} fx={r.titleFx} /></span>
                        </Link>
                        <span className="rounded-full px-2.5 py-0.5 font-mono text-[12px] font-bold" style={{ background: place === 1 ? "#ffd666" : "rgba(255,255,255,.12)", color: place === 1 ? "#07090d" : "#fff" }}>{score(r).toLocaleString("en-US")} XP</span>
                      </>
                    ) : (
                      <>
                        <span className="grid place-items-center rounded-[28%] border-2 border-dashed border-white/20 text-white/30" style={{ width: size, height: size }}><MaterialSymbol className="text-[24px]" name="person_add" /></span>
                        <span className="text-[12.5px] font-semibold text-white/40">Open spot</span>
                        <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-[12px] text-white/35">— XP</span>
                      </>
                    )}
                    <span className={cn("lb-step relative mt-1 grid w-full place-items-start justify-items-center overflow-hidden rounded-t-[18px] pt-4 sm:pt-5", step)} style={{ background: r ? METAL[i] : "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.03))", animationDelay: `${[0.15, 0, 0.3][i]}s`, boxShadow: r ? `0 -10px 40px -10px ${PODIUM[i]}aa` : undefined }}>
                      <span className="absolute inset-x-0 top-0 h-px bg-white/60" />
                      <span className={cn("font-heading text-[40px] font-black leading-none sm:text-[54px]", r ? "text-white/95 [text-shadow:0_2px_12px_rgba(0,0,0,.35)]" : "text-white/15")}>{place}</span>
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* the season, beside the podium */}
            <aside className="order-first grid content-start gap-4 rounded-[22px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-md lg:order-none lg:mb-24 lg:self-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#4fd1c5]">Season · week of {fmtDay(seasons.current.start)}</span>
              <div className="grid gap-2">
                <span className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-3 py-1 text-[12.5px] font-bold shadow-lg shadow-pink-500/30"><MaterialSymbol className="text-[16px]" name="timer" />{left <= 1 ? "Last day" : `${left} days left`}</span>
                <b className="text-[17px] leading-tight">Top the week to be crowned</b>
                <span className="text-[12.5px] leading-5 text-white/55">The weekly board resets every Monday. The winner is <b className="text-white">Champion of the week</b>; the top three wear a shining title all next week.</span>
              </div>
              <div className="grid gap-2 border-t border-white/10 pt-4">
                <span className="text-[11.5px] font-semibold text-white/45">{seasons.last ? <>Last week’s champions · {fmtDay(seasons.last.start)}–{fmtDay(new Date(new Date(seasons.last.end).getTime() - 86_400_000).toISOString())}</> : "Last week’s champions"}</span>
                {seasons.last?.top.length ? (
                  <ol className="grid gap-1.5">
                    {seasons.last.top.map((x, i) => {
                      const r = nameOf(x.id);
                      return (
                        <li key={x.id} className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-2.5 py-2">
                          <span className="flex size-6 flex-none items-center justify-center rounded-full text-[11px] font-black" style={{ background: PODIUM[i], color: "#07090d" }}>{i === 0 ? <MaterialSymbol className="text-[15px]" name="emoji_events" /> : i + 1}</span>
                          {r ? <GameAvatar initials={initialsOf(r.name)} frame={r.frame} size={28} /> : null}
                          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{x.name}</span>
                          <span className="font-mono text-[11px] text-white/50">{x.xp.toLocaleString("en-US")}</span>
                        </li>
                      );
                    })}
                  </ol>
                ) : <span className="text-[12.5px] text-white/45">The first season is under way — no champions yet.</span>}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------- the standings, rising over the foot of the podium ---------- */}
      <section className="relative z-10 -mt-12 overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_-30px_60px_-30px_rgba(0,0,0,.55)] sm:-mt-16">
        {mine && mine.rank > 3 ? (
          <div className="flex items-center gap-3 bg-[var(--deep-indigo)] px-5 py-3 text-white">
            <b className="font-mono text-[16px]">#{mine.rank}</b>
            <span className="min-w-0 flex-1 text-[13px]">You’re #{mine.rank} of {rows.length}{rows[mine.rank - 2] ? <> — <b>{(score(rows[mine.rank - 2]) - score(mine) + 1).toLocaleString("en-US")} XP</b> to pass {rows[mine.rank - 2].name.split(" ")[0]}</> : null}.</span>
          </div>
        ) : null}
        <div className="grid grid-cols-[36px_minmax(0,1fr)_88px] items-center gap-3 border-b border-black/[0.06] bg-[#f8f9fa] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/40 sm:grid-cols-[48px_minmax(0,1fr)_130px_120px_170px] sm:px-6">
          <span className="text-center">Rank</span><span>Trainee</span><span className="hidden sm:block">Badges</span><span className="hidden sm:block">Where</span><span className="text-right">XP<span className="hidden sm:inline"> · {tab === "all" ? "all time" : "this season"}</span></span>
        </div>
        {!rows.length ? <p className="py-14 text-center text-[13.5px] text-black/45">No one has started yet — the first lesson puts you on the board.</p> : (
          <ol>
            {rows.map((r) => (
              <li key={r.id} className={cn("grid grid-cols-[36px_minmax(0,1fr)_88px] items-center gap-3 border-b border-black/[0.05] px-4 py-3 last:border-0 sm:grid-cols-[48px_minmax(0,1fr)_130px_120px_170px] sm:px-6", r.id === me ? "bg-[#fff6fa] shadow-[inset_3px_0_0_var(--electric-pink)]" : "hover:bg-black/[0.015]")}>
                <span className="flex justify-center">
                  {r.rank <= 3
                    ? <span className="flex size-8 items-center justify-center rounded-full text-[13px] font-black text-white shadow-sm" style={{ background: PODIUM[r.rank - 1] }}>{r.rank}</span>
                    : <span className="font-mono text-[14px] font-bold text-black/45">{r.rank}</span>}
                </span>
                <Link href={`/dashboard/u/${r.id}`} className="flex min-w-0 items-center gap-3">
                  <GameAvatar initials={initialsOf(r.name)} frame={r.frame} size={38} />
                  <span className="grid min-w-0 leading-tight">
                    <span className="flex items-center gap-1.5 truncate text-[14px] font-bold text-[var(--primary)]">{r.name}{r.id === me ? <span className="rounded-full bg-[var(--electric-pink)] px-1.5 text-[10px] text-white">You</span> : null}{r.hidden ? <MaterialSymbol className="text-[14px] text-black/35" name="visibility_off" /> : null}</span>
                    <span className="truncate text-[12px] text-black/50"><TitleText title={r.title} fx={r.titleFx} /> · Level {r.level}{r.wins ? <> · <MaterialSymbol className="align-[-3px] text-[14px] text-[#d4a017]" name="emoji_events" />{r.wins}</> : null}</span>
                  </span>
                </Link>
                <span className="hidden items-center gap-1 sm:flex">{r.featured.map((b) => <Medal key={b.id} b={b} size={24} />)}{r.badges > r.featured.length ? <span className="text-[11px] text-black/40">+{r.badges - r.featured.length}</span> : null}{!r.badges ? <span className="text-[12px] text-black/30">—</span> : null}</span>
                <span className="hidden truncate text-[12px] text-black/50 sm:block">Day {r.day}{r.stage ? ` · ${r.stage}` : ""}</span>
                <span className="grid gap-1">
                  <b className="text-right font-mono text-[14px] text-[var(--primary)]">{score(r).toLocaleString("en-US")}<span className="ml-1 text-[11px] text-black/40">XP</span></b>
                  <span className="flex h-1 justify-end overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full" style={{ width: `${Math.round((score(r) / lead) * 100)}%`, background: PODIUM[r.rank - 1] ?? "var(--bridge-teal)" }} /></span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
      <p className="mt-4 flex items-center gap-1.5 text-[12px] text-black/45"><span className="flex gap-1">{[1, 2, 3].map((t) => <span key={t} className="size-2.5 rounded-full" style={{ background: TIER_COLORS[t] }} />)}</span>Badge rings show the tier — bronze, silver, gold.</p>
    </div>
  );
}
