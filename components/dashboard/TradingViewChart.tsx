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
  const {
    candles,
    loading: candlesLoading,
    error: candlesError,
  } = useDerivCandles(symbol, 60);

  const {
    tick,
    error: tickError,
  } = useDerivTick(symbol);

  useEffect(() => {
    console.log("Deriv chart mounted:", symbol);

    return () => {
      console.log("Deriv chart unmounted:", symbol);
    };
  }, [symbol]);

  /*
   * Merge live tick into the latest 1-minute candle.
   *
   * Historical candles come from ticks_history.
   * Live price comes from ticks subscription.
   */
  const liveCandles = useMemo(() => {
    if (!candles.length || !tick) {
      return candles;
    }

    const tickEpoch = Number(tick.epoch);

    if (!Number.isFinite(tickEpoch)) {
      return candles;
    }

    const currentMinute =
      Math.floor(tickEpoch / 60) * 60;

    const historicalCandles = [...candles];

    const lastCandle =
      historicalCandles[
        historicalCandles.length - 1
      ];

    if (!lastCandle) {
      return historicalCandles;
    }

    const lastCandleMinute =
      Math.floor(
        Number(lastCandle.epoch) / 60
      ) * 60;

    /*
     * Same minute:
     * update the current candle.
     */
    if (lastCandleMinute === currentMinute) {
      const updatedLastCandle = {
        ...lastCandle,
        high: Math.max(
          Number(lastCandle.high),
          tick.quote
        ),
        low: Math.min(
          Number(lastCandle.low),
          tick.quote
        ),
        close: tick.quote,
      };

      historicalCandles[
        historicalCandles.length - 1
      ] = updatedLastCandle;

      return historicalCandles;
    }

    /*
     * New minute:
     * create a new candle.
     */
    if (currentMinute > lastCandleMinute) {
      const newCandle = {
        epoch: currentMinute,
        open: Number(lastCandle.close),
        high: tick.quote,
        low: tick.quote,
        close: tick.quote,
      };

      return [
        ...historicalCandles,
        newCandle,
      ].slice(-100);
    }

    /*
     * Ignore an older tick.
     */
    return historicalCandles;
  }, [candles, tick]);

  const chartData = useMemo(() => {
    if (!liveCandles.length) {
      return null;
    }

    const width = 1000;
    const chartHeight = height - 30;

    const paddingLeft = 55;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;

    const chartWidth =
      width - paddingLeft - paddingRight;

    const chartAreaHeight =
      chartHeight -
      paddingTop -
      paddingBottom;

    const prices = liveCandles.flatMap(
      (candle) => [
        Number(candle.high),
        Number(candle.low),
      ]
    );

    /*
     * Include live price in chart range.
     */
    if (tick) {
      prices.push(Number(tick.quote));
    }

    let maxPrice = Math.max(...prices);
    let minPrice = Math.min(...prices);

    /*
     * Small visual padding so candles don't
     * touch the top/bottom of the chart.
     */
    const rawRange =
      maxPrice - minPrice || 0.00001;

    const chartPadding =
      rawRange * 0.08;

    maxPrice += chartPadding;
    minPrice -= chartPadding;

    const range =
      maxPrice - minPrice || 0.00001;

    const priceToY = (price: number) => {
      return (
        paddingTop +
        ((maxPrice - price) / range) *
          chartAreaHeight
      );
    };

    const candleGap =
      chartWidth / liveCandles.length;

    const candleWidth = Math.max(
      3,
      Math.min(
        9,
        candleGap * 0.62
      )
    );

    const mappedCandles =
      liveCandles.map(
        (candle, index) => {
          const x =
            paddingLeft +
            index * candleGap +
            candleGap / 2;

          return {
            ...candle,
            x,

            openY: priceToY(
              Number(candle.open)
            ),

            closeY: priceToY(
              Number(candle.close)
            ),

            highY: priceToY(
              Number(candle.high)
            ),

            lowY: priceToY(
              Number(candle.low)
            ),

            bullish:
              Number(candle.close) >=
              Number(candle.open),
          };
        }
      );

    /*
     * Price axis.
     */
    const gridLines = [0, 25, 50, 75, 100].map(
      (percentage) => {
        const price =
          maxPrice -
          (percentage / 100) *
            range;

        return {
          percentage,
          y:
            paddingTop +
            (percentage / 100) *
              chartAreaHeight,
          price,
        };
      }
    );

    return {
      width,
      chartHeight,
      candleWidth,
      candles: mappedCandles,
      gridLines,
      maxPrice,
      minPrice,
      range,
      paddingTop,
      chartAreaHeight,
    };
  }, [liveCandles, tick, height]);

  const error =
    tickError || candlesError;

  const displaySymbol =
    symbol === "frxEURUSD"
      ? "EUR/USD"
      : symbol;

  const currentPrice =
    tick?.quote ?? null;

  /*
   * Calculate movement from the first
   * loaded candle.
   */
  const firstPrice =
    liveCandles.length > 0
      ? Number(liveCandles[0].open)
      : null;

  const priceChange =
    currentPrice !== null &&
    firstPrice !== null &&
    firstPrice !== 0
      ? ((currentPrice - firstPrice) /
          firstPrice) *
        100
      : null;

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

          <div className="flex items-center gap-2">
            <p className="font-semibold text-text">
              {displaySymbol}
            </p>

            {tick && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                LIVE
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-text-muted">
            Live Price
          </p>

          <div className="flex items-center justify-end gap-2">
            <p className="num text-lg font-bold text-text">
              {currentPrice !== null
                ? currentPrice.toFixed(5)
                : "--"}
            </p>

            {priceChange !== null && (
              <p
                className={`text-xs font-semibold ${
                  priceChange >= 0
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {priceChange >= 0
                  ? "+"
                  : ""}
                {priceChange.toFixed(2)}%
              </p>
            )}
          </div>
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
                {displaySymbol}
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
          chartData && (
            <svg
              viewBox={`0 0 1000 ${chartData.chartHeight}`}
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              {/* PRICE GRID */}

              {chartData.gridLines.map(
                (line) => (
                  <g
                    key={line.percentage}
                  >
                    <line
                      x1={55}
                      x2={985}
                      y1={line.y}
                      y2={line.y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                    />

                    <text
                      x={5}
                      y={line.y + 4}
                      fontSize="10"
                      fill="currentColor"
                      opacity="0.5"
                    >
                      {line.price.toFixed(
                        5
                      )}
                    </text>
                  </g>
                )
              )}

              {/* CANDLESTICKS */}

              {chartData.candles.map(
                (candle) => {
                  const bodyTop =
                    Math.min(
                      candle.openY,
                      candle.closeY
                    );

                  const bodyHeight =
                    Math.max(
                      Math.abs(
                        candle.closeY -
                          candle.openY
                      ),
                      1
                    );

                  const bodyX =
                    candle.x -
                    chartData.candleWidth /
                      2;

                  const candleColor =
                    candle.bullish
                      ? "#10b981"
                      : "#ef4444";

                  return (
                    <g
                      key={candle.epoch}
                    >
                      {/* WICK */}

                      <line
                        x1={candle.x}
                        x2={candle.x}
                        y1={candle.highY}
                        y2={candle.lowY}
                        stroke={candleColor}
                        strokeWidth="1"
                      />

                      {/* BODY */}

                      <rect
                        x={bodyX}
                        y={bodyTop}
                        width={
                          chartData.candleWidth
                        }
                        height={bodyHeight}
                        fill={candleColor}
                        rx="0.5"
                      />
                    </g>
                  );
                }
              )}

              {/* LIVE PRICE LINE */}

              {currentPrice !== null && (
                <>
                  {(() => {
                    const liveY =
                      chartData.paddingTop +
                      ((chartData.maxPrice -
                        currentPrice) /
                        chartData.range) *
                        chartData.chartAreaHeight;

                    return (
                      <>
                        <line
                          x1="55"
                          x2="985"
                          y1={liveY}
                          y2={liveY}
                          stroke="#f59e0b"
                          strokeWidth="1"
                          strokeDasharray="5 4"
                          opacity="0.9"
                        />

                        <rect
                          x="915"
                          y={liveY - 9}
                          width="70"
                          height="18"
                          rx="3"
                          fill="#f59e0b"
                        />

                        <text
                          x="950"
                          y={liveY + 3}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="600"
                          fill="#111827"
                        >
                          {currentPrice.toFixed(
                            5
                          )}
                        </text>
                      </>
                    );
                  })()}
                </>
              )}
            </svg>
          )}

        {!candlesLoading &&
          !error &&
          !chartData && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-text-muted">
                No chart data available.
              </p>
            </div>
          )}
      </div>

      {/* STATUS */}

      <div className="absolute bottom-2 left-3 rounded bg-black/50 px-2 py-1 text-[10px] text-white">
        {theme} · {liveCandles.length} candles ·{" "}
        {tick ? "Live" : "Connecting"}
      </div>
    </div>
  );
}