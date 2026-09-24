import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MegaMenuData } from "@/data/navigation";

export default function MegaMenu({ menu }: { menu: MegaMenuData }) {
  return (
    <div
      role="menu"
      aria-label={`${menu.label} menu`}
      className="absolute left-1/2 top-full z-40 w-[min(720px,92vw)] -translate-x-1/2 pt-4"
    >
      <div className="grid grid-cols-1 gap-6 rounded-[var(--pk-radius-lg)] border border-border bg-surface p-6 shadow-2xl shadow-black/50 md:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-5 sm:grid-cols-2">
          {menu.columns.map((col) => (
            <div key={col.heading}>
              <p className="mb-3 text-xs font-semibold text-text-faint">
                {col.heading}
              </p>

              <ul className="flex flex-col gap-1">
                {col.links.map((link) => {
                  const Icon = link.icon;

                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        role="menuitem"
                        className="group flex items-start gap-3 rounded-[var(--pk-radius-sm)] p-2.5 transition-colors hover:bg-surface-2"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-elevated text-[#ff3f4e] transition group-hover:bg-[#ff3f4e]/10">
                          <Icon size={16} strokeWidth={1.75} aria-hidden />
                        </span>

                        <span>
                          <span className="block text-sm font-medium text-text transition group-hover:text-[#ff3f4e]">
                            {link.label}
                          </span>

                          <span className="block text-xs text-text-muted">
                            {link.description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {menu.featured && (
          <div className="flex flex-col justify-between rounded-[var(--pk-radius-md)] border border-border-strong bg-bg-elevated p-5 transition hover:border-[#ff3f4e]/35">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#ff3f4e]">
                {menu.featured.eyebrow}
              </p>

              <p className="mt-2 pk-display text-lg font-bold text-text">
                {menu.featured.title}
              </p>

              <p className="mt-2 text-sm text-text-muted">
                {menu.featured.description}
              </p>
            </div>

            <Link
              href={menu.featured.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff3f4e] transition hover:gap-2 hover:text-[#ff5260]"
            >
              {menu.featured.cta}
              <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}