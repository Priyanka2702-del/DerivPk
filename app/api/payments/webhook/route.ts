
import { createHmac, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import Payment, { type PaymentStatus } from "@/models/Payment";
import RealTradeRequest from "@/models/RealTradeRequest";
import WalletLedger from "@/models/WalletLedger";

export const runtime = "nodejs";

const OPEXGT_STATUS_URL = "https://opexgt.com/api/v1/payment";

type ProviderStatus = {
  id?: unknown;
  payment_id?: unknown;
  order_id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
  tx_hash?: unknown;
};

function reply(message: string, status: number) {
  return NextResponse.json(
    { success: status >= 200 && status < 300, message },
    { status }
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function verifySignature(
  rawBody: Buffer,
  signature: string | null,
  secret: string
): boolean {
  if (!signature?.startsWith("sha512=")) return false;

  const expected = `sha512=${createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function amountMatches(value: unknown, amountCents: number): boolean {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.round(value * 100) === amountCents
  );
}

function isFinalStatus(status: PaymentStatus): boolean {
  return [
    "COMPLETED",
    "EXPIRED",
    "FAILED",
    "CANCELLED",
    "AMOUNT_MISMATCH",
  ].includes(status);
}

function tradePaymentStatus(status: PaymentStatus) {
  switch (status) {
    case "COMPLETED":
      return "PAID" as const;
    case "EXPIRED":
      return "EXPIRED" as const;
    case "AMOUNT_MISMATCH":
      return "AMOUNT_MISMATCH" as const;
    case "FAILED":
      return "FAILED" as const;
    case "CANCELLED":
      return "CANCELLED" as const;
    default:
      return "PENDING" as const;
  }
}

export async function POST(request: Request) {
  try {
    const secret =
      process.env.OPEX_WEBHOOK_SECRET ??
      process.env.OPEXGT_SIGNING_SECRET ??
      process.env.OpexGT_Signing_secret;

    if (!secret) {
      console.error("OPEXGT_WEBHOOK_SECRET_MISSING");
      return reply("Webhook is not configured.", 503);
    }

    const rawBody = Buffer.from(await request.arrayBuffer());
    const signature = request.headers.get("x-opex-signature");

    if (!verifySignature(rawBody, signature, secret)) {
      return reply("Invalid webhook signature.", 401);
    }

    let payload: unknown;

    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return reply("Invalid JSON payload.", 400);
    }

    if (!isObject(payload) || typeof payload.event !== "string") {
      return reply("Invalid webhook payload.", 400);
    }

    if (payload.event === "webhook.test") {
      return reply("Webhook signature verified.", 200);
    }

    const supportedEvents = new Set([
      "payment.completed",
      "payment.expired",
      "payment.amount_mismatch",
    ]);

    if (!supportedEvents.has(payload.event)) {
      return reply("Event ignored.", 200);
    }

    const providerPaymentId = payload.payment_id;
    const orderId = payload.order_id;

    if (
      typeof providerPaymentId !== "string" ||
      !providerPaymentId ||
      typeof orderId !== "string" ||
      !orderId
    ) {
      return reply("Missing payment or order identifier.", 400);
    }

    await connectDB();

    // Both deposits and real-trade payments are supported.
    const payment = await Payment.findOne({
      provider: "OPEXGT",
      providerPaymentId,
      providerOrderId: orderId,
      purpose: { $in: ["DEPOSIT", "REAL_TRADE"] },
    });

    if (!payment) {
      console.error("OPEXGT_WEBHOOK_PAYMENT_NOT_FOUND", {
        providerPaymentId,
        orderId,
      });
      return reply("Payment record not found; retry later.", 503);
    }

    if (isFinalStatus(payment.status)) {
      return reply("Payment already processed.", 200);
    }

    // A real-trade payment must be linked to a matching request.
    if (payment.purpose === "REAL_TRADE") {
      if (!payment.tradeRequestId) {
        console.error("OPEXGT_TRADE_REQUEST_LINK_MISSING", {
          paymentId: payment._id.toString(),
        });
        return reply("Trade request link is missing; review required.", 503);
      }

      const tradeRequest = await RealTradeRequest.findOne({
        _id: payment.tradeRequestId,
        userId: payment.userId,
      }).select("_id amount status paymentStatus");

      if (!tradeRequest) {
        console.error("OPEXGT_TRADE_REQUEST_NOT_FOUND", {
          paymentId: payment._id.toString(),
        });
        return reply("Matching trade request not found; review required.", 503);
      }

      const tradeAmountCents = Math.round(
        Number(tradeRequest.amount) * 100
      );

      if (
        !Number.isFinite(tradeAmountCents) ||
        tradeAmountCents !== payment.amountCents
      ) {
        console.error("OPEXGT_TRADE_AMOUNT_MISMATCH", {
          paymentId: payment._id.toString(),
        });
        return reply("Trade amount mismatch; review required.", 503);
      }

      if (
        tradeRequest.status !== "PENDING_REVIEW" ||
        tradeRequest.paymentStatus === "PAID"
      ) {
        console.error("OPEXGT_TRADE_REQUEST_NOT_PAYABLE", {
          paymentId: payment._id.toString(),
          requestStatus: tradeRequest.status,
          paymentStatus: tradeRequest.paymentStatus,
        });
        return reply("Trade request is not eligible for settlement.", 409);
      }
    }

    const apiKey =
      process.env.OPEXGT_API_KEY ??
      process.env.OpexGT_Lve_key;

    if (!apiKey) {
      console.error("OPEXGT_STATUS_API_KEY_MISSING");
      return reply("Provider verification is not configured.", 503);
    }

    // Never trust the webhook event alone. Verify payment with OpexGT.
    let statusResponse: Response;

    try {
      statusResponse = await fetch(
        `${OPEXGT_STATUS_URL}/${encodeURIComponent(providerPaymentId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        }
      );
    } catch (error) {
      console.error("OPEXGT_STATUS_LOOKUP_FAILED", {
        paymentId: payment._id.toString(),
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return reply("Could not verify provider status; retry later.", 503);
    }

    if (!statusResponse.ok) {
      console.error("OPEXGT_STATUS_LOOKUP_REJECTED", {
        paymentId: payment._id.toString(),
        httpStatus: statusResponse.status,
      });
      return reply("Provider status verification failed; retry later.", 503);
    }

    let statusPayload: unknown;

    try {
      statusPayload = await statusResponse.json();
    } catch {
      return reply("Provider returned invalid status data.", 503);
    }

    if (!isObject(statusPayload)) {
      return reply("Provider returned invalid status data.", 503);
    }

    const providerData = (
      isObject(statusPayload.data) ? statusPayload.data : statusPayload
    ) as ProviderStatus;

    const confirmedPaymentId =
      typeof providerData.id === "string"
        ? providerData.id
        : typeof providerData.payment_id === "string"
          ? providerData.payment_id
          : null;

    const confirmedOrderId =
      typeof providerData.order_id === "string"
        ? providerData.order_id
        : null;

    const confirmedStatus =
      typeof providerData.status === "string"
        ? providerData.status.toLowerCase()
        : "";

    const confirmedCurrency =
      typeof providerData.currency === "string"
        ? providerData.currency.toUpperCase()
        : "";

    if (
      confirmedPaymentId !== providerPaymentId ||
      confirmedOrderId !== orderId
    ) {
      console.error("OPEXGT_STATUS_IDENTIFIER_MISMATCH", {
        paymentId: payment._id.toString(),
      });
      return reply("Provider identifiers did not match; review required.", 503);
    }

    let nextStatus: PaymentStatus;

    if (payload.event === "payment.amount_mismatch") {
      if (
        confirmedStatus !== "pending" &&
        confirmedStatus !== "completed" &&
        confirmedStatus !== "failed"
      ) {
        return reply("Mismatch needs manual reconciliation.", 503);
      }

      nextStatus = "AMOUNT_MISMATCH";
    } else if (payload.event === "payment.completed") {
      if (confirmedStatus !== "completed") {
        return reply("Provider has not confirmed completion; retry later.", 503);
      }

      if (
        confirmedCurrency !== payment.cryptoCurrency ||
        !amountMatches(providerData.amount, payment.amountCents)
      ) {
        console.error("OPEXGT_COMPLETED_AMOUNT_OR_CURRENCY_MISMATCH", {
          paymentId: payment._id.toString(),
          currencyMatched: confirmedCurrency === payment.cryptoCurrency,
          amountMatched: amountMatches(
            providerData.amount,
            payment.amountCents
          ),
        });
        return reply("Completed payment needs manual reconciliation.", 503);
      }

      nextStatus = "COMPLETED";
    } else {
      if (confirmedStatus !== "expired") {
        return reply("Provider has not confirmed expiry; retry later.", 503);
      }

      nextStatus = "EXPIRED";
    }

    const txHash =
      typeof providerData.tx_hash === "string"
        ? providerData.tx_hash
        : typeof payload.tx_hash === "string"
          ? payload.tx_hash
          : undefined;

    // Payment settlement and its corresponding action are atomic.
    // MongoDB must run as a replica set / transaction-capable cluster.
    const session = await mongoose.startSession();
    let alreadyProcessed = false;

    try {
      await session.withTransaction(async () => {
        const update: {
          status: PaymentStatus;
          creditedAt?: Date;
          txHash?: string;
        } = { status: nextStatus };

        if (txHash) update.txHash = txHash;

        if (nextStatus === "COMPLETED") {
          update.creditedAt = new Date();
        }

        const result = await Payment.updateOne(
          { _id: payment._id, status: "PENDING" },
          { $set: update },
          { session }
        );

        if (result.modifiedCount !== 1) {
          const current = await Payment.findById(payment._id)
            .session(session)
            .select("status")
            .lean();

          if (current && isFinalStatus(current.status as PaymentStatus)) {
            alreadyProcessed = true;
            return;
          }

          throw new Error("PAYMENT_STATUS_CHANGED_CONCURRENTLY");
        }

        if (payment.purpose === "DEPOSIT") {
          // Preserve the existing deposit wallet-credit behavior.
          if (nextStatus === "COMPLETED") {
            await WalletLedger.create(
              [
                {
                  userId: payment.userId,
                  paymentId: payment._id,
                  type: "CREDIT",
                  amountCents: payment.amountCents,
                  currency: "USD",
                  description: `Verified OpexGT deposit (${orderId})`,
                },
              ],
              { session }
            );
          }
        } else {
          // REAL_TRADE: never credit WalletLedger.
          // Update only the linked, matching trade request.
          if (!payment.tradeRequestId) {
            throw new Error("TRADE_REQUEST_LINK_MISSING");
          }

          const tradeRequest = await RealTradeRequest.findOne({
            _id: payment.tradeRequestId,
            userId: payment.userId,
          }).session(session);

          if (!tradeRequest) {
            throw new Error("TRADE_REQUEST_NOT_FOUND");
          }

          const tradeAmountCents = Math.round(
            Number(tradeRequest.amount) * 100
          );

          if (tradeAmountCents !== payment.amountCents) {
            throw new Error("TRADE_REQUEST_AMOUNT_MISMATCH");
          }

          if (
            tradeRequest.status !== "PENDING_REVIEW" ||
            tradeRequest.paymentStatus === "PAID"
          ) {
            throw new Error("TRADE_REQUEST_NOT_ELIGIBLE");
          }

          tradeRequest.paymentStatus = tradePaymentStatus(nextStatus);
          await tradeRequest.save({ session });
        }
      });
    } finally {
      await session.endSession();
    }

    if (alreadyProcessed) {
      return reply("Payment already processed.", 200);
    }

    if (nextStatus === "COMPLETED" && payment.purpose === "DEPOSIT") {
      return reply("Payment verified and wallet credited.", 200);
    }

    if (nextStatus === "COMPLETED" && payment.purpose === "REAL_TRADE") {
      return reply(
        "Payment verified and trade request marked paid. Broker execution is not performed.",
        200
      );
    }

    return reply(
      nextStatus === "AMOUNT_MISMATCH"
        ? "Amount mismatch recorded; manual review required."
        : "Payment status updated.",
      200
    );
  } catch (error) {
    console.error("OPEXGT_WEBHOOK_PROCESSING_FAILED", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return reply("Unable to process webhook; retry or review logs.", 500);
  }
}