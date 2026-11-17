import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { User, Edit3, Globe, School, Utensils, Languages } from "lucide-react";

export default function ProfileCard({ user }) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Profile Summary
            </h2>
            <p className="text-xs text-slate-500">Your registered settings</p>
          </div>
        </div>

        <Link
          href="/onboarding"
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 min-h-[36px]"
        >
          <Edit3 size={13} /> Edit
        </Link>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Globe size={13} className="text-slate-400" /> Country
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {user.country || "Not set"}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-500 flex items-center gap-1.5">
            <School size={13} className="text-slate-400" /> University
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
            {user.university || "Not set"}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Utensils size={13} className="text-slate-400" /> Diet
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
            {user.diet || "No preference"}
          </span>
        </div>

        <div className="flex items-start justify-between py-1.5">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Languages size={13} className="text-slate-400" /> Languages
          </span>
          <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
            {user.languages?.map((lang) => (
              <Badge key={lang} variant="neutral" className="text-[10px]">
                {lang}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

