"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { userAccounts, transactions, accountSummary, fundingMethods } from "@/data/dashboard";

export default function WithdrawPage() {
  const [account, setAccount] = useState(userAccounts[0]?.id ?? "");
  const [method, setMethod] = useState(fundingMethods[0]);
  const [amount, setAmount] = useState<number | "">("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const availableBalance = parseFloat(accountSummary.available.replace(/,/g, ""));
  const recentWithdrawals = transactions.filter((t) => t.type === "Withdrawal").slice(0, 3);
  const overLimit = typeof amount === "number" && amount > availableBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || overLimit) return;
    setStatus("loading");
    setTimeout(() => setStatus("success"), 1200);
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">Withdraw</h1>
        <p className="text-sm text-text-muted">Move funds from your wallet to your bank or e-wallet.</p>
      </div>

      

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-surface p-6">
          {status === "success" ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="mb-4 text-emerald-500" size={44} />
              <h2 className="font-display text-lg font-semibold text-text">Withdrawal requested</h2>
              <p>
                
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
className="mt-6 rounded-lg bg-accent-2/10 px-6 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"              >
                Make another request
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

              <label className="mb-1 block text-xs font-medium text-text-muted">Withdrawal method</label>
              <select
  value={method}
  onChange={(e) => setMethod(e.target.value)}
  className="mb-5 w-full appearance-none rounded-lg border border-border px-3 py-2.5 text-sm text-text"
>
  {fundingMethods.map((m) => (
    <option key={m}>{m}</option>
  ))}
</select>

              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-text-muted">Amount (USD)</label>
                <button
                  type="button"
                  onClick={() => setAmount(availableBalance)}
                  className="text-xs font-semibold text-accent-2 hover:underline"
                >
                  Max: ${accountSummary.available}
                </button>
              </div>
              <input
                type="number"
                min={1}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : "")}
                placeholder="0.00"
                className={`mb-1 w-full rounded-lg border px-3 py-2.5 text-sm text-text ${
                  overLimit ? "border-red-400" : "border-border"
                }`}
              />
              {overLimit && (
                <p className="mb-4 flex items-center gap-1.5 text-xs text-red-500">
                  <AlertTriangle size={12} /> Amount exceeds your available balance.
                </p>
              )}

              <p className="mb-6 text-xs text-text-muted">
                Withdrawals are typically processed within 1–3 business days after review.
              </p>

              <button
                type="submit"
                disabled={status === "loading" || !amount || overLimit}
className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-2/10 py-3.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20 disabled:cursor-not-allowed disabled:opacity-50"              >
                {status === "loading" && <Loader2 size={16} className="animate-spin" />}
                {status === "loading" ? "Submitting…" : "Request Withdrawal"}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs text-text-muted">Available to withdraw</p>
            <p className="num mt-1 font-display text-2xl font-bold text-text">
              ${accountSummary.available}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="mb-3 text-sm font-semibold text-text">Recent withdrawals</p>
            {recentWithdrawals.length === 0 ? (
              <p className="text-xs text-text-muted">No withdrawals yet.</p>
            ) : (
              <div className="space-y-3">
                {recentWithdrawals.map((t) => (
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