
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

/**
 * Check the status of an existing funding journal.
 * Does not create a new funding request.
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

    if (
      !journalId ||
      !/^[0-9a-f-]{36}$/i.test(journalId)
    ) {
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

    // Only disclose the status if this journal targets
    // the currently logged-in user's paper account.
    if (
      journal.to_account !==
      tradingAccount.providerAccountId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This journal does not belong to your paper account.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      journal: {
        id: journal.id,
        status: journal.status,
        amount: journal.amount,
        currency: journal.currency || "USD",
        createdAt: journal.created_at,
      },
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
        {
          success: false,
          message: "Unauthorized.",
        },
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

    const roundedAmount =
      Math.round(amount * 100) / 100;

    if (roundedAmount < 0.01) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Funding amount must be at least $0.01.",
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

    if (
      account.account_blocked ||
      account.transfers_blocked
    ) {
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

    const updatedAccount =
      await alpacaRequest<AlpacaAccount>(
        `/v1/trading/accounts/${encodeURIComponent(
          tradingAccount.providerAccountId
        )}/account`
      );

    const balance = accountResponse(updatedAccount);

    return NextResponse.json(
      {
        success: true,
        message:
          "Sandbox funding journal submitted. Check its status before submitting another request.",
        funding: {
          id: funding.id,
          status: funding.status,
          amount: funding.amount,
          currency: funding.currency || "USD",
          createdAt: funding.created_at,
        },
        balanceUpdated:
          balance.cash > Number(account.cash),
        account: balance,
      },
      { status: 200 }
    );
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
