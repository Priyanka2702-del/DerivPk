import type { CSSProperties } from "react";
import { techFeatures } from "@/data/technology";
import Reveal from "./Reveal";

export default function TechnologySection() {
  const redThemeVars = {
    "--pk-accent": "#ff3f4e",
    "--pk-accent-2": "#ff6b76",
    "--pk-accent-ink": "#ffffff",
  } as CSSProperties;

  return (
    <section
      className="relative overflow-hidden border-y border-border bg-bg-elevated py-20 md:py-28"
      style={redThemeVars}
    >
      {/* red glow instead of neon */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,63,78,0.20), transparent 70%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,63,78,0.16), transparent 70%)",
        }}
      />

      <div className="pk-container relative z-10">
        <Reveal>
          <div className="max-w-xl">
            <h2 className="pk-display text-3xl font-extrabold text-text sm:text-4xl">
              Technology built for how markets actually move
            </h2>

            <p className="mt-4 text-text-muted">
              Every PK platform is powered by the same infrastructure underneath — fast,
              consistent, and built to hold up when volatility picks up.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {techFeatures.map((feature, i) => {
            const Icon = feature.icon;

            return (
              <Reveal key={feature.title} delay={i * 60}>
                <div className="group h-full rounded-[var(--pk-radius-md)] border border-border bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-[#ff3f4e]/35 hover:shadow-[0_20px_60px_rgba(255,63,78,0.14)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--pk-radius-sm)] bg-bg-elevated text-[#ff3f4e] transition group-hover:bg-[#ff3f4e]/10">
                    <Icon size={18} strokeWidth={1.75} aria-hidden />
                  </span>

                  <h3 className="pk-display mt-4 text-base font-bold text-text">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}