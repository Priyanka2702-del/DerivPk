"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet, TrendingUp, Gift, Percent, AlertTriangle, Info, CheckCircle2,
} from "lucide-react";
import { pammPools, pammSummary, verificationSteps } from "@/data/dashboard";
import PammInvestModal from "@/components/dashboard/PammInvestModal";

const allocationColors = [
  "bg-accent-2", "bg-cyan-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500",
];

export default function PammInvestPage() {
  const [selectedPoolId, setSelectedPoolId] = useState(pammPools[0].id);
  const [investOpen, setInvestOpen] = useState(false);
  const kycApproved = verificationSteps.every((s) => s.status === "approved");
  const selectedPool = pammPools.find((p) => p.id === selectedPoolId);

  const stats = [
    { icon: Wallet, label: "Wallet Balance", value: pammSummary.walletBalance, note: "Available to invest" },
    {
      icon: TrendingUp,
      label: "Your Investment",
      value: pammSummary.yourInvestment,
      note: "0 active positions",
    },
    {
      icon: Gift,
      label: "Total Profit Received",
      value: pammSummary.totalProfitReceived,
      note: "Credited to your wallet",
    },
    {
      icon: Percent,
      label: "Pool Monthly Return",
      value: selectedPool?.monthlyReturn ?? "—",
      note: "As displayed by selected pool",
      valueClass: selectedPool?.monthlyReturnUp ? "text-emerald-600" : "text-red-600",
    },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-xl font-semibold text-text">PAMM Investments</h1>
          <p className="text-sm text-text-muted">Invest your wallet balance into one of the available PAMM pools.</p>
        </div>
        <button
          type="button"
          onClick={() => setInvestOpen(true)}
className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent-2/10 px-5 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"        >
          <TrendingUp size={16} />
          Invest Now
        </button>
      </div>

      <p className="mb-5 flex items-start gap-1.5 text-xs text-text-muted">
        <Info size={13} className="mt-0.5 shrink-0" />
        Development preview with mock pool data — no real pooled-fund backend is connected yet,
        so no wallet funds are actually being invested.
      </p>

      {!kycApproved && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-amber-700">
            <AlertTriangle size={17} className="shrink-0" />
            KYC must be approved before you can invest.
          </div>
          <Link
            href="/dashboard/verification"
            className="rounded-lg border border-amber-300 bg-surface px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            Complete KYC
          </Link>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent-2/10 text-accent-2">
              <s.icon size={17} />
            </div>
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className={`num mt-1 font-display text-xl font-bold ${s.valueClass ?? "text-text"}`}>
              {s.value}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text">Available PAMM Pools</h2>
        <span className="text-sm text-text-muted">{pammPools.length} pools</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pammPools.map((pool) => {
          const selected = pool.id === selectedPoolId;
          return (
            <div
              key={pool.id}
              className={`rounded-xl border bg-surface p-5 transition ${
                selected ? "border-accent-2 ring-1 ring-accent-2" : "border-border"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-text">{pool.name}</h3>
                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    selected ? "bg-accent-2/10 text-accent-2" : "bg-surface-2 text-text-muted"
                  }`}
                >
                  {selected && <CheckCircle2 size={12} />}
                  {selected ? "Selected" : "Pool"}
                </span>
              </div>

              <dl className="mb-4 space-y-2.5 text-sm">
                <Row label="Pool Status">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {pool.status}
                  </span>
                </Row>
                <Row label="Total Pool AUM"><span className="num font-semibold text-text">{pool.totalAUM}</span></Row>
                <Row label="Pool Base Capital"><span className="num font-semibold text-text">{pool.baseCapital}</span></Row>
                <Row label="Monthly Return">
                  <span className={`num font-semibold ${pool.monthlyReturnUp ? "text-emerald-600" : "text-red-600"}`}>
                    {pool.monthlyReturn}
                  </span>
                </Row>
                <Row label="Active Strategies"><span className="num font-semibold text-text">{pool.activeStrategies}</span></Row>
                <Row label="Risk Mode"><span className="font-semibold text-accent-2">{pool.riskMode}</span></Row>
                <Row label="Profit Reporting"><span className="font-semibold text-text">{pool.profitReporting}</span></Row>
              </dl>

              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Portfolio Allocation
              </p>
              <div className="mb-5 space-y-2.5">
                {pool.allocation.map((a, i) => (
                  <div key={a.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-text-muted">{a.label}</span>
                      <span className="num font-semibold text-text">{a.percent}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full ${allocationColors[i % allocationColors.length]}`}
                        style={{ width: `${a.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => (selected ? setInvestOpen(true) : setSelectedPoolId(pool.id))}
                className={`w-full rounded-lg py-2.5 text-sm font-semibold transition ${
                  selected
? "bg-accent-2/10 text-accent-2 hover:bg-accent-2/20"                    
: "bg-accent-2/10 text-accent-2 hover:bg-accent-2/20"
                }`}
              >
                {selected ? "Invest in This Pool" : "Select This Pool"}
              </button>
            </div>
          );
        })}
      </div>

      <PammInvestModal
        open={investOpen}
        onClose={() => setInvestOpen(false)}
        pools={pammPools}
        selectedPoolId={selectedPoolId}
        onSelectPool={setSelectedPoolId}
        walletBalance={pammSummary.walletBalance}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}