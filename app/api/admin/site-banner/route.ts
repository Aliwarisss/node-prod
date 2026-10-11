import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettingModel } from "@/lib/models/site-setting";
import { BANNER_KEY, BANNER_TAG, readBanner } from "@/lib/site-banner";

export const runtime = "nodejs";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  message: z.string().trim().max(240, "Keep it under 240 characters.").optional(),
});

/* Admin: the development banner — read it, switch it on or off, change its words (empty = the default) */
export async function GET() {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  return NextResponse.json(await readBanner());
}

export async function PATCH(request: Request) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid change." }, { status: 400 });

  await connectToDatabase();
  await SiteSettingModel.updateOne(
    { key: BANNER_KEY },
    { $set: { ...parsed.data, updatedBy: session.user.email ?? session.user.id }, $setOnInsert: { key: BANNER_KEY } },
    { upsert: true },
  );
  /* every page shows the change on its next load — the cached setting, and the pages built with it */
  revalidateTag(BANNER_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json(await readBanner());
}
