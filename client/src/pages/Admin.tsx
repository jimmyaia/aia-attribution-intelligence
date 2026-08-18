import { useAuth } from "@/_core/hooks/useAuth";
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
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CreditCard,
  Eye,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Sidebar } from "./Dashboard";

type OnboardingStatus = "not_started" | "invited" | "in_progress" | "ready" | "complete";

type Agency = {
  id: number;
  customerId: string | null;
  name: string | null;
  email: string | null;
  agencyName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  website: string | null;
  role: "user" | "admin";
  profileComplete: boolean;
  onboardingStatus: OnboardingStatus;
  onboardingNotes: string | null;
  onboardingUpdatedAt: Date | string | null;
  billingAccessOverrideUntil: Date | string | null;
  createdAt: Date | string;
  lastSignedIn: Date | string;
  subscription: {
    status: string | null;
    planName: string | null;
    priceMonthly: number | null;
    currentPeriodEnd: Date | string | null;
    cancelAtPeriodEnd: boolean | null;
  };
  googleAds: { isConnected: boolean; accountName: string | null; accountId: string | null };
  ghl: { isConnected: boolean; locationName: string | null; locationId: string | null };
};

const ONBOARDING_LABELS: Record<OnboardingStatus, string> = {
  not_started: "Not started",
  invited: "Invited",
  in_progress: "In progress",
  ready: "Ready to launch",
  complete: "Complete",
};

const ONBOARDING_COLORS: Record<OnboardingStatus, string> = {
  not_started: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  invited: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  in_progress: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  ready: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  complete: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function isActiveSubscription(status: string | null) {
  return status === "active" || status === "trialing";
}

function StatusPill({ status }: { status: OnboardingStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ONBOARDING_COLORS[status]}`}>
      {ONBOARDING_LABELS[status]}
    </span>
  );
}

function ConnectionMark({ connected, label }: { connected: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${connected ? "text-emerald-400" : "text-muted-foreground"}`}>
      {connected ? <CircleCheck size={13} /> : <CircleAlert size={13} />}
      {label}
    </span>
  );
}

function OverviewCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  helper: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-card p-4 transition-colors hover:border-white/15">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={17} />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function AgencyDetails({ agency, onClose }: { agency: Agency; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<OnboardingStatus>(agency.onboardingStatus);
  const [notes, setNotes] = useState(agency.onboardingNotes ?? "");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [customerIdInput, setCustomerIdInput] = useState("");
  const [verification, setVerification] = useState("");
  const [supportReason, setSupportReason] = useState("Support review from Admin Control Center");

  useEffect(() => {
    setStatus(agency.onboardingStatus);
    setNotes(agency.onboardingNotes ?? "");
    setTemporaryPassword("");
    setCustomerIdInput("");
    setVerification("");
    setSupportReason("Support review from Admin Control Center");
  }, [agency]);

  const updateOnboarding = trpc.admin.updateOnboarding.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.overview.invalidate(),
        utils.admin.listAgencies.invalidate(),
        utils.admin.getAgency.invalidate({ userId: agency.id }),
      ]);
      toast.success("Onboarding status saved");
    },
    onError: error => toast.error(error.message),
  });

  const resetPassword = trpc.admin.resetPassword.useMutation({
    onSuccess: () => {
      setTemporaryPassword("");
      toast.success("Temporary password reset");
    },
    onError: error => toast.error(error.message),
  });

  const grantBillingAccess = trpc.admin.grantBillingAccess.useMutation({
    onSuccess: async data => {
      await Promise.all([
        utils.admin.overview.invalidate(),
        utils.admin.listAgencies.invalidate(),
        utils.admin.getAgency.invalidate({ userId: agency.id }),
      ]);
      toast.success(`Billing access restored until ${formatDate(data.billingAccessOverrideUntil)}`);
    },
    onError: error => toast.error(error.message),
  });

  const clearBillingAccess = trpc.admin.clearBillingAccessOverride.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.overview.invalidate(),
        utils.admin.listAgencies.invalidate(),
        utils.admin.getAgency.invalidate({ userId: agency.id }),
      ]);
      toast.success("Temporary billing access removed");
    },
    onError: error => toast.error(error.message),
  });

  const startClientView = trpc.support.start.useMutation({
    onSuccess: async data => {
      await utils.auth.me.invalidate();
      setSupportOpen(false);
      toast.success(`Viewing ${data.targetName ?? "client workspace"} in read-only mode`);
      setLocation("/dashboard");
    },
    onError: error => toast.error(error.message),
  });

  const checklist = [
    { label: "Account created", complete: true },
    { label: "Subscription active", complete: isActiveSubscription(agency.subscription.status) },
    { label: "Google Ads connected", complete: agency.googleAds.isConnected },
    { label: "GoHighLevel connected", complete: agency.ghl.isConnected },
    { label: "Onboarding approved", complete: agency.onboardingStatus === "complete" },
  ];
  const completedSteps = checklist.filter(step => step.complete).length;
  const billingOverrideIsActive = Boolean(
    agency.billingAccessOverrideUntil && new Date(agency.billingAccessOverrideUntil).getTime() > Date.now(),
  );
  const shouldOfferBillingRestore = agency.role !== "admin" && !isActiveSubscription(agency.subscription.status);

  return (
    <>
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div className="min-w-0">
          <button onClick={onClose} className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={14} /> Back to agencies
          </button>
          <h1 className="truncate text-xl font-semibold text-foreground">{agency.agencyName || agency.name || "Untitled agency"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{agency.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {agency.role !== "admin" && (
            <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10" onClick={() => setSupportOpen(true)} disabled={startClientView.isPending}>
              {startClientView.isPending ? <Loader2 className="animate-spin" /> : <Eye />}
              View as client
            </Button>
          )}
          <StatusPill status={agency.onboardingStatus} />
        </div>
      </div>

      <div className="grid flex-1 gap-5 overflow-y-auto p-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <div className="space-y-5">
          <section className="rounded-xl border border-white/8 bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Onboarding command center</p>
                <p className="mt-1 text-xs text-muted-foreground">Move this agency through setup without losing the next step.</p>
              </div>
              <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-muted-foreground">{completedSteps} / {checklist.length} complete</span>
            </div>
            <div className="mt-5 space-y-3">
              {checklist.map(step => (
                <div key={step.label} className="flex items-center gap-3 rounded-lg bg-white/[0.025] px-3 py-2.5">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${step.complete ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                    {step.complete ? <Check size={13} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                  </span>
                  <span className={`text-sm ${step.complete ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/8 bg-card p-5">
            <p className="text-sm font-semibold text-foreground">Connection health</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
                <p className="text-xs font-medium text-foreground">Google Ads</p>
                <div className="mt-2"><ConnectionMark connected={agency.googleAds.isConnected} label={agency.googleAds.isConnected ? "Connected" : "Not connected"} /></div>
                <p className="mt-3 truncate text-xs text-muted-foreground">{agency.googleAds.accountName || "No account connected"}</p>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
                <p className="text-xs font-medium text-foreground">GoHighLevel</p>
                <div className="mt-2"><ConnectionMark connected={agency.ghl.isConnected} label={agency.ghl.isConnected ? "Connected" : "Not connected"} /></div>
                <p className="mt-3 truncate text-xs text-muted-foreground">{agency.ghl.locationName || "No location connected"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/8 bg-card p-5">
            <p className="text-sm font-semibold text-foreground">Agency context</p>
            <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Customer ID</dt><dd className="mt-1 font-mono font-semibold tracking-[0.18em] text-blue-300">{agency.customerId ?? "Assigning…"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Primary contact</dt><dd className="mt-1 text-foreground">{agency.name || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="mt-1 text-foreground">{agency.phone || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Website</dt><dd className="mt-1 truncate text-foreground">{agency.website || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 text-foreground">{formatDate(agency.createdAt)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Last sign-in</dt><dd className="mt-1 text-foreground">{formatDate(agency.lastSignedIn)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Plan</dt><dd className="mt-1 text-foreground">{agency.subscription.planName || "No subscription"}</dd></div>
            </dl>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-white/8 bg-card p-5">
            <p className="text-sm font-semibold text-foreground">Manage onboarding</p>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="onboarding-status">Current stage</Label>
                <select id="onboarding-status" value={status} onChange={event => setStatus(event.target.value as OnboardingStatus)} className="h-10 w-full rounded-md border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-blue-500/60">
                  {Object.entries(ONBOARDING_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-notes">Internal notes</Label>
                <textarea id="onboarding-notes" value={notes} onChange={event => setNotes(event.target.value)} rows={5} placeholder="Add a clear next step for your team…" className="w-full resize-none rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-500/60" />
              </div>
              <Button className="w-full" onClick={() => updateOnboarding.mutate({ userId: agency.id, onboardingStatus: status, notes })} disabled={updateOnboarding.isPending}>
                {updateOnboarding.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                Save onboarding status
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-white/8 bg-card p-5">
            <div className="flex items-center gap-2"><CreditCard size={15} className="text-blue-400" /><p className="text-sm font-semibold text-foreground">Billing access</p></div>
            {billingOverrideIsActive ? (
              <>
                <p className="mt-2 text-xs leading-5 text-emerald-300">Temporary workspace access is active until {formatDate(agency.billingAccessOverrideUntil)}.</p>
                <Button variant="outline" className="mt-4 w-full border-amber-500/30 text-amber-300 hover:bg-amber-500/10" disabled={clearBillingAccess.isPending} onClick={() => clearBillingAccess.mutate({ userId: agency.id })}>
                  {clearBillingAccess.isPending ? <Loader2 className="animate-spin" /> : <CircleAlert />}
                  End temporary access
                </Button>
              </>
            ) : shouldOfferBillingRestore ? (
              <>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">This agency is not currently active. Grant a short support window without changing its Stripe subscription.</p>
                <Button variant="outline" className="mt-4 w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/10" disabled={grantBillingAccess.isPending} onClick={() => grantBillingAccess.mutate({ userId: agency.id, days: 7 })}>
                  {grantBillingAccess.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                  Restore access for 7 days
                </Button>
              </>
            ) : (
              <p className="mt-2 text-xs leading-5 text-emerald-300">Subscription access is active. No temporary override is needed.</p>
            )}
          </section>

          <section className="rounded-xl border border-white/8 bg-card p-5">
            <div className="flex items-center gap-2"><KeyRound size={15} className="text-blue-400" /><p className="text-sm font-semibold text-foreground">Temporary credential reset</p></div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Set a temporary password and share it privately with this agency. Existing sessions are not revoked.</p>
            <div className="mt-4 space-y-3">
              <Input type="password" value={temporaryPassword} onChange={event => setTemporaryPassword(event.target.value)} placeholder="Minimum 8 characters" />
              <Button variant="outline" className="w-full border-white/10" disabled={temporaryPassword.length < 8 || resetPassword.isPending} onClick={() => resetPassword.mutate({ userId: agency.id, temporaryPassword })}>
                {resetPassword.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
                Reset temporary password
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
    <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify customer before Client View</DialogTitle>
          <DialogDescription>Ask the caller for their seven-digit Customer ID and either their account email or the last four digits of their phone number.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2"><Label htmlFor="support-customer-id">Customer ID</Label><Input id="support-customer-id" inputMode="numeric" maxLength={7} placeholder="7-digit ID from caller" value={customerIdInput} onChange={event => setCustomerIdInput(event.target.value.replace(/\D/g, "").slice(0, 7))} /></div>
          <div className="space-y-2"><Label htmlFor="support-verification">Email or phone last four</Label><Input id="support-verification" placeholder="name@agency.com or 1234" value={verification} onChange={event => setVerification(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="support-reason">Support note</Label><Input id="support-reason" value={supportReason} onChange={event => setSupportReason(event.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSupportOpen(false)}>Cancel</Button>
          <Button disabled={customerIdInput.length !== 7 || verification.trim().length < 4 || supportReason.trim().length < 3 || startClientView.isPending} onClick={() => startClientView.mutate({ targetUserId: agency.id, customerId: customerIdInput, verification, reason: supportReason })}>
            {startClientView.isPending ? <Loader2 className="animate-spin" /> : <Eye />} Verify & view client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function CreateAgencyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ firstName: "", lastName: "", agencyName: "", email: "", phone: "", website: "", temporaryPassword: "", notes: "" });
  const setField = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }));
  const createAgency = trpc.admin.createAgency.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.admin.overview.invalidate(), utils.admin.listAgencies.invalidate()]);
      setForm({ firstName: "", lastName: "", agencyName: "", email: "", phone: "", website: "", temporaryPassword: "", notes: "" });
      onOpenChange(false);
      toast.success("Agency account created and marked as invited");
    },
    onError: error => toast.error(error.message),
  });

  const canSubmit = form.firstName && form.lastName && form.agencyName && form.email && form.temporaryPassword.length >= 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manually onboard an agency</DialogTitle>
          <DialogDescription>Create the account, set a temporary password, and begin the guided onboarding workflow.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="admin-first-name">First name</Label><Input id="admin-first-name" value={form.firstName} onChange={e => setField("firstName", e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="admin-last-name">Last name</Label><Input id="admin-last-name" value={form.lastName} onChange={e => setField("lastName", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-agency-name">Agency name</Label><Input id="admin-agency-name" value={form.agencyName} onChange={e => setField("agencyName", e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="admin-email">Email</Label><Input id="admin-email" type="email" value={form.email} onChange={e => setField("email", e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="admin-phone">Phone</Label><Input id="admin-phone" value={form.phone} onChange={e => setField("phone", e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="admin-website">Website</Label><Input id="admin-website" value={form.website} onChange={e => setField("website", e.target.value)} placeholder="https://" /></div>
          <div className="space-y-2"><Label htmlFor="admin-password">Temporary password</Label><Input id="admin-password" type="password" value={form.temporaryPassword} onChange={e => setField("temporaryPassword", e.target.value)} placeholder="Minimum 8 characters" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-notes">Internal onboarding notes</Label><textarea id="admin-notes" value={form.notes} onChange={e => setField("notes", e.target.value)} rows={3} placeholder="For example: schedule Google Ads connection call on Thursday." className="w-full resize-none rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-500/60" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSubmit || createAgency.isPending} onClick={() => createAgency.mutate(form)}>
            {createAgency.isPending ? <Loader2 className="animate-spin" /> : <UserRoundPlus />}
            Create agency account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const searchInput = useMemo(() => ({ search: search.trim() || undefined }), [search]);
  const agencyInput = useMemo(() => ({ userId: selectedAgencyId ?? 0 }), [selectedAgencyId]);
  const enabled = user?.role === "admin";
  const overview = trpc.admin.overview.useQuery(undefined, { enabled });
  const agencies = trpc.admin.listAgencies.useQuery(searchInput, { enabled });
  const selectedAgency = trpc.admin.getAgency.useQuery(agencyInput, { enabled: enabled && selectedAgencyId !== null });

  useEffect(() => {
    if (!loading && user && user.role !== "admin") setLocation("/dashboard");
  }, [loading, setLocation, user]);

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-sm text-center"><ShieldCheck className="mx-auto text-blue-400" size={32} /><h1 className="mt-4 text-xl font-semibold">Admin access required</h1><p className="mt-2 text-sm text-muted-foreground">This workspace is reserved for AIA administrators.</p></div>
      </div>
    );
  }

  const isLoading = overview.isLoading || agencies.isLoading;
  const detail = selectedAgency.data;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {selectedAgencyId && detail ? (
        <AgencyDetails agency={detail} onClose={() => setSelectedAgencyId(null)} />
      ) : (
        <main className="min-w-0 flex-1 overflow-y-auto">
          <header className="border-b border-white/8 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-400"><ShieldCheck size={16} /><span className="text-xs font-semibold uppercase tracking-[0.16em]">AIA control center</span></div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Agency operations</h1>
                <p className="mt-1 text-sm text-muted-foreground">Manage customer readiness from invitation through live attribution.</p>
              </div>
              <Button onClick={() => setCreateOpen(true)}><Plus /> Manually onboard agency</Button>
            </div>
          </header>

          <div className="space-y-6 p-5 sm:p-7">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <OverviewCard label="Total agencies" value={overview.data?.totals.agencies ?? 0} helper="All registered customer workspaces" icon={ShieldCheck} accent="bg-blue-500/15 text-blue-400" />
              <OverviewCard label="Active subscriptions" value={overview.data?.totals.activeSubscriptions ?? 0} helper="Active or trialing subscriptions" icon={CreditCard} accent="bg-emerald-500/15 text-emerald-400" />
              <OverviewCard label="Needs onboarding" value={overview.data?.totals.onboardingInProgress ?? 0} helper="Not started, invited, or in progress" icon={UserRoundPlus} accent="bg-amber-500/15 text-amber-400" />
              <OverviewCard label="Reporting ready" value={overview.data?.totals.readyToReport ?? 0} helper="Both Google Ads and GHL connected" icon={CircleCheck} accent="bg-blue-500/15 text-blue-400" />
            </section>

            <section className="overflow-hidden rounded-xl border border-white/8 bg-card">
              <div className="flex flex-col gap-3 border-b border-white/8 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="text-base font-semibold text-foreground">Agency directory</h2><p className="mt-1 text-xs text-muted-foreground">Review setup health, subscriptions, and next actions in one place.</p></div>
                <div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search agency, email, or Customer ID" className="pl-9" /></div>
              </div>

              {isLoading ? (
                <div className="flex h-56 items-center justify-center"><Loader2 className="animate-spin text-blue-400" /></div>
              ) : agencies.data?.length ? (
                <>
                  <div className="divide-y divide-white/6 sm:hidden">
                    {agencies.data.map(agency => (
                      <button key={agency.id} onClick={() => setSelectedAgencyId(agency.id)} className="block w-full px-4 py-4 text-left transition-colors hover:bg-white/[0.025]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0"><p className="truncate font-medium text-foreground">{agency.agencyName || agency.name || "Untitled agency"}</p><p className="mt-1 truncate text-xs text-muted-foreground">{agency.email || "No email"}</p></div>
                          <StatusPill status={agency.onboardingStatus} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2"><ConnectionMark connected={agency.googleAds.isConnected} label="Google" /><ConnectionMark connected={agency.ghl.isConnected} label="GHL" /><span className={`text-xs font-medium ${isActiveSubscription(agency.subscription.status) ? "text-emerald-400" : "text-muted-foreground"}`}>{agency.subscription.status || "No subscription"}</span></div>
                      </button>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[860px] text-left">
                    <thead className="bg-white/[0.025] text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><tr><th className="px-5 py-3">Agency</th><th className="px-4 py-3">Onboarding</th><th className="px-4 py-3">Connections</th><th className="px-4 py-3">Subscription</th><th className="px-4 py-3">Last sign-in</th><th className="px-4 py-3" /></tr></thead>
                    <tbody className="divide-y divide-white/6">
                      {agencies.data.map(agency => (
                        <tr key={agency.id} className="group transition-colors hover:bg-white/[0.025]">
                          <td className="px-5 py-4"><div className="font-medium text-foreground">{agency.agencyName || agency.name || "Untitled agency"}</div><div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={12} /> {agency.email || "No email"}</div></td>
                          <td className="px-4 py-4"><StatusPill status={agency.onboardingStatus} /><p className="mt-2 text-[11px] text-muted-foreground">Updated {formatDate(agency.onboardingUpdatedAt || agency.createdAt)}</p></td>
                          <td className="px-4 py-4"><div className="flex flex-col gap-1.5"><ConnectionMark connected={agency.googleAds.isConnected} label="Google Ads" /><ConnectionMark connected={agency.ghl.isConnected} label="GoHighLevel" /></div></td>
                          <td className="px-4 py-4"><span className={`text-xs font-medium ${isActiveSubscription(agency.subscription.status) ? "text-emerald-400" : "text-muted-foreground"}`}>{agency.subscription.status ? agency.subscription.status.replace("_", " ") : "No subscription"}</span><p className="mt-1 text-[11px] text-muted-foreground">{agency.subscription.planName || "Starter plan"}</p></td>
                          <td className="px-4 py-4 text-xs text-muted-foreground">{formatDate(agency.lastSignedIn)}</td>
                          <td className="px-4 py-4 text-right"><Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300" onClick={() => setSelectedAgencyId(agency.id)}>Open <ChevronRight size={14} /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              ) : (
                <div className="flex h-56 flex-col items-center justify-center px-6 text-center"><Search size={22} className="text-muted-foreground" /><p className="mt-3 text-sm font-medium text-foreground">No agencies found</p><p className="mt-1 text-xs text-muted-foreground">Try another search or create your first agency account.</p></div>
              )}
            </section>
          </div>
        </main>
      )}
      {selectedAgencyId && selectedAgency.isLoading && <div className="flex min-w-0 flex-1 items-center justify-center"><Loader2 className="animate-spin text-blue-400" /></div>}
      {selectedAgency.error && <div className="fixed bottom-5 right-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">Could not load agency details. <button onClick={() => { setSelectedAgencyId(null); utils.admin.getAgency.reset(); }} className="ml-2 underline">Close</button></div>}
      <CreateAgencyDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
