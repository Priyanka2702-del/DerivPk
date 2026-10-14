
import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/session";
import {connectDB} from "@/lib/db";
import TradingAccount from "@/models/TradingAccount";
import { alpacaRequest } from "@/lib/alpaca/broker";


type OrderSide = "buy" | "sell";
type OrderType = "market" | "limit";
type TimeInForce = "day" | "gtc";

type AlpacaAccount = {
  id: string;
  account_number?: string;
  status?: string;
  currency?: string;

  cash?: string | number;
  buying_power?: string | number;
  equity?: string | number;
  last_equity?: string | number;

  portfolio_value?: string | number;

  trading_blocked?: boolean;
  account_blocked?: boolean;
  transfers_blocked?: boolean;

  pattern_day_trader?: boolean;
  daytrade_count?: number;

  multiplier?: string | number;
  initial_margin?: string | number;
  maintenance_margin?: string | number;
  last_maintenance_margin?: string | number;

  created_at?: string;
  updated_at?: string;
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
  client_order_id?: string;
  symbol: string;
  side: string;
  type: string;
  time_in_force: string;
  qty?: string;
  filled_qty?: string;
  filled_avg_price?: string | null;
  status: string;
  limit_price?: string | null;
  stop_price?: string | null;
  created_at?: string;
  submitted_at?: string;
  filled_at?: string | null;
};

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeSymbol(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown trading error";
}

function getStatusFromAlpacaError(message: string): number {
  if (message.includes("404")) {
    return 404;
  }

  if (
    message.includes("409") ||
    message.toLowerCase().includes("conflict")
  ) {
    return 409;
  }

  if (
    message.includes("422") ||
    message.toLowerCase().includes("unprocessable")
  ) {
    return 422;
  }

  if (
    message.includes("403") ||
    message.toLowerCase().includes("forbidden")
  ) {
    return 403;
  }

  if (
    message.includes("401") ||
    message.toLowerCase().includes("unauthorized")
  ) {
    return 401;
  }

  if (
    message.includes("400") ||
    message.toLowerCase().includes("bad request")
  ) {
    return 400;
  }

  return 502;
}

function buildAccountDiagnostics(account: AlpacaAccount) {
  const cash = toNumber(account.cash);
  const equity = toNumber(
    account.equity ?? account.portfolio_value ?? account.last_equity
  );
  const buyingPower = toNumber(account.buying_power);

  return {
    id: account.id,
    accountNumber: account.account_number ?? null,

    status: account.status ?? null,
    currency: account.currency ?? "USD",

    cash,
    equity,
    buyingPower,

    tradingBlocked: Boolean(account.trading_blocked),
    accountBlocked: Boolean(account.account_blocked),
    transfersBlocked: Boolean(account.transfers_blocked),

    patternDayTrader: Boolean(account.pattern_day_trader),
    daytradeCount: account.daytrade_count ?? 0,

    multiplier: account.multiplier ?? null,

    canTrade:
      account.status === "ACTIVE" &&
      !account.trading_blocked &&
      !account.account_blocked,

    hasBuyingPower: buyingPower > 0,

    warning:
      account.account_blocked
        ? "This account is blocked."
        : account.trading_blocked
          ? "Trading is blocked on this account."
          : account.status !== "ACTIVE"
            ? `Account status is ${account.status ?? "unknown"}.`
            : buyingPower <= 0
              ? "Account has no buying power. Buy orders will fail until the paper account has simulated buying power."
              : null,
  };
}

/**
 * GET
 *
 * Returns:
 * - account diagnostics
 * - positions
 * - orders
 *
 * This endpoint is intentionally read-only.
 */
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

    const providerAccountId = tradingAccount.providerAccountId;

    try {
      const [account, positions, orders] = await Promise.all([
        alpacaRequest<AlpacaAccount>(
          `/v1/trading/accounts/${providerAccountId}/account`
        ),

        alpacaRequest<AlpacaPosition[]>(
          `/v1/trading/accounts/${providerAccountId}/positions`
        ),

        alpacaRequest<AlpacaOrder[]>(
          `/v1/trading/accounts/${providerAccountId}/orders?status=all&limit=50&direction=desc`
        ),
      ]);

      const diagnostics = buildAccountDiagnostics(account);

      return NextResponse.json({
        success: true,

        account: {
          id: account.id,
          accountNumber: account.account_number ?? null,
          status: account.status ?? null,
          currency: account.currency ?? "USD",

          cash: toNumber(account.cash),
          equity: toNumber(
            account.equity ??
              account.portfolio_value ??
              account.last_equity
          ),
          buyingPower: toNumber(account.buying_power),
        },

        accountDiagnostics: diagnostics,

        positions: Array.isArray(positions) ? positions : [],

        orders: Array.isArray(orders) ? orders : [],

        localAccount: {
          id: String(tradingAccount._id),
          accountType: tradingAccount.accountType,
          provider: tradingAccount.provider,
          providerAccountId: tradingAccount.providerAccountId,
          status: tradingAccount.status,
        },
      });
   
} catch (error) {
  const err = error as Error & {
    cause?: {
      code?: string;
      message?: string;
    };
  };

  const message = getErrorMessage(error);

  console.error("DEMO ACCOUNT FETCH DIAGNOSTICS:", {
    name: err.name,
    message: err.message,
    causeCode: err.cause?.code,
    causeMessage: err.cause?.message,
  });


      return NextResponse.json(
        {
          success: false,
          message: "Unable to fetch paper trading account.",
          error: message,
          code: "ALPACA_ACCOUNT_FETCH_FAILED",
        },
        {
          status: getStatusFromAlpacaError(message),
        }
      );
    }
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("DEMO GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load demo trading data.",
        error: message,
        code: "DEMO_GET_FAILED",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 *
 * Creates a paper Buy/Sell order.
 */
export async function POST(request: NextRequest) {
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

    let body: {
      symbol?: string;
      side?: OrderSide;
      type?: OrderType;
      timeInForce?: TimeInForce;
      qty?: number | string;
      limitPrice?: number | string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
          code: "INVALID_JSON",
        },
        { status: 400 }
      );
    }

    const symbol = normalizeSymbol(body.symbol);
    const side = body.side;
    const type = body.type;
    const timeInForce = body.timeInForce;

    const qty = toNumber(body.qty);
    const limitPrice =
      body.limitPrice === undefined ||
      body.limitPrice === null ||
      body.limitPrice === ""
        ? undefined
        : toNumber(body.limitPrice);

    /**
     * Basic validation
     */
    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          message: "Symbol is required.",
          code: "SYMBOL_REQUIRED",
        },
        { status: 400 }
      );
    }

    if (side !== "buy" && side !== "sell") {
      return NextResponse.json(
        {
          success: false,
          message: "Side must be either buy or sell.",
          code: "INVALID_SIDE",
        },
        { status: 400 }
      );
    }

    if (type !== "market" && type !== "limit") {
      return NextResponse.json(
        {
          success: false,
          message: "Order type must be market or limit.",
          code: "INVALID_ORDER_TYPE",
        },
        { status: 400 }
      );
    }

    if (timeInForce !== "day" && timeInForce !== "gtc") {
      return NextResponse.json(
        {
          success: false,
          message: "Time in force must be day or gtc.",
          code: "INVALID_TIME_IN_FORCE",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be greater than 0.",
          code: "INVALID_QUANTITY",
        },
        { status: 400 }
      );
    }

    if (
      type === "limit" &&
      (!Number.isFinite(limitPrice) || Number(limitPrice) <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid limit price is required for a limit order.",
          code: "INVALID_LIMIT_PRICE",
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

    const providerAccountId = tradingAccount.providerAccountId;

    /**
     * Always fetch the latest account before submitting an order.
     *
     * This prevents us from showing an order form when the actual
     * Alpaca account is blocked or has zero buying power.
     */
    let account: AlpacaAccount;

    try {
      account = await alpacaRequest<AlpacaAccount>(
        `/v1/trading/accounts/${providerAccountId}/account`
      );
    } catch (error) {
      const message = getErrorMessage(error);

      console.error("DEMO ACCOUNT DIAGNOSTIC ERROR:", {
        userId: user.id,
        providerAccountId,
        message,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify the paper trading account.",
          error: message,
          code: "ACCOUNT_DIAGNOSTIC_FAILED",
        },
        {
          status: getStatusFromAlpacaError(message),
        }
      );
    }

    const diagnostics = buildAccountDiagnostics(account);

    /**
     * Account-level checks
     */
    if (account.account_blocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This paper account is blocked. Trading orders cannot be submitted.",
          code: "ACCOUNT_BLOCKED",
          accountDiagnostics: diagnostics,
        },
        { status: 409 }
      );
    }

    if (account.trading_blocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Trading is currently blocked on this paper account.",
          code: "TRADING_BLOCKED",
          accountDiagnostics: diagnostics,
        },
        { status: 409 }
      );
    }

    if (account.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: `Trading account is not active. Current status: ${
            account.status ?? "unknown"
          }.`,
          code: "ACCOUNT_NOT_ACTIVE",
          accountDiagnostics: diagnostics,
        },
        { status: 409 }
      );
    }

    /**
     * BUY validation
     *
     * We don't know the exact market price here, so this is only
     * a basic account-level check. Alpaca remains the final authority.
     */
    if (side === "buy" && diagnostics.buyingPower <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Buy order cannot be submitted because this paper account has $0 buying power.",
          code: "INSUFFICIENT_BUYING_POWER",
          accountDiagnostics: diagnostics,
          hint:
            "The paper account must have simulated buying power before a Buy order can execute.",
        },
        { status: 409 }
      );
    }

    /**
     * SELL validation
     *
     * Verify that the requested position exists and has enough quantity.
     */
    if (side === "sell") {
      try {
        const positions = await alpacaRequest<AlpacaPosition[]>(
          `/v1/trading/accounts/${providerAccountId}/positions`
        );

        const position = Array.isArray(positions)
          ? positions.find(
              (item) =>
                normalizeSymbol(item.symbol) === symbol
            )
          : null;

        if (!position) {
          return NextResponse.json(
            {
              success: false,
              message: `You do not currently hold a ${symbol} position.`,
              code: "POSITION_NOT_FOUND",
              symbol,
              accountDiagnostics: diagnostics,
            },
            { status: 409 }
          );
        }

        const availableQty = Math.abs(
          toNumber(position.qty)
        );

        if (qty > availableQty) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot sell ${qty} shares of ${symbol}. You only have ${availableQty} shares.`,
              code: "INSUFFICIENT_POSITION",
              symbol,
              requestedQuantity: qty,
              availableQuantity: availableQty,
              accountDiagnostics: diagnostics,
            },
            { status: 409 }
          );
        }
      } catch (error) {
        const message = getErrorMessage(error);

        console.error("DEMO POSITION CHECK ERROR:", {
          userId: user.id,
          providerAccountId,
          symbol,
          message,
        });

        return NextResponse.json(
          {
            success: false,
            message: "Unable to verify the existing position.",
            error: message,
            code: "POSITION_CHECK_FAILED",
            accountDiagnostics: diagnostics,
          },
          {
            status: getStatusFromAlpacaError(message),
          }
        );
      }
    }

    /**
     * Build Alpaca order payload
     */
    const orderPayload: Record<string, unknown> = {
      symbol,
      qty: String(qty),
      side,
      type,
      time_in_force: timeInForce,
    };

    if (type === "limit") {
      orderPayload.limit_price = String(limitPrice);
    }

    console.log("CREATING PAPER ORDER:", {
      userId: user.id,
      providerAccountId,
      symbol,
      side,
      type,
      timeInForce,
      qty,
      limitPrice: type === "limit" ? limitPrice : undefined,

      accountDiagnostics: {
        status: diagnostics.status,
        cash: diagnostics.cash,
        equity: diagnostics.equity,
        buyingPower: diagnostics.buyingPower,
        tradingBlocked: diagnostics.tradingBlocked,
        accountBlocked: diagnostics.accountBlocked,
      },
    });

    try {
      const order = await alpacaRequest<AlpacaOrder>(
        `/v1/trading/accounts/${providerAccountId}/orders`,
        {
          method: "POST",
          body: JSON.stringify(orderPayload),
        }
      );

      return NextResponse.json(
        {
          success: true,
          message: `${side.toUpperCase()} order submitted successfully.`,

          order,

          accountDiagnostics: diagnostics,
        },
        { status: 201 }
      );
    } catch (error) {
      const message = getErrorMessage(error);

      console.error("DEMO ORDER CREATION ERROR:", {
        userId: user.id,
        providerAccountId,
        symbol,
        side,
        type,
        qty,
        limitPrice,
        message,
      });

      /**
       * Convert common Alpaca errors into user-friendly messages.
       */
      let userMessage = "Paper order could not be submitted.";
      let code = "ORDER_SUBMISSION_FAILED";

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("buying power") ||
        lowerMessage.includes("insufficient")
      ) {
        userMessage =
          "Order rejected because the paper account does not have enough buying power.";
        code = "INSUFFICIENT_BUYING_POWER";
      } else if (
        lowerMessage.includes("position") &&
        lowerMessage.includes("sell")
      ) {
        userMessage =
          "Sell order rejected because the requested position or quantity is not available.";
        code = "SELL_POSITION_ERROR";
      } else if (
        lowerMessage.includes("trading blocked")
      ) {
        userMessage =
          "Trading is blocked on this paper account.";
        code = "TRADING_BLOCKED";
      } else if (
        lowerMessage.includes("account blocked")
      ) {
        userMessage =
          "This paper account is blocked.";
        code = "ACCOUNT_BLOCKED";
      } else if (
        lowerMessage.includes("market") &&
        lowerMessage.includes("closed")
      ) {
        userMessage =
          "The market is currently closed for this order.";
        code = "MARKET_CLOSED";
      }

      return NextResponse.json(
        {
          success: false,
          message: userMessage,
          error: message,
          code,

          symbol,
          side,
          type,
          qty,

          accountDiagnostics: diagnostics,
        },
        {
          status: getStatusFromAlpacaError(message),
        }
      );
    }
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("DEMO POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process paper trading order.",
        error: message,
        code: "DEMO_ORDER_FAILED",
      },
      { status: 500 }
    );
  }
}