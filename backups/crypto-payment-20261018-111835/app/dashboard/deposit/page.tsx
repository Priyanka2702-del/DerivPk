"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap, Clock, Loader2, CheckCircle2,
} from "lucide-react";
import { userAccounts, transactions, accountSummary } from "@/data/dashboard";

const presetAmounts = [50, 100, 250, 500, 1000];

const methods = [
  { key: "Crypto (USDT)", icon: Zap, time: "10–30 minutes", note: "TRC20 / ERC20" },
];

export default function FastDepositPage() {
  const [account, setAccount] = useState(userAccounts[0]?.id ?? "");
  const [method, setMethod] = useState(methods[0].key);
  const [amount, setAmount] = useState<number | "">(100);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const activeMethod = methods.find((m) => m.key === method)!;
  const recentDeposits = transactions.filter((t) => t.type === "Deposit").slice(0, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setStatus("loading");
    setTimeout(() => setStatus("success"), 1200);
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">Deposit</h1>
        <p className="text-sm text-text-muted">Top up your account in a few taps.</p>
      </div>

      
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-surface p-6">
          {status === "success" ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="mb-4 text-emerald-500" size={44} />
              <h2 className="font-display text-lg font-semibold text-text">Deposit request submitted</h2>
             
              <button
                type="button"
                onClick={() => setStatus("idle")}
className="mt-6 rounded-lg bg-accent-2/10 px-6 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"              >
                Make another deposit
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="mb-1 block text-xs font-medium text-text-muted">Account</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="mb-5 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text"
              >
                {userAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.type} — #{a.accountNumber}</option>
                ))}
              </select>

              <label className="mb-2 block text-xs font-medium text-text-muted">Payment method</label>
              <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {methods.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition ${
                      method === m.key
                        ? "border-accent-2 bg-accent-2/5 text-accent-2"
                        : "border-border text-text-muted hover:border-accent-2/40"
                    }`}
                  >
                    <m.icon size={18} />
                    <span className="text-xs font-semibold">{m.key}</span>
                  </button>
                ))}
              </div>

              <p className="mb-5 flex items-center gap-1.5 text-xs text-text-muted">
                <Clock size={13} />
                {activeMethod.note} · Typically {activeMethod.time.toLowerCase()}
              </p>

              <label className="mb-2 block text-xs font-medium text-text-muted">Quick amount (USD)</label>
              <div className="mb-4 flex flex-wrap gap-2">
                {presetAmounts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      amount === p ? "bg-accent-2 text-white" : "bg-surface-2 text-text hover:bg-border/60"
                    }`}
                  >
                    ${p}
                  </button>
                ))}
              </div>

              <label className="mb-1 block text-xs font-medium text-text-muted">Or enter custom amount</label>
              <input
                type="number"
                min={1}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : "")}
                placeholder="0.00"
                className="mb-6 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text"
              />

              <button
                type="submit"
                disabled={status === "loading"}
className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-2/10 py-3.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20 disabled:opacity-70"              >
                {status === "loading" && <Loader2 size={16} className="animate-spin" />}
                {status === "loading" ? "Processing…" : `Deposit ${amount ? `$${amount}` : ""}`}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs text-text-muted">Current wallet balance</p>
            <p className="num mt-1 font-display text-2xl font-bold text-text">
              ${accountSummary.totalAssets}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="mb-3 text-sm font-semibold text-text">Recent deposits</p>
            {recentDeposits.length === 0 ? (
              <p className="text-xs text-text-muted">No deposits yet.</p>
            ) : (
              <div className="space-y-3">
                {recentDeposits.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-text">{t.method}</p>
                      <p className="text-xs text-text-muted">{t.date}</p>
                    </div>
                    <span className="num font-semibold text-text">{t.amount}</span>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/dashboard/funds?tab=history"
              className="mt-4 block text-xs font-semibold text-accent-2 hover:underline"
            >
              View full history →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}