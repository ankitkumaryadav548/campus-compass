"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/modules/admin/shared/StatCard";
import StatusBadge from "@/components/modules/admin/shared/StatusBadge";
import SampleBadge from "@/components/modules/admin/shared/SampleBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  Users,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load overview data", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const stats = data?.stats || {};
  const attention = data?.attention || {};

  return (
    <div className="space-y-8">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Campus Operations Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time status of international student guides, community events, and moderation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/admin/guides/new">
            <Button size="sm" variant="primary" leftIcon={Plus}>
              New Guide
            </Button>
          </Link>
          <Link href="/admin/events">
            <Button size="sm" variant="outline" leftIcon={Plus}>
              New Event
            </Button>
          </Link>
          <Link href="/admin/checklist">
            <Button size="sm" variant="outline" leftIcon={Plus}>
              Checklist Item
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={loading ? "..." : stats.totalStudents ?? 0}
          subtext="Enrolled & active accounts"
          icon={Users}
        />
        <StatCard
          title="Senior Buddies"
          value={loading ? "..." : stats.seniorBuddies ?? 0}
          subtext="Verified peer mentors"
          icon={GraduationCap}
        />
        <StatCard
          title="Published Guides"
          value={loading ? "..." : stats.publishedGuides ?? 0}
          subtext={`Across ${stats.categoriesCount ?? 7} categories`}
          icon={BookOpen}
        />
        <StatCard
          title="Open Reports"
          value={loading ? "..." : stats.openReports ?? 0}
          subtext={stats.openReports > 0 ? "Requires admin review" : "All clear"}
          icon={AlertTriangle}
          className={
            stats.openReports > 0
              ? "border-danger-300 dark:border-danger-800 bg-danger-50/20 dark:bg-danger-900/10"
              : ""
          }
        />
      </div>

      {/* Attention Required Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Reports Card */}
        <Card className="p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-danger-100 dark:bg-danger-900/40 text-danger-600">
                <AlertTriangle size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Safety Reports ({attention.openReportsCount ?? 0})
              </h2>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {attention.openReports?.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
              <CheckCircle2 size={24} className="text-success-500" />
              <span>No unresolved safety reports.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {attention.openReports?.map((r) => (
                <Link
                  key={r._id}
                  href="/admin/reports"
                  className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs transition-colors"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-danger-600 capitalize">
                      {r.reason?.replace("_", " ")}
                    </span>
                    <span className="text-slate-400 font-normal">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-1 mt-1">
                    {r.details || "No details provided"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Stale Guides Card */}
        <Card className="p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600">
                <Clock size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Stale Guides ({attention.staleGuides?.length ?? 0})
              </h2>
            </div>
            <Link
              href="/admin/guides"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              All guides <ArrowRight size={12} />
            </Link>
          </div>

          <p className="text-[11px] text-slate-400">
            Guides not verified in over 90 days. Campus rules or banking procedures may have changed.
          </p>

          {attention.staleGuides?.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
              <CheckCircle2 size={24} className="text-success-500" />
              <span>All guides have been verified recently.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {attention.staleGuides?.map((g) => (
                <Link
                  key={g._id}
                  href={`/admin/guides/${g._id}`}
                  className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs transition-colors"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span className="truncate">{g.title}</span>
                    <SampleBadge isSample={g.isSample} />
                  </div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    Last verified: {new Date(g.lastVerified).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Draft Guides Card */}
        <Card className="p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600">
                <BookOpen size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Draft Guides ({attention.draftGuides?.length ?? 0})
              </h2>
            </div>
            <Link
              href="/admin/guides?status=draft"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              Drafts <ArrowRight size={12} />
            </Link>
          </div>

          <p className="text-[11px] text-slate-400">
            Unpublished drafts hidden from student dashboards. Review and publish when ready.
          </p>

          {attention.draftGuides?.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
              <CheckCircle2 size={24} className="text-success-500" />
              <span>No pending drafts.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {attention.draftGuides?.map((g) => (
                <Link
                  key={g._id}
                  href={`/admin/guides/${g._id}`}
                  className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs transition-colors"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span className="truncate">{g.title}</span>
                    <StatusBadge status="draft" />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 capitalize">
                    Category: {g.category}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
