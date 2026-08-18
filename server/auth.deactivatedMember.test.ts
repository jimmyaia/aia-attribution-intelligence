import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./db", () => ({ getUserByEmail: mocks.getUserByEmail, getDb: mocks.getDb }));

import { appRouter } from "./routers";

describe("auth.login for deactivated agency members", () => {
  it("blocks a deactivated member before a session is issued", async () => {
    mocks.getUserByEmail.mockResolvedValue({
      id: 84,
      email: "member@example.com",
      passwordHash: "$2a$12$examplehashnotusedbecauseaccountisblocked",
      agencyMemberActive: false,
    });
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    await expect(caller.auth.login({ email: "member@example.com", password: "anything" })).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
      message: "This agency account has been deactivated. Contact your agency administrator.",
    });
  });
});
