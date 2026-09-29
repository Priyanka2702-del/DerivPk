import { NextRequest } from "next/server";
import WebSocket from "ws";

export const runtime = "nodejs";

const DERIV_PUBLIC_WS =
  "wss://api.derivws.com/trading/v1/options/ws/public";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Symbol is required",
        example:
          "/api/deriv/market/stream?symbol=frxEURUSD",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (!/^\w{2,30}$/.test(symbol)) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Invalid symbol format",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const encoder = new TextEncoder();

  let derivWs: WebSocket | null = null;
  let heartbeat: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const closeEverything = () => {
        if (closed) return;

        closed = true;

        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = null;
        }

        if (derivWs) {
          try {
            derivWs.close();
          } catch {}
          derivWs = null;
        }

        try {
          controller.close();
        } catch {}
      };

      const sendEvent = (data: unknown) => {
        if (closed) return;

        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify(data)}\n\n`
            )
          );
        } catch {
          closeEverything();
        }
      };

      derivWs = new WebSocket(DERIV_PUBLIC_WS);

      derivWs.on("open", () => {
        console.log(
          `✅ Live stream connected: ${symbol}`
        );

        derivWs?.send(
          JSON.stringify({
            ticks: [symbol],
            subscribe: 1,
            req_id: 100,
          })
        );

        sendEvent({
          type: "connected",
          symbol,
        });

        heartbeat = setInterval(() => {
          if (!closed) {
            try {
              controller.enqueue(
                encoder.encode(`: heartbeat\n\n`)
              );
            } catch {
              closeEverything();
            }
          }
        }, 15000);
      });

      derivWs.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());

          if (data.error) {
            console.error(
              "❌ Deriv stream error:",
              data.error
            );

            sendEvent({
              type: "error",
              message:
                data.error.message ||
                "Deriv API error",
            });

            closeEverything();
            return;
          }

          if (
            data.msg_type === "tick" &&
            data.tick
          ) {
            sendEvent({
              type: "tick",
              symbol: data.tick.symbol,
              quote: data.tick.quote,
              epoch: data.tick.epoch,
            });
          }
        } catch (error) {
          console.error(
            "❌ Stream message parse error:",
            error
          );
        }
      });

      derivWs.on("error", (error) => {
        console.error(
          "❌ Deriv live stream WebSocket error:",
          error
        );

        sendEvent({
          type: "error",
          message: "Deriv WebSocket error",
        });

        closeEverything();
      });

      derivWs.on("close", () => {
        console.log(
          `🔌 Live stream closed: ${symbol}`
        );

        closeEverything();
      });

      request.signal.addEventListener(
        "abort",
        () => {
          console.log(
            `🛑 Client disconnected: ${symbol}`
          );

          closeEverything();
        },
        { once: true }
      );
    },

    cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }

      if (derivWs) {
        try {
          derivWs.close();
        } catch {}
        derivWs = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}