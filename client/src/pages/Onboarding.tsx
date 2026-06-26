import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { Zap, User, Building2, Phone, Globe, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Onboarding() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: user?.email ?? "",
    phone: "",
    website: "",
    businessName: "",
  });

  const saveProfile = trpc.user.saveProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile saved! Welcome to OneTouch Attribution Intelligence.");
      setLocation("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.businessName) {
      toast.error("Please fill in all required fields.");
      return;
    }
    saveProfile.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      website: form.website || undefined,
      businessName: form.businessName,
    });
  };

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
          <Button size="lg">Sign In to Continue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <Zap size={16} className="text-blue-400" />
        </div>
        <span className="font-bold text-base tracking-tight text-foreground">OneTouch Attribution Intelligence</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-card border border-white/10 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Account created</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Complete your profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tell us a bit about yourself and your agency so we can set up your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <User size={11} /> First Name <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="Jane"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-blue-500/50 text-foreground placeholder:text-muted-foreground/50"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <User size={11} /> Last Name <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Smith"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-blue-500/50 text-foreground placeholder:text-muted-foreground/50"
                required
              />
            </div>
          </div>

          {/* Business name */}
          <div className="space-y-1.5">
            <Label htmlFor="businessName" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 size={11} /> Agency / Business Name <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="businessName"
              placeholder="Smith Digital Marketing"
              value={form.businessName}
              onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
              className="bg-white/5 border-white/10 focus:border-blue-500/50 text-foreground placeholder:text-muted-foreground/50"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Mail size={11} /> Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@smithdigital.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="bg-white/5 border-white/10 focus:border-blue-500/50 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Phone size={11} /> Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="bg-white/5 border-white/10 focus:border-blue-500/50 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Globe size={11} /> Agency Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://smithdigital.com"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className="bg-white/5 border-white/10 focus:border-blue-500/50 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Required note */}
          <p className="text-[11px] text-muted-foreground/60">
            <span className="text-rose-400">*</span> Required fields
          </p>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full gap-2 mt-2"
            disabled={saveProfile.isPending}
            size="lg"
          >
            {saveProfile.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-xs text-muted-foreground/50">
        You can update this information anytime from your account settings.
      </p>
    </div>
  );
}
