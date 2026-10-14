import { NextResponse } from "next/server";
import WebSocket from "ws";

export const runtime = "nodejs";

type WebSocketTestResult = {
  connected: boolean;
  message?: string;
  error?: string;
};

export async function GET() {
  const wsUrl =
    "wss://api.derivws.com/trading/v1/options/ws/public";

  return new Promise<NextResponse>((resolve) => {
    const ws = new WebSocket(wsUrl);

    const timeout = setTimeout(() => {
      try {
        ws.close();
      } catch {
        // Ignore close errors.
      }

      const result: WebSocketTestResult = {
        connected: false,
        error: "WebSocket connection timed out.",
      };

      resolve(
        NextResponse.json(result, {
          status: 504,
        })
      );
    }, 10000);

    ws.once("open", () => {
      clearTimeout(timeout);

      const result: WebSocketTestResult = {
        connected: true,
        message: "Deriv WebSocket connected successfully.",
      };

      ws.close();

      resolve(
        NextResponse.json(result, {
          status: 200,
        })
      );
    });

    ws.once("error", (error: Error) => {
      clearTimeout(timeout);

      const result: WebSocketTestResult = {
        connected: false,
        error: error.message,
      };

      resolve(
        NextResponse.json(result, {
          status: 500,
        })
      );
    });

    ws.once("close", () => {
      clearTimeout(timeout);
    });
  });
}
