import crypto from "crypto";

const DERIV_AUTH_URL = "https://auth.deriv.com/oauth2/auth";
const DERIV_TOKEN_URL = "https://auth.deriv.com/oauth2/token";

const CLIENT_ID = process.env.DERIV_CLIENT_ID;
const REDIRECT_URI = process.env.DERIV_REDIRECT_URI;

if (!CLIENT_ID) {
  throw new Error("DERIV_CLIENT_ID is not defined");
}

if (!REDIRECT_URI) {
  throw new Error("DERIV_REDIRECT_URI is not defined");
}

/**
 * Generate a cryptographically secure random string.
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(64).toString("base64url");
}

/**
 * Generate PKCE code_challenge from code_verifier.
 */
export function generateCodeChallenge(
  codeVerifier: string
): string {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
}

/**
 * Generate OAuth state for CSRF protection.
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Build Deriv OAuth authorization URL.
 */
export function buildDerivAuthorizationUrl(
  state: string,
  codeChallenge: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID!,
    redirect_uri: REDIRECT_URI!,
    scope: "trade",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${DERIV_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for Deriv access token.
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID!,
    code,
    code_verifier: codeVerifier,
    redirect_uri: REDIRECT_URI!,
  });

  const response = await fetch(DERIV_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Deriv token exchange failed:",
      response.status,
      data
    );

    throw new Error(
      data?.error_description ||
        data?.error ||
        "Failed to exchange authorization code"
    );
  }

  return data;
}