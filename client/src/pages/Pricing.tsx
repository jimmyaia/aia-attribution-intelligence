import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const FEATURES = [
  "1 Google Ads account (OAuth)",
  "1 GoHighLevel sub-account (API key)",
  "Full attribution dashboard",
  "Campaign, Ad Group & Ad level reporting",
  "Web form + phone call lead tracking",
  "Won deal & revenue tracking",
  "Cost Per Lead & Cost Per Sale KPIs",
  "ROAS per campaign",
  "Weekly trend sparklines",
  "Attribution funnel visualization",
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    toast.info("Redirecting to checkout...");
    createCheckout.mutate({ origin: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Zap size={14} className="text-blue-400" />
              </div>
              <span className="font-bold text-sm tracking-tight">Attribution Intelligence</span>
            </div>
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="gap-1.5">
                Dashboard <ChevronRight size={14} />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="sm" className="gap-1.5">
                Sign In <ChevronRight size={14} />
              </Button>
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-8 text-center">
        <h1 className="text-4xl font-bold mb-3">Simple, transparent pricing</h1>
        <p className="text-muted-foreground">
          One plan. Everything you need to connect Google Ads to GoHighLevel and see real attribution.
        </p>
      </section>

      {/* Plan Card */}
      <section className="max-w-md mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-blue-500/30 bg-card p-8 relative overflow-hidden">
          {/* Glow */}
          <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-4">
              <Zap size={10} />
              Starter Plan
            </div>

            <div className="flex items-end gap-2 mb-1">
              <span className="text-5xl font-bold text-foreground">$49</span>
              <span className="text-muted-foreground mb-2">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Per agency sub-account. Cancel anytime.
            </p>

            <Button
              size="lg"
              className="w-full gap-2 mb-6"
              onClick={handleSubscribe}
              disabled={createCheckout.isPending}
            >
              {createCheckout.isPending ? "Redirecting..." : "Get Started"}
              <ChevronRight size={16} />
            </Button>

            <div className="border-t border-white/8 pt-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                What's included
              </p>
              <ul className="flex flex-col gap-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-5 border-t border-white/8 text-center">
              <p className="text-xs text-muted-foreground">
                Test with card <span className="font-mono text-foreground">4242 4242 4242 4242</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          More platforms coming soon: Meta, LinkedIn, TikTok
        </p>
      </section>
    </div>
  );
}
