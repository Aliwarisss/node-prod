import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { LoginForm } from "@/components/product/auth-forms";
import { AuthLayout } from "@/components/platform/auth-layout";
import { authOptions } from "@/lib/auth/options";

export const metadata: Metadata = { title: "Sign in — Node", description: "Sign in to your Node workspace and continue your program." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ ended?: string }> }) {
  const session = await getServerSession(authOptions);

  /* an ended session (signed in on another device since) still has a session object, but no user */
  if (session?.user) {
    redirect("/dashboard");
  }
  const ended = (await searchParams).ended === "elsewhere";

  return (
    <AuthLayout
      kicker="Welcome back"
      title={<>Pick up <span className="text-[var(--electric-pink)]">where you left off.</span></>}
      lead="Your project, your progress and your next step are waiting in your workspace."
      alternate={{ text: "New to Node?", label: "Create account", href: "/register" }}
    >
      {ended ? (
        <p role="status" className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#e2b13c]/40 bg-[#fff8e6] px-4 py-3 text-[13.5px] leading-6 text-[#6b4e00]">
          <MaterialSymbol className="mt-0.5 text-[19px]" name="devices" />
          <span><b>You were signed out here.</b> An admin signed your account out on every device. Sign in again to continue — on one device and browser at a time.</span>
        </p>
      ) : null}
      <LoginForm />
    </AuthLayout>
  );
}
