import WebSocket from "ws";

const DERIV_API_BASE = "https://api.derivws.com";

export type DerivOptionsMode = "demo" | "real";

export interface DerivOptionsAccount {
  account_id: string;
  balance?: number;
  currency?: string;
  group?: string;
  status?: string;
  account_type?: "demo" | "real";
}

interface DerivOtpResponse {
  data?: {
    otp?: string;
    url?: string;
  };
  errors?: Array<{
    status?: number;
    code?: string;
    message?: string;
  }>;
}

export interface OptionsWebSocketConnection {
  ws: WebSocket;
  accountId: string;
  mode: DerivOptionsMode;
  url: string;
}

/**
 * Get authenticated WebSocket URL from Deriv OTP endpoint.
 *
 * The returned URL already contains the OTP and points
 * to the correct demo/real WebSocket endpoint.
 */
export async function getOptionsWebSocketUrl(
  accessToken: string,
  accountId: string
): Promise<{
  url: string;
  otp?: string;
}> {
  if (!accessToken) {
    throw new Error("Deriv access token is required");
  }

  if (!accountId) {
    throw new Error("Deriv account ID is required");
  }

  const response = await fetch(
    `${DERIV_API_BASE}/trading/v1/options/accounts/${encodeURIComponent(
      accountId
    )}/otp`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const data =
    (await response.json()) as DerivOtpResponse;

  if (!response.ok) {
    const message =
      data?.errors?.[0]?.message ||
      "Unable to generate Deriv WebSocket OTP";

    throw new Error(
      `Deriv OTP request failed (${response.status}): ${message}`
    );
  }

  const url = data?.data?.url;

  if (!url) {
    throw new Error(
      "Deriv OTP response did not contain a WebSocket URL"
    );
  }

  return {
    url,
    otp: data?.data?.otp,
  };
}

/**
 * Connect to an authenticated Options WebSocket.
 *
 * The URL returned by Deriv OTP endpoint is used directly.
 */
export async function connectOptionsWebSocket(
  accessToken: string,
  accountId: string
): Promise<OptionsWebSocketConnection> {
  const { url } =
    await getOptionsWebSocketUrl(
      accessToken,
      accountId
    );

  return new Promise(
    (resolve, reject) => {
      const ws = new WebSocket(url);

      let settled = false;

      const timeout = setTimeout(() => {
        if (settled) return;

        settled = true;

        ws.close();

        reject(
          new Error(
            "Deriv Options WebSocket connection timeout"
          )
        );
      }, 15000);

      ws.on("open", () => {
        if (settled) return;

        settled = true;

        clearTimeout(timeout);

        const mode: DerivOptionsMode =
          url.includes("/ws/demo")
            ? "demo"
            : "real";

        console.log(
          `Deriv Options WebSocket connected: ${mode}`
        );

        resolve({
          ws,
          accountId,
          mode,
          url,
        });
      });

      ws.on("error", (error) => {
        if (!settled) {
          settled = true;

          clearTimeout(timeout);

          reject(error);

          return;
        }

        console.error(
          "Deriv Options WebSocket error:",
          error
        );
      });

      ws.on("close", () => {
        console.log(
          "Deriv Options WebSocket closed:",
          accountId
        );
      });
    }
  );
}

/**
 * Send a message to the Options WebSocket.
 */
export function sendOptionsMessage(
  ws: WebSocket,
  message: Record<string, unknown>
) {
  if (ws.readyState !== WebSocket.OPEN) {
    throw new Error(
      "Deriv Options WebSocket is not open"
    );
  }

  ws.send(JSON.stringify(message));
}

/**
 * Close the Options WebSocket safely.
 */
export function closeOptionsWebSocket(
  ws: WebSocket
) {
  if (
    ws.readyState === WebSocket.OPEN ||
    ws.readyState === WebSocket.CONNECTING
  ) {
    ws.close();
  }
}