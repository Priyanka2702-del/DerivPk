import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { decryptToken } from "@/lib/deriv/encryption";

import DerivConnection from "@/models/DerivConnection";

import {
  connectOptionsWebSocket,
  sendOptionsMessage,
  closeOptionsWebSocket,
} from "@/lib/deriv/options-websocket";

export const runtime = "nodejs";

function waitForMessage(
  ws: import("ws")
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          "Timed out waiting for Deriv WebSocket response"
        )
      );
    }, 15000);

    const handleMessage = (
      message: import("ws").RawData
    ) => {
      clearTimeout(timeout);

      ws.off("message", handleMessage);

      try {
        const data = JSON.parse(
          message.toString()
        );

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    ws.on("message", handleMessage);

    ws.once("error", (error) => {
      clearTimeout(timeout);

      ws.off("message", handleMessage);

      reject(error);
    });
  });
}

export async function GET(
  request: Request
) {
  let ws:
    | import("ws")
    | null = null;

  try {
    await connectDB();

    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);

    const accountId =
      url.searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "accountId query parameter is required",
        },
        { status: 400 }
      );
    }

    /*
     * Find the Deriv connection belonging
     * to the currently logged-in website user.
     */
    const connection =
      await DerivConnection.findOne({
        userId: user.id,
      });

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Deriv account is not connected",
        },
        { status: 400 }
      );
    }

    /*
     * Check token expiration before trying
     * to establish the WebSocket.
     */
    if (
      connection.expiresAt &&
      connection.expiresAt <= new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Deriv access token has expired. Please reconnect your Deriv account.",
        },
        { status: 401 }
      );
    }

    const accessToken =
      decryptToken(
        connection.accessTokenEncrypted
      );

    /*
     * Get authenticated Demo/Real WebSocket.
     *
     * Deriv decides demo/real from the
     * accountId and returns the correct URL.
     */
    const connectionResult =
      await connectOptionsWebSocket(
        accessToken,
        accountId
      );

    ws = connectionResult.ws;

    /*
     * Request account balance.
     *
     * This is only a connectivity test for now.
     */
    sendOptionsMessage(ws, {
      balance: 1,
      req_id: 1,
    });

    const response =
      await waitForMessage(ws);

    /*
     * Close after the test.
     *
     * Later we will replace this temporary
     * test flow with the persistent WebSocket
     * manager.
     */
    closeOptionsWebSocket(ws);

    return NextResponse.json({
      success: true,

      connection: {
        accountId:
          connectionResult.accountId,

        mode: connectionResult.mode,
      },

      response,
    });
  } catch (error) {
    if (ws) {
      closeOptionsWebSocket(ws);
    }

    console.error(
      "Deriv Options WebSocket test error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to connect to Deriv Options WebSocket",
      },
      { status: 500 }
    );
  }
}