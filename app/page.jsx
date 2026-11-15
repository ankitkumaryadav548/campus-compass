// app/page.jsx
// Campus Compass – Landing Page
// Sections: Hero, Problems, Features, Personalization, How It Works, CTA, Footer
// Uses framer-motion for gentle scroll animations.
// IMPORTANT: country example content below is SAMPLE data only.

"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
} from "framer-motion";
import {
  CheckSquare,
  Smartphone,
  Utensils,
  Users,
  Languages,
  MessageSquare,
  Globe,
  FileText,
  CreditCard,
  UserX,
  ArrowRight,
  Star,
  MapPin,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

// ── Animation helpers ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay } },
});

/** Wraps children in a fade-up animation triggered when in view */
function FadeIn({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger(delay)}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Section data ───────────────────────────────────────────────────────────

const PROBLEMS = [
  { icon: Languages,  label: "Language Gap",        desc: "Campus jargon and local language confusion" },
  { icon: Utensils,   label: "Unfamiliar Food",      desc: "Hard to find cuisine from your home region" },
  { icon: FileText,   label: "Documentation Maze",   desc: "FRRO, enrollment, student ID – where to start?" },
  { icon: CreditCard, label: "Banking & SIM",         desc: "No Indian credit history, confusing provider options" },
  { icon: UserX,      label: "Social Isolation",     desc: "Hard to find friends who understand your culture" },
];

const FEATURES = [
  { icon: CheckSquare,   label: "Arrival Checklist",   desc: "Track all your documentation tasks with deadlines and progress.",        color: "text-primary-600" },
  { icon: Smartphone,    label: "SIM & Bank Guides",   desc: "Step-by-step, provider list, required docs – personalized by country.", color: "text-violet-600"  },
  { icon: Utensils,      label: "Food Finder",         desc: "Map and filter restaurants by cuisine, diet, and country tags.",         color: "text-success-600" },
  { icon: Users,         label: "Buddy Matching",      desc: "Connect with seniors from your country or region – they've been there.", color: "text-warning-600" },
  { icon: Languages,     label: "Language Help",       desc: "Common phrases, campus glossary, and local survival vocabulary.",        color: "text-primary-600" },
  { icon: MessageSquare, label: "AI Chatbot",          desc: "Ask anything – answers pull from your profile and matching guides.",     color: "text-violet-600"  },
];

// SAMPLE personalization showcase – clearly marked
const SAMPLE_PROFILES = [
  {
    flag: "🇺🇬",
    country: "Uganda",
    regionGroup: "East Africa",
    color: "from-yellow-400 to-orange-500",
    sim: "Jio – recommended by East African students (easy KYC)",
    food: "African Spices Kitchen, Kampala Bites – Matooke & Rolex",
    buddy: "David (Uganda, 3rd year BTech) – matched by country",
  },
  {
    flag: "🇻🇳",
    country: "Vietnam",
    regionGroup: "Southeast Asia",
    color: "from-red-400 to-pink-500",
    sim: "Airtel – popular among Vietnamese students",
    food: "Pho Garden, Viet House – Pho & Bánh mì nearby",
    buddy: "Linh (Vietnam, 2nd year MCA) – same country match",
  },
  {
    flag: "🇳🇬",
    country: "Nigeria",
    regionGroup: "West Africa",
    color: "from-green-400 to-emerald-500",
    sim: "BSNL + Jio – recommended for Nigerian passports",
    food: "Afro Spice, West African Kitchen – Jollof & Egusi",
    buddy: "Chidi (Nigeria, Final year MBA) – matched by country",
  },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Sign up",                  desc: "Create your free account in under a minute." },
  { step: 2, title: "Tell us about you",         desc: "Country, university, diet, languages – quick 5-step form." },
  { step: 3, title: "Get your personal plan",    desc: "Checklist, guides and food places — all tailored to you." },
  { step: 4, title: "Meet your buddy",           desc: "Get matched with a senior from your country or region." },
];

// ── Page ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="overflow-hidden">

      {/* ── 1. HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-hero dark:bg-gradient-hero-dark overflow-hidden">
        {/* Decorative blobs */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="blob w-96 h-96 bg-indigo-300 dark:bg-indigo-700 top-10 -left-20" />
          <div className="blob w-80 h-80 bg-violet-300 dark:bg-violet-800 top-40 right-10 animation-delay-2000" style={{ animationDelay: "2s" }} />
          <div className="blob w-72 h-72 bg-teal-200 dark:bg-teal-900 bottom-10 left-1/3 animation-delay-4000" style={{ animationDelay: "4s" }} />
        </div>

        <div className="section-container relative z-10 py-24 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: headline + CTAs */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="info" dot className="mb-6">
                🌍 For international students in India
              </Badge>

              <h1 className="text-5xl sm:text-6xl lg:text-display-lg font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
                Your new campus,{" "}
                <span className="text-gradient">made familiar</span>
              </h1>

              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-lg">
                Campus Compass gives you personalized guides, food recommendations, 
                documentation help and a buddy — all tailored to <strong>your home country</strong>.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  as={Link}
                  href="/register"
                  variant="primary"
                  size="lg"
                  rightIcon={ArrowRight}
                >
                  Get Started Free
                </Button>
                <Button
                  as="a"
                  href="#how-it-works"
                  variant="secondary"
                  size="lg"
                >
                  See How It Works
                </Button>
              </div>

              <p className="mt-4 text-xs text-slate-400">No credit card required · 100% free for students</p>
            </motion.div>
          </div>

          {/* Right: floating mock profile card */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex justify-center"
            aria-label="Sample student profile card – demo only"
          >
            <div className="relative">
              {/* Main card */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 w-80">
                {/* Header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl shadow-md">
                    🇺🇬
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Moses K.</p>
                    <p className="text-xs text-slate-500">BTech · Uganda · Arrived 3 days ago</p>
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Your personalised plan</p>

                {/* Task chips */}
                {[
                  { emoji: "📱", label: "Get a SIM card",   status: "pending" },
                  { emoji: "🏦", label: "Open bank account",status: "pending" },
                  { emoji: "🍲", label: "African grocery nearby", status: "done" },
                  { emoji: "👥", label: "David – Uganda buddy", status: "matched" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0"
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                    <Badge
                      variant={item.status === "done" ? "success" : item.status === "matched" ? "info" : "warning"}
                      dot
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Floating chips */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -top-5 -right-6 bg-white dark:bg-slate-800 shadow-lg rounded-2xl px-3 py-2 text-xs font-medium text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800"
              >
                <Sparkles size={12} className="inline mr-1 text-amber-400" aria-hidden="true" />
                AI-powered
              </motion.div>

              <motion.div
                animate={{ y: [4, -4, 4] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-6 bg-white dark:bg-slate-800 shadow-lg rounded-2xl px-3 py-2 text-xs font-medium text-success-700 dark:text-success-300 border border-success-100 dark:border-success-800"
              >
                <MapPin size={12} className="inline mr-1 text-success-500" aria-hidden="true" />
                3 halal spots near you
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. PROBLEMS STRIP ─────────────────────────────────────── */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
        <div className="section-container">
          <FadeIn className="text-center mb-10">
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">
              The challenges are real
            </p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              International students face these every day
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PROBLEMS.map((p, i) => (
              <FadeIn key={p.label} delay={i * 0.08}>
                <Card hover className="text-center h-full">
                  <div className="mx-auto mb-3 w-10 h-10 rounded-xl bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center text-danger-500">
                    <p.icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">{p.label}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{p.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES ───────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-gradient-hero dark:bg-slate-950">
        <div className="section-container">
          <FadeIn className="text-center mb-12">
            <Badge variant="info" className="mb-4">Everything in one place</Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Built for <span className="text-gradient">every international student</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              From day one to graduation — Campus Compass has you covered.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.label} delay={i * 0.07}>
                <Card
                  hover
                  gradientBorder
                  icon={f.icon}
                  iconColor={f.color}
                  className="h-full"
                >
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">{f.label}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PERSONALIZATION SHOWCASE ───────────────────────────── */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="section-container">
          <FadeIn className="text-center mb-12">
            <Badge variant="success" className="mb-4">Country-aware content</Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              The <span className="text-gradient">same app</span>, tailored for you
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Your home country shapes what you see — from buddy matches to food spots to SIM card advice.
            </p>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ All content below is SAMPLE data for demonstration only.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SAMPLE_PROFILES.map((profile, i) => (
              <FadeIn key={profile.country} delay={i * 0.1}>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-r ${profile.color} p-5`}>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{profile.flag}</span>
                      <div>
                        <p className="font-bold text-white text-lg">{profile.country}</p>
                        <p className="text-white/80 text-xs">{profile.regionGroup}</p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">📱 SIM Recommendation</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{profile.sim}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">🍽️ Food Near You</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{profile.food}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">👥 Your Buddy</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{profile.buddy}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-gradient-hero dark:bg-slate-950">
        <div className="section-container">
          <FadeIn className="text-center mb-14">
            <Badge variant="info" className="mb-4">Simple process</Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Up and running in <span className="text-gradient">4 steps</span>
            </h2>
          </FadeIn>

          {/* Steps with connecting line on desktop */}
          <div className="relative">
            {/* Connecting line */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-9 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-teal-200 dark:from-indigo-900 dark:via-violet-900 dark:to-teal-900"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {HOW_IT_WORKS.map((step, i) => (
                <FadeIn key={step.step} delay={i * 0.1}>
                  <div className="flex flex-col items-center text-center">
                    {/* Circle number */}
                    <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-glow mb-5">
                      {step.step}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FINAL CTA BANNER ───────────────────────────────────── */}
      <section className="py-20">
        <div className="section-container">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 md:p-16 text-center shadow-2xl">
              {/* Background pattern */}
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-white" />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-white" />
              </div>

              <div className="relative z-10">
                <span className="text-5xl mb-4 block" aria-hidden="true">🌏</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                  Ready to feel at home — anywhere?
                </h2>
                <p className="text-indigo-200 mb-8 max-w-lg mx-auto">
                  Join Campus Compass and get personalized support from day one of your international student journey.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    as={Link}
                    href="/register"
                    variant="ghost"
                    size="lg"
                    className="bg-white text-primary-700 hover:bg-indigo-50 border-0 shadow-lg"
                    rightIcon={ArrowRight}
                  >
                    Create Free Account
                  </Button>
                  <Button
                    as={Link}
                    href="/login"
                    variant="ghost"
                    size="lg"
                    className="border-2 border-white/40 text-white hover:bg-white/10"
                  >
                    Log In
                  </Button>
                </div>
                <p className="mt-4 text-xs text-indigo-300 flex items-center justify-center gap-1">
                  <Star size={12} aria-hidden="true" /> Free for all international students
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}

