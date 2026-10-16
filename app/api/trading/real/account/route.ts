import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import RealTradingAccount from "@/models/RealTradingAccount";

export const runtime = "nodejs";

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return fail("Unauthorized.", 401);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail("Please submit the account form.");
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return fail("Invalid account form.");
    }

    const data = body as Record<string, unknown>;
    const fullName = typeof data.fullName === "string" ? data.fullName.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const country = typeof data.country === "string" ? data.country.trim() : "";
    const consentAccepted = data.consentAccepted === true;

    if (fullName.length < 2 || fullName.length > 100) {
      return fail("Enter your full name (2–100 characters).");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return fail("Enter a valid email address.");
    }
    if (!/^[+0-9()\-\s]{7,20}$/.test(phone)) {
      return fail("Enter a valid phone number (7–20 characters).");
    }
    if (country.length < 2 || country.length > 60) {
      return fail("Enter a valid country.");
    }
    if (!consentAccepted) {
      return fail("Please confirm the account terms before continuing.");
    }

    await connectDB();

    let account = await RealTradingAccount.findOne({ userId: user.id });

    if (account && account.status !== "ACTIVE") {
      return fail("Your internal trading account is suspended.", 403);
    }

    const profileComplete = (record: typeof account) =>
      Boolean(
        record?.fullName?.trim() &&
        record?.email?.trim() &&
        record?.phone?.trim() &&
        record?.country?.trim() &&
        record?.consentAccepted
      );

    if (account && profileComplete(account)) {
      return NextResponse.json({
        success: true,
        message: "Your internal account already exists.",
        account: {
          id: account._id.toString(),
          accountLabel: account.accountLabel,
          status: account.status,
          accountType: "INTERNAL_REQUEST",
        },
        notice: "This internal account does not execute market orders or process payments.",
      });
    }

    if (account) {
      // Complete the existing legacy account; do not create a duplicate.
      account.fullName = fullName;
      account.email = email;
      account.phone = phone;
      account.country = country;
      account.consentAccepted = true;
      account.consentAcceptedAt = new Date();
      await account.save();
    } else {
      try {
        account = await RealTradingAccount.create({
          userId: user.id,
          accountLabel: "Internal Trade Request Account",
          status: "ACTIVE",
          fullName,
          email,
          phone,
          country,
          consentAccepted: true,
          consentAcceptedAt: new Date(),
        });
      } catch (error) {
        if (
          error instanceof mongoose.mongo.MongoServerError &&
          error.code === 11000
        ) {
          account = await RealTradingAccount.findOne({ userId: user.id });

          if (!account) throw error;
          if (account.status !== "ACTIVE") {
            return fail("Your internal trading account is suspended.", 403);
          }
          if (!profileComplete(account)) {
            account.fullName = fullName;
            account.email = email;
            account.phone = phone;
            account.country = country;
            account.consentAccepted = true;
            account.consentAcceptedAt = new Date();
            await account.save();
          }
        } else {
          throw error;
        }
      }
    }

    if (!account) return fail("Unable to save the account.", 500);

    return NextResponse.json({
      success: true,
      message: "Account registration completed.",
      account: {
        id: account._id.toString(),
        accountLabel: account.accountLabel,
        status: account.status,
        accountType: "INTERNAL_REQUEST",
      },
      notice: "This is an internal DerivPk request account only. It does not create an Alpaca brokerage account, process payments, or execute live market orders.",
    }, { status: 201 });
  } catch (error) {
    console.error("REAL ACCOUNT CREATE ERROR:", error);
    return fail("Unable to save your account. Please try again.", 500);
  }
}
