"use client";

import { useState } from "react";
import { marketTabs, marketQuotes } from "@/data/dashboard";
import { MarketCategoryKey } from "@/types/dashboard";

function Sparkline({ points, up, flat }: { points: number[]; up: boolean; flat?: boolean }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${100 - ((p - min) / range) * 100}`)
    .join(" ");
  const color = flat ? "#6b7182" : up ? "#34d399" : "#f87171";

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-7 w-20">
      <polyline points={coords} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MarketsPanel({
  selectedSymbol,
  onSelectSymbol,
}: {
  /** Currently highlighted symbol (e.g. from a chart above this panel). */
  selectedSymbol?: string;
  /** Called with (category, symbol) when the user clicks a row — lets a
   * parent (e.g. a TradingView chart) sync to the clicked instrument. */
  onSelectSymbol?: (category: MarketCategoryKey, symbol: string) => void;
} = {}) {
  const [tab, setTab] = useState<MarketCategoryKey>("forex");
  const rows = marketQuotes[tab];

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="px-6 pt-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-text">Markets</h2>
        <div className="flex gap-6 overflow-x-auto border-b border-border text-sm font-medium">
          {marketTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 border-b-2 pb-3 transition ${
                tab === t.key
                  ? "border-teal-600 font-semibold text-text"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs font-medium text-text-muted">
              <th className="px-6 py-3 font-medium">Symbol</th>
              <th className="px-6 py-3 font-medium">Bid</th>
              <th className="px-6 py-3 font-medium">Change</th>
              <th className="px-6 py-3 font-medium">Markets</th>
              <th className="px-6 py-3 text-right font-medium">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = onSelectSymbol && selectedSymbol === row.symbol;
              return (
              <tr
                key={row.symbol}
                onClick={onSelectSymbol ? () => onSelectSymbol(tab, row.symbol) : undefined}
                className={`border-t border-border transition ${
                  onSelectSymbol ? "cursor-pointer hover:bg-surface-2/60" : "hover:bg-surface-2/60"
                } ${isSelected ? "bg-accent-2/5" : ""}`}
              >
                <td className="px-6 py-4">
                  <div className={`font-semibold ${isSelected ? "text-accent-2" : "text-text"}`}>
                    {row.symbol}
                  </div>
                  <div className="text-xs text-text-muted">{row.label}</div>
                </td>
                <td className={`num px-6 py-4 ${row.flat ? "text-text" : row.up ? "text-teal-600" : "text-red-600"}`}>
                  {row.bid}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`num rounded px-2 py-1 text-xs font-semibold ${
                      row.flat
                        ? "text-text-muted"
                        : row.up
                          ? "bg-teal-50 text-teal-700"
                          : "bg-red-50 text-red-600"
                    }`}
                  >
                    {row.change}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Sparkline points={row.spark} up={row.up} flat={row.flat} />
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`num text-xs font-semibold ${
                      row.flat ? "text-text-muted" : row.up ? "text-teal-600" : "text-red-600"
                    }`}
                  >
                    {row.percentage}
                  </span>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}