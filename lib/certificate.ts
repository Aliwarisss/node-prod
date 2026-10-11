import { randomInt } from "node:crypto";

import { connectToDatabase } from "@/lib/mongodb";
import { CertificateModel } from "@/lib/models/certificate";
import { UserModel } from "@/lib/models/user";
import { loadProgress } from "@/lib/program/progress";

/* Certificates for Copy, Paste, Go: earned by finishing the program (every day, through Day 30's capstone), claimed by
   the trainee with the name they want printed, and checkable by anyone from its number. */

export const CERT_PROGRAM = "Copy, Paste, Go";
export const LAST_DAY = 30;

export type CertificateView = { number: string; name: string; program: string; issuedAt: string; revoked: boolean };
const view = (c: { number: string; name: string; program: string; issuedAt: Date; revokedAt?: Date | null }): CertificateView =>
  ({ number: c.number, name: c.name, program: c.program, issuedAt: c.issuedAt.toISOString(), revoked: !!c.revokedAt });

/* finished the program: Day 30 (the capstone's last day) is complete — and a day only opens when the one before it is
   done, so that means every day is */
export async function certificateStatus(userId: string) {
  await connectToDatabase();
  const [progress, cert] = await Promise.all([loadProgress(userId), CertificateModel.findOne({ userId }).lean()]);
  const daysDone = progress.completedDays.length;
  return { eligible: progress.completedDays.includes(LAST_DAY), daysDone, certificate: cert ? view(cert) : null };
}

/* NODE-CPG-2026-7KQ4XM — no look-alike characters, so it reads back cleanly from paper */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const newNumber = (year: number) => `NODE-CPG-${year}-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")}`;

/* issue (once): the name is fixed on the certificate from then on */
export async function issueCertificate(userId: string, name: string) {
  await connectToDatabase();
  const existing = await CertificateModel.findOne({ userId }).lean();
  if (existing) return view(existing);
  const issuedAt = new Date();
  for (let i = 0; i < 5; i++) {
    try {
      const doc = await CertificateModel.create({ userId, number: newNumber(issuedAt.getFullYear()), name: name.trim(), program: CERT_PROGRAM, issuedAt });
      return view(doc);
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e; // a clash on the number: try another
      const again = await CertificateModel.findOne({ userId }).lean(); // or it was claimed twice at once
      if (again) return view(again);
    }
  }
  throw new Error("Couldn't issue a certificate number");
}

/* admins: every certificate issued, newest first, with whose it is */
export type IssuedRow = CertificateView & { userId: string; email: string };
export async function listCertificates(): Promise<IssuedRow[]> {
  await connectToDatabase();
  const certs = await CertificateModel.find({}).sort({ issuedAt: -1 }).lean();
  const users = await UserModel.find({ _id: { $in: certs.map((c) => c.userId) } }, { email: 1 }).lean();
  const email = new Map(users.map((u) => [String(u._id), u.email]));
  return certs.map((c) => ({ ...view(c), userId: c.userId, email: email.get(c.userId) ?? "" }));
}

/* admins: withdraw a certificate (its verify page then says so) — or restore it */
export async function setRevoked(number: string, revoked: boolean) {
  await connectToDatabase();
  const c = await CertificateModel.findOneAndUpdate({ number: number.toUpperCase() }, revoked ? { $set: { revokedAt: new Date() } } : { $unset: { revokedAt: 1 } }, { new: true }).lean();
  return c ? view(c) : null;
}

export async function certificateByNumber(number: string) {
  await connectToDatabase();
  const c = await CertificateModel.findOne({ number: number.toUpperCase() }).lean();
  return c ? view(c) : null;
}
