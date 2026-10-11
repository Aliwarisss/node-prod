import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { certificateStatus, issueCertificate } from "@/lib/certificate";

const claimSchema = z.object({ name: z.string().trim().min(3, "Enter the name to print — at least 3 characters.").max(60, "That name is too long for the certificate.") });

/* claim the certificate: only once the program is finished; the name is fixed from then on */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const parsed = claimSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the name." }, { status: 400 });
  const status = await certificateStatus(session.user.id);
  if (status.certificate) return NextResponse.json(status.certificate);
  if (!status.eligible) return NextResponse.json({ error: "Finish every day of the program to earn your certificate." }, { status: 403 });
  return NextResponse.json(await issueCertificate(session.user.id, parsed.data.name));
}
