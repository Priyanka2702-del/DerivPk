
"use client";

import { useCallback, useEffect, useState } from "react";

type Account = {
  id: string;
  accountNumber: string;
  status: string;
  currency: string;
  cash: number;
  buyingPower: number;
  equity: number;
};

type Position = {
  symbol: string;
  qty: string;
  side?: string;
  market_value?: string;
  cost_basis?: string;
  unrealized_pl?: string;
  unrealized_plpc?: string;
  current_price?: string;
  avg_entry_price?: string;
};

type Order = {
  id: string;
  symbol: string;
  qty?: string;
  side?: string;
  type?: string;
  status?: string;
  time_in_force?: string;
  filled_qty?: string;
  filled_avg_price?: string | null;
  submitted_at?: string;
  filled_at?: string | null;
};

type RealResponse = {
  success: boolean;
  message?: string;
  account?: Account;
  positions?: Position[];
  orders?: Order[];
};

function money(value: number | string | undefined) {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

function number(value: number | string | undefined) {
  const n = Number(value ?? 0);

  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export default function RealTradingPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadRealAccount = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/trading/real", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      let data: RealResponse | null = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Unable to load real trading account"
        );
      }

      setAccount(data.account ?? null);
      setPositions(data.positions ?? []);
      setOrders(data.orders ?? []);
    } catch (err) {
      console.error("REAL ACCOUNT ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load real account"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRealAccount();

    const interval = setInterval(() => {
      loadRealAccount();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadRealAccount]);

  if (loading) {
    return (
      <main className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-56 rounded bg-gray-200" />
          <div className="grid gap-4 md:grid-cols-4">
            <div className="h-28 rounded-xl bg-gray-200" />
            <div className="h-28 rounded-xl bg-gray-200" />
            <div className="h-28 rounded-xl bg-gray-200" />
            <div className="h-28 rounded-xl bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !account) {
    return (
      <main className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-semibold text-red-700">
            Real Account
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={() => loadRealAccount(true)}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-gray-500">
            MT5 WebTrader
          </p>

          <h1 className="text-2xl font-bold">
            Real Trading Account
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Live account information from your connected trading account.
          </p>
        </div>

        <button
          onClick={() => loadRealAccount(true)}
          disabled={refreshing}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Account status */}
      {account && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm text-gray-500">
                Real Account
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {account.accountNumber || account.id}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Currency: {account.currency}
              </p>
            </div>

            <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              {account.status}
            </span>
          </div>
        </section>
      )}

      {/* Account summary */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Cash Balance
          </p>

          <p className="mt-2 text-2xl font-bold">
            {money(account?.cash)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Equity
          </p>

          <p className="mt-2 text-2xl font-bold">
            {money(account?.equity)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Buying Power
          </p>

          <p className="mt-2 text-2xl font-bold">
            {money(account?.buyingPower)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Open Positions
          </p>

          <p className="mt-2 text-2xl font-bold">
            {positions.length}
          </p>
        </div>
      </section>

      {/* Notice */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-900">
          Real account
        </h2>

        <p className="mt-1 text-sm leading-6 text-amber-800">
          This page displays live account, position and order information.
          Real-money order execution is not enabled in this version.
        </p>
      </section>

      {/* Positions */}
      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Open Positions
          </h2>
        </div>

        {positions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No open positions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3">Symbol</th>
                  <th className="px-5 py-3">Side</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Entry</th>
                  <th className="px-5 py-3">Current</th>
                  <th className="px-5 py-3">Market Value</th>
                  <th className="px-5 py-3">P/L</th>
                </tr>
              </thead>

              <tbody>
                {positions.map((position) => (
                  <tr
                    key={position.symbol}
                    className="border-b last:border-0"
                  >
                    <td className="px-5 py-4 font-semibold">
                      {position.symbol}
                    </td>

                    <td className="px-5 py-4">
                      {position.side ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {number(position.qty)}
                    </td>

                    <td className="px-5 py-4">
                      {money(position.avg_entry_price)}
                    </td>

                    <td className="px-5 py-4">
                      {money(position.current_price)}
                    </td>

                    <td className="px-5 py-4">
                      {money(position.market_value)}
                    </td>

                    <td className="px-5 py-4">
                      {money(position.unrealized_pl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Orders */}
      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Order History
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3">Symbol</th>
                  <th className="px-5 py-3">Side</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Filled Qty</th>
                  <th className="px-5 py-3">Avg Price</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-5 py-4 font-semibold">
                      {order.symbol}
                    </td>

                    <td className="px-5 py-4">
                      {order.side ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {order.type ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {number(order.qty)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                        {order.status ?? "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {number(order.filled_qty)}
                    </td>

                    <td className="px-5 py-4">
                      {order.filled_avg_price
                        ? money(order.filled_avg_price)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-gray-500">
        Account data refreshes automatically every 10 seconds.
      </p>
    </main>
  );
}

