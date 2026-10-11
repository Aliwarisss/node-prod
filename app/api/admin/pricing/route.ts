import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { DEFAULT_PRICING } from "@/lib/pricing";
import { PRICING_TAG, readPricing, writePricing } from "@/lib/pricing-store";

export const runtime = "nodejs";

const id = z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/, "Ids are lower-case letters, numbers and dashes.");
const money = z.number().int().min(0).max(100_000_000);
const href = z.string().trim().max(300).refine((h) => h.startsWith("/") || /^https?:\/\//.test(h), "Links start with / or http(s)://");
const pkg = z.object({
  id,
  name: z.string().trim().min(1, "Every package needs a name.").max(80),
  tagline: z.string().trim().max(200),
  price: money.nullable(),
  compareAt: money.nullable(),
  currency: z.string().trim().min(1).max(8),
  suffix: z.string().trim().max(40),
  features: z.array(z.string().trim().min(1).max(160)).max(20),
  badge: z.string().trim().max(30),
  status: z.enum(["open", "soon", "hidden"]),
  ctaLabel: z.string().trim().max(40),
  ctaHref: href,
  featured: z.boolean(),
  flagship: z.boolean(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Not a date.").nullable();
const promo = z.object({
  id,
  label: z.string().trim().min(1, "Every promotion needs a label.").max(60),
  kind: z.enum(["percent", "amount"]),
  value: z.number().min(0).max(100_000_000),
  packageIds: z.array(id).max(20),
  startsAt: iso,
  endsAt: iso,
  active: z.boolean(),
});
const configSchema = z.object({ packages: z.array(pkg).min(1, "Keep at least one package.").max(12), promotions: z.array(promo).max(20) })
  .refine((c) => new Set(c.packages.map((p) => p.id)).size === c.packages.length, "Two packages share an id.")
  .refine((c) => c.packages.filter((p) => p.flagship).length === 1, "Mark exactly one package as the flagship.")
  .refine((c) => c.promotions.every((p) => p.kind !== "percent" || p.value <= 100), "A percentage can’t be over 100.")
  .refine((c) => c.promotions.every((p) => !p.startsAt || !p.endsAt || Date.parse(p.endsAt) > Date.parse(p.startsAt)), "A promotion has to end after it starts.");

/* Admin: the pricing — read it; save it whole (packages and promotions); or reset to the defaults */
export async function GET() {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  return NextResponse.json(await readPricing());
}

export async function PUT(request: Request) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const parsed = configSchema.safeParse(body?.reset ? DEFAULT_PRICING : body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid pricing." }, { status: 400 });
  await writePricing(parsed.data, session.user.email ?? session.user.id);
  /* every page with a price shows the change on its next load */
  revalidateTag(PRICING_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json(await readPricing());
}
