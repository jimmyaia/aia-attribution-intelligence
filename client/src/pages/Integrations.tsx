import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { SupportViewBanner } from "@/components/SupportViewBanner";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Zap, BarChart2, CreditCard, LogOut, Link2,
  CheckCircle2, AlertCircle, ExternalLink, Unlink,
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
        <span className="font-bold text-xs tracking-tight truncate">AIA</span>
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

function GoogleAdsCard() {
  const { user } = useAuth();
  const { data: conn, refetch } = trpc.googleAds.getConnection.useQuery();
  const [origin] = useState(() => window.location.origin);
  const isReadOnly = Boolean(user?.supportView || user?.agencyMemberRole === "member");
  const readOnlyMessage = user?.supportView
    ? "Client View is read-only. Connection changes are disabled."
    : "Only an agency owner can change advertising connections.";
  const { data: authData } = trpc.googleAds.getAuthorizeUrl.useQuery(
    { origin },
    { enabled: !conn?.isConnected && !isReadOnly }
  );
  const disconnect = trpc.googleAds.disconnect.useMutation({
    onSuccess: () => { toast.success("Google Ads disconnected."); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  // Handle success/error query params from OAuth callback
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  useEffect(() => {
    if (searchParams.get("google_connected") === "1") {
      toast.success("Google Ads connected successfully!");
      refetch();
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("google_connected");
      window.history.replaceState({}, "", url.toString());
    }
    if (searchParams.get("google_error")) {
      toast.error("Google Ads connection failed: " + searchParams.get("google_error"));
      const url = new URL(window.location.href);
      url.searchParams.delete("google_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return (
    <div className="rounded-xl border border-white/8 bg-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4" />
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#g)" />
              <defs>
                <linearGradient id="g" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#4285F4" />
                  <stop offset="0.33" stopColor="#34A853" />
                  <stop offset="0.66" stopColor="#FBBC05" />
                  <stop offset="1" stopColor="#EA4335" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-foreground">Google Ads</div>
            <div className="text-xs text-muted-foreground">OAuth 2.0 — connects via Google account</div>
          </div>
        </div>
        {conn?.isConnected ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
            <CheckCircle2 size={11} /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
            <AlertCircle size={11} /> Not connected
          </span>
        )}
      </div>

      {conn?.isConnected ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-white/4 border border-white/8 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account</span>
              <span className="text-foreground font-medium">{conn.googleAccountName ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{conn.googleEmail ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-muted-foreground">Account ID</span>
              <span className="text-foreground font-mono text-xs">{conn.googleAccountId ?? "—"}</span>
            </div>
          </div>
          {isReadOnly ? (
            <p className="text-xs text-amber-300">{readOnlyMessage}</p>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5 text-rose-400 border-rose-500/20 hover:bg-rose-500/10" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
              <Unlink size={13} /> Disconnect
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect your Google Ads account via OAuth to pull campaign spend, clicks, impressions, and CTR data.
          </p>
          {isReadOnly ? (
            <p className="text-xs text-amber-300">{readOnlyMessage}</p>
          ) : authData?.configured ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => { if (authData.url) window.location.href = authData.url; }}
            >
              <ExternalLink size={13} /> Connect Google Ads via OAuth
            </Button>
          ) : (
            <>
              <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 p-3 text-xs text-amber-300">
                <strong>Setup required:</strong> Google Ads OAuth needs a Google Cloud project with the Ads API enabled.
                Add <code className="font-mono">GOOGLE_CLIENT_ID</code>, <code className="font-mono">GOOGLE_CLIENT_SECRET</code>,
                and <code className="font-mono">GOOGLE_ADS_DEVELOPER_TOKEN</code> to your environment to enable this integration.
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" disabled>
                <ExternalLink size={13} /> Connect Google Ads (credentials required)
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function GhlCard() {
  const { user } = useAuth();
  const { data: conn, refetch } = trpc.ghl.getConnection.useQuery();
  const [apiKey, setApiKey] = useState("");
  const [locationId, setLocationId] = useState("");
  const isReadOnly = Boolean(user?.supportView || user?.agencyMemberRole === "member");
  const readOnlyMessage = user?.supportView
    ? "Client View is read-only. API keys and connection changes are disabled."
    : "Only an agency owner can view connection diagnostics and change API connections.";

  const saveKey = trpc.ghl.saveApiKey.useMutation({
    onSuccess: (data) => {
      toast.success(`Connected to ${data.locationName}`);
      setApiKey("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const disconnect = trpc.ghl.disconnect.useMutation({
    onSuccess: () => { toast.success("GoHighLevel disconnected."); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="rounded-xl border border-white/8 bg-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <span className="text-orange-400 font-bold text-sm">GHL</span>
          </div>
          <div>
            <div className="font-semibold text-foreground">GoHighLevel</div>
            <div className="text-xs text-muted-foreground">API Key — connects to your sub-account</div>
          </div>
        </div>
        {conn?.isConnected ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
            <CheckCircle2 size={11} /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
            <AlertCircle size={11} /> Not connected
          </span>
        )}
      </div>

      {conn?.isConnected ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-white/4 border border-white/8 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="text-foreground font-medium">{conn.locationName ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-muted-foreground">Location ID</span>
              <span className="text-foreground font-mono text-xs">{conn.locationId ?? "—"}</span>
            </div>
            {conn.connectedAt && (
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-muted-foreground">Connected</span>
                <span className="text-foreground text-xs">
                  {new Date(conn.connectedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          {isReadOnly ? <p className="text-xs text-amber-300">{readOnlyMessage}</p> : <Button variant="outline" size="sm" className="gap-1.5 text-rose-400 border-rose-500/20 hover:bg-rose-500/10" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}><Unlink size={13} /> Disconnect</Button>}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste your GoHighLevel API key to connect your sub-account. This is used to pull form submissions,
            inbound calls, opportunities, and won deals.
          </p>
          <div className="rounded-lg bg-blue-500/8 border border-blue-500/20 p-3 text-xs text-blue-300">
            <strong>Where to find your API key:</strong> In GoHighLevel, go to
            Settings → Integrations → API Key. Copy the key and paste it below.
          </div>
          {!isReadOnly && <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">GHL API Key *</Label>
              <Input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Location ID (optional)</Label>
              <Input
                placeholder="Leave blank to auto-detect"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => saveKey.mutate({ apiKey, locationId: locationId || undefined })}
              disabled={saveKey.isPending || !apiKey.trim()}
            >
              <Link2 size={13} />
              {saveKey.isPending ? "Connecting..." : "Connect GoHighLevel"}
            </Button>
          </div>}
          {isReadOnly && <p className="text-xs text-amber-300">{readOnlyMessage}</p>}
        </div>
      )}
    </div>
  );
}

export default function Integrations() {
  const { user, loading } = useAuth();

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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SupportViewBanner />
        <div className="max-w-3xl mx-auto w-full px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground mb-1">Integrations</h1>
            <p className="text-sm text-muted-foreground">
              Connect your Google Ads account and GoHighLevel sub-account to enable live attribution data.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <GoogleAdsCard />
            <GhlCard />
          </div>
        </div>
      </div>
    </div>
  );
}
