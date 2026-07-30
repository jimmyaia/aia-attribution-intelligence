import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Register() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    website: "",
    agencyName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const register = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Account created! Redirecting to payment...");
      // Redirect to pricing/checkout after registration
      navigate("/pricing?registered=true");
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    register.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.phone.trim() || undefined,
      website: form.website.trim() || undefined,
      agencyName: form.agencyName.trim() || undefined,
    });
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Zap size={16} className="text-blue-400" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">AIA Attribution Intelligence</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Start your $49/month subscription after registration</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium text-muted-foreground">First Name <span className="text-rose-400">*</span></Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={set("firstName")}
                  placeholder="Jane"
                  className={errors.firstName ? "border-rose-500" : ""}
                />
                {errors.firstName && <p className="text-xs text-rose-400">{errors.firstName}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium text-muted-foreground">Last Name <span className="text-rose-400">*</span></Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={set("lastName")}
                  placeholder="Smith"
                  className={errors.lastName ? "border-rose-500" : ""}
                />
                {errors.lastName && <p className="text-xs text-rose-400">{errors.lastName}</p>}
              </div>
            </div>

            {/* Agency Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agencyName" className="text-xs font-medium text-muted-foreground">Agency / Business Name</Label>
              <Input
                id="agencyName"
                value={form.agencyName}
                onChange={set("agencyName")}
                placeholder="Smith Digital Marketing"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email Address <span className="text-rose-400">*</span></Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="jane@smithagency.com"
                className={errors.email ? "border-rose-500" : ""}
              />
              {errors.email && <p className="text-xs text-rose-400">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Website */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="website" className="text-xs font-medium text-muted-foreground">Agency Website</Label>
              <Input
                id="website"
                type="url"
                value={form.website}
                onChange={set("website")}
                placeholder="https://smithagency.com"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password <span className="text-rose-400">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min. 8 characters"
                  className={`pr-10 ${errors.password ? "border-rose-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground">Confirm Password <span className="text-rose-400">*</span></Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                placeholder="Re-enter your password"
                className={errors.confirmPassword ? "border-rose-500" : ""}
              />
              {errors.confirmPassword && <p className="text-xs text-rose-400">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold h-11"
              disabled={register.isPending}
            >
              {register.isPending ? (
                <><Loader2 size={16} className="animate-spin mr-2" /> Creating account...</>
              ) : (
                "Create Account & Continue to Payment"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-4">
          $49/month · Cancel anytime · No setup fees
        </p>
      </div>
    </div>
  );
}
