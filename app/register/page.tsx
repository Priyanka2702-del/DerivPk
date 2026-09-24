import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Open Account",
  description: "Open a  Deriv PK Trading account.",
};

export default function RegisterPage() {
  const redThemeVars = {
    "--pk-accent": "#ff3f4e",
    "--pk-accent-2": "#ff6b76",
    "--pk-accent-ink": "#ffffff",
  } as CSSProperties;

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-5 py-16"
      style={redThemeVars}
    >
      {/* red glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,63,78,0.28), transparent 70%)",
        }}
      />

      <div className="relative z-10 mb-8">
        <Logo />
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-[var(--pk-radius-lg)] border border-border bg-surface p-8 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        <h1 className="pk-display text-2xl font-bold text-text">
          Open your PK account
        </h1>

        <p className="mt-2 text-sm text-text-muted">
          This is a placeholder sign-up screen for the PK demo site.
        </p>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#ff3f4e] hover:text-[#ff5260]">
            Log in
          </Link>
        </p>
      </div>

      <Link
        href="/"
        className="relative z-10 mt-8 flex items-center gap-1.5 text-sm text-text-muted transition hover:text-text"
      >
        <ArrowLeft size={15} aria-hidden />
        Back to home
      </Link>
    </main>
  );
}