import type { CSSProperties } from "react";
import { steps } from "@/data/steps";
import Reveal from "./Reveal";

export default function StepsSection() {
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
      {/* subtle red glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,63,78,0.16), transparent 70%)",
        }}
      />

      <div className="pk-container relative z-10">
        <Reveal>
          <h2 className="pk-display text-center text-3xl font-extrabold text-text sm:text-4xl">
            Get started in 3 simple steps
          </h2>
        </Reveal>

        <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px bg-border sm:block"
            style={{ marginInline: "16.66%" }}
          />

          {steps.map((step, i) => {
            const Icon = step.icon;

            return (
              <Reveal key={step.number} delay={i * 100}>
                <div className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                  <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[#ff3f4e]/45 bg-bg text-sm font-bold text-[#ff3f4e] shadow-[0_0_0_6px_rgba(255,63,78,0.06)]">
                    {step.number}
                  </span>

                  <span className="mt-5 flex h-11 w-11 items-center justify-center rounded-[var(--pk-radius-sm)] bg-surface text-[#ff3f4e]">
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                  </span>

                  <h3 className="pk-display mt-4 text-lg font-bold text-text">
                    {step.title}
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
                    {step.description}
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