
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import Payment, {
  type CryptoCurrency,
} from "@/models/Payment";
import RealTradeRequest from "@/models/RealTradeRequest";

export const runtime = "nodejs";

const OPEXGT_PAYMENT_URL =
  "https://opexgt.com/api/v1/payment";

const ALLOWED_CURRENCIES: CryptoCurrency[] = [
  "USDT",
  "BTC",
  "ETH",
];

type PaymentPurpose = "DEPOSIT" | "REAL_TRADE";

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

function isValidCheckoutUrl(
  value: unknown
): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "opexgt.com" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function getProviderApiKey() {
  return (
    process.env.OPEXGT_API_KEY ??
    process.env.OpexGT_Lve_key
  );
}

export async function POST(request: Request) {
  try {
    // 1. Validate payment mode.
    const mode = process.env.OPEXGT_MODE;

    if (mode !== "mock" && mode !== "live") {
      return jsonError(
        "Payment mode is not configured. Set OPEXGT_MODE to mock or live.",
        503
      );
    }

    // 2. Authenticate the current user using the existing
    // session helper used by this project.
    const user = await requireAuth();

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    if (!mongoose.isValidObjectId(user.id)) {
      return jsonError("Invalid user session.", 401);
    }

    // 3. Parse and validate request body.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body.", 400);
    }

    if (!isObject(body)) {
      return jsonError("Invalid request body.", 400);
    }

    const purposeValue = body.purpose ?? "DEPOSIT";

    if (
      purposeValue !== "DEPOSIT" &&
      purposeValue !== "REAL_TRADE"
    ) {
      return jsonError(
        "Purpose must be DEPOSIT or REAL_TRADE.",
        400
      );
    }

    const purpose: PaymentPurpose = purposeValue;

    const amount = body.amount;
    const requestedCurrency = body.currency ?? "USDT";

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount < 1 ||
      amount > 1_000_000 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) >
        0.000001
    ) {
      return jsonError(
        "Amount must be between $1 and $1,000,000, with up to two decimal places.",
        400
      );
    }

    if (
      typeof requestedCurrency !== "string" ||
      !ALLOWED_CURRENCIES.includes(
        requestedCurrency.toUpperCase() as CryptoCurrency
      )
    ) {
      return jsonError(
        "Currency must be USDT, BTC, or ETH.",
        400
      );
    }

    const cryptoCurrency =
      requestedCurrency.toUpperCase() as CryptoCurrency;

    const amountCents = Math.round(amount * 100);

    await connectDB();

    const userId = new mongoose.Types.ObjectId(user.id);

    // 4. Real-trade payments must never use mock mode.
    if (purpose === "REAL_TRADE" && mode !== "live") {
      return jsonError(
        "Real-trade payments require live OpexGT mode.",
        503
      );
    }

    let tradeRequest:
      | InstanceType<typeof RealTradeRequest>
      | null = null;

    let tradeRequestId: string | undefined;

    // 5. Validate ownership, amount, and status of the
    // saved trade request before creating a payment.
    if (purpose === "REAL_TRADE") {
      if (typeof body.tradeRequestId !== "string") {
        return jsonError(
          "A valid tradeRequestId is required.",
          400
        );
      }

      tradeRequestId = body.tradeRequestId;

      if (!mongoose.isValidObjectId(tradeRequestId)) {
        return jsonError(
          "Invalid tradeRequestId.",
          400
        );
      }

      tradeRequest = await RealTradeRequest.findOne({
        _id: new mongoose.Types.ObjectId(tradeRequestId),
        userId,
      });

      if (!tradeRequest) {
        return jsonError(
          "Trade request not found for this user.",
          404
        );
      }

      const savedAmountCents = Math.round(
        Number(tradeRequest.amount) * 100
      );

      if (savedAmountCents !== amountCents) {
        return jsonError(
          "Payment amount does not match the saved trade request.",
          400
        );
      }

      if (
        tradeRequest.status !== "PENDING_REVIEW" ||
        tradeRequest.paymentStatus === "PAID"
      ) {
        return jsonError(
          "This trade request cannot accept another payment.",
          409
        );
      }

      // Return an existing valid checkout on a normal retry.
      // Do not create another provider payment unnecessarily.
      const existingPayment = await Payment.findOne({
        userId,
        purpose: "REAL_TRADE",
        tradeRequestId:
          new mongoose.Types.ObjectId(tradeRequestId),
        provider: "OPEXGT",
        status: "PENDING",
        checkoutUrl: { $exists: true, $ne: "" },
      }).sort({ createdAt: -1 });

      if (existingPayment?.checkoutUrl) {
        return NextResponse.json({
          success: true,
          mode: "live",
          message: "Existing checkout session returned.",
          payment: {
            id: existingPayment._id.toString(),
            orderId: existingPayment.providerOrderId,
            purpose: existingPayment.purpose,
            amountUsd: existingPayment.amountCents / 100,
            currency: existingPayment.currency,
            cryptoCurrency: existingPayment.cryptoCurrency,
            checkoutUrl: existingPayment.checkoutUrl,
            status: existingPayment.status,
          },
        });
      }

      // A previous provider request might have timed out after
      // creating a payment. Do not silently create duplicates.
      const unresolvedPayment = await Payment.findOne({
        userId,
        purpose: "REAL_TRADE",
        tradeRequestId:
          new mongoose.Types.ObjectId(tradeRequestId),
        provider: "OPEXGT",
        status: "PENDING",
      });

      if (unresolvedPayment) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A payment is already pending reconciliation. Check the OpexGT dashboard before retrying.",
            paymentId: unresolvedPayment._id.toString(),
            orderId: unresolvedPayment.providerOrderId,
            status: "PENDING",
          },
          { status: 409 }
        );
      }
    }

    // 6. Preserve the existing mock DEPOSIT behaviour.
    // Mock mode never initiates a real crypto transfer.
    if (mode === "mock") {
      const orderId = `mock_${randomUUID()}`;

      const mockPayment = await Payment.create({
        userId,
        purpose: "DEPOSIT",
        amountCents,
        currency: "USD",
        status: "PENDING",
        provider: "OPEXGT_MOCK",
        providerOrderId: orderId,
        cryptoCurrency,
      });

      return NextResponse.json(
        {
          success: true,
          mode: "mock",
          message:
            "Mock deposit record created. No real payment was initiated.",
          payment: {
            id: mockPayment._id.toString(),
            orderId,
            purpose: mockPayment.purpose,
            amountUsd: amountCents / 100,
            currency: "USD",
            cryptoCurrency,
            status: mockPayment.status,
            provider: mockPayment.provider,
            createdAt: mockPayment.createdAt,
          },
        },
        { status: 201 }
      );
    }

    // 7. Validate live provider configuration.
    const apiKey = getProviderApiKey();
    const webhookUrl = process.env.OPEXGT_WEBHOOK_URL;

    if (!apiKey?.trim()) {
      return jsonError(
        "OpexGT live API key is missing.",
        503
      );
    }

    if (!webhookUrl) {
      return jsonError(
        "OPEXGT_WEBHOOK_URL is missing.",
        503
      );
    }

    try {
      const webhook = new URL(webhookUrl);

      if (
        webhook.protocol !== "https:" ||
        webhook.pathname !== "/api/payments/webhook" ||
        webhook.search ||
        webhook.hash
      ) {
        throw new Error("Invalid webhook URL.");
      }
    } catch {
      return jsonError(
        "OPEXGT_WEBHOOK_URL must be a valid HTTPS URL pointing to /api/payments/webhook.",
        503
      );
    }

    // 8. Create local pending payment before contacting OpexGT.
    const orderId = `dp_${randomUUID()}`;

    const payment = await Payment.create({
      userId,
      purpose,
      amountCents,
      currency: "USD",
      status: "PENDING",
      provider: "OPEXGT",
      providerOrderId: orderId,
      cryptoCurrency,
      ...(tradeRequestId
        ? {
            tradeRequestId:
              new mongoose.Types.ObjectId(tradeRequestId),
          }
        : {}),
    });

    // 9. Create the provider payment.
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
      // A timeout does not prove the provider failed.
      // Keep the record pending for reconciliation.
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
            "Provider response could not be confirmed. Check OpexGT before retrying.",
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

    if (!providerResponse.ok || !isObject(rawResponse)) {
      console.error("OPEXGT_CREATE_REJECTED", {
        paymentId: payment._id.toString(),
        httpStatus: providerResponse.status,
      });

      return NextResponse.json(
        {
          success: false,
          mode: "live",
          message:
            "OpexGT returned an invalid response. Check the provider dashboard before retrying.",
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

    if (
      data.success !== true ||
      typeof data.payment_id !== "string" ||
      data.order_id !== orderId
    ) {
      console.error("OPEXGT_CREATE_NOT_CONFIRMED", {
        paymentId: payment._id.toString(),
      });

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

    const providerPaymentId = data.payment_id;
    const checkoutUrl = data.checkout_url;
    const depositAddress =
      typeof data.address === "string"
        ? data.address
        : undefined;

    const providerCurrency =
      typeof data.currency === "string"
        ? data.currency.toUpperCase()
        : "";

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

    if (
      !isValidCheckoutUrl(checkoutUrl) ||
      providerCurrency !== cryptoCurrency
    ) {
      console.error("OPEXGT_CREATE_INVALID_RESPONSE", {
        paymentId: payment._id.toString(),
        validCheckoutUrl: isValidCheckoutUrl(checkoutUrl),
        currencyMatched: providerCurrency === cryptoCurrency,
      });

      // Keep pending; reconcile before another attempt.
      return NextResponse.json(
        {
          success: false,
          mode: "live",
          message:
            "OpexGT returned an unexpected response. Payment remains pending for reconciliation.",
          paymentId: payment._id.toString(),
          orderId,
          status: "PENDING",
        },
        { status: 502 }
      );
    }

    // Verify the USD amount reported by the provider.
    const providerAmount = Number(data.amount_usd);

    if (
      !Number.isFinite(providerAmount) ||
      Math.round(providerAmount * 100) !== amountCents
    ) {
      payment.status = "AMOUNT_MISMATCH";
      payment.providerPaymentId = providerPaymentId;
      await payment.save();

      return NextResponse.json(
        {
          success: false,
          message:
            "OpexGT returned an amount that does not match the requested payment. Contact support before retrying.",
          paymentId: payment._id.toString(),
          status: "AMOUNT_MISMATCH",
        },
        { status: 502 }
      );
    }

    // 10. Save verified checkout details.
    payment.providerPaymentId = providerPaymentId;
    payment.checkoutUrl = checkoutUrl;
    payment.depositAddress = depositAddress;
    payment.cryptoCurrency = cryptoCurrency;
    payment.cryptoAmount = cryptoAmount;
    payment.expiresAt = expiresAt;

    await payment.save();

    // Update trade request payment state only for REAL_TRADE.
    // This is not broker order execution.
    if (tradeRequest) {
      tradeRequest.paymentStatus = "PENDING";
      await tradeRequest.save();
    }

    return NextResponse.json(
      {
        success: true,
        mode: "live",
        message:
          purpose === "REAL_TRADE"
            ? "Trade payment session created. Complete checkout; the trade request is not yet executed."
            : "Deposit payment session created. Complete checkout to pay.",
        payment: {
          id: payment._id.toString(),
          orderId,
          providerPaymentId,
          purpose: payment.purpose,
          amountUsd: payment.amountCents / 100,
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

    return jsonError("Unable to create payment.", 500);
  }
}
