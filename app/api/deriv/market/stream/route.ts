import { NextRequest } from "next/server";

import {
  DERIV_PUBLIC_WS,
} from "@/lib/deriv-market";

import WebSocket from "ws";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest
) {
  const symbol =
    request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Symbol is required",
      }),
      {
        status: 400,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );
  }

  const encoder = new TextEncoder();

  let derivSocket:
    | WebSocket
    | null = null;

  let heartbeat:
    | ReturnType<typeof setInterval>
    | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (
        data: unknown
      ) => {
        if (closed) {
          return;
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify(
              data
            )}\n\n`
          )
        );
      };

      const closeStream = () => {
        if (closed) {
          return;
        }

        closed = true;

        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = null;
        }

        if (derivSocket) {
          try {
            derivSocket.close();
          } catch {}

          derivSocket = null;
        }

        try {
          controller.close();
        } catch {}
      };

      derivSocket = new WebSocket(
        DERIV_PUBLIC_WS
      );

      derivSocket.on("open", () => {
        console.log(
          "DERIV STREAM CONNECTED:",
          symbol
        );

        send({
          type: "connected",
          symbol,
        });

        derivSocket?.send(
          JSON.stringify({
            ticks: [symbol],
            subscribe: 1,
            req_id: 100,
          })
        );
      });

      derivSocket.on("message", (message) => {
        try {
          const data = JSON.parse(
            message.toString()
          );

          if (data.error) {
            console.error(
              "DERIV STREAM ERROR:",
              data.error
            );

            send({
              type: "error",
              message:
                data.error.message ||
                "Deriv stream error",
            });

            return;
          }

          if (data.tick) {
            send({
              type: "tick",
              symbol:
                data.tick.symbol,
              quote: Number(
                data.tick.quote
              ),
              epoch: Number(
                data.tick.epoch
              ),
            });
          }
        } catch (error) {
          console.error(
            "DERIV STREAM PARSE ERROR:",
            error
          );
        }
      });

      derivSocket.on("error", (error) => {
        console.error(
          "DERIV WEBSOCKET ERROR:",
          error
        );

        send({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Deriv WebSocket error",
        });

        closeStream();
      });

      derivSocket.on("close", () => {
        console.log(
          "DERIV STREAM CLOSED:",
          symbol
        );

        closeStream();
      });

      heartbeat = setInterval(() => {
        send({
          type: "heartbeat",
        });
      }, 15000);

      request.signal.addEventListener(
        "abort",
        () => {
          console.log(
            "CLIENT CLOSED DERIV STREAM:",
            symbol
          );

          closeStream();
        }
      );
    },

    cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
      }

      if (derivSocket) {
        try {
          derivSocket.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":
        "text/event-stream",
      "Cache-Control":
        "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}