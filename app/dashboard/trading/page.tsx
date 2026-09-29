"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Radio } from "lucide-react";

import TradingViewChart from "@/components/dashboard/TradingViewChart";
import Watchlist from "@/components/dashboard/Watchlist";
import PositionsTable from "@/components/dashboard/PositionsTable";
import OrderPanel from "@/components/dashboard/OrderPanel";

import { useDerivSymbols } from "@/hooks/useDerivMarket";

export default function TradingPage() {
  const {
    symbols,
    loading,
    error,
  } = useDerivSymbols();

  const [symbol, setSymbol] =
    useState("frxEURUSD");

  const selectedSymbol = useMemo(
    () =>
      symbols.find(
        (item) =>
          item.underlying_symbol ===
          symbol
      ),
    [symbols, symbol]
  );

  return (
    <div>
      {/* HEADER */}

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-xl font-semibold text-text">
            Deriv PK Trading
          </h1>

          <p className="text-sm text-text-muted">
            Live market data powered by Deriv.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={symbol}
            onChange={(event) =>
              setSymbol(event.target.value)
            }
            disabled={loading}
            className="min-w-[220px] rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-accent-2 disabled:opacity-60"
          >
            {loading && (
              <option value={symbol}>
                Loading markets...
              </option>
            )}

            {!loading &&
              symbols.map((market) => (
                <option
                  key={
                    market.underlying_symbol
                  }
                  value={
                    market.underlying_symbol
                  }
                >
                  {
                    market.underlying_symbol_name
                  }{" "}
                  (
                  {
                    market.underlying_symbol
                  }
                  )
                </option>
              ))}
          </select>

          <Link
            href="/dashboard/live-trading"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-accent-2/10 px-4 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"
          >
            <Radio
              size={16}
              className="text-accent-2"
            />

            Live Trading
          </Link>
        </div>
      </div>

      {/* SYMBOL ERROR */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* MAIN */}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <TradingViewChart
            symbol={symbol}
            theme="dark"
            height={520}
          />

          <p className="mt-2 text-xs text-text-muted">
            {selectedSymbol
              ?.underlying_symbol_name ||
              symbol}{" "}
            — live public market data from
            Deriv.
          </p>

          <div className="mt-6">
            <PositionsTable />
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <Watchlist />

          <OrderPanel
            symbol={symbol}
          />
        </div>
      </div>
    </div>
  );
}