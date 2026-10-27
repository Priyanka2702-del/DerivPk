
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import Payment, {
  type PaymentStatus,
} from "@/models/Payment";
import WalletLedger from "@/models/WalletLedger";

export const runtime = "nodejs";

const OPEXGT_STATUS_URL =
  "https://opexgt.com/api/v1/payment";

type ProviderStatus = {
  id?: unknown;
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

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function amountMatches(
  value: unknown,
  amountCents: number
): boolean {
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
      purpose: "DEPOSIT",
      provider: "OPEXGT",
    });

    if (!payment) {
      return response("Payment not found.", 404);
    }

    if (isFinalStatus(payment.status)) {
      return response("Payment is already finalized.", 200, {
        payment: {
          id: payment._id.toString(),
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
          signal: AbortSignal.timeout(10000),
        }
      );
    } catch {
      return response(
        "Could not reach OpexGT. Please retry later.",
        503
      );
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

    // Documentation specifies a flat GET response.
    const provider = raw as ProviderStatus;

    if (
      provider.id !== payment.providerPaymentId ||
      provider.order_id !== payment.providerOrderId
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
      typeof provider.status === "string"
        ? provider.status.toLowerCase()
        : "";

    let nextStatus: PaymentStatus;

    if (providerStatus === "pending") {
      return response("Payment is still pending.", 200, {
        payment: {
          id: payment._id.toString(),
          status: "PENDING",
        },
      });
    }

    if (providerStatus === "expired") {
      nextStatus = "EXPIRED";
    } else if (providerStatus === "failed") {
      nextStatus = "FAILED";
    } else if (providerStatus === "completed") {
      const currency =
        typeof provider.currency === "string"
          ? provider.currency.toUpperCase()
          : "";

      const validCurrency = currency === payment.cryptoCurrency;
      const validAmount = amountMatches(
        provider.amount,
        payment.amountCents
      );

      if (!validCurrency || !validAmount) {
        // Never credit an amount/currency mismatch automatically.
        await Payment.updateOne(
          { _id: payment._id, status: "PENDING" },
          { $set: { status: "AMOUNT_MISMATCH" } }
        );

        return response(
          "Payment amount or currency does not match. Manual reconciliation is required.",
          409
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

    try {
      await session.withTransaction(async () => {
        const update: {
          status: PaymentStatus;
          creditedAt?: Date;
          txHash?: string;
        } = { status: nextStatus };

        if (
          typeof provider.tx_hash === "string" &&
          provider.tx_hash
        ) {
          update.txHash = provider.tx_hash;
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

          if (
            current &&
            isFinalStatus(current.status as PaymentStatus)
          ) {
            alreadyProcessed = true;
            return;
          }

          throw new Error("PAYMENT_STATUS_CHANGED_CONCURRENTLY");
        }

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
      });
    } finally {
      await session.endSession();
    }

    return response(
      alreadyProcessed
        ? "Payment was already processed."
        : nextStatus === "COMPLETED"
          ? "Payment verified and wallet credited."
          : `Payment status updated to ${nextStatus}.`,
      200,
      {
        payment: {
          id: payment._id.toString(),
          status: alreadyProcessed ? "FINALIZED" : nextStatus,
        },
      }
    );
  } catch (error) {
    console.error("PAYMENT_STATUS_REFRESH_FAILED", {
      errorName:
        error instanceof Error ? error.name : "UnknownError",
      message:
        error instanceof Error ? error.message : "Unknown error",
    });

    return response(
      "Unable to refresh payment status. Please retry later.",
      500
    );
  }
}
