import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Platform } from "@/data/platforms";

export default function PlatformCard({ platform }: { platform: Platform }) {
  const Icon = platform.icon;

  return (
    <div className="group flex flex-col rounded-[var(--pk-radius-md)] border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border-strong sm:p-7">
      <div className="flex h-32 items-center justify-center rounded-[var(--pk-radius-sm)] bg-bg-elevated">
        <Icon size={40} strokeWidth={1.25} className="text-accent transition-transform duration-300 group-hover:scale-110" aria-hidden />
      </div>
      <h3 className="pk-display mt-6 text-xl font-bold text-text">{platform.name}</h3>
      <p className="mt-1 text-sm font-medium text-accent-2">{platform.tagline}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-text-muted">{platform.description}</p>
      <Link
        href={platform.href}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text transition-colors group-hover:text-accent"
      >
        Learn more
        <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
      </Link>
    </div>
  );
}
