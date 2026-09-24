"use client";

/**
 * TradingView chart, embedded via the free "Advanced Chart" widget's iframe
 * endpoint (widgetembed). This is charting/visualization ONLY — it is not
 * connected to any order-execution backend. Do not treat this component as
 * a trading engine; see components/dashboard/OrderPanel.tsx for the (mock,
 * frontend-only) order UI, and LiveTradingCard for the real-money MT5 flow.
 */
export default function TradingViewChart({
  symbol = "FX:EURUSD",
  theme = "dark",
  height = 520,
}: {
  symbol?: string;
  theme?: "light" | "dark";
  height?: number;
}) {
  const params = new URLSearchParams({
    symbol,
    interval: "D",
    theme,
    style: "1",
    timezone: "Etc/UTC",
    locale: "en",
    hide_top_toolbar: "false",
    hide_legend: "false",
    allow_symbol_change: "true",
    save_image: "false",
    withdateranges: "true",
    studies: "",
  });
  const src = `https://s.tradingview.com/widgetembed/?${params.toString()}`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border bg-surface"
      style={{ height }}
    >
      <iframe
        key={symbol + theme}
        src={src}
        className="absolute inset-0 h-full w-full border-0"
        allowFullScreen
        title=" Deriv PK Trading View Chart"
      />
    </div>
  );
}
