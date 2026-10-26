
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { tradableSymbols } from "@/components/dashboard/SymbolSearch";

type CryptoCurrency = "USDT" | "BTC" | "ETH";

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  request?: {
    _id?: string;
  };
  payment?: {
    checkoutUrl?: string;
  };
};

export default function OrderPanel({
  symbol,
}: {
  symbol?: string;
}) {
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [selected, setSelected] = useState(
    symbol ?? tradableSymbols[0]?.value ?? "frxEURUSD"
  );
  const [volume, setVolume] = useState("1");
  const [amount, setAmount] = useState("10");
  const [currency, setCurrency] =
    useState<CryptoCurrency>("USDT");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"error" | "success">("error");

  useEffect(() => {
    if (symbol) setSelected(symbol);
  }, [symbol]);

  const label =
    tradableSymbols.find((item) => item.value === selected)
      ?.label ?? selected;

  async function handleOrder() {
    if (loading) return;

    const parsedAmount = Number(amount);
    const parsedVolume = Number(volume);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount < 1 ||
      parsedAmount > 1_000_000 ||
      Math.round(parsedAmount * 100) !== parsedAmount * 100
    ) {
      setMessage("Amount $1 se $1,000,000 ke beech hona chahiye; maximum 2 decimal places.");
      setMessageType("error");
      return;
    }

    if (
      !Number.isFinite(parsedVolume) ||
      parsedVolume <= 0
    ) {
      setMessage("Valid volume enter karo.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Step 1: Create the trade request.
      const requestResponse = await fetch(
        "/api/trading/real/requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            symbol: selected,
            side: side.toUpperCase(),
            orderType: "MARKET",
            quantity: parsedVolume,
            amount: parsedAmount,
            notes: "Created from the Trading page.",
          }),
        }
      );

      const requestData =
        (await requestResponse.json()) as ApiResponse;

      if (!requestResponse.ok || !requestData.request?._id) {
        throw new Error(
          requestData.message ||
            requestData.error ||
            "Trade request create nahi ho saki. Apna trading account complete/active check karo."
        );
      }

      const tradeRequestId = requestData.request._id;

      // Step 2: Create the OpexGT payment for this request.
      const paymentResponse = await fetch(
        "/api/payments/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            purpose: "REAL_TRADE",
            tradeRequestId,
            amount: parsedAmount,
            currency,
          }),
        }
      );

      const paymentData =
        (await paymentResponse.json()) as ApiResponse;

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData.message ||
            paymentData.error ||
            `Payment create nahi hui (HTTP ${paymentResponse.status}). Trade request ID: ${tradeRequestId}. Dobara click karne se pehle request history check karo.`
        );
      }

      const checkoutUrl = paymentData.payment?.checkoutUrl;

      let validCheckoutUrl = false;

      try {
        const parsedUrl = new URL(checkoutUrl ?? "");
        validCheckoutUrl =
          parsedUrl.protocol === "https:" &&
          parsedUrl.hostname === "opexgt.com" &&
          !parsedUrl.username &&
          !parsedUrl.password;
      } catch {
        validCheckoutUrl = false;
      }

      if (!validCheckoutUrl || !checkoutUrl) {
        throw new Error(
          `Payment checkout URL valid nahi hai. Trade request ID: ${tradeRequestId}. Payment status verify kiye bina dobara order mat submit karo.`
        );
      }

      // Open only the verified OpexGT HTTPS checkout.
      window.location.assign(checkoutUrl);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Order/payment request complete nahi ho saki."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1 text-sm font-semibold text-text">
        Buy / Sell
      </div>

      <p className="mb-4 text-xs text-text-muted">
        Trade request ke liye amount select karo aur checkout par
        payment complete karo.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <button
          type="button"
          disabled={loading}
          onClick={() => setSide("Buy")}
          className={`py-2.5 text-sm font-semibold transition ${
            side === "Buy"
              ? "bg-emerald-600 text-white"
              : "bg-surface text-text-muted"
          }`}
        >
          Buy
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => setSide("Sell")}
          className={`py-2.5 text-sm font-semibold transition ${
            side === "Sell"
              ? "bg-red-600 text-white"
              : "bg-surface text-text-muted"
          }`}
        >
          Sell
        </button>
      </div>

      <label className="mb-1 block text-xs text-text-muted">
        Symbol
      </label>

      <select
        value={selected}
        disabled={loading}
        onChange={(event) => setSelected(event.target.value)}
        className="mb-4 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
      >
        {tradableSymbols.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-xs text-text-muted">
        Volume (lots)
      </label>

      <input
        type="number"
        value={volume}
        onChange={(event) => setVolume(event.target.value)}
        step="0.01"
        min="0.01"
        disabled={loading}
        className="mb-4 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
      />

      <label className="mb-1 block text-xs text-text-muted">
        Payment amount (USD)
      </label>

      <input
        type="number"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        min="1"
        max="1000000"
        step="0.01"
        required
        disabled={loading}
        placeholder="Enter amount, e.g. 10"
        className="mb-4 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
      />

      <div className="mb-5 flex gap-2">
        {[10, 50, 100].map((preset) => (
          <button
            type="button"
            key={preset}
            disabled={loading}
            onClick={() => setAmount(String(preset))}
            className="flex-1 rounded-lg border border-border px-2 py-2 text-xs font-medium text-text transition hover:border-accent-2"
          >
            ${preset}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-xs text-text-muted">
        Payment currency
      </label>

      <select
        value={currency}
        disabled={loading}
        onChange={(event) =>
          setCurrency(event.target.value as CryptoCurrency)
        }
        className="mb-5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
      >
        <option value="USDT">USDT</option>
        <option value="BTC">BTC</option>
        <option value="ETH">ETH</option>
      </select>

      <button
        type="button"
        disabled={loading}
        onClick={handleOrder}
        className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
          side === "Buy"
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading
          ? "Preparing checkout..."
          : `${side} ${label} · Pay $${amount || "0"}`}
      </button>

      {message && (
        <div
          role="alert"
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            messageType === "error"
              ? "border border-red-500/20 bg-red-500/10 text-red-500"
              : "bg-surface-2 text-text-muted"
          }`}
        >
          {message}
        </div>
      )}

      <p className="mt-3 text-xs leading-5 text-text-muted">
        Payment confirmation is handled by the provider webhook.
        Payment alone does not execute a live broker order.
      </p>
    </div>
  );
}