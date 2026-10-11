import type { CertificateView } from "@/lib/certificate";

import type { CertDetails } from "./certificate-art";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/* what's printed on a certificate (shared by the trainee's page and the public verify page) */
export function detailsOf(c: Pick<CertificateView, "name" | "program" | "issuedAt" | "number">, origin?: string): CertDetails {
  return {
    name: c.name, program: c.program, title: "Completion", year: String(new Date(c.issuedAt).getFullYear()),
    line: `for completing the 30-day agentic delivery program · ${fmtDate(c.issuedAt)}`,
    number: c.number, verifyUrl: origin ? `${origin.replace(/^https?:\/\//, "")}/certificate/${c.number}` : undefined,
  };
}
