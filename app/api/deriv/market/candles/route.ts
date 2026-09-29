import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";

export const runtime = "nodejs";

const DERIV_PUBLIC_WS =
  "wss://api.derivws.com/trading/v1/options/ws/public";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const symbol = searchParams.get("symbol");
  const granularityParam = searchParams.get("granularity");

  if (!symbol) {
    return NextResponse.json(
      {
        success: false,
        message: "Symbol is required",
        example:
          "/api/deriv/market/candles?symbol=frxEURUSD&granularity=60",
      },
      { status: 400 }
    );
  }

  if (!/^\w{2,30}$/.test(symbol)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid symbol format",
      },
      { status: 400 }
    );
  }

  const granularity = granularityParam
    ? Number(granularityParam)
    : 60;

  if (!Number.isInteger(granularity) || granularity <= 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid granularity",
      },
      { status: 400 }
    );
  }

  try {
    const candles = await getDerivCandles(
      symbol,
      granularity
    );

    return NextResponse.json({
      success: true,
      symbol,
      granularity,
      count: candles.length,
      candles,
    });
  } catch (error) {
    console.error("❌ DERIV CANDLES API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch Deriv candles",
      },
      { status: 500 }
    );
  }
}

function getDerivCandles(
  symbol: string,
  granularity: number
) {
  return new Promise<any[]>((resolve, reject) => {
    const ws = new WebSocket(DERIV_PUBLIC_WS);

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Deriv WebSocket timeout"));
    }, 10000);

    ws.on("open", () => {
      console.log(
        `✅ Connected to Deriv for candles: ${symbol}`
      );

      ws.send(
        JSON.stringify({
          ticks_history: symbol,
          count: 100,
          end: "latest",
          style: "candles",
          granularity,
          req_id: 3,
        })
      );
    });

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        console.log(
          "📩 Deriv candles response:",
          data.msg_type
        );

        if (data.error) {
          clearTimeout(timeout);
          ws.close();

          reject(
            new Error(
              data.error.message ||
                "Deriv API returned an error"
            )
          );

          return;
        }

        if (
          data.req_id === 3 &&
          data.msg_type === "candles"
        ) {
          clearTimeout(timeout);
          ws.close();

          const candles = Array.isArray(data.candles)
            ? data.candles.map((candle: any) => ({
                epoch: candle.epoch,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
              }))
            : [];

          resolve(candles);
        }
      } catch (error) {
        clearTimeout(timeout);
        ws.close();
        reject(error);
      }
    });

    ws.on("error", (error) => {
      clearTimeout(timeout);

      console.error(
        " Deriv candles WebSocket error:",
        error
      );

      reject(error);
    });
  });
}