import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { GameAvatar, GamePanel, Medal, TitleText } from "@/components/program/game-ui";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { publicTrainee } from "@/lib/program/ranking";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trainee — Node" };

/* A trainee's public profile: their title, level, rank, badges and how far through the stages they are —
   not their grades or their work. Hidden from others if they've stepped off the leaderboard. */
export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await connectToDatabase();
  const isAdmin = session.user.role === "admin";
  const [dbUser, pub] = await Promise.all([UserModel.findById(session.user.id).lean(), publicTrainee(id, session.user.id, isAdmin)]);
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const chrome = (children: React.ReactNode) => <DashboardChrome activeSection="leaderboard" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>{children}</DashboardChrome>;
  if (!hasAccess(dbUser)) return chrome(<FeesPending />);
  if (!pub) notFound();
  const back = <Link href="/dashboard/leaderboard" className="flex items-center gap-1 justify-self-start text-[13px] font-bold text-black/55 hover:text-[var(--primary)]"><MaterialSymbol className="text-[17px]" name="arrow_back" />Leaderboard</Link>;
  if (pub.hidden) return chrome(<div className="grid gap-4">{back}<section className="grid justify-items-center gap-2 py-16 text-center"><MaterialSymbol className="text-[30px] text-black/25" name="visibility_off" /><b className="text-[17px] text-[var(--primary)]">This profile is private</b><p className="text-[13.5px] text-[var(--on-surface-variant)]">They’ve chosen not to show up on the leaderboard.</p></section></div>);

  const t = pub.trainee, g = pub.game;
  const self = id === session.user.id;
  const initials = t.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "N";
  return chrome(
    <div className="grid gap-5">
      {back}
      <section className="flex flex-wrap items-center gap-5 rounded-[26px] bg-[var(--deep-indigo)] p-6 text-white sm:p-8">
        <GameAvatar initials={initials} frame={g.frame} level={g.level.level} size={92} />
        <div className="grid min-w-0 flex-1 gap-1.5">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4fd1c5]"><TitleText title={g.title} fx={g.titleFx} /> · Level {g.level.level}{pub.rank ? ` · #${pub.rank.rank} of ${pub.of}` : ""}{g.season?.wins ? ` · ${g.season.wins}× champion` : ""}</span>
          <h1 className="truncate font-heading text-[clamp(1.6rem,3vw,2.4rem)] font-black uppercase leading-none tracking-[-0.04em]">{t.name}{self ? <span className="ml-2 text-[14px] font-bold normal-case tracking-normal text-white/50">(you)</span> : null}</h1>
          <span className="text-[13px] text-white/60">{g.xp.toLocaleString("en-US")} XP · {g.earned} badges · Day {t.stats.current}{t.stats.project ? ` · ${t.stats.project.client}` : ""}</span>
          <span className="flex gap-1.5 pt-1">{g.featured.map((b) => <Medal key={b.id} b={b} size={34} />)}</span>
        </div>
        <ol className="flex flex-wrap gap-1">
          {t.stats.stages.map((st) => <li key={st.id} title={`${st.name} · ${st.status}`} className="flex size-8 items-center justify-center rounded-lg text-[11px] font-black" style={{ background: st.status === "done" ? st.color : st.status === "active" ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.06)", color: st.status === "upcoming" ? "rgba(255,255,255,.35)" : "white" }}>{st.status === "done" ? <MaterialSymbol className="text-[16px]" name="check" /> : st.n}</li>)}
        </ol>
      </section>
      <GamePanel game={g} rank={pub.rank ? { rank: pub.rank.rank, of: pub.of } : null} showRecent={self || isAdmin} />
    </div>,
  );
}
