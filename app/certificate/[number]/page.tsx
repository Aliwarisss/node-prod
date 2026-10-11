import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { CertificateArt } from "@/components/program/certificate-art";
import { detailsOf } from "@/components/program/certificate-details";
import { certificateByNumber } from "@/lib/certificate";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  const c = await certificateByNumber((await params).number).catch(() => null);
  return c && !c.revoked
    ? { title: `${c.name} — ${c.program} certificate · Node`, description: `${c.name} completed ${c.program}, Node's 30-day agentic delivery program. Certificate No. ${c.number}.` }
    : { title: "Certificate not found · Node" };
}

/* Public: anyone with a certificate's number (it's printed on it) can check it's real */
export default async function VerifyCertificate({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const c = await certificateByNumber(number).catch(() => null);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host") ?? "localhost"}`;
  const valid = !!c && !c.revoked;
  return (
    <main className="min-h-screen bg-[#f4f3ef] px-4 py-8 sm:px-8" style={{ backgroundImage: "radial-gradient(rgba(13,17,23,.07) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <div className="mx-auto grid max-w-5xl gap-6">
        <Link href="/" className="flex items-center gap-2 justify-self-start text-[14px] font-black text-[var(--primary)]"><span className="flex size-8 items-center justify-center rounded-xl bg-[var(--deep-indigo)] text-white"><MaterialSymbol className="text-[18px]" name="dataset" /></span>Node.</Link>
        {valid ? (
          <>
            <section className="flex flex-wrap items-center gap-3 rounded-[20px] border border-[var(--bridge-teal)]/30 bg-white px-5 py-4">
              <span className="flex size-11 items-center justify-center rounded-full bg-[var(--bridge-teal)] text-white"><MaterialSymbol className="text-[24px]" filled name="verified" /></span>
              <span className="grid min-w-0 flex-1 leading-tight">
                <b className="text-[16px] text-[var(--primary)]">Verified certificate</b>
                <span className="text-[13px] text-black/55"><b className="text-[var(--primary)]">{c.name}</b> completed <b className="text-[var(--primary)]">{c.program}</b>, Node’s 30-day agentic delivery program, on {new Date(c.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.</span>
              </span>
              <span className="font-mono text-[12px] text-black/45">No. {c.number}</span>
            </section>
            <div className="overflow-hidden rounded-[18px] shadow-[0_40px_90px_-40px_rgba(13,17,23,.7)] ring-1 ring-black/10">
              <CertificateArt details={detailsOf(c, origin)} className="block h-auto w-full" />
            </div>
          </>
        ) : (
          <section className="grid justify-items-center gap-3 rounded-[22px] border border-black/[0.06] bg-white p-10 text-center">
            <MaterialSymbol className="text-[40px] text-[#a3104a]" name="gpp_bad" />
            <h1 className="text-[22px] font-bold text-[var(--primary)]">{c?.revoked ? "This certificate has been withdrawn" : "No certificate with that number"}</h1>
            <p className="max-w-md text-[14px] text-black/55">Check the number printed on the certificate — it looks like NODE-CPG-2026-7KQ4XM.</p>
          </section>
        )}
      </div>
    </main>
  );
}
