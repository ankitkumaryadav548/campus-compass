// app/(auth)/login/page.jsx
// User Login Page with split-screen layout, show/hide password, and dev-only demo accounts box.

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  Compass,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

// Demo accounts for local development testing
const DEMO_ACCOUNTS = [
  { label: "Moses (Uganda)", email: "moses.kato@sample.test", role: "student" },
  { label: "Linh (Vietnam)", email: "linh.pham@sample.test", role: "student" },
  { label: "Amina (Nigeria)", email: "amina.yusuf@sample.test", role: "student" },
  { label: "Admin", email: "admin@sample.test", role: "admin" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { data: session, status } = useSession();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDemoBox, setShowDemoBox] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        const errorText =
          res.error === "CredentialsSignin"
            ? "Invalid email or password. Please check your credentials."
            : res.error;

        setErrorMessage(errorText);
        toast({
          message: errorText,
          type: "error",
        });
      } else if (res?.ok) {
        toast({
          message: "Welcome back!",
          type: "success",
        });
        router.refresh();
        router.push(callbackUrl);
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast({
        message: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("Sample@123");
    setErrorMessage("");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      {/* ── Left Branding Panel (Desktop Only) ────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Decorative background blobs */}
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
            ✨ Welcome Back
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white leading-tight">
            Your home away from home starts here.
          </h1>
          <p className="text-indigo-100 mb-8">
            Log in to access your country-specific checklist, trusted SIM and banking guides, food places, and senior buddy network.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/10 shrink-0">
                <CheckCircle2 size={18} className="text-teal-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Country-Specific Guidance</h2>
                <p className="text-xs text-indigo-100">Step-by-step documentation tailored to your nationality.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/10 shrink-0">
                <Users size={18} className="text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Senior Buddy Matches</h2>
                <p className="text-xs text-indigo-100">Connect with experienced seniors who understand your transition.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/10 shrink-0">
                <ShieldCheck size={18} className="text-indigo-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Verified Campus Resources</h2>
                <p className="text-xs text-indigo-100">Reliable food spots, banks, and official campus channels.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-200">
          © {new Date().getFullYear()} Campus Compass · All rights reserved.
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in to your account</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your email and password to access your dashboard.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 text-sm"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="login-email"
                type="email"
                label="Email address"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={Mail}
                required
                autoComplete="email"
              />

              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={Lock}
                required
                autoComplete="current-password"
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don&apos;t have an account yet?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-block min-h-[44px] leading-[44px]"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </Card>

          {/* ── Dev-only Demo Accounts Box ───────────────────────────── */}
          {process.env.NODE_ENV !== "production" && (
            <div className="mt-6 border border-amber-300 dark:border-amber-700/60 rounded-2xl bg-amber-50 dark:bg-amber-950/30 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowDemoBox((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  Developer Demo Accounts (Sample Seed)
                </span>
                {showDemoBox ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showDemoBox && (
                <div className="p-4 pt-1 border-t border-amber-200 dark:border-amber-800/50 space-y-2">
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Click an account to autofill (password: <code className="font-mono bg-amber-200/60 dark:bg-amber-900 px-1 rounded">Sample@123</code>):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => fillDemoAccount(acc.email)}
                        className="text-left p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 hover:border-primary-500 transition-all text-xs"
                      >
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{acc.label}</p>
                        <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
