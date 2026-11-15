// app/(auth)/register/page.jsx
// Student Registration Page with password strength indicator, split-screen layout, and auto sign-in.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  Compass,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Globe2,
  BookOpen,
  HeartHandshake,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  // Password strength checks
  const hasLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password && confirmPassword ? password === confirmPassword : false;

  const getStrengthPercent = () => {
    let score = 0;
    if (hasLength) score += 40;
    if (hasLetter) score += 30;
    if (hasNumber) score += 30;
    return score;
  };

  const strengthPercent = getStrengthPercent();

  const validate = () => {
    const errs = {};
    if (!name.trim() || name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters long.";
    } else if (name.trim().length > 60) {
      errs.name = "Name must not exceed 60 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!hasLength || !hasLetter || !hasNumber) {
      errs.password = "Password must be at least 8 characters with at least one letter and one number.";
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          message: data.error || "Registration failed. Please try again.",
          type: "error",
        });
        setErrors((prev) => ({
          ...prev,
          general: data.error || "Registration failed. Please try again.",
        }));
        setLoading(false);
        return;
      }

      toast({
        message: "Account created! Signing you in...",
        type: "success",
      });

      // Auto sign-in and redirect to onboarding
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInRes?.ok) {
        router.refresh();
        router.push("/onboarding");
      } else {
        // Fallback to manual login if auto-login fails
        router.push("/login?registered=true");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast({
        message: "Network error occurred. Please try again.",
        type: "error",
      });
      setErrors((prev) => ({
        ...prev,
        general: "Network error occurred. Please try again.",
      }));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      {/* ── Left Branding Panel (Desktop Only) ────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary p-12 text-white flex-col justify-between relative overflow-hidden">
        <div aria-hidden="true" className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-extrabold text-white mb-2">
            <Compass size={32} className="text-white" />
            <span>Campus Compass</span>
          </Link>
          <p className="text-indigo-100 text-sm max-w-sm mt-1">
            Personalized, country-aware support for international students.
          </p>
        </div>

        <div className="relative z-10 my-auto py-12 max-w-md">
          <Badge variant="neutral" className="bg-white/20 text-white border-white/30 mb-6">
            🚀 Join Campus Compass
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white leading-tight">
            Start your journey with confidence.
          </h1>
          <p className="text-indigo-100 mb-8">
            Create your account in seconds. After registration, a brief 5-step onboarding will customize your entire campus experience.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/10 shrink-0">
                <Globe2 size={18} className="text-teal-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Any Country, Any Background</h2>
                <p className="text-xs text-indigo-100">Smart tags adapt content specifically for your region.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/10 shrink-0">
                <BookOpen size={18} className="text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Actionable Checklists</h2>
                <p className="text-xs text-indigo-100">Never miss vital deadlines like FRRO, SIM KYC, and banking.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/10 shrink-0">
                <HeartHandshake size={18} className="text-indigo-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Welcoming Community</h2>
                <p className="text-xs text-indigo-100">Meet peers and seniors who share your language and food culture.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-200">
          Free and open to all international students · Privacy first.
        </div>
      </div>

      {/* ── Right Form Column ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400">
              <Compass size={28} />
              <span>Campus Compass</span>
            </Link>
            <p className="text-xs text-slate-500 mt-1">International Student Support Platform</p>
          </div>

          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create an account</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your details to get your personalized campus plan.
              </p>
            </div>

            {errors.general && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 text-sm"
              >
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="register-name"
                type="text"
                label="Full name"
                placeholder="e.g. Moses Kato"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                leftIcon={UserIcon}
                error={errors.name}
                required
                autoComplete="name"
              />

              <Input
                id="register-email"
                type="email"
                label="Email address"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                leftIcon={Mail}
                error={errors.email}
                required
                autoComplete="email"
              />

              <div>
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  leftIcon={Lock}
                  error={errors.password}
                  required
                  autoComplete="new-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />

                {/* Password strength indicators */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strengthPercent === 100
                            ? "bg-success-500"
                            : strengthPercent >= 60
                            ? "bg-amber-500"
                            : "bg-danger-500"
                        }`}
                        style={{ width: `${strengthPercent}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className={`inline-flex items-center gap-1 ${hasLength ? "text-success-600 dark:text-success-400" : ""}`}>
                        {hasLength ? <Check size={12} /> : <X size={12} />} 8+ chars
                      </span>
                      <span className={`inline-flex items-center gap-1 ${hasLetter ? "text-success-600 dark:text-success-400" : ""}`}>
                        {hasLetter ? <Check size={12} /> : <X size={12} />} 1+ letter
                      </span>
                      <span className={`inline-flex items-center gap-1 ${hasNumber ? "text-success-600 dark:text-success-400" : ""}`}>
                        {hasNumber ? <Check size={12} /> : <X size={12} />} 1+ number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                }}
                leftIcon={Lock}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-3"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-block min-h-[44px] leading-[44px]"
                >
                  Log in
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
