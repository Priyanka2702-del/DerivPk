
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
  notional?: string;
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

type OrderMode = "amount" | "quantity";

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

async function readResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function DemoTradingPage() {
  const [data, setData] = useState<DemoResponse | null>(null);

  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"market" | "limit">("market");

  const [orderMode, setOrderMode] = useState<OrderMode>("amount");
  const [orderAmount, setOrderAmount] = useState("10");
  const [qty, setQty] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");

  const [fundAmount, setFundAmount] = useState("100");
  const [funding, setFunding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [closingSymbol, setClosingSymbol] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/trading/demo", {
        cache: "no-store",
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            `Failed to load demo account (${response.status})`
        );
      }

      if (!result?.account) {
        throw new Error("Demo account information was not returned.");
      }

      setData(result);
    } catch (err) {
      console.error("DEMO PAGE LOAD ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load demo account."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function addDemoFunds(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const amount = Number(fundAmount);

    if (!Number.isFinite(amount) || amount < 0.01 || amount > 1000) {
      setError("Enter an amount between $0.01 and $1,000.");
      return;
    }

    try {
      setFunding(true);

      const response = await fetch("/api/trading/demo/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const result = await readResponse(response);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to add demo funds.");
      }

      if (result.fundingComplete) {
        setSuccess(
          `${money(amount)} demo funds were added to your account.`
        );
      } else {
        setSuccess(
          result.message ||
            "Funding submitted. Refresh shortly to check the account balance."
        );
      }

      await loadData();
    } catch (err) {
      console.error("DEMO FUNDING ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Unable to add demo funds."
      );
    } finally {
      setFunding(false);
    }
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!data?.account) {
      setError("Demo account information is not available.");
      return;
    }

    const cleanSymbol = symbol.trim().toUpperCase();

    if (!/^[A-Z][A-Z0-9.-]{0,19}$/.test(cleanSymbol)) {
      setError("Enter a valid stock symbol.");
      return;
    }

    const useAmount = type === "market" && orderMode === "amount";
    const quantity = Number(qty);
    const amount = Number(orderAmount);
    const limit = Number(limitPrice);

    if (useAmount) {
      if (!Number.isFinite(amount) || amount < 1) {
        setError("Enter an order amount of at least $1.00.");
        return;
      }

      if (side === "buy" && amount > Number(data.account.buyingPower)) {
        setError("Order amount exceeds your available buying power.");
        return;
      }
    } else {
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError("Enter a valid share quantity.");
        return;
      }

      if (type === "limit" && (!Number.isFinite(limit) || limit <= 0)) {
        setError("Enter a valid limit price.");
        return;
      }
    }

    try {
      setPlacingOrder(true);

      const payload: Record<string, string> = {
        symbol: cleanSymbol,
        side,
        type,
        timeInForce: "day",
      };

      if (useAmount) {
        payload.notional = amount.toFixed(2);
      } else {
        payload.qty = String(quantity);
      }

      if (type === "limit") {
        payload.limitPrice = limit.toFixed(2);
      }

      const response = await fetch("/api/trading/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await readResponse(response);

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Unable to submit paper order.");
      }

      setSuccess(
        `${side.toUpperCase()} order submitted for ${cleanSymbol}.`
      );

      await loadData();
    } catch (err) {
      console.error("ORDER ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Unable to submit paper order."
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
        `/api/trading/demo/positions/${encodeURIComponent(positionSymbol)}`,
        { method: "DELETE" }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result?.message || "Unable to close position.");
      }

      setSuccess(`${positionSymbol} position close request submitted.`);
      await loadData();
    } catch (err) {
      console.error("CLOSE POSITION ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Unable to close position."
      );
    } finally {
      setClosingSymbol(null);
    }
  }

  if (loading && !data) {
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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Alpaca Paper Account
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-text">
            Demo Trading
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Practice trading with sandbox funds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-600"
        >
          {success}
        </div>
      )}

      {data && (
        <>
          {/* Each signed-in user sees the account returned by their API session. */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs text-text-muted">Cash Balance</p>
              <p className="mt-2 text-xl font-semibold text-text">
                {money(data.account.cash)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs text-text-muted">Total Equity</p>
              <p className="mt-2 text-xl font-semibold text-text">
                {money(data.account.equity)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs text-text-muted">Buying Power</p>
              <p className="mt-2 text-xl font-semibold text-text">
                {money(data.account.buyingPower)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs text-text-muted">Account Number</p>
              <p className="mt-2 text-sm font-semibold text-text">
                {data.account.accountNumber}
              </p>
              <p className="mt-1 text-xs text-green-600">
                {data.account.status}
              </p>
            </div>
          </div>

          {/* Funding form */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-semibold text-text">Add Demo Funds</h2>
            <p className="mt-1 text-sm text-text-muted">
              Add sandbox funds to this demo account. These are not real-money
              deposits.
            </p>

            <form
              onSubmit={addDemoFunds}
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label
                  htmlFor="fund-amount"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Amount (USD)
                </label>
                <input
                  id="fund-amount"
                  type="number"
                  min="0.01"
                  max="1000"
                  step="0.01"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                />
              </div>

              <button
                type="submit"
                disabled={funding}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {funding ? "Adding Funds..." : "Add Demo Funds"}
              </button>
            </form>

            <p className="mt-2 text-xs text-text-muted">
              Maximum $1,000 per request. Funding is subject to sandbox
              processing and confirmation.
            </p>
          </div>

          {/* Order form */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-text">Place Paper Order</h2>
              <p className="mt-1 text-xs text-text-muted">
                Choose the dollar amount or number of shares for your order.
              </p>
            </div>

            <form
              onSubmit={placeOrder}
              className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div>
                <label
                  htmlFor="order-symbol"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Symbol
                </label>
                <input
                  id="order-symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                />
              </div>

              <div>
                <label
                  htmlFor="order-side"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Side
                </label>
                <select
                  id="order-side"
                  value={side}
                  onChange={(e) => setSide(e.target.value as "buy" | "sell")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="order-type"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Order Type
                </label>
                <select
                  id="order-type"
                  value={type}
                  onChange={(e) => {
                    const nextType = e.target.value as "market" | "limit";
                    setType(nextType);
                    if (nextType === "limit") setOrderMode("quantity");
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none"
                >
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                </select>
              </div>

              {type === "market" && (
                <div>
                  <label
                    htmlFor="order-mode"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Order Size
                  </label>
                  <select
                    id="order-mode"
                    value={orderMode}
                    onChange={(e) =>
                      setOrderMode(e.target.value as OrderMode)
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none"
                  >
                    <option value="amount">Amount (USD)</option>
                    <option value="quantity">Share Quantity</option>
                  </select>
                </div>
              )}

              {type === "market" && orderMode === "amount" ? (
                <div>
                  <label
                    htmlFor="order-amount"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Amount (USD)
                  </label>
                  <input
                    id="order-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                  />
                  <p className="mt-1 text-xs text-text-muted">
                    Buying power: {money(data.account.buyingPower)}
                  </p>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="order-qty"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Quantity (shares)
                  </label>
                  <input
                    id="order-qty"
                    type="number"
                    min="0.000001"
                    step="any"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                  />
                </div>
              )}

              {type === "limit" && (
                <div>
                  <label
                    htmlFor="limit-price"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Limit Price (USD)
                  </label>
                  <input
                    id="limit-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
                  />
                </div>
              )}

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={placingOrder}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    side === "buy"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {placingOrder
                    ? "Submitting..."
                    : `${side === "buy" ? "Buy" : "Sell"} ${
                        type === "limit" ? "Limit" : ""
                      }`.trim()}
                </button>
              </div>
            </form>
          </div>

          {/* Positions */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-text">Open Positions</h2>
            </div>

            {data.positions?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-text-muted">
                      <th className="px-5 py-3">Symbol</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3">Entry</th>
                      <th className="px-5 py-3">Current</th>
                      <th className="px-5 py-3">Market Value</th>
                      <th className="px-5 py-3">P/L</th>
                      <th className="px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.positions.map((position) => (
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
                          {money(position.avg_entry_price)}
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {money(position.current_price)}
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {money(position.market_value)}
                        </td>
                        <td
                          className={`px-5 py-4 font-medium ${
                            Number(position.unrealized_pl) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {money(position.unrealized_pl)}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={closingSymbol === position.symbol}
                            onClick={() => void closePosition(position.symbol)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/5 disabled:opacity-50"
                          >
                            <X size={13} />
                            {closingSymbol === position.symbol
                              ? "Closing..."
                              : "Close"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-text-muted">
                No open positions.
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-text">Orders</h2>
            </div>

            {data.orders?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-text-muted">
                      <th className="px-5 py-3">Symbol</th>
                      <th className="px-5 py-3">Side</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Time</th>
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
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                            {order.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {order.filled_qty || order.qty || "-"}
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {order.type}
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {order.status}
                        </td>
                        <td className="px-5 py-4 text-xs text-text-muted">
                          {order.submitted_at
                            ? new Date(order.submitted_at).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-text-muted">
                No orders yet.
              </div>
            )}
          </div>
        </>
      )}

      <div className="rounded-lg border border-border bg-surface px-4 py-3 text-xs text-text-muted">
        <strong className="text-text">Paper Trading:</strong>{" "}
        This page uses the signed-in user's connected Alpaca sandbox paper
        account. Orders use sandbox funds and do not use real money.
      </div>
    </div>
  );
}
