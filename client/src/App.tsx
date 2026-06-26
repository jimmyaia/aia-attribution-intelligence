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
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import { useEffect } from "react";

// Guard: after login, check if profile is complete and redirect accordingly
function PostLoginRedirect() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const profileQuery = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!user && !loading,
  });

  useEffect(() => {
    if (loading || profileQuery.isLoading) return;
    if (!user) return;
    // Only redirect when on the root or /dashboard without a profile
    if (location === "/" || location === "/dashboard") {
      if (profileQuery.data && !profileQuery.data.profileComplete) {
        setLocation("/onboarding");
      }
    }
  }, [user, loading, profileQuery.data, profileQuery.isLoading, location, setLocation]);

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
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/integrations" component={Integrations} />
        <Route path="/dashboard/billing" component={Billing} />
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
