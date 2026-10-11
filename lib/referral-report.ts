/* Admin: where referrals came from and what came of them — who referred whom, each friend's sign-up and join,
 * the fee discounts and free unlocks they earned, and cash back owed and handed over. Server code. */
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { CASHBACK, cashbackFor, dueFor, FEE, FREE_AT, REWARD } from "@/lib/referrals";

export type Reward = "discount" | "cashback" | "none";
export type Referee = { id: string; name: string; email: string; signedUpAt: string | null; joinedAt: string | null; reward: Reward | null };
export type ReferrerRow = {
  id: string; name: string; email: string; code: string;
  status: "unpaid" | "cash" | "free" | "admin"; paidAt: string | null;
  invited: number; joined: number; due: number;
  discount: number; // PKR off their fee from friends who joined (pending until they pay, if unpaid)
  cashback: { earned: number; paidOut: number; owed: number };
  lastActivity: string | null;
  referees: Referee[];
};
export type ReferralEvent = {
  at: string;
  kind: "signup" | "join" | "free" | "paid" | "cashout";
  who: string; whoId: string;
  referrer: string; referrerId: string;
  note: string;
  amount: number; // PKR involved (0 for none)
};
export type ReferralReport = {
  totals: {
    referrers: number; signups: number; joined: number; conversion: number;
    discountGiven: number; discountPending: number; freeUnlocks: number;
    cashbackEarned: number; cashbackPaid: number; cashbackOwed: number;
  };
  rows: ReferrerRow[];
  events: ReferralEvent[];
};

const iso = (d?: Date | string | null) => (d ? new Date(d).toISOString() : null);
const nameOf = (u: { name?: string | null; email?: string | null }) => (u.name?.trim() || (u.email ?? "Someone").split("@")[0]);
const money = (n: number) => `PKR ${n.toLocaleString("en-US")}`;

export async function referralReport(): Promise<ReferralReport> {
  await connectToDatabase();
  const users = await UserModel.find({}, {
    name: 1, email: 1, role: 1, referralCode: 1, referredBy: 1, paymentStatus: 1, paidAt: 1, paymentMarkedBy: 1, paidJoined: 1, cashbackPaid: 1, cashbackLog: 1, payments: 1, createdAt: 1,
  }).lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  const kids = new Map<string, typeof users>();
  for (const u of users) if (u.referredBy && byId.has(u.referredBy)) kids.set(u.referredBy, [...(kids.get(u.referredBy) ?? []), u]);

  const rows: ReferrerRow[] = [];
  const events: ReferralEvent[] = [];
  for (const [rid, list] of kids) {
    const r = byId.get(rid)!;
    const rName = nameOf(r);
    const status: ReferrerRow["status"] = r.role === "admin" ? "admin" : r.paymentStatus !== "paid" ? "unpaid" : r.paymentMarkedBy === "referrals" ? "free" : "cash";
    /* friends in the order they joined: the first ones came off the fee, later ones (after a cash payment) earn cash back */
    const joinedList = list.filter((k) => k.paymentStatus === "paid").sort((a, b) => +new Date(a.paidAt ?? 0) - +new Date(b.paidAt ?? 0));
    const discountSlots = status === "cash" ? Math.min(r.paidJoined ?? 0, FREE_AT) : status === "admin" ? 0 : FREE_AT;
    const rewardOf = new Map<string, Reward>();
    joinedList.forEach((k, i) => rewardOf.set(String(k._id), i < discountSlots ? "discount" : status === "cash" && i < FREE_AT ? "cashback" : "none"));
    const joined = joinedList.length;
    const earned = status === "cash" ? cashbackFor(joined, r.paidJoined ?? 0) : 0;
    const paidOut = Math.min(r.cashbackPaid ?? 0, earned);
    const discountCount = [...rewardOf.values()].filter((x) => x === "discount").length;

    const referees: Referee[] = list
      .map((k) => ({ id: String(k._id), name: nameOf(k), email: k.email ?? "", signedUpAt: iso((k as { createdAt?: Date }).createdAt), joinedAt: k.paymentStatus === "paid" ? iso(k.paidAt) : null, reward: rewardOf.get(String(k._id)) ?? null }))
      .sort((a, b) => +new Date(b.joinedAt ?? b.signedUpAt ?? 0) - +new Date(a.joinedAt ?? a.signedUpAt ?? 0));

    /* what happened, as events */
    for (const k of referees) {
      if (k.signedUpAt) events.push({ at: k.signedUpAt, kind: "signup", who: k.name, whoId: k.id, referrer: rName, referrerId: rid, note: `signed up with ${rName}’s code`, amount: 0 });
      if (k.joinedAt) {
        const reward = k.reward;
        const note = reward === "discount" ? (status === "unpaid" ? `joined — ${money(REWARD)} off ${rName}’s fee` : `joined — ${money(REWARD)} came off ${rName}’s fee`)
          : reward === "cashback" ? `joined — ${rName} earns ${money(CASHBACK)} cash back`
          : status === "admin" ? `joined through ${rName} (admin — no reward)` : `joined through ${rName} — past ${FREE_AT}, no further reward`;
        events.push({ at: k.joinedAt, kind: "join", who: k.name, whoId: k.id, referrer: rName, referrerId: rid, note, amount: reward === "discount" ? REWARD : reward === "cashback" ? CASHBACK : 0 });
      }
    }
    if (status === "free" && r.paidAt) events.push({ at: iso(r.paidAt)!, kind: "free", who: rName, whoId: rid, referrer: rName, referrerId: rid, note: `reached ${FREE_AT} friends — fee covered, program unlocked`, amount: FEE });
    if (status === "cash" && r.paidAt) {
      const off = REWARD * discountCount;
      events.push({ at: iso(r.paidAt)!, kind: "paid", who: rName, whoId: rid, referrer: rName, referrerId: rid, note: off ? `paid ${money(dueFor(discountCount))} in cash (${money(off)} off from referrals)` : `paid ${money(FEE)} in cash — friends from now on earn cash back`, amount: dueFor(discountCount) });
    }
    for (const c of (r.cashbackLog ?? []) as { amount?: number; at?: Date; by?: string }[]) {
      if (c.at) events.push({ at: iso(c.at)!, kind: "cashout", who: rName, whoId: rid, referrer: rName, referrerId: rid, note: `received ${money(c.amount ?? 0)} cash back${c.by ? ` (by ${c.by.split("@")[0]})` : ""}`, amount: c.amount ?? 0 });
    }

    const times = [...referees.flatMap((k) => [k.signedUpAt, k.joinedAt]), iso(r.paidAt)].filter(Boolean) as string[];
    rows.push({
      id: rid, name: rName, email: r.email ?? "", code: r.referralCode ?? "", status, paidAt: iso(r.paidAt),
      invited: list.length, joined, due: status === "unpaid" ? Math.max(0, dueFor(joined) - (r.payments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)) : 0, // less what they've paid so far
      discount: REWARD * discountCount,
      cashback: { earned, paidOut, owed: earned - paidOut },
      lastActivity: times.sort().at(-1) ?? null,
      referees,
    });
  }

  rows.sort((a, b) => b.joined - a.joined || b.invited - a.invited || +new Date(b.lastActivity ?? 0) - +new Date(a.lastActivity ?? 0));
  events.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const signups = rows.reduce((s, r) => s + r.invited, 0), joined = rows.reduce((s, r) => s + r.joined, 0);
  return {
    totals: {
      referrers: rows.length, signups, joined, conversion: signups ? Math.round((joined / signups) * 100) : 0,
      discountGiven: rows.filter((r) => r.status !== "unpaid").reduce((s, r) => s + r.discount, 0),
      discountPending: rows.filter((r) => r.status === "unpaid").reduce((s, r) => s + r.discount, 0),
      freeUnlocks: rows.filter((r) => r.status === "free").length,
      cashbackEarned: rows.reduce((s, r) => s + r.cashback.earned, 0),
      cashbackPaid: rows.reduce((s, r) => s + r.cashback.paidOut, 0),
      cashbackOwed: rows.reduce((s, r) => s + r.cashback.owed, 0),
    },
    rows,
    events: events.slice(0, 200),
  };
}
