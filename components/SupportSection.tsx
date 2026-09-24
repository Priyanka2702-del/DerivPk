import type { CSSProperties } from "react";
import Link from "next/link";
import { LifeBuoy, HelpCircle, MessageCircle, Users } from "lucide-react";
import Reveal from "./Reveal";

const supportLinks = [
  {
    icon: LifeBuoy,
    title: "Help Centre",
    description: "Step-by-step guides for accounts, deposits and platforms.",
    href: "/support/help-centre",
  },
  {
    icon: HelpCircle,
    title: "FAQs",
    description: "Quick answers to the questions traders ask most.",
    href: "/support/faqs",
  },
  {
    icon: MessageCircle,
    title: "Contact Support",
    description: "Reach our team directly, day or night.",
    href: "/support/contact",
  },
  {
    icon: Users,
    title: "Community",
    description: "Trade ideas and questions with other PK traders.",
    href: "/support/community",
  },
];

export default function SupportSection() {
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
            <p className="mb-3 text-sm font-semibold text-[#ff3f4e]">
              Support, 24/7
            </p>

            <h2 className="pk-display text-3xl font-extrabold text-text sm:text-4xl">
              Help when you need it
            </h2>

            <p className="mt-4 text-text-muted">
              Real people are available around the clock — because markets don&apos;t keep office
              hours, and neither do we.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {supportLinks.map((link, i) => {
            const Icon = link.icon;

            return (
              <Reveal key={link.title} delay={i * 60}>
                <Link
                  href={link.href}
                  className="group flex h-full flex-col rounded-[var(--pk-radius-md)] border border-border bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-[#ff3f4e]/35 hover:shadow-[0_20px_60px_rgba(255,63,78,0.14)]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-[var(--pk-radius-sm)] bg-bg-elevated text-[#ff3f4e] transition group-hover:bg-[#ff3f4e]/10">
                    <Icon size={22} strokeWidth={1.75} aria-hidden />
                  </span>

                  <h3 className="pk-display mt-4 text-base font-bold text-text">
                    {link.title}
                  </h3>

                  <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">
                    {link.description}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={260}>
          <div className="mt-10">
            <Link
              href="/support/contact"
              className="inline-flex items-center justify-center rounded-full border border-[#ff3f4e]/35 bg-[#ff3f4e]/10 px-7 py-3.5 text-sm font-bold text-[#ff3f4e] transition hover:-translate-y-0.5 hover:border-[#ff3f4e] hover:bg-[#ff3f4e] hover:text-white sm:text-base"
            >
              Talk to support
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}