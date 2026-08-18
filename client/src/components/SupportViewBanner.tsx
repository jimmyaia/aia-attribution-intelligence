import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Eye, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function SupportViewBanner() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const exit = trpc.support.exit.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      await utils.subscription.invalidate();
      toast.success("Returned to your administrator workspace");
      setLocation("/admin");
    },
    onError: error => toast.error(error.message),
  });

  if (!user?.supportView) return null;

  const expiresAt = new Date(user.supportView.expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-amber-50 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/15 text-amber-300"><Eye size={14} /></span>
          <p className="text-xs leading-5 sm:text-sm"><strong>Client View — read only.</strong> You are viewing <strong>{user.agencyName || user.name || "this client"}</strong> as {user.supportView.adminName}. Expires at {expiresAt}.</p>
        </div>
        <Button size="sm" variant="outline" className="h-8 border-amber-500/35 bg-transparent text-amber-100 hover:bg-amber-500/15 hover:text-amber-50" onClick={() => exit.mutate()} disabled={exit.isPending}>
          {exit.isPending ? <Loader2 className="animate-spin" /> : <X />}
          Exit Client View
        </Button>
      </div>
    </div>
  );
}
