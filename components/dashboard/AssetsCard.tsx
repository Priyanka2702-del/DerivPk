"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowDownToLine, ArrowUpFromLine, Repeat2, History } from "lucide-react";
import { accountSummary } from "@/data/dashboard";

const actions: {
  label: string;
  href: string;
  icon: typeof ArrowDownToLine;
  activeClass: string;
}[] = [
  {
    label: "Deposit",
    href: "/dashboard/deposit",
    icon: ArrowDownToLine,
activeClass: "border-accent-2/20 bg-accent-2/10 text-accent-2 hover:bg-accent-2/20", },
  {
    label: "Withdraw",
    href: "/dashboard/withdraw",
    icon: ArrowUpFromLine,
    activeClass: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  {
    label: "Transfer",
    href: "/dashboard/transfer",
    icon: Repeat2,
    activeClass: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
  },
  {
    label: "History",
    href: "/dashboard/funds?tab=history",
    icon: History,
    activeClass: "border-border bg-surface-2 text-text-muted hover:bg-border/60",
  },
];

export default function AssetsCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Wallet box */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-text">
          PK Wallet
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2"
          aria-expanded={expanded}
          aria-label="Toggle balance breakdown"
        >
          <span className="text-2xl">🇺🇸</span>
          <span className="font-display text-3xl font-bold text-text">
            {accountSummary.totalAssets}
          </span>
          <span className="font-display text-lg font-semibold text-text-muted">
            {accountSummary.currency}
          </span>
          <ChevronDown
            size={18}
            className={`ml-1 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
            <div>
              <p className="text-xs text-text-muted">Available</p>
              <p className="num font-semibold text-text">${accountSummary.available}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">In Open Positions</p>
              <p className="num font-semibold text-text">${accountSummary.inPositions}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action boxes */}
      <div className="grid grid-cols-4 gap-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2.5 text-center transition sm:p-3 ${a.activeClass}`}
          >
            <a.icon size={16} />
            <span className="text-[11px] font-semibold sm:text-xs">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}