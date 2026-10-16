import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import RealTradeRequest, { type RealTradeStatus } from "@/models/RealTradeRequest";

export const runtime = "nodejs";

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return errorResponse("Admin access required.", 403);
    }

    const url = new URL(request.url);
    const requestedStatus =
      url.searchParams.get("status")?.toUpperCase() ||
      "PENDING_REVIEW";

    const allowedStatuses = [
      "PENDING_REVIEW",
      "APPROVED",
      "REJECTED",
      "ALL",
    ];

    if (!allowedStatuses.includes(requestedStatus)) {
      return errorResponse(
        "Invalid status filter.",
        400
      );
    }

    const rawLimit = Number(
      url.searchParams.get("limit") || "25"
    );
    const rawPage = Number(
      url.searchParams.get("page") || "1"
    );

    if (
      !Number.isInteger(rawLimit) ||
      rawLimit < 1 ||
      !Number.isInteger(rawPage) ||
      rawPage < 1
    ) {
      return errorResponse(
        "Page and limit must be positive integers."
      );
    }

    const limit = Math.min(rawLimit, 100);
    const page = rawPage;

    await connectDB();

    const filter: { status?: RealTradeStatus } =
      requestedStatus === "ALL"
        ? {}
        : { status: requestedStatus as RealTradeStatus };

    const [requests, total] = await Promise.all([
      RealTradeRequest.find(filter)
        .populate("userId", "name email")
        .populate("accountId", "accountLabel status")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RealTradeRequest.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      notice:
        "Admin review only. Approval does not execute a market order or process payment.",
    });
  } catch (error) {
    console.error("ADMIN REAL TRADE REQUESTS ERROR:", error);

    return errorResponse(
      "Unable to load trade requests.",
      500
    );
  }
}

