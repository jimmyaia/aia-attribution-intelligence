import { describe, expect, it, vi } from "vitest";
import type { User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getUserById: vi.fn(),
  endSupportViewSession: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserById: dbMocks.getUserById,
  createEmailUser: vi.fn(),
  createSupportViewSession: vi.fn(),
  endActiveSupportViewSessionsForAdmin: vi.fn(),
  endSupportViewSession: dbMocks.endSupportViewSession,
}));

import { appRouter } from "./routers";

function user(overrides: Partial<User>): User {
  return {
    id: 1,
    openId: null,
    passwordHash: null,
    name: "Admin",
    email: "admin@example.com",
    agencyName: "AIA",
    firstName: "Admin",
    lastName: "User",
    phone: null,
    website: null,
    profileComplete: true,
    onboardingStatus: "complete",
    onboardingNotes: null,
    onboardingUpdatedAt: null,
    billingAccessOverrideUntil: null,
    loginMethod: "email",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function supportContext(): TrpcContext {
  const actor = user({ id: 1, role: "admin" });
  return {
    user: user({ id: 2, role: "user", email: "client@example.com" }),
    actor,
    supportView: {
      sessionId: 33,
      reason: "Support review",
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Client View authorization", () => {
  it("prevents administrators from impersonating another administrator", async () => {
    dbMocks.getUserById.mockResolvedValueOnce(user({ id: 9, role: "admin" }));
    const actor = user({ id: 1, role: "admin" });
    const caller = appRouter.createCaller({
      user: actor,
      actor,
      supportView: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    await expect(caller.support.start({ targetUserId: 9, reason: "Support review" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks customer mutations while Client View is active", async () => {
    const caller = appRouter.createCaller(supportContext());

    await expect(caller.user.saveProfile({ firstName: "Client", lastName: "User", businessName: "Client Co" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Client View is read-only. Exit Client View to make changes.",
    });
  });

  it("ends the support session using the original administrator identity", async () => {
    const ctx = supportContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.support.exit()).resolves.toEqual({ success: true });
    expect(dbMocks.endSupportViewSession).toHaveBeenCalledWith(33, 1);
  });
});
