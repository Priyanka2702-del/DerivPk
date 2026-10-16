import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import RealTradingAccount from "@/models/RealTradingAccount";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    await connectDB();

    let account = await RealTradingAccount.findOne({ userId: user.id });

    if (!account) {
      try {
        account = await RealTradingAccount.create({
          userId: user.id,
          accountLabel: "Internal Trade Request Account",
          status: "ACTIVE",
        });
      } catch (error) {
        if (
          error instanceof mongoose.mongo.MongoServerError &&
          error.code === 11000
        ) {
          account = await RealTradingAccount.findOne({ userId: user.id });
        } else {
          throw error;
        }
      }
    }

    if (!account) {
      return NextResponse.json(
        { success: false, message: "Unable to create your account." },
        { status: 500 }
      );
    }

    if (account.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Your internal trading account is suspended.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Internal trading request account is ready.",
        account: {
          id: account._id.toString(),
          accountLabel: account.accountLabel,
          status: account.status,
          accountType: "INTERNAL_REQUEST",
        },
        notice:
          "This is an internal request account only. It does not create an Alpaca broker account, process payments, or execute live market orders.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REAL ACCOUNT CREATE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to create your internal trading account.",
      },
      { status: 500 }
    );
  }
}