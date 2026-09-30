import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";

export const runtime = "nodejs";

const DERIV_PUBLIC_WS =
  "wss://api.derivws.com/trading/v1/options/ws/public";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      {
        success: false,
        message: "Symbol is required",
        example: "/api/deriv/market/tick?symbol=frxEURUSD",
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

  try {
    const tick = await getDerivTick(symbol);

    return NextResponse.json({
      success: true,
      symbol,
      tick,
    });
  } catch (error) {
    console.error("❌ DERIV TICK API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch Deriv tick",
      },
      { status: 500 }
    );
  }
}

function getDerivTick(symbol: string) {
  return new Promise(
    (resolve, reject) => {
      const ws = new WebSocket(DERIV_PUBLIC_WS);

      const timeout = setTimeout(() => {
        ws.close();

        reject(
          new Error("Deriv WebSocket timeout")
        );
      }, 10000);

      ws.on("open", () => {
        console.log(
          `✅ Connected to Deriv for tick: ${symbol}`
        );

        ws.send(
          JSON.stringify({
            ticks: [symbol],
            subscribe: 1,
            req_id: 2,
          })
        );
      });

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(
            message.toString()
          );

          if (data.error) {
            clearTimeout(timeout);
            ws.close();

            reject(
              new Error(
                data.error.message ||
                  "Deriv API error"
              )
            );

            return;
          }

          if (
            data.msg_type === "tick" &&
            data.tick
          ) {
            clearTimeout(timeout);

            const result = {
              symbol: data.tick.symbol,
              quote: data.tick.quote,
              epoch: data.tick.epoch,
            };

            ws.close();

            resolve(result);
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
          "❌ Deriv tick WebSocket error:",
          error
        );

        reject(error);
      });
    }
  );
}