
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TradingAccount = {
  id: string;
  provider: string;
  providerAccountId: string;
  accountType: "paper" | "live";
  status: string;
  accountNumber?: string;
  balance?: number;
  equity?: number;
  currency?: string;
};

export default function MT5Page() {
  const [accounts, setAccounts] = useState<
    TradingAccount[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAccounts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/trading/accounts",
        {
          cache: "no-store",
        }
      );

      const text = await response.text();

      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load trading accounts."
        );
      }

      setAccounts(data.accounts || []);
    } catch (error) {
      console.error(
        "MT5 ACCOUNTS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load trading accounts."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const paperAccount = accounts.find(
    (account) =>
      account.accountType === "paper"
  );

  const liveAccount = accounts.find(
    (account) =>
      account.accountType === "live"
  );

  function formatMoney(
    value?: number,
    currency = "USD"
  ) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency,
      }
    ).format(value || 0);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-text-muted transition hover:text-text"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 font-display text-3xl font-semibold text-text">
            MT5 Trading
          </h1>

          <p className="mt-2 text-sm text-text-muted">
            Manage your demo and real trading
            accounts.
          </p>
        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-2">

            <div className="h-80 animate-pulse rounded-xl border border-border bg-surface" />

            <div className="h-80 animate-pulse rounded-xl border border-border bg-surface" />

          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">

            {/* ====================================== */}
            {/* DEMO ACCOUNT */}
            {/* ====================================== */}

            <section className="rounded-xl border border-border bg-surface p-6">

              <div className="flex items-start justify-between">

                <div>
                  <h2 className="text-xl font-semibold text-text">
                    Demo Account
                  </h2>

                  <p className="mt-1 text-sm text-text-muted">
                    Practice trading with a paper
                    trading account.
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Demo
                </span>

              </div>

              {paperAccount ? (
                <>
                  <div className="mt-6 space-y-4">

                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-sm text-text-muted">
                        Login
                      </span>

                      <span className="text-sm font-medium text-text">
                        {paperAccount.accountNumber ||
                          paperAccount.providerAccountId}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-sm text-text-muted">
                        Server
                      </span>

                      <span className="text-sm font-medium text-text">
                        Demo
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-sm text-text-muted">
                        Balance
                      </span>

                      <span className="text-sm font-medium text-text">
                        {formatMoney(
                          paperAccount.balance,
                          paperAccount.currency
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-sm text-text-muted">
                        Equity
                      </span>

                      <span className="text-sm font-medium text-text">
                        {formatMoney(
                          paperAccount.equity,
                          paperAccount.currency
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-text-muted">
                        Status
                      </span>

                      <span className="text-sm font-medium text-emerald-600">
                        {paperAccount.status}
                      </span>
                    </div>

                  </div>

                  <Link
                    href="/dashboard/mt5/demo"
                    className="mt-6 block w-full rounded-lg bg-accent-2 px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Open Demo Account
                  </Link>
                </>
              ) : (
                <>
                  <div className="mt-8 rounded-lg border border-border bg-background p-5 text-center">

                    <p className="text-sm text-text-muted">
                      You do not have a demo
                      account yet.
                    </p>

                  </div>

                  <Link
                    href="/open-account?type=paper"
                    className="mt-6 block w-full rounded-lg bg-accent-2 px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Open Demo Account
                  </Link>
                </>
              )}

            </section>

            {/* ====================================== */}
            {/* REAL ACCOUNT */}
            {/* ====================================== */}

            <section className="rounded-xl border border-border bg-surface p-6">

              <div className="flex items-start justify-between">

                <div>
                  <h2 className="text-xl font-semibold text-text">
                    Real Account
                  </h2>

                  <p className="mt-1 text-sm text-text-muted">
                    Trade using your real trading
                    account.
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Real
                </span>

              </div>

              {liveAccount ? (
                <>
                  <div className="mt-6 space-y-4">

                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-sm text-text-muted">
                        Login
                      </span>

                      <span className="text-sm font-medium text-text">
                        {liveAccount.accountNumber ||
                          liveAccount.providerAccountId}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-sm text-text-muted">
                        Server
                      </span>

                      <span className="text-sm font-medium text-text">
                        Live
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-sm text-text-muted">
                        Balance
                      </span>

                      <span className="text-sm font-medium text-text">
                        {formatMoney(
                          liveAccount.balance,
                          liveAccount.currency
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-sm text-text-muted">
                        Equity
                      </span>

                      <span className="text-sm font-medium text-text">
                        {formatMoney(
                          liveAccount.equity,
                          liveAccount.currency
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-text-muted">
                        Status
                      </span>

                      <span className="text-sm font-medium text-emerald-600">
                        {liveAccount.status}
                      </span>
                    </div>

                  </div>

                  <Link
                    href="/dashboard/mt5/real"
                    className="mt-6 block w-full rounded-lg bg-accent-2 px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Open Real Account
                  </Link>
                </>
              ) : (
                <>
                  <div className="mt-8 rounded-lg border border-border bg-background p-5 text-center">

                    <p className="text-sm text-text-muted">
                      No real account found.
                    </p>

                    <p className="mt-2 text-xs text-text-muted">
                      Complete your account profile
                      to create a real trading account.
                    </p>

                  </div>

                  {/* IMPORTANT:
                      Real account must use type=live
                  */}

                  <Link
                    href="/open-account?type=live"
                    className="mt-6 block w-full rounded-lg bg-accent-2 px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Open Real Account
                  </Link>
                </>
              )}

            </section>

          </div>
        )}

        {/* Footer */}

        <div className="mt-8 text-center text-xs text-text-muted">
          Trading services are provided through the
          connected brokerage infrastructure.
        </div>

      </div>
    </main>
  );
}