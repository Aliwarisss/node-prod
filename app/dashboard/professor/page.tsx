import { redirect } from "next/navigation";

/* the Professor lives on the public site now */
export default function ProfessorPage() {
  redirect("/professor");
}
