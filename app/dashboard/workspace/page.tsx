import { redirect } from "next/navigation";

/* the workspace is My program's Submissions tab now */
export default function WorkspacePage() {
  redirect("/dashboard/roadmap?view=submissions");
}
