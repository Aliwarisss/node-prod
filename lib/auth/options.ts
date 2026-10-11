import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";

import { loginSchema } from "./schemas";
import { verifyPassword } from "./password";
import { BLOCKED, claimSession, endSession, isActiveSession, SESSION_DAYS } from "./sessions";

const authSecret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development" ? "node-dev-auth-secret" : undefined);

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: {
    strategy: "jwt",
    /* the same lifetime the one-device rule uses to let go of a session that's no longer used */
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        await connectToDatabase();

        const user = await UserModel.findOne({
          email: parsed.data.email.toLowerCase(),
        }).lean();

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(parsed.data.password, user.passwordHash);

        if (!isValid || !user.email) {
          return null;
        }

        /* one device and browser at a time: refused while the account is in use somewhere else — the sign-in form
           reads the reason (where it's signed in, and when it was last used) */
        const claim = await claimSession(user._id.toString(), req?.headers);
        if (!claim.ok) throw new Error(`${BLOCKED}|${claim.agent}|${claim.seenAt.toISOString()}`);
        const sid = claim.sid;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          primaryTrack: user.primaryTrack ?? undefined,
          sid,
        };
      },
    }),
  ],
  events: {
    async signOut({ token }) {
      if (token?.sub) await endSession(token.sub, token.sid).catch(() => null);
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.primaryTrack = user.primaryTrack;
        token.sid = user.sid;
        delete token.ended;
        return token;
      }
      /* signed in somewhere else since? then this session has ended */
      if (token.sub && !(await isActiveSession(token.sub, token.sid))) token.ended = true;
      return token;
    },
    async session({ session, token }) {
      /* an ended session has no user: pages send it to sign in, APIs refuse it */
      if (token.ended) return { ...session, user: undefined, ended: "elsewhere" } as unknown as typeof session;
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = typeof token.role === "string" ? token.role : "student";
        session.user.primaryTrack =
          typeof token.primaryTrack === "string" ? token.primaryTrack : null;
      }

      return session;
    },
  },
};
