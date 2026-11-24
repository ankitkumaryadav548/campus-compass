// app/(auth)/login/page.jsx
// User Login Page with Student vs Admin console login tabs, show/hide password, and demo accounts box.

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
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
  GraduationCap,
  ShieldAlert,
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
  { label: "Admin Staff", email: "admin@sample.test", role: "admin" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { data: session, status } = useSession();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(
    initialRoleParam === "admin" ? "admin" : "student"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDemoBox, setShowDemoBox] = useState(false);

  // Sync role param if URL changes
  useEffect(() => {
    if (initialRoleParam === "admin") {
      setActiveTab("admin");
    }
  }, [initialRoleParam]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace(callbackUrl.startsWith("/admin") ? "/dashboard" : callbackUrl);
      }
    }
  }, [status, session, router, callbackUrl]);

  // Check URL error parameter (e.g. redirected by middleware when inactive)
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "inactive" || err === "AccountInactive") {
      setErrorMessage("This account is inactive. Please contact the university's international office.");
    }
  }, [searchParams]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setErrorMessage("");
    setEmail("");
    setPassword("");
  };

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
        let errorText;
        if (res.error === "AccountInactive" || res.error?.includes("AccountInactive")) {
          errorText = "This account is inactive. Please contact the university's international office.";
        } else if (res.error === "CredentialsSignin") {
          errorText = "Invalid email or password. Please check your credentials.";
        } else {
          errorText = res.error;
        }

        setErrorMessage(errorText);
        toast({
          message: errorText,
          type: "error",
        });
        setLoading(false);
        return;
      }

      if (res?.ok) {
        // Inspect session role after successful authentication
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const userRole = sessionData?.user?.role;

        // If user logged in through Admin tab but is not an admin:
        if (activeTab === "admin" && userRole !== "admin") {
          await signOut({ redirect: false });
          const deniedMsg = "Access Denied: This account is not an authorized administrator. Please switch to Student Login.";
          setErrorMessage(deniedMsg);
          toast({
            message: "Admin privileges required.",
            type: "error",
          });
          setLoading(false);
          return;
        }

        // If user logged in through Student tab but is an admin:
        if (activeTab === "student" && userRole === "admin") {
          await signOut({ redirect: false });
          const deniedMsg = "This is an administrator account. Please switch to Admin Login to access the admin panel.";
          setErrorMessage(deniedMsg);
          toast({
            message: "Administrator account. Please use Admin Login.",
            type: "error",
          });
          setLoading(false);
          return;
        }

        toast({
          message: activeTab === "admin" ? "Welcome to Admin Console" : "Welcome back!",
          type: "success",
        });

        router.refresh();
        if (activeTab === "admin") {
          router.push("/admin");
        } else {
          router.push(callbackUrl.startsWith("/admin") ? "/dashboard" : callbackUrl);
        }
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast({
        message: "An unexpected error occurred. Please try again.",
        type: "error",
      });
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("Sample@123");
    setErrorMessage("");
  };

  const filteredDemoAccounts = DEMO_ACCOUNTS.filter((acc) =>
    activeTab === "admin" ? acc.role === "admin" : acc.role !== "admin"
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      {/* ── Left Branding Panel (Desktop Only) ────────────────────────── */}
      <div className={`hidden lg:flex lg:w-1/2 p-12 text-white flex-col justify-between relative overflow-hidden transition-colors duration-300 ${
        activeTab === "admin"
          ? "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-r border-slate-800"
          : "bg-gradient-primary"
      }`}>
        {/* Decorative background blobs */}
        <div aria-hidden="true" className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-extrabold text-white mb-2">
            <Compass size={32} className="text-white" />
            <span>Campus Compass</span>
          </Link>
          <p className="text-indigo-100 text-sm max-w-sm mt-1">
            {activeTab === "admin"
              ? "University Administrator Operations & Moderation Console"
              : "Personalized, country-aware support for international students."}
          </p>
        </div>

        <div className="relative z-10 my-auto py-12 max-w-md">
          <Badge variant="neutral" className="bg-white/20 text-white border-white/30 mb-6">
            {activeTab === "admin" ? "🛡️ University Admin Portal" : "✨ Welcome Back"}
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white leading-tight">
            {activeTab === "admin"
              ? "Manage campus operations with authoritative control."
              : "Your home away from home starts here."}
          </h1>
          <p className="text-indigo-100 mb-8">
            {activeTab === "admin"
              ? "Publish country-tailored guides, curate arrival checklists, verify campus food dietary labels, review safety reports, and manage peer buddy recognitions."
              : "Log in to access your country-specific checklist, trusted SIM and banking guides, food places, and senior buddy network."}
          </p>

          <div className="space-y-4">
            {activeTab === "admin" ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 shrink-0">
                    <ShieldCheck size={18} className="text-teal-300" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Verified Guide Publishing</h2>
                    <p className="text-xs text-indigo-100">Draft, verify, and target guides by nationality and visa type.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 shrink-0">
                    <ShieldAlert size={18} className="text-amber-300" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Safety & Conduct Moderation</h2>
                    <p className="text-xs text-indigo-100">Handle student reports and protect community standards.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 shrink-0">
                    <Users size={18} className="text-indigo-300" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Immutable Audit Logging</h2>
                    <p className="text-xs text-indigo-100">Full accountability and tamper-proof operational records.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-200">
          © {new Date().getFullYear()} Campus Compass · All rights reserved.
        </div>
      </div>

      {/* ── Right Form Column ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile brand header */}
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400">
              <Compass size={28} />
              <span>Campus Compass</span>
            </Link>
            <p className="text-xs text-slate-500 mt-1">International Student Support Platform</p>
          </div>

          <Card className={`shadow-lg border ${
            activeTab === "admin"
              ? "border-indigo-200 dark:border-indigo-900/60"
              : "border-slate-200 dark:border-slate-800"
          }`}>
            {/* ── Segmented Role Switcher Tabs (Inside Card, Upper of Email & Password) ── */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center border border-slate-200 dark:border-slate-700 shadow-inner mb-6">
              <button
                type="button"
                onClick={() => handleTabSwitch("student")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "student"
                    ? "bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <GraduationCap size={16} />
                <span>Student Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "admin"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <ShieldCheck size={16} />
                <span>Admin Login</span>
              </button>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 text-sm flex items-start gap-2.5"
              >
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="login-email"
                type="email"
                label={activeTab === "admin" ? "Admin Email Address" : "Student Email Address"}
                placeholder={activeTab === "admin" ? "admin@campus.edu" : "name@example.com"}
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
                variant={activeTab === "admin" ? "primary" : "primary"}
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                {activeTab === "admin" ? "Sign In to Admin Console" : "Sign In to Student Account"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              {activeTab === "admin" ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Administrator accounts are provisioned exclusively by campus IT and the international office.
                </p>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Don&apos;t have an account yet?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-block min-h-[44px] leading-[44px]"
                  >
                    Create an account
                  </Link>
                </p>
              )}
            </div>
          </Card>

          {/* ── Dev-only Demo Accounts Box ───────────────────────────── */}
          {process.env.NODE_ENV !== "production" && (
            <div className="border border-amber-300 dark:border-amber-700/60 rounded-2xl bg-amber-50 dark:bg-amber-950/30 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowDemoBox((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  {activeTab === "admin" ? "Demo Admin Account (Sample Seed)" : "Developer Demo Accounts (Sample Seed)"}
                </span>
                {showDemoBox ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showDemoBox && (
                <div className="p-4 pt-1 border-t border-amber-200 dark:border-amber-800/50 space-y-2">
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Click to autofill (password: <code className="font-mono bg-amber-200/60 dark:bg-amber-900 px-1 rounded">Sample@123</code>):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredDemoAccounts.map((acc) => (
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
