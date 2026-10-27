
// app/api/payments/create/route.ts

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import Payment, { type CryptoCurrency } from "@/models/Payment";

export const runtime = "nodejs";

const OPEXGT_PAYMENT_URL = "https://opexgt.com/api/v1/payment";

const ALLOWED_CURRENCIES: CryptoCurrency[] = [
  "USDT",
  "BTC",
  "ETH",
];

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export async function POST(request: Request) {
  try {
    const mode = process.env.OPEXGT_MODE;

    if (mode !== "mock" && mode !== "live") {
      return jsonError(
        "Payment mode is not configured. Set OPEXGT_MODE to mock or live.",
        503
      );
    }

    const user = await requireAuth();

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    if (!mongoose.isValidObjectId(user.id)) {
      return jsonError("Invalid user session.", 401);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body.", 400);
    }

    if (!isObject(body)) {
      return jsonError("Invalid request body.", 400);
    }

    const amount = body.amount;
    const requestedCurrency = body.currency ?? "USDT";

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount < 1 ||
      amount > 1_000_000 ||
      !Number.isSafeInteger(Math.round(amount * 100))
    ) {
      return jsonError(
        "Amount must be between $1 and $1,000,000.",
        400
      );
    }

    if (
      typeof requestedCurrency !== "string" ||
      !ALLOWED_CURRENCIES.includes(
        requestedCurrency as CryptoCurrency
      )
    ) {
      return jsonError(
        "Currency must be USDT, BTC, or ETH.",
        400
      );
    }

    const cryptoCurrency =
      requestedCurrency as CryptoCurrency;

    const amountCents = Math.round(amount * 100);

    await connectDB();

    const userId = new mongoose.Types.ObjectId(user.id);

    // MOCK MODE: creates a database record only.
    // No request is sent to OpexGT and no real payment occurs.
    if (mode === "mock") {
      const orderId = `mock_${randomUUID()}`;

      const payment = await Payment.create({
        userId,
        purpose: "DEPOSIT",
        amountCents,
        currency: "USD",
        status: "PENDING",
        provider: "OPEXGT_MOCK",
        providerOrderId: orderId,
      });

      return NextResponse.json(
        {
          success: true,
          mode: "mock",
          message:
            "Mock payment record created. No crypto payment was initiated.",
          payment: {
            id: payment._id.toString(),
            orderId,
            purpose: payment.purpose,
            amountUsd: amountCents / 100,
            currency: "USD",
            status: payment.status,
            provider: payment.provider,
            createdAt: payment.createdAt,
          },
        },
        { status: 201 }
      );
    }

    // LIVE MODE: use the existing environment variable name.
    // OPEXGT_API_KEY is supported as an alternative.
    const apiKey =
      process.env.OPEXGT_API_KEY ??
      process.env.OpexGT_Lve_key;

    if (!apiKey?.trim()) {
      return jsonError(
        "OpexGT live mode is enabled, but the API key is missing.",
        503
      );
    }

    const webhookUrl = process.env.OPEXGT_WEBHOOK_URL;

    if (!webhookUrl) {
      return jsonError(
        "OPEXGT_WEBHOOK_URL is missing. Configure and test the webhook before enabling live payments.",
        503
      );
    }

    // Validate the webhook URL before sending it to the provider.
    try {
      const parsedWebhook = new URL(webhookUrl);

      if (
        parsedWebhook.protocol !== "https:" ||
        parsedWebhook.pathname !==
          "/api/payments/webhook" ||
        parsedWebhook.search ||
        parsedWebhook.hash
      ) {
        return jsonError(
          "OPEXGT_WEBHOOK_URL must be an HTTPS URL pointing to /api/payments/webhook.",
          503
        );
      }
    } catch {
      return jsonError(
        "OPEXGT_WEBHOOK_URL is invalid.",
        503
      );
    }

    const orderId = `dp_${randomUUID()}`;

    // Create the local pending record before contacting OpexGT.
    const payment = await Payment.create({
      userId,
      purpose: "DEPOSIT",
      amountCents,
      currency: "USD",
      status: "PENDING",
      provider: "OPEXGT",
      providerOrderId: orderId,
      cryptoCurrency,
    });

    let providerResponse: Response;

    try {
      providerResponse = await fetch(OPEXGT_PAYMENT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount: amountCents / 100,
          currency: cryptoCurrency,
          order_id: orderId,
          webhook_url: webhookUrl,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      // A timeout does not prove that the provider failed.
      // Keep the payment pending until it can be reconciled.
      console.error("OPEXGT_CREATE_NETWORK_ERROR", {
        paymentId: payment._id.toString(),
        errorName:
          error instanceof Error
            ? error.name
            : "UnknownError",
      });

      return NextResponse.json(
        {
          success: false,
          mode: "live",
          message:
            "Provider response could not be confirmed. Check the OpexGT dashboard before retrying.",
          paymentId: payment._id.toString(),
          orderId,
          status: "PENDING",
        },
        { status: 502 }
      );
    }

    let rawResponse: unknown;

    try {
      rawResponse = await providerResponse.json();
    } catch {
      rawResponse = null;
    }

    if (
      !providerResponse.ok ||
      !isObject(rawResponse)
    ) {
      console.error("OPEXGT_CREATE_REJECTED", {
        paymentId: payment._id.toString(),
        httpStatus: providerResponse.status,
      });

      return NextResponse.json(
        {
          success: false,
          mode: "live",
          message:
            "OpexGT did not return a valid response. Check the provider dashboard before retrying.",
          paymentId: payment._id.toString(),
          orderId,
          status: "PENDING",
        },
        { status: 502 }
      );
    }

    // According to the supplied OpexGT documentation,
    // a successful creation response must contain success: true.
    if (rawResponse.success !== true) {
      console.error(
        "OPEXGT_PAYMENT_CREATE_NOT_CONFIRMED",
        {
          paymentId: payment._id.toString(),
          httpStatus: providerResponse.status,
        }
      );

      return NextResponse.json(
        {
          success: false,
          mode: "live",
          message:
            "OpexGT did not confirm payment creation. Check the provider dashboard before retrying.",
          paymentId: payment._id.toString(),
          orderId,
          status: "PENDING",
        },
        { status: 502 }
      );
    }

    const data = isObject(rawResponse.data)
      ? rawResponse.data
      : rawResponse;

    const providerPaymentId =
      typeof data.payment_id === "string"
        ? data.payment_id
        : typeof data.id === "string"
          ? data.id
          : null;

    const responseOrderId =
      typeof data.order_id === "string"
        ? data.order_id
        : null;

    const checkoutUrl =
      typeof data.checkout_url === "string"
        ? data.checkout_url
        : null;

    const depositAddress =
      typeof data.address === "string"
        ? data.address
        : undefined;

    const responseCurrency =
      typeof data.currency === "string"
        ? data.currency.toUpperCase()
        : null;

    const cryptoAmount =
      typeof data.amount_crypto === "string" ||
      typeof data.amount_crypto === "number"
        ? String(data.amount_crypto)
        : undefined;

    const expiresAt =
      typeof data.expires_at === "string" &&
      Number.isFinite(Date.parse(data.expires_at))
        ? new Date(data.expires_at)
        : undefined;

    let validCheckoutUrl = false;

    if (checkoutUrl) {
      try {
        const parsed = new URL(checkoutUrl);

        validCheckoutUrl =
          parsed.protocol === "https:" &&
          parsed.hostname === "opexgt.com" &&
          !parsed.username &&
          !parsed.password;
      } catch {
        validCheckoutUrl = false;
      }
    }

    // Reject unexpected or incomplete provider responses.
    if (
      !providerPaymentId?.trim() ||
      responseOrderId !== orderId ||
      !validCheckoutUrl ||
      responseCurrency !== cryptoCurrency
    ) {
      console.error(
        "OPEXGT_CREATE_INVALID_RESPONSE",
        {
          paymentId: payment._id.toString(),
          hasProviderPaymentId:
            Boolean(providerPaymentId),
          orderMatched: responseOrderId === orderId,
          validCheckoutUrl,
          currencyMatched:
            responseCurrency === cryptoCurrency,
        }
      );

      // Do not mark failed or completed automatically.
      // Reconcile this payment using the provider dashboard.
      return NextResponse.json(
        {
          success: false,
          mode: "live",
          message:
            "OpexGT returned an unexpected response. The payment remains pending and needs reconciliation.",
          paymentId: payment._id.toString(),
          orderId,
          status: "PENDING",
        },
        { status: 502 }
      );
    }

    payment.providerPaymentId = providerPaymentId;
payment.checkoutUrl = checkoutUrl ?? undefined;    payment.depositAddress = depositAddress;
    payment.cryptoCurrency = cryptoCurrency;
    payment.cryptoAmount = cryptoAmount;
    payment.expiresAt = expiresAt;

    await payment.save();

    return NextResponse.json(
      {
        success: true,
        mode: "live",
        message:
          "Payment session created. Complete checkout to pay.",
        payment: {
          id: payment._id.toString(),
          orderId,
          providerPaymentId,
          purpose: payment.purpose,
          amountUsd: amountCents / 100,
          currency: "USD",
          cryptoCurrency: payment.cryptoCurrency,
          cryptoAmount: payment.cryptoAmount,
          depositAddress: payment.depositAddress,
          checkoutUrl: payment.checkoutUrl,
          expiresAt: payment.expiresAt,
          status: payment.status,
          createdAt: payment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("PAYMENT_CREATE_FAILED", {
      errorName:
        error instanceof Error
          ? error.name
          : "UnknownError",
      message:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });

    return jsonError(
      "Unable to create payment.",
      500
    );
  }
}