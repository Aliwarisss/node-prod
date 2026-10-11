"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { allRoles, nameOf, roleById, type Kind } from "@/lib/explore";
import { closestRoles, roleMatch, roleRoadmap, type Status } from "@/lib/explore/roadmap";
import { cn } from "@/lib/utils";

/* ---------- the store: what you know, are learning or want — saved to your account ---------- */
type MapState = { ready: boolean; signedIn: boolean; items: Record<string, Status>; target: string };
type MapApi = MapState & {
  setStatus: (key: string, status: Status | null) => void;
  setTarget: (roleId: string) => void;
  error: string;
};
const Ctx = createContext<MapApi | null>(null);
export const useMyMap = () => useContext(Ctx);

export function MyMapProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MapState>({ ready: false, signedIn: false, items: {}, target: "" });
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    fetch("/api/explore/my-map").then((r) => r.json()).then((d) => { if (live) setState({ ready: true, signedIn: !!d.signedIn, items: d.items ?? {}, target: d.target ?? "" }); }).catch(() => { if (live) setState((s) => ({ ...s, ready: true })); });
    return () => { live = false; };
  }, []);
  const save = useCallback(async (body: unknown, undo: () => void) => {
    setError("");
    const r = await fetch("/api/explore/my-map", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    if (!r?.ok) { undo(); setError(r?.status === 401 ? "Sign in to save your map." : "Couldn’t save that — try again."); }
  }, []);
  const setStatus = useCallback((key: string, status: Status | null) => {
    setState((s) => {
      const before = s.items[key];
      const items = { ...s.items };
      if (status) items[key] = status; else delete items[key];
      void save({ key, status }, () => setState((cur) => { const back = { ...cur.items }; if (before) back[key] = before; else delete back[key]; return { ...cur, items: back }; }));
      return { ...s, items };
    });
  }, [save]);
  const setTarget = useCallback((roleId: string) => {
    setState((s) => { const before = s.target; void save({ target: roleId }, () => setState((cur) => ({ ...cur, target: before }))); return { ...s, target: roleId }; });
  }, [save]);
  const api = useMemo(() => ({ ...state, setStatus, setTarget, error }), [state, setStatus, setTarget, error]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

const signInHref = () => `/login?callbackUrl=${encodeURIComponent(typeof window === "undefined" ? "/explore" : window.location.pathname + window.location.search)}`;
export const STATUS: Record<Status, { label: string; icon: string; on: string }> = {
  know: { label: "I know it", icon: "check_circle", on: "bg-[#007373] text-white border-[#007373]" },
  learning: { label: "Learning", icon: "autorenew", on: "bg-[#f2b705] text-[#1c1b1b] border-[#f2b705]" },
  want: { label: "Want to learn", icon: "bookmark", on: "bg-[#6d48d8] text-white border-[#6d48d8]" },
};

/* know / learning / want — for one skill or subject */
export function StatusPicker({ kind, id, compact }: { kind: Kind; id: string; compact?: boolean }) {
  const map = useMyMap();
  if (!map || (kind !== "skill" && kind !== "subject")) return null;
  const key = `${kind}:${id}`, cur = map.items[key];
  if (map.ready && !map.signedIn) {
    return <Link href={signInHref()} className="flex w-fit items-center gap-1.5 rounded-full border border-dashed border-black/20 px-3 py-1.5 text-[12.5px] font-semibold text-black/60 hover:border-black/40"><MaterialSymbol className="text-[16px]" name="bookmark_add" />Sign in to track this on your map</Link>;
  }
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="On my map">
      {(Object.keys(STATUS) as Status[]).map((s) => (
        <button key={s} type="button" disabled={!map.ready} onClick={() => map.setStatus(key, cur === s ? null : s)} aria-pressed={cur === s} className={cn("flex items-center gap-1 rounded-full border px-2.5 font-semibold transition-colors disabled:opacity-50", compact ? "py-0.5 text-[11.5px]" : "py-1.5 text-[12.5px]", cur === s ? STATUS[s].on : "border-black/10 bg-white text-black/60 hover:border-black/30")}>
          <MaterialSymbol className={compact ? "text-[14px]" : "text-[16px]"} filled={cur === s} name={STATUS[s].icon} />{compact && s === "want" ? "Want" : STATUS[s].label}
        </button>
      ))}
    </div>
  );
}

/* a ring showing a percentage */
export function Ring({ pct, size = 88, color = "#007373" }: { pct: number; size?: number; color?: string }) {
  const r = size / 2 - 7, c = 2 * Math.PI * r;
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="7" /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: "stroke-dashoffset .5s" }} /></svg>
      <b className="absolute font-heading font-black" style={{ fontSize: Math.round(size / 4.2) }}>{pct}%</b>
    </span>
  );
}

/* ---------- the My map tab ---------- */
export function MyMapTab({ onOpen }: { onOpen: (o: { kind: Kind; id: string }) => void }) {
  const map = useMyMap();
  if (!map || !map.ready) return <div className="h-60 animate-pulse rounded-[26px] bg-black/[0.04]" />;
  if (!map.signedIn) {
    return (
      <section className="grid place-items-center gap-3 rounded-[26px] border border-black/[0.06] bg-white px-6 py-14 text-center">
        <MaterialSymbol className="text-[48px] text-[#6d48d8]" name="map" />
        <b className="font-heading text-[24px] font-black uppercase tracking-[-0.03em]">Build your own map</b>
        <p className="max-w-md text-[14.5px] leading-6 text-black/60">Mark what you know, what you’re learning and what you want to learn — then pick a role and see exactly how far you are from it.</p>
        <Link href={signInHref()} className="rounded-full bg-[#e91e63] px-5 py-3 text-[13px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25">Sign in to start</Link>
        <Link href="/register" className="text-[13px] font-semibold text-black/50 hover:text-black">New here? Create a free account</Link>
      </section>
    );
  }

  const target = map.target ? roleById.get(map.target) : undefined;
  const match = target ? roleMatch(target.id, map.items) : null;
  const closest = closestRoles(map.items, 5);
  const grouped = (Object.keys(STATUS) as Status[]).map((s) => ({ s, keys: Object.entries(map.items).filter(([, v]) => v === s).map(([k]) => k) }));
  const total = Object.keys(map.items).length;
  const next = target ? (roleRoadmap(target.id)?.steps ?? []).filter((st) => !(st.options ?? [st.id]).some((o) => map.items[`${st.kind}:${o}`] === "know")).slice(0, 5) : [];
  const chip = (key: string) => {
    const [kind, id] = key.split(":") as [Kind, string];
    return <button key={key} type="button" onClick={() => onOpen({ kind, id })} className="rounded-full border border-black/10 bg-white px-3 py-1 text-[12.5px] font-semibold hover:border-black/30">{nameOf(kind, id)}</button>;
  };

  return (
    <div className="grid gap-5">
      {map.error ? <p className="rounded-2xl bg-[#fdecf2] px-4 py-3 text-[13px] text-[#8a0f3f]">{map.error}</p> : null}

      {/* the goal */}
      <section className="grid gap-5 rounded-[26px] border border-black/[0.06] bg-white p-6 md:grid-cols-[auto_1fr] md:items-center">
        {match ? <Ring pct={match.pct} size={112} /> : <span className="flex size-[112px] items-center justify-center rounded-full bg-[#f6f7f8]"><MaterialSymbol className="text-[44px] text-black/25" name="flag" /></span>}
        <div className="grid gap-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#007373]">My goal</span>
          <label className="flex flex-wrap items-center gap-2 text-[14px]">
            <span className="font-semibold text-black/60">I want to become</span>
            <select value={map.target} onChange={(e) => map.setTarget(e.target.value)} className="min-w-[220px] rounded-xl border border-black/10 bg-white px-3 py-2 text-[14px] font-bold outline-none focus:border-[#007373]">
              <option value="">— choose a role —</option>
              {allRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          {target && match ? (
            <p className="text-[15px] leading-6 text-black/70">
              {match.skillGap + match.missingSubjects.length === 0
                ? <>You know everything on the <b>{target.name}</b> map. Time to build — and apply.</>
                : <>You’re <b className="text-[#e91e63]">{match.skillGap} skill{match.skillGap === 1 ? "" : "s"}</b> and <b className="text-[#e91e63]">{match.missingSubjects.length} subject{match.missingSubjects.length === 1 ? "" : "s"}</b> away from <b>{target.name}</b>.</>}
            </p>
          ) : <p className="text-[14px] text-black/55">Pick a role to see how close you are, and what to learn next.</p>}
          {target ? <span className="flex flex-wrap gap-2"><Link href={`/explore/roadmap/${target.id}`} className="flex items-center gap-1.5 rounded-full bg-[#0d1117] px-4 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[17px]" name="route" />Open the roadmap</Link><button type="button" onClick={() => onOpen({ kind: "role", id: target.id })} className="rounded-full border border-black/15 px-4 py-2 text-[12.5px] font-bold">About the role</button></span> : null}
        </div>
      </section>

      {target && match && (match.skillGap || match.missingSubjects.length) ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="grid content-start gap-3 rounded-[22px] border border-black/[0.06] bg-white p-5">
            <b className="text-[15px]">Up next on your roadmap</b>
            <ol className="grid gap-2">
              {next.map((st) => (
                <li key={st.n} className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0d1117] font-mono text-[11.5px] font-bold text-white">{st.n}</span>
                  <span className="grid gap-1"><button type="button" onClick={() => onOpen({ kind: st.kind, id: st.id })} className="text-left text-[14px] font-semibold hover:underline">{st.name}</button>{st.options ? <span className="text-[12px] text-black/50">{st.options.map((o) => nameOf("skill", o)).join(" · ")}</span> : null}<StatusPicker kind={st.kind} id={st.id} compact /></span>
                </li>
              ))}
            </ol>
          </section>
          <section className="grid content-start gap-3 rounded-[22px] border border-black/[0.06] bg-white p-5">
            <b className="text-[15px]">The gap</b>
            {match.missingSkills.length ? <div className="grid gap-1.5"><span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/45">Skills to get</span><span className="flex flex-wrap gap-1.5">{match.missingSkills.map((id) => chip(`skill:${id}`))}</span></div> : null}
            {match.missingSubjects.length ? <div className="grid gap-1.5"><span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/45">Subjects to learn</span><span className="flex flex-wrap gap-1.5">{match.missingSubjects.map((id) => chip(`subject:${id}`))}</span></div> : null}
          </section>
        </div>
      ) : null}

      {/* closest roles */}
      {closest.length ? (
        <section className="grid gap-3 rounded-[22px] border border-black/[0.06] bg-white p-5">
          <b className="text-[15px]">Roles you’re closest to</b>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {closest.map(({ role, pct }) => (
              <button key={role.id} type="button" onClick={() => onOpen({ kind: "role", id: role.id })} className="grid gap-2 rounded-2xl border border-black/[0.06] p-3 text-left hover:border-black/20">
                <span className="flex items-center justify-between"><b className="text-[13.5px] leading-tight">{role.name}</b><span className="font-heading text-[18px] font-black text-[#007373]">{pct}%</span></span>
                <span className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full bg-[#007373]" style={{ width: `${pct}%` }} /></span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* everything marked */}
      <section className="grid gap-4 rounded-[22px] border border-black/[0.06] bg-white p-5">
        <span className="flex items-baseline justify-between"><b className="text-[15px]">On my map</b><span className="text-[12.5px] text-black/45">{total} item{total === 1 ? "" : "s"}</span></span>
        {total ? grouped.map(({ s, keys }) => keys.length ? (
          <div key={s} className="grid gap-1.5">
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/45"><MaterialSymbol className="text-[15px]" name={STATUS[s].icon} />{STATUS[s].label} · {keys.length}</span>
            <span className="flex flex-wrap gap-1.5">{keys.map(chip)}</span>
          </div>
        ) : null) : <p className="text-[13.5px] text-black/50">Nothing yet. Open any skill or subject and mark it — “I know it”, “Learning” or “Want to learn”.</p>}
      </section>
    </div>
  );
}
