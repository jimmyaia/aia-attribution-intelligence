import crypto from "crypto";
import { ENV } from "./_core/env";

const PREFIX = "enc:v1:";

function getKey() {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET is required to encrypt OAuth tokens");
  return crypto.createHash("sha256").update(ENV.cookieSecret).digest();
}

export function encryptConnectionToken(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, ciphertext]).toString("base64url")}`;
}

export function decryptConnectionToken(value: string): string {
  if (!value.startsWith(PREFIX)) return value;
  const payload = Buffer.from(value.slice(PREFIX.length), "base64url");
  if (payload.length < 29) throw new Error("Malformed encrypted connection token");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
