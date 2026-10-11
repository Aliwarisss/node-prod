import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductWorkspacePage({
  params,
}: {
  params: Promise<{ roadmapId: string }>;
}) {
  const { roadmapId } = await params;
  redirect(`/dashboard/projects?productId=${encodeURIComponent(roadmapId)}`);
}
