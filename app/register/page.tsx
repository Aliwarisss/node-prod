import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/product/auth-forms";
import { AuthLayout } from "@/components/platform/auth-layout";
import { authOptions } from "@/lib/auth/options";

export const metadata: Metadata = { title: "Create your account — Node", description: "Join Node free — explore the models and toolkits, and enrol in a program when you are ready." };

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout
      kicker="Join Node"
      title={<>Bridge the gap. <span className="text-[var(--electric-pink)]">Start today.</span></>}
      lead="Create your free account to explore the models and toolkits — and enrol in a program when you’re ready."
      alternate={{ text: "Already have an account?", label: "Sign in", href: "/login" }}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
