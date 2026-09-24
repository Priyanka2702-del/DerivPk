import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

export default function TradeAroundClock() {
  return (
    <section className="relative overflow-hidden bg-bg-elevated py-20 md:py-28">
      <div className="pk-container grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <ClockVisual />
        </Reveal>

        <Reveal delay={100}>
          <h2 className="pk-display text-3xl font-extrabold leading-tight text-text sm:text-4xl">
            Trade around the clock
          </h2>

          <p className="mt-5 text-text-muted">
            Selected markets on PK, including derived indices, are accessible around the clock —
            so a market closing on the other side of the world doesn&apos;t have to close your
            trading day.
          </p>

          <ul className="mt-6 flex flex-col gap-3 text-sm text-text-muted">
            <li className="flex items-start gap-2.5">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff3f4e]"
                aria-hidden
              />
              No waiting for exchange opening hours on synthetic markets
            </li>

            <li className="flex items-start gap-2.5">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff3f4e]"
                aria-hidden
              />
              Consistent volatility profiles, day or night
            </li>

            <li className="flex items-start gap-2.5">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff3f4e]"
                aria-hidden
              />
              One account across always-on and market-hours instruments
            </li>
          </ul>

          <Link
            href="/markets/derived-indices"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#ff3f4e] px-7 py-3.5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(255,63,78,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff5260] sm:text-base"
          >
            Explore always-on markets
            <ArrowRight size={18} aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function ClockVisual() {
  const red = "#ff3f4e";

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center">
      {/* Red glow instead of neon */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full opacity-40 blur-2xl"
        style={{
          background: "radial-gradient(circle, rgba(255,63,78,0.35), transparent 70%)",
        }}
      />

      <svg
        viewBox="0 0 280 280"
        className="relative w-full"
        role="img"
        aria-label="24 hour market clock"
      >
        <circle
          cx="140"
          cy="140"
          r="118"
          fill="none"
          stroke="var(--pk-border-strong)"
          strokeWidth="1"
        />

        <circle
          cx="140"
          cy="140"
          r="96"
          fill="none"
          stroke="var(--pk-border)"
          strokeWidth="1"
        />

        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
          const x1 = 140 + Math.cos(angle) * 108;
          const y1 = 140 + Math.sin(angle) * 108;
          const x2 = 140 + Math.cos(angle) * 118;
          const y2 = 140 + Math.sin(angle) * 118;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i % 6 === 0 ? red : "var(--pk-border-strong)"}
              strokeWidth={i % 6 === 0 ? 2 : 1}
            />
          );
        })}

        <circle cx="140" cy="140" r="4" fill={red} />

        <line
          x1="140"
          y1="140"
          x2="140"
          y2="58"
          stroke={red}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <line
          x1="140"
          y1="140"
          x2="196"
          y2="140"
          stroke="var(--pk-text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <text
          x="140"
          y="152"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill="var(--pk-text)"
        >
          24/7
        </text>
      </svg>
    </div>
  );
}