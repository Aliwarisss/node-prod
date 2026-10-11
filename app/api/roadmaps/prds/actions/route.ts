import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import {
  approvePrdRole,
  generateRequirementModel,
  generateRoadmapPlaceholder,
  submitPrdForReview,
} from "@/lib/bos-roadmap/service";

export const runtime = "nodejs";

const actionSchema = z.object({
  action: z.enum([
    "submit_review",
    "approve_role",
    "generate_requirement_model",
    "generate_roadmap",
  ]),
  productId: z.string().trim().min(1),
  prdId: z.string().trim().min(1),
  role: z
    .enum(["productOwner", "domainOwner", "engineeringLead", "designLead", "qaLead"])
    .optional(),
  reviewer: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export async function POST(request: Request) {
  const session = await requireAdminRouteSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = actionSchema.parse(body);

    if (parsed.action === "submit_review") {
      const result = await submitPrdForReview(
        parsed.productId,
        parsed.prdId,
        session.user.id,
      );

      if (!result) {
        return NextResponse.json({ error: "PRD not found." }, { status: 404 });
      }

      return NextResponse.json(result);
    }

    if (parsed.action === "approve_role") {
      if (!parsed.role) {
        return NextResponse.json({ error: "role is required." }, { status: 400 });
      }

      const result = await approvePrdRole(
        parsed.productId,
        parsed.prdId,
        parsed.role,
        parsed.reviewer,
        parsed.notes,
        session.user.id,
      );

      if (!result) {
        return NextResponse.json({ error: "PRD not found." }, { status: 404 });
      }

      return NextResponse.json(result);
    }

    if (parsed.action === "generate_requirement_model") {
      const result = await generateRequirementModel(
        parsed.productId,
        parsed.prdId,
        session.user.id,
      );

      if (!result) {
        return NextResponse.json({ error: "PRD not found." }, { status: 404 });
      }

      return NextResponse.json(result);
    }

    const result = await generateRoadmapPlaceholder(
      parsed.productId,
      parsed.prdId,
      session.user.id,
    );

    if (!result) {
      return NextResponse.json({ error: "PRD not found." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("PRD action error", error);
    return NextResponse.json({ error: "Unable to run PRD action." }, { status: 400 });
  }
}
