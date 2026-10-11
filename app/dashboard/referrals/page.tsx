import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeeStatement } from "@/components/product/fee-statement";
import { ReferralPanel } from "@/components/product/referral-panel";
import { ReferralsAdmin } from "@/components/product/referrals-admin";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { referralReport } from "@/lib/referral-report";
import { CASHBACK, FEE, FREE_AT, FULL_FEE, pkr, referralSummary, REWARD } from "@/lib/referrals";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Referrals — Node" };

/* Refer & save — open to every member, paid or not: the fee comes down by PKR 1,000 for each friend who joins.
   Admins see every referral instead: who referred whom, and what came of it */
export default async function ReferralsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await connectToDatabase();
  const isAdmin = session.user.role === "admin";
  const [dbUser, summary, report] = await Promise.all([
    UserModel.findById(session.user.id).lean(),
    isAdmin ? null : referralSummary(session.user.id),
    isAdmin ? referralReport() : null,
  ]);
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const steps = [
    { icon: "share", title: "Share your link", body: "Send it to friends or colleagues who want to build apps with AI agents." },
    { icon: "person_add", title: "They sign up and join", body: "A referral counts once their fee is confirmed — sign-ups alone don’t." },
    { icon: "savings", title: `You save ${pkr(REWARD)} each`, body: `${FREE_AT} friends who join make your program free — it unlocks on its own. Already paid? ${pkr(CASHBACK)} cash back each, up to ${pkr(CASHBACK * FREE_AT)}.` },
  ];
  if (report) {
    return (
      <DashboardChrome activeSection="referrals" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>
        <ReferralsAdmin report={report} />
      </DashboardChrome>
    );
  }
  return (
    <DashboardChrome activeSection="referrals" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>
      <div className="mx-auto grid w-full max-w-4xl gap-5">
        <header className="grid gap-1">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/40">Refer & save</span>
          <h1 className="text-[26px] font-black leading-none tracking-[-0.03em] text-[var(--primary)]">Bring friends, pay less</h1>
          <p className="text-[13.5px] text-[var(--on-surface-variant)]">Copy, Paste, Go — the 30-day program — is <s>{pkr(FULL_FEE)}</s> {pkr(FEE)} — already 50% off. Every friend who joins with your link takes {pkr(REWARD)} more off — five, and it’s free. Already paid? Each friend earns you {pkr(CASHBACK)} cash back instead.</p>
        </header>
        <ReferralPanel data={summary!} />
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="grid content-start gap-1.5 rounded-2xl border border-black/[0.06] bg-white p-4">
              <span className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-full bg-[var(--primary)] text-[12px] font-black text-white">{i + 1}</span><MaterialSymbol className="text-[20px] text-black/40" name={s.icon} /></span>
              <b className="text-[14px] text-[var(--primary)]">{s.title}</b>
              <span className="text-[12.5px] leading-5 text-[var(--on-surface-variant)]">{s.body}</span>
            </li>
          ))}
        </ol>
        <p className="text-[12px] text-black/45">Friends who joined before you paid come off your fee; friends who join after you’ve paid earn cash back, which your Node admin hands over. Your access is never taken away.</p>
        {/* the fee itself: what's owed, every payment, the balance */}
        <section className="grid gap-2" aria-label="Your fee">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/40">Your fee & payments</span>
          <FeeStatement fee={summary!.fee} />
        </section>
      </div>
    </DashboardChrome>
  );
}
