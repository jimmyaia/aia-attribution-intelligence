import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  return {
    getUserById: vi.fn(),
    update,
    set,
    where,
    storagePut: vi.fn(),
  };
});

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({ update: mocks.update })),
  getUserByEmail: vi.fn(),
  getUserById: mocks.getUserById,
  createEmailUser: vi.fn(),
  createSupportViewSession: vi.fn(),
  endActiveSupportViewSessionsForAdmin: vi.fn(),
  endSupportViewSession: vi.fn(),
}));

vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));

import { appRouter } from "./routers";

function context(): TrpcContext {
  return {
    user: { id: 7, email: "customer@example.com", name: "Customer", role: "user" } as TrpcContext["user"],
    actor: null,
    supportView: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("customer settings", () => {
  it("stores a validated profile image in secure storage", async () => {
    mocks.storagePut.mockResolvedValueOnce({ key: "profile-images/7/avatar.png", url: "/manus-storage/profile-images/7/avatar.png" });
    const caller = appRouter.createCaller(context());
    const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL0RgAAAABJRU5ErkJggg==";

    await expect(caller.user.uploadProfileImage({ dataUrl: image })).resolves.toMatchObject({ success: true, profileImageUrl: "/manus-storage/profile-images/7/avatar.png" });
    expect(mocks.storagePut).toHaveBeenCalledWith("profile-images/7/avatar.png", expect.any(Buffer), "image/png");
  });

  it("requires the current password before updating an email-password account", async () => {
    const passwordHash = await bcrypt.hash("current-password", 4);
    mocks.getUserById.mockResolvedValueOnce({ id: 7, passwordHash });
    const caller = appRouter.createCaller(context());

    await expect(caller.user.changePassword({ currentPassword: "wrong-password", newPassword: "new-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
