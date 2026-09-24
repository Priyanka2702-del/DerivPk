import type { CSSProperties } from "react";
import { platforms } from "@/data/platforms";
import PlatformCard from "./PlatformCard";
import Reveal from "./Reveal";

export default function PlatformsSection() {
  const redThemeVars = {
    "--pk-accent": "#ff3f4e",
    "--pk-accent-2": "#ff6b76",
    "--pk-accent-ink": "#ffffff",
  } as CSSProperties;

  return (
    <section
      className="relative overflow-hidden bg-bg-elevated py-20 md:py-28"
      style={redThemeVars}
    >
      {/* Red glow only, background dark hi rahega */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,63,78,0.22), transparent 70%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,63,78,0.18), transparent 70%)",
        }}
      />

      <div className="pk-container relative z-10">
        <Reveal>
          <div className="max-w-xl">
            <h2 className="pk-display text-3xl font-extrabold text-text sm:text-4xl">
              Trade the way you want
            </h2>

            <p className="mt-4 text-text-muted">
              Four platforms built around different trading styles — pick one, or use them
              together from the same account.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {platforms.map((platform, i) => (
            <Reveal key={platform.slug} delay={i * 70}>
              <div className="h-full transition duration-300 hover:-translate-y-1 hover:drop-shadow-[0_20px_55px_rgba(255,63,78,0.22)]">
                <PlatformCard platform={platform} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}