import { hashPassword } from "./password";
import { UserModel } from "@/lib/models/user";

const HARDCODED_ADMIN_ACCOUNTS = [
  {
    email: "admin@node.systems",
    experienceLevel: "Senior operator",
    learningGoal: "Platform administration",
    name: "Node Admin",
    password: "Admin12345",
    primaryTrack: "Platform Operations",
    role: "admin",
    timezone: "UTC",
    weeklyHours: "40",
  },
  {
    email: "admin@node.local",
    experienceLevel: "Senior operator",
    learningGoal: "Platform administration",
    name: "Node Admin Local",
    password: "Admin12345",
    primaryTrack: "Platform Operations",
    role: "admin",
    timezone: "UTC",
    weeklyHours: "40",
  },
] as const;

async function upsertHardcodedAdmin() {
  /* in parallel: each hash is ~half a second of bcrypt, and this sits in front of the first request after a start */
  await Promise.all(HARDCODED_ADMIN_ACCOUNTS.map(async (account) => {
    const passwordHash = await hashPassword(account.password);

    await UserModel.findOneAndUpdate(
      { email: account.email },
      {
        $set: {
          bio: "Hardcoded platform administrator account.",
          experienceLevel: account.experienceLevel,
          learningGoal: account.learningGoal,
          name: account.name,
          onboardingCompleted: true,
          onboardingSkipped: false,
          passwordHash,
          primaryTrack: account.primaryTrack,
          role: account.role,
          timezone: account.timezone,
          weeklyHours: account.weeklyHours,
        },
        $setOnInsert: {
          email: account.email,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );
  }));

  /* named admins: created once without a password — they set their own at first sign-in, and it's never reset here */
  await Promise.all(SEEDED_ADMINS.map((admin) =>
    UserModel.updateOne(
      { email: admin.email },
      {
        $set: { role: "admin" },
        $setOnInsert: {
          email: admin.email,
          name: admin.name,
          passwordHash: "",
          passwordSetupRequired: true,
          paymentStatus: "paid",
          onboardingCompleted: true,
          primaryTrack: "Platform Operations",
        },
      },
      { upsert: true },
    ),
  ));
}

const SEEDED_ADMINS = [{ email: "adeel@node.systems", name: "Adeel" }] as const;

/* once per server process — kept on globalThis, since Next gives each route bundle its own copy of this module */
const globalForAdmin = globalThis as typeof globalThis & { __hardcodedAdmin__?: Promise<void> | null };

export async function ensureHardcodedAdmin() {
  if (!globalForAdmin.__hardcodedAdmin__) {
    globalForAdmin.__hardcodedAdmin__ = upsertHardcodedAdmin().catch((error) => {
      globalForAdmin.__hardcodedAdmin__ = null;
      throw error;
    });
  }

  await globalForAdmin.__hardcodedAdmin__;
}

export const hardcodedAdminCredentials = {
  email: HARDCODED_ADMIN_ACCOUNTS[0].email,
  password: HARDCODED_ADMIN_ACCOUNTS[0].password,
};
