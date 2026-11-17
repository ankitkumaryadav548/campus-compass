import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { BookOpen, Smartphone, Landmark, Info, ArrowRight } from "lucide-react";
import { calculateProgress } from "@/lib/dashboard";

export default function GuideCards({ simGuide, bankGuide, country, showGenericBanner, bannerText }) {
  const guides = [
    { guide: simGuide, category: "sim", icon: Smartphone, label: "SIM & Mobile Connectivity", href: "/guides/sim" },
    { guide: bankGuide, category: "bank", icon: Landmark, label: "Bank Account & Payments", href: "/guides/bank" }
  ].filter((item) => item.guide);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <BookOpen size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Your guides
            </h2>
            <p className="text-xs text-slate-500">
              Country-specific steps for essential accounts and setup
            </p>
          </div>
        </div>
      </div>

      {showGenericBanner && (
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-primary-50/70 dark:bg-primary-950/30 border border-primary-200/80 dark:border-primary-800 text-primary-900 dark:text-primary-200 text-xs">
          <Info size={16} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{bannerText}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {guides.map(({ guide, icon: IconComponent, label, href }) => {
          const totalSteps = guide.steps?.length || 0;
          const completedCount = guide.completedSteps?.length || 0;
          const progressPercent = calculateProgress(completedCount, totalSteps);
          const isCountrySpecific = country && guide.region?.includes(country);

          return (
            <Card key={guide._id.toString()} className="flex flex-col justify-between p-5 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                      <IconComponent size={16} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {label}
                    </span>
                  </div>

                  <Badge variant={isCountrySpecific ? "success" : "neutral"} className="text-[10px] shrink-0">
                    {isCountrySpecific ? `For ${country} students` : "General guide"}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {guide.title.replace("[SAMPLE] ", "")}
                </h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {completedCount} of {totalSteps} steps
                    </span>
                  </div>
                  <ProgressBar value={progressPercent} color="primary" size="sm" showLabel={false} />
                </div>

                <Button
                  as={Link}
                  href={href}
                  variant="secondary"
                  size="sm"
                  rightIcon={<ArrowRight size={14} />}
                  className="w-full justify-center text-xs"
                >
                  Open Guide
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

