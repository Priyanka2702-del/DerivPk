import Link from "next/link";
import { MessageCircle, Rss, Video, Users2 } from "lucide-react";
import Logo from "./Logo";
import { footerColumns } from "@/data/footer";

const socials = [
  { icon: MessageCircle, label: "Twitter / X", href: "https://twitter.com" },
  { icon: Users2, label: "LinkedIn", href: "https://linkedin.com" },
  { icon: Video, label: "YouTube", href: "https://youtube.com" },
  { icon: Rss, label: "Newsroom feed", href: "/about/newsroom" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg pt-16">
      <div className="pk-container">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-8">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-[220px] text-sm text-text-muted">
              A modern trading platform for global markets — built for clarity, speed and
              control.
            </p>
            <div className="mt-5 flex gap-3">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <Icon size={16} aria-hidden />
                  </a>
                );
              })}
            </div>
          </div>

          {footerColumns.map((col) => (
            <div key={col.heading}>
              <p className="text-sm font-semibold text-text">{col.heading}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-text-muted transition-colors hover:text-text">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-[var(--pk-radius-md)] border border-border bg-surface p-5 text-xs leading-relaxed text-text-faint">
          Regulatory information will be provided here. PK does not currently make any specific
          regulatory claims on this preview site — licence and registration details will be
          published once finalised.
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-border py-8 text-xs text-text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PK. All rights reserved.</p>
          <p className="max-w-lg">
            Trading involves risk. CFDs and other leveraged products may not be suitable for all
            investors and can result in losses that exceed your deposits. Please ensure you fully
            understand the risks involved.
          </p>
        </div>
      </div>
    </footer>
  );
}
