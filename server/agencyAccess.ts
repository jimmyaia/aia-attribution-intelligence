export type AgencyMembership = {
  id: number;
  agencyId: number | null;
  agencyMemberRole: "owner" | "member";
  agencyMemberActive: boolean;
};

export function canManageAgencyWorkspace(member: Pick<AgencyMembership, "agencyMemberRole" | "agencyMemberActive">) {
  return member.agencyMemberActive && member.agencyMemberRole === "owner";
}

export function canAccessAgencyWorkspace(member: Pick<AgencyMembership, "agencyMemberActive">) {
  return member.agencyMemberActive;
}
