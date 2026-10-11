import { redirect } from "next/navigation";

export default async function LegacyRoadmapProjectRedirectPage({
  params,
}: {
  params: Promise<{ roadmapId: string }>;
}) {
  const { roadmapId } = await params;

  redirect(`/dashboard/projects/${encodeURIComponent(roadmapId)}`);
}
