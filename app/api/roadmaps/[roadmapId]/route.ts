import { NextResponse } from "next/server";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { deleteProduct, findProductById, updateProduct } from "@/lib/bos-roadmap/service";
import { productUpdateSchema } from "@/lib/bos-roadmap/schemas";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roadmapId: string }> },
) {
  const session = await requireAdminRouteSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { roadmapId } = await params;
  const product = await findProductById(roadmapId);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roadmapId: string }> },
) {
  const session = await requireAdminRouteSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { roadmapId } = await params;
    const body = await request.json();
    const parsed = productUpdateSchema.parse(body);
    const product = await updateProduct(roadmapId, parsed, session.user.id);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Update product error", error);
    return NextResponse.json(
      { error: "Unable to update product." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ roadmapId: string }> },
) {
  const session = await requireAdminRouteSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { roadmapId } = await params;
  const product = await deleteProduct(roadmapId);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ product });
}
