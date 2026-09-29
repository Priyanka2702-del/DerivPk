import crypto from "crypto";

const SESSION_DURATION_DAYS = 7;

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export function getSessionExpiry(): Date {
  const expiry = new Date();

  expiry.setDate(
    expiry.getDate() + SESSION_DURATION_DAYS
  );

  return expiry;
}