/* Referrals — every member gets a code. The program is PKR 10,000; the fee is PKR 5,000 (50% off).
 * - Before you pay: each friend who joins (their fee is confirmed) takes PKR 1,000 off your fee; five make it free, and
 *   the program unlocks on its own.
 * - After you've paid: each friend who joins earns you half that — PKR 500 cash back — up to PKR 2,500 (half your fee).
 * A referral counts only once the friend has joined — sign-ups alone don't, so it can't be gamed with fake accounts.
 * The fee can be paid in parts: admins record each payment, and the program unlocks once payments (and referral
 * discounts) cover it. Access is never taken back. Server code. */
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import type { FeeStatus } from "@/lib/fee-types";

export const FULL_FEE = 10000; // the fee before the 50% discount
export const FEE = 5000;
export const REWARD = 1000;
export const CASHBACK = REWARD / 2; // per friend who joins after you've paid
export const FREE_AT = Math.ceil(FEE / REWARD); // 5
export const pkr = (n: number) => `PKR ${n.toLocaleString("en-US")}`;
export const dueFor = (joined: number) => Math.max(0, FEE - REWARD * joined);
/* cash back for friends who joined after you paid: half the reward each, up to five friends in all */
export const cashbackFor = (joined: number, paidJoined: number) => CASHBACK * Math.max(0, Math.min(joined, FREE_AT) - Math.min(paidJoined, FREE_AT));

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I to misread
function makeCode(name: string) {
  const letters = (name || "NODE").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "NODE";
  let tail = "";
  for (let i = 0; i < 4; i++) tail += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${letters}${tail}`;
}

/* a member's code — made the first time it's needed */
export async function ensureReferralCode(userId: string): Promise<string> {
  await connectToDatabase();
  const u = await UserModel.findById(userId, { referralCode: 1, name: 1, email: 1 }).lean();
  if (!u) return "";
  if (u.referralCode) return u.referralCode;
  for (let i = 0; i < 6; i++) {
    const code = makeCode(u.name || u.email || "");
    const res = await UserModel.updateOne({ _id: userId, referralCode: { $in: [null, ""] } }, { $set: { referralCode: code } }).catch(() => null);
    if (res?.modifiedCount) return code;
    const again = await UserModel.findById(userId, { referralCode: 1 }).lean();
    if (again?.referralCode) return again.referralCode;
  }
  return "";
}

/* who a code belongs to (for sign-up) */
export async function referrerByCode(code: string) {
  if (!/^[A-Z0-9]{4,12}$/i.test(code)) return null;
  await connectToDatabase();
  return UserModel.findOne({ referralCode: code.toUpperCase() }, { name: 1, email: 1, role: 1 }).lean();
}

/* ---------- the fee, paid in parts ---------- */
type PayDoc = { _id?: unknown; amount?: number | null; at?: Date | null; method?: string | null; note?: string | null; by?: string | null };
type FeeUser = { role?: string | null; paymentStatus?: string | null; paymentMarkedBy?: string | null; paidJoined?: number | null; payments?: PayDoc[] | null };
const received = (ps?: PayDoc[] | null) => (ps ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);

/* where a trainee's fee stands: what's owed after referral discounts, what's been received, and the balance */
export function feeStatus(u: FeeUser | null | undefined, joined: number): FeeStatus {
  const payments = (u?.payments ?? []).filter((p) => (p.amount ?? 0) > 0)
    .map((p) => ({ id: String(p._id ?? ""), amount: p.amount ?? 0, at: p.at ? new Date(p.at).toISOString() : "", method: p.method || "cash", note: p.note || "", by: p.by || "" }))
    .sort((a, b) => a.at.localeCompare(b.at));
  const sum = payments.reduce((s, p) => s + p.amount, 0);
  if (u?.role === "admin") return { full: FULL_FEE, fee: FEE, discount: 0, total: 0, paid: 0, balance: 0, over: 0, waived: 0, settled: true, implied: false, payments };
  const settled = u?.paymentStatus === "paid";
  /* once settled, the discount is the one they settled with; until then it grows as friends join */
  const counted = settled ? (u?.paymentMarkedBy === "referrals" ? FREE_AT : Math.min(u?.paidJoined ?? 0, FREE_AT)) : Math.min(joined, FREE_AT);
  const total = dueFor(counted);
  const implied = settled && u?.paymentMarkedBy !== "referrals" && sum === 0 && total > 0;
  const paid = implied ? total : sum;
  return {
    full: FULL_FEE, fee: FEE, discount: FEE - total, total, paid,
    balance: settled ? 0 : Math.max(0, total - paid),
    over: Math.max(0, paid - total),
    waived: settled && !implied ? Math.max(0, total - paid) : 0,
    settled, implied, payments,
  };
}

/* where one trainee's fee stands, fresh from the database */
export async function feeOf(userId: string): Promise<FeeStatus> {
  await connectToDatabase();
  const [u, joined] = await Promise.all([
    UserModel.findById(userId, { role: 1, paymentStatus: 1, paymentMarkedBy: 1, paidJoined: 1, payments: 1 }).lean(),
    UserModel.countDocuments({ referredBy: userId, paymentStatus: "paid" }),
  ]);
  return feeStatus(u, joined);
}

/* if payments and referral discounts now cover the fee, unlock the program (and count them for whoever referred
   them). `by` is who settled it: an admin's email, or null when it settled itself */
export async function settleFee(userId: string, by: string | null, depth = 0): Promise<boolean> {
  await connectToDatabase();
  const u = await UserModel.findById(userId, { paymentStatus: 1, role: 1, payments: 1 }).lean();
  if (!u || u.role === "admin" || u.paymentStatus === "paid") return false;
  const joined = await UserModel.countDocuments({ referredBy: userId, paymentStatus: "paid" });
  const sum = received(u.payments);
  if (sum < dueFor(joined)) return false;
  const res = await UserModel.updateOne(
    { _id: userId, paymentStatus: { $ne: "paid" } },
    { $set: { paymentStatus: "paid", paidAt: new Date(), paymentMarkedBy: by ?? (sum > 0 ? "payments" : "referrals"), paidJoined: Math.min(joined, FREE_AT) } },
  );
  if (res.modifiedCount) await settleReferrals(userId, depth + 1);
  return res.modifiedCount > 0;
}

export type ReferralSummary = {
  fee: FeeStatus;
  code: string; invited: number; joined: number; due: number; free: boolean; paid: boolean; paidVia: "cash" | "referrals" | null;
  cashback: { earned: number; paidOut: number; owed: number; max: number };
  people: { name: string; joined: boolean; at: string | null }[];
};
const firstName = (n?: string | null, e?: string | null) => (n?.trim() ? n.trim().split(/\s+/)[0] : (e ?? "Friend").split("@")[0]);

export async function referralSummary(userId: string): Promise<ReferralSummary> {
  await connectToDatabase();
  const [code, me, people] = await Promise.all([
    ensureReferralCode(userId),
    UserModel.findById(userId, { paymentStatus: 1, paymentMarkedBy: 1, role: 1, paidJoined: 1, cashbackPaid: 1, payments: 1 }).lean(),
    UserModel.find({ referredBy: userId }, { name: 1, email: 1, paymentStatus: 1, paidAt: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean(),
  ]);
  const joined = people.filter((p) => p.paymentStatus === "paid").length;
  const paid = me?.paymentStatus === "paid" || me?.role === "admin";
  const earned = me?.paymentStatus === "paid" ? cashbackFor(joined, me.paidJoined ?? 0) : 0;
  const paidOut = Math.min(me?.cashbackPaid ?? 0, earned);
  return {
    fee: feeStatus(me, joined),
    cashback: { earned, paidOut, owed: earned - paidOut, max: CASHBACK * FREE_AT },
    code, invited: people.length, joined, due: dueFor(joined), free: joined >= FREE_AT, paid,
    paidVia: me?.paymentStatus === "paid" ? (me.paymentMarkedBy === "referrals" ? "referrals" : "cash") : null,
    people: people.map((p) => ({ name: firstName(p.name, p.email), joined: p.paymentStatus === "paid", at: (p.paidAt ?? (p as { createdAt?: Date }).createdAt) ? new Date((p.paidAt ?? (p as { createdAt?: Date }).createdAt)!).toISOString() : null })),
  };
}

/* after someone joins: their referrer's fee drops; at zero, the referrer's program unlocks — and that may in turn
   count for whoever referred them */
export async function settleReferrals(userId: string, depth = 0): Promise<void> {
  if (depth > 10) return;
  await connectToDatabase();
  const u = await UserModel.findById(userId, { referredBy: 1, paymentStatus: 1 }).lean();
  if (!u?.referredBy || u.paymentStatus !== "paid") return;
  /* the referrer's discount just grew — with what they've already paid, that may now cover their fee */
  await settleFee(String(u.referredBy), null, depth);
}
