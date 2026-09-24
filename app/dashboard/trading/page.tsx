"use client";

import { useState } from "react";
import Link from "next/link";
import { Radio } from "lucide-react";
import TradingViewChart from "@/components/dashboard/TradingViewChart";
import SymbolSearch, { tradableSymbols } from "@/components/dashboard/SymbolSearch";
import Watchlist from "@/components/dashboard/Watchlist";
import PositionsTable from "@/components/dashboard/PositionsTable";
import OrderPanel from "@/components/dashboard/OrderPanel";


export default function TradingPage() {
  const [symbol, setSymbol] = useState(tradableSymbols[0].value);
  const activeLabel = tradableSymbols.find((s) => s.value === symbol)?.label ?? symbol;

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-xl font-semibold text-text">Deriv PK Trading</h1>
          <p className="text-sm text-text-muted">Charts and market analysis, powered by TradingView.</p>
        </div>
        <div className="flex items-center gap-3">
          <SymbolSearch value={symbol} onChange={setSymbol} />
          <Link
            href="/dashboard/live-trading"
className="flex shrink-0 items-center gap-2 rounded-lg bg-accent-2/10 px-4 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"          >
            <Radio size={16} className="text-accent-2" />
            Live Trading
          </Link>
        </div>
      </div>

     <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
  {/* LEFT SIDE */}
  <div className="min-w-0">
    <TradingViewChart
      symbol={symbol}
      theme="dark"
      height={520}
    />

    <p className="mt-2 text-xs text-text-muted">
      Chart for {activeLabel} — market visualization only. Connect a live
      trading account via{" "}
      <Link
        href="/dashboard/live-trading"
        className="font-medium text-accent-2 hover:underline"
      >
        Live Trading
      </Link>{" "}
      to place real orders.
    </p>

    {/* OPEN POSITIONS */}
    <div className="mt-6">
      <PositionsTable />
    </div>
  </div>

  {/* RIGHT SIDE */}
  <div className="min-w-0 space-y-6">
    {/* WATCHLIST */}
    <Watchlist />

    {/* PLACE ORDER */}
    <OrderPanel symbol={symbol} />
  </div>
</div>
    </div>
  );
}