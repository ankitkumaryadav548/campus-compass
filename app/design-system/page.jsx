// app/design-system/page.jsx
// DEV-ONLY: Design system showcase – displays every UI component in all states.
// Remove or protect this route before production.

"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import Skeleton, { CardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import StepCard from "@/components/ui/StepCard";
import { Mail, Search, Settings, Trash2, ArrowRight, Compass } from "lucide-react";

function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h2>
      <div className="h-px bg-slate-200 dark:bg-slate-700 mb-6" />
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [steps, setSteps] = useState([false, false, true]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-10">
        <Badge variant="warning" dot className="mb-3">DEV ONLY</Badge>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
          🎨 Design System Showcase
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          All UI components in every variant and state. For development review only.
        </p>
      </div>

      {/* ── BUTTONS ────────────────────────────────────────────── */}
      <Section title="Button">
        <div className="space-y-4">
          {/* Variants */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Variants</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sizes</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
          </div>

          {/* Icons */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">With Icons</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" leftIcon={Mail}>Left icon</Button>
              <Button variant="secondary" rightIcon={ArrowRight}>Right icon</Button>
              <Button variant="ghost" leftIcon={Settings} rightIcon={ArrowRight}>Both icons</Button>
            </div>
          </div>

          {/* States */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">States</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="danger" leftIcon={Trash2}>Delete</Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── CARDS ──────────────────────────────────────────────── */}
      <Section title="Card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Basic Card</h3>
            <p className="text-sm text-slate-500">Default card with shadow and border.</p>
          </Card>
          <Card hover>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Hover Card</h3>
            <p className="text-sm text-slate-500">Lifts on hover. Try hovering!</p>
          </Card>
          <Card gradientBorder icon={Compass} iconColor="text-primary-600">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Gradient + Icon</h3>
            <p className="text-sm text-slate-500">Top border gradient and icon badge.</p>
          </Card>
        </div>
      </Section>

      {/* ── INPUTS ─────────────────────────────────────────────── */}
      <Section title="Input & Select">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <Input label="Email address" placeholder="you@example.com" leftIcon={Mail} helper="We'll never share your email." />
          <Input label="Search" placeholder="Search..." leftIcon={Search} />
          <Input label="With error" placeholder="Enter value" error="This field is required." />
          <Select
            label="Country"
            placeholder="Select your country"
            options={[
              { value: "Uganda",  label: "🇺🇬 Uganda"  },
              { value: "Vietnam", label: "🇻🇳 Vietnam" },
              { value: "Nigeria", label: "🇳🇬 Nigeria" },
            ]}
            helper="Your country personalizes your content."
          />
        </div>
      </Section>

      {/* ── BADGES ─────────────────────────────────────────────── */}
      <Section title="Badge">
        <div className="flex flex-wrap gap-3">
          <Badge variant="info">Info</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="info" dot>Info with dot</Badge>
          <Badge variant="success" dot>Active</Badge>
          <Badge variant="warning" dot>Pending</Badge>
          <Badge variant="danger" dot>Error</Badge>
        </div>
      </Section>

      {/* ── PROGRESS BARS ─────────────────────────────────────── */}
      <Section title="ProgressBar">
        <div className="space-y-5 max-w-md">
          <ProgressBar value={75}  color="primary" label="Profile completion" />
          <ProgressBar value={40}  color="success" label="Checklist progress" size="lg" />
          <ProgressBar value={60}  color="warning" label="Days remaining" size="sm" />
          <ProgressBar value={15}  color="danger"  label="Urgency" />
          <ProgressBar value={100} color="success" label="SIM guide" />
        </div>
      </Section>

      {/* ── MODAL ─────────────────────────────────────────────── */}
      <Section title="Modal">
        <Button variant="primary" onClick={() => setModalOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Sample Modal"
          size="md"
        >
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            This is an accessible modal with ESC-to-close, backdrop blur, and smooth animation.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm</Button>
          </div>
        </Modal>
      </Section>

      {/* ── TOAST ─────────────────────────────────────────────── */}
      <Section title="Toast">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary"   onClick={() => toast({ message: "✅ Profile saved successfully!", type: "success" })}>Success Toast</Button>
          <Button variant="danger"    onClick={() => toast({ message: "❌ Failed to load data. Please retry.", type: "error" })}>Error Toast</Button>
          <Button variant="secondary" onClick={() => toast({ message: "ℹ️ Your checklist has been updated.", type: "info" })}>Info Toast</Button>
        </div>
      </Section>

      {/* ── SKELETON ──────────────────────────────────────────── */}
      <Section title="Skeleton">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={4} />
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </Section>

      {/* ── EMPTY STATE ───────────────────────────────────────── */}
      <Section title="EmptyState">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <EmptyState
              title="No buddies yet"
              description="We're finding the best match from your country. Check back soon!"
              actionLabel="Browse community"
              onAction={() => toast({ message: "Navigating...", type: "info" })}
            />
          </Card>
          <Card>
            <EmptyState
              title="No places found"
              description="No restaurants match your current filters. Try adjusting them."
            />
          </Card>
        </div>
      </Section>

      {/* ── STEP CARD ─────────────────────────────────────────── */}
      <Section title="StepCard">
        <div className="space-y-3 max-w-lg">
          {["Visit a Jio or Airtel store", "Show your passport & student ID", "Choose a prepaid plan"].map((title, i) => (
            <StepCard
              key={i}
              stepNumber={i + 1}
              title={title}
              description={i === 0 ? "Bring original documents + 1 photocopy." : undefined}
              done={steps[i]}
              onToggle={() => setSteps((prev) => prev.map((v, j) => j === i ? !v : v))}
            />
          ))}
        </div>
      </Section>

    </div>
  );
}

