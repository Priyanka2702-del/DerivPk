import { ArrowRight, Layers3 } from "lucide-react";
import { accountSummary } from "@/data/dashboard";

export default function TradingAccountCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 text-sm font-semibold text-text">Trading Account</div>

      <button
        type="button"
        className="flex w-full items-center gap-4 rounded-lg bg-teal-50 p-4 text-left transition hover:bg-teal-100"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <Layers3 size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text">
            We have created an MT5 trading account for you!
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Complete the rest of the setup to start trading live and access{" "}
            <span className="font-semibold text-teal-700">{accountSummary.instrumentCount}</span>{" "}
            global assets.
          </p>
        </div>
        <ArrowRight size={18} className="shrink-0 text-teal-700" />
      </button>
    </div>
  );
}