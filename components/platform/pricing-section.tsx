"use client";

import Link from "next/link";
import { useSyncExternalStore, type CSSProperties } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { flagshipHref } from "@/lib/platform-data";
import { money, offerFor, visiblePackages, type Offer, type PricingConfig } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/* The pricing section: the featured package as a big dark card — today's price against the full one, what you save,
 * a countdown while a promotion runs, everything that's included — and the other packages beside it. Driven by the
 * pricing an admin sets; the admin's editor previews it with the same component. */
const PINK = "#e91e63", TEAL = "#4fd1c5";

/* the clock: the server's time to render, then the real one, every second (only while a countdown is showing) */
const subscribe = (cb: () => void) => { const id = window.setInterval(cb, 1000); return () => window.clearInterval(id); };
const useClock = (serverNow: number) => useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 1000) * 1000, () => serverNow);

function left(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
}

export function PricingSection({ config, now: serverNow }: { config: PricingConfig; now: number }) {
  const now = useClock(serverNow);
  const offers = visiblePackages(config).map((p) => offerFor(p, config.promotions, now));
  const featured = offers.filter((o) => o.pkg.featured);
  const lead = featured.length ? featured : offers.slice(0, 1);
  const rest = offers.filter((o) => !lead.includes(o));
  const promo = lead.find((o) => o.promo)?.promo ?? offers.find((o) => o.promo)?.promo ?? null;

  if (!offers.length) return null;
  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-5 text-left">
      {promo ? (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-full px-5 py-2.5 text-center text-[13px] font-bold text-white shadow-[0_18px_40px_-22px_rgba(233,30,99,.8)]" style={{ background: `linear-gradient(90deg, ${PINK}, #ff5c93 55%, #6d48d8)` }}>
          <MaterialSymbol className="text-[18px]" name="local_fire_department" filled />
          <span className="uppercase tracking-[0.08em]">{promo.label}</span>
          <span className="opacity-85">{promo.kind === "percent" ? `${promo.value}% off` : `${money(promo.value, lead[0]?.pkg.currency)} off`}</span>
          {promo.endsAt ? <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-0.5 font-mono text-[11.5px]"><MaterialSymbol className="text-[14px]" name="timer" />ends in {(() => { const [d, h, m] = left(Date.parse(promo.endsAt) - now); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`; })()}</span> : null}
        </div>
      ) : null}

      <div className={cn("grid items-start gap-5", rest.length ? "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" : "mx-auto w-full max-w-[760px]")}>
        <div className="grid gap-5">{lead.map((o) => <Featured key={o.pkg.id} o={o} now={now} />)}</div>
        {rest.length ? (
          <div className="grid content-start gap-4">
            {rest.map((o) => <Side key={o.pkg.id} o={o} />)}
            <Guarantees />
          </div>
        ) : <Guarantees wide />}
      </div>
    </div>
  );
}

function Featured({ o, now }: { o: Offer; now: number }) {
  const { pkg } = o;
  const price = o.final === null ? "Soon" : money(o.final, pkg.currency);
  const end = o.promo?.endsAt ? left(Date.parse(o.promo.endsAt) - now) : null;
  const shown = pkg.features.slice(0, 8);
  return (
    <article className="group relative isolate overflow-hidden rounded-[30px] p-[1.5px]" style={{ background: `linear-gradient(140deg, ${pkg.color}, rgba(79,209,197,.55) 45%, rgba(109,72,216,.6))` }}>
      <div className="relative grid gap-6 overflow-hidden rounded-[29px] bg-[#0d1117] p-6 text-white sm:p-8" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <span className="pointer-events-none absolute -right-24 -top-28 -z-0 size-80 rounded-full opacity-40 blur-[90px] transition-opacity duration-700 group-hover:opacity-60" style={{ background: pkg.color }} />
        <span className="pointer-events-none absolute -bottom-32 -left-20 -z-0 size-72 rounded-full opacity-20 blur-[90px]" style={{ background: TEAL }} />

        <div className="relative flex flex-wrap items-center gap-2">
          {pkg.badge ? <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-white" style={{ background: pkg.color }}><span className="size-1.5 animate-pulse rounded-full bg-white" />{pkg.badge}</span> : null}
          {pkg.flagship ? <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Flagship program</span> : null}
        </div>

        <div className="relative grid gap-2">
          <h3 className="font-heading text-[clamp(30px,3.4vw,44px)] font-black uppercase leading-[0.92] tracking-[-0.04em]">{pkg.name}</h3>
          {pkg.tagline ? <p className="max-w-[48ch] text-[14.5px] leading-6 text-white/65">{pkg.tagline}</p> : null}
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-4 border-y border-white/10 py-5">
          <div className="grid gap-1.5">
            {o.was ? <span className="text-[14px] font-semibold text-white/45"><s>{money(o.was, pkg.currency)}</s></span> : null}
            <span className="flex items-baseline gap-2.5">
              <b className="font-heading text-[clamp(44px,5vw,64px)] font-black leading-none tracking-[-0.05em]">{price}</b>
              {pkg.suffix ? <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">{pkg.suffix}</span> : null}
            </span>
          </div>
          {o.save ? (
            <span className="grid justify-items-end gap-1 text-right">
              <span className="rounded-full px-3 py-1 text-[12.5px] font-black" style={{ background: `${TEAL}24`, color: TEAL }}>{o.offPct}% off</span>
              <span className="text-[12.5px] font-semibold text-white/60">You save {money(o.save, pkg.currency)}</span>
            </span>
          ) : null}
        </div>

        {end && end.some(Boolean) ? (
          <div className="relative flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/50">{o.promo!.label} ends in</span>
            <span className="flex gap-1.5">
              {end.map((n, i) => (
                <span key={i} className="grid min-w-[46px] justify-items-center rounded-xl border border-white/10 bg-white/[0.06] px-2 py-1.5">
                  <b className="font-heading text-[18px] font-black tabular-nums leading-none">{String(n).padStart(2, "0")}</b>
                  <small className="font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/40">{["days", "hrs", "min", "sec"][i]}</small>
                </span>
              ))}
            </span>
          </div>
        ) : null}

        {shown.length ? (
          <ul className="relative grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {shown.map((f) => <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-5 text-white/80"><MaterialSymbol className="mt-px shrink-0 text-[17px]" style={{ color: TEAL } as CSSProperties} name="check_circle" filled />{f}</li>)}
            {pkg.features.length > shown.length ? <li className="text-[13px] font-semibold text-white/45">+ {pkg.features.length - shown.length} more</li> : null}
          </ul>
        ) : null}

        <div className="relative flex flex-wrap items-center gap-3">
          {pkg.status === "open" ? (
            <Link href={pkg.ctaHref} className="group/cta flex items-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-pink-500/30 transition-transform hover:scale-[1.03]" style={{ background: pkg.color }}>
              {pkg.ctaLabel || "Enroll now"}{o.final !== null ? ` · ${price}` : ""}<MaterialSymbol className="text-[18px] transition-transform group-hover/cta:translate-x-0.5" name="arrow_forward" />
            </Link>
          ) : (
            <Link href={pkg.ctaHref} className="flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] text-white">{pkg.ctaLabel || "Tell me when it opens"}</Link>
          )}
          {pkg.flagship ? <Link href={flagshipHref} className="text-[13px] font-bold text-white/65 underline-offset-4 hover:text-white hover:underline">See what’s inside</Link> : null}
        </div>
      </div>
    </article>
  );
}

function Side({ o }: { o: Offer }) {
  const { pkg } = o;
  const soon = pkg.status === "soon" || o.final === null;
  return (
    <article className="relative grid gap-3 overflow-hidden rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-[0_24px_50px_-36px_rgba(13,17,23,.4)]" style={{ "--c": pkg.color } as CSSProperties}>
      <span className="absolute inset-y-5 left-0 w-[3px] rounded-full bg-[var(--c)]" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b className="font-heading text-[18px] font-black uppercase tracking-[-0.02em] text-[#0d1117]">{pkg.name}</b>
        {soon ? <span className="rounded-full border border-[var(--c)]/40 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--c)]">Coming soon</span>
          : pkg.badge ? <span className="rounded-full bg-[var(--c)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white">{pkg.badge}</span> : null}
      </div>
      {pkg.tagline ? <p className="text-[13px] leading-5 text-black/55">{pkg.tagline}</p> : null}
      {!soon ? (
        <div className="flex flex-wrap items-baseline gap-2">
          <b className="font-heading text-[30px] font-black leading-none tracking-[-0.04em] text-[#0d1117]">{money(o.final!, pkg.currency)}</b>
          {o.was ? <s className="text-[13px] text-black/40">{money(o.was, pkg.currency)}</s> : null}
          {pkg.suffix ? <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-black/40">{pkg.suffix}</span> : null}
          {o.offPct ? <span className="rounded-full bg-[#e6f3f3] px-2 py-0.5 text-[11px] font-bold text-[#007373]">{o.offPct}% off</span> : null}
        </div>
      ) : null}
      {pkg.features.length ? <ul className="grid gap-1.5">{pkg.features.slice(0, 4).map((f) => <li key={f} className="flex items-start gap-2 text-[12.5px] leading-5 text-black/65"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[var(--c)]" />{f}</li>)}</ul> : null}
      {pkg.ctaHref ? <Link href={pkg.ctaHref} className="mt-1 flex w-fit items-center gap-1.5 text-[12.5px] font-black uppercase tracking-[0.06em] text-[var(--c)] transition-all hover:gap-2.5">{pkg.ctaLabel || (soon ? "Tell me when it opens" : "Get it")}<MaterialSymbol className="text-[16px]" name="arrow_forward" /></Link> : null}
    </article>
  );
}

/* what holds for every package */
function Guarantees({ wide }: { wide?: boolean }) {
  const items = [["payments", "One-time payment", "No subscription, no hidden fees."], ["local_shipping", "Pay cash on delivery", "Your program unlocks when it’s received."], ["redeem", "Refer friends, pay less", "Every friend who joins takes money off."]];
  return (
    <div className={cn("grid gap-3 rounded-[24px] border border-dashed border-black/10 bg-white/60 p-5", wide && "sm:grid-cols-3")}>
      {items.map(([icon, title, body]) => (
        <span key={title} className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0d1117] text-white"><MaterialSymbol className="text-[18px]" name={icon} /></span>
          <span className="grid gap-0.5"><b className="text-[13px] text-[#0d1117]">{title}</b><span className="text-[12px] leading-5 text-black/50">{body}</span></span>
        </span>
      ))}
    </div>
  );
}
