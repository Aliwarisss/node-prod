import { listProductSummaries } from "@/lib/bos-roadmap/service";
import { connectToDatabase } from "@/lib/mongodb";
import { SubmissionModel } from "@/lib/models/submission";
import { UserModel } from "@/lib/models/user";
import type { FeeStatus } from "@/lib/fee-types";
import { cashbackFor, dueFor, feeStatus } from "@/lib/referrals";

export type TraineeRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  goal: string;
  experience: string;
  joined: string | null;
  onboarded: boolean;
  paid: boolean;
  paidAt: string | null;
  passwordPending: boolean;
  grades: { avg: number; graded: number; passed: number; waiting: number }; // rubric grades on their submitted work
  /* referrals: friends who joined with their link (and who signed up), what they still owe, and who referred them */
  referrals: { joined: number; invited: number };
  due: number;
  paidVia: "cash" | "referrals" | null;
  referredBy: string;
  cashbackOwed: number; // cash back earned for friends who joined after they paid, not yet handed over
  fee: FeeStatus; // what's owed, what's been received, the balance and every payment
};

const WEEK = 7 * 24 * 60 * 60 * 1000;

/* Every account, newest first — for the admin's Trainees page and overview */
export async function listTrainees(): Promise<TraineeRow[]> {
  await connectToDatabase();
  const [users, rows] = await Promise.all([
    UserModel.find({}).sort({ createdAt: -1 }).lean(),
    SubmissionModel.aggregate<{ _id: string; avg: number | null; graded: number; passed: number; waiting: number }>([
      { $match: { status: { $in: ["submitted", "changes", "approved"] } } },
      { $group: {
        _id: "$userId",
        avg: { $avg: "$grade.pct" },
        graded: { $sum: { $cond: [{ $ifNull: ["$grade", false] }, 1, 0] } },
        passed: { $sum: { $cond: [{ $eq: ["$grade.pass", true] }, 1, 0] } },
        waiting: { $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] } },
      } },
    ]),
  ]);
  const grades = new Map(rows.map((r) => [r._id, { avg: Math.round(r.avg ?? 0), graded: r.graded, passed: r.passed, waiting: r.waiting }]));
  /* referral counts, from the same list of people */
  const refs = new Map<string, { joined: number; invited: number }>();
  for (const u of users) {
    if (!u.referredBy) continue;
    const cur = refs.get(u.referredBy) ?? { joined: 0, invited: 0 };
    cur.invited++;
    if (u.paymentStatus === "paid") cur.joined++;
    refs.set(u.referredBy, cur);
  }
  const nameOf = new Map(users.map((u) => [u._id.toString(), u.name?.trim() || u.email]));
  return users.map((u) => {
    const created = (u as { createdAt?: Date }).createdAt;
    const role = u.role || "student";
    return {
      id: u._id.toString(),
      name: u.name?.trim() || "—",
      email: u.email,
      role,
      goal: u.primaryTrack?.trim() || "",
      experience: u.experienceLevel?.trim() || "",
      joined: created ? new Date(created).toISOString() : null,
      onboarded: Boolean(u.onboardingCompleted),
      paid: role === "admin" || u.paymentStatus === "paid",
      paidAt: u.paidAt ? new Date(u.paidAt).toISOString() : null,
      passwordPending: Boolean(u.passwordSetupRequired && !u.passwordHash),
      grades: grades.get(u._id.toString()) ?? { avg: 0, graded: 0, passed: 0, waiting: 0 },
      referrals: refs.get(u._id.toString()) ?? { joined: 0, invited: 0 },
      due: dueFor(refs.get(u._id.toString())?.joined ?? 0),
      paidVia: u.paymentStatus === "paid" ? (u.paymentMarkedBy === "referrals" ? "referrals" : "cash") : null,
      referredBy: u.referredBy ? nameOf.get(u.referredBy) ?? "" : "",
      fee: feeStatus(u, refs.get(u._id.toString())?.joined ?? 0),
      cashbackOwed: u.paymentStatus === "paid" ? Math.max(0, cashbackFor(refs.get(u._id.toString())?.joined ?? 0, u.paidJoined ?? 0) - (u.cashbackPaid ?? 0)) : 0,
    };
  });
}

/* Real numbers for the admin overview: accounts, onboarding, goals and the project workspace */
export async function getAdminStats() {
  const [people, products] = await Promise.all([listTrainees(), listProductSummaries()]);
  const trainees = people.filter((p) => p.role !== "admin");
  const now = Date.now();
  const newThisWeek = trainees.filter((p) => p.joined && now - new Date(p.joined).getTime() < WEEK).length;
  const onboarded = trainees.filter((p) => p.onboarded).length;
  const paid = trainees.filter((p) => p.paid).length;

  const goalCounts = new Map<string, number>();
  for (const p of trainees) {
    const key = p.goal || "Not set";
    goalCounts.set(key, (goalCounts.get(key) ?? 0) + 1);
  }
  const goals = [...goalCounts.entries()].map(([goal, count]) => ({ goal, count })).sort((a, b) => b.count - a.count);

  return {
    traineeCount: trainees.length,
    adminCount: people.length - trainees.length,
    newThisWeek,
    onboardedPct: trainees.length ? Math.round((onboarded / trainees.length) * 100) : 0,
    onboarded,
    paid,
    awaitingFee: trainees.length - paid,
    goals,
    recent: trainees.slice(0, 6),
    productCount: products.length,
    prdCount: products.reduce((n, p) => n + p.prdCount, 0),
    approvedPrdCount: products.reduce((n, p) => n + p.approvedPrdCount, 0),
    openQuestionCount: products.reduce((n, p) => n + p.openQuestionCount, 0),
    products: products.slice(0, 4),
  };
}
