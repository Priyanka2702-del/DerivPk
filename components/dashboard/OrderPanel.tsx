"use client";

import { useState } from "react";

import { tradableSymbols } from "@/components/dashboard/SymbolSearch";

export default function OrderPanel({ symbol }: { symbol?: string }) {
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [selected, setSelected] = useState(symbol ?? tradableSymbols[0].value);
  const [placed, setPlaced] = useState(false);

  const label = tradableSymbols.find((s) => s.value === selected)?.label ?? selected;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1 text-sm font-semibold text-text">Place Order</div>
      <p className="mb-4 flex items-start gap-1.5 text-xs text-text-muted">
      </p>

      <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <button
          onClick={() => setSide("Buy")}
          className={`py-2.5 text-sm font-semibold transition ${
            side === "Buy" ? "bg-emerald-600 text-white" : "bg-surface text-text-muted"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("Sell")}
          className={`py-2.5 text-sm font-semibold transition ${
            side === "Sell" ? "bg-red-600 text-white" : "bg-surface text-text-muted"
          }`}
        >
          Sell
        </button>
      </div>

      <label className="mb-1 block text-xs text-text-muted">Symbol</label>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-4 w-full rounded-lg border border-border px-3 py-2 text-sm text-text"
      >
        {tradableSymbols.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <label className="mb-1 block text-xs text-text-muted">Volume (lots)</label>
      <input
        type="number"
        defaultValue={1}
        step={0.01}
        min={0.01}
        className="mb-6 w-full rounded-lg border border-border px-3 py-2 text-sm text-text"
      />

      <button
        type="button"
        onClick={() => setPlaced(true)}
        className={`w-full rounded-lg py-3 text-sm font-semibold text-white transition ${
          side === "Buy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {side} {label}
      </button>

      {placed && (
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-text-muted">
          This is a demo order form — connect a live trading account under{" "}
          <span className="font-semibold text-text">Live Trading</span> to place real orders.
        </p>
      )}
    </div>
  );
}
