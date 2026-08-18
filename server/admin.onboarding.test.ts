import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));

  return {
    getDb: vi.fn().mockResolvedValue({ update }),
    getUserById: vi.fn().mockResolvedValue({ id: 42, role: "user" }),
    getUserByEmail: vi.fn(),
    createEmailUser: vi.fn(),
    update,
    set,
    where,
  };
});

vi.mock("./db", () => ({
  getDb: mocks.getDb,
  getUserById: mocks.getUserById,
  getUserByEmail: mocks.getUserByEmail,
  createEmailUser: mocks.createEmailUser,
}));

import { appRouter } from "./routers";

function createAdminContext(): TrpcContext {
  const now = new Date();
  return {
    user: {
      id: 1,
      openId: "1",
      passwordHash: null,
      name: "Admin User",
      email: "admin@example.com",
      agencyName: "AIA",
      firstName: "Admin",
      lastName: "User",
      phone: null,
      website: null,
      profileComplete: true,
      onboardingStatus: "complete",
      onboardingNotes: null,
      onboardingUpdatedAt: now,
      loginMethod: "email",
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin.updateOnboarding", () => {
  it("records the selected onboarding stage and internal notes for an agency", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    await expect(
      caller.admin.updateOnboarding({
        userId: 42,
        onboardingStatus: "in_progress",
        notes: "Schedule the Google Ads connection review.",
      }),
    ).resolves.toEqual({ success: true });

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingStatus: "in_progress",
        onboardingNotes: "Schedule the Google Ads connection review.",
        onboardingUpdatedAt: expect.any(Date),
      }),
    );
    expect(mocks.where).toHaveBeenCalledTimes(1);
  });
});
