import { describe, expect, it, vi } from "vitest";
import { generateCustomerId, reserveUniqueCustomerId } from "./db";

describe("Customer ID generation", () => {
  it("creates a seven-digit numeric Customer ID", () => {
    for (let index = 0; index < 20; index += 1) {
      expect(generateCustomerId()).toMatch(/^[1-9]\d{6}$/);
    }
  });

  it("retries after a duplicate Customer ID collision", async () => {
    const candidates = ["1111111", "2222222"];
    const assign = vi.fn(async (customerId: string) => {
      if (customerId === "1111111") throw { code: "ER_DUP_ENTRY" };
    });

    await expect(reserveUniqueCustomerId(assign, () => candidates.shift() ?? "3333333")).resolves.toBe("2222222");
    expect(assign).toHaveBeenCalledTimes(2);
  });
});
