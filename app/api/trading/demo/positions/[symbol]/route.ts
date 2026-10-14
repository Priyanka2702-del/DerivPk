
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { connectDB } from "@/lib/db";
import TradingAccount from "@/models/TradingAccount";
import { alpacaRequest } from "@/lib/alpaca/broker";

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ symbol: string }>;
  }
) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const account = await TradingAccount.findOne({
      userId: user.id,
      provider: "alpaca",
      accountType: "paper",
    }).lean();

    if (!account) {
      return NextResponse.json(
        { message: "Paper trading account not found" },
        { status: 404 }
      );
    }

    const { symbol } = await context.params;

    const cleanSymbol = symbol.trim().toUpperCase();

    if (!cleanSymbol) {
      return NextResponse.json(
        { message: "Symbol is required" },
        { status: 400 }
      );
    }

    const result = await alpacaRequest(
      `/v1/trading/accounts/${account.providerAccountId}/positions/${encodeURIComponent(
        cleanSymbol
      )}`,
      {
        method: "DELETE",
      }
    );

    return NextResponse.json({
      success: true,
      message: `${cleanSymbol} position close request submitted`,
      result,
    });
  } catch (error) {
    console.error("DEMO POSITION CLOSE ERROR:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to close position",
      },
      { status: 500 }
    );
  }
}
