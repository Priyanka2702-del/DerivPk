import type { CSSProperties } from "react";
import {
  Zap,
  ArrowLeftRight,
  CreditCard,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import Reveal from "./Reveal";

const paymentPoints = [
  {
    icon: Zap,
    title: "Fast deposits",
    description: "Get funded and start trading within minutes.",
  },
  {
    icon: ArrowLeftRight,
    title: "Easy withdrawals",
    description: "Request a withdrawal in a few taps, tracked end to end.",
  },
  {
    icon: CreditCard,
    title: "Multiple payment methods",
    description: "Cards, bank transfers and e-wallets, depending on your region.",
  },
  {
    icon: ShieldCheck,
    title: "Secure transactions",
    description: "Every transaction is encrypted and monitored for fraud.",
  },
  {
    icon: MapPin,
    title: "Local payment options",
    description: "Where available, pay the way you normally would at home.",
  },
];

export default function PaymentsSection() {
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
      {/* subtle red glow, bg same rahega */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,63,78,0.18), transparent 70%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,63,78,0.14), transparent 70%)",
        }}
      />

      <div className="pk-container relative z-10">
        <Reveal>
          <div className="max-w-xl">
            <h2 className="pk-display text-3xl font-extrabold text-text sm:text-4xl">
              Your money, your way
            </h2>

            <p className="mt-4 text-text-muted">
              Move funds in and out of your account with a payment experience built to feel as
              straightforward as your bank app.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paymentPoints.map((point, i) => {
            const Icon = point.icon;

            return (
              <Reveal key={point.title} delay={i * 60}>
                <div className="group flex h-full flex-col rounded-[var(--pk-radius-md)] border border-border bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-[#ff3f4e]/35 hover:shadow-[0_20px_60px_rgba(255,63,78,0.14)]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[var(--pk-radius-sm)] bg-bg-elevated text-[#ff3f4e] transition group-hover:bg-[#ff3f4e]/10">
                    <Icon size={22} strokeWidth={1.75} aria-hidden />
                  </span>

                  <h3 className="pk-display mt-4 text-base font-bold text-text">
                    {point.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {point.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={280}>
          <p className="mt-8 text-xs text-text-faint">
            Payment methods and processing times may vary by location.
          </p>
        </Reveal>
      </div>
    </section>
  );
}