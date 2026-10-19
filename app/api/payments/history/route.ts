import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import Payment from "@/models/Payment";
import WalletLedger from "@/models/WalletLedger";

export async function GET() {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!mongoose.isValidObjectId(user.id)) {
      return NextResponse.json(
        { error: "Invalid user session." },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(user.id);

    const [payments, ledger, ledgerEntries] = await Promise.all([
      Payment.find({ userId })
        .select(
          "purpose amountCents currency status provider checkoutUrl tradeRequestId createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),

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

      WalletLedger.find({ userId })
        .select(
          "paymentId type amountCents currency description createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const balanceCents = ledger[0]?.balanceCents ?? 0;

    return NextResponse.json({
      wallet: {
        currency: "USD",
        balanceCents,
        balanceUsd: balanceCents / 100,
        totalDepositedCents: balanceCents,
        totalDepositedUsd: balanceCents / 100,
      },
      payments,
      ledger: ledgerEntries,
    });
  } catch (error) {
    console.error("PAYMENT_HISTORY_FETCH_FAILED", error);

    return NextResponse.json(
      { error: "Unable to fetch wallet and payment history." },
      { status: 500 }
    );
  }
}
