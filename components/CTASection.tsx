import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

export default function CTASection() {
  const redThemeVars = {
    "--pk-accent": "#ff3f4e",
    "--pk-accent-2": "#ff6b76",
    "--pk-accent-ink": "#ffffff",
  } as CSSProperties;

  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={redThemeVars}
    >
      <div className="pk-container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--pk-radius-lg)] border border-[#ff3f4e]/25 bg-surface px-6 py-16 text-center shadow-[0_24px_80px_rgba(255,63,78,0.10)] sm:px-12 sm:py-20">
            {/* Red glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-[380px] w-[600px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(255,63,78,0.55), transparent 65%)",
              }}
            />

            <h2 className="pk-display relative text-3xl font-extrabold text-text sm:text-5xl">
              Start trading with PK
            </h2>

            <p className="relative mx-auto mt-4 max-w-md text-text-muted">
              Open an account in minutes and get access to global markets, four platforms, and
              support that never clocks off.
            </p>

            <div className="relative mt-8 flex items-center justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff3f4e] px-8 py-4 text-base font-bold text-white shadow-[0_18px_45px_rgba(255,63,78,0.32)] transition hover:-translate-y-0.5 hover:bg-[#ff5260]"
              >
                Start Trading Now
                <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}