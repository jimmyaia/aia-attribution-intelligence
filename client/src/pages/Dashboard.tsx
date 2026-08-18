import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Zap, BarChart2, CreditCard, LogOut, Settings,
  AlertCircle, Link2, ShieldCheck,
} from "lucide-react";
import Home from "./Home";
import { SupportViewBanner } from "@/components/SupportViewBanner";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const nav = [
    { icon: BarChart2, label: "Attribution Report", path: "/dashboard" },
    { icon: Link2, label: "Integrations", path: "/dashboard/integrations" },
    { icon: CreditCard, label: "Billing", path: "/dashboard/billing" },
    { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  ];
  if (user?.role === "admin") {
    nav.push({ icon: ShieldCheck, label: "Admin", path: "/admin" });
  }

  return (
    <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-white/8 bg-card sm:flex sm:h-screen sm:sticky sm:top-0">
      <div className="h-14 flex items-center justify-center gap-2.5 px-3 sm:justify-start sm:px-4 border-b border-white/8">
        <div className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <Zap size={12} className="text-blue-400" />
        </div>
        <span className="hidden sm:inline font-bold text-xs tracking-tight truncate">AIA</span>
      </div>

      <nav className="flex-1 p-2 flex flex-col gap-0.5">
        {nav.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => setLocation(path)}
            title={label}
            aria-label={label}
            className={`w-full flex justify-center sm:justify-start items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
              location === path
                ? "bg-blue-500/15 text-blue-400 font-medium"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
            >
              <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-2 border-t border-white/8">
        <div className="flex items-center justify-center sm:justify-start gap-2.5 px-3 py-2 mb-1">
          <div className="w-6 h-6 overflow-hidden rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-400 flex-shrink-0">
            {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="Profile" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center">{user?.name?.[0]?.toUpperCase() ?? "U"}</span>}
          </div>
          <div className="hidden sm:block min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{user?.name ?? "User"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email ?? ""}</div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="w-full flex justify-center sm:justify-start items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const nav = [
    { icon: BarChart2, label: "Report", path: "/dashboard" },
    { icon: Link2, label: "Connect", path: "/dashboard/integrations" },
    { icon: CreditCard, label: "Billing", path: "/dashboard/billing" },
    { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  ];
  if (user?.role === "admin") nav.push({ icon: ShieldCheck, label: "Admin", path: "/admin" });

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-card/95 px-2 py-1.5 backdrop-blur sm:hidden">
      {nav.map(({ icon: Icon, label, path }) => <button key={path} onClick={() => setLocation(path)} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md py-1 text-[10px] ${location === path ? "text-blue-400" : "text-muted-foreground"}`}><Icon size={16} /><span className="truncate">{label}</span></button>)}
      <button onClick={logout} className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md py-1 text-[10px] text-muted-foreground"><LogOut size={16} /><span>Exit</span></button>
    </nav>
  );
}

function SubscriptionBanner() {
  const { user } = useAuth();
  const { data: sub } = trpc.subscription.get.useQuery();
  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.open(data.url, "_blank"); },
    onError: (err) => toast.error(err.message),
  });

  if (user?.supportView || !sub || sub.status === "active" || sub.status === "trialing") return null;

  return (
    <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 mx-6 mt-4 text-sm">
      <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
      <span className="text-amber-300 flex-1">
        Your subscription is <strong>{sub.status}</strong>. Activate it to see live data.
      </span>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 flex-shrink-0"
        onClick={() => {
          toast.info("Redirecting to checkout...");
          createCheckout.mutate({ origin: window.location.origin });
        }}
        disabled={createCheckout.isPending}
      >
        Subscribe — $49/mo
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Handle checkout success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success("Subscription activated! Welcome to AIA Attribution Intelligence.");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

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
        <div className="text-center max-w-sm px-6">
          <h2 className="text-xl font-bold mb-2">Sign in required</h2>
          <p className="text-muted-foreground text-sm mb-6">
            You need to sign in to access the attribution dashboard.
          </p>
          <Link href="/login">
            <Button size="lg" className="w-full">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex min-w-0 flex-col pb-16 sm:pb-0">
        <SupportViewBanner />
        <SubscriptionBanner />
        <Home />
      </div>
      <MobileNavigation />
    </div>
  );
}
