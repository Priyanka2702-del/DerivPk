
/**
 * Alpaca Broker API helpers.
 * Sandbox only. Never use for real-money funding.
 */

type ApiError = {
  message?: unknown;
  error?: unknown;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
};

export type AlpacaJournal = {
  id: string;
  entry_type: string;
  from_account: string;
  to_account: string;
  amount: string;
  currency?: string;
  status: string;
  created_at?: string;
};

type AlpacaAccount = {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  cash: string;
  equity: string;
  buying_power: string;
  account_blocked?: boolean;
  trading_blocked?: boolean;
};

const BROKER_URL = (
  process.env.ALPACA_BROKER_URL ||
  "https://broker-api.sandbox.alpaca.markets"
).replace(/\/+$/, "");

const AUTH_URL = (
  process.env.ALPACA_AUTH_URL ||
  "https://authx.sandbox.alpaca.markets"
).replace(/\/+$/, "");

const MAX_FUNDING_AMOUNT = 1000;

function assertSandboxUrls() {
  const broker = new URL(BROKER_URL);
  const auth = new URL(AUTH_URL);

  if (
    broker.protocol !== "https:" ||
    broker.hostname !== "broker-api.sandbox.alpaca.markets"
  ) {
    throw new Error(
      "Only the Alpaca sandbox Broker API is allowed."
    );
  }

  if (
    auth.protocol !== "https:" ||
    auth.hostname !== "authx.sandbox.alpaca.markets"
  ) {
    throw new Error(
      "Only the Alpaca sandbox auth endpoint is allowed."
    );
  }
}

async function readResponse(
  response: Response
): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorMessage(data: unknown): string {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const error = data as ApiError;

    if (error.message != null) {
      return String(error.message);
    }

    if (error.error != null) {
      return String(error.error);
    }
  }

  return "Alpaca API request failed.";
}

function getClientCredentials() {
  const clientId =
    process.env.ALPACA_BROKER_CLIENT_ID;

  const clientSecret =
    process.env.ALPACA_BROKER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Configure ALPACA_BROKER_CLIENT_ID and ALPACA_BROKER_CLIENT_SECRET."
    );
  }

  return { clientId, clientSecret };
}

/**
 * Obtain an Alpaca sandbox Broker API access token.
 */
async function getAccessToken(): Promise<string> {
  assertSandboxUrls();

  const { clientId, clientSecret } =
    getClientCredentials();

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(
    `${AUTH_URL}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    }
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      `Alpaca authentication failed (${response.status}): ${errorMessage(data)}`
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as TokenResponse).access_token !==
      "string"
  ) {
    throw new Error(
      "Alpaca did not return a valid access token."
    );
  }

  return (data as TokenResponse).access_token!;
}

/**
 * Authenticated sandbox Broker API request.
 */
export async function alpacaRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  assertSandboxUrls();

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /^[a-z][a-z\d+.-]*:/i.test(path)
  ) {
    throw new Error("Invalid Alpaca API path.");
  }

  const token = await getAccessToken();

  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const response = await fetch(
    `${BROKER_URL}${path}`,
    {
      ...options,
      headers,
      cache: "no-store",
      redirect: "error",
    }
  );

  const data = await readResponse(response);
  const requestId =
    response.headers.get("x-request-id");

  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText}: ${errorMessage(data)}` +
        (requestId
          ? ` | X-Request-ID: ${requestId}`
          : "")
    );
  }

  return data as T;
}

/**
 * Submit a sandbox journal transfer.
 *
 * The source firm account must be eligible to fund
 * the destination account and have appropriate permissions.
 */
export async function alpacaSandboxFundAccount(params: {
  accountId: string;
  amount: number;
}): Promise<AlpacaJournal> {
  assertSandboxUrls();

  const fromAccount =
    process.env.ALPACA_FIRM_ACCOUNT_ID?.trim();

  const toAccount =
    String(params.accountId || "").trim();

  const rawAmount = Number(params.amount);

  if (!fromAccount) {
    throw new Error(
      "Configure ALPACA_FIRM_ACCOUNT_ID."
    );
  }

  if (!toAccount) {
    throw new Error(
      "A destination sandbox account ID is required."
    );
  }

  if (fromAccount === toAccount) {
    throw new Error(
      "Source and destination accounts must differ."
    );
  }

  if (
    !Number.isFinite(rawAmount) ||
    rawAmount < 0.01 ||
    rawAmount > MAX_FUNDING_AMOUNT
  ) {
    throw new Error(
      "Sandbox funding must be between $0.01 and $1,000 per request."
    );
  }

  const amount =
    Math.round(rawAmount * 100) / 100;

  return alpacaRequest<AlpacaJournal>(
    "/v1/journals",
    {
      method: "POST",
      headers: {
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        entry_type: "JNLC",
        from_account: fromAccount,
        to_account: toAccount,
        amount: amount.toFixed(2),
        currency: "USD",
        description:
          "DerivPk sandbox paper-trading test funds",
      }),
    }
  );
}
