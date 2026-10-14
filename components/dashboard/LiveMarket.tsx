
"use client";

import { useCallback, useEffect, useState } from "react";

type MarketItem = {
  symbol: string;
  available: boolean;
  price: number | null;
  bid: number | null;
  ask: number | null;
  dayOpen: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  dayClose: number | null;
  previousClose: number | null;
  volume: number | null;
  change: number | null;
  changePercent: number | null;
  timestamp: string | null;
};

type MarketResponse = {
  success: boolean;
  source?: string;
  environment?: string;
  feed?: string;
  count?: number;
  market?: MarketItem[];
  error?: string;
};

const SYMBOLS = [
  "AAPL",
  "TSLA",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
];

function formatPrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatChange(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}`;
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}%`;
}

function formatVolume(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return value.toLocaleString("en-US");
}

function getChangeClass(value: number | null) {
  if (value === null || value === 0) {
    return "text-slate-400";
  }

  return value > 0
    ? "text-emerald-400"
    : "text-red-400";
}

function getSymbolName(symbol: string) {
  const names: Record<string, string> = {
    AAPL: "Apple",
    TSLA: "Tesla",
    MSFT: "Microsoft",
    NVDA: "NVIDIA",
    AMZN: "Amazon",
    GOOGL: "Alphabet",
    META: "Meta",
  };

  return names[symbol] || symbol;
}

export default function LiveMarket() {
  const [market, setMarket] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const loadMarket = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response = await fetch(
          `/api/trading/market?symbols=${SYMBOLS.join(",")}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: MarketResponse =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Unable to load market data."
          );
        }

        setMarket(data.market || []);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(
          "LIVE MARKET ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load market data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMarket();

    const interval = setInterval(() => {
      loadMarket(true);
    }, 10_000);

    return () => {
      clearInterval(interval);
    };
  }, [loadMarket]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              Live Market
            </h2>

            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              LIVE
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Real-time market snapshots from Alpaca
            IEX feed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated{" "}
              {lastUpdated.toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              )}
            </span>
          )}

          <button
            type="button"
            onClick={() => loadMarket(true)}
            disabled={refreshing}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SYMBOLS.map((symbol) => (
            <div
              key={symbol}
              className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="mb-3 h-4 w-16 rounded bg-white/10" />
              <div className="mb-2 h-7 w-28 rounded bg-white/10" />
              <div className="h-4 w-20 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Market Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {market.map((item) => (
              <div
                key={item.symbol}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-white">
                      {item.symbol}
                    </div>

                    <div className="text-xs text-slate-500">
                      {getSymbolName(item.symbol)}
                    </div>
                  </div>

                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      item.changePercent !== null &&
                      item.changePercent > 0
                        ? "bg-emerald-400/10 text-emerald-400"
                        : item.changePercent !== null &&
                          item.changePercent < 0
                        ? "bg-red-400/10 text-red-400"
                        : "bg-slate-400/10 text-slate-400"
                    }`}
                  >
                    {formatPercent(
                      item.changePercent
                    )}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(item.price)}
                  </div>

                  <div
                    className={`mt-1 text-sm font-medium ${getChangeClass(
                      item.change
                    )}`}
                  >
                    {formatChange(item.change)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                  <div>
                    <div className="text-[11px] text-slate-500">
                      Bid
                    </div>

                    <div className="mt-0.5 text-xs text-slate-300">
                      {item.bid !== null &&
                      item.bid > 0
                        ? formatPrice(item.bid)
                        : "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">
                      Ask
                    </div>

                    <div className="mt-0.5 text-xs text-slate-300">
                      {item.ask !== null &&
                      item.ask > 0
                        ? formatPrice(item.ask)
                        : "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">
                      Day High
                    </div>

                    <div className="mt-0.5 text-xs text-slate-300">
                      {formatPrice(item.dayHigh)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">
                      Day Low
                    </div>

                    <div className="mt-0.5 text-xs text-slate-300">
                      {formatPrice(item.dayLow)}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-[11px] text-slate-500">
                      Volume
                    </div>

                    <div className="mt-0.5 text-xs text-slate-300">
                      {formatVolume(item.volume)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty */}
          {market.length === 0 && !error && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
              No market data available.
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="mt-4 flex flex-col gap-1 border-t border-white/5 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Market data: Alpaca Sandbox · IEX
        </span>

        <span>
          Auto refresh: 10 seconds
        </span>
      </div>
    </section>
  );
}
