import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createStandardUserContext(): TrpcContext {
  const now = new Date();
  return {
    user: {
      id: 77,
      openId: "77",
      name: "Standard User",
      email: "standard@example.com",
      agencyName: "Standard Agency",
      profileComplete: true,
      onboardingStatus: "complete",
      onboardingNotes: null,
      onboardingUpdatedAt: now,
      loginMethod: "email",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
      passwordHash: null,
      firstName: "Standard",
      lastName: "User",
      phone: null,
      website: null,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin authorization", () => {
  it("rejects a standard user before any agency data can be read", async () => {
    const caller = appRouter.createCaller(createStandardUserContext());

    await expect(caller.admin.overview()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
