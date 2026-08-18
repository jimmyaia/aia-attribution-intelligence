import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  createEmailUser: vi.fn(),
  getDb: vi.fn(),
  getUserByEmail: vi.fn().mockResolvedValue(undefined),
}));

import { appRouter } from "./routers";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.login", () => {
  it("returns an authorization error, rather than a server error, for unknown credentials", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.auth.login({
        email: "missing@example.com",
        password: "password123",
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: "UNAUTHORIZED",
      message: "Invalid email or password.",
    });
  });
});

