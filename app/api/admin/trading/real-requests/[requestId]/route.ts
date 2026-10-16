import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import RealTradeRequest from "@/models/RealTradeRequest";

export const runtime = "nodejs";

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return errorResponse("Admin access required.", 403);
    }

    const { requestId } = await params;

    if (!mongoose.isValidObjectId(requestId)) {
      return errorResponse("Invalid request ID.", 400);
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
    const action =
      typeof data.action === "string"
        ? data.action.trim().toUpperCase()
        : "";

    const adminNote =
      typeof data.adminNote === "string"
        ? data.adminNote.trim()
        : "";

    const rejectionReason =
      typeof data.rejectionReason === "string"
        ? data.rejectionReason.trim()
        : "";

    if (action !== "APPROVE" && action !== "REJECT") {
      return errorResponse("Action must be APPROVE or REJECT.");
    }

    if (adminNote.length > 1000) {
      return errorResponse("Admin note cannot exceed 1000 characters.");
    }

    if (rejectionReason.length > 1000) {
      return errorResponse("Rejection reason cannot exceed 1000 characters.");
    }

    if (action === "REJECT" && !rejectionReason) {
      return errorResponse("A rejection reason is required.");
    }

    await connectDB();

    const update: Record<string, unknown> = {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      adminDecisionBy: admin.id,
      adminDecisionAt: new Date(),
      adminNote,
    };

    if (action === "REJECT") {
      update.rejectionReason = rejectionReason;
    } else {
      update.rejectionReason = undefined;
    }

    const tradeRequest = await RealTradeRequest.findOneAndUpdate(
      {
        _id: requestId,
        status: "PENDING_REVIEW",
      },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!tradeRequest) {
      const existing = await RealTradeRequest.findById(requestId)
        .select("_id status")
        .lean();

      if (!existing) {
        return errorResponse("Trade request not found.", 404);
      }

      return errorResponse(
        "This request has already been reviewed.",
        409
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? "Trade request approved for internal workflow."
          : "Trade request rejected.",
      request: tradeRequest,
      notice:
        "This decision does not execute a market order or process a payment.",
    });
  } catch (error) {
    console.error("ADMIN REAL TRADE DECISION ERROR:", error);
    return errorResponse("Unable to update trade request.", 500);
  }
}
