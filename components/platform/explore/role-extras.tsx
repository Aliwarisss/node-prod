"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { roleById, type Kind } from "@/lib/explore";
import { coverageFor, roleJourney } from "@/lib/explore/programs";
import { roleRoadmap } from "@/lib/explore/roadmap";
import { cn } from "@/lib/utils";

const kicker = "font-mono text-[11px] font-bold uppercase tracking-[0.16em]";

/* ---------- where Node teaches a skill or subject ---------- */
export function ProgramLinks({ kind, id }: { kind: Kind; id: string }) {
  if (kind !== "skill" && kind !== "subject") return null;
  const list = coverageFor(kind, id);
  if (!list.length) return null;
  return (
    <div className="grid gap-2.5">
      <span className={cn(kicker, "text-black/45")}>Learn it at Node</span>
      <div className="grid gap-1.5">
        {list.map((c) => (
          <Link key={c.label + c.where} href={c.href} className="flex items-center gap-3 rounded-2xl border border-black/[0.07] p-3 hover:border-black/25" style={{ borderLeft: `3px solid ${c.color}` }}>
            <span className="grid min-w-0 flex-1"><b className="text-[14px]">{c.label}</b><span className="text-[12.5px] text-black/55">{c.where}</span></span>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold", c.status === "live" ? "bg-[#fdecf2] text-[#a3104a]" : "bg-black/[0.05] text-black/45")}>{c.status === "live" ? "Live now" : "Coming soon"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- a role's roadmap, in short — with a link to the full plan ---------- */
export function RoadmapSummary({ roleId }: { roleId: string }) {
  const r = roleRoadmap(roleId);
  if (!r) return null;
  return (
    <div className="grid gap-2.5">
      <span className={cn(kicker, "text-black/45")}>Learning roadmap</span>
      <Link href={`/explore/roadmap/${roleId}`} className="group grid gap-3 rounded-2xl bg-[#0d1117] p-4 text-white">
        <span className="flex items-baseline justify-between gap-2"><b className="text-[15px]">{r.steps.length} steps · about {r.months} month{r.months === 1 ? "" : "s"}</b><span className="text-[11.5px] text-white/50">at ~10 h a week</span></span>
        <span className="flex gap-1.5">
          {r.stages.map((st) => (
            <span key={st.level} className="grid flex-1 gap-1 rounded-xl bg-white/[0.06] p-2" style={{ flexGrow: Math.max(1, st.weeks) }}>
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#4fd1c5]">{st.name}</span>
              <span className="text-[11.5px] text-white/60">{st.steps.length} steps</span>
            </span>
          ))}
        </span>
        <span className="flex items-center gap-1 text-[12.5px] font-bold text-[#4fd1c5] transition-all group-hover:gap-2">Open the full roadmap<MaterialSymbol className="text-[16px]" name="arrow_forward" /></span>
      </Link>
    </div>
  );
}

/* ---------- the Node programs along a role's journey ---------- */
export function RoleJourney() {
  return (
    <div className="grid gap-2.5">
      <span className={cn(kicker, "text-black/45")}>Your path at Node</span>
      <ol className="grid gap-1.5">
        {roleJourney.map((p, i) => (
          <li key={p.label}><Link href={p.href} className="flex items-center gap-3 rounded-2xl border border-black/[0.07] p-3 hover:border-black/25">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[11.5px] font-bold text-white" style={{ background: p.color }}>{i + 1}</span>
            <span className="grid min-w-0 flex-1"><b className="text-[14px]">{p.label}</b><span className="text-[12.5px] text-black/55">{p.where}</span></span>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold", p.status === "live" ? "bg-[#fdecf2] text-[#a3104a]" : "bg-black/[0.05] text-black/45")}>{p.status === "live" ? "Live now" : "Soon"}</span>
          </Link></li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- ask a mentor about a role: on the board, or in a live session ---------- */
type ReqState = { signedIn: boolean; count: number; mine: boolean; poll: { id: string; status: string; open: boolean; day: number } | null };
export function AskMentor({ roleId }: { roleId: string }) {
  const role = roleById.get(roleId);
  const topic = `role:${roleId}`;
  const [s, setS] = useState<ReqState | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [here, setHere] = useState("/explore"); // where to come back to after signing in — read once on screen
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => { if (live) setHere(window.location.pathname + window.location.search); }, 0);
    fetch(`/api/explore/session-request?topic=${encodeURIComponent(topic)}`).then((r) => r.json()).then((d) => { if (live && typeof d.count === "number") setS(d); }).catch(() => {});
    return () => { live = false; clearTimeout(t); };
  }, [topic]);
  if (!role) return null;

  const boardHref = `/dashboard/board?new=1&title=${encodeURIComponent(`Ask a mentor: becoming a ${role.name.toLowerCase()}`)}&body=${encodeURIComponent(`I’m exploring the ${role.name} role (${role.line})\n\nMy question: `)}`;
  async function request(withdraw = false) {
    setBusy(true); setErr("");
    const r = await fetch("/api/explore/session-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, withdraw }) }).catch(() => null);
    const d = await r?.json().catch(() => null);
    if (r?.ok && d) setS((cur) => cur && { ...cur, count: d.count, mine: d.mine }); else setErr(d?.error ?? "Couldn’t send that — try again.");
    setBusy(false);
  }

  return (
    <div className="grid gap-2.5">
      <span className={cn(kicker, "text-black/45")}>Ask a mentor</span>
      <div className="grid gap-2 rounded-2xl border border-[#6d48d8]/20 bg-[#f6f3ff] p-4">
        <p className="text-[13.5px] leading-5 text-black/70">Talk to someone who does this job — ask on the board, or get a live session on it.</p>
        <div className="flex flex-wrap gap-2">
          <Link href={s && !s.signedIn ? `/login?callbackUrl=${encodeURIComponent(boardHref)}` : boardHref} className="flex items-center gap-1.5 rounded-full bg-[#6d48d8] px-3.5 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[17px]" name="forum" />Ask on the board</Link>
          {!s ? <span className="h-9 w-40 animate-pulse rounded-full bg-black/[0.06]" />
            : s.poll?.open ? <Link href="/dashboard" className="flex items-center gap-1.5 rounded-full bg-[#0d1117] px-3.5 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[17px]" name="how_to_vote" />Vote for a session time</Link>
            : s.poll?.status === "scheduled" ? <Link href={`/dashboard/roadmap/day/${s.poll.day}`} className="flex items-center gap-1.5 rounded-full bg-[#0d1117] px-3.5 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[17px]" name="event_available" />See the session</Link>
            : !s.signedIn ? <Link href={`/login?callbackUrl=${encodeURIComponent(here)}`} className="flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 py-2 text-[12.5px] font-bold"><MaterialSymbol className="text-[17px]" name="videocam" />Request a live session</Link>
            : s.mine ? <button type="button" disabled={busy} onClick={() => void request(true)} className="flex items-center gap-1.5 rounded-full border border-[#007373] bg-white px-3.5 py-2 text-[12.5px] font-bold text-[#007373]"><MaterialSymbol className="text-[17px]" filled name="check_circle" />Requested · undo</button>
            : <button type="button" disabled={busy} onClick={() => void request()} className="flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 py-2 text-[12.5px] font-bold hover:border-black/40"><MaterialSymbol className="text-[17px]" name="videocam" />Request a live session</button>}
        </div>
        {s ? <span className="text-[12px] text-black/50">{s.poll?.open ? "A session on this role is being scheduled — pick the times that suit you." : s.poll?.status === "scheduled" ? "A session on this role is booked." : s.count ? `${s.count} ${s.count === 1 ? "person has" : "people have"} asked — a mentor opens a time poll when enough do.` : "Be the first to ask — a mentor opens a time poll when enough people do."}</span> : null}
        {err ? <span className="text-[12px] text-[#a3104a]">{err}</span> : null}
      </div>
    </div>
  );
}
