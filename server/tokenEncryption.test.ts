import { describe, expect, it } from "vitest";
import { decryptConnectionToken, encryptConnectionToken } from "./tokenEncryption";

describe("connection token encryption", () => {
  it("encrypts OAuth tokens with a non-deterministic authenticated envelope", () => {
    const token = "google-access-token-example";
    const first = encryptConnectionToken(token);
    const second = encryptConnectionToken(token);
    expect(first).toMatch(/^enc:v1:/);
    expect(first).not.toBe(token);
    expect(first).not.toBe(second);
    expect(decryptConnectionToken(first)).toBe(token);
  });

  it("reads legacy plaintext tokens during the migration window", () => {
    expect(decryptConnectionToken("legacy-token")).toBe("legacy-token");
  });
});
