"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login request failed:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="mt-6 flex flex-col gap-4"
      onSubmit={handleSubmit}
    >
      <label className="flex flex-col gap-1.5 text-sm text-text-muted">
        Email

        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-text-muted">
        Password

        <input
          type="password"
          name="password"
          required
          placeholder="••••••••"
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
        />
      </label>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-accent-2 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}