import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { KeyRound, Loader2, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type AgencyTeamContext = {
  id: number;
  agencyName: string | null;
  name: string | null;
};

type AgencyMember = {
  id: number;
  customerId: string | null;
  name: string | null;
  email: string | null;
  agencyMemberRole: "owner" | "member";
  agencyMemberActive: boolean;
};

export function AgencyTeamPanel({ agency }: { agency: AgencyTeamContext }) {
  const utils = trpc.useUtils();
  const team = trpc.admin.listAgencyTeam.useQuery({ agencyId: agency.id });
  const [addOpen, setAddOpen] = useState(false);
  const [resetMember, setResetMember] = useState<AgencyMember | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    temporaryPassword: "",
    memberRole: "member" as "member" | "owner",
  });
  const setField = (field: keyof typeof form, value: string) =>
    setForm(current => ({ ...current, [field]: value }));

  const refresh = async () => {
    await Promise.all([
      utils.admin.listAgencyTeam.invalidate({ agencyId: agency.id }),
      utils.admin.getAgency.invalidate({ userId: agency.id }),
      utils.admin.listAgencies.invalidate(),
    ]);
  };

  const addMember = trpc.admin.addAgencyMember.useMutation({
    onSuccess: async data => {
      await refresh();
      setForm({ firstName: "", lastName: "", email: "", phone: "", temporaryPassword: "", memberRole: "member" });
      setAddOpen(false);
      toast.success(`Team member created${data.customerId ? ` · Customer ID ${data.customerId}` : ""}`);
    },
    onError: error => toast.error(error.message),
  });

  const updateMember = trpc.admin.updateAgencyMember.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Team member access updated");
    },
    onError: error => toast.error(error.message),
  });

  const resetPassword = trpc.admin.resetPassword.useMutation({
    onSuccess: () => {
      setTemporaryPassword("");
      setResetMember(null);
      toast.success("Temporary password reset");
    },
    onError: error => toast.error(error.message),
  });

  const canAdd = Boolean(form.firstName && form.lastName && form.email && form.temporaryPassword.length >= 8);

  return (
    <>
      <section className="rounded-xl border border-white/8 bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Agency team</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Each member has an individual login but shares this agency’s reporting, connections, and access status.
            </p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserRoundPlus /> Add user
          </Button>
        </div>

        <div className="mt-5 space-y-2">
          {team.isLoading ? (
            <div className="flex h-20 items-center justify-center"><Loader2 className="animate-spin text-blue-400" /></div>
          ) : team.data?.map(member => (
            <div key={member.id} className="flex flex-col gap-3 rounded-lg border border-white/8 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{member.name || member.email}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${member.agencyMemberRole === "owner" ? "border-blue-500/30 bg-blue-500/10 text-blue-300" : "border-white/10 bg-white/[0.04] text-muted-foreground"}`}>
                    {member.agencyMemberRole === "owner" ? "Owner" : "Member"}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${member.agencyMemberActive ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
                    {member.agencyMemberActive ? "Active" : "Deactivated"}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{member.email} · ID {member.customerId ?? "Assigning…"}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button size="sm" variant="outline" className="border-white/10" onClick={() => { setResetMember(member); setTemporaryPassword(""); }}>
                  <KeyRound size={14} /> Reset password
                </Button>
                {member.id !== agency.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className={member.agencyMemberActive ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10" : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"}
                    disabled={updateMember.isPending}
                    onClick={() => updateMember.mutate({ agencyId: agency.id, memberId: member.id, agencyMemberActive: !member.agencyMemberActive })}
                  >
                    {member.agencyMemberActive ? "Deactivate" : "Reactivate"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add agency user</DialogTitle>
            <DialogDescription>
              Create a separate login for {agency.agencyName || agency.name}. Members share the agency workspace; owners can also manage billing and integrations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="team-first-name">First name</Label><Input id="team-first-name" value={form.firstName} onChange={e => setField("firstName", e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="team-last-name">Last name</Label><Input id="team-last-name" value={form.lastName} onChange={e => setField("lastName", e.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="team-email">Email</Label><Input id="team-email" type="email" value={form.email} onChange={e => setField("email", e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="team-phone">Phone</Label><Input id="team-phone" value={form.phone} onChange={e => setField("phone", e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="team-role">Access level</Label><select id="team-role" value={form.memberRole} onChange={e => setField("memberRole", e.target.value)} className="h-10 w-full rounded-md border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-blue-500/60"><option value="member">Member — reporting and diagnostics</option><option value="owner">Owner — includes billing and integrations</option></select></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="team-password">Temporary password</Label><Input id="team-password" type="password" value={form.temporaryPassword} onChange={e => setField("temporaryPassword", e.target.value)} placeholder="Minimum 8 characters" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button disabled={!canAdd || addMember.isPending} onClick={() => addMember.mutate({ agencyId: agency.id, firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone || undefined, temporaryPassword: form.temporaryPassword, memberRole: form.memberRole })}>
              {addMember.isPending ? <Loader2 className="animate-spin" /> : <UserRoundPlus />} Create user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetMember)} onOpenChange={open => { if (!open) setResetMember(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Reset team member password</DialogTitle><DialogDescription>Set a temporary password for {resetMember?.email}. Share it privately with the team member.</DialogDescription></DialogHeader>
          <div className="space-y-2 py-1"><Label htmlFor="team-reset-password">Temporary password</Label><Input id="team-reset-password" type="password" value={temporaryPassword} onChange={e => setTemporaryPassword(e.target.value)} placeholder="Minimum 8 characters" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setResetMember(null)}>Cancel</Button><Button disabled={!resetMember || temporaryPassword.length < 8 || resetPassword.isPending} onClick={() => resetMember && resetPassword.mutate({ userId: resetMember.id, temporaryPassword })}>{resetPassword.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />} Reset password</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
