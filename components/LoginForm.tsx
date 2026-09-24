"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/session";

export default function LoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    // Demo/local auth only — no backend is connected yet. Swap this for a
    // real credential check once an auth API is available; the dashboard
    // itself only ever depends on isLoggedIn()/login()/logout() from
    // @/lib/session, so nothing else needs to change.
    login();
    router.push("/dashboard");
  };

  return (
    <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1.5 text-sm text-text-muted">
        Email
        <input
          type="email"
          required
          placeholder="you@example.com"
          className="rounded-[var(--pk-radius-sm)] border border-border-strong bg-bg-elevated px-3.5 py-2.5 text-text outline-none transition focus-visible:border-[#ff3f4e] focus-visible:ring-2 focus-visible:ring-[#ff3f4e]/20"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-text-muted">
        Password
        <input
          type="password"
          required
          placeholder="••••••••"
          className="rounded-[var(--pk-radius-sm)] border border-border-strong bg-bg-elevated px-3.5 py-2.5 text-text outline-none transition focus-visible:border-[#ff3f4e] focus-visible:ring-2 focus-visible:ring-[#ff3f4e]/20"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-full bg-[#ff3f4e] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(255,63,78,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff5260] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
