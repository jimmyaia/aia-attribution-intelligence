import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink, Loader2, LockKeyhole, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

const STATUS_COPY: Record<string, { title: string; detail: string }> = {
  past_due: {
    title: "Your payment needs attention",
    detail: "Your AIA workspace is temporarily paused while we wait for a successful payment.",
  },
  canceled: {
    title: "Your subscription has ended",
    detail: "Restart your AIA subscription to restore workspace access.",
  },
  unpaid: {
    title: "Your subscription payment was not completed",
    detail: "Complete payment to restore workspace access.",
  },
  incomplete: {
    title: "Finish activating your subscription",
    detail: "Your AIA workspace will unlock once checkout is completed.",
  },
};

export default function AccountLocked() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const access = trpc.subscription.getAccess.useQuery(undefined, {
    enabled: Boolean(user),
    refetchInterval: 15_000,
  });
  const subscription = trpc.subscription.get.useQuery(undefined, { enabled: Boolean(user) });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: data => {
      if (data.url) window.location.assign(data.url);
    },
    onError: error => toast.error(error.message),
  });
  const createPortal = trpc.subscription.createPortal.useMutation({
    onSuccess: data => {
      if (data.url) window.location.assign(data.url);
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (access.data?.allowed) setLocation("/dashboard");
  }, [access.data?.allowed, setLocation]);

  if (loading || (user && access.isLoading)) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-blue-400" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center"><LockKeyhole className="mx-auto text-blue-400" size={28} /><h1 className="mt-4 text-xl font-semibold">Sign in required</h1><Link href="/login"><Button className="mt-5">Sign in</Button></Link></div>
      </div>
    );
  }

  const status = access.data?.subscriptionStatus ?? subscription.data?.status ?? "incomplete";
  const copy = STATUS_COPY[status] ?? STATUS_COPY.incomplete;
  const canUsePortal = Boolean(subscription.data?.stripeCustomerId);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_65%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <section className="w-full rounded-2xl border border-white/10 bg-card/95 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400"><LockKeyhole size={20} /></div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">Workspace temporarily paused</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{copy.title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.detail} Your attribution data and connections remain protected; you can resume right where you left off after payment is resolved.</p>

          {access.data?.graceEndsAt && (
            <div className="mt-5 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-3 text-sm text-amber-100"><AlertCircle className="mt-0.5 shrink-0 text-amber-400" size={16} /><span>Your grace period ended on <strong>{new Date(access.data.graceEndsAt).toLocaleDateString()}</strong>.</span></div>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {canUsePortal ? (
              <Button onClick={() => createPortal.mutate({ origin: window.location.origin })} disabled={createPortal.isPending}>
                {createPortal.isPending ? <Loader2 className="animate-spin" /> : <ExternalLink />}
                Update payment method
              </Button>
            ) : (
              <Button onClick={() => createCheckout.mutate({ origin: window.location.origin })} disabled={createCheckout.isPending}>
                {createCheckout.isPending ? <Loader2 className="animate-spin" /> : <CreditCard />}
                Start subscription
              </Button>
            )}
            <Button variant="outline" className="border-white/10" onClick={() => { access.refetch(); subscription.refetch(); }} disabled={access.isFetching}>
              {access.isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Check payment status
            </Button>
          </div>
          <div className="mt-6 flex items-start gap-2 border-t border-white/8 pt-5 text-xs leading-5 text-muted-foreground"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />A successful Stripe payment automatically restores dashboard access. If you need help, contact your AIA administrator.</div>
          <button onClick={() => logout()} className="mt-5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Sign out</button>
        </section>
      </div>
    </main>
  );
}
