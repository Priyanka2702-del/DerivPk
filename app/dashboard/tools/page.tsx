"use client";

import { useMemo, useState, type JSX } from "react";
import { dashboardTools } from "@/data/dashboard";

type ToolKey = (typeof dashboardTools)[number]["key"];

const CONTRACT_SIZE = 100000; // standard lot, units of base currency

function numberField(
  label: string,
  value: number,
  onChange: (v: number) => void,
  step = "any"
) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-xs text-text-muted">{label}</label>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
      />
    </div>
  );
}

function ResultBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-4 py-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="num mt-0.5 text-lg font-semibold text-text">{value}</p>
    </div>
  );
}

function PipCalculator() {
  const [lots, setLots] = useState(1);
  const [pipSize, setPipSize] = useState(0.0001);
  const [exchangeRate, setExchangeRate] = useState(1);

  const pipValue = useMemo(() => {
    // Approximate pip value in the quote currency; divide by rate to convert
    // to account currency when the pair isn't already quoted in it.
    if (!lots || !pipSize || !exchangeRate) return NaN;
    return (pipSize * CONTRACT_SIZE * lots) / exchangeRate;
  }, [lots, pipSize, exchangeRate]);

  return (
    <div>
      {numberField("Lot size", lots, setLots, "0.01")}
      {numberField("Pip size (e.g. 0.0001, or 0.01 for JPY pairs)", pipSize, setPipSize)}
      {numberField("Exchange rate (quote → account currency, use 1 if already USD)", exchangeRate, setExchangeRate)}
      <ResultBox label="Value per pip" value={Number.isFinite(pipValue) ? `$${pipValue.toFixed(2)}` : "—"} />
    </div>
  );
}

function MarginCalculator() {
  const [lots, setLots] = useState(1);
  const [price, setPrice] = useState(1.085);
  const [leverage, setLeverage] = useState(500);

  const margin = useMemo(() => {
    if (!lots || !price || !leverage) return NaN;
    return (lots * CONTRACT_SIZE * price) / leverage;
  }, [lots, price, leverage]);

  return (
    <div>
      {numberField("Lot size", lots, setLots, "0.01")}
      {numberField("Current price", price, setPrice)}
      {numberField("Leverage (e.g. 500 for 1:500)", leverage, setLeverage, "1")}
      <ResultBox label="Required margin" value={Number.isFinite(margin) ? `$${margin.toFixed(2)}` : "—"} />
    </div>
  );
}

function PnlCalculator() {
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [lots, setLots] = useState(1);
  const [openPrice, setOpenPrice] = useState(1.085);
  const [closePrice, setClosePrice] = useState(1.09);

  const pnl = useMemo(() => {
    if (!lots || !openPrice || !closePrice) return NaN;
    const direction = side === "Buy" ? 1 : -1;
    return (closePrice - openPrice) * lots * CONTRACT_SIZE * direction;
  }, [side, lots, openPrice, closePrice]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {(["Buy", "Sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`py-2.5 text-sm font-semibold transition ${
side === s ? "bg-accent-2/10 text-accent-2" : "bg-surface text-text-muted"            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {numberField("Lot size", lots, setLots, "0.01")}
      {numberField("Open price", openPrice, setOpenPrice)}
      {numberField("Close price", closePrice, setClosePrice)}
      <ResultBox
        label="Estimated profit / loss"
        value={Number.isFinite(pnl) ? `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}` : "—"}
      />
    </div>
  );
}

function PositionSizeCalculator() {
  const [balance, setBalance] = useState(1000);
  const [riskPct, setRiskPct] = useState(1);
  const [stopLossPips, setStopLossPips] = useState(20);
  const [pipValuePerLot, setPipValuePerLot] = useState(10);

  const lots = useMemo(() => {
    if (!balance || !riskPct || !stopLossPips || !pipValuePerLot) return NaN;
    const riskAmount = (balance * riskPct) / 100;
    return riskAmount / (stopLossPips * pipValuePerLot);
  }, [balance, riskPct, stopLossPips, pipValuePerLot]);

  return (
    <div>
      {numberField("Account balance (USD)", balance, setBalance)}
      {numberField("Risk per trade (%)", riskPct, setRiskPct)}
      {numberField("Stop loss (pips)", stopLossPips, setStopLossPips)}
      {numberField("Pip value per standard lot (USD)", pipValuePerLot, setPipValuePerLot)}
      <ResultBox label="Suggested position size" value={Number.isFinite(lots) ? `${lots.toFixed(2)} lots` : "—"} />
    </div>
  );
}

const toolComponents: Record<ToolKey, () => JSX.Element> = {
  pip: PipCalculator,
  margin: MarginCalculator,
  pnl: PnlCalculator,
  position: PositionSizeCalculator,
};

export default function ToolsPage() {
  const [active, setActive] = useState<ToolKey>("pip");
  const ActiveTool = toolComponents[active];
  const activeMeta = dashboardTools.find((t) => t.key === active)!;

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">Tools</h1>
        <p className="text-sm text-text-muted">Quick calculators to help plan and size your trades.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {dashboardTools.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`shrink-0 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition ${
active === t.key ? "bg-accent-2/10 text-accent-2" : "bg-surface border border-border text-text-muted hover:text-text"              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-base font-semibold text-text">{activeMeta.label}</h2>
          <p className="mb-5 text-sm text-text-muted">{activeMeta.description}</p>
          <div className="max-w-sm">
            <ActiveTool />
          </div>
        </div>
      </div>
    </div>
  );
}