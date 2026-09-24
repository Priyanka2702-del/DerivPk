"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, X, ShieldCheck, Download, LogOut,
  Home, Wallet2, Banknote, LineChart, Copy, Gift, FolderDown,
  Wrench, Gem, UserCircle, Radio, TrendingUp,
   ArrowDownToLine, ArrowUpFromLine, Repeat2, LayoutGrid, Handshake, Users,
} from "lucide-react";
import Logo from "@/components/Logo";
import { logout } from "@/lib/session";

const links = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Live Trading", href: "/dashboard/live-trading", icon: Radio },
  { label: "My Assets", href: "/dashboard/assets", icon: LayoutGrid },
  { label: "Accounts", href: "/dashboard/accounts", icon: Wallet2 },
  { label: "Funds", href: "/dashboard/funds", icon: Banknote },
  { label: "Fast Deposit", href: "/dashboard/deposit", icon: ArrowDownToLine },
  { label: "Withdraw", href: "/dashboard/withdraw", icon: ArrowUpFromLine },
  { label: "Transfer", href: "/dashboard/transfer", icon: Repeat2 },
  { label: "Affiliate Program", href: "/dashboard/affiliate", icon: Handshake },
      { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Deriv PK Trading", href: "/dashboard/trading", icon: LineChart },
  { label: "Deriv PK Copy", href: "/dashboard/copy", icon: Copy },
  { label: "PAMM Invest", href: "/dashboard/pamm-invest", icon: TrendingUp },
  { label: "Promotions", href: "/dashboard/promotions", icon: Gift },
  { label: "Downloads", href: "/dashboard/downloads", icon: FolderDown },
  { label: "Tools", href: "/dashboard/tools", icon: Wrench },
  { label: "Points Mall", href: "/dashboard/points", icon: Gem },
  { label: "Verification", href: "/dashboard/verification", icon: ShieldCheck },
  { label: "Download", href: "/dashboard/download", icon: Download },
  { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(href);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted hover:text-text"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-surface px-5 py-5">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5">
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
isActive(l.href) ? "bg-accent-2/10 text-accent-2" : "text-text-muted hover:bg-surface-2 hover:text-text"                  }`}
                >
                  <l.icon size={17} className="shrink-0" />
                  {l.label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => {
                logout();
                setOpen(false);
                router.push("/login");
              }}
              className="mt-4 flex items-center gap-3 rounded-lg border-t border-border px-3 pt-4 text-left text-sm font-medium text-text-muted hover:text-text"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}