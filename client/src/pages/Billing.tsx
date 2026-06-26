import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import {
  Zap, BarChart2, CreditCard, LogOut, Link2,
  CheckCircle2, AlertCircle, ExternalLink,
} from "lucide-react";

function Sidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const NAV = [
    { icon: BarChart2, label: "Attribution Report", path: "/dashboard" },
    { icon: Link2, label: "Integrations", path: "/dashboard/integrations" },
    { icon: CreditCard, label: "Billing", path: "/dashboard/billing" },
  ];

  return (
    <aside className="w-56 flex-shrink-0 border-r border-white/8 bg-card flex flex-col min-h-screen">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/8">
        <div className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <Zap size={12} className="text-blue-400" />
        </div>
        <span className="font-bold text-xs tracking-tight truncate">OneTouch</span>
      </div>
      <nav className="flex-1 p-2 flex flex-col gap-0.5">
        {NAV.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => setLocation(path)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
              location === path
                ? "bg-blue-500/15 text-blue-400 font-medium"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>
      <div className="p-2 border-t border-white/8">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{user?.name ?? "User"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email ?? ""}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  trialing: { label: "Trial", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  past_due: { label: "Past Due", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  canceled: { label: "Canceled", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  incomplete: { label: "Incomplete", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

export default function Billing() {
  const { user, loading } = useAuth();
  const { data: sub, isLoading: subLoading } = trpc.subscription.get.useQuery();

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  const createPortal = trpc.subscription.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Link href="/login">
          <Button size="lg">Sign In</Button>
        </Link>
      </div>
    );
  }

  const statusInfo = sub?.status ? STATUS_MAP[sub.status] ?? STATUS_MAP["incomplete"] : null;
  const isActive = sub?.status === "active" || sub?.status === "trialing";

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="max-w-2xl mx-auto w-full px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground mb-1">Billing</h1>
            <p className="text-sm text-muted-foreground">
              Manage your OneTouch Attribution Intelligence subscription.
            </p>
          </div>

          {subLoading ? (
            <div className="rounded-xl border border-white/8 bg-card p-8 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="rounded-xl border border-white/8 bg-card p-6 space-y-5">
              {/* Plan header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-foreground text-lg">Starter Plan</div>
                  <div className="text-sm text-muted-foreground mt-0.5">$49 / month</div>
                </div>
                {statusInfo ? (
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color} ${statusInfo.bg} ${statusInfo.border}`}>
                    {isActive ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                    {statusInfo.label}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                    <AlertCircle size={11} /> No subscription
                  </span>
                )}
              </div>

              {/* Subscription details */}
              {sub && (
                <div className="rounded-lg bg-white/4 border border-white/8 p-3 text-sm space-y-1.5">
                  {sub.currentPeriodEnd && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {sub.status === "canceled" ? "Access until" : "Next billing date"}
                      </span>
                      <span className="text-foreground">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {sub.cancelAtPeriodEnd && (
                    <div className="flex items-center gap-2 text-amber-400 text-xs mt-2">
                      <AlertCircle size={12} />
                      Subscription will cancel at end of billing period
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isActive ? (
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => createPortal.mutate({ origin: window.location.origin })}
                    disabled={createPortal.isPending}
                  >
                    <ExternalLink size={14} />
                    {createPortal.isPending ? "Opening..." : "Manage Subscription"}
                  </Button>
                ) : (
                  <Button
                    className="gap-1.5"
                    onClick={() => {
                      toast.info("Redirecting to checkout...");
                      createCheckout.mutate({ origin: window.location.origin });
                    }}
                    disabled={createCheckout.isPending}
                  >
                    <CreditCard size={14} />
                    {createCheckout.isPending ? "Redirecting..." : "Subscribe — $49/month"}
                  </Button>
                )}
              </div>

              {!isActive && (
                <div className="rounded-lg bg-blue-500/8 border border-blue-500/20 p-3 text-xs text-blue-300">
                  <strong>Test mode:</strong> Use card number{" "}
                  <span className="font-mono text-white">4242 4242 4242 4242</span> with any future
                  expiry and any 3-digit CVC to test the checkout flow.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
