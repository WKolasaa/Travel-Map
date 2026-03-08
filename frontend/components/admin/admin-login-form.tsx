"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ detail: "Login failed" }));
        setError(typeof payload.detail === "string" ? payload.detail : "Login failed");
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[30px] border border-line/60 bg-panel/75 p-8 shadow-panel backdrop-blur">
      <p className="text-xs uppercase tracking-[0.35em] text-mint/70">admin access</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold text-cloud">Sign in to Travel Map CMS</h1>
      <p className="mt-3 text-sm text-cloud/70">
        Use a managed user account from the admin directory. Roles control whether you can only review content, edit it, or manage other users.
      </p>
      <div className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" autoComplete="username" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" autoComplete="current-password" />
        </label>
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      <button type="button" onClick={submit} disabled={isPending} className="mt-6 w-full rounded-full bg-accentBrand px-5 py-3 text-sm font-semibold text-ink disabled:opacity-50">
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}
