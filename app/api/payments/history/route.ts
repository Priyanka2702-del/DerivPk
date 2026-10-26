
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import Payment from "@/models/Payment";
import WalletLedger from "@/models/WalletLedger";

export const runtime = "nodejs";

export async function GET() {
  try {
    // 1. Authenticate the user
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Validate user ID
    if (!mongoose.isValidObjectId(user.id)) {
      return NextResponse.json(
        { error: "Invalid user session." },
        { status: 401 }
      );
    }

    // 3. Connect to MongoDB
    await connectDB();

    const userId = new mongoose.Types.ObjectId(user.id);

    // 4. Fetch payments, wallet balance and history
    const [payments, ledger, depositTotals, ledgerEntries] =
      await Promise.all([
        Payment.find({ userId })
          .select(
            "purpose amountCents currency status provider providerPaymentId providerOrderId checkoutUrl depositAddress cryptoCurrency cryptoAmount txHash expiresAt tradeRequestId createdAt updatedAt"
          )
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),

        // Wallet balance comes from ledger entries.
        // Only CREDIT entries increase the displayed balance.
        WalletLedger.aggregate([
          {
            $match: {
              userId,
              currency: "USD",
            },
          },
          {
            $group: {
              _id: null,
              balanceCents: {
                $sum: {
                  $cond: [
                    { $eq: ["$type", "CREDIT"] },
                    "$amountCents",
                    0,
                  ],
                },
              },
            },
          },
        ]),

        // Count only completed USD deposits.
        Payment.aggregate([
          {
            $match: {
              userId,
              purpose: "DEPOSIT",
              status: "COMPLETED",
              currency: "USD",
            },
          },
          {
            $group: {
              _id: null,
              totalDepositedCents: {
                $sum: "$amountCents",
              },
              completedDepositCount: {
                $sum: 1,
              },
            },
          },
        ]),

        // Latest wallet ledger entries
        WalletLedger.find({ userId })
          .select(
            "paymentId type amountCents currency description createdAt"
          )
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
      ]);

    // 5. Prepare wallet totals
    const balanceCents = ledger[0]?.balanceCents ?? 0;
    const totalDepositedCents =
      depositTotals[0]?.totalDepositedCents ?? 0;
    const completedDepositCount =
      depositTotals[0]?.completedDepositCount ?? 0;

    // 6. Return payment history and wallet summary
    return NextResponse.json({
      success: true,
      wallet: {
        currency: "USD",
        balanceCents,
        balanceUsd: balanceCents / 100,
        totalDepositedCents,
        totalDepositedUsd: totalDepositedCents / 100,
        completedDepositCount,
      },
      payments,
      ledger: ledgerEntries,
    });
  } catch (error) {
    // Log the real error in the server terminal for debugging.
    console.error("PAYMENT_HISTORY_FETCH_FAILED:", {
      name:
        error instanceof Error ? error.name : "UnknownError",
      message:
        error instanceof Error ? error.message : String(error),
      stack:
        error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Unable to fetch wallet and payment history." },
      { status: 500 }
    );
  }
}
