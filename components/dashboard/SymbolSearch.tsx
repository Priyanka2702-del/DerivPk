"use client";

import { Search } from "lucide-react";

export type TradableSymbol = { label: string; value: string };

export const tradableSymbols: TradableSymbol[] = [
  { label: "EUR/USD", value: "FX:EURUSD" },
  { label: "GBP/USD", value: "FX:GBPUSD" },
  { label: "USD/JPY", value: "FX:USDJPY" },
  { label: "AUD/USD", value: "FX:AUDUSD" },
  { label: "Gold (XAU/USD)", value: "OANDA:XAUUSD" },
  { label: "Silver (XAG/USD)", value: "OANDA:XAGUSD" },
  { label: "WTI Crude Oil", value: "TVC:USOIL" },
  { label: "Bitcoin (BTC/USD)", value: "COINBASE:BTCUSD" },
  { label: "Ethereum (ETH/USD)", value: "COINBASE:ETHUSD" },
  { label: "S&P 500", value: "TVC:SPX" },
  { label: "Nasdaq 100", value: "TVC:NDQ" },
  { label: "Apple Inc.", value: "NASDAQ:AAPL" },
];

export default function SymbolSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (symbol: string) => void;
}) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-border bg-surface py-2.5 pl-9 pr-4 text-sm font-medium text-text outline-none transition focus:border-accent-2"
        aria-label="Select trading symbol"
      >
        {tradableSymbols.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
