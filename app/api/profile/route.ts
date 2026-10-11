import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { profilePatchSchema } from "@/lib/auth/schemas";
import { roleById, domainById } from "@/lib/explore";
import { connectToDatabase } from "@/lib/mongodb";
import { ExploreMapModel } from "@/lib/models/explore-map";
import { UserModel } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";

/* skip: leave the onboarding for now · patch: save some fields (a step of the onboarding, or the profile), and
   finish: true when the onboarding's last step is done */
const actionSchema = z.union([
  z.object({ action: z.literal("skip") }),
  z.object({ action: z.literal("patch"), finish: z.boolean().optional(), fields: profilePatchSchema }),
]);

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile payload." }, { status: 400 });
    await connectToDatabase();

    const set: Record<string, unknown> = {};
    if (parsed.data.action === "skip") set.onboardingSkipped = true;
    else {
      const f = parsed.data.fields;
      if (f.targetRole && !roleById.has(f.targetRole)) return NextResponse.json({ error: "Pick a role from the list." }, { status: 400 });
      if (f.interests?.some((i) => !domainById.has(i))) return NextResponse.json({ error: "Pick interests from the list." }, { status: 400 });
      /* only the fields sent are saved — a step never wipes another's answers */
      for (const [k, v] of Object.entries(f)) if (v !== undefined) set[k] = v;
      if (parsed.data.finish) Object.assign(set, { onboardingCompleted: true, onboardingSkipped: false });
    }

    const user = await UserModel.findByIdAndUpdate(session.user.id, { $set: set }, { new: true }).lean();
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    /* the career target is Explore's too: it drives My map and the goal on Home */
    if (typeof set.targetRole === "string") {
      await ExploreMapModel.updateOne({ userId: session.user.id }, { $set: { target: set.targetRole } }, { upsert: true }).catch(() => null);
    }

    const profile = profileOf(user as unknown as Parameters<typeof profileOf>[0]);
    return NextResponse.json({ checklist: buildProfileChecklist(profile), profile });
  } catch (error) {
    console.error("Profile update error", error);
    return NextResponse.json({ error: "Unable to update your profile right now." }, { status: 500 });
  }
}
