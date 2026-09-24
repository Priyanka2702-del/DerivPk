import Link from "next/link";
import { ChevronRight, Wallet, LineChart, Copy, TrendingUp } from "lucide-react";
import { accountSummary, userAccounts, copySummary, pammSummary } from "@/data/dashboard";

export default function MyAssetsPage() {
  const walletBalance = parseFloat(accountSummary.totalAssets.replace(/,/g, ""));
  const tradingBalance = userAccounts.reduce(
    (sum, a) => sum + parseFloat(a.balance.replace(/,/g, "")),
    0
  );
  const smartFollowBalance = parseFloat(copySummary.invested.replace(/,/g, ""));
  const pammBalance = parseFloat(pammSummary.yourInvestment.replace(/[$,]/g, ""));

  const assetGroups = [
    {
      key: "wallet",
      label: "Wallet Account",
      icon: Wallet,
      balance: walletBalance,
      href: "/dashboard/deposit",
    },
    {
      key: "trading",
      label: "Trading Account",
      icon: LineChart,
      balance: tradingBalance,
      count: userAccounts.length,
      href: "/dashboard/accounts",
    },
    {
      key: "smart-follow",
      label: "Smart Follow",
      icon: Copy,
      balance: smartFollowBalance,
      href: "/dashboard/copy",
    },
    {
      key: "pamm",
      label: "PAMM",
      icon: TrendingUp,
      balance: pammBalance,
      href: "/dashboard/pamm-invest",
    },
  ];

  const totalAssets = assetGroups.reduce((sum, g) => sum + g.balance, 0);

  return (
    <div className="max-w-xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-text">My Assets</h1>
        <Link
          href="/dashboard/accounts"
          className="flex items-center gap-1 text-sm font-medium text-text-muted transition hover:text-text"
        >
          My Account <ChevronRight size={15} />
        </Link>
      </div>

      

      <div className="space-y-3">
        {assetGroups.map((g) => (
          <Link
            key={g.key}
            href={g.href}
            className="block rounded-xl border border-border bg-surface p-5 transition hover:border-accent-2/40"
          >
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-muted">
              <g.icon size={15} />
              {g.label}
              {typeof g.count === "number" && (
                <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-text-muted">
                  {g.count}
                </span>
              )}
            </div>
            <p className="num font-display text-2xl font-bold text-text">
              {g.balance.toFixed(2)} <span className="text-base font-semibold text-text-muted">USD</span>
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
        <span className="text-sm text-text-muted">Total Assets</span>
        <span className="num font-display text-xl font-bold text-text">
          {totalAssets.toFixed(2)} <span className="text-sm font-semibold text-text-muted">USD</span>
        </span>
      </div>
    </div>
  );
}