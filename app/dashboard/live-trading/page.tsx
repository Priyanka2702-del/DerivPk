"use client";

import Link from "next/link";
import {
  Radio,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function LiveTradingPage() {
  return (
    <div>
      {/* Back to Dashboard */}
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft size={15} />
        Back to Dashboard
      </Link>

      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent-2/10 text-accent-2">
            <Radio size={26} />
          </div>

          <h1 className="font-display text-xl font-semibold text-text sm:text-2xl">
            Live Trading
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            Trade directly through the MT5 WebTrader. You can also open the
            platform in a new tab.
          </p>

          {/* Open MT5 WebTrader */}
          <Link
            href="/dashboard/mt5"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-2/10 px-6 py-3 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"
          >
            Open MT5 WebTrader
            <ExternalLink size={15} />
          </Link>
        </div>

        {/* MT5 WebTrader Preview */}
        <div className="mx-auto mt-8 w-full overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text">
              MT5 WebTrader
            </h2>

            <p className="mt-1 text-xs text-text-muted">
              Trading platform preview
            </p>
          </div>

          <div className="flex min-h-[300px] items-center justify-center px-6 py-12 text-center">
            <div>
              <p className="text-sm font-medium text-text">
                Open MT5 WebTrader to continue
              </p>

              <p className="mt-2 text-xs text-text-muted">
                Select Demo Account or Real Account from the trading terminal.
              </p>
            </div>
          </div>
        </div>

        {/* Security / Information Note */}
        <div className="mx-auto mt-6 flex max-w-4xl items-start gap-2.5 rounded-lg border border-border px-4 py-3 text-left text-xs text-text-muted">
          <ShieldCheck
            size={15}
            className="mt-0.5 shrink-0 text-accent-2"
          />

          <span>
            Charts and market analysis on the{" "}
            <Link
              href="/dashboard/trading"
              className="font-medium text-accent-2 hover:underline"
            >
              Deriv PK Trading
            </Link>{" "}
            page are powered by TradingView and are separate from account
            management and trading data.
          </span>
        </div>
      </div>
    </div>
  );
}

