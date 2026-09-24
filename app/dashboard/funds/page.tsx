"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Info } from "lucide-react";
import { transactions, fundingMethods, userAccounts } from "@/data/dashboard";

type Tab = "deposit" | "withdraw" | "transfer" | "history";

const tabs: { key: Tab; label: string }[] = [
  { key: "deposit", label: "Deposit" },
  { key: "withdraw", label: "Withdrawal" },
  { key: "transfer", label: "Transfer" },
  { key: "history", label: "History" },
];

const validTabs: Tab[] = ["deposit", "withdraw", "transfer", "history"];

export default function FundsPage() {
  return (
    <Suspense fallback={null}>
      <FundsPageInner />
    </Suspense>
  );
}

function FundsPageInner() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab: Tab = validTabs.includes(requestedTab as Tab) ? (requestedTab as Tab) : "deposit";
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">Funds</h1>
        <p className="text-sm text-text-muted">Deposit, withdraw and move funds between your accounts.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="flex gap-6 overflow-x-auto border-b border-border px-6 pt-5 text-sm font-medium">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 border-b-2 pb-3 transition ${
                tab === t.key ? "border-accent-2 font-semibold text-text" : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "history" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="text-xs font-medium text-text-muted">
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Method</th>
                    <th className="px-2 py-2">Amount</th>
                    <th className="px-2 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="px-2 py-3 text-text-muted">{t.date}</td>
                      <td className="px-2 py-3 font-medium text-text">{t.type}</td>
                      <td className="px-2 py-3 text-text-muted">{t.method}</td>
                      <td className="num px-2 py-3 text-text">{t.amount}</td>
                      <td className="px-2 py-3 text-right">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            t.status === "Completed"
                              ? "bg-emerald-50 text-emerald-600"
                              : t.status === "Pending"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <FundsForm tab={tab} />
          )}
        </div>
      </div>
    </div>
  );
}

function FundsForm({ tab }: { tab: Exclude<Tab, "history"> }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="max-w-md"
    >
      <p className="mb-4 flex items-start gap-1.5 text-xs text-text-muted">
        <Info size={13} className="mt-0.5 shrink-0" />
        Frontend demo — no real money moves until a payments backend is connected.
      </p>

      <label className="mb-1 block text-xs text-text-muted">Account</label>
      <select className="mb-4 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text">
        {userAccounts.map((a) => (
          <option key={a.id}>{a.type} — #{a.accountNumber}</option>
        ))}
      </select>

      {tab === "transfer" ? (
        <>
          <label className="mb-1 block text-xs text-text-muted">To account</label>
          <select className="mb-4 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text">
            {userAccounts.map((a) => (
              <option key={a.id}>{a.type} — #{a.accountNumber}</option>
            ))}
          </select>
        </>
      ) : (
        <>
          <label className="mb-1 block text-xs text-text-muted">Method</label>
          <select className="mb-4 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text">
            {fundingMethods.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </>
      )}

      <label className="mb-1 block text-xs text-text-muted">Amount (USD)</label>
      <input
        type="number"
        min={1}
        step="0.01"
        placeholder="0.00"
        className="mb-6 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text"
      />

      <button
        type="submit"
className="w-full rounded-lg bg-accent-2/10 py-3 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"      >
        {tab === "deposit" ? "Deposit" : tab === "withdraw" ? "Request Withdrawal" : "Transfer"}
      </button>

      {submitted && (
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-text-muted">
          This is a demo form — your request has not actually been submitted to a payments backend.
        </p>
      )}
    </form>
  );
}