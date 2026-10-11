import { NextResponse } from "next/server";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import {
  createProduct,
  deleteProduct,
  findProductById,
  listProductSummaries,
  updateProduct,
} from "@/lib/bos-roadmap/service";
import { productCreateSchema, productUpdateSchema } from "@/lib/bos-roadmap/schemas";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireAdminRouteSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (productId) {
    const product = await findProductById(productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  }

  const products = await listProductSummaries();
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const session = await requireAdminRouteSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = productCreateSchema.parse(body);
    const product = await createProduct(parsed, session.user.id);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error", error);
    return NextResponse.json(
      { error: "Unable to create product." },
      { status: 400 },
    );
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

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = productUpdateSchema.parse(body);
    const product = await updateProduct(productId, parsed, session.user.id);

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

export async function DELETE(request: Request) {
  const session = await requireAdminRouteSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  const product = await deleteProduct(productId);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ product });
}
