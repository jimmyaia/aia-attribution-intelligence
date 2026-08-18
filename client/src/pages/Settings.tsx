import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Copy, KeyRound, Loader2, ShieldCheck, Upload, UserRound } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sidebar, MobileNavigation } from "./Dashboard";
import { SupportViewBanner } from "@/components/SupportViewBanner";
import { useAuth } from "@/_core/hooks/useAuth";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export default function Settings() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const profile = trpc.user.getProfile.useQuery(undefined, { enabled: Boolean(user) });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  const supportView = Boolean(user?.supportView);
  const displayedImage = imagePreview ?? profile.data?.profileImageUrl ?? user?.profileImageUrl ?? null;
  const customerId = profile.data?.customerId ?? user?.customerId ?? "Assigning…";
  const initials = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();

  const uploadImage = trpc.user.uploadProfileImage.useMutation({
    onSuccess: async data => {
      setImagePreview(data.profileImageUrl);
      await Promise.all([utils.auth.me.invalidate(), utils.user.getProfile.invalidate()]);
      toast.success("Profile image updated");
    },
    onError: error => toast.error(error.message),
  });

  const changePassword = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success("Password changed successfully");
    },
    onError: error => toast.error(error.message),
  });

  const passwordReady = useMemo(
    () => passwords.current.length > 0 && passwords.next.length >= 8 && passwords.next === passwords.confirm,
    [passwords],
  );

  const onImageSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || supportView) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Profile images must be 2 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => uploadImage.mutate({ dataUrl: String(reader.result) });
    reader.onerror = () => toast.error("Unable to read that image.");
    reader.readAsDataURL(file);
  };

  const copyCustomerId = async () => {
    try {
      await navigator.clipboard.writeText(String(customerId));
      toast.success("Customer ID copied");
    } catch {
      toast.error("Unable to copy Customer ID");
    }
  };

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-16 sm:pb-0">
        <SupportViewBanner />
        <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400">Workspace settings</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Profile & security</h1>
              <p className="mt-2 text-sm text-muted-foreground">Manage your account identity and the details you use when contacting AIA support.</p>
            </div>
            {supportView && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200">Client View is read only</span>}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <section className="rounded-xl border border-white/8 bg-card p-5 sm:p-6">
              <div className="flex items-center gap-2"><UserRound size={17} className="text-blue-400" /><h2 className="text-base font-semibold text-foreground">Profile image</h2></div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Use a recognizable image for your workspace identity. PNG, JPEG, and WebP files up to 2 MB are supported.</p>
              <div className="mt-5 flex flex-wrap items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/10">
                  {displayedImage ? <img src={displayedImage} alt="Your profile" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-blue-300">{initials}</span>}
                </div>
                <div>
                  <Label htmlFor="profile-image" className="sr-only">Profile image</Label>
                  <input id="profile-image" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={supportView || uploadImage.isPending} onChange={onImageSelected} />
                  <Button asChild variant="outline" className="border-white/10">
                    <label htmlFor="profile-image" className={supportView ? "pointer-events-none opacity-50" : "cursor-pointer"}>{uploadImage.isPending ? <Loader2 className="animate-spin" /> : <Upload />} {uploadImage.isPending ? "Uploading…" : "Upload image"}</label>
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">Your image is visible only within your AIA workspace.</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-blue-500/20 bg-blue-500/[0.06] p-5 sm:p-6">
              <div className="flex items-center gap-2"><ShieldCheck size={17} className="text-blue-300" /><h2 className="text-base font-semibold text-foreground">Support verification</h2></div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Share this Customer ID with support, then confirm your account email or the last four digits of your phone number before anyone accesses your workspace.</p>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-blue-500/20 bg-background/50 px-4 py-3">
                <span className="font-mono text-xl font-semibold tracking-[0.2em] text-blue-300">{customerId}</span>
                <Button size="icon" variant="ghost" aria-label="Copy Customer ID" onClick={copyCustomerId} disabled={customerId === "Assigning…"}><Copy size={16} /></Button>
              </div>
            </section>

            <section className="rounded-xl border border-white/8 bg-card p-5 sm:p-6 lg:col-span-2">
              <div className="flex items-center gap-2"><KeyRound size={17} className="text-blue-400" /><h2 className="text-base font-semibold text-foreground">Change password</h2></div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Confirm your current password before setting a new password of at least eight characters.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" value={passwords.current} disabled={supportView} onChange={event => setPasswords(value => ({ ...value, current: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" value={passwords.next} disabled={supportView} onChange={event => setPasswords(value => ({ ...value, next: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" value={passwords.confirm} disabled={supportView} onChange={event => setPasswords(value => ({ ...value, confirm: event.target.value }))} /></div>
              </div>
              {passwords.confirm && passwords.confirm !== passwords.next && <p className="mt-3 text-xs text-rose-300">New passwords do not match.</p>}
              <div className="mt-5 flex justify-end"><Button disabled={!passwordReady || supportView || changePassword.isPending} onClick={() => changePassword.mutate({ currentPassword: passwords.current, newPassword: passwords.next })}>{changePassword.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />} Update password</Button></div>
            </section>
          </div>
        </div>
      </main>
      <MobileNavigation />
    </div>
  );
}
