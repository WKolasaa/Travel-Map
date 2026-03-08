"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={logout} disabled={isPending} className="w-full rounded-2xl border border-line/60 px-4 py-3 text-left text-sm text-cloud/80 transition hover:border-mint/50 disabled:opacity-50">
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
