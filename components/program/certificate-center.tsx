"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { CertificateView } from "@/lib/certificate";
import { cn } from "@/lib/utils";

import { CertificateArt, certificatePng, type CertDetails } from "./certificate-art";
import { detailsOf } from "./certificate-details";

const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.18em]";
const GOLD = "#f5a623";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const DUST = [[16, 72, 0], [26, 58, 2.1], [37, 84, 4.4], [46, 66, 1.2], [55, 78, 3.3], [63, 60, 5.2], [72, 74, 0.6], [81, 64, 2.8], [88, 82, 4.9], [50, 90, 6.1]];

/* ---------- the stage: dark, lit from above, dust in the light (as the leaderboard) ---------- */
function Stage({ embedded, children }: { embedded?: boolean; children: ReactNode }) {
  return (
    <section className={cn("relative isolate overflow-hidden bg-[#07090d] text-white", embedded ? "rounded-[24px]" : "-mx-4 -mt-5 min-h-[calc(100vh-68px)] sm:-mx-6")}>
      <div className="pointer-events-none absolute inset-0 -z-10 print:hidden" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 55% 60% at 50% 0%, rgba(245,166,35,.2), transparent 70%), radial-gradient(ellipse 40% 50% at 10% 100%, rgba(233,30,99,.14), transparent 70%), radial-gradient(ellipse 40% 50% at 92% 90%, rgba(79,209,197,.12), transparent 70%)" }} />
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        {[-20, 0, 20].map((a, i) => <span key={a} className="lb-beam" style={{ "--a": `${a}deg`, animationDelay: `${i * -3}s`, opacity: a ? 0.5 : 0.9 } as CSSProperties} />)}
        {DUST.map(([x, y, w], i) => <span key={i} className="lb-dust" style={{ left: `${x}%`, top: `${y}%`, "--w": `${w}s`, "--d": `${6 + (i % 3)}s` } as CSSProperties} />)}
        <div className="absolute inset-x-0 bottom-0 h-64" style={{ background: "radial-gradient(ellipse 50% 70% at 50% 100%, rgba(245,166,35,.16), transparent 70%)" }} />
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-8 sm:py-12">{children}</div>
    </section>
  );
}

function Heading({ k, title, line, children }: { k: string; title: ReactNode; line?: ReactNode; children?: ReactNode }) {
  return (
    <header className="cert-fade grid justify-items-center gap-3 text-center print:hidden">
      {children}
      <span className={cn(kicker, "text-[#ffd666]")}>{k}</span>
      <h1 className="font-heading text-[clamp(1.8rem,4vw,3.2rem)] font-black uppercase leading-[0.95] tracking-[-0.04em]">{title}</h1>
      {line ? <p className="max-w-2xl text-[14.5px] leading-7 text-white/60">{line}</p> : null}
    </header>
  );
}

/* the gold seal — stamped on when the certificate is issued */
function Seal({ size = 120, stamp, className }: { size?: number; stamp?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-grid place-items-center rounded-full", stamp && "seal-stamp", className)} style={{ width: size, height: size, background: "conic-gradient(from 0deg, #ffe08a, #d4a017, #fff1b8, #b8860b, #ffe08a, #d4a017, #fff1b8, #b8860b, #ffe08a)", boxShadow: "0 18px 40px -12px rgba(245,166,35,.75), inset 0 0 0 3px rgba(255,255,255,.35)" }}>
      <span className="grid place-items-center rounded-full border-2 border-dashed border-[#7a5600]/50 text-[#5c4300]" style={{ width: size * 0.78, height: size * 0.78, background: "radial-gradient(circle at 35% 30%, #fff3c4, #f5c542 55%, #d4a017)" }}>
        <span className="grid justify-items-center leading-none">
          <MaterialSymbol style={{ fontSize: size * (size < 90 ? 0.42 : 0.3) }} filled name="workspace_premium" />
          {size >= 90 ? <span className="font-mono font-black uppercase tracking-[0.14em]" style={{ fontSize: size * 0.085 }}>Certified</span> : null}
        </span>
      </span>
    </span>
  );
}

/* the certificate on stage: a soft gold glow under it, a light sweeping across, a little tilt toward the pointer */
function Framed({ details, dim, float, children }: { details: CertDetails; dim?: boolean; float?: boolean; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const move = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -5, y: ((e.clientX - r.left) / r.width - 0.5) * 7 });
  };
  return (
    <div className={cn("cert-rise relative mx-auto w-full max-w-5xl", float && "cert-float")} style={{ perspective: 1600 }}>
      <div className="pointer-events-none absolute -inset-x-6 -bottom-10 top-10 -z-10 rounded-[40px] opacity-70 blur-3xl print:hidden" style={{ background: `radial-gradient(ellipse at center, ${GOLD}55, transparent 70%)` }} />
      <div ref={ref} onPointerMove={move} onPointerLeave={() => setTilt({ x: 0, y: 0 })} className="transition-transform duration-300 ease-out" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        <div className="cert-print cert-shine relative overflow-hidden rounded-[14px] shadow-[0_50px_100px_-40px_rgba(0,0,0,.9)] ring-1 ring-white/10">
          <div className={cn("transition-[filter,opacity] duration-700", dim && "opacity-45 blur-[3px] grayscale-[.5]")}><CertificateArt details={details} className="block h-auto w-full" /></div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* the certificate's facts, in glass */
function Facts({ items }: { items: [string, string, ReactNode][] }) {
  return (
    <dl className="cert-fade mx-auto grid w-full max-w-5xl grid-cols-2 gap-2.5 md:grid-cols-4 print:hidden" style={{ animationDelay: ".5s" }}>
      {items.map(([icon, k, v]) => (
        <div key={k} className="grid gap-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur">
          <dt className="flex items-center gap-1.5 text-[11.5px] text-white/50"><MaterialSymbol className="text-[15px] text-[#ffd666]" name={icon} />{k}</dt>
          <dd className="truncate text-[13.5px] font-semibold text-white">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* what you can do with it */
function Buttons({ cert, origin, dark }: { cert: CertificateView; origin: string; dark?: boolean }) {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const verify = `${origin}/certificate/${cert.number}`;
  const issued = new Date(cert.issuedAt);
  const linkedin = `https://www.linkedin.com/profile/add?${new URLSearchParams({ startTask: "CERTIFICATION_NAME", name: `${cert.program} — Certificate of Completion`, organizationName: "Node", issueYear: String(issued.getFullYear()), issueMonth: String(issued.getMonth() + 1), certUrl: verify, certId: cert.number })}`;
  const download = async () => {
    setBusy(true);
    try {
      const blob = await certificatePng(detailsOf(cert, origin));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${cert.name.replace(/[^\w]+/g, "-")}-${cert.number}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { pushToast({ variant: "error", title: "Couldn’t make the image", description: "Try again, or use Print → Save as PDF." }); }
    setBusy(false);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(verify); pushToast({ variant: "success", title: "Link copied", description: "Anyone with it can check your certificate is real." }); } catch { /* no clipboard */ }
  };
  const ghost = dark ? "bg-white/[0.08] text-white ring-1 ring-white/15 hover:bg-white/[0.14]" : "bg-white text-[var(--primary)] ring-1 ring-black/10 hover:ring-black/30";
  const btn = "flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-bold transition-colors";
  return (
    <div className={cn("flex flex-wrap items-center gap-2 print:hidden", dark && "cert-fade justify-center")} style={dark ? { animationDelay: ".7s" } : undefined}>
      <button type="button" onClick={download} disabled={busy} className={cn(btn, dark ? "bg-[#f5a623] text-[#07090d] hover:brightness-110" : "bg-[var(--primary)] text-white", "disabled:opacity-60")}><MaterialSymbol className="text-[18px]" name="download" />{busy ? "Preparing…" : "Download PNG"}</button>
      <button type="button" onClick={() => window.print()} className={cn(btn, ghost)}><MaterialSymbol className="text-[18px]" name="print" />Print / Save as PDF</button>
      <button type="button" onClick={copy} className={cn(btn, ghost)}><MaterialSymbol className="text-[18px]" name="link" />Copy verify link</button>
      <a href={linkedin} target="_blank" rel="noopener noreferrer" className={cn(btn, "bg-[#0a66c2] text-white hover:brightness-110")}><MaterialSymbol className="text-[18px]" name="add_box" />Add to LinkedIn</a>
      {!dark ? <span className="ml-auto font-mono text-[11.5px] text-black/45">No. {cert.number}</span> : null}
    </div>
  );
}

/* the plain certificate with its buttons — for the admin's designer */
export function CertificateActions({ cert, origin }: { cert: CertificateView; origin: string }) {
  return (
    <div className="grid gap-4">
      <div className="cert-print overflow-hidden rounded-[18px] shadow-[0_40px_90px_-40px_rgba(13,17,23,.7)] ring-1 ring-black/10">
        <CertificateArt details={detailsOf(cert, origin)} className="block h-auto w-full" />
      </div>
      <Buttons cert={cert} origin={origin} />
    </div>
  );
}

/* ---------- the moment it's issued: the room darkens, the certificate rises into the light, the seal stamps on ---------- */
const CONFETTI = ["#f5a623", "#ffd666", "#d81b60", "#4fd1c5", "#ffffff", "#6d48d8"];
function Ceremony({ cert, origin, onDone }: { cert: CertificateView; origin: string; onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setPhase(1), 350), setTimeout(() => setPhase(2), 1500), setTimeout(() => setPhase(3), 2500)];
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onDone(); };
    window.addEventListener("keydown", key);
    return () => { t.forEach(clearTimeout); window.removeEventListener("keydown", key); };
  }, [onDone]);
  const bits = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    left: `${(i * 37) % 100}%`, color: CONFETTI[i % CONFETTI.length],
    dx: `${((i * 53) % 240) - 120}px`, rot: `${360 + ((i * 97) % 720)}deg`, dur: `${2.4 + ((i * 7) % 18) / 10}s`, delay: `${((i * 13) % 60) / 100}s`,
  })), []);
  return createPortal(
    <div className="fixed inset-0 z-[180] grid place-items-center overflow-hidden bg-[#05070a]/95 p-4 backdrop-blur-md [animation:cert-fade_.4s_ease-out]" role="dialog" aria-modal="true" aria-label="Certificate issued">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 45% 55% at 50% 40%, rgba(245,166,35,.22), transparent 70%)" }} aria-hidden="true" />
      {phase >= 2 ? <div className="pointer-events-none absolute inset-0" aria-hidden="true">{bits.map((b, i) => <span key={i} className="confetti-bit" style={{ left: b.left, background: b.color, "--dx": b.dx, "--rot": b.rot, "--dur": b.dur, "--delay": b.delay } as CSSProperties} />)}</div> : null}
      <div className="relative grid w-full max-w-4xl justify-items-center gap-6">
        {phase >= 1 ? (
          <div className="cert-rise relative w-full">
            <div className="overflow-hidden rounded-[14px] shadow-[0_60px_140px_-40px_rgba(245,166,35,.55)] ring-1 ring-white/10"><CertificateArt details={detailsOf(cert, origin)} className="block h-auto w-full" /></div>
            {phase >= 2 ? (
              <span className="absolute -bottom-8 -left-4 sm:-left-8">
                {[0, 0.25, 0.5].map((d) => <span key={d} className="cert-ring pointer-events-none absolute left-1/2 top-1/2 size-[150px] rounded-full border-2 border-[#ffd666]" style={{ animationDelay: `${d}s` }} />)}
                <Seal size={130} stamp />
              </span>
            ) : null}
          </div>
        ) : null}
        {phase >= 3 ? (
          <div className="cert-fade grid justify-items-center gap-2 text-center text-white">
            <span className={cn(kicker, "text-[#ffd666]")}>Certified</span>
            <h2 className="font-heading text-[clamp(1.6rem,3.6vw,2.8rem)] font-black uppercase leading-none tracking-[-0.04em]">Congratulations, {cert.name.split(/\s+/)[0]}.</h2>
            <span className="cert-type font-mono text-[14px] tracking-[0.12em] text-white/70">No. {cert.number}</span>
            <button type="button" onClick={onDone} className="mt-3 flex items-center gap-2 rounded-full bg-[#f5a623] px-6 py-3 text-[13px] font-black uppercase tracking-[0.08em] text-[#07090d] shadow-lg shadow-amber-500/30 transition-transform hover:-translate-y-0.5">See my certificate<MaterialSymbol className="text-[18px]" name="arrow_forward" /></button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

type Status = { eligible: boolean; daysDone: number; certificate: CertificateView | null };

/* The trainee's certificate, on a lit stage: locked until the program is done, then claimed with the name to print
   (a ceremony as it's issued) — then theirs to download, print, verify and add to LinkedIn */
export function CertificateCenter({ status, name, origin, totalDays, preview = false, embedded = false }: { status: Status; name: string; origin: string; totalDays: number; preview?: boolean; embedded?: boolean }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [pending, start] = useTransition();
  const [printed, setPrinted] = useState(name);
  /* an admin's preview: claiming is acted out, and nothing is issued */
  const [simulated, setSimulated] = useState<CertificateView | null>(null);
  const [ceremony, setCeremony] = useState<CertificateView | null>(null);
  const cert = status.certificate ?? simulated;

  const claim = () => start(async () => {
    if (preview) {
      const c = { number: "NODE-CPG-0000-PREVIEW", name: printed.trim(), program: "Copy, Paste, Go", issuedAt: new Date().toISOString(), revoked: false };
      setSimulated(c); setCeremony(c);
      pushToast({ variant: "info", title: "Preview — nothing was issued", description: "This is what the trainee sees once they claim it." });
      return;
    }
    const res = await fetch("/api/program/certificate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: printed }) });
    const data = (await res.json().catch(() => ({}))) as CertificateView & { error?: string };
    if (!res.ok) { pushToast({ variant: "error", title: "Not issued", description: data.error ?? "Try again in a moment." }); return; }
    setSimulated(data); setCeremony(data);
    router.refresh();
  });

  const ceremonyEl = ceremony ? <Ceremony cert={ceremony} origin={origin} onDone={() => setCeremony(null)} /> : null;

  /* ---------- issued ---------- */
  if (cert) {
    return (
      <Stage embedded={embedded}>
        {ceremonyEl}
        <Heading k={`Certified · ${cert.program}`} title={<>Well done, <span className="text-[#ffd666]">{cert.name.split(/\s+/)[0]}</span>.</>} line="You finished all 30 days. Here’s your certificate — download it, print it, and add it to LinkedIn. Anyone can check it’s real from its number.">
          <Seal size={64} />
        </Heading>
        <Framed details={detailsOf(cert, origin)} float />
        <Facts items={[
          ["tag", "Certificate No.", <span key="n" className="font-mono text-[12.5px]">{cert.number}</span>],
          ["event_available", "Issued", fmtDate(cert.issuedAt)],
          ["rocket_launch", "Program", `${cert.program} · 30 days`],
          ["verified", "Verify", <a key="v" href={`/certificate/${cert.number}`} target="_blank" rel="noopener noreferrer" className="text-[#4fd1c5] hover:underline">Public page ↗</a>],
        ]} />
        <Buttons cert={cert} origin={origin} dark />
      </Stage>
    );
  }

  const draft: CertificateView = { number: "", name: printed.trim() || "Your name", program: "Copy, Paste, Go", issuedAt: new Date().toISOString(), revoked: false };
  const details = { ...detailsOf(draft), number: undefined };

  /* ---------- ready to claim ---------- */
  if (status.eligible) {
    return (
      <Stage embedded={embedded}>
        {ceremonyEl}
        <Heading k="Day 30 complete" title={<>Your certificate is <span className="text-[#ffd666]">ready</span>.</>} line="Check the name exactly as it should appear — it’s fixed once the certificate is issued." />
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Framed details={details}>
            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#ffd666] backdrop-blur"><MaterialSymbol className="text-[14px]" name="hourglass_top" />Unclaimed</span>
          </Framed>
          <section className="cert-fade grid gap-4 rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md sm:p-6" style={{ animationDelay: ".4s" }}>
            <span className="flex items-center gap-3"><Seal size={46} /><b className="text-[18px]">You’ve earned it</b></span>
            <p className="text-[13.5px] leading-6 text-white/60">You finished every day of Copy, Paste, Go. Your name goes on the certificate just as you type it here.</p>
            <label className="grid gap-1.5">
              <span className="text-[12.5px] font-semibold text-white/80">Name on the certificate</span>
              <input value={printed} onChange={(e) => setPrinted(e.target.value)} maxLength={60} className="h-12 rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-[#ffd666] focus:ring-4 focus:ring-[#ffd666]/15" />
            </label>
            <button type="button" onClick={claim} disabled={pending || printed.trim().length < 3} className="cert-glow flex items-center justify-center gap-2 rounded-full bg-[#f5a623] px-5 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] text-[#07090d] transition-transform hover:-translate-y-0.5 disabled:animate-none disabled:opacity-50"><MaterialSymbol className="text-[19px]" filled name="workspace_premium" />{pending ? "Issuing…" : "Issue my certificate"}</button>
            <span className="text-center text-[11.5px] text-white/40">It gets its own number, and a public page anyone can check.</span>
          </section>
        </div>
      </Stage>
    );
  }

  /* ---------- not finished yet ---------- */
  const pct = Math.round((status.daysDone / totalDays) * 100);
  const ring = 2 * Math.PI * 34;
  return (
    <Stage embedded={embedded}>
      <Heading k="Your certificate · sealed" title={<>Earned on <span className="text-[#ffd666]">Day 30</span>.</>} line="Your certificate is issued when you finish the program — every day, through the capstone where you present your project to a mentor." />
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Framed details={details} dim>
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-24 place-items-center rounded-full bg-black/60 ring-1 ring-white/20 backdrop-blur"><MaterialSymbol className="text-[40px] text-[#ffd666]" name="lock" /></span>
          </span>
        </Framed>
        <section className="cert-fade grid justify-items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.06] p-6 text-center backdrop-blur-md" style={{ animationDelay: ".4s" }}>
          <span className="relative grid size-[96px] place-items-center">
            <svg width="96" height="96" viewBox="0 0 80 80" className="-rotate-90" aria-hidden="true"><circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="7" /><circle cx="40" cy="40" r="34" fill="none" stroke={GOLD} strokeWidth="7" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - pct / 100)} /></svg>
            <b className="absolute text-[20px]">{pct}%</b>
          </span>
          <span className="grid gap-1"><b className="text-[17px]">{status.daysDone} of {totalDays} days done</b><span className="text-[13px] text-white/55">{totalDays - status.daysDone} to go — then it’s yours.</span></span>
          <Link href="/dashboard/roadmap" className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-[#07090d] transition-transform hover:-translate-y-0.5"><MaterialSymbol className="text-[18px]" name="menu_book" />Back to my program</Link>
        </section>
      </div>
    </Stage>
  );
}
