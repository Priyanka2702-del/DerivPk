
import { NextRequest, NextResponse } from "next/server";

const ALPACA_AUTH_URL =
  process.env.ALPACA_AUTH_URL ||
  "https://authx.sandbox.alpaca.markets";

const ALPACA_DATA_URL =
  process.env.ALPACA_DATA_URL ||
  "https://data.sandbox.alpaca.markets";

const DEFAULT_SYMBOLS = [
  "AAPL",
  "TSLA",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
];

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 15000;

type AlpacaSnapshot = {
  latestTrade?: {
    p?: number;
    s?: number;
    t?: string;
  };

  latestQuote?: {
    ap?: number;
    as?: number;
    bp?: number;
    bs?: number;
    t?: string;
  };

  minuteBar?: {
    o?: number;
    h?: number;
    l?: number;
    c?: number;
    v?: number;
    t?: string;
  };

  dailyBar?: {
    o?: number;
    h?: number;
    l?: number;
    c?: number;
    v?: number;
    t?: string;
  };

  prevDailyBar?: {
    o?: number;
    h?: number;
    l?: number;
    c?: number;
    v?: number;
    t?: string;
  };
};

type AlpacaSnapshotsResponse = Record<
  string,
  AlpacaSnapshot
>;

type OAuthResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT
) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function getAlpacaToken(): Promise<string> {
  const clientId =
    process.env.ALPACA_BROKER_CLIENT_ID;

  const clientSecret =
    process.env.ALPACA_BROKER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "ALPACA_BROKER_CLIENT_ID or ALPACA_BROKER_CLIENT_SECRET is missing."
    );
  }

  let lastError: unknown = null;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      console.log(
        `ALPACA MARKET AUTH ATTEMPT ${attempt}/${MAX_RETRIES}`
      );

      const body = new URLSearchParams();

      body.set(
        "grant_type",
        "client_credentials"
      );

      body.set(
        "client_id",
        clientId
      );

      body.set(
        "client_secret",
        clientSecret
      );

      const response =
        await fetchWithTimeout(
          `${ALPACA_AUTH_URL}/v1/oauth2/token`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
              Accept: "application/json",
            },

            body: body.toString(),

            cache: "no-store",
          }
        );

      const text = await response.text();

      let data: OAuthResponse;

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          `Invalid Alpaca OAuth response. HTTP ${response.status}`
        );
      }

      console.log(
        "ALPACA MARKET AUTH RESPONSE:",
        {
          attempt,
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          error_description:
            data.error_description,
        }
      );

      if (
        !response.ok ||
        !data.access_token
      ) {
        throw new Error(
          data.error_description ||
            data.error ||
            `Alpaca authentication failed. HTTP ${response.status}`
        );
      }

      return data.access_token;
    } catch (error) {
      lastError = error;

      console.error(
        `ALPACA MARKET AUTH ATTEMPT ${attempt} FAILED:`,
        error
      );

      if (attempt < MAX_RETRIES) {
        await sleep(attempt * 1000);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Unable to connect to Alpaca authentication service."
      );
}

async function getMarketSnapshots(
  token: string,
  symbols: string[]
): Promise<AlpacaSnapshotsResponse> {
  const url = new URL(
    "/v2/stocks/snapshots",
    ALPACA_DATA_URL
  );

  url.searchParams.set(
    "symbols",
    symbols.join(",")
  );

  url.searchParams.set(
    "feed",
    "iex"
  );

  let lastError: unknown = null;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      console.log(
        `ALPACA MARKET DATA ATTEMPT ${attempt}/${MAX_RETRIES}`
      );

      const response =
        await fetchWithTimeout(
          url.toString(),
          {
            method: "GET",

            headers: {
              Accept: "application/json",
              Authorization:
                `Bearer ${token}`,
            },

            cache: "no-store",
          }
        );

      const text = await response.text();

      let data:
        | AlpacaSnapshotsResponse
        | {
            message?: string;
            code?: string;
          };

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          `Invalid Alpaca market response. HTTP ${response.status}`
        );
      }

      console.log(
        "ALPACA MARKET DATA RESPONSE:",
        {
          attempt,
          status: response.status,
          statusText: response.statusText,
        }
      );

      if (!response.ok) {
        let message =
          `Alpaca market request failed. HTTP ${response.status}`;

        if (
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof data.message === "string"
        ) {
          message = data.message;
        }

        throw new Error(message);
      }

      return data as AlpacaSnapshotsResponse;
    } catch (error) {
      lastError = error;

      console.error(
        `ALPACA MARKET DATA ATTEMPT ${attempt} FAILED:`,
        error
      );

      if (attempt < MAX_RETRIES) {
        await sleep(attempt * 1000);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Unable to fetch Alpaca market data."
      );
}

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const symbolsParam =
      searchParams.get("symbols");

    const symbols = (
      symbolsParam
        ? symbolsParam
            .split(",")
            .map((symbol) =>
              symbol.trim().toUpperCase()
            )
            .filter(Boolean)
        : DEFAULT_SYMBOLS
    ).slice(0, 50);

    if (symbols.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "At least one symbol is required.",
        },
        { status: 400 }
      );
    }

    const token =
      await getAlpacaToken();

    const snapshots =
      await getMarketSnapshots(
        token,
        symbols
      );

    const market = symbols.map(
      (symbol) => {
        const snapshot =
          snapshots[symbol];

        if (!snapshot) {
          return {
            symbol,
            available: false,
            price: null,
            bid: null,
            ask: null,
            dayOpen: null,
            dayHigh: null,
            dayLow: null,
            dayClose: null,
            previousClose: null,
            volume: null,
            change: null,
            changePercent: null,
            timestamp: null,
          };
        }

        const tradePrice =
          snapshot.latestTrade?.p ??
          null;

        const bid =
          snapshot.latestQuote?.bp ??
          null;

        const ask =
          snapshot.latestQuote?.ap ??
          null;

        const quoteMid =
          bid !== null &&
          ask !== null
            ? (bid + ask) / 2
            : null;

        const price =
          tradePrice ?? quoteMid;

        const previousClose =
          snapshot.prevDailyBar?.c ??
          null;

        const change =
          price !== null &&
          previousClose !== null
            ? price - previousClose
            : null;

        const changePercent =
          change !== null &&
          previousClose !== null &&
          previousClose !== 0
            ? (change / previousClose) * 100
            : null;

        return {
          symbol,
          available: true,

          price,

          bid,
          ask,

          dayOpen:
            snapshot.dailyBar?.o ??
            null,

          dayHigh:
            snapshot.dailyBar?.h ??
            null,

          dayLow:
            snapshot.dailyBar?.l ??
            null,

          dayClose:
            snapshot.dailyBar?.c ??
            null,

          previousClose,

          volume:
            snapshot.dailyBar?.v ??
            snapshot.minuteBar?.v ??
            null,

          change,

          changePercent,

          timestamp:
            snapshot.latestTrade?.t ??
            snapshot.latestQuote?.t ??
            snapshot.dailyBar?.t ??
            null,
        };
      }
    );

    return NextResponse.json({
      success: true,
      source: "alpaca",
      environment: "sandbox",
      feed: "iex",
      count: market.length,
      market,
    });
  } catch (error) {
    console.error(
      "MARKET DATA ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch market data.",
      },
      { status: 500 }
    );
  }
}

