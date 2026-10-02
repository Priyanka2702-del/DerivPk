import { NextRequest, NextResponse } from "next/server";

import {
  DERIV_PUBLIC_WS,
  DerivCandle,
} from "@/lib/deriv-market";

import WebSocket from "ws";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest
) {
  const symbol =
    request.nextUrl.searchParams.get("symbol");

  const granularityParam =
    request.nextUrl.searchParams.get(
      "granularity"
    );

  const granularity = Number(
    granularityParam || 60
  );

  if (!symbol) {
    return NextResponse.json(
      {
        success: false,
        message: "Symbol is required",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Number.isFinite(granularity) ||
    granularity <= 0
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid granularity",
      },
      {
        status: 400,
      }
    );
  }

  return new Promise<Response>((resolve) => {
    const socket = new WebSocket(
      DERIV_PUBLIC_WS
    );

    let finished = false;

    const finish = (
      response: Response
    ) => {
      if (finished) {
        return;
      }

      finished = true;

      try {
        socket.close();
      } catch {}

      resolve(response);
    };

    socket.on("open", () => {
      socket.send(
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

    socket.on("message", (message) => {
      try {
        const data = JSON.parse(
          message.toString()
        );

        if (data.error) {
          finish(
            NextResponse.json(
              {
                success: false,
                message:
                  data.error.message ||
                  "Deriv candles request failed",
              },
              {
                status: 500,
              }
            )
          );

          return;
        }

        if (data.candles) {
          const candles: DerivCandle[] =
            data.candles.map(
              (candle: any) => ({
                epoch: Number(
                  candle.epoch
                ),
                open: Number(
                  candle.open
                ),
                high: Number(
                  candle.high
                ),
                low: Number(
                  candle.low
                ),
                close: Number(
                  candle.close
                ),
              })
            );

          finish(
            NextResponse.json({
              success: true,
              symbol,
              granularity,
              candles,
            })
          );
        }
      } catch (error) {
        finish(
          NextResponse.json(
            {
              success: false,
              message:
                error instanceof Error
                  ? error.message
                  : "Invalid Deriv candles response",
            },
            {
              status: 500,
            }
          )
        );
      }
    });

    socket.on("error", (error) => {
      finish(
        NextResponse.json(
          {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Deriv WebSocket error",
          },
          {
            status: 500,
          }
        )
      );
    });

    setTimeout(() => {
      finish(
        NextResponse.json(
          {
            success: false,
            message:
              "Deriv candles request timed out",
          },
          {
            status: 504,
          }
        )
      );
    }, 15000);
  });
}