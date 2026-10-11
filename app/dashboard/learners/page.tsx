import { redirect } from "next/navigation";

/* old address — the page is now called Trainees */
export default function LegacyLearnersPage() {
  redirect("/dashboard/trainees");
}
