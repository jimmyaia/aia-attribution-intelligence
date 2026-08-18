import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Integrations from "./pages/Integrations";
import Billing from "./pages/Billing";
import Onboarding from "./pages/Onboarding";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AccountLocked from "./pages/AccountLocked";
import Settings from "./pages/Settings";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import { useEffect } from "react";

// Guard: after login, check if profile is complete and redirect accordingly
function PostLoginRedirect() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const accessQuery = trpc.subscription.getAccess.useQuery(undefined, {
    enabled: !!user && !loading,
  });
  const profileQuery = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!user && !loading && Boolean(accessQuery.data?.allowed),
  });

  useEffect(() => {
    if (loading || profileQuery.isLoading || accessQuery.isLoading) return;
    if (!user) return;
    if (user.supportView) return;
    // Only redirect to onboarding when the user navigates to the dashboard
    // Never redirect on public pages (/, /pricing, /onboarding)
    const recoveryRoutes = ["/", "/pricing", "/onboarding", "/register", "/login", "/account-locked", "/dashboard/billing", "/dashboard/settings", "/404"];
    if (!accessQuery.data?.allowed && !recoveryRoutes.includes(location)) {
      setLocation("/account-locked");
      return;
    }
    if (recoveryRoutes.includes(location)) return;
    if (profileQuery.data && !profileQuery.data.profileComplete) {
      setLocation("/onboarding");
    }
  }, [user, loading, profileQuery.data, profileQuery.isLoading, accessQuery.data, accessQuery.isLoading, location, setLocation]);

  return null;
}

function Router() {
  return (
    <>
      <PostLoginRedirect />
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/account-locked" component={AccountLocked} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/integrations" component={Integrations} />
        <Route path="/dashboard/billing" component={Billing} />
        <Route path="/dashboard/settings" component={Settings} />
        <Route path="/admin" component={Admin} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
