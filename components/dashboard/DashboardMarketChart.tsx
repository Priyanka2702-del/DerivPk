"use client";

import TradingViewChart from "@/components/dashboard/TradingViewChart";

/**
 * Live TradingView chart section for the dashboard Home page.
 * Defaults to EURUSD; the Markets table was removed from this page to avoid
 * duplicating what the chart already shows (still available under
 * "PK Trading" in the sidebar, with full symbol switching).
 */
export default function DashboardMarketChart() {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <h2 className="font-display text-lg font-semibold text-text">Live Chart</h2>
        <p className="text-xs text-text-muted">Real-time TradingView chart for EURUSD.</p>
      </div>
      <TradingViewChart symbol="FX:EURUSD" theme="dark" height={520} />
    </div>
  );
}