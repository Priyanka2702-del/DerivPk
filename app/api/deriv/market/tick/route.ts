import { NextRequest, NextResponse } from "next/server";

import {
  DERIV_PUBLIC_WS,
  DerivTick,
} from "@/lib/deriv-market";

import WebSocket from "ws";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest
) {
  const symbol =
    request.nextUrl.searchParams.get("symbol");

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
          ticks: [symbol],
          subscribe: 1,
          req_id: 2,
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
                  "Deriv tick request failed",
              },
              {
                status: 500,
              }
            )
          );

          return;
        }

        if (data.tick) {
          const tick: DerivTick = {
            symbol: data.tick.symbol,
            quote: Number(data.tick.quote),
            epoch: Number(data.tick.epoch),
          };

          finish(
            NextResponse.json({
              success: true,
              symbol,
              tick,
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
                  : "Invalid Deriv response",
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
              "Deriv tick request timed out",
          },
          {
            status: 504,
          }
        )
      );
    }, 15000);
  });
}