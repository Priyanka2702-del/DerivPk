"use client";

import TradingViewChart from "@/components/dashboard/TradingViewChart";

export default function DashboardMarketChart() {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <h2 className="font-display text-lg font-semibold text-text">
          Live Chart
        </h2>

        <p className="text-xs text-text-muted">
          Real-time Deriv market data for EUR/USD.
        </p>
      </div>

      <TradingViewChart
        symbol="frxEURUSD"
        theme="dark"
        height={520}
      />
    </div>
  );
}