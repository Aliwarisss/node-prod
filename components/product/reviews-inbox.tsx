"use client";

import { useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import { GradeChip, RubricTable } from "@/components/program/do-panel";
import type { ReviewItem } from "@/lib/program/reviews";
import { gradeOf, PASS_PCT, type Score } from "@/lib/program/rubrics";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "submitted", label: "To review", icon: "inbox" },
  { id: "changes", label: "Sent back", icon: "replay" },
  { id: "approved", label: "Approved", icon: "verified" },
] as const;
const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";
const ago = (iso: string | null) => {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

/* Admin: every deliverable trainees submit, grouped by the role it's reported to. The admin reviews as that role —
   approve it, or send it back with what to change (which re-opens the trainee's lesson). */
export function ReviewsInbox({ items: initial }: { items: ReviewItem[] }) {
  const { pushToast } = useToast();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("submitted");
  const [selId, setSelId] = useState<string | null>(initial.find((x) => x.status === "submitted")?.id ?? null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<string[]>([]); // the gate criteria the reviewer has verified
  const [scores, setScores] = useState<Record<string, number>>({}); // the reviewer's rubric score
  const pick = (id: string | null) => { setSelId(id); setComment(""); setChecked([]); setScores({}); };

  const shown = items.filter((x) => x.status === tab);
  const groups = useMemo(() => {
    const g = new Map<string, ReviewItem[]>();
    for (const x of shown) g.set(x.toRole, [...(g.get(x.toRole) ?? []), x]);
    return [...g.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [shown]);
  const sel = items.find((x) => x.id === selId) ?? null;
  const count = (s: string) => items.filter((x) => x.status === s).length;
  const live = sel ? gradeOf(sel.rubric, scores as Record<string, Score>) : null;
  const lastReview = sel ? [...sel.history].reverse().find((h) => h.kind !== "submitted" && h.scores) : undefined;
  const verified = !sel || checked.length >= sel.verify.length;
  const canApprove = !!live && live.scored === live.count && live.pass && verified;

  async function decide(decision: "approve" | "changes") {
    if (!sel) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/submissions/${sel.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, comment, checks: checked, scores }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; status?: ReviewItem["status"]; history?: ReviewItem["history"]; grade?: ReviewItem["grade"] };
      if (!res.ok) throw new Error(data.error ?? "Couldn’t save.");
      setItems((all) => all.map((x) => (x.id === sel.id ? { ...x, status: data.status ?? x.status, history: data.history ?? x.history, grade: data.grade ?? x.grade } : x)));
      pushToast({ variant: "success", title: sel.kind === "decision" ? (decision === "approve" ? "Decided: yes" : "Decided: no — rework") : decision === "approve" ? "Approved" : "Sent back for changes", description: `As the ${sel.toRole}, to ${sel.trainee.name}.` });
      pick(items.find((x) => x.status === "submitted" && x.id !== sel.id)?.id ?? null);
      window.dispatchEvent(new Event("node:badges"));
    } catch (e) {
      pushToast({ variant: "error", title: "Not saved", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Reviews</span>
          <h1 className="font-heading text-[clamp(1.5rem,2.6vw,2rem)] font-black uppercase leading-none tracking-[-0.03em] text-[var(--primary)]">Deliverables reported to you</h1>
          <p className="max-w-2xl text-[13.5px] text-[var(--on-surface-variant)]">Every role in the workflows — sponsor, portfolio owner, reviewers — is played by an admin. Review each piece of work as the role it was submitted to.</p>
        </div>
        <div className="flex gap-1 rounded-full bg-[#eceef0] p-1">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors", tab === t.id ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/55 hover:text-[var(--primary)]")}>
              <MaterialSymbol className="text-[16px]" name={t.icon} />{t.label}<span className="rounded-full bg-black/[0.06] px-1.5 text-[10.5px]">{count(t.id)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.6fr)]">
        {/* the queue, by role */}
        <section className="grid content-start gap-3">
          {!groups.length ? <p className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-[13px] text-[var(--on-surface-variant)]">Nothing here.</p> : null}
          {groups.map(([role, list]) => (
            <div key={role} className="grid gap-1.5">
              <span className="flex items-center gap-1.5 px-1 text-[12px] font-bold text-[var(--primary)]"><MaterialSymbol className="text-[16px] text-[var(--electric-pink)]" name="badge" />As the {role}<span className="text-black/40">· {list.length}</span></span>
              {list.map((x) => (
                <button key={x.id} type="button" onClick={() => pick(x.id)} className={cn("grid gap-0.5 rounded-xl border bg-white px-3 py-2.5 text-left transition-colors", selId === x.id ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/10" : "border-black/[0.07] hover:border-black/20")}>
                  <span className="flex items-center justify-between gap-2"><b className="flex min-w-0 items-center gap-1 truncate text-[13.5px] text-[var(--primary)]">{x.kind === "decision" ? <MaterialSymbol className="text-[15px] text-[#c2410c]" name="gavel" /> : null}{x.artifact}</b><span suppressHydrationWarning className="flex-none text-[11px] text-black/45">{ago(x.submittedAt)}</span></span>
                  <span className="truncate text-[12px] text-[var(--on-surface-variant)]">{x.trainee.name} · Day {x.day} · {x.lessonCode} {x.lessonTitle}</span>
                  {x.project ? <span className="truncate text-[11.5px] text-black/45">{x.project.client} — {x.project.name}{x.version > 1 ? ` · v${x.version}` : ""}</span> : null}
                  {x.grade ? <span><GradeChip g={x.grade} /></span> : null}
                </button>
              ))}
            </div>
          ))}
        </section>

        {/* the work */}
        {sel ? (
          <section className="grid gap-4 rounded-2xl border border-black/[0.06] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1">
                <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Day {sel.day} · {sel.lessonCode} {sel.lessonTitle} · step “{sel.step}”</span>
                <h2 className="text-[20px] font-black text-[var(--primary)]">{sel.artifact}</h2>
                <span className="text-[13px] text-[var(--on-surface-variant)]"><b className="text-[var(--primary)]">{sel.trainee.name}</b>{sel.trainee.email ? ` (${sel.trainee.email})` : ""}, as the {sel.by} → reported to <b className="text-[var(--primary)]">the {sel.toRole}</b>{sel.version > 1 ? ` · version ${sel.version}` : ""}</span>
              </div>
              {sel.project ? <span className="flex items-center gap-2 rounded-xl bg-[#f6f7f8] px-3 py-2 text-[12.5px] text-[var(--primary)]"><span className="flex size-7 items-center justify-center rounded-lg text-white" style={{ background: sel.project.color }}><MaterialSymbol className="text-[16px]" name={sel.project.icon} /></span><span className="grid leading-tight"><b>{sel.project.client}</b><span className="text-[11.5px] text-black/50">{sel.project.name}</span></span></span> : null}
            </div>

            <pre className="max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-xl border border-black/[0.06] bg-[#fafafa] p-4 font-mono text-[12.5px] leading-6 text-[var(--primary)]">{sel.content}</pre>

            {sel.upload ? <a href={`/api/program/uploads/${sel.upload.id}`} className="flex items-center gap-1.5 justify-self-start rounded-lg bg-[#f1f2f3] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--primary)] hover:bg-[#e8eaec]"><MaterialSymbol className="text-[16px]" name="attach_file" />Attached: {sel.upload.name}<span className="text-black/45">· {Math.max(1, Math.round(sel.upload.size / 1024))} KB</span></a> : null}
            {sel.ticks.length ? <p className="text-[12px] text-black/50"><MaterialSymbol className="mr-1 align-[-3px] text-[15px] text-[var(--bridge-teal)]" name="checklist" />The trainee ticked {sel.ticks.length} to-do{sel.ticks.length === 1 ? "" : "s"} on the way — the before, along and lens items for this step.</p> : null}

            {sel.rubric.length ? (
              <div className="grid gap-2 rounded-xl border border-black/[0.08] p-3">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className={cn(kicker, "text-[9.5px] text-[var(--electric-pink)]")}>{sel.status === "submitted" ? "Grade it on the rubric" : "The rubric"} · 0 missing · 1 partial · 2 meets · pass: no 0s, {PASS_PCT}%+</span>
                  <span className="flex flex-wrap items-center gap-2">
                    {Object.keys(sel.selfScores).length ? <GradeChip g={gradeOf(sel.rubric, sel.selfScores as Record<string, Score>)} label="Their self-score" /> : null}
                    {sel.status === "submitted" ? (live && live.scored ? <GradeChip g={live} label="Your grade" /> : null) : sel.grade ? <GradeChip g={sel.grade} label="Graded" /> : null}
                  </span>
                </span>
                {sel.status === "submitted" && Object.keys(sel.selfScores).length ? <button type="button" onClick={() => setScores({ ...sel.selfScores })} className="justify-self-start text-[11.5px] font-bold text-black/50 hover:text-[var(--primary)]">Start from their self-score</button> : null}
                <RubricTable rubric={sel.rubric} scores={sel.status === "submitted" ? scores : lastReview?.scores ?? {}} theirs={sel.selfScores} theirsLabel="Self" disabled={sel.status !== "submitted"} onScore={(id, s) => setScores((cur) => { const n = { ...cur }; if (s === null) delete n[id]; else n[id] = s; return n; })} />
              </div>
            ) : null}

            {sel.verify.length ? (
              <div className="grid gap-1.5 rounded-xl border border-black/[0.08] p-3">
                <span className="flex items-center justify-between gap-2">
                  <span className={cn(kicker, "text-[9.5px] text-[#8a6500]")}>The lesson’s gate criteria · verify · {checked.length}/{sel.verify.length}</span>
                  {sel.status === "submitted" ? <button type="button" onClick={() => setChecked(checked.length === sel.verify.length ? [] : sel.verify.map((v) => v.text))} className="text-[11.5px] font-bold text-black/50 hover:text-[var(--primary)]">{checked.length === sel.verify.length ? "Clear" : "Tick all"}</button> : null}
                </span>
                {sel.verify.map((v) => {
                  const on = checked.includes(v.text) || (sel.status !== "submitted" && sel.history.some((h) => h.checks.includes(v.text)));
                  return (
                    <label key={v.text} className="flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 text-[12.5px] leading-5 hover:bg-black/[0.03]">
                      <input type="checkbox" checked={on} disabled={sel.status !== "submitted"} onChange={(e) => setChecked((c) => (e.target.checked ? [...c, v.text] : c.filter((x) => x !== v.text)))} className="mt-0.5 size-4 flex-none accent-[var(--bridge-teal)]" />
                      <span className="grid"><span className="text-[var(--primary)]">{v.text}</span><span className="text-[10.5px] font-semibold text-black/45">{v.source}</span></span>
                    </label>
                  );
                })}
              </div>
            ) : null}

            {sel.history.length ? (
              <ol className="grid gap-1.5">
                {sel.history.map((h, i) => <li key={i} className="flex gap-2 text-[12.5px] text-[var(--on-surface-variant)]"><MaterialSymbol className="mt-px text-[15px]" name={h.kind === "changes" ? "replay" : h.kind === "approved" ? "verified" : "send"} /><span suppressHydrationWarning><b className="text-[var(--primary)]">{h.kind === "submitted" ? `Submitted by ${h.by}` : `${h.role} (${h.by}) ${h.kind === "approved" ? "approved" : "asked for changes"}`}</b>{h.comment ? `: “${h.comment}”` : ""}{h.grade ? ` · ${h.kind === "submitted" ? "self-score" : "graded"} ${h.grade.pct}% (${h.grade.total}/${h.grade.max}, ${h.grade.pass ? "pass" : "below pass"})` : ""}{h.checks.length ? ` · verified ${h.checks.length}` : ""} ·{h.at ? new Date(h.at).toLocaleString() : ""}</span></li>)}
              </ol>
            ) : null}

            {sel.status === "submitted" ? (
              <div className="grid gap-2 rounded-xl border border-black/[0.08] p-3">
                <span className="text-[12.5px] font-bold text-[var(--primary)]">{sel.kind === "decision" ? `Your call, as the ${sel.toRole}` : `Your decision, as the ${sel.toRole}`}</span>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Feedback for the trainee — required when you send it back." className="w-full resize-y rounded-lg border border-black/10 p-2.5 text-[13px] outline-none focus:border-[var(--bridge-teal)]" />
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy || !canApprove} title={!live || live.scored < live.count ? "Score every rubric criterion first" : !live.pass ? `Doesn’t pass (${live.pct}%${live.zeros ? `, ${live.zeros} at 0` : ""}) — send it back` : !verified ? "Verify the gate criteria first" : undefined} onClick={() => void decide("approve")} className="flex items-center gap-1.5 rounded-full bg-[var(--bridge-teal)] px-5 py-2 text-[12.5px] font-bold text-white disabled:opacity-50"><MaterialSymbol className="text-[17px]" name="verified" />{sel.kind === "decision" ? "Decide: yes" : "Approve"}</button>
                  <button type="button" disabled={busy || !comment.trim() || (!!live && live.scored < live.count)} title={live && live.scored < live.count ? "Score every rubric criterion first" : !comment.trim() ? "Say what needs to change" : undefined} onClick={() => void decide("changes")} className="flex items-center gap-1.5 rounded-full bg-[#fdecf2] px-5 py-2 text-[12.5px] font-bold text-[#8a0f3f] disabled:opacity-50"><MaterialSymbol className="text-[17px]" name="replay" />{sel.kind === "decision" ? "Decide: no — rework" : "Request changes"}</button>
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="grid place-items-center rounded-2xl border border-dashed border-black/10 p-10 text-center text-[13.5px] text-[var(--on-surface-variant)]"><MaterialSymbol className="text-[32px] text-black/25" name="rate_review" />Pick a deliverable to review.</section>
        )}
      </div>
    </div>
  );
}
