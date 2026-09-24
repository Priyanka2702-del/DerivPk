"use client";

import { useState } from "react";
import { Info, Users, TrendingUp } from "lucide-react";
import { copyTraders } from "@/data/dashboard";
import Sparkline from "@/components/dashboard/Sparkline";
import { generateSparklineData } from "@/lib/sparkline";

const riskStyles: Record<string, string> = {
  Low: "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-red-50 text-red-700",
};

export default function CopyPage() {
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  return (
    <div>
      <div className="mb-1">
        <h1 className="font-display text-xl font-semibold text-text">Deriv PK Copy</h1>
      </div>
      <p className="mb-4 flex items-start gap-1.5 text-xs text-text-muted">
        <Info size={13} className="mt-0.5 shrink-0" />
        Development preview with mock trader data — no real copy-trading backend is connected
        yet, so no trades are actually being copied.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {copyTraders.map((t) => {
          const chartData = generateSparklineData(t.id, t.up);
          return (
            <div
              key={t.id}
              className="group rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent-2/30 hover:shadow-lg hover:shadow-accent-2/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-2/10 font-display text-sm font-bold text-accent-2 ring-2 ring-accent-2/10">
                  {t.name.split(" ").map((w) => w[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{t.name}</p>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskStyles[t.riskLevel]}`}
                  >
                    {t.riskLevel} risk
                  </span>
                </div>
              </div>

              {/* Return rate + sparkline */}
              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] text-text-muted">30d ROI</p>
                  <p className={`num font-display text-2xl font-bold ${t.up ? "text-emerald-600" : "text-red-600"}`}>
                    {t.roi30d}
                  </p>
                </div>
                <Sparkline id={t.id} data={chartData} positive={t.up} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-center">
                <div>
                  <p className="num text-sm font-semibold text-text">{t.winRate}</p>
                  <p className="text-[11px] text-text-muted">Win rate</p>
                </div>
                <div>
                  <p className="num flex items-center justify-center gap-1 text-sm font-semibold text-text">
                    <Users size={12} /> {t.followers}
                  </p>
                  <p className="text-[11px] text-text-muted">Followers</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFollowing((f) => ({ ...f, [t.id]: !f[t.id] }))}
                className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 ${
                  following[t.id]
                    ? "bg-surface-2 text-text hover:bg-border/60"
: "bg-accent-2/10 text-accent-2 hover:bg-accent-2/20"                }`}
              >
                <TrendingUp size={15} />
                {following[t.id] ? "Following" : "Copy"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}