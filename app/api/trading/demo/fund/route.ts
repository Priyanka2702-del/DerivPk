
import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/session";
import { connectDB } from "@/lib/db";
import TradingAccount from "@/models/TradingAccount";

import {
  alpacaRequest,
  alpacaSandboxFundAccount,
  type AlpacaJournal,
} from "@/lib/alpaca/broker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FUNDING_AMOUNT = 1000;

type AlpacaAccount = {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  cash: string;
  equity: string;
  buying_power: string;
  account_blocked?: boolean;
  trading_blocked?: boolean;
  transfers_blocked?: boolean;
};

function accountResponse(account: AlpacaAccount) {
  return {
    id: account.id,
    accountNumber: account.account_number,
    status: account.status,
    currency: account.currency,
    cash: Number(account.cash),
    equity: Number(account.equity),
    buyingPower: Number(account.buying_power),
  };
}

function journalResponse(journal: AlpacaJournal) {
  return {
    id: journal.id,
    status: journal.status,
    amount: journal.amount,
    currency: journal.currency || "USD",
    createdAt: journal.created_at,
  };
}

/**
 * Check an existing journal.
 * This endpoint never creates a funding journal.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const journalId = new URL(request.url)
      .searchParams.get("journalId");

    if (!journalId || !/^[0-9a-f-]{36}$/i.test(journalId)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid journalId is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const tradingAccount = await TradingAccount.findOne({
      userId: user.id,
      provider: "alpaca",
      accountType: "paper",
    }).lean();

    if (!tradingAccount?.providerAccountId) {
      return NextResponse.json(
        {
          success: false,
          message: "Paper trading account not found.",
        },
        { status: 404 }
      );
    }

    const journal = await alpacaRequest<AlpacaJournal>(
      `/v1/journals/${encodeURIComponent(journalId)}`
    );

    if (journal.to_account !== tradingAccount.providerAccountId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This journal does not belong to your paper account.",
        },
        { status: 403 }
      );
    }

    const status = String(journal.status || "").toLowerCase();
    const fundingComplete = status === "executed";
    const fundingFailed = [
      "canceled",
      "cancelled",
      "deleted",
      "rejected",
      "refused",
    ].includes(status);

    return NextResponse.json({
      success: true,
      fundingComplete,
      fundingFailed,
      message: fundingComplete
        ? "Funding journal executed. Check your account balance."
        : fundingFailed
          ? `Funding was not completed. Journal status: ${status}.`
          : `Journal status: ${status || "unknown"}. Funding is not confirmed yet.`,
      journal: journalResponse(journal),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown journal status error.";

    console.error("JOURNAL STATUS CHECK ERROR:", message);

    return NextResponse.json(
      {
        success: false,
        message: "Could not check journal status.",
        error: message,
      },
      { status: 502 }
    );
  }
}

/**
 * Submit a sandbox funding journal.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    let body: { amount?: number | string };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);

    if (
      !Number.isFinite(amount) ||
      amount < 0.01 ||
      amount > MAX_FUNDING_AMOUNT
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Funding amount must be between $0.01 and $1,000 per request.",
        },
        { status: 400 }
      );
    }

    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount < 0.01) {
      return NextResponse.json(
        {
          success: false,
          message: "Funding amount must be at least $0.01.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const tradingAccount = await TradingAccount.findOne({
      userId: user.id,
      provider: "alpaca",
      accountType: "paper",
    }).lean();

    if (!tradingAccount) {
      return NextResponse.json(
        {
          success: false,
          message: "Paper trading account not found.",
          code: "PAPER_ACCOUNT_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (!tradingAccount.providerAccountId) {
      return NextResponse.json(
        {
          success: false,
          message: "The paper account has no Alpaca account ID.",
          code: "PROVIDER_ACCOUNT_ID_MISSING",
        },
        { status: 409 }
      );
    }

    const account = await alpacaRequest<AlpacaAccount>(
      `/v1/trading/accounts/${encodeURIComponent(
        tradingAccount.providerAccountId
      )}/account`
    );

    if (account.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: `Alpaca account is not ACTIVE. Current status: ${account.status}`,
          code: "ACCOUNT_NOT_ACTIVE",
        },
        { status: 409 }
      );
    }

    if (account.account_blocked || account.transfers_blocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The Alpaca account is blocked from funding or transfers.",
          code: "ACCOUNT_BLOCKED",
        },
        { status: 409 }
      );
    }

    const funding = await alpacaSandboxFundAccount({
      accountId: account.id,
      amount: roundedAmount,
    });

    const status = String(funding.status || "").toLowerCase();

    const fundingComplete = status === "executed";

    const fundingPending = [
      "pending",
      "queued",
      "sent_to_clearing",
    ].includes(status);

    const fundingFailed = [
      "canceled",
      "cancelled",
      "deleted",
      "rejected",
      "refused",
    ].includes(status);

    const knownStatus =
      fundingComplete || fundingPending || fundingFailed;

    // Fetch the latest account snapshot. A newly submitted journal
    // may take time to affect the balance.
    const updatedAccount = await alpacaRequest<AlpacaAccount>(
      `/v1/trading/accounts/${encodeURIComponent(
        tradingAccount.providerAccountId
      )}/account`
    );

    const balance = accountResponse(updatedAccount);

    const responseBody = {
      // success means the request was handled, not necessarily funded.
      success: !fundingFailed,
      fundingComplete,
      fundingPending,
      message: fundingComplete
        ? "Funding journal executed. Check the account balance to confirm the credit."
        : fundingPending
          ? "Funding request is pending. Do not submit it again; check the journal status later."
          : fundingFailed
            ? `Funding was not completed. Journal status: ${status}.`
            : `Unrecognized journal status: ${status || "unknown"}. Verify it before taking further action.`,
      funding: journalResponse(funding),
      balanceUpdated:
        fundingComplete && balance.cash > Number(account.cash),
      account: balance,
    };

    return NextResponse.json(responseBody, {
      status: fundingFailed ? 409 : fundingPending ? 202 : 200,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown funding error.";

    console.error("PAPER ACCOUNT FUNDING ERROR:", message);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit or verify sandbox funding.",
        error: message,
        code: "PAPER_FUNDING_FAILED",
      },
      { status: 502 }
    );
  }
}
