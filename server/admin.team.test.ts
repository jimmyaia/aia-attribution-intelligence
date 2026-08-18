import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  return {
    getDb: vi.fn().mockResolvedValue({ update }),
    getUserById: vi.fn(),
    getUserByEmail: vi.fn(),
    createEmailUser: vi.fn(),
    listAgencyMembers: vi.fn(),
    set,
  };
});

vi.mock("./db", () => ({
  getDb: mocks.getDb,
  getUserById: mocks.getUserById,
  getUserByEmail: mocks.getUserByEmail,
  createEmailUser: mocks.createEmailUser,
  listAgencyMembers: mocks.listAgencyMembers,
}));

import { appRouter } from "./routers";

function createAdminContext(): TrpcContext {
  return {
    user: { id: 1, role: "admin", agencyId: 1, agencyMemberRole: "owner", agencyMemberActive: true } as TrpcContext["user"] & NonNullable<TrpcContext["user"]>,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const agencyOwner = {
  id: 42,
  agencyId: 42,
  agencyMemberRole: "owner" as const,
  agencyMemberActive: true,
  agencyName: "Example Agency",
};

describe("admin.addAgencyMember", () => {
  it("provisions a member inside the selected agency workspace", async () => {
    mocks.getUserById.mockResolvedValue(agencyOwner);
    mocks.getUserByEmail.mockResolvedValue(undefined);
    mocks.createEmailUser.mockResolvedValue({ id: 84, customerId: "1234567" });

    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.addAgencyMember({
      agencyId: 42,
      firstName: "Taylor",
      lastName: "Reed",
      email: "taylor@example.com",
      temporaryPassword: "temporary-pass-123",
      memberRole: "member",
    })).resolves.toEqual({ success: true, memberId: 84, customerId: "1234567" });

    expect(mocks.createEmailUser).toHaveBeenCalledWith(expect.objectContaining({
      agencyId: 42,
      agencyMemberRole: "member",
      agencyName: "Example Agency",
    }));
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ onboardingStatus: "invited" }));
  });

  it("rejects provisioning when the email already belongs to an account", async () => {
    mocks.getUserById.mockResolvedValue(agencyOwner);
    mocks.getUserByEmail.mockResolvedValue({ id: 99, email: "taylor@example.com" });
    const caller = appRouter.createCaller(createAdminContext());

    await expect(caller.admin.addAgencyMember({
      agencyId: 42,
      firstName: "Taylor",
      lastName: "Reed",
      email: "taylor@example.com",
      temporaryPassword: "temporary-pass-123",
      memberRole: "owner",
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "CONFLICT" });
  });
});
