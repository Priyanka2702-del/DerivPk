"use client";

import { useEffect, useMemo } from "react";

import {
  useDerivCandles,
  useDerivTick,
} from "@/hooks/useDerivMarket";

type TradingViewChartProps = {
  symbol?: string;
  theme?: "light" | "dark";
  height?: number;
};

export default function TradingViewChart({
  symbol = "frxEURUSD",
  theme = "dark",
  height = 520,
}: TradingViewChartProps) {
  console.log(
    "TRADING CHART RENDER:",
    symbol
  );

  const {
    candles,
    loading: candlesLoading,
    error: candlesError,
  } = useDerivCandles(symbol);

  const {
    tick,
    error: tickError,
  } = useDerivTick(symbol);

  useEffect(() => {
    console.log(
      "TRADING CHART MOUNTED:",
      symbol
    );

    return () => {
      console.log(
        "TRADING CHART UNMOUNTED:",
        symbol
      );
    };
  }, [symbol]);

  const chartPoints = useMemo(() => {
    if (!candles.length) {
      return "";
    }

    const width = 1000;
    const padding = 40;

    const prices = candles.flatMap(
      (candle) => [
        candle.high,
        candle.low,
      ]
    );

    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    const range =
      maxPrice - minPrice || 1;

    return candles
      .map((candle, index) => {
        const x =
          padding +
          (index /
            Math.max(
              candles.length - 1,
              1
            )) *
            (width - padding * 2);

        const y =
          padding +
          ((maxPrice -
            candle.close) /
            range) *
            (height - padding * 2);

        return `${x},${y}`;
      })
      .join(" ");
  }, [candles, height]);

  const error =
    tickError || candlesError;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border bg-surface"
      style={{ height }}
    >
      {/* HEADER */}

      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-xs text-text-muted">
            Deriv Market
          </p>

          <p className="font-semibold text-text">
            {symbol}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-text-muted">
            Live Price
          </p>

          <p className="num text-lg font-bold text-text">
            {tick
              ? tick.quote.toFixed(5)
              : "--"}
          </p>
        </div>
      </div>

      {/* CHART AREA */}

      <div className="absolute inset-x-0 bottom-0 top-[65px]">
        {candlesLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-text-muted">
                Loading Deriv market data...
              </p>

              <p className="mt-1 text-xs text-text-muted">
                Symbol: {symbol}
              </p>
            </div>
          </div>
        )}

        {error && !candlesLoading && (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm font-medium text-red-500">
                Market data unavailable
              </p>

              <p className="mt-1 text-xs text-text-muted">
                {error}
              </p>
            </div>
          </div>
        )}

        {!candlesLoading &&
          !error &&
          candles.length > 0 && (
            <svg
              viewBox={`0 0 1000 ${height}`}
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              {[20, 40, 60, 80].map(
                (percentage) => (
                  <line
                    key={percentage}
                    x1="0"
                    x2="1000"
                    y1={
                      (percentage / 100) *
                      height
                    }
                    y2={
                      (percentage / 100) *
                      height
                    }
                    stroke="currentColor"
                    strokeOpacity="0.08"
                  />
                )
              )}

              <polyline
                points={chartPoints}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                className="text-accent-2"
              />
            </svg>
          )}

        {!candlesLoading &&
          !error &&
          candles.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-text-muted">
                No chart data available.
              </p>
            </div>
          )}
      </div>

      {/* DEBUG INFO */}

      <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-[10px] text-white">
        {theme} · candles:{" "}
        {candles.length} · tick:{" "}
        {tick ? "connected" : "waiting"}
      </div>
    </div>
  );
}