"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { userAccounts, transactions, accountSummary } from "@/data/dashboard";

// Transfer endpoints: the wallet plus every trading account. Including the
// wallet means transfers work even with a single trading account (wallet ->
// account, or account -> wallet), matching how most brokers actually do
// internal transfers.
const endpoints = [
  { id: "wallet", label: "PK Wallet" },
  ...userAccounts.map((a) => ({ id: a.id, label: `${a.type} — #${a.accountNumber}` })),
];

export default function TransferPage() {
  const [fromAccount, setFromAccount] = useState(endpoints[0].id);
  const [toAccount, setToAccount] = useState(endpoints[1]?.id ?? endpoints[0].id);
  const [amount, setAmount] = useState<number | "">("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const availableBalance = parseFloat(accountSummary.available.replace(/,/g, ""));
  const recentTransfers = transactions.filter((t) => t.type === "Transfer").slice(0, 3);
  const sameAccount = fromAccount === toAccount;
  const overLimit = typeof amount === "number" && amount > availableBalance;

  const handleSwap = () => {
    setFromAccount(toAccount);
    setToAccount(fromAccount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || overLimit || sameAccount) return;
    setStatus("loading");
    setTimeout(() => setStatus("success"), 1200);
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">Transfer</h1>
        <p className="text-sm text-text-muted">Move funds between your wallet and trading accounts.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-surface p-6">
          {status === "success" ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="mb-4 text-emerald-500" size={44} />
              <h2 className="font-display text-lg font-semibold text-text">Transfer submitted</h2>
              <p >
                
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
className="mt-6 rounded-lg bg-accent-2/10 px-6 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"              >
                Make another transfer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="mb-1 block text-xs font-medium text-text-muted">From</label>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="mb-3 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text"
              >
                {endpoints.map((e) => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </select>

              <div className="mb-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  aria-label="Swap accounts"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted transition hover:text-text"
                >
                  <ArrowDown size={15} />
                </button>
              </div>

              <label className="mb-1 block text-xs font-medium text-text-muted">To</label>
              <select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="mb-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text"
              >
                {endpoints.map((e) => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </select>
              {sameAccount && (
                <p className="mb-4 flex items-center gap-1.5 text-xs text-red-500">
                  <AlertTriangle size={12} /> Choose two different accounts.
                </p>
              )}
              {!sameAccount && <div className="mb-4" />}

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

              <p className="mb-6 mt-2 text-xs text-text-muted">
                Internal transfers between your own wallet and accounts are typically instant.
              </p>

              <button
                type="submit"
                disabled={status === "loading" || !amount || overLimit || sameAccount}
className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-2/10 py-3.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20 disabled:cursor-not-allowed disabled:opacity-50"              >
                {status === "loading" && <Loader2 size={16} className="animate-spin" />}
                {status === "loading" ? "Transferring…" : "Transfer Funds"}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs text-text-muted">Available balance</p>
            <p className="num mt-1 font-display text-2xl font-bold text-text">
              ${accountSummary.available}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="mb-3 text-sm font-semibold text-text">Recent transfers</p>
            {recentTransfers.length === 0 ? (
              <p className="text-xs text-text-muted">No transfers yet.</p>
            ) : (
              <div className="space-y-3">
                {recentTransfers.map((t) => (
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