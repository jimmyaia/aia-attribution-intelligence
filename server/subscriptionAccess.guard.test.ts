import { describe, expect, it, vi } from "vitest";
import { PAYMENT_REQUIRED_ERR_MSG } from "../shared/const";
import type { TrpcContext } from "./_core/context";

vi.mock("./subscriptionAccess", () => ({
  getBillingAccessForUser: vi.fn().mockResolvedValue({ allowed: false, reason: "payment_required" }),
}));

vi.mock("./db", () => ({
  getDb: vi.fn(),
  getUserByEmail: vi.fn(),
  createEmailUser: vi.fn(),
}));

import { appRouter } from "./routers";

function createLockedContext(): TrpcContext {
  return {
    user: {
      id: 502,
      openId: "502",
      passwordHash: null,
      name: "Locked Customer",
      email: "locked@example.com",
      agencyName: "Locked Agency",
      firstName: "Locked",
      lastName: "Customer",
      phone: null,
      website: null,
      profileComplete: true,
      onboardingStatus: "complete",
      onboardingNotes: null,
      onboardingUpdatedAt: null,
      billingAccessOverrideUntil: null,
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("subscription access guard", () => {
  it("blocks a locked account from directly reading an integration workspace", async () => {
    const caller = appRouter.createCaller(createLockedContext());

    await expect(caller.googleAds.getConnection()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: PAYMENT_REQUIRED_ERR_MSG,
    });
  });
});
