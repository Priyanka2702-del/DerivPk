
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
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

function response(
  message: string,
  status: number,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json(
    { success: status >= 200 && status < 300, message, ...extra },
    { status }
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    case "FAILED":
      return "FAILED" as const;
    case "CANCELLED":
      return "CANCELLED" as const;
    case "AMOUNT_MISMATCH":
      return "AMOUNT_MISMATCH" as const;
    default:
      return "PENDING" as const;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    if (!user || !mongoose.isValidObjectId(user.id)) {
      return response("Unauthorized.", 401);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return response("Invalid JSON body.", 400);
    }

    if (
      !isObject(body) ||
      typeof body.paymentId !== "string" ||
      !mongoose.isValidObjectId(body.paymentId)
    ) {
      return response("A valid paymentId is required.", 400);
    }

    await connectDB();

    const payment = await Payment.findOne({
      _id: body.paymentId,
      userId: new mongoose.Types.ObjectId(user.id),
      purpose: { $in: ["DEPOSIT", "REAL_TRADE"] },
      provider: "OPEXGT",
    });

    if (!payment) {
      return response("Payment not found.", 404);
    }

    if (isFinalStatus(payment.status)) {
      return response("Payment is already finalized.", 200, {
        payment: {
          id: payment._id.toString(),
          purpose: payment.purpose,
          status: payment.status,
        },
      });
    }

    if (
      !payment.providerPaymentId ||
      !payment.providerOrderId ||
      !payment.cryptoCurrency
    ) {
      return response(
        "Provider payment details are incomplete. Manual review is required.",
        409
      );
    }

    // Validate the linked request before checking a REAL_TRADE payment.
    if (payment.purpose === "REAL_TRADE") {
      if (!payment.tradeRequestId) {
        return response(
          "Trade request link is missing. Manual review is required.",
          409
        );
      }

      const tradeRequest = await RealTradeRequest.findOne({
        _id: payment.tradeRequestId,
        userId: payment.userId,
      }).select("_id amount status paymentStatus");

      if (!tradeRequest) {
        return response(
          "Matching trade request was not found. Manual review is required.",
          409
        );
      }

      if (
        Math.round(Number(tradeRequest.amount) * 100) !==
        payment.amountCents
      ) {
        return response(
          "Trade request amount does not match the payment. Manual review is required.",
          409
        );
      }

      if (
        tradeRequest.status !== "PENDING_REVIEW" ||
        tradeRequest.paymentStatus === "PAID"
      ) {
        return response(
          "Trade request is not eligible for payment settlement.",
          409
        );
      }
    }

    const apiKey =
      process.env.OPEXGT_API_KEY ??
      process.env.OpexGT_Lve_key;

    if (!apiKey?.trim()) {
      return response("OpexGT API key is not configured.", 503);
    }

    let providerResponse: Response;

    try {
      providerResponse = await fetch(
        `${OPEXGT_STATUS_URL}/${encodeURIComponent(
          payment.providerPaymentId
        )}`,
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
    } catch {
      return response("Could not reach OpexGT. Please retry later.", 503);
    }

    if (!providerResponse.ok) {
      console.error("OPEXGT_STATUS_LOOKUP_REJECTED", {
        paymentId: payment._id.toString(),
        httpStatus: providerResponse.status,
      });

      return response(
        "OpexGT could not verify this payment. Please retry later.",
        503
      );
    }

    let raw: unknown;

    try {
      raw = await providerResponse.json();
    } catch {
      return response("OpexGT returned invalid JSON.", 503);
    }

    if (!isObject(raw)) {
      return response("OpexGT returned an invalid response.", 503);
    }

    // Support both the documented flat response and a data wrapper.
    const providerData = (
      isObject(raw.data) ? raw.data : raw
    ) as ProviderStatus;

    const confirmedPaymentId =
      typeof providerData.id === "string"
        ? providerData.id
        : typeof providerData.payment_id === "string"
          ? providerData.payment_id
          : null;

    if (
      confirmedPaymentId !== payment.providerPaymentId ||
      providerData.order_id !== payment.providerOrderId
    ) {
      console.error("OPEXGT_STATUS_IDENTIFIER_MISMATCH", {
        paymentId: payment._id.toString(),
      });

      return response(
        "Provider payment identifiers do not match. Manual review is required.",
        409
      );
    }

    const providerStatus =
      typeof providerData.status === "string"
        ? providerData.status.toLowerCase()
        : "";

    if (providerStatus === "pending") {
      return response("Payment is still pending.", 200, {
        payment: {
          id: payment._id.toString(),
          purpose: payment.purpose,
          status: "PENDING",
        },
      });
    }

    let nextStatus: PaymentStatus;

    if (providerStatus === "expired") {
      nextStatus = "EXPIRED";
    } else if (providerStatus === "failed") {
      nextStatus = "FAILED";
    } else if (providerStatus === "completed") {
      const currency =
        typeof providerData.currency === "string"
          ? providerData.currency.toUpperCase()
          : "";

      const validCurrency = currency === payment.cryptoCurrency;
      const validAmount = amountMatches(
        providerData.amount,
        payment.amountCents
      );

      if (!validCurrency || !validAmount) {
        // Persist the mismatch atomically. Never credit a mismatched payment.
        const session = await mongoose.startSession();

        try {
          await session.withTransaction(async () => {
            const result = await Payment.updateOne(
              { _id: payment._id, status: "PENDING" },
              { $set: { status: "AMOUNT_MISMATCH" } },
              { session }
            );

            if (result.modifiedCount !== 1) {
              const current = await Payment.findById(payment._id)
                .session(session)
                .select("status")
                .lean();

              if (
                current &&
                isFinalStatus(current.status as PaymentStatus)
              ) {
                return;
              }

              throw new Error("PAYMENT_STATUS_CHANGED_CONCURRENTLY");
            }

            if (payment.purpose === "REAL_TRADE") {
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

              if (
                Math.round(Number(tradeRequest.amount) * 100) !==
                  payment.amountCents ||
                tradeRequest.status !== "PENDING_REVIEW" ||
                tradeRequest.paymentStatus === "PAID"
              ) {
                throw new Error("TRADE_REQUEST_NOT_ELIGIBLE");
              }

              tradeRequest.paymentStatus = "AMOUNT_MISMATCH";
              await tradeRequest.save({ session });
            }
          });
        } finally {
          await session.endSession();
        }

        return response(
          "Payment amount or currency does not match. Manual reconciliation is required.",
          409,
          {
            payment: {
              id: payment._id.toString(),
              purpose: payment.purpose,
              status: "AMOUNT_MISMATCH",
            },
          }
        );
      }

      nextStatus = "COMPLETED";
    } else {
      return response(
        "OpexGT returned an unknown payment status.",
        503
      );
    }

    const session = await mongoose.startSession();
    let alreadyProcessed = false;
    let settledStatus: PaymentStatus = nextStatus;

    try {
      await session.withTransaction(async () => {
        const update: {
          status: PaymentStatus;
          creditedAt?: Date;
          txHash?: string;
        } = { status: nextStatus };

        if (
          typeof providerData.tx_hash === "string" &&
          providerData.tx_hash
        ) {
          update.txHash = providerData.tx_hash;
        }

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
            settledStatus = current.status as PaymentStatus;
            return;
          }

          throw new Error("PAYMENT_STATUS_CHANGED_CONCURRENTLY");
        }

        if (payment.purpose === "DEPOSIT") {
          // Preserve the existing deposit credit flow.
          if (nextStatus === "COMPLETED") {
            await WalletLedger.create(
              [
                {
                  userId: payment.userId,
                  paymentId: payment._id,
                  type: "CREDIT",
                  amountCents: payment.amountCents,
                  currency: "USD",
                  description: `Verified OpexGT deposit (${payment.providerOrderId})`,
                },
              ],
              { session }
            );
          }
        } else {
          // REAL_TRADE: update the request only; never credit the wallet.
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

          if (
            Math.round(Number(tradeRequest.amount) * 100) !==
              payment.amountCents ||
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

    const finalStatus = alreadyProcessed ? settledStatus : nextStatus;

    const message =
      finalStatus === "COMPLETED"
        ? payment.purpose === "DEPOSIT"
          ? "Payment verified and wallet credited."
          : "Payment verified and trade request marked paid. Broker execution is not performed."
        : alreadyProcessed
          ? "Payment was already processed."
          : `Payment status updated to ${finalStatus}.`;

    return response(message, 200, {
      payment: {
        id: payment._id.toString(),
        purpose: payment.purpose,
        status: finalStatus,
      },
    });
  } catch (error) {
    console.error("PAYMENT_STATUS_REFRESH_FAILED", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return response(
      "Unable to refresh payment status. Please retry later.",
      500
    );
  }
}