
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  X,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

type Account = {
  id: string;
  accountNumber: string;
  status: string;
  currency: string;
  cash: string;
  buyingPower: string;
  equity: string;
};

type Position = {
  symbol: string;
  qty: string;
  side: string;
  avg_entry_price: string;
  current_price: string;
  market_value: string;
  unrealized_pl: string;
  unrealized_plpc: string;
};

type Order = {
  id: string;
  symbol: string;
  qty?: string;
  filled_qty?: string;
  side: string;
  type: string;
  time_in_force: string;
  status: string;
  limit_price?: string | null;
  submitted_at?: string;
};

type DemoResponse = {
  account: Account;
  positions: Position[];
  orders: Order[];
};

function money(value: string | number | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "$0.00";
  }

  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function DemoTradingPage() {
  const [data, setData] = useState<DemoResponse | null>(null);

  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"market" | "limit">("market");
  const [qty, setQty] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [closingSymbol, setClosingSymbol] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/trading/demo",
        {
          cache: "no-store",
        }
      );

      const text = await response.text();

      let result: any = null;

      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            `Failed to load demo account (${response.status})`
        );
      }

      setData(result);
    } catch (err) {
      console.error("DEMO PAGE LOAD ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load demo account"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function placeOrder(event: FormEvent) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanSymbol = symbol.trim().toUpperCase();

    if (!cleanSymbol) {
      setError("Enter a symbol.");
      return;
    }

    const quantity = Number(qty);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a valid quantity.");
      return;
    }

    if (
      type === "limit" &&
      (!limitPrice || Number(limitPrice) <= 0)
    ) {
      setError("Enter a valid limit price.");
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await fetch(
        "/api/trading/demo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symbol: cleanSymbol,
            side,
            type,
            qty,
            timeInForce: "day",
            limitPrice:
              type === "limit"
                ? limitPrice
                : undefined,
          }),
        }
      );

      const text = await response.text();

      let result: any = null;

      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to submit paper order"
        );
      }

      setSuccess(
        `${side.toUpperCase()} order submitted for ${cleanSymbol}.`
      );

      await loadData();
    } catch (err) {
      console.error("ORDER ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit order"
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  async function closePosition(positionSymbol: string) {
    try {
      setClosingSymbol(positionSymbol);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/trading/demo/positions/${encodeURIComponent(
          positionSymbol
        )}`,
        {
          method: "DELETE",
        }
      );

      const text = await response.text();

      let result: any = null;

      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to close position"
        );
      }

      setSuccess(
        `${positionSymbol} position close request submitted.`
      );

      await loadData();
    } catch (err) {
      console.error("CLOSE POSITION ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to close position"
      );
    } finally {
      setClosingSymbol(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/mt5"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} />
          Back to Trading Accounts
        </Link>

        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-text-muted">
          Loading demo trading account...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mt5"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft size={16} />
        Back to Trading Accounts
      </Link>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              MetaQuotes Ltd.
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-text">
              Demo Trading
            </h1>

            <p className="mt-1 text-sm text-text-muted">
              Paper trading environment
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-2"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {data && (
        <>
          {/* Account summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs text-text-muted">
                Balance
              </p>

              <p className="mt-2 text-xl font-semibold text-text">
                {money(data.account.cash)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs text-text-muted">
                Equity
              </p>

              <p className="mt-2 text-xl font-semibold text-text">
                {money(data.account.equity)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs text-text-muted">
                Buying Power
              </p>

              <p className="mt-2 text-xl font-semibold text-text">
                {money(data.account.buyingPower)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs text-text-muted">
                Account
              </p>

              <p className="mt-2 text-sm font-semibold text-text">
                {data.account.accountNumber}
              </p>

              <p className="mt-1 text-xs text-green-600">
                {data.account.status}
              </p>
            </div>
          </div>

          {/* Order panel */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-text">
                Place Paper Order
              </h2>

              <p className="mt-1 text-xs text-text-muted">
                Orders are submitted to the Alpaca paper
                trading account.
              </p>
            </div>

            <form
              onSubmit={placeOrder}
              className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-5"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Symbol
                </label>

                <input
                  value={symbol}
                  onChange={(e) =>
                    setSymbol(e.target.value)
                  }
                  placeholder="AAPL"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Side
                </label>

                <select
                  value={side}
                  onChange={(e) =>
                    setSide(
                      e.target.value as
                        | "buy"
                        | "sell"
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none"
                >
                  <option value="buy">
                    Buy
                  </option>
                  <option value="sell">
                    Sell
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Order Type
                </label>

                <select
                  value={type}
                  onChange={(e) =>
                    setType(
                      e.target.value as
                        | "market"
                        | "limit"
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none"
                >
                  <option value="market">
                    Market
                  </option>
                  <option value="limit">
                    Limit
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0.000001"
                  step="any"
                  value={qty}
                  onChange={(e) =>
                    setQty(e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                />
              </div>

              {type === "limit" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Limit Price
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={limitPrice}
                    onChange={(e) =>
                      setLimitPrice(e.target.value)
                    }
                    placeholder="150.00"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                  />
                </div>
              ) : (
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={placingOrder}
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                      side === "buy"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {placingOrder
                      ? "Submitting..."
                      : side === "buy"
                        ? "Buy"
                        : "Sell"}
                  </button>
                </div>
              )}

              {type === "limit" && (
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={placingOrder}
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                      side === "buy"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {placingOrder
                      ? "Submitting..."
                      : side === "buy"
                        ? "Buy Limit"
                        : "Sell Limit"}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Positions */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-text">
                Open Positions
              </h2>
            </div>

            {data.positions.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-text-muted">
                No open positions.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-text-muted">
                      <th className="px-5 py-3">
                        Symbol
                      </th>
                      <th className="px-5 py-3">
                        Qty
                      </th>
                      <th className="px-5 py-3">
                        Entry
                      </th>
                      <th className="px-5 py-3">
                        Current
                      </th>
                      <th className="px-5 py-3">
                        P/L
                      </th>
                      <th className="px-5 py-3">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.positions.map(
                      (position) => (
                        <tr
                          key={position.symbol}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-5 py-4 font-semibold text-text">
                            {position.symbol}
                          </td>

                          <td className="px-5 py-4 text-text-muted">
                            {position.qty}
                          </td>

                          <td className="px-5 py-4 text-text-muted">
                            {money(
                              position.avg_entry_price
                            )}
                          </td>

                          <td className="px-5 py-4 text-text-muted">
                            {money(
                              position.current_price
                            )}
                          </td>

                          <td
                            className={`px-5 py-4 font-medium ${
                              Number(
                                position.unrealized_pl
                              ) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {money(
                              position.unrealized_pl
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              disabled={
                                closingSymbol ===
                                position.symbol
                              }
                              onClick={() =>
                                closePosition(
                                  position.symbol
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/5 disabled:opacity-50"
                            >
                              <X size={13} />
                              {closingSymbol ===
                              position.symbol
                                ? "Closing..."
                                : "Close"}
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-text">
                Orders
              </h2>
            </div>

            {data.orders.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-text-muted">
                No orders yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-text-muted">
                      <th className="px-5 py-3">
                        Symbol
                      </th>
                      <th className="px-5 py-3">
                        Side
                      </th>
                      <th className="px-5 py-3">
                        Qty
                      </th>
                      <th className="px-5 py-3">
                        Type
                      </th>
                      <th className="px-5 py-3">
                        Status
                      </th>
                      <th className="px-5 py-3">
                        Time
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-5 py-4 font-semibold text-text">
                          {order.symbol}
                        </td>

                        <td
                          className={`px-5 py-4 font-medium ${
                            order.side === "buy"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {order.side === "buy" ? (
                              <TrendingUp
                                size={14}
                              />
                            ) : (
                              <TrendingDown
                                size={14}
                              />
                            )}

                            {order.side.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-text-muted">
                          {order.qty ?? "-"}
                        </td>

                        <td className="px-5 py-4 text-text-muted">
                          {order.type}
                        </td>

                        <td className="px-5 py-4 text-text-muted">
                          {order.status}
                        </td>

                        <td className="px-5 py-4 text-xs text-text-muted">
                          {order.submitted_at
                            ? new Date(
                                order.submitted_at
                              ).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div className="rounded-lg border border-border bg-surface px-4 py-3 text-xs text-text-muted">
        <strong className="text-text">
          Paper Trading:
        </strong>{" "}
        This page uses the connected Alpaca paper
        trading account. Orders placed here are paper
        orders and do not use real money.
      </div>
    </div>
  );
}
