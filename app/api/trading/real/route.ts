
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import {connectDB }from "@/lib/db";
import TradingAccount from "@/models/TradingAccount";
import { alpacaRequest } from "@/lib/alpaca/broker";

type AlpacaAccount = {
  id: string;
  account_number?: string;
  status?: string;
  currency?: string;
  cash?: string;
  buying_power?: string;
  equity?: string;
  last_equity?: string;
};

type AlpacaPosition = {
  symbol: string;
  qty: string;
  side?: string;
  market_value?: string;
  cost_basis?: string;
  unrealized_pl?: string;
  unrealized_plpc?: string;
  current_price?: string;
  avg_entry_price?: string;
};

type AlpacaOrder = {
  id: string;
  symbol: string;
  qty?: string;
  side?: string;
  type?: string;
  status?: string;
  time_in_force?: string;
  filled_qty?: string;
  filled_avg_price?: string | null;
  submitted_at?: string;
  filled_at?: string | null;
};

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to load real trading account";
}

export async function GET() {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const localAccount = await TradingAccount.findOne({
      userId: user.id,
      provider: "alpaca",
      accountType: "live",
    }).lean();

    if (!localAccount) {
      return NextResponse.json(
        {
          success: false,
          message: "No real trading account found",
        },
        { status: 404 }
      );
    }

    const accountId = localAccount.providerAccountId;

    const [account, positions, orders] = await Promise.all([
      alpacaRequest<AlpacaAccount>(
        `/v1/trading/accounts/${accountId}/account`
      ),

      alpacaRequest<AlpacaPosition[]>(
        `/v1/trading/accounts/${accountId}/positions`
      ),

      alpacaRequest<AlpacaOrder[]>(
        `/v1/trading/accounts/${accountId}/orders?status=all&limit=50&direction=desc`
      ),
    ]);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        accountNumber: account.account_number ?? "",
        status: account.status ?? localAccount.status,
        currency: account.currency ?? "USD",
        cash: Number(account.cash ?? 0),
        buyingPower: Number(account.buying_power ?? 0),
        equity: Number(account.equity ?? account.last_equity ?? 0),
      },
      positions: Array.isArray(positions) ? positions : [],
      orders: Array.isArray(orders) ? orders : [],
    });
  } catch (error) {
    console.error("REAL TRADING GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: errorMessage(error),
      },
      { status: 500 }
    );
  }
}