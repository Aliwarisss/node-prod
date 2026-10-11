import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { ProductPrdWorkspace } from "@/components/product/prd-workspace";
import { ProductDirectoryDashboard } from "@/components/product/product-directory-dashboard";
import { getAdminDashboardContext } from "@/lib/bos-roadmap/admin";
import { findProductById, listProductSummaries } from "@/lib/bos-roadmap/service";

export const metadata: Metadata = { title: "Projects — Node admin" };

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ roadmapId?: string; productId?: string }>;
}) {
  const { checklist, profile, session } = await getAdminDashboardContext();
  const { roadmapId, productId } = await searchParams;
  const resolvedProductId = productId ?? roadmapId;

  if (resolvedProductId) {
    const product = await findProductById(resolvedProductId);

    if (!product) {
      notFound();
    }

    return (
      <DashboardChrome
        activeSection="projects"
        checklist={checklist}
        profile={profile}
        user={session.user}
      >
        <ProductPrdWorkspace initialProduct={product} />
      </DashboardChrome>
    );
  }

  const products = await listProductSummaries();

  return (
    <DashboardChrome
      activeSection="projects"
      checklist={checklist}
      profile={profile}
      user={session.user}
    >
      <ProductDirectoryDashboard initialProducts={products} />
    </DashboardChrome>
  );
}
