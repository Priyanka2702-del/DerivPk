import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.DERIV_TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "DERIV_TOKEN_ENCRYPTION_KEY is not defined"
    );
  }

  const decoded = Buffer.from(key, "base64");

  if (decoded.length !== 32) {
    throw new Error(
      "DERIV_TOKEN_ENCRYPTION_KEY must decode to 32 bytes"
    );
  }

  return decoded;
}

export function encryptToken(
  token: string
): string {
  const key = getEncryptionKey();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptToken(
  encryptedToken: string
): string {
  const key = getEncryptionKey();

  const [
    ivBase64,
    authTagBase64,
    encryptedBase64,
  ] = encryptedToken.split(".");

  if (
    !ivBase64 ||
    !authTagBase64 ||
    !encryptedBase64
  ) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(
    authTagBase64,
    "base64"
  );
  const encrypted = Buffer.from(
    encryptedBase64,
    "base64"
  );

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}