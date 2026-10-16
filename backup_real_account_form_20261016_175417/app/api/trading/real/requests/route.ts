import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import RealTradingAccount from "@/models/RealTradingAccount";
import RealTradeRequest from "@/models/RealTradeRequest";

export const runtime = "nodejs";

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

export async function GET() {
  try {
    const user = await requireAuth();

    if (!user) {
      return errorResponse("Unauthorized.", 401);
    }

    await connectDB();

    const account = await RealTradingAccount.findOne({ userId: user.id });

    if (!account) {
      return NextResponse.json({
        success: true,
        account: null,
        requests: [],
        notice: "Create your internal trading account before submitting a trade request.",
      });
    }

    if (account.status !== "ACTIVE") {
      return errorResponse("Your internal trading account is suspended.", 403);
    }

    const requests = await RealTradeRequest.find({
      userId: user.id,
      accountId: account._id,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      account: {
        id: account._id.toString(),
        accountLabel: account.accountLabel,
        status: account.status,
        accountType: "INTERNAL_REQUEST",
      },
      requests,
      notice:
        "Requests are reviewed by an administrator. Approval does not execute a market order.",
    });
  } catch (error) {
    console.error("REAL REQUESTS GET ERROR:", error);
    return errorResponse("Unable to load real trading requests.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    if (!user) {
      return errorResponse("Unauthorized.", 401);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Request body must be valid JSON.");
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return errorResponse("Invalid request body.");
    }

    const data = body as Record<string, unknown>;

    const symbol =
      typeof data.symbol === "string"
        ? data.symbol.trim().toUpperCase()
        : "";

    const side =
      typeof data.side === "string"
        ? data.side.trim().toUpperCase()
        : "";

    const orderType =
      typeof data.orderType === "string"
        ? data.orderType.trim().toUpperCase()
        : "";

    const quantity = data.quantity;
    const amount = data.amount;
    const rawLimitPrice = data.limitPrice;

    const notes =
      typeof data.notes === "string"
        ? data.notes.trim()
        : "";

    if (!/^[A-Z0-9.-]{1,20}$/.test(symbol)) {
      return errorResponse("Enter a valid symbol (maximum 20 characters).");
    }

    if (side !== "BUY" && side !== "SELL") {
      return errorResponse("Side must be BUY or SELL.");
    }

    if (orderType !== "MARKET" && orderType !== "LIMIT") {
      return errorResponse("Order type must be MARKET or LIMIT.");
    }

    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > 1000000000
    ) {
      return errorResponse("Quantity must be a positive number.");
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount < 0.01 ||
      amount > 1000000000
    ) {
      return errorResponse("Amount must be at least 0.01 USD and no more than 1000000000 USD.");
    }

    if (
      orderType === "LIMIT" &&
      (
        typeof rawLimitPrice !== "number" ||
        !Number.isFinite(rawLimitPrice) ||
        rawLimitPrice <= 0 ||
        rawLimitPrice > 1000000000
      )
    ) {
      return errorResponse("A positive limit price is required for limit requests.");
    }

    const limitPrice: number | undefined =
      orderType === "LIMIT" && typeof rawLimitPrice === "number"
        ? rawLimitPrice
        : undefined;

    if (notes.length > 500) {
      return errorResponse("Notes cannot exceed 500 characters.");
    }

    await connectDB();

    const account = await RealTradingAccount.findOne({ userId: user.id });

    if (!account) {
      return errorResponse(
        "Create your internal trading account before submitting a trade request.",
        409
      );
    }

    if (account.status !== "ACTIVE") {
      return errorResponse("Your internal trading account is suspended.", 403);
    }

    const tradeRequest = await RealTradeRequest.create({
      userId: user.id,
      accountId: account._id,
      symbol,
      side,
      orderType,
      quantity,
      amount,
      ...(orderType === "LIMIT" ? { limitPrice } : {}),
      ...(notes ? { notes } : {}),
      status: "PENDING_REVIEW",
      paymentStatus: "NOT_INTEGRATED",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Trade request submitted for administrator review.",
        request: tradeRequest,
        notice:
          "This is an internal request only. No payment was processed and no market order was executed.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REAL REQUESTS POST ERROR:", error);
    return errorResponse("Unable to submit trade request.", 500);
  }
}

