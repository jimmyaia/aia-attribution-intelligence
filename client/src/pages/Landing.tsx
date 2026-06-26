import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  Zap, BarChart2, TrendingUp, Phone, Trophy, ChevronRight,
} from "lucide-react";
import { Link } from "wouter";

const FEATURES = [
  {
    icon: BarChart2,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "Campaign → Ad Group → Ad",
    desc: "Three-level drill-down from campaign overview to individual ad headlines. See exactly which ad is driving leads.",
  },
  {
    icon: Phone,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Phone Calls + Web Forms",
    desc: "GoHighLevel is the source of truth. Leads split by form submissions and inbound calls — not Google's estimated conversions.",
  },
  {
    icon: Trophy,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    title: "Won Deals & Revenue",
    desc: "Track closed deals and revenue from GHL pipelines. Calculate true Cost Per Sale and ROAS per campaign.",
  },
  {
    icon: TrendingUp,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    title: "Real Attribution KPIs",
    desc: "CPC, CPL, CPS, ROAS, and conversion rate — all calculated from your actual CRM data.",
  },
];

const KPIS = [
  { label: "Cost Per Click", value: "$21.93", sub: "Google Ads" },
  { label: "Cost Per Lead", value: "$99.11", sub: "GHL Forms + Calls" },
  { label: "Cost Per Sale", value: "$412", sub: "GHL Won Deals" },
  { label: "ROAS", value: "3.8x", sub: "Revenue / Spend" },
];

const CHECKLIST = [
  "Connect Google Ads via OAuth in one click",
  "Paste your GoHighLevel API key — done",
  "Form submissions and phone calls tracked separately",
  "Campaign, Ad Group, and Ad level reporting",
  "Cost Per Lead and Cost Per Sale from real CRM data",
  "Won deals and revenue from GHL pipelines",
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Zap size={14} className="text-blue-400" />
            </div>
            <span className="font-bold text-sm tracking-tight">Attribution Intelligence</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
                Pricing
              </button>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="gap-1.5">
                  Dashboard <ChevronRight size={14} />
                </Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
                    Log In
                  </button>
                </a>
                <a href={getLoginUrl()}>
                  <Button size="sm" className="gap-1.5">
                    Get Started <ChevronRight size={14} />
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1.5 mb-6">
          <Zap size={11} />
          Google Ads × GoHighLevel Attribution
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">
          Know exactly which ads<br />
          <span className="text-blue-400">drive real revenue</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Connect your Google Ads account and GoHighLevel sub-account to get a
          full attribution dashboard — from ad click to closed deal, with
          Cost Per Lead and Cost Per Sale calculated from your actual CRM data.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href={getLoginUrl()}>
            <Button size="lg" className="gap-2 px-8">
              Start Free Trial <ChevronRight size={16} />
            </Button>
          </a>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="gap-2 px-8">
              See Pricing
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">$49/month · Cancel anytime · No setup fees</p>
      </section>

      {/* KPI Preview */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {KPIS.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-white/8 bg-card p-4 text-center"
            >
              <div className="text-2xl font-bold text-foreground mb-1">{kpi.value}</div>
              <div className="text-xs font-semibold text-foreground mb-0.5">{kpi.label}</div>
              <div className="text-[11px] text-muted-foreground">{kpi.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center mb-2">
          Everything agencies need for real attribution
        </h2>
        <p className="text-muted-foreground text-center mb-10 text-sm">
          Built specifically for agencies running Google Ads with GoHighLevel CRM
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-white/8 bg-card p-5 flex gap-4"
            >
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${f.bg}`}>
                <f.icon size={18} className={f.color} />
              </div>
              <div>
                <div className="font-semibold text-foreground mb-1">{f.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Checklist + CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-white/8 bg-card p-8 sm:p-12 flex flex-col lg:flex-row gap-10 items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Ready in minutes</h2>
            <p className="text-muted-foreground text-sm mb-6">
              No complex setup. Connect your accounts and start seeing attribution data immediately.
            </p>
            <ul className="flex flex-col gap-3">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center gap-4 lg:pt-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">$49</div>
              <div className="text-muted-foreground text-sm">per month</div>
            </div>
            <a href={getLoginUrl()} className="w-full">
              <Button size="lg" className="w-full gap-2">
                Get Started <ChevronRight size={16} />
              </Button>
            </a>
            <p className="text-xs text-muted-foreground text-center">Cancel anytime. No contracts.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-6 text-center text-xs text-muted-foreground">
        Attribution Intelligence · Google Ads × GoHighLevel
      </footer>
    </div>
  );
}
