"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { SKILL_NODES, type Branch } from "@/lib/program/gamification";
import { cn } from "@/lib/utils";

const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";
const TONE: Record<string, string> = { quality: "#c49000", workflow: "#6d48d8", lenses: "#0284c7", decisions: "#c2410c", template: "#be185d", trace: "#0f766e", evidence: "#007373" };

type Rep = { skill: string; seed: number; day: number; questions: { q: string; options: string[] }[] };
type Result = { correct: number; total: number; xp: number; repsLeftWithXp: number; results: { answer: number; chosen: number; why: string }[] };

/* a practice rep: five quick questions on one skill, then the answers with why */
function PracticeRep({ branch, onClose }: { branch: Branch; onClose: (done: boolean) => void }) {
  const [rep, setRep] = useState<Rep | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tone = TONE[branch.key] ?? "#0d1117";

  async function load() {
    setBusy(true); setError(""); setResult(null); setAnswers([]);
    try {
      const r = await fetch(`/api/program/practice?skill=${branch.key}`);
      const d = (await r.json()) as Rep & { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Couldn’t load a rep.");
      setRep(d);
    } catch (e) { setError(e instanceof Error ? e.message : "Try again."); } finally { setBusy(false); }
  }
  async function check() {
    if (!rep) return;
    setBusy(true);
    try {
      const r = await fetch("/api/program/practice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill: rep.skill, seed: rep.seed, day: rep.day, answers: rep.questions.map((_, i) => answers[i] ?? -1) }) });
      const d = (await r.json()) as Result & { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Couldn’t check it.");
      setResult(d);
      window.dispatchEvent(new Event("node:badges"));
    } catch (e) { setError(e instanceof Error ? e.message : "Try again."); } finally { setBusy(false); }
  }
  /* the first rep loads as the drill opens (state is only set once it arrives) */
  useEffect(() => {
    let live = true;
    fetch(`/api/program/practice?skill=${branch.key}`).then(async (r) => {
      const d = (await r.json()) as Rep & { error?: string };
      if (!live) return;
      if (r.ok) setRep(d); else setError(d.error ?? "Couldn’t load a rep.");
    }).catch(() => { if (live) setError("Couldn’t load a rep."); });
    return () => { live = false; };
  }, [branch.key]);

  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={`Practice: ${branch.label}`}>
      <div className="grid max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto rounded-[22px] bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="grid gap-0.5"><span className={cn(kicker, "text-[9.5px]")} style={{ color: tone }}>Practice rep · {branch.label}</span><b className="text-[18px] text-[var(--primary)]">{result ? `${result.correct} of ${result.total} right` : "Five quick questions"}</b></span>
          <button type="button" onClick={() => onClose(!!result)} className="flex size-8 items-center justify-center rounded-full text-black/50 hover:bg-black/[0.05]" aria-label="Close"><MaterialSymbol className="text-[20px]" name="close" /></button>
        </div>
        {error ? <p className="rounded-xl bg-[#fdecf2] px-3 py-2 text-[13px] text-[#8a0f3f]">{error}</p> : null}
        {!rep ? <p className="py-8 text-center text-[13px] text-black/45">Setting up your rep…</p> : (
          <ol className="grid gap-4">
            {rep.questions.map((q, i) => {
              const res = result?.results[i];
              return (
                <li key={i} className="grid gap-2">
                  <b className="flex gap-2 text-[14px] leading-6 text-[var(--primary)]"><span className="font-mono text-[12px] text-black/35">{i + 1}</span>{q.q}</b>
                  <div className="grid gap-1.5 pl-5">
                    {q.options.map((o, k) => {
                      const chosen = (res ? res.chosen : answers[i]) === k, right = res && res.answer === k, wrong = res && chosen && !right;
                      return (
                        <button key={k} type="button" disabled={!!result} onClick={() => setAnswers((a) => { const n = [...a]; n[i] = k; return n; })} className={cn("flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-[13px] leading-5 transition-colors", right ? "border-[var(--bridge-teal)] bg-[#e6f3f3] text-[#005a5a]" : wrong ? "border-[#e91e63]/40 bg-[#fdecf2] text-[#8a0f3f]" : chosen ? "border-[var(--primary)] bg-[#f6f7f8]" : "border-black/10 hover:border-black/25")}>
                          <MaterialSymbol className="mt-px text-[16px]" name={right ? "check_circle" : wrong ? "cancel" : chosen ? "radio_button_checked" : "radio_button_unchecked"} />{o}
                        </button>
                      );
                    })}
                    {res ? <p className="text-[12.5px] leading-5 text-[var(--on-surface-variant)]">{res.why}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] pt-3">
          {result ? (
            <>
              <span className="text-[13px] text-[var(--primary)]">{result.xp ? <><b className="text-[var(--bridge-teal)]">+{result.xp} XP</b> · {result.repsLeftWithXp} more rep{result.repsLeftWithXp === 1 ? "" : "s"} with XP today</> : "No XP for this one — three reps a day earn XP. Practice still counts on your tree."}</span>
              <span className="flex gap-2"><button type="button" onClick={() => void load()} className="rounded-full border border-black/10 px-4 py-2 text-[12.5px] font-bold text-[var(--primary)]">Another rep</button><button type="button" onClick={() => onClose(true)} className="rounded-full bg-[var(--primary)] px-4 py-2 text-[12.5px] font-bold text-white">Done</button></span>
            </>
          ) : (
            <>
              <span className="text-[12.5px] text-black/45">{answers.filter((a) => a !== undefined).length}/{rep?.questions.length ?? 5} answered · 4 XP per right answer</span>
              <button type="button" disabled={busy || !rep || rep.questions.some((_, i) => answers[i] === undefined)} onClick={() => void check()} className="rounded-full bg-[var(--electric-pink)] px-5 py-2 text-[12.5px] font-black uppercase tracking-[0.05em] text-white disabled:bg-[#e3e5e6] disabled:text-black/50">Check</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- the skill tree: each rubric skill a branch, five nodes up from Seed to Mastery ---------- */
export function SkillTree({ branches, level, max, practice = true }: { branches: Branch[]; level: number; max: number; practice?: boolean }) {
  const router = useRouter();
  const [drill, setDrill] = useState<Branch | null>(null);
  const weakest = [...branches].filter((b) => b.weak).sort((a, b) => a.level - b.level || a.pct - b.pct)[0];

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-[22px] border border-black/[0.06] bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <span className="grid gap-0.5"><span className={cn(kicker, "text-[9.5px] text-black/45")}>Skill tree · from your rubric grades</span><b className="text-[18px] text-[var(--primary)]">{level} of {max} nodes grown</b></span>
          {practice && weakest ? <button type="button" onClick={() => setDrill(weakest)} className="flex items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-4 py-2 text-[12px] font-black uppercase tracking-[0.05em] text-white"><MaterialSymbol className="text-[16px]" name="fitness_center" />Practise your weakest: {weakest.label}</button> : null}
        </div>

        {/* the tree */}
        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-7 gap-2">
            {branches.map((b) => {
              const tone = TONE[b.key] ?? "#0d1117";
              return (
                <div key={b.key} className="grid justify-items-center gap-2">
                  <div className="relative flex flex-col-reverse items-center gap-3 py-1">
                    <span className="absolute inset-y-3 left-1/2 w-0.5 -translate-x-1/2 bg-black/[0.07]" />
                    <span className="absolute bottom-3 left-1/2 w-0.5 -translate-x-1/2 transition-[height] duration-700" style={{ height: `${Math.max(0, (b.level - 1) / (SKILL_NODES.length - 1)) * 100}%`, background: tone }} />
                    {SKILL_NODES.map((n, i) => {
                      const on = i < b.level;
                      return (
                        <span key={n.name} title={`${n.name} — ${n.need}`} className={cn("relative z-10 flex items-center justify-center rounded-full border-2 transition-all", i === SKILL_NODES.length - 1 ? "size-10" : "size-8", on ? "text-white shadow-md" : "border-black/10 bg-white text-black/20")} style={on ? { background: tone, borderColor: tone } : undefined}>
                          <MaterialSymbol className={i === SKILL_NODES.length - 1 ? "text-[19px]" : "text-[15px]"} name={i === SKILL_NODES.length - 1 ? "workspace_premium" : on ? "check" : "circle"} />
                        </span>
                      );
                    })}
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-xl text-white" style={{ background: tone }}><MaterialSymbol className="text-[20px]" name={b.icon} /></span>
                  <b className="text-center text-[11.5px] leading-tight text-[var(--primary)]">{b.label}</b>
                  <span className="text-center text-[10.5px] leading-tight text-black/45">{b.scored ? `${b.pct}% · ${b.scored} scored` : "not graded yet"}</span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-black/45">{SKILL_NODES.map((n, i) => <span key={n.name}><b className="text-black/60">{i + 1}. {n.name}</b> — {n.need}</span>)}</p>
      </section>

      {/* each branch: where it stands, what grows it next, practice */}
      <ul className="grid gap-2 md:grid-cols-2">
        {branches.map((b) => {
          const tone = TONE[b.key] ?? "#0d1117";
          return (
            <li key={b.key} className={cn("grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border bg-white p-3", b.weak ? "border-[#e91e63]/25" : "border-black/[0.06]")}>
              <span className="flex size-10 items-center justify-center rounded-xl text-white" style={{ background: tone }}><MaterialSymbol className="text-[20px]" name={b.icon} /></span>
              <span className="grid min-w-0 gap-0.5">
                <span className="flex items-center gap-2"><b className="truncate text-[13.5px] text-[var(--primary)]">{b.label}</b><span className="rounded-full bg-[#f1f2f3] px-1.5 text-[10px] font-bold text-black/55">{b.level ? SKILL_NODES[b.level - 1].name : "Not started"}</span>{b.weak ? <span className="rounded-full bg-[#fdecf2] px-1.5 text-[10px] font-bold text-[#a3104a]">needs work</span> : null}</span>
                <span className="truncate text-[11.5px] text-black/50">{b.next ? `Next: ${b.next}` : "Mastered"}{b.reps ? ` · ${b.reps} rep${b.reps === 1 ? "" : "s"}${b.accuracy != null ? `, ${b.accuracy}% right` : ""}` : ""}</span>
              </span>
              {practice ? <button type="button" onClick={() => setDrill(b)} className="flex items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-bold text-[var(--primary)] hover:border-black/30"><MaterialSymbol className="text-[15px]" name="fitness_center" />Practise</button> : <span />}
            </li>
          );
        })}
      </ul>
      {practice ? <p className="text-[12px] text-black/45">Nodes grow with the reviewers’ grades on your real work. Practice reps sharpen a skill between tasks — 4 XP a right answer, for your first three reps a day.</p> : null}

      {drill ? <PracticeRep branch={drill} onClose={(done) => { setDrill(null); if (done) router.refresh(); }} /> : null}
    </div>
  );
}
