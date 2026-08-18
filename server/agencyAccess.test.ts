import { describe, expect, it } from "vitest";
import { canAccessAgencyWorkspace, canManageAgencyWorkspace } from "./agencyAccess";

describe("agency membership access", () => {
  it("allows active owners to manage shared billing and integrations", () => {
    expect(canManageAgencyWorkspace({ agencyMemberRole: "owner", agencyMemberActive: true })).toBe(true);
  });

  it("allows active members to view their agency workspace but not manage it", () => {
    expect(canAccessAgencyWorkspace({ agencyMemberActive: true })).toBe(true);
    expect(canManageAgencyWorkspace({ agencyMemberRole: "member", agencyMemberActive: true })).toBe(false);
  });

  it("blocks deactivated members from agency workspace access", () => {
    expect(canAccessAgencyWorkspace({ agencyMemberActive: false })).toBe(false);
    expect(canManageAgencyWorkspace({ agencyMemberRole: "owner", agencyMemberActive: false })).toBe(false);
  });
});
