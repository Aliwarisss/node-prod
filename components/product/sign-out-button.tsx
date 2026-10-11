"use client";

import { signOut } from "next-auth/react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/" })}
      className={cn(
        buttonVariants(),
        "h-auto rounded-full bg-[var(--primary)] px-5 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-white shadow-xl shadow-black/10 transition-transform duration-300 hover:scale-105 sm:px-7 sm:text-[13px]",
      )}
    >
      Sign Out
    </button>
  );
}
