
import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/session";
import { connectDB } from "@/lib/db";
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
  notional?: string;
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
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown trading error";
}

function getStatusFromAlpacaError(message: string): number {
  const lower = message.toLowerCase();

  if (message.includes("404")) return 404;
  if (message.includes("409") || lower.includes("conflict")) return 409;
  if (
    message.includes("422") ||
    lower.includes("unprocessable")
  ) return 422;
  if (
    message.includes("403") ||
    lower.includes("forbidden")
  ) return 403;
  if (
    message.includes("401") ||
    lower.includes("unauthorized")
  ) return 401;
  if (
    message.includes("400") ||
    lower.includes("bad request")
  ) return 400;

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

    warning: account.account_blocked
      ? "This account is blocked."
      : account.trading_blocked
        ? "Trading is blocked on this account."
        : account.status !== "ACTIVE"
          ? `Account status is ${account.status ?? "unknown"}.`
          : buyingPower <= 0
            ? "Account has no buying power."
            : null,
  };
}

/**
 * GET
 * Returns the authenticated user's own paper account, positions and orders.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
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
      const message = getErrorMessage(error);

      console.error("DEMO ACCOUNT FETCH DIAGNOSTICS:", {
        message,
        providerAccountId,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Unable to fetch paper trading account.",
          error: message,
          code: "ALPACA_ACCOUNT_FETCH_FAILED",
        },
        { status: getStatusFromAlpacaError(message) }
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
 * Supports:
 * - Market orders by dollar amount: { notional: "25.00" }
 * - Orders by share quantity: { qty: "1" }
 * - Limit orders by quantity and limitPrice
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: {
      symbol?: string;
      side?: OrderSide;
      type?: OrderType;
      timeInForce?: TimeInForce;
      qty?: number | string;
      notional?: number | string;
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
    const timeInForce = body.timeInForce ?? "day";

    const hasNotional =
      body.notional !== undefined &&
      body.notional !== null &&
      body.notional !== "";

    const amount = hasNotional ? Number(body.notional) : undefined;
    const qty = hasNotional ? undefined : Number(body.qty);

    const limitPrice =
      body.limitPrice === undefined ||
      body.limitPrice === null ||
      body.limitPrice === ""
        ? undefined
        : Number(body.limitPrice);

    // Basic request validation
    if (!/^[A-Z][A-Z0-9.-]{0,19}$/.test(symbol)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid stock symbol.",
          code: "INVALID_SYMBOL",
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

    // Dollar-amount orders are market/day orders only.
    if (hasNotional && (type !== "market" || timeInForce !== "day")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Dollar-amount orders are supported for market orders with day time-in-force only.",
          code: "NOTIONAL_ORDER_NOT_SUPPORTED",
        },
        { status: 400 }
      );
    }

    if (hasNotional) {
      if (
        !Number.isFinite(amount) ||
        amount! < 1 ||
        Math.abs(amount! * 100 - Math.round(amount! * 100)) > 1e-7
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Order amount must be at least $1.00 and have at most two decimal places.",
            code: "INVALID_NOTIONAL",
          },
          { status: 400 }
        );
      }
    } else if (!Number.isFinite(qty) || qty! <= 0) {
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
      (!Number.isFinite(limitPrice) || limitPrice! <= 0)
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

    // Always resolve the account from the authenticated user's database record.
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
        { status: getStatusFromAlpacaError(message) }
      );
    }

    const diagnostics = buildAccountDiagnostics(account);

    if (account.account_blocked || account.trading_blocked) {
      return NextResponse.json(
        {
          success: false,
          message: account.account_blocked
            ? "This paper account is blocked."
            : "Trading is blocked on this paper account.",
          code: account.account_blocked
            ? "ACCOUNT_BLOCKED"
            : "TRADING_BLOCKED",
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

    // BUY checks: compare dollar amount or limit order's estimated cost.
    if (side === "buy") {
      if (diagnostics.buyingPower <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Your demo account has no available buying power.",
            code: "INSUFFICIENT_BUYING_POWER",
            accountDiagnostics: diagnostics,
          },
          { status: 409 }
        );
      }

      if (hasNotional && amount! > diagnostics.buyingPower) {
        return NextResponse.json(
          {
            success: false,
            message: `Order amount ${amount!.toFixed(
              2
            )} USD exceeds your available buying power of ${diagnostics.buyingPower.toFixed(
              2
            )} USD.`,
            code: "INSUFFICIENT_BUYING_POWER",
            availableBuyingPower: diagnostics.buyingPower,
            requestedAmount: amount,
            accountDiagnostics: diagnostics,
          },
          { status: 409 }
        );
      }

      if (
        !hasNotional &&
        type === "limit" &&
        qty! * limitPrice! > diagnostics.buyingPower
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The estimated limit order cost exceeds your available buying power.",
            code: "INSUFFICIENT_BUYING_POWER",
            availableBuyingPower: diagnostics.buyingPower,
            estimatedOrderCost: qty! * limitPrice!,
            accountDiagnostics: diagnostics,
          },
          { status: 409 }
        );
      }
    }

    // SELL checks: verify that this account owns the position.
    if (side === "sell") {
      let position: AlpacaPosition | undefined;

      try {
        const positions = await alpacaRequest<AlpacaPosition[]>(
          `/v1/trading/accounts/${providerAccountId}/positions`
        );

        position = Array.isArray(positions)
          ? positions.find(
              (item) => normalizeSymbol(item.symbol) === symbol
            )
          : undefined;
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
            message: "Unable to verify your existing position.",
            error: message,
            code: "POSITION_CHECK_FAILED",
          },
          { status: getStatusFromAlpacaError(message) }
        );
      }

      if (!position) {
        return NextResponse.json(
          {
            success: false,
            message: `You do not currently hold a ${symbol} position.`,
            code: "POSITION_NOT_FOUND",
          },
          { status: 409 }
        );
      }

      if (String(position.side ?? "").toLowerCase() === "short") {
        return NextResponse.json(
          {
            success: false,
            message:
              "This is a short position. Use the appropriate position-closing action instead.",
            code: "SHORT_POSITION_NOT_SELLABLE",
          },
          { status: 409 }
        );
      }

      const availableQty = Math.max(0, toNumber(position.qty));
      const positionValue = Math.abs(
        toNumber(position.market_value) ||
          availableQty * toNumber(position.current_price)
      );

      if (!hasNotional && qty! > availableQty) {
        return NextResponse.json(
          {
            success: false,
            message: `You requested ${qty} shares, but only ${availableQty} shares of ${symbol} are available.`,
            code: "INSUFFICIENT_POSITION",
            requestedQuantity: qty,
            availableQuantity: availableQty,
          },
          { status: 409 }
        );
      }

      if (hasNotional && amount! > positionValue) {
        return NextResponse.json(
          {
            success: false,
            message: `The requested sell amount exceeds the current estimated market value of your ${symbol} position (${positionValue.toFixed(
              2
            )} USD).`,
            code: "INSUFFICIENT_POSITION_VALUE",
            requestedAmount: amount,
            availablePositionValue: positionValue,
          },
          { status: 409 }
        );
      }
    }

    // Alpaca accepts either qty or notional; never send both.
    const orderPayload: Record<string, unknown> = {
      symbol,
      side,
      type,
      time_in_force: timeInForce,
    };

    if (hasNotional) {
      orderPayload.notional = amount!.toFixed(2);
    } else {
      orderPayload.qty = String(qty);
    }

    if (type === "limit") {
      orderPayload.limit_price = limitPrice!.toFixed(2);
    }

    console.log("CREATING PAPER ORDER:", {
      userId: user.id,
      providerAccountId,
      symbol,
      side,
      type,
      timeInForce,
      notional: hasNotional ? amount : undefined,
      qty: hasNotional ? undefined : qty,
    });

    try {
      const order = await alpacaRequest<AlpacaOrder>(
        `/v1/trading/accounts/${providerAccountId}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
      const lowerMessage = message.toLowerCase();

      console.error("DEMO ORDER CREATION ERROR:", {
        userId: user.id,
        providerAccountId,
        symbol,
        side,
        type,
        notional: hasNotional ? amount : undefined,
        qty: hasNotional ? undefined : qty,
        message,
      });

      let userMessage = "Paper order could not be submitted.";
      let code = "ORDER_SUBMISSION_FAILED";

      if (
        lowerMessage.includes("buying power") ||
        lowerMessage.includes("insufficient")
      ) {
        userMessage =
          "Order rejected because the paper account does not have enough buying power or available position value.";
        code = "INSUFFICIENT_BUYING_POWER";
      } else if (
        lowerMessage.includes("position") &&
        lowerMessage.includes("sell")
      ) {
        userMessage =
          "Sell order rejected because the requested position or quantity is not available.";
        code = "SELL_POSITION_ERROR";
      } else if (lowerMessage.includes("trading blocked")) {
        userMessage = "Trading is blocked on this paper account.";
        code = "TRADING_BLOCKED";
      } else if (lowerMessage.includes("account blocked")) {
        userMessage = "This paper account is blocked.";
        code = "ACCOUNT_BLOCKED";
      } else if (
        lowerMessage.includes("market") &&
        lowerMessage.includes("closed")
      ) {
        userMessage = "The market is currently closed for this order.";
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
          notional: hasNotional ? amount : undefined,
          qty: hasNotional ? undefined : qty,
          accountDiagnostics: diagnostics,
        },
        { status: getStatusFromAlpacaError(message) }
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
