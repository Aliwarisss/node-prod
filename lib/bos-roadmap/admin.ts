import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";

export async function requireAdminRouteSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return null;
  }

  return session;
}

export async function getAdminDashboardContext() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  const dbUser = await UserModel.findById(session.user.id).lean();

  if (!dbUser) {
    redirect("/login");
  }

  if (dbUser.role !== "admin") {
    redirect("/dashboard");
  }

  const profile = profileOf(dbUser);

  return {
    checklist: buildProfileChecklist(profile),
    profile,
    session,
  };
}
