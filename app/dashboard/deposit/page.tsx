
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";
import { userAccounts } from "@/data/dashboard";

const presetAmounts = [50, 100, 250, 500, 1000];

const methods = [
  {
    key: "Crypto",
    icon: Zap,
    time: "10–30 minutes",
    note: "Use the exact network and amount shown by OpexGT.",
  },
];

type CryptoCurrency = "USDT" | "BTC" | "ETH";

type Payment = {
  _id: string;
  purpose: string;
  amountCents: number;
  currency: string;
  status: string;
  provider?: string;
  providerOrderId?: string;
  cryptoCurrency?: CryptoCurrency;
  cryptoAmount?: string;
  txHash?: string;
  createdAt?: string;
};

type WalletHistory = {
  wallet: {
    currency: string;
    balanceCents: number;
    balanceUsd: number;
    totalDepositedCents: number;
    totalDepositedUsd: number;
    completedDepositCount: number;
  };
  payments: Payment[];
};

type CreatedPayment = {
  id: string;
  orderId: string;
  providerPaymentId?: string;
  purpose: string;
  amountUsd: number;
  currency: string;
  cryptoCurrency?: CryptoCurrency;
  cryptoAmount?: string;
  depositAddress?: string;
  checkoutUrl?: string;
  expiresAt?: string;
  status: string;
  provider: string;
  createdAt?: string;
};

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date?: string) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleString();
}

export default function FastDepositPage() {
  const [account, setAccount] = useState(userAccounts[0]?.id ?? "");
  const [method, setMethod] = useState(methods[0].key);
  const [amount, setAmount] = useState<number | "">(100);
  const [cryptoCurrency, setCryptoCurrency] =
    useState<CryptoCurrency>("USDT");

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [createdPayment, setCreatedPayment] =
    useState<CreatedPayment | null>(null);
  const [history, setHistory] = useState<WalletHistory | null>(null);
  const [copyMessage, setCopyMessage] = useState("");

  const activeMethod = methods.find((m) => m.key === method)!;

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch("/api/payments/history", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to load payment history."
        );
      }

      setHistory(data as WalletHistory);
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : "Unable to load payment history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);


  const refreshPaymentStatus = async () => {
    if (!createdPayment?.id || createdPayment.provider !== "OPEXGT") {
      await loadHistory();
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch("/api/payments/status", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: createdPayment.id,
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to refresh payment status."
        );
      }

      await loadHistory();

      if (data.payment?.status) {
        setCreatedPayment((current) =>
          current
            ? { ...current, status: data.payment.status }
            : current
        );
      }
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : "Unable to refresh payment status."
      );
    } finally {
      setHistoryLoading(false);
    }
  };


  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const recentDeposits = (history?.payments ?? [])
    .filter((payment) => payment.purpose === "DEPOSIT")
    .slice(0, 3);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCopyMessage("");
    setCreatedPayment(null);

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount < 1 ||
      amount > 1_000_000
    ) {
      setError("Enter an amount between $1 and $1,000,000.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: cryptoCurrency,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.payment) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to create the deposit request."
        );
      }

      setCreatedPayment(data.payment as CreatedPayment);
      await loadHistory();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyAddress(address: string) {
    setCopyMessage("");

    try {
      await navigator.clipboard.writeText(address);
      setCopyMessage("Deposit address copied.");
    } catch {
      setCopyMessage(
        "Could not copy automatically. Select and copy the address manually."
      );
    }
  }

  function startAnotherDeposit() {
    setCreatedPayment(null);
    setError("");
    setCopyMessage("");
    setAmount(100);
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">
          Deposit
        </h1>
        <p className="text-sm text-text-muted">
          Create a crypto deposit and track its payment status.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-surface p-6">
          {createdPayment ? (
            <div className="flex flex-col items-center py-8 text-center">
              {createdPayment.status === "COMPLETED" ? (
                <CheckCircle2
                  className="mb-4 text-emerald-500"
                  size={44}
                />
              ) : (
                <Clock
                  className="mb-4 text-amber-500"
                  size={44}
                />
              )}

              <h2 className="font-display text-lg font-semibold text-text">
                {createdPayment.status === "COMPLETED"
                  ? "Deposit completed"
                  : "Deposit payment created"}
              </h2>

              <p className="mt-2 text-sm text-text-muted">
                Deposit value: {formatUsd(createdPayment.amountUsd)}
              </p>

              <p className="mt-1 text-sm text-text-muted">
                Status:{" "}
                <span className="font-semibold text-text">
                  {createdPayment.status}
                </span>
              </p>

              <p className="mt-3 max-w-md text-xs text-text-muted">
                {createdPayment.status === "PENDING"
                  ? "Your payment is awaiting confirmation. Your wallet will only be credited after the server verifies successful payment."
                  : createdPayment.status === "COMPLETED"
                    ? "The server reports this payment as completed. Refresh your wallet to view the latest balance."
                    : "Follow the payment status shown here and in your payment history."}
              </p>

              <div className="mt-4 w-full rounded-lg bg-surface-2 p-3 text-left">
                <p className="text-xs text-text-muted">Order ID</p>
                <p className="mt-1 break-all text-sm text-text">
                  {createdPayment.orderId}
                </p>
              </div>

              {createdPayment.cryptoAmount && (
                <div className="mt-3 w-full rounded-lg bg-surface-2 p-3 text-left">
                  <p className="text-xs text-text-muted">
                    Exact crypto amount to pay
                  </p>
                  <p className="mt-1 break-all text-lg font-semibold text-text">
                    {createdPayment.cryptoAmount}{" "}
                    {createdPayment.cryptoCurrency ?? cryptoCurrency}
                  </p>
                  <p className="mt-2 text-xs text-text-muted">
                    Send the exact amount and use the network displayed
                    by the OpexGT checkout/payment instructions.
                  </p>
                </div>
              )}

              {createdPayment.depositAddress && (
                <div className="mt-3 w-full rounded-lg bg-surface-2 p-3 text-left">
                  <p className="text-xs text-text-muted">
                    Deposit address
                  </p>
                  <p className="mt-1 break-all text-sm text-text">
                    {createdPayment.depositAddress}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void copyAddress(createdPayment.depositAddress!)
                    }
                    className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-accent-2 hover:underline"
                  >
                    <Copy size={14} />
                    Copy address
                  </button>
                </div>
              )}

              {createdPayment.expiresAt && (
                <p className="mt-3 text-xs text-text-muted">
                  Payment expires: {formatDate(createdPayment.expiresAt)}
                </p>
              )}

              {copyMessage && (
                <p role="status" className="mt-2 text-xs text-text-muted">
                  {copyMessage}
                </p>
              )}

              {createdPayment.checkoutUrl && (
                <a
                  href={createdPayment.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-2 px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <ExternalLink size={16} />
                  Open secure OpexGT checkout
                </a>
              )}

              {!createdPayment.checkoutUrl &&
                !createdPayment.depositAddress &&
                createdPayment.status === "PENDING" && (
                  <div className="mt-4 w-full rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-left text-xs text-text-muted">
                    No checkout URL or deposit address was returned.
                    Do not send funds manually. Check the OpexGT
                    dashboard and payment configuration first.
                  </div>
                )}

              <button
                type="button"
                onClick={startAnotherDeposit}
                className="mt-6 rounded-lg bg-accent-2/10 px-6 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20"
              >
                Make another deposit
              </button>

              <button
                type="button"
                onClick={() => void refreshPaymentStatus()}
                disabled={historyLoading}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent-2 hover:underline disabled:opacity-50"
              >
                {historyLoading && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Refresh payment status and wallet
              </button>

              <Link
                href="/dashboard/funds?tab=history"
                className="mt-4 text-sm font-semibold text-accent-2 hover:underline"
              >
                View payment history →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="deposit-account"
                className="mb-1 block text-xs font-medium text-text-muted"
              >
                Account
              </label>

              <select
                id="deposit-account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="mb-5 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text"
              >
                {userAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.type} — #{a.accountNumber}
                  </option>
                ))}
              </select>

              <p className="mb-5 -mt-3 text-xs text-text-muted">
                Deposits are added to your internal wallet after verified
                payment. This does not directly fund the selected trading
                account.
              </p>

              <label className="mb-2 block text-xs font-medium text-text-muted">
                Payment method
              </label>

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
                    <span className="text-xs font-semibold">
                      {m.key}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mb-5 flex items-center gap-1.5 text-xs text-text-muted">
                <Clock size={13} />
                {activeMethod.note} · Typically {activeMethod.time}
              </p>

              <label
                htmlFor="crypto-currency"
                className="mb-2 block text-xs font-medium text-text-muted"
              >
                Cryptocurrency
              </label>

              <select
                id="crypto-currency"
                value={cryptoCurrency}
                onChange={(e) =>
                  setCryptoCurrency(e.target.value as CryptoCurrency)
                }
                className="mb-5 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text"
              >
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>

              <div className="mb-5 rounded-lg border border-border p-3 text-xs text-text-muted">
                Confirm the blockchain network on the checkout page before
                sending crypto. Never send funds on a different network.
              </div>

              <label className="mb-2 block text-xs font-medium text-text-muted">
                Quick amount (USD)
              </label>

              <div className="mb-4 flex flex-wrap gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      amount === preset
                        ? "bg-accent-2 text-white"
                        : "bg-surface-2 text-text hover:bg-border/60"
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <label
                htmlFor="deposit-amount"
                className="mb-1 block text-xs font-medium text-text-muted"
              >
                Or enter custom amount (USD)
              </label>

              <input
                id="deposit-amount"
                type="number"
                min={1}
                max={1_000_000}
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="0.00"
                required
                className="mb-3 w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text"
              />

              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500"
                >
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-2/10 py-3.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}

                {loading
                  ? "Creating payment…"
                  : `Continue to payment ${
                      amount !== "" && amount > 0
                        ? formatUsd(amount)
                        : ""
                    }`}
              </button>

              <p className="mt-3 text-xs text-text-muted">
                The payment remains pending until the server verifies
                completion. Mock mode only creates a test record and does
                not initiate a real crypto payment.
              </p>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs text-text-muted">
              Internal wallet balance
            </p>

            <p className="num mt-1 font-display text-2xl font-bold text-text">
              {historyLoading && !history
                ? "Loading…"
                : formatUsd(history?.wallet.balanceUsd ?? 0)}
            </p>

            <p className="mt-2 text-xs text-text-muted">
              Total completed deposits:{" "}
              {formatUsd(history?.wallet.totalDepositedUsd ?? 0)}
            </p>

            {historyError && (
              <p className="mt-2 text-xs text-red-500">
                {historyError}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-text">
                Recent deposits
              </p>

              <button
                type="button"
                onClick={() => void loadHistory()}
                disabled={historyLoading}
                aria-label="Refresh deposit history"
                className="rounded-md p-1 text-text-muted hover:text-text disabled:opacity-50"
              >
                {historyLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
              </button>
            </div>

            {historyError ? (
              <div>
                <p className="text-xs text-red-500">{historyError}</p>
                <button
                  type="button"
                  onClick={() => void loadHistory()}
                  className="mt-2 text-xs font-semibold text-accent-2 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : historyLoading && !history ? (
              <p className="text-xs text-text-muted">
                Loading deposits…
              </p>
            ) : recentDeposits.length === 0 ? (
              <p className="text-xs text-text-muted">
                No deposits yet.
              </p>
            ) : (
              <div className="space-y-4">
                {recentDeposits.map((payment) => (
                  <div
                    key={payment._id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="text-text">
                        {payment.cryptoCurrency
                          ? `${payment.cryptoCurrency} deposit`
                          : "Crypto deposit"}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {formatDate(payment.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Status: {payment.status}
                      </p>
                      {payment.cryptoAmount && (
                        <p className="mt-1 break-all text-xs text-text-muted">
                          Crypto amount: {payment.cryptoAmount}
                        </p>
                      )}
                    </div>

                    <span className="num shrink-0 font-semibold text-text">
                      {formatUsd(payment.amountCents / 100)}
                    </span>
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
