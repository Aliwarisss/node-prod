import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      primaryTrack: string | null;
    };
  }

  interface User {
    role?: string;
    primaryTrack?: string | null;
    sid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    primaryTrack?: string | null;
    /* the session id: an account is signed in on one device at a time */
    sid?: string;
    /* set once the account has signed in somewhere else */
    ended?: boolean;
  }
}
