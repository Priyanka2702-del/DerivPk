import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Market } from "@/data/markets";

export default function MarketCard({ market }: { market: Market }) {
  const Icon = market.icon;

  return (
    <Link
      href={`/markets/${market.slug}`}
      className="group relative flex min-w-[260px] shrink-0 flex-col justify-between overflow-hidden rounded-[var(--pk-radius-md)] border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border-strong sm:min-w-0"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: market.accent }}
      />
      <div>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-[var(--pk-radius-sm)]"
          style={{ background: `${market.accent}1f`, color: market.accent }}
        >
          <Icon size={20} strokeWidth={1.75} aria-hidden />
        </span>
        <h3 className="pk-display mt-5 text-lg font-bold text-text">{market.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{market.description}</p>
      </div>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text transition-colors group-hover:text-accent">
        Learn more
        <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}
