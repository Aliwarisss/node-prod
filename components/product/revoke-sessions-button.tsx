"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";

/* Admin: sign a trainee out everywhere — for a lost or shared device that's holding their account */
export function RevokeSessionsButton({ userId }: { userId: string }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [sure, setSure] = useState(false);
  const [pending, start] = useTransition();
  const go = () => start(async () => {
    const res = await fetch(`/api/admin/users/${userId}/sessions`, { method: "DELETE" });
    if (!res.ok) { pushToast({ variant: "error", title: "Not signed out", description: "Try again in a moment." }); return; }
    pushToast({ variant: "success", title: "Signed out everywhere", description: "They can sign in again on any one device." });
    setSure(false);
    router.refresh();
  });
  return sure ? (
    <span className="flex flex-wrap items-center gap-2 rounded-xl bg-[#fdecf2] px-3 py-2 text-[12.5px] text-[#7a0c38]">
      <span className="flex-1">Sign them out on every device now?</span>
      <button type="button" onClick={() => setSure(false)} className="rounded-full px-3 py-1 font-bold text-black/55 hover:text-black">Cancel</button>
      <button type="button" onClick={go} disabled={pending} className="rounded-full bg-[#a3104a] px-3 py-1 font-bold text-white disabled:opacity-60">{pending ? "Signing out…" : "Sign out"}</button>
    </span>
  ) : (
    <button type="button" onClick={() => setSure(true)} className="flex w-fit items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-1.5 text-[12.5px] font-bold text-[var(--primary)] hover:border-[#a3104a] hover:text-[#a3104a]">
      <MaterialSymbol className="text-[16px]" name="logout" />Sign out everywhere
    </button>
  );
}
