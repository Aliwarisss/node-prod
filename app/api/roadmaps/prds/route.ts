import { NextResponse } from "next/server";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { createPrd, deletePrd, updatePrd } from "@/lib/bos-roadmap/service";
import { prdCreateSchema, prdUpdateSchema } from "@/lib/bos-roadmap/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireAdminRouteSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = prdCreateSchema.parse(body);
    const result = await createPrd(productId, parsed, session.user.id);

    if (!result) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create PRD error", error);
    return NextResponse.json({ error: "Unable to create PRD." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdminRouteSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const prdId = searchParams.get("prdId");

    if (!productId || !prdId) {
      return NextResponse.json(
        { error: "productId and prdId are required." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = prdUpdateSchema.parse(body);
    const result = await updatePrd(productId, prdId, parsed, session.user.id);

    if (!result) {
      return NextResponse.json({ error: "PRD not found." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update PRD error", error);
    return NextResponse.json({ error: "Unable to update PRD." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminRouteSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const prdId = searchParams.get("prdId");

  if (!productId || !prdId) {
    return NextResponse.json(
      { error: "productId and prdId are required." },
      { status: 400 },
    );
  }

  const product = await deletePrd(productId, prdId, session.user.id);

  if (!product) {
    return NextResponse.json({ error: "PRD not found." }, { status: 404 });
  }

  return NextResponse.json({ product });
}
